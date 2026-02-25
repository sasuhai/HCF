const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const records = [
    {
        state: 'Sabah - Kota Kinabalu',
        id_mualaf: 'MS26021',
        nama_mualaf: '',
        kawasan: 'ALAMESRA',
        tarikh_bantuan: '2026-01-11',
        bantuan_kewangan_spp: false,
        bantuan_tajaan: true,
        bantuan_kursus: false,
        bantuan_networking: false,
        bantuan_coaching: false,
        jumlah_kewangan_hcf: 0,
        catatan: 'SUMBANGAN RH KOTA KINABALU SEBANYAK RM400 UNTUK PEMBELIAN MESIN PENGHIRIS PISANG (KEREPEK PISANG)'
    },
    {
        state: 'WP Kuala Lumpur',
        id_mualaf: 'MW25074',
        nama_mualaf: 'NUR INTAN JULIA BINTI ABDULLAH',
        kawasan: '',
        tarikh_bantuan: '2026-02-07',
        bantuan_kewangan_spp: false,
        bantuan_tajaan: true,
        bantuan_kursus: true,
        bantuan_networking: true,
        bantuan_coaching: false,
        jumlah_kewangan_hcf: 2000,
        catatan: 'akan membawa beliau untuk berhubung dengan pegawai i-Tekad. Bisnes beliau telah masuk ke Lalaport. Peserta yang berjaya melalui Kursus Asas Keusahawanan WT dengan baik.'
    }
];

async function importBantuanPerniagaan() {
    console.log('Starting import for Bantuan Perniagaan...');

    const preparedData = records.map(rec => {
        const { state, ...data } = rec;
        return {
            category: 'bantuan_perniagaan',
            year: 2026,
            state: state,
            data: data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    });

    const { data, error } = await supabase
        .from('other_kpis')
        .insert(preparedData)
        .select();

    if (error) {
        console.error('Error importing records:', error);
    } else {
        console.log(`Successfully imported ${data.length} records.`);
    }
}

importBantuanPerniagaan();
