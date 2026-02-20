const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const programs = [
    {
        negeri: 'Selangor',
        tahun: 2026,
        bulan: 2,
        status_program: 'Done',
        nama_program: 'Perjumpaan dengan Tuan Armadajaya',
        tarikh_mula: '2026-02-02',
        masa_mula: '13:30:00',
        masa_tamat: '15:30:00',
        tempat: 'ArmaKhairi Food Sdn Bhd Bandar Teknologi Kajang',
        kawasan_cawangan: [],
        jenis_program: ['Kunjungan Hormat'],
        kategori_utama: 'Pengurusan',
        sub_kategori: ['Pengurusan'],
        kehadiran_rh: 4,
        kehadiran_keseluruhan: 5,
        anjuran: ['Staf Negeri', 'HQ'],
        link_facebook: 'https://www.facebook.com/share/p/187b7RD59F/'
    },
    {
        negeri: 'Selangor',
        tahun: 2026,
        bulan: 2,
        status_program: 'Done',
        nama_program: 'Mosque Tour Mingguan',
        tarikh_mula: '2026-02-01',
        masa_mula: '09:30:00',
        masa_tamat: '11:00:00',
        tempat: 'Masjid Kota Kemuning',
        kawasan_cawangan: ['Shah Alam'],
        jenis_program: ['Masjid Open Day / Masjid Tour'],
        kategori_utama: 'Outreach',
        sub_kategori: ['Outreach'],
        kehadiran_rh: 5,
        kehadiran_non_muslim: 3,
        kehadiran_quality: 3,
        kehadiran_keseluruhan: 8,
        anjuran: ['RH'],
        link_facebook: 'https://www.facebook.com/share/p/17tHwYCB6k/'
    },
    {
        negeri: 'Selangor',
        tahun: 2026,
        bulan: 2,
        status_program: 'Done',
        nama_program: 'Majlis Pengislaman JAAFAR KAKAMBA',
        tarikh_mula: '2026-02-06',
        masa_mula: '12:00:00',
        tempat: 'Pejabat HCF HQ',
        jenis_program: ['Majlis Pengislaman'],
        kategori_utama: 'Outreach',
        sub_kategori: ['Outreach'],
        kehadiran_rh: 3,
        kehadiran_non_muslim: 1,
        kehadiran_syahadah: 1,
        kehadiran_keseluruhan: 4,
        anjuran: ['HQ']
    },
    {
        negeri: 'Selangor',
        tahun: 2026,
        bulan: 2,
        status_program: 'Done',
        nama_program: 'Majlis Pengislaman SABRI NIZAM',
        tarikh_mula: '2026-02-08',
        masa_mula: '13:30:00',
        tempat: 'Pejabat HCF Selangor',
        jenis_program: ['Majlis Pengislaman'],
        kategori_utama: 'Outreach',
        sub_kategori: ['Outreach'],
        kehadiran_rh: 3,
        kehadiran_non_muslim: 1,
        kehadiran_syahadah: 1,
        kehadiran_keseluruhan: 4,
        anjuran: ['Staf Negeri']
    },
    {
        negeri: 'Selangor',
        tahun: 2026,
        bulan: 2,
        status_program: 'Done',
        nama_program: 'Majlis Pengislaman KEVIN MUHAMMAD',
        tarikh_mula: '2026-02-10',
        masa_mula: '11:00:00',
        tempat: 'Pejabat HCF Selangor',
        jenis_program: ['Majlis Pengislaman'],
        kategori_utama: 'Outreach',
        sub_kategori: ['Outreach'],
        kehadiran_rh: 4,
        kehadiran_non_muslim: 1,
        kehadiran_syahadah: 1,
        kehadiran_keseluruhan: 5,
        anjuran: ['Staf Negeri']
    },
    {
        negeri: 'Selangor',
        tahun: 2026,
        bulan: 2,
        status_program: 'Done',
        nama_program: 'Majlis Pengislaman ELEDO GOLDEN CHIBUEZE',
        tarikh_mula: '2026-02-10',
        masa_mula: '13:00:00',
        tempat: 'Pejabat HCF Selangor',
        jenis_program: ['Majlis Pengislaman'],
        kategori_utama: 'Outreach',
        sub_kategori: ['Outreach'],
        kehadiran_rh: 4,
        kehadiran_non_muslim: 1,
        kehadiran_syahadah: 1,
        kehadiran_keseluruhan: 5,
        anjuran: ['Staf Negeri']
    },
    {
        negeri: 'Selangor',
        tahun: 2026,
        bulan: 2,
        status_program: 'Done',
        nama_program: 'Majlis Pengislaman AMINTHARA',
        tarikh_mula: '2026-02-11',
        masa_mula: '13:00:00',
        tempat: 'Pejabat HCF Selangor',
        jenis_program: ['Majlis Pengislaman'],
        kategori_utama: 'Outreach',
        sub_kategori: ['Outreach'],
        kehadiran_rh: 4,
        kehadiran_non_muslim: 1,
        kehadiran_syahadah: 1,
        kehadiran_keseluruhan: 5,
        anjuran: ['Staf Negeri']
    },
    {
        negeri: 'Selangor',
        tahun: 2026,
        bulan: 2,
        status_program: 'Done',
        nama_program: 'Majlis Pengislaman Venoj',
        tarikh_mula: '2026-02-13',
        masa_mula: '11:30:00',
        tempat: 'MABAS',
        jenis_program: ['Majlis Pengislaman'],
        kategori_utama: 'Outreach',
        sub_kategori: ['Outreach'],
        kehadiran_rh: 5,
        kehadiran_non_muslim: 1,
        kehadiran_syahadah: 1,
        kehadiran_keseluruhan: 15,
        anjuran: ['Staf Negeri']
    },
    {
        negeri: 'Selangor',
        tahun: 2026,
        bulan: 2,
        status_program: 'Done',
        nama_program: 'PROGRAM MUHIBBAH CHINESE NEW YEAR 2026',
        tarikh_mula: '2026-02-12',
        masa_mula: '09:00:00',
        tempat: 'Anjung De Surau, Musolla Hj Yusof',
        kawasan_cawangan: ['Kuala Selangor'],
        jenis_program: ['Perayaan Harmoni (Gawai/CNY/ tadau dll)'],
        kategori_utama: 'Outreach',
        sub_kategori: ['Outreach'],
        kehadiran_rh: 18,
        kehadiran_non_muslim: 17,
        kehadiran_quality: 17,
        kehadiran_syahadah: 5,
        kehadiran_keseluruhan: 36,
        anjuran: ['RH', 'Lain-lain'],
        link_facebook: 'https://www.facebook.com/share/p/189TmHVRmF/'
    },
    {
        negeri: 'Selangor',
        tahun: 2026,
        bulan: 2,
        status_program: 'Done',
        nama_program: 'Majlis Pengislaman SUZIE BINTI MAY ALLAGAN',
        tarikh_mula: '2026-02-19',
        masa_mula: '12:30:00',
        tempat: 'Pejabat HCF Selangor',
        jenis_program: ['Majlis Pengislaman'],
        kategori_utama: 'Outreach',
        sub_kategori: ['Outreach'],
        kehadiran_rh: 3,
        kehadiran_syahadah: 1,
        kehadiran_keseluruhan: 4,
        anjuran: ['Staf Negeri']
    },
    {
        negeri: 'Selangor',
        tahun: 2026,
        bulan: 2,
        status_program: 'Done',
        nama_program: 'Majlis Pengislaman MATTHEW THOMAS WARDLE',
        tarikh_mula: '2026-02-15',
        masa_mula: '10:30:00',
        tempat: 'SEKSYEN 9 SHAH ALAM',
        jenis_program: ['Majlis Pengislaman'],
        kategori_utama: 'Outreach',
        sub_kategori: ['Outreach'],
        kehadiran_rh: 3,
        kehadiran_syahadah: 1,
        kehadiran_keseluruhan: 4,
        anjuran: ['Staf Negeri', 'RH']
    },
    {
        negeri: 'Selangor',
        tahun: 2026,
        bulan: 2,
        status_program: 'Done',
        nama_program: 'Mosque Tour Mingguan',
        tarikh_mula: '2026-02-08',
        masa_mula: '09:30:00',
        masa_tamat: '11:00:00',
        tempat: 'Masjid Kota Kemuning',
        kawasan_cawangan: ['Shah Alam'],
        jenis_program: ['Masjid Open Day / Masjid Tour'],
        kategori_utama: 'Outreach',
        sub_kategori: ['Outreach'],
        kehadiran_rh: 24,
        kehadiran_quality: 1,
        kehadiran_keseluruhan: 25,
        anjuran: ['RH', 'Lain-lain'],
        link_facebook: 'https://www.facebook.com/share/p/14SNzh64Nq3/'
    },
    {
        negeri: 'Selangor',
        tahun: 2026,
        bulan: 2,
        status_program: 'Done',
        nama_program: 'Mosque Tour Mingguan',
        tarikh_mula: '2026-02-15',
        masa_mula: '09:30:00',
        masa_tamat: '11:00:00',
        tempat: 'Masjid Kota Kemuning',
        kawasan_cawangan: ['Shah Alam'],
        jenis_program: ['Masjid Open Day / Masjid Tour'],
        kategori_utama: 'Outreach',
        sub_kategori: ['Outreach'],
        kehadiran_rh: 3,
        kehadiran_quality: 2,
        kehadiran_keseluruhan: 5,
        anjuran: ['RH', 'Lain-lain'],
        link_facebook: 'https://www.facebook.com/share/p/1GDZsJSn8b/'
    },
    {
        negeri: 'Selangor',
        tahun: 2026,
        bulan: 2,
        status_program: 'Done',
        nama_program: 'Sumbangan Bakul Ramadan TNB',
        tarikh_mula: '2026-02-13',
        masa_mula: '10:00:00',
        masa_tamat: '11:30:00',
        tempat: 'Masjid Abu Bakar As-Siddiq SS19, Subang Jaya',
        kawasan_cawangan: ['Petaling Jaya'],
        jenis_program: ['Mualaf'],
        kategori_utama: 'Mualaf',
        sub_kategori: ['Mualaf'],
        kehadiran_rh: 5,
        kehadiran_daie: 0,
        kehadiran_non_muslim: 0,
        kehadiran_quality: 0,
        kehadiran_madu: 0,
        kehadiran_syahadah: 0,
        kehadiran_muallaf: 24,
        kehadiran_keseluruhan: 29,
        anjuran: ['Staf Negeri', 'Lain-lain']
    }
];

async function importData() {
    console.log(`Starting import of ${programs.length} programs...`);

    for (const program of programs) {
        const { error } = await supabase.from('programs').insert([program]);
        if (error) {
            console.error(`Error inserting "${program.nama_program}":`, error.message);
        } else {
            console.log(`Successfully inserted: "${program.nama_program}"`);
        }
    }

    console.log('Import completed.');
}

importData();
