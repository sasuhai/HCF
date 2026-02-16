const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const syncLookups = async () => {
    console.log('🔍 Analyzing submissions for unique states and locations...');

    // 1. Fetch unique combinations from submissions
    const { data: submissions, error: subError } = await supabase
        .from('submissions')
        .select('negeriCawangan, lokasi')
        .eq('status', 'active');

    if (subError) {
        console.error('❌ Error fetching submissions:', subError.message);
        return;
    }

    const uniqueStates = new Set();
    const stateLocMap = new Map(); // state -> Set(locations)

    submissions.forEach(s => {
        if (s.negeriCawangan) {
            uniqueStates.add(s.negeriCawangan.trim());
            if (!stateLocMap.has(s.negeriCawangan.trim())) {
                stateLocMap.set(s.negeriCawangan.trim(), new Set());
            }
            if (s.lokasi) {
                stateLocMap.get(s.negeriCawangan.trim()).add(s.lokasi.trim());
            }
        }
    });

    console.log(`📊 Found ${uniqueStates.size} unique states and mapping locations...`);

    // 2. Sync States
    const { data: existingStates } = await supabase.from('states').select('name');
    const existingStateNames = new Set(existingStates?.map(s => s.name) || []);

    const statesToInsert = Array.from(uniqueStates)
        .filter(s => !existingStateNames.has(s))
        .map(s => ({ name: s }));

    if (statesToInsert.length > 0) {
        console.log(`➕ Adding ${statesToInsert.length} missing states:`, statesToInsert.map(s => s.name));
        const { error: insError } = await supabase.from('states').insert(statesToInsert);
        if (insError) console.error('❌ Error adding states:', insError.message);
    } else {
        console.log('✅ All states already exist in lookup.');
    }

    // 3. Sync Locations
    const { data: existingLocs } = await supabase.from('locations').select('name, state_name');
    const existingLocKeys = new Set(existingLocs?.map(l => `${l.name}|${l.state_name}`) || []);

    const locsToInsert = [];
    for (const [state, locs] of stateLocMap.entries()) {
        for (const loc of locs) {
            if (!existingLocKeys.has(`${loc}|${state}`)) {
                locsToInsert.push({ name: loc, state_name: state });
            }
        }
    }

    if (locsToInsert.length > 0) {
        console.log(`➕ Adding ${locsToInsert.length} missing locations...`);
        // Insert in batches
        const BATCH = 50;
        for (let i = 0; i < locsToInsert.length; i += BATCH) {
            const batch = locsToInsert.slice(i, i + BATCH);
            const { error: insLocError } = await supabase.from('locations').insert(batch);
            if (insLocError) console.error('❌ Error adding locations batch:', insLocError.message);
        }
        console.log(`✅ Successfully added ${locsToInsert.length} locations.`);
    } else {
        console.log('✅ All locations already exist in lookup.');
    }

    console.log('\n✨ Lookup table check-up complete.');
};

syncLookups();
