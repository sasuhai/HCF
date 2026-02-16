const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const syncBanks = async () => {
    console.log('🔍 Checking submissions for unique bank names...');

    // Get unique banks from submissions
    const { data: submissions, error: subError } = await supabase
        .from('submissions')
        .select('bank')
        .not('bank', 'is', null)
        .eq('status', 'active');

    if (subError) {
        console.error('❌ Error fetching submissions:', subError.message);
        return;
    }

    const uniqueBanks = new Set();
    submissions.forEach(s => {
        if (s.bank) {
            const b = s.bank.trim().toUpperCase();
            if (b && b !== '-' && b !== '.') {
                uniqueBanks.add(b);
            }
        }
    });

    console.log(`📊 Found ${uniqueBanks.size} unique banks in submissions.`);

    // Get existing banks
    const { data: existingBanks } = await supabase.from('banks').select('name');
    const existingNames = new Set(existingBanks?.map(b => b.name.toUpperCase()) || []);

    const toInsert = Array.from(uniqueBanks)
        .filter(b => !existingNames.has(b))
        .map(b => ({ name: b }));

    if (toInsert.length > 0) {
        console.log(`➕ Adding ${toInsert.length} missing banks...`);
        let success = 0;
        for (const bank of toInsert) {
            const { error } = await supabase.from('banks').insert(bank);
            if (!error) {
                success++;
            } else {
                console.error(`❌ Error adding ${bank.name}:`, error.message);
            }
        }
        console.log(`✅ Successfully added ${success} banks.`);
    } else {
        console.log('✅ Bank lookup table is already up to date.');
    }
};

syncBanks();
