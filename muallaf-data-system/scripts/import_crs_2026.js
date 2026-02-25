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

const CSV_FILE_PATH = "/Users/sasuhai/Downloads/SPO2026 - CRS.csv";

async function importCRS() {
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
            
            const recordsToInsert = dataRows.map((row, index) => {
                // Column mapping based on visual inspection of CSV head
                // 0: Bil
                // 1: NEGERI
                // 2: Nama Organisasi / Masjid / Surau / Komuniti
                // 3: Sokongan Mualaf
                // 4: Dakwah
                // 5: Kawasan
                // 6: KRITERIA (Masjid/Surau *)
                // 7: Mengadakan pertemuan & Sesi Pengenalan HCF bersama AJK *
                // 8: Sudah menyantuni mualaf HCF **
                // 9: Sudah mengadakan sekurangnya 1 program menyokong mualaf kerjasama HCF **
                // 10: Skor
                // 11: Contact Person
                // 12: No Tel
                // 13: Catatan 1
                // 14: Catatan 2
                // 15: Catatan KOWI
                // 16: SKOR
                // 17: Zon
                // 18: Wilayah

                const state = (row[1] || '').trim();
                const nama_organisasi = (row[2] || '').trim();
                
                if (!state && !nama_organisasi) return null;

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

                const catatanParts = [row[13], row[14], row[15]].filter(Boolean).map(c => c.trim());
                const catatan = catatanParts.join(' | ');

                return {
                    category: 'crs',
                    year: 2026,
                    state: state || 'Semua',
                    data: {
                        nama_organisasi,
                        sokongan_mualaf: parseBool(row[3]),
                        dakwah: parseBool(row[4]),
                        kawasan: (row[5] || '').trim(),
                        kriteria_masjid: parseBool(row[6]),
                        kriteria_pertemuan: parseBool(row[7]),
                        kriteria_menyantuni: parseBool(row[8]),
                        kriteria_program: parseBool(row[9]),
                        skor: parseNumber(row[10]),
                        contact_person: (row[11] || '').trim(),
                        no_tel: (row[12] || '').trim(),
                        catatan: catatan
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            }).filter(Boolean);

            console.log(`Prepared ${recordsToInsert.length} valid records.`);

            // Batch insert
            // Supabase can handle large batches, but we might want to chunk it if it's very large
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

importCRS();
