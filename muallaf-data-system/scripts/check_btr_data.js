const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const checkBandarTunRazak = async () => {
    console.log('🔍 Diagnosing data for "Bandar Tun Razak"...');

    // 1. Check direct match
    const { count: exactCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('lokasi', 'BCF Bandar Tun Razak');

    console.log(`Exact match "BCF Bandar Tun Razak": ${exactCount}`);

    // 2. Check case insensitive or fuzzy match
    const { data: variations } = await supabase
        .from('submissions')
        .select('lokasi, count')
        .ilike('lokasi', '%Bandar Tun Razak%');

    console.log('\nFuzzy matches for "%Bandar Tun Razak%":');
    const locMap = {};
    variations?.forEach(v => {
        locMap[v.lokasi] = (locMap[v.lokasi] || 0) + 1;
    });
    console.log(locMap);

    // 3. Check records with NULL lokasi
    const { count: nullLocCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .is('lokasi', null);

    console.log(`\nRecords with NULL lokasi: ${nullLocCount}`);

    // 4. Try to find by negeri
    const { count: klCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('negeriCawangan', 'W.Persekutuan Kuala Lumpur');

    console.log(`Records in W.Persekutuan Kuala Lumpur: ${klCount}`);

    // 5. Look for sample records that SHOULD be in BTR but are not
    console.log('\nTop 5 unique lokasi values currently in database:');
    const { data: topLocs } = await supabase.rpc('get_unique_lokasi_counts'); // If RPC exists, otherwise select unique
    if (!topLocs) {
        const { data: sampleLocs } = await supabase.from('submissions').select('lokasi').limit(1000);
        const sMap = {};
        sampleLocs.forEach(s => { sMap[s.lokasi] = (sMap[s.lokasi] || 0) + 1 });
        console.log(Object.entries(sMap).sort((a, b) => b[1] - a[1]).slice(0, 10));
    }
};

checkBandarTunRazak();
