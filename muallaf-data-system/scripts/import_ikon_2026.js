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

const CSV_FILE_PATH = "/Users/sasuhai/Downloads/SPO2026 - Ikon.csv";

async function importIkonMualaf() {
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
                // Column mapping based on visual inspection:
                // 0: BIL
                // 1: NEGERI
                // 2: ID Mualaf
                // 3: Nama Mualaf
                // 4: KRITERIA (Tamat Tahap Asas KBM HCF atau setara)
                // 5: RH Aktif (2025 & 2026)
                // 6: Ikuti Latihan Wajib
                // 7: Ikuti Latihan Elektif
                // 8: Skor
                // 9: Catatan 1 (Latihan Wajib Diikuti)
                // 10: Catatan 2 (Catatan tambahan)
                // 11: Zon
                // 12: Wilayah

                const state = (row[1] || '').trim();
                const id_mualaf = (row[2] || '').trim();
                const nama_mualaf = (row[3] || '').trim();

                if (!state && !id_mualaf && !nama_mualaf) return null;

                const parseBool = (val) => {
                    if (!val) return false;
                    const v = val.toString().toLowerCase().trim();
                    return v === 'true' || v === 'ya' || v === '1' || v === 'yes';
                };

                const parseNumber = (val) => {
                    if (!val) return 0;
                    const clean = val.toString().replace('%', '').trim();
                    return parseFloat(clean) || 0;
                };

                return {
                    category: 'ikon_mualaf',
                    year: 2026,
                    state: state || 'Semua',
                    data: {
                        id_mualaf,
                        nama_mualaf,
                        kriteria_tamat_asas: parseBool(row[4]),
                        kriteria_rh_aktif: parseBool(row[5]),
                        kriteria_latihan_wajib: parseBool(row[6]),
                        kriteria_latihan_elektif: parseBool(row[7]),
                        skor: parseNumber(row[8]),
                        latihan_wajib_diikuti: (row[9] || '').trim(),
                        catatan: (row[10] || '').trim()
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

importIkonMualaf();
