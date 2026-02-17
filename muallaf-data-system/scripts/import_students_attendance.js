
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const Papa = require('papaparse');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const csvFilePath = '/Users/sasuhai/Desktop/HCFBTR/PelajarHadir.csv';
const YEAR = '2025';

// Mapping month names to numbers
const monthMap = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
    'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
};

// Internal helper to fetch ALL records from a query by handling Supabase's 1000-record limit
const fetchAll = async (queryBuilder) => {
    let allData = [];
    let page = 0;
    const size = 1000;
    let hasMore = true;

    while (hasMore) {
        const from = page * size;
        const to = from + size - 1;
        const { data, error } = await queryBuilder.range(from, to);

        if (error) throw error;

        if (data && data.length > 0) {
            allData = allData.concat(data);
            if (data.length < size) {
                hasMore = false;
            } else {
                page++;
            }
        } else {
            hasMore = false;
        }
    }
    return allData;
};

async function run() {
    console.log('Starting student attendance import (PelajarHadir.csv)...');

    const fileContent = fs.readFileSync(csvFilePath, 'utf8');

    // Using PapaParse to handle headers
    const results = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim()
    });

    const data = results.data;
    const headers = results.meta.fields;

    // Filter date headers (e.g., "4-Jan")
    const dateHeaders = headers.filter(h => h.includes('-') && !h.includes('StaffNo') && !h.includes('uid'));
    console.log(`Found ${dateHeaders.length} date columns.`);

    // Cache for submissions to avoid repetitive DB calls
    console.log('Fetching all submissions for staffNo mapping...');
    const dbStudents = await fetchAll(supabase.from('submissions').select('id, namaAsal, namaIslam, noKP, noStaf, kategoriElaun').eq('status', 'active'));

    const studentMap = new Map();
    dbStudents?.forEach(s => {
        if (s.noStaf) {
            studentMap.set(s.noStaf.trim().toUpperCase(), s);
        }
    });

    console.log(`Mapped ${studentMap.size} students from DB.`);

    // Structure to hold organized attendance: organized[classId][YYYY-MM] = { students: [] }
    const organized = {};

    for (const row of data) {
        const classId = row['Kelas uid'];
        const staffNo = row['StaffNo'] ? row['StaffNo'].trim().toUpperCase() : null;

        if (!classId || !staffNo) continue;

        // Map to DB ID via StaffNo
        const dbPerson = studentMap.get(staffNo);

        if (!dbPerson) {
            // Log only first 5 to avoid spam
            // console.warn(`Could not find student with noStaf in DB: ${staffNo}. Skipping...`);
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
                    students: new Map()
                };
            }

            const collection = organized[classId][monthKey].students;

            if (!collection.has(dbPerson.id)) {
                collection.set(dbPerson.id, {
                    id: dbPerson.id,
                    nama: dbPerson.namaIslam || dbPerson.namaAsal,
                    icNo: dbPerson.noKP,
                    kategoriElaun: dbPerson.kategoriElaun || '',
                    attendance: []
                });
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

            const finalStudents = Array.from(attendanceData.students.values());

            const recordToUpsert = {
                id: recordId,
                classId: classId,
                year: YEAR,
                month: monthKey,
                students: finalStudents,
                updatedAt: new Date().toISOString()
            };

            if (existing) {
                // Merge students - keep existing workers, merge students
                const mergedStudents = [...existing.students || []];
                finalStudents.forEach(fs => {
                    const idx = mergedStudents.findIndex(ms => ms.id === fs.id);
                    if (idx !== -1) mergedStudents[idx] = fs;
                    else mergedStudents.push(fs);
                });

                recordToUpsert.workers = existing.workers || []; // Keep existing workers
                recordToUpsert.students = mergedStudents;
                recordToUpsert.createdAt = existing.createdAt;
            } else {
                recordToUpsert.workers = [];
                recordToUpsert.createdAt = new Date().toISOString();
            }

            const { error } = await supabase
                .from('attendance_records')
                .upsert(recordToUpsert);

            if (error) {
                console.error(`Error upserting ${recordId}:`, error.message);
            } else {
                console.log(`Successfully upserted student attendance for ${recordId}`);
            }
        }
    }

    console.log('Import completed.');
}

run().catch(console.error);
