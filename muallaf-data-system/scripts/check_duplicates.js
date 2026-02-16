const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const checkDuplicates = async () => {
    console.log('🔍 Checking for potential duplicates...');

    // We can't do complex GROUP BY queries easily with supabase-js unless using .rpc()
    // Validation strategy:
    // 1. Fetch all records (id, noKP, namaAsal, createdAt)
    // 2. Count in memory (since 13k is manageable in Node memory)

    // Fetch all records
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
            break;
        }

        if (data.length > 0) {
            allRecords.push(...data);
            from += PAGE_SIZE;
            console.log(`📥 Fetched ${allRecords.length} records...`);
        } else {
            hasMore = false;
        }
    }

    // Analyze duplicates by noKP (if present) and namaAsal
    // Key = noKP or "NAME::"+namaAsal
    const map = new Map();
    let duplicateCount = 0;
    let duplicateGroups = 0;

    for (const r of allRecords) {
        let key;
        if (r.noKP && r.noKP.length > 5) { // Use IC if valid
            key = `IC::${r.noKP.trim()}`;
        } else if (r.namaAsal) {
            key = `NAME::${r.namaAsal.trim().toUpperCase()}`;
        } else {
            continue; // Skip if no identifiers
        }

        if (!map.has(key)) {
            map.set(key, []);
        }
        map.get(key).push(r);
    }

    for (const [key, records] of map.entries()) {
        if (records.length > 1) {
            duplicateGroups++;
            duplicateCount += (records.length - 1);
            if (duplicateGroups <= 5) {
                console.log(`⚠️  Duplicate Found [${key}]: ${records.length} records`);
                records.forEach(d => console.log(`   - ID: ${d.id}, Created: ${d.createdAt}`));
            }
        }
    }

    console.log('\n📊 Summary:');
    console.log(`Total Records Scanned: ${allRecords.length}`);
    console.log(`Duplicate Groups found: ${duplicateGroups}`);
    console.log(`Total Extra Copies (to be deleted): ${duplicateCount}`);

    if (duplicateCount > 0) {
        console.log(`Expected Count after cleanup: ${allRecords.length - duplicateCount}`);
    }
};

checkDuplicates();
