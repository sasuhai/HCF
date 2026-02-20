const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("Starting location cleanup...");

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
    console.log("Unique State Mapping:", uniqueStates.map(s => `${s} -> ${stateToLocation[s]}`));

    // 3. Find mualaf with blank lokasi
    const { data: submissions, error: subError } = await supabase
        .from('mualaf')
        .select('id, namaAsal, negeriCawangan, lokasi')
        .or('lokasi.is.null,lokasi.eq.""');

    if (subError) {
        console.error("Error fetching submissions:", subError);
        return;
    }

    const updates = submissions.filter(sub => uniqueStates.includes(sub.negeriCawangan));

    if (updates.length === 0) {
        console.log("No records to update.");
        return;
    }

    console.log(`Processing ${updates.length} updates...`);

    let successCount = 0;
    let failCount = 0;

    for (const item of updates) {
        const newLokasi = stateToLocation[item.negeriCawangan];
        const { error: updateError } = await supabase
            .from('mualaf')
            .update({
                lokasi: newLokasi,
                updatedAt: new Date().toISOString()
                // updatedBy: Removed because it expects a UUID
            })
            .eq('id', item.id);

        if (updateError) {
            console.error(`Failed to update ${item.id}:`, updateError);
            failCount++;
        } else {
            successCount++;
            if (successCount % 10 === 0) {
                console.log(`Updated ${successCount}/${updates.length} records...`);
            }
        }
    }

    console.log(`\nCleanup complete!`);
    console.log(`- Successfully updated: ${successCount}`);
    console.log(`- Failed updates: ${failCount}`);
}

run();
