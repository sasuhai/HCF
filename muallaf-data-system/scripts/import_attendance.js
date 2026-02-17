
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const Papa = require('papaparse');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const csvFilePath = '/Users/sasuhai/Desktop/HCFBTR/PetugasHadir.csv';
const YEAR = '2025';

// Mapping month names to numbers
const monthMap = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
    'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
};

async function run() {
    console.log('Starting attendance import...');

    const fileContent = fs.readFileSync(csvFilePath, 'utf8');

    // Using PapaParse to handle potential commas in names
    const results = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim()
    });

    const data = results.data;
    const headers = results.meta.fields;

    // Filter date headers (e.g., "4-Jan")
    const dateHeaders = headers.filter(h => h.includes('-') && !h.includes('NoKP') && !h.includes('Nama'));
    console.log(`Found ${dateHeaders.length} date columns.`);

    // Cache for workers and submissions to avoid repetitive DB calls
    console.log('Fetching workers and submissions for ID mapping...');
    const { data: dbWorkers } = await supabase.from('workers').select('id, nama, noKP, peranan, kategoriElaun');
    const { data: dbStudents } = await supabase.from('submissions').select('id, namaAsal, namaIslam, noKP, kategoriElaun').eq('status', 'active');

    const workerMap = new Map();
    dbWorkers?.forEach(w => {
        workerMap.set(w.noKP, w);
        workerMap.set(w.nama.toUpperCase(), w);
    });

    const studentMap = new Map();
    dbStudents?.forEach(s => {
        if (s.noKP) studentMap.set(s.noKP, s);
        if (s.namaAsal) studentMap.set(s.namaAsal.toUpperCase(), s);
        if (s.namaIslam) studentMap.set(s.namaIslam.toUpperCase(), s);
    });

    // Structure to hold organized attendance: organized[classId][YYYY-MM] = { workers: [], students: [] }
    const organized = {};

    for (const row of data) {
        const classId = row['Kelas uid'];
        const type = row['workersorStudent']; // "workers" or "Student"
        const name = row['Nama'];
        const noKP = row['NoKP'];

        if (!classId || !type || !name) continue;

        // Map to DB ID
        let dbPerson = null;
        if (type === 'workers') {
            dbPerson = workerMap.get(noKP) || workerMap.get(name.toUpperCase());
        } else {
            dbPerson = studentMap.get(noKP) || studentMap.get(name.toUpperCase());
        }

        if (!dbPerson) {
            console.warn(`Could not find ${type} in DB: ${name} (${noKP}). Skipping...`);
            continue;
        }

        // Process each date column
        for (const dateCol of dateHeaders) {
            if (row[dateCol]?.toUpperCase() !== 'TRUE') continue;

            const [dayPart, monthPart] = dateCol.split('-').map(p => p.trim());
            const day = parseInt(dayPart);
            const monthNum = monthMap[monthPart];

            if (!monthNum) {
                console.error(`Unknown month part: ${monthPart} in header ${dateCol}`);
                continue;
            }

            const monthKey = `${YEAR}-${monthNum}`;

            if (!organized[classId]) organized[classId] = {};
            if (!organized[classId][monthKey]) {
                organized[classId][monthKey] = {
                    workers: new Map(),
                    students: new Map()
                };
            }

            const collection = type === 'workers' ? organized[classId][monthKey].workers : organized[classId][monthKey].students;

            if (!collection.has(dbPerson.id)) {
                if (type === 'workers') {
                    collection.set(dbPerson.id, {
                        id: dbPerson.id,
                        nama: dbPerson.nama,
                        role: dbPerson.peranan || 'Petugas',
                        kategoriElaun: dbPerson.kategoriElaun || '',
                        attendance: []
                    });
                } else {
                    collection.set(dbPerson.id, {
                        id: dbPerson.id,
                        nama: dbPerson.namaIslam || dbPerson.namaAsal,
                        icNo: dbPerson.noKP,
                        kategoriElaun: dbPerson.kategoriElaun || '',
                        attendance: []
                    });
                }
            }

            const personRecord = collection.get(dbPerson.id);
            if (!personRecord.attendance.includes(day)) {
                personRecord.attendance.push(day);
            }
        }
    }

    console.log('Organized data. Starting upsert...');

    for (const classId of Object.keys(organized)) {
        for (const monthKey of Object.keys(organized[classId])) {
            const recordId = `${classId}_${monthKey}`;
            const attendanceData = organized[classId][monthKey];

            // Fetch existing if any
            const { data: existing } = await supabase
                .from('attendance_records')
                .select('*')
                .eq('id', recordId)
                .single();

            const finalWorkers = Array.from(attendanceData.workers.values());
            const finalStudents = Array.from(attendanceData.students.values());

            // Simple merge strategy (override with CSV data if same ID exists, otherwise keep or append)
            // For this specific task, we'll assume the CSV is the source of truth for these participants.

            const recordToUpsert = {
                id: recordId,
                classId: classId,
                year: YEAR,
                month: monthKey,
                workers: finalWorkers,
                students: finalStudents,
                updatedAt: new Date().toISOString()
            };

            if (existing) {
                // Merge workers
                const mergedWorkers = [...existing.workers || []];
                finalWorkers.forEach(fw => {
                    const idx = mergedWorkers.findIndex(mw => mw.id === fw.id);
                    if (idx !== -1) mergedWorkers[idx] = fw;
                    else mergedWorkers.push(fw);
                });

                // Merge students
                const mergedStudents = [...existing.students || []];
                finalStudents.forEach(fs => {
                    const idx = mergedStudents.findIndex(ms => ms.id === fs.id);
                    if (idx !== -1) mergedStudents[idx] = fs;
                    else mergedStudents.push(fs);
                });

                recordToUpsert.workers = mergedWorkers;
                recordToUpsert.students = mergedStudents;
                recordToUpsert.createdAt = existing.createdAt;
            } else {
                recordToUpsert.createdAt = new Date().toISOString();
            }

            const { error } = await supabase
                .from('attendance_records')
                .upsert(recordToUpsert);

            if (error) {
                console.error(`Error upserting ${recordId}:`, error.message);
            } else {
                console.log(`Successfully upserted attendance for ${recordId}`);
            }
        }
    }

    console.log('Import completed.');
}

run().catch(console.error);
