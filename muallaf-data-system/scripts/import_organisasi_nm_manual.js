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

const rawData = [
    ["Perlis", "1", "TOKONG SAYUR KANGAR", "YEO SEE KEOW", "012-4148833", "PENGERUSI TOKONG", "KANGAR"],
    ["WP Kuala Lumpur", "1", "asdasd", "112331", "", "", ""],
    ["Kelantan", "1", "asdasd", "112331", "", "", ""],
    ["WP Labuan", "1", "asdasd", "112331", "", "", ""],
    ["Negeri Sembilan", "1", "Negeri Sembilan Chinese Assembly Hall (NSCAH)", "", "", "", ""],
    ["Melaka", "1", "Akademi Pengajian Cheng Ho Antarabangsa", "Mr. Kent", "", "", "Melaka Tengah"],
    ["Terengganu", "1", "asdasd", "112331", "", "", ""],
    ["Sabah - Kota Kinabalu", "1", "ROMAN CATHOLIC ARCHDIOCESE", "LINDA", "016-8315452", "", "ALAMESRA"],
    ["Sabah - Kota Marudu", "1", "asdasd", "112331", "", "", ""],
    ["Sabah - Papar", "1", "asdasd", "112331", "", "", ""],
    ["Sabah - Bundu Tuhan", "1", "asdasd", "112331", "", "", ""],
    ["Sabah - Pagalungan", "1", "asdasd", "112331", "", "", ""],
    ["Sabah - Beluran", "1", "asdasd", "112331", "", "", ""],
    ["Sarawak - Kuching", "1", "asdasd", "112331", "", "", ""],
    ["Sarawak - Kota Samarahan", "1", "asdasd", "112331", "", "", ""],
    ["Sarawak - Sibu", "1", "asdasd", "112331", "", "", ""],
    ["WP Kuala Lumpur", "2", "asdasd", "14355", "", "", ""],
    ["Kelantan", "2", "asdasd", "14355", "", "", ""],
    ["WP Labuan", "2", "asdasd", "14355", "", "", ""],
    ["Negeri Sembilan", "2", "Seremban Visitation Church", "Father Xavier Andrew", "", "", ""],
    ["Terengganu", "2", "asdasd", "14355", "", "", ""],
    ["Sabah - Kota Kinabalu", "2", "SUIDCP", "LIM HOCK SONG", "017-8120688", "", "PENAMPANG"],
    ["Sabah - Kota Marudu", "2", "asdasd", "14355", "", "", ""],
    ["Sabah - Papar", "2", "asdasd", "14355", "", "", ""],
    ["Sabah - Bundu Tuhan", "2", "asdasd", "14355", "", "", ""],
    ["Sabah - Pagalungan", "2", "asdasd", "14355", "", "", ""],
    ["Sabah - Beluran", "2", "asdasd", "14355", "", "", ""],
    ["Sarawak - Kuching", "2", "asdasd", "14355", "", "", ""],
    ["Sarawak - Kota Samarahan", "2", "asdasd", "14355", "", "", ""],
    ["Sarawak - Sibu", "2", "asdasd", "14355", "", "", ""],
    ["Negeri Sembilan", "3", "Gudhwara Sahib", "Delwill Singh", "", "", ""],
    ["Sabah - Kota Kinabalu", "3", "GUDWARA SAHIB", "AMARJIT KAUR", "012-8202797", "", "ALAMESRA"],
    ["Sabah - Kota Kinabalu", "4", "PERSATUAN BUDDHA SAKHYA KOTA KINABALU", "HUI ZHI", "016-3096957", "", "PENAMPANG"],
    ["Sabah - Kota Kinabalu", "5", "GEREJA BASEL INANAM", "PASTOR TINA KONG", "014-6749198", "", "ALAMESRA"]
];

async function importOrganisasiNM() {
    console.log('Starting import for Organisasi NM...');

    const preparedData = rawData.map(row => {
        return {
            category: 'organisasi_nm',
            year: 2026,
            state: row[0],
            data: {
                bil: row[1],
                nama_organisasi: row[2],
                contact_person: row[3],
                no_tel: row[4],
                catatan: row[5],
                kawasan: row[6]
            },
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

importOrganisasiNM();
