const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const INITIAL_SETTINGS = [
    { category: 'Outreach', perkara: 'Bil. Aktiviti Outreach', source: 'programs', config: { kpiName: 'Aktiviti Outreach' }, order_index: 10 },
    { category: 'Outreach', perkara: 'Bil. Aktiviti Outreach anjuran bersama GDM', source: 'programs', config: { anjuran: 'GDM' }, order_index: 20 },
    { category: 'Outreach', perkara: 'Bil. Syahadah di program outreach', source: 'programs', config: { field: 'kehadiran_syahadah' }, order_index: 30 },
    { category: 'Outreach', perkara: 'Bil. Engagement dengan Non Muslim', source: 'programs', config: { field: 'kehadiran_non_muslim' }, order_index: 40 },
    { category: 'Outreach', perkara: 'Bil. Quality Engagement', source: 'programs', config: { field: 'kehadiran_quality' }, order_index: 50 },
    { category: 'Outreach', perkara: 'Bil. Engagement Mad\'u 3 Bintang', source: 'programs', config: { field: 'kehadiran_madu' }, order_index: 60 },
    { category: 'Outreach', perkara: 'Bil. Pengislaman (Keseluruhan)', source: 'submissions', config: { isPengislaman: true }, order_index: 70 },
    { category: 'Outreach', perkara: 'Bil. Pengislaman oleh Duat Kualiti', source: 'submissions', config: { isDuatKualiti: true }, order_index: 80 },
    { category: 'Outreach', perkara: 'Bil. Pengislaman Lain-lain', source: 'submissions', config: { isPengislaman: false }, order_index: 90 },
    { category: 'Outreach', perkara: 'Bil. Syahadah Dibantu dan Disusuli oleh HCF', source: 'submissions', config: { isFollowedUp: true }, order_index: 100 },
    { category: 'Outreach', perkara: 'Bil. Mad\'u 3 Bintang direkodkan', source: 'other_kpis', config: { kpiName: 'Mad\'u 3 Bintang' }, order_index: 110 },
    { category: 'Outreach', perkara: 'Bil. Organisasi Non-muslim dibina hubungan', source: 'other_kpis', config: { kpiName: 'Organisasi Non-muslim' }, order_index: 120 },

    { category: 'Mualaf', perkara: '% Mualaf Bersyahadah Disusuli 100%', source: 'calc', config: { type: 'ratio', numerator: 'Bil. Syahadah Disusuli 100%', denominator: 'Bil. Syahadah (Keseluruhan)' }, order_index: 200 },
    { category: 'Mualaf', perkara: 'Bil. Mualaf Bersyahadah Disusuli 100%', source: 'other_kpis', config: { kpiName: 'Mualaf Disusuli 100%' }, order_index: 210 },
    { category: 'Mualaf', perkara: 'Bil Masjid/Surau Baharu dibina hubungan', source: 'other_kpis', config: { kpiName: 'Masjid/Surau Baharu' }, order_index: 220 },
    { category: 'Mualaf', perkara: 'Bil. Mualaf Diperkasa Perniagaan', source: 'other_kpis', config: { kpiName: 'Mualaf Diperkasa Perniagaan' }, order_index: 230 },
    { category: 'Mualaf', perkara: 'Bil. Mualaf Diperkasa Pengajian Tinggi', source: 'other_kpis', config: { kpiName: 'Mualaf Diperkasa Pengajian Tinggi' }, order_index: 240 },
    { category: 'Mualaf', perkara: 'Bil. Mualaf Dibantu Kewangan', source: 'other_kpis', config: { kpiName: 'Mualaf Dibantu Kewangan' }, order_index: 250 },
    { category: 'Mualaf', perkara: 'Bil. KBM (Kelas)', source: 'attendance', config: { type: 'class_count' }, order_index: 260 },
    { category: 'Mualaf', perkara: 'Bil. Mualaf hadir KBM (Peserta)', source: 'attendance', config: { type: 'student_count' }, order_index: 270 },
    { category: 'Mualaf', perkara: 'Bil. Mualaf hadir KBM melalui penilaian', source: 'other_kpis', config: { kpiName: 'Mualaf KBM Penilaian' }, order_index: 280 },

    { category: 'PDS/Pasukan RH', perkara: 'Bil. Pasukan RH Baru', source: 'other_kpis', config: { tab: 'pasukan_rh', is_baru: true }, order_index: 300 },
    { category: 'PDS/Pasukan RH', perkara: 'Bil. Pasukan RH Sedia Ada', source: 'other_kpis', config: { tab: 'pasukan_rh', is_baru: false }, order_index: 310 },
    { category: 'PDS/Pasukan RH', perkara: 'Bil. RH Aktif (Individu)', source: 'other_kpis', config: { tab: 'rh_aktif', status_rh_aktif: true }, order_index: 320 },
    { category: 'PDS/Pasukan RH', perkara: 'Bil. Bakal Duat Dilatih', source: 'other_kpis', config: { tab: 'peserta_latihan' }, order_index: 330 },

    { category: 'Umum', perkara: 'Bil. Kawasan IKRAM Kerjasama', source: 'other_kpis', config: { tab: 'ikram' }, order_index: 400 },
];

async function initialize() {
    console.log('Initializing KPI Settings table...');

    // 1. Create table via RPC or just assumed to be created via manual SQL
    // Since I can't run DDL easily, I'll just try to insert and hope for the best, 
    // or I'll provide the SQL separately for the user to run if it fails.

    const { error: checkError } = await supabase.from('kpi_settings').select('id').limit(1);

    if (checkError && checkError.code === '42P01') {
        console.log('Table kpi_settings does not exist. Please run the SQL migration first.');
        process.exit(1);
    }

    const { data: existing } = await supabase.from('kpi_settings').select('perkara');
    const existingPerkara = new Set(existing?.map(e => e.perkara) || []);

    const toInsert = INITIAL_SETTINGS.filter(s => !existingPerkara.has(s.perkara));

    if (toInsert.length > 0) {
        console.log(`Inserting ${toInsert.length} settings...`);
        const { error: insertError } = await supabase.from('kpi_settings').insert(toInsert);
        if (insertError) {
            console.error('Error inserting settings:', insertError);
        } else {
            console.log('Successfully initialized kpi_settings.');
        }
    } else {
        console.log('Table already initialized.');
    }
}

initialize();
