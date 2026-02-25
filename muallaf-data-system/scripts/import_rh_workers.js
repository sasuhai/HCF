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

const CSV_FILE_PATH = "/Users/sasuhai/Downloads/spo2026 - RH.csv";

async function importRH() {
    console.log(`Starting RH import from ${CSV_FILE_PATH}`);

    // Fetch locations and states for mapping
    const { data: locations } = await supabase.from('locations').select('*');
    const { data: states } = await supabase.from('states').select('*');

    const locationMap = {};
    if (locations) {
        locations.forEach(l => {
            locationMap[l.name.toUpperCase()] = l;
        });
    }

    const stateMap = {};
    if (states) {
        states.forEach(s => {
            stateMap[s.name.toUpperCase()] = s.name;
        });
    }

    const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');

    Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
            const dataRows = results.data;
            console.log(`Found ${dataRows.length} records to process.`);

            const recordsToInsert = dataRows.map((row) => {
                const nama = (row['NAMA'] || '').replace(/\t/g, '').trim();
                const noKP = (row['NO. KP/PASPOT'] || '').trim();

                if (!nama || !noKP) return null;

                const institusiRaw = (row['INSTITUSI'] || '').trim().toUpperCase();
                let lokasi = (row['INSTITUSI'] || '').trim();
                let negeri = '';

                // Try to find matching location
                if (locationMap[institusiRaw]) {
                    lokasi = locationMap[institusiRaw].name;
                    negeri = locationMap[institusiRaw].state_name;
                } else if (institusiRaw === 'HIDAYAH CENTRE FOUNDATION') {
                    lokasi = 'HIDAYAH CENTRE FOUNDATION';
                    negeri = 'Kuala Lumpur'; // Default for HQ
                }

                // Format dates DD/MM/YYYY -> YYYY-MM-DD
                const formatDate = (dateStr) => {
                    if (!dateStr) return null;
                    const parts = dateStr.trim().split('/');
                    if (parts.length === 3) {
                        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                    }
                    return null;
                };

                const cleanValue = (val) => (val || '').toString().replace(/\r/g, '').trim();

                return {
                    nama: nama,
                    noKP: noKP,
                    staff_id: cleanValue(row['ID RH']),
                    jantina: cleanValue(row['JANTINA']),
                    tarikh_daftar: formatDate(row['TARIKH DAFTAR']),
                    daerah_kediaman: cleanValue(row['DAERAH/BANDAR TEMPAT TINGGAL']),
                    negeri_kediaman: cleanValue(row['NEGERI']),
                    tel_bimbit: cleanValue(row['TEL BIMBIT']),
                    email: cleanValue(row['EMAIL']),
                    pekerjaan: cleanValue(row['PEKERJAAN']),
                    kepakaran: cleanValue(row['KEPAKARAN/PENGALAMAN']),
                    tarikh_lahir: formatDate(row['TARIKH LAHIR']),
                    lokasi: lokasi,
                    negeri: negeri,
                    peranan: 'Sukarelawan', // Peranan=Sukarelawan for all
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            }).filter(Boolean);

            console.log(`Prepared ${recordsToInsert.length} valid records.`);

            // Batch insert
            const CHUNK_SIZE = 100;
            let successCount = 0;
            for (let i = 0; i < recordsToInsert.length; i += CHUNK_SIZE) {
                const chunk = recordsToInsert.slice(i, i + CHUNK_SIZE);
                console.log(`Inserting chunk ${Math.floor(i / CHUNK_SIZE) + 1}...`);

                const { data, error } = await supabase
                    .from('workers')
                    .insert(chunk)
                    .select();

                if (error) {
                    console.error('Error inserting chunk:', error);
                } else if (data) {
                    successCount += data.length;
                }
            }

            console.log(`Import completed! Successfully imported ${successCount} records.`);
        }
    });
}

importRH();
