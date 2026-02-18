const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CSV_FILE_PATH = '/Users/sasuhai/Desktop/HCFBTR/spo2025.csv';

const monthMap = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
    'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
};

const parseDate = (dateStr) => {
    if (!dateStr) return null;
    let trimmed = dateStr.toString().trim();
    if (!trimmed) return null;

    if (trimmed.includes('T')) return trimmed;

    const parts = trimmed.split(/[\/\-\s]+/).filter(p => p.length > 0);
    if (parts.length < 3) return null;

    const now = new Date();

    // Extract year
    let yearStr = parts[2].replace(/\D/g, '');
    if (yearStr.length === 2) yearStr = '20' + yearStr;
    if (yearStr.length > 4) yearStr = yearStr.substring(0, 4);
    const y = parseInt(yearStr);
    if (isNaN(y)) return null;

    let m, d;

    if (isNaN(parts[1])) {
        m = parseInt(monthMap[parts[1]] || monthMap[parts[1].substring(0, 3)]);
        d = parseInt(parts[0].replace(/\D/g, ''));

        if (isNaN(m) || isNaN(d)) return null;

        let testDate = new Date(y, m - 1, d);
        if (testDate > now && d <= 12) {
            let testOpposite = new Date(y, d - 1, m);
            if (testOpposite <= now) {
                const temp = m;
                m = d;
                d = temp;
            }
        }
    } else {
        let p0 = parseInt(parts[0].replace(/\D/g, ''));
        let p1 = parseInt(parts[1].replace(/\D/g, ''));
        if (isNaN(p0) || isNaN(p1)) return null;

        if (p0 > 12) {
            m = p1; d = p0;
        } else if (p1 > 12) {
            m = p0; d = p1;
        } else {
            m = p0; d = p1;
            let testDate = new Date(y, m - 1, d);
            if (testDate > now) {
                let testOpposite = new Date(y, d - 1, m);
                if (testOpposite <= now) {
                    m = p1; d = p0;
                }
            }
        }
    }

    if (isNaN(m) || isNaN(d) || m < 1 || m > 12 || d < 1 || d > 31) return null;

    let time = '00:00:00.000Z';
    const timeMatch = trimmed.match(/(\d{1,2}:\d{1,2}:\d{1,2})/);
    if (timeMatch) {
        const [hh, mm, ss] = timeMatch[1].split(':');
        time = `${hh.padStart(2, '0')}:${mm.padStart(2, '0')}:${ss.padStart(2, '0')}.000Z`;
    }

    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${time}`;
};

const clean = (val) => {
    if (val === undefined || val === null) return null;
    let s = val.toString().replace(/[\u00A0]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!s) return null;

    // 1. Detect and expand scientific notation (e.g., 9.70717E+11)
    // This often happens when Excel saves long numbers as strings.
    if (/^[0-9.]+[Ee]\+[0-9]+$/.test(s)) {
        const num = Number(s);
        if (!isNaN(num)) {
            s = num.toFixed(0);
        }
    }

    // 2. Healing truncated leading zeros
    // Normal Malaysian IC is 12 digits. Excel often strips the leading '0'.
    // Phone numbers often strip the leading '0' as well (e.g., 161234567 -> 0161234567).
    if (/^\d{8,11}$/.test(s)) {
        s = '0' + s;
    }

    return s;
};

const cleanNum = (val) => {
    if (!val) return null;
    let s = val.toString().replace(/[^0-9.]/g, '');
    return s ? parseFloat(s) : null;
};

const mapRecord = (row) => {
    const toSentenceCase = (val) => {
        if (!val) return null;
        const cleaned = clean(val);
        if (!cleaned) return null;
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
    };

    const res = {
        negeriCawangan: clean(row['NegeriCawangan']),
        kategori: toSentenceCase(row['Kategori']), // Standardize to Pengislaman/Sokongan
        noStaf: clean(row['nostaf']),
        namaIslam: clean(row['NamaIslam']),
        namaAsal: clean(row['NamaAsal']),
        noKP: clean(row['NoKP']),
        jantina: toSentenceCase(row['Jantina']),
        bangsa: toSentenceCase(row['Bangsa']),
        agamaAsal: clean(row['AgamaAsal']),
        umur: cleanNum(row['Umur']),
        warganegara: clean(row['Warganegara']),
        noTelefon: clean(row['NoTelefon']),
        alamatTinggal: clean(row['AlamatTinggal']),
        alamatTetap: clean(row['AlamatTetap']),
        pekerjaan: clean(row['Pekerjaan']),
        pendapatanBulanan: cleanNum(row['PendapatanBulanan']),
        tahapPendidikan: clean(row['TahapPendidikan']),
        tarikhPengislaman: parseDate(clean(row['TarikhPengislaman'])),
        masaPengislaman: clean(row['MasaPengislaman']),
        tempatPengislaman: clean(row['TempatPengislaman']),
        negeriPengislaman: clean(row['NegeriPengislaman']),
        catatan: clean(row['catatan']),
        namaPegawaiMengislamkan: clean(row['Nama Pegawai Yang Mengislamkan']),
        noKPPegawaiMengislamkan: clean(row['No. Kad Pengenalan Pegawai Yang Mengislamkan']),
        noTelPegawaiMengislamkan: clean(row['No Telefon Pegawai Yang Mengislamkan']),
        namaSaksi1: clean(row['Nama Saksi 1']),
        noKPSaksi1: clean(row['No Kad Pengenalan Saksi 1']),
        noTelSaksi1: clean(row['No Telefon Saksi 1']),
        namaSaksi2: clean(row['Nama Saksi 2']),
        noKPSaksi2: clean(row['No Kad Pengenalan Saksi 2']),
        noTelSaksi2: clean(row['No Telefon Saksi 2']),
        maklumatKenalanPengiring: clean(row['Maklumat Kenalan/Pengiring']),
        bank: clean(row['Bank']),
        noAkaun: clean(row['No Akaun']),
        namaDiBank: clean(row['Nama di Bank']),
        gambarIC: row['Gambar IC/ Passport'] ? { url: row['Gambar IC/ Passport'] } : null,
        gambarKadIslam: row['Gambar Kad Islam'] ? { url: row['Gambar Kad Islam'] } : null,
        gambarMualaf: row['Gambar Mualaf'] ? { url: row['Gambar Mualaf'] } : null,
        gambarSesiPengislaman: row['Gambar Sesi Pengislaman'] ? { url: row['Gambar Sesi Pengislaman'] } : null,
        dokumenLain1: row['Gambar / Dokumen Lain 1'] ? { url: row['Gambar / Dokumen Lain 1'] } : null,
        dokumenLain2: row['Gambar / Dokumen Lain 2'] ? { url: row['Gambar / Dokumen Lain 2'] } : null,
        dokumenLain3: row['Gambar / Dokumen Lain 3'] ? { url: row['Gambar / Dokumen Lain 3'] } : null,
        catatanAudit: clean(row['Catatan']),
        registeredByName: clean(row['Didaftarkan Oleh :']),
        linkEditForm: clean(row['Link Edit Form']),
        createdAt: parseDate(clean(row['daftarpada'])) || new Date().toISOString(),
        updatedAt: parseDate(clean(row['Kemaskini'])) || new Date().toISOString(),
        status: 'active',
        lokasi: null
    };

    // Determine Lokasi logic and normalize to BCF
    let regBy = (res.registeredByName || '').toUpperCase();
    let tempat = (res.tempatPengislaman || '').toUpperCase();

    const normalize = (val) => {
        if (!val) return null;
        // Revert to HCF as the master prefix (User correction)
        let normalized = val.toUpperCase()
            .replace('BCF', 'HCF')
            .replace('HIDAYAH CENTRE FOUNDATION', 'HCF')
            .replace('HIDAYAH CENTRE', 'HCF')
            .replace(/\s+/g, ' ')
            .trim();
        return normalized;
    };

    if (regBy.includes('HCF') || regBy.includes('HIDAYAH') || regBy === 'MRM') {
        res.lokasi = normalize(res.registeredByName);
    } else if (tempat.includes('BANDAR TUN RAZAK') || regBy.includes('BANDAR TUN RAZAK')) {
        res.lokasi = 'HCF BANDAR TUN RAZAK';
    } else if (tempat.includes('HCF') || tempat.includes('HIDAYAH')) {
        res.lokasi = normalize(res.tempatPengislaman);
    }

    // Default to Negeri if still null? No, better keep null if unknown to avoid poisoning.

    return res;
};

const reimportData = async () => {
    console.log('🗑️  Deleting all existing records from submissions...');
    const { error: deleteError } = await supabase.from('submissions').delete().neq('status', 'trash'); // Standard way to delete all

    if (deleteError) {
        console.error('❌ Error deleting records:', deleteError.message);
        return;
    }
    console.log('✅ Submissions table cleared.');

    console.log(`📖 Reading CSV file from ${CSV_FILE_PATH}...`);
    try {
        const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');

        Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const records = results.data;
                console.log(`✅ Found ${records.length} records in CSV.`);

                const mappedRecords = records.map(mapRecord);

                const BATCH_SIZE = 100;
                let successCount = 0;
                let errorCount = 0;

                for (let i = 0; i < mappedRecords.length; i += BATCH_SIZE) {
                    const batch = mappedRecords.slice(i, i + BATCH_SIZE);
                    const { error } = await supabase.from('submissions').insert(batch);

                    if (error) {
                        console.error(`❌ Error inserting batch ${i / BATCH_SIZE + 1}:`, error.message);
                        errorCount += batch.length;
                    } else {
                        successCount += batch.length;
                        console.log(`✅ Inserted batch ${i / BATCH_SIZE + 1} (${successCount}/${mappedRecords.length})`);
                    }
                }

                console.log('\n🎉 Re-import complete!');
                console.log(`✅ Successfully imported: ${successCount}`);
                console.log(`❌ Failed: ${errorCount}`);
            }
        });
    } catch (err) {
        console.error('❌ Error reading or processing file:', err);
    }
};

reimportData();
