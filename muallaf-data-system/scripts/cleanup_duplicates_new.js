const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const cleanupDuplicates = async () => {
    console.log('🧹 Starting duplicate cleanup...');

    let allRecords = [];
    let page = 0;
    while (true) {
        const { data } = await supabase.from('submissions').select('id, noKP, noStaf, createdAt, updatedAt').range(page * 1000, (page + 1) * 1000 - 1);
        if (!data || data.length === 0) break;
        allRecords = allRecords.concat(data);
        page++;
    }

    const kpMap = new Map();

    allRecords.forEach(r => {
        const kp = r.noKP ? r.noKP.trim().toUpperCase() : null;
        if (kp && kp !== '-' && kp !== 'N/A' && kp !== '0' && kp !== '.') {
            if (!kpMap.has(kp)) kpMap.set(kp, []);
            kpMap.get(kp).push(r);
        }
    });

    const idsToDelete = [];
    let groupsFound = 0;

    for (const [kp, records] of kpMap.entries()) {
        if (records.length > 1) {
            groupsFound++;
            // Sort by updatedAt desc, then createdAt desc
            records.sort((a, b) => {
                const dateA = new Date(a.updatedAt || a.createdAt);
                const dateB = new Date(b.updatedAt || b.createdAt);
                return dateB - dateA;
            });

            // Keep the first (most recent), delete the rest
            const toDelete = records.slice(1).map(r => r.id);
            idsToDelete.push(...toDelete);
        }
    }

    console.log(`🔍 Found ${groupsFound} duplicate groups.`);
    console.log(`🗑️ Total records to delete: ${idsToDelete.length}`);

    if (idsToDelete.length > 0) {
        // Delete in batches of 100
        const BATCH_SIZE = 100;
        let deletedCount = 0;
        for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
            const batch = idsToDelete.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from('submissions').delete().in('id', batch);
            if (error) {
                console.error('❌ Error during deletion:', error.message);
            } else {
                deletedCount += batch.length;
                console.log(`✅ Deleted ${deletedCount}/${idsToDelete.length} records...`);
            }
        }
        console.log('✨ Cleanup finished successfully.');
    } else {
        console.log('✅ No duplicates found to delete.');
    }
};

cleanupDuplicates();
