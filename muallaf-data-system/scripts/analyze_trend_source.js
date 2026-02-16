const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const analyzeTrendSource = async () => {
    console.log('🔍 Analyzing date fields for trend accuracy...');

    // Fetch a sample of records
    const { data: records, error } = await supabase
        .from('submissions')
        .select('createdAt, tarikhPengislaman')
        .eq('status', 'active');

    if (error) {
        console.error('❌ Error fetching data:', error);
        return;
    }

    const createdAtCounts = {};
    const pengislamanCounts = {};

    const getMonth = (d) => {
        if (!d) return 'null';
        const date = new Date(d);
        if (isNaN(date.getTime())) return 'invalid';
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    };

    records.forEach(r => {
        const cKey = getMonth(r.createdAt);
        const pKey = getMonth(r.tarikhPengislaman);

        createdAtCounts[cKey] = (createdAtCounts[cKey] || 0) + 1;
        pengislamanCounts[pKey] = (pengislamanCounts[pKey] || 0) + 1;
    });

    console.log('\n📅 Distribution by createdAt (Registration Date):');
    Object.entries(createdAtCounts).sort().slice(-12).forEach(([month, count]) => {
        console.log(`${month}: ${count}`);
    });

    console.log('\n☪️  Distribution by tarikhPengislaman (Date of Conversion):');
    Object.entries(pengislamanCounts).sort().slice(-12).forEach(([month, count]) => {
        console.log(`${month}: ${count}`);
    });
};

analyzeTrendSource();
