const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const RAW_DATA = `Kelantan	Kota Bharu	FALSE	1	FALSE	FALSE	FALSE	TRUE
Sarawak - Bintulu	Bintulu	FALSE	0	FALSE	FALSE	FALSE	FALSE
Sarawak - Kota Samarahan	Bandar Tun Razak	TRUE	0	FALSE	FALSE	FALSE	TRUE
Sarawak - Sibu	Sibu	TRUE	2	FALSE	FALSE	FALSE	TRUE
Selangor	Gombak	FALSE	0	FALSE	FALSE	TRUE	TRUE
WP Kuala Lumpur	Bandar Tun Razak	TRUE	0	FALSE	FALSE	FALSE	TRUE
WP Labuan	Bandar Tun Razak	FALSE	0	FALSE	FALSE	FALSE	FALSE
Johor	Bandaraya Johor Bahru	TRUE	0	FALSE	FALSE	FALSE	TRUE
Kedah	Kubang Pasu	FALSE	1	FALSE	FALSE	TRUE	TRUE
Melaka	Alor Gajah	FALSE	2	FALSE	FALSE	FALSE	TRUE
Negeri Sembilan	Seremban	FALSE	0	FALSE	FALSE	TRUE	TRUE
Perak	Perak Tengah	TRUE	0	FALSE	FALSE	FALSE	TRUE
Perlis	Kangar	TRUE	0	FALSE	FALSE	FALSE	TRUE
Pulau Pinang	Permatang Pauh	FALSE	2	FALSE	FALSE	FALSE	TRUE
Terengganu	Bandar Tun Razak	TRUE	0	FALSE	FALSE	FALSE	TRUE
Kelantan	Bachok	FALSE	0	FALSE	FALSE	FALSE	FALSE
Sarawak - Kota Samarahan	Batu	TRUE	0	FALSE	FALSE	FALSE	TRUE
Selangor	BB Bangi	FALSE	0	FALSE	FALSE	TRUE	TRUE
WP Kuala Lumpur	Batu	TRUE	0	FALSE	FALSE	FALSE	TRUE
WP Labuan	Batu	FALSE	0	FALSE	FALSE	FALSE	FALSE
Kedah	Alor Setar	FALSE	0	FALSE	FALSE	FALSE	FALSE
Negeri Sembilan	Nilai	TRUE	0	FALSE	FALSE	TRUE	TRUE
Perak	Ipoh	TRUE	0	FALSE	FALSE	FALSE	TRUE
Perlis	Arau	TRUE	0	FALSE	FALSE	FALSE	TRUE
Pulau Pinang	Seberang Perai Selatan	FALSE	0	FALSE	TRUE	FALSE	TRUE
Terengganu	Batu	TRUE	0	FALSE	FALSE	FALSE	TRUE
Selangor	Ampang Jaya	TRUE	0	FALSE	FALSE	TRUE	TRUE
Kedah	Sungai Petani	FALSE	0	FALSE	FALSE	FALSE	FALSE
Pulau Pinang	Barat Daya	FALSE	1	FALSE	FALSE	FALSE	TRUE
Selangor	Shah Alam	TRUE	1	FALSE	FALSE	TRUE	TRUE
Kedah	Kulim	FALSE	2	FALSE	FALSE	FALSE	TRUE
Pulau Pinang	Timur Laut	FALSE	0	FALSE	FALSE	FALSE	FALSE
Selangor	Hulu Selangor	TRUE	0	FALSE	FALSE	TRUE	TRUE
Kedah	Baling	FALSE	0	FALSE	FALSE	FALSE	FALSE
Pulau Pinang	Bkt Mertajam	FALSE	1	FALSE	FALSE	FALSE	TRUE
Selangor	Kajang	FALSE	0	FALSE	FALSE	TRUE	TRUE
Pulau Pinang	Tasek Gelugor	FALSE	0	FALSE	FALSE	FALSE	FALSE
Selangor	Petaling Jaya	TRUE	0	FALSE	FALSE	TRUE	TRUE
Pulau Pinang	Seberang Perai Utara	FALSE	0	FALSE	FALSE	FALSE	FALSE
Selangor	Kuala Selangor	FALSE	1	FALSE	FALSE	TRUE	TRUE`;

async function importIkram2026() {
    console.log('Starting IKRAM 2026 data import...');

    const lines = RAW_DATA.split('\n');
    console.log(`Found ${lines.length} records to process.`);

    const parseValue = (val) => {
        if (!val) return false;
        const v = val.trim().toUpperCase();
        if (v === 'TRUE' || v === 'YA' || v === 'YES' || v === '1') return true;
        if (v === 'FALSE' || v === 'TIDAK' || v === 'NO' || v === '0') return false;

        // Check if it's a number
        if (!isNaN(val) && val.trim() !== '') {
            return parseInt(val);
        }
        return val.trim();
    };

    const recordsToInsert = lines.map((line) => {
        const row = line.split('\t');
        if (row.length < 8) return null;

        const state = row[0].trim();
        const kawasanIkram = row[1].trim();

        return {
            category: 'ikram',
            year: 2026,
            state: state,
            data: {
                kawasan_ikram: kawasanIkram,
                kriteria_jkd: parseValue(row[2]),
                kriteria_program: parseValue(row[3]),
                kriteria_dana_staf: parseValue(row[4]),
                kriteria_dana_tahunan: parseValue(row[5]),
                kriteria_fasiliti: parseValue(row[6]),
                skor: row[7].trim() // Keep as TRUE/FALSE string for the text field
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }).filter(Boolean);

    console.log(`Prepared ${recordsToInsert.length} valid records.`);

    const { data, error } = await supabase
        .from('other_kpis')
        .insert(recordsToInsert);

    if (error) {
        console.error('Error importing data:', error);
    } else {
        console.log('Successfully imported IKRAM 2026 records!');
    }
}

importIkram2026();
