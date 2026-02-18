const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updateMualaf2Location() {
    console.log("📍 Updating Location and State for 'MUALAF 2' records...");

    const { data: records, error: fetchError } = await supabase
        .from('submissions')
        .select('id, namaAsal, kategoriElaun')
        .ilike('kategoriElaun', 'MUALAF 2');

    if (fetchError) {
        console.error("❌ Error fetching records:", fetchError.message);
        return;
    }

    if (!records || records.length === 0) {
        console.log("⚠️ No 'MUALAF 2' records found.");
        return;
    }

    console.log(`🔍 Found ${records.length} records to update.`);

    let successCount = 0;
    let failCount = 0;

    for (const record of records) {
        const { error: updateError } = await supabase
            .from('submissions')
            .update({
                negeriCawangan: 'Kuala Lumpur',
                negeri: 'Kuala Lumpur', // Updating both for consistency
                lokasi: 'HCF BANDAR TUN RAZAK',
                updatedAt: new Date().toISOString()
            })
            .eq('id', record.id);

        if (updateError) {
            console.error(`❌ Failed to update ${record.namaAsal}:`, updateError.message);
            failCount++;
        } else {
            successCount++;
        }
    }

    console.log(`\n🎉 Update complete!`);
    console.log(`✅ Successfully updated: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
}

updateMualaf2Location();
