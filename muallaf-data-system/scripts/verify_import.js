const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const verify = async () => {
    console.log('🔍 Verifying imported data...');

    // Check count
    const { count, error: countError } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true });

    if (countError) {
        console.error('❌ Error getting count:', countError.message);
    } else {
        console.log(`✅ Total records in submissions: ${count}`);
    }

    // Check sample records for updatedAt
    const { data, error } = await supabase
        .from('submissions')
        .select('id, namaAsal, updatedAt, createdAt')
        .order('createdAt', { ascending: false })
        .limit(5);

    if (error) {
        console.error('❌ Error getting samples:', error.message);
    } else {
        console.log('✅ Sample records (newest first):');
        data.forEach(r => {
            console.log(`- ID: ${r.id}`);
            console.log(`  Name: ${r.namaAsal}`);
            console.log(`  Updated At (from CSV): ${r.updatedAt}`);
            console.log(`  Created At: ${r.createdAt}`);
            console.log('---');
        });
    }
};

verify();
