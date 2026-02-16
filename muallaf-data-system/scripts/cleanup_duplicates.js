const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const cleanupDuplicates = async () => {
    console.log('🧹 Starting cleanup of duplicates...');

    // 1. Fetch all records
    const allRecords = [];
    const PAGE_SIZE = 1000;
    let from = 0;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('submissions')
            .select('id, noKP, namaAsal, createdAt')
            .range(from, from + PAGE_SIZE - 1);

        if (error) {
            console.error('❌ Error fetching data:', error.message);
            process.exit(1);
        }

        if (data.length > 0) {
            allRecords.push(...data);
            from += PAGE_SIZE;
            console.log(`📥 Fetched ${allRecords.length} records...`);
        } else {
            hasMore = false;
        }
    }

    // 2. Identify Metadata for Deletion
    const map = new Map();
    const idsToDelete = [];

    for (const r of allRecords) {
        let key;
        if (r.noKP && r.noKP.length > 5) {
            key = `IC::${r.noKP.trim()}`;
        } else if (r.namaAsal) {
            key = `NAME::${r.namaAsal.trim().toUpperCase()}`;
        } else {
            continue;
        }

        if (!map.has(key)) {
            map.set(key, []);
        }
        map.get(key).push(r);
    }

    for (const [key, records] of map.entries()) {
        if (records.length > 1) {
            // Sort by createdAt descending (newest first)
            records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // Keep the first one (newest), delete the rest
            const toDelete = records.slice(1);
            toDelete.forEach(r => idsToDelete.push(r.id));
        }
    }

    console.log(`⚠️  Found ${idsToDelete.length} duplicate records to delete.`);

    if (idsToDelete.length === 0) {
        console.log('✅ No duplicates to delete.');
        return;
    }

    // 3. Delete in Batches
    const BATCH_SIZE = 100;
    let deletedCount = 0;

    for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
        const batchIds = idsToDelete.slice(i, i + BATCH_SIZE);

        const { error } = await supabase
            .from('submissions')
            .delete()
            .in('id', batchIds);

        if (error) {
            console.error(`❌ Error deleting batch ${i / BATCH_SIZE + 1}:`, error.message);
        } else {
            deletedCount += batchIds.length;
            console.log(`🗑️  Deleted batch ${i / BATCH_SIZE + 1} (${deletedCount}/${idsToDelete.length})`);
        }
    }

    console.log('\n🎉 Cleanup complete!');
    console.log(`✅ Deleted ${deletedCount} duplicates.`);
};

cleanupDuplicates();
