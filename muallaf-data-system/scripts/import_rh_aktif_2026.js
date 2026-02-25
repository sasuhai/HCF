const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const Papa = require('papaparse');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const CSV_FILE_PATH = "/Users/sasuhai/Downloads/spo2026 - RH Aktif.csv";

async function importRHAktif() {
    console.log(`Reading CSV file: ${CSV_FILE_PATH}`);

    if (!fs.existsSync(CSV_FILE_PATH)) {
        console.error('CSV file not found!');
        return;
    }

    const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');

    Papa.parse(fileContent, {
        header: false,
        skipEmptyLines: true,
        complete: async (results) => {
            const rows = results.data;
            // Rows 0 and 1 are headers
            const dataRows = rows.slice(2);

            console.log(`Found ${dataRows.length} records to process.`);

            const recordsToInsert = dataRows.map((row) => {
                // Mapping:
                // 0: NEGERI
                // 1: Bil
                // 2: No. Ahli
                // 3: Nama
                // 4: No Telefon
                // 5: Kawasan
                // 6: Jawatan
                // 7: Bil Terlibat Program Outreach
                // 8: Bil Terlibat Program HCF Lain-lain
                // 9: Mualaf
                // 10: Catatan 1
                // 11: Catatan 2
                // 12: RH Aktif
                // 13: Duat Aktif
                // 14: Duat Kualiti

                const state = (row[0] || '').trim();
                const nama = (row[3] || '').trim();

                if (!state && !nama) return null;

                const parseBool = (val) => {
                    if (!val) return false;
                    const v = val.toString().toLowerCase().trim();
                    // Some rows might have '/', 'TRUE', 'Ya'
                    return v === 'true' || v === 'ya' || v === '1' || v === 'yes' || v === '/';
                };

                const parseNumber = (val) => {
                    if (!val) return 0;
                    return parseInt(val) || 0;
                };

                return {
                    category: 'rh_aktif',
                    year: 2026,
                    state: state || 'Semua',
                    data: {
                        no_ahli: (row[2] || '').trim(),
                        nama: nama,
                        no_tel: (row[4] || '').trim(),
                        kawasan: (row[5] || '').trim(),
                        jawatan: (row[6] || '').trim(),
                        bil_outreach: parseNumber(row[7]),
                        bil_hcf_lain: parseNumber(row[8]),
                        mualaf: parseBool(row[9]),
                        catatan_1: (row[10] || '').trim(),
                        catatan_2: (row[11] || '').trim(),
                        status_rh_aktif: parseBool(row[12]),
                        status_duat_aktif: parseBool(row[13]),
                        status_duat_kualiti: parseBool(row[14])
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            }).filter(Boolean);

            console.log(`Prepared ${recordsToInsert.length} valid records.`);

            // Batch insert
            const CHUNK_SIZE = 100;
            for (let i = 0; i < recordsToInsert.length; i += CHUNK_SIZE) {
                const chunk = recordsToInsert.slice(i, i + CHUNK_SIZE);
                console.log(`Inserting chunk ${Math.floor(i / CHUNK_SIZE) + 1}...`);

                const { error } = await supabase
                    .from('other_kpis')
                    .insert(chunk);

                if (error) {
                    console.error('Error inserting chunk:', error);
                }
            }

            console.log('Import completed!');
        }
    });
}

importRHAktif();
