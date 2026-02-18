const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function relinkAttendance() {
    console.log("🛠️  Starting Attendance Re-linking Process...");

    // 1. Fetch all submissions for matching (with pagination)
    console.log("📥 Fetching all submissions...");
    const submissions = [];
    const PAGE_SIZE = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('submissions')
            .select('id, noKP, namaIslam, namaAsal')
            .range(offset, offset + PAGE_SIZE - 1);

        if (error) {
            console.error("❌ Error fetching submissions:", error);
            return;
        }

        if (data.length > 0) {
            submissions.push(...data);
            offset += PAGE_SIZE;
        } else {
            hasMore = false;
        }
    }

    // Create lookup maps
    const icMap = new Map();
    const nameMap = new Map();

    submissions.forEach(s => {
        if (s.noKP && s.noKP.length > 5) {
            icMap.set(s.noKP.trim().replace(/[-\s]/g, ''), s.id);
        }
        if (s.namaIslam) {
            nameMap.set(s.namaIslam.trim().toUpperCase(), s.id);
        }
        if (s.namaAsal) {
            nameMap.set(s.namaAsal.trim().toUpperCase(), s.id);
        }
    });

    console.log(`✅ Loaded ${submissions.length} submissions for matching.`);

    // 2. Fetch all attendance records
    const { data: records, error: recError } = await supabase
        .from('attendance_records')
        .select('*');

    if (recError) {
        console.error("❌ Error fetching attendance records:", recError);
        return;
    }

    console.log(`📋 Processing ${records.length} months of attendance...`);

    let totalFixed = 0;

    for (const record of records) {
        let changed = false;

        // Students
        const updatedStudents = (record.students || []).map(s => {
            const cleanIC = s.icNo ? s.icNo.toString().trim().replace(/[-\s]/g, '') : null;
            const cleanName = s.nama ? s.nama.trim().toUpperCase() : null;

            let newId = null;
            if (cleanIC && icMap.has(cleanIC)) {
                newId = icMap.get(cleanIC);
            } else if (cleanName && nameMap.has(cleanName)) {
                newId = nameMap.get(cleanName);
            }

            if (newId && newId !== s.id) {
                changed = true;
                totalFixed++;
                return { ...s, id: newId };
            }
            return s;
        });

        // Workers
        const updatedWorkers = (record.workers || []).map(w => {
            const cleanIC = w.icNo ? w.icNo.toString().trim().replace(/[-\s]/g, '') : null;
            const cleanName = w.nama ? w.nama.trim().toUpperCase() : null;

            let newId = null;
            if (cleanIC && icMap.has(cleanIC)) {
                newId = icMap.get(cleanIC);
            } else if (cleanName && nameMap.has(cleanName)) {
                newId = nameMap.get(cleanName);
            }

            if (newId && newId !== w.id) {
                changed = true;
                totalFixed++;
                return { ...w, id: newId };
            }
            return w;
        });

        if (changed) {
            const { error: updateError } = await supabase
                .from('attendance_records')
                .update({
                    students: updatedStudents,
                    workers: updatedWorkers,
                    updatedAt: new Date().toISOString()
                })
                .eq('id', record.id);

            if (updateError) {
                console.error(`❌ Error updating record ${record.id}:`, updateError.message);
            }
        }
    }

    console.log(`\n🎉 Re-linking complete!`);
    console.log(`✅ Total IDs updated in attendance JSON: ${totalFixed}`);
}

relinkAttendance();
