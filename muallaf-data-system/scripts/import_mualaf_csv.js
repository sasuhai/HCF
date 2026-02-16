const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CSV_FILE_PATH = '/Users/sasuhai/Desktop/HCFBTR/mualaf2025.csv';

const monthMap = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
    'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
};

const parseDate = (dateStr) => {
    if (!dateStr) return null;
    // Format: DD/Mon/YYYY or DD-Mon-YYYY or DD/Mon/YY
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length !== 3) return null;

    const day = parts[0].padStart(2, '0');
    const monthStr = parts[1];
    let year = parts[2];

    // Handle 2-digit year
    if (year.length === 2) {
        year = '20' + year;
    }

    // Check if month is numeric
    let month = monthStr;
    if (isNaN(monthStr)) {
        month = monthMap[monthStr] || monthMap[monthStr.substring(0, 3)];
    }

    if (!month) return null;

    // Construct ISO string YYYY-MM-DD
    const isoDate = `${year}-${month}-${day}T00:00:00.000Z`;
    return isoDate;
};


const mapRecord = (row) => {
    // Helper to clean strings
    const clean = (val) => val ? val.trim() : null;
    const cleanNum = (val) => {
        if (!val) return null;
        const cleaned = val.replace(/[^0-9.]/g, '');
        return cleaned ? parseFloat(cleaned) : null;
    };

    return {
        negeriCawangan: clean(row['negeriCawangan']),
        kategori: clean(row['Kategori']),
        noStaf: clean(row['nostaf']),
        namaIslam: clean(row['NamaIslam']),
        namaAsal: clean(row['NamaAsal']),
        noKP: clean(row['NoKP']),
        jantina: clean(row['Jantina']),
        bangsa: clean(row['Bangsa']),
        agamaAsal: clean(row['AgamaAsal']),
        umur: cleanNum(row['Umur']),
        warganegara: clean(row['Warganegara']),
        noTelefon: clean(row['NoTelefon']),
        alamatTinggal: clean(row['AlamatTinggal']),
        alamatTetap: clean(row['AlamatTetap']),
        pekerjaan: clean(row['Pekerjaan']),
        pendapatanBulanan: cleanNum(row['PendapatanBulanan']),
        tahapPendidikan: clean(row['TahapPendidikan']),
        tarikhPengislaman: parseDate(clean(row['TarikhPengislaman'])),
        masaPengislaman: clean(row['MasaPengislaman']),
        tempatPengislaman: clean(row['TempatPengislaman']),
        negeriPengislaman: clean(row['NegeriPengislaman']),
        lokasi: clean(row['Lokasi']), // Mapping 'Lokasi' from CSV directly
        // Transformation: Didaftarkan Pada -> updatedAt
        updatedAt: parseDate(clean(row['Didaftarkan Pada'])) || new Date().toISOString(),
        createdAt: new Date().toISOString(), // Default to now
        status: 'active'
    };
};

const importData = async () => {
    console.log(`📖 Reading CSV file from ${CSV_FILE_PATH}...`);

    try {
        const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');

        Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const records = results.data;
                console.log(`✅ Found ${records.length} records in CSV.`);

                const mappedRecords = records.map(mapRecord);

                // Batch insert
                const BATCH_SIZE = 100;
                let successCount = 0;
                let errorCount = 0;

                for (let i = 0; i < mappedRecords.length; i += BATCH_SIZE) {
                    const batch = mappedRecords.slice(i, i + BATCH_SIZE);

                    const { error } = await supabase
                        .from('submissions')
                        .insert(batch);

                    if (error) {
                        console.error(`❌ Error inserting batch ${i / BATCH_SIZE + 1}:`, error.message);
                        errorCount += batch.length;
                    } else {
                        successCount += batch.length;
                        console.log(`✅ Inserted batch ${i / BATCH_SIZE + 1} (${successCount}/${mappedRecords.length})`);
                    }
                }

                console.log('\n🎉 Import complete!');
                console.log(`✅ Successfully imported: ${successCount}`);
                console.log(`❌ Failed: ${errorCount}`);
            }
        });

    } catch (err) {
        console.error('❌ Error reading or processing file:', err);
    }
};

importData();
