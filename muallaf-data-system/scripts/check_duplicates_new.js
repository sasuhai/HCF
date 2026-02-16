const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const checkDuplicates = async () => {
    console.log('🔍 Checking for duplicate records in submissions...');

    let allRecords = [];
    let page = 0;
    while (true) {
        const { data } = await supabase.from('submissions').select('id, noKP, noStaf, namaAsal, createdAt').range(page * 1000, (page + 1) * 1000 - 1);
        if (!data || data.length === 0) break;
        allRecords = allRecords.concat(data);
        page++;
    }

    console.log(`📊 Analyzed ${allRecords.length} records.`);

    const kpMap = new Map();
    const staffMap = new Map();
    const nameMap = new Map();

    allRecords.forEach(r => {
        // Skip obvious placeholders
        const kp = r.noKP ? r.noKP.trim().toUpperCase() : null;
        if (kp && kp !== '-' && kp !== 'N/A' && kp !== '0') {
            if (!kpMap.has(kp)) kpMap.set(kp, []);
            kpMap.get(kp).push(r);
        }

        const staff = r.noStaf ? r.noStaf.trim().toUpperCase() : null;
        if (staff && staff !== '-' && staff !== 'N/A') {
            if (!staffMap.has(staff)) staffMap.set(staff, []);
            staffMap.get(staff).push(r);
        }
    });

    const kpDuplicates = Array.from(kpMap.entries()).filter(([_, records]) => records.length > 1);
    const staffDuplicates = Array.from(staffMap.entries()).filter(([_, records]) => records.length > 1);

    console.log(`\n🚫 Found ${kpDuplicates.length} groups of duplicates by IC Number (noKP).`);
    console.log(`🚫 Found ${staffDuplicates.length} groups of duplicates by Staff Number (noStaf).`);

    if (kpDuplicates.length > 0) {
        console.log('\nSample noKP Duplicates:');
        kpDuplicates.slice(0, 5).forEach(([kp, records]) => {
            console.log(`- ${kp}: ${records.length} records`);
        });
    }
};

checkDuplicates();
