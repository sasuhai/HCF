const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function syncKategoriElaun() {
    console.log("🔄 Starting restoration of Kategori Elaun from Attendance Records...");

    // 1. Fetch all attendance records
    const { data: records, error: recError } = await supabase
        .from('attendance_records')
        .select('students');

    if (recError) {
        console.error("❌ Error fetching attendance records:", recError);
        return;
    }

    // 2. Map student ID to its latest/last-seen kategoriElaun
    const kategoriMap = new Map();

    records.forEach(record => {
        if (record.students && Array.isArray(record.students)) {
            record.students.forEach(s => {
                if (s.id && s.kategoriElaun) {
                    // We store it. If we see it again, it's fine.
                    kategoriMap.set(s.id, s.kategoriElaun);
                }
            });
        }
    });

    console.log(`📊 Found ${kategoriMap.size} unique students with Kategori Elaun in attendance records.`);

    if (kategoriMap.size === 0) {
        console.log("⚠️ No Kategori Elaun data found in attendance to sync.");
        return;
    }

    // 3. Update submissions table in batches
    let successCount = 0;
    let failCount = 0;

    const ids = Array.from(kategoriMap.keys());
    console.log(`📤 Updating ${ids.length} records in submissions...`);

    for (const id of ids) {
        const kategori = kategoriMap.get(id);
        const { error: updateError } = await supabase
            .from('submissions')
            .update({ kategoriElaun: kategori })
            .eq('id', id);

        if (updateError) {
            console.error(`❌ Failed to update submission ${id}:`, updateError.message);
            failCount++;
        } else {
            successCount++;
            if (successCount % 50 === 0) {
                console.log(`✅ Updated ${successCount}/${ids.length} records...`);
            }
        }
    }

    console.log(`\n🎉 Sync complete!`);
    console.log(`✅ Successfully restored: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
}

syncKategoriElaun();
