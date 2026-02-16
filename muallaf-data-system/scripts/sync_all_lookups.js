const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const syncAllLookups = async () => {
    console.log('🔍 Comprehensive check-up for all lookup tables...');

    const { data: submissions, error: subError } = await supabase
        .from('submissions')
        .select('negeriCawangan, lokasi, bangsa, agamaAsal')
        .eq('status', 'active');

    if (subError) {
        console.error('❌ Error fetching submissions:', subError.message);
        return;
    }

    const uniqueStates = new Set();
    const uniqueLocations = new Set(); // Store as "loc|state"
    const uniqueRaces = new Set();
    const uniqueReligions = new Set();
    const uniqueBanks = new Set();

    submissions.forEach(s => {
        if (s.negeriCawangan) uniqueStates.add(s.negeriCawangan.trim());
        if (s.lokasi) uniqueLocations.add(`${s.lokasi.trim()}|${(s.negeriCawangan || 'Tanpa Negeri').trim()}`);
        if (s.bangsa) uniqueRaces.add(s.bangsa.trim());
        if (s.agamaAsal) uniqueReligions.add(s.agamaAsal.trim());
        if (s.bank) uniqueBanks.add(s.bank.trim());
    });

    const syncTable = async (tableName, sourceSet, columnMap = (val) => ({ name: val })) => {
        console.log(`\n📋 Syncing ${tableName}...`);
        const { data: existing } = await supabase.from(tableName).select('*');
        const existingNames = new Set(existing?.map(e => e.name) || []);

        const toInsert = Array.from(sourceSet)
            .filter(val => val && val !== '-' && val !== '.' && !existingNames.has(val))
            .map(val => columnMap(val));

        if (toInsert.length > 0) {
            console.log(`➕ Adding ${toInsert.length} items to ${tableName}...`);
            // Insert one by one to avoid batch failures (due to unique constraints on name)
            let success = 0;
            for (const item of toInsert) {
                const { error } = await supabase.from(tableName).insert(item);
                if (!error) success++;
            }
            console.log(`✅ Successfully added ${success} items.`);
        } else {
            console.log(`✅ ${tableName} is already up to date.`);
        }
    };

    // 1. Negeri (states)
    await syncTable('states', uniqueStates);

    // 2. Lokasi (locations) - Special mapping for state_name
    await syncTable('locations',
        new Set(Array.from(uniqueLocations).map(l => l.split('|')[0])), // Use just name for the unique set if name is the key
        (locName) => {
            // Find the representative state for this location
            const match = Array.from(uniqueLocations).find(l => l.startsWith(`${locName}|`));
            const state = match ? match.split('|')[1] : null;
            return { name: locName, state_name: state !== 'Tanpa Negeri' ? state : null };
        }
    );

    // 3. Bangsa (races)
    await syncTable('races', uniqueRaces);

    // 4. Agama Asal (religions)
    await syncTable('religions', uniqueReligions);

    // 5. Bank (banks)
    await syncTable('banks', uniqueBanks);

    console.log('\n✨ All lookup tables synced.');
};

syncAllLookups();
