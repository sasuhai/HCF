const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const checkAllYearDistribution = async () => {
    let allRecords = [];
    let page = 0;
    while (true) {
        const { data } = await supabase.from('submissions').select('createdAt').range(page * 1000, (page + 1) * 1000 - 1);
        if (!data || data.length === 0) break;
        allRecords = allRecords.concat(data);
        page++;
    }

    const years = {};
    allRecords.forEach(r => {
        if (!r.createdAt) return;
        const year = r.createdAt.substring(0, 4);
        years[year] = (years[year] || 0) + 1;
    });
    console.log('Total Records Analyzed:', allRecords.length);
    console.log('Yearly Distribution of createdAt:', years);
};

checkAllYearDistribution();
