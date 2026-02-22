const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const monthMap = { 'JANUARI': 1, 'FEBRUARI': 2, 'MAC': 3, 'APRIL': 4, 'MEI': 5, 'JUN': 6, 'JULAI': 7, 'OGOS': 8, 'SEPTEMBER': 9, 'OKTOBER': 10, 'NOVEMBER': 11, 'DISEMBER': 12 };
const monthShortMap = { 'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12' };

function parseDate(str) {
    if (!str) return null;
    const parts = str.trim().split(' ');
    if (parts.length === 3) {
        return `${parts[2]}-${monthShortMap[parts[1]] || '01'}-${parts[0].padStart(2, '0')}`;
    }
    return null;
}

function parseTime(str) {
    if (!str) return null;
    str = str.trim();
    if (str.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) return str;
    const match = str.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
    if (match) {
        let h = parseInt(match[1]);
        if (match[3].toLowerCase() === 'pm' && h < 12) h += 12;
        if (match[3].toLowerCase() === 'am' && h === 12) h = 0;
        return `${h.toString().padStart(2, '0')}:${match[2]}:00`;
    }
    return null;
}

async function run() {
    const data = fs.readFileSync(path.join(__dirname, 'data_to_import.tsv'), 'utf8');
    const stateMapping = { 'WP Kuala Lumpur': 'Kuala Lumpur', 'WP Labuan': 'Sabah - Labuan' };

    const records = data.split('\n')
        .map(line => line.split('\t'))
        .filter(p => p.length > 1 && p[1] && p[1].trim() !== 'Selangor' && p[1].trim() !== '')
        .map(p => ({
            negeri: stateMapping[p[1].trim()] || p[1].trim(),
            tahun: 2026,
            bulan: monthMap[p[0]] || 1,
            status_program: p[2],
            nama_program: p[3],
            tarikh_mula: parseDate(p[4]),
            tarikh_tamat: parseDate(p[5]),
            masa_mula: parseTime(p[6]),
            masa_tamat: parseTime(p[7]),
            tempat: p[8],
            kawasan_cawangan: p[9] ? [p[9]] : [],
            jenis_program: p[10] ? [p[10]] : [],
            kategori_utama: p[11],
            sub_kategori: (p[12] || '').split(',').map(s => s.trim()).filter(s => s),
            kehadiran_rh: parseInt(p[13]) || 0,
            kehadiran_daie: parseInt(p[14]) || 0,
            kehadiran_non_muslim: parseInt(p[15]) || 0,
            kehadiran_quality: parseInt(p[16]) || 0,
            kehadiran_madu: parseInt(p[17]) || 0,
            kehadiran_syahadah: parseInt(p[18]) || 0,
            kehadiran_muallaf: parseInt(p[19]) || 0,
            kehadiran_keseluruhan: parseInt(p[20]) || 0,
            anjuran: (p[21] || '').split(',').map(s => s.trim()).filter(s => s),
            kawasan_ikram: p[22],
            link_facebook: p[23],
            catatan_1: p[24],
            catatan_2: p[25],
            selesai_laporan: (p[26] || '').toUpperCase() === 'TRUE'
        }));

    console.log(`Inserting ${records.length} records...`);
    // Insert in batches of 100 to avoid large payload errors
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error } = await supabase.from('programs').insert(batch);
        if (error) {
            console.error(`Error in batch ${i / batchSize + 1}:`, error);
            break;
        }
    }
    console.log("Done!");
}
run();
