const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function deduplicateAttendance() {
    console.log("🧹 Starting Attendance Deduplication (Merging duplicates in JSON arrays)...");

    const { data: records, error: recError } = await supabase
        .from('attendance_records')
        .select('*');

    if (recError) {
        console.error("❌ Error fetching attendance records:", recError);
        return;
    }

    let totalFixedRecords = 0;

    for (const record of records) {
        let changed = false;

        const mergeEntries = (entries) => {
            if (!entries || !Array.isArray(entries)) return entries;

            const map = new Map();
            const originalCount = entries.length;

            entries.forEach(entry => {
                const id = entry.id;
                if (!id) return;

                if (!map.has(id)) {
                    // Deep copy to avoid mutating original
                    map.set(id, { ...entry, attendance: [...(entry.attendance || [])] });
                } else {
                    const existing = map.get(id);
                    // Merge attendance days
                    const combinedAttendance = Array.from(new Set([...(existing.attendance || []), ...(entry.attendance || [])]));
                    existing.attendance = combinedAttendance.sort((a, b) => a - b);
                    changed = true;
                }
            });

            const merged = Array.from(map.values());
            if (merged.length !== originalCount) changed = true;
            return merged;
        };

        const cleanedStudents = mergeEntries(record.students);
        const cleanedWorkers = mergeEntries(record.workers);

        if (changed) {
            console.log(`✨ Deduplicating record: ${record.id}`);
            const { error: updateError } = await supabase
                .from('attendance_records')
                .update({
                    students: cleanedStudents,
                    workers: cleanedWorkers,
                    updatedAt: new Date().toISOString()
                })
                .eq('id', record.id);

            if (updateError) {
                console.error(`❌ Error updating record ${record.id}:`, updateError.message);
            } else {
                totalFixedRecords++;
            }
        }
    }

    console.log(`\n🎉 Deduplication complete!`);
    console.log(`✅ Fixed ${totalFixedRecords} attendance records.`);
}

deduplicateAttendance();
