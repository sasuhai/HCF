const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const CSV_PATH = '/Users/sasuhai/Desktop/HCFBTR/mualaf2025.csv';

const updateMissingLokasi = async () => {
    console.log('📖 Reading source CSV for location mapping...');
    const fileContent = fs.readFileSync(CSV_PATH, 'utf8');
    const { data: csvRecords } = Papa.parse(fileContent, { header: true, skipEmptyLines: true });

    const locationMap = new Map();
    csvRecords.forEach(r => {
        const kp = r.NoKP ? r.NoKP.trim().toUpperCase() : null;
        const loc = r.Lokasi ? r.Lokasi.trim() : null;
        if (kp && loc && kp !== '-' && kp !== '0') {
            locationMap.set(kp, loc);
        }
    });

    console.log(`✅ Loaded ${locationMap.size} unique KP-to-Location mappings from CSV.`);

    console.log('🔍 Fetching records with missing lokasi...');
    let allSubmissions = [];
    let page = 0;
    while (true) {
        const { data } = await supabase.from('submissions').select('id, noKP, lokasi').filter('lokasi', 'is', null).range(page * 1000, (page + 1) * 1000 - 1);
        if (!data || data.length === 0) break;
        allSubmissions = allSubmissions.concat(data);
        page++;
    }

    console.log(`📊 Found ${allSubmissions.length} records with missing lokasi.`);

    let updateCount = 0;
    const CONCURRENCY = 20;

    const tasks = allSubmissions.filter(r => {
        const kp = r.noKP ? r.noKP.trim().toUpperCase() : null;
        return locationMap.has(kp);
    });

    console.log(`🚀 Starting parallel updates for ${tasks.length} matches...`);

    const runBatch = async (batch) => {
        await Promise.all(batch.map(async (record) => {
            const kp = record.noKP.trim().toUpperCase();
            const targetLoc = locationMap.get(kp);
            const { error } = await supabase.from('submissions').update({ lokasi: targetLoc }).eq('id', record.id);
            if (!error) {
                updateCount++;
                if (updateCount % 100 === 0) console.log(`✅ Updated ${updateCount}/${tasks.length}...`);
            }
        }));
    };

    for (let i = 0; i < tasks.length; i += CONCURRENCY) {
        const batch = tasks.slice(i, i + CONCURRENCY);
        await runBatch(batch);
    }

    console.log('\n✨ Finished updating missing locations.');
    console.log(`✅ Successfully updated: ${updateCount}`);
};

updateMissingLokasi();
