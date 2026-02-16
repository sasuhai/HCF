const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("Analyzing locations...");

    // 1. Get all locations
    const { data: locations, error: locError } = await supabase
        .from('locations')
        .select('name, state_name');

    if (locError) {
        console.error("Error fetching locations:", locError);
        return;
    }

    // 2. Count locations per state_name
    const stateCounts = {};
    const stateToLocation = {};

    locations.forEach(loc => {
        const s = loc.state_name;
        if (s) {
            stateCounts[s] = (stateCounts[s] || 0) + 1;
            stateToLocation[s] = loc.name;
        }
    });

    const uniqueStates = Object.keys(stateCounts).filter(s => stateCounts[s] === 1);
    console.log("States with unique locations in the 'locations' table:");
    uniqueStates.forEach(s => console.log(` - ${s} -> ${stateToLocation[s]}`));

    // 3. Find submissions with blank lokasi and matching negeriCawangan
    console.log("\nSearching for submissions with blank lokasi matching unique states...");

    const { data: submissions, error: subError } = await supabase
        .from('submissions')
        .select('id, namaAsal, negeriCawangan, lokasi')
        .or('lokasi.is.null,lokasi.eq.""');

    if (subError) {
        console.error("Error fetching submissions:", subError);
        return;
    }

    console.log(`Found ${submissions.length} submissions with blank lokasi.`);

    const updates = [];
    submissions.forEach(sub => {
        if (uniqueStates.includes(sub.negeriCawangan)) {
            updates.push({
                id: sub.id,
                namaAsal: sub.namaAsal,
                negeriCawangan: sub.negeriCawangan,
                newLokasi: stateToLocation[sub.negeriCawangan]
            });
        }
    });

    if (updates.length === 0) {
        console.log("No matching submissions found where negeriCawangan maps to a unique location.");
        return;
    }

    console.log(`\nProposed updates (${updates.length} records):`);
    console.log("--------------------------------------------------");
    updates.forEach(upd => {
        console.log(`ID: ${upd.id} | Nama: ${upd.namaAsal} | Negeri/Cawangan: ${upd.negeriCawangan} -> New Lokasi: ${upd.newLokasi}`);
    });
    console.log("--------------------------------------------------");
    console.log(`Total: ${updates.length} records to be updated.`);
}

run();
