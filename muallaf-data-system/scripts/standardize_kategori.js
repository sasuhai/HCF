const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const standardizeKategori = async () => {
    console.log('🔄 Checking kategori values...');

    // Get unique categories
    const { data, error: fetchError } = await supabase
        .from('submissions')
        .select('kategori');

    if (fetchError) {
        console.error('❌ Error fetching categories:', fetchError.message);
        return;
    }

    const uniqueCats = [...new Set(data.map(d => d.kategori))];
    console.log('Current unique categories:', uniqueCats);

    const updates = [
        { from: 'PENGISLAMAN', to: 'Pengislaman' },
        { from: 'SOKONGAN', to: 'Sokongan' }
    ];

    for (const update of updates) {
        console.log(`📝 Updating ${update.from} -> ${update.to}...`);
        const { error, count } = await supabase
            .from('submissions')
            .update({ kategori: update.to })
            .eq('kategori', update.from)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error(`❌ Error updating ${update.from}:`, error.message);
        } else {
            console.log(`✅ Successfully updated ${count} records.`);
        }
    }

    console.log('✨ Casing standardization complete.');
};

standardizeKategori();
