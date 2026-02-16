const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const updateAndVerify = async () => {
    // 1. Check counts before
    const { count: pengislamanOld } = await supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('kategori', 'PENGISLAMAN');
    const { count: sokonganOld } = await supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('kategori', 'SOKONGAN');

    console.log(`PENGISLAMAN count before: ${pengislamanOld}`);
    console.log(`SOKONGAN count before: ${sokonganOld}`);

    if (pengislamanOld > 0) {
        await supabase.from('submissions').update({ kategori: 'Pengislaman' }).eq('kategori', 'PENGISLAMAN');
        console.log('Updated PENGISLAMAN');
    }

    if (sokonganOld > 0) {
        await supabase.from('submissions').update({ kategori: 'Sokongan' }).eq('kategori', 'SOKONGAN');
        console.log('Updated SOKONGAN');
    }

    // 2. Check counts after
    const { count: pengislamanNew } = await supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('kategori', 'Pengislaman');
    const { count: sokonganNew } = await supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('kategori', 'Sokongan');
    const { count: pengislamanUpper } = await supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('kategori', 'PENGISLAMAN');
    const { count: sokonganUpper } = await supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('kategori', 'SOKONGAN');

    console.log(`Pengislaman count after: ${pengislamanNew}`);
    console.log(`Sokongan count after: ${sokonganNew}`);
    console.log(`Remaining PENGISLAMAN: ${pengislamanUpper}`);
    console.log(`Remaining SOKONGAN: ${sokonganUpper}`);
};

updateAndVerify();
