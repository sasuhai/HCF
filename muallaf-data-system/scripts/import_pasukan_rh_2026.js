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

const CSV_FILE_PATH = "/Users/sasuhai/Downloads/SPO2026 - Pasukan RH.csv";

async function importPasukanRH() {
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

            // Filter out header rows and empty rows
            // Header rows usually start with "Negeri" or have headers in columns 2-5
            const dataRows = rows.filter(row => {
                if (!row[0] || row[0] === 'Negeri' || row[1] === 'Kawasan') return false;
                // Also check if row is empty or mostly empty
                if (!row[1] && !row[2]) return false;
                return true;
            });

            console.log(`Found ${dataRows.length} potential records to process.`);

            const recordsToInsert = dataRows.map((row) => {
                const state = (row[0] || '').trim();
                const kawasan = (row[1] || '').trim();

                const parseBool = (val) => {
                    if (!val) return false;
                    const v = val.toString().toLowerCase().trim();
                    return v === '/' || v === 'true' || v === 'ya' || v === 'aktif' || v === '1';
                };

                const parseNumber = (val) => {
                    if (!val) return 0;
                    // Handle values like '2' or '/'
                    if (val === '/') return 1;
                    return parseInt(val) || 0;
                };

                // For ajk_lain, if it's a number > 0, we mark it true (since the UI uses checkbox)
                const ajkLainVal = (row[5] || '').trim();
                const hasAjkLain = parseBool(ajkLainVal) || parseNumber(ajkLainVal) > 0;

                return {
                    category: 'pasukan_rh',
                    year: 2026,
                    state: state,
                    data: {
                        kawasan: kawasan,
                        ajk_ketua: parseBool(row[2]),
                        ajk_su: parseBool(row[3]),
                        ajk_bendahari: parseBool(row[4]),
                        ajk_lain: hasAjkLain,
                        prog_outreach: parseNumber(row[6]),
                        prog_mualaf: parseNumber(row[7]),
                        prog_kebersamaan: parseNumber(row[8]),
                        skor: (row[10] || '').trim(),
                        status_aktif: parseBool(row[11])
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            });

            console.log(`Prepared ${recordsToInsert.length} records for insertion.`);

            // Batch insert
            const CHUNK_SIZE = 50;
            let successCount = 0;

            for (let i = 0; i < recordsToInsert.length; i += CHUNK_SIZE) {
                const chunk = recordsToInsert.slice(i, i + CHUNK_SIZE);
                console.log(`Inserting chunk ${Math.floor(i / CHUNK_SIZE) + 1}...`);

                const { error } = await supabase
                    .from('other_kpis')
                    .insert(chunk);

                if (error) {
                    console.error('Error inserting chunk:', error);
                } else {
                    successCount += chunk.length;
                }
            }

            console.log(`Import completed! Successfully inserted ${successCount} records.`);
            process.exit(0);
        }
    });
}

importPasukanRH();
