const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { count, error } = await supabase
        .from('programs')
        .select('*', { count: 'exact', head: true })
        .eq('tahun', 2026)
        .gte('createdAt', tenMinutesAgo);

    if (error) {
        console.error("Error counting records:", error);
    } else {
        console.log(`Recently inserted records for 2026: ${count}`);
    }

    const { data: states, error: stateError } = await supabase
        .from('programs')
        .select('negeri')
        .eq('tahun', 2026)
        .gte('createdAt', tenMinutesAgo);

    if (stateError) {
        console.error("Error fetching states:", stateError);
    } else {
        const uniqueStates = [...new Set(states.map(s => s.negeri))];
        console.log("States included:", uniqueStates.join(', '));
        if (uniqueStates.includes('Selangor')) {
            console.error("ERROR: Selangor data found!");
        } else {
            console.log("SUCCESS: No Selangor data found.");
        }
    }
}

verify();
