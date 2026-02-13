
import { NextResponse } from 'next/server';
import fs from 'fs';
import Papa from 'papaparse';

export async function GET() {
    try {
        const filePath = '/Users/sasuhai/Desktop/HCFBTR/SPO2025.csv';

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'File not found at ' + filePath }, { status: 404 });
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');

        const { data, errors } = Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false
        });

        if (errors.length > 0) {
            console.warn('CSV Parse Errors:', errors);
        }

        const mapKategori = (k) => {
            if (!k) return '';
            const upper = k.toUpperCase();
            if (upper === 'PENGISLAMAN') return 'Pengislaman';
            if (upper === 'SOKONGAN') return 'Sokongan';
            if (upper === 'NON-MUSLIM' || upper === 'NON MUSLIM') return 'Non-Muslim';
            if (upper.includes('ANAK')) return 'Anak Mualaf';
            // Title Case fallback
            return k.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
        };

        const mappedData = data.filter(row => {
            const id = row['No Kad Pengenalan / No Passport'];
            return !id || !id.toString().includes('E+');
        }).map(row => ({
            negeriCawangan: row['Negeri / Cawangan'] || '',
            kategori: mapKategori(row['Kategori']),
            noStaf: row['ID Mualaf'] || '',
            namaIslam: row['Nama Islam'] || '',
            namaAsal: row['Nama Asal'] || '',
            noKP: row['No Kad Pengenalan / No Passport'] || '',
            jantina: row['Jantina']?.trim() || '',
            bangsa: row['Bangsa']?.trim() || '',
            agamaAsal: row['Agama Asal']?.trim() || '',
            umur: row['Umur Pada 2025'] || '',
            warganegara: row['Warganegara']?.trim() || '',
            noTelefon: row['No Telefon']?.trim() || '',
            alamatTinggal: row['Alamat Tempat Tinggal'] || '',
            alamatTetap: row['Alamat Tetap'] || '',
            pekerjaan: row['Pekerjaan'] || '',
            pendapatanBulanan: row['Pendapatan Bulanan (RM)'] || '',
            tahapPendidikan: row['Tahap Pendidikan'] || '',
            tarikhPengislaman: row['Tarikh Pengislaman'] || '',
            masaPengislaman: row['Masa Pengislaman'] || '',
            tempatPengislaman: row['Tempat Pengislaman'] || '',
            negeriPengislaman: row['Negeri Pengislaman']?.trim() || '',
            catatan: [
                row['Catatan'],
                row['Sebab Memeluk Islam'] ? `Sebab: ${row['Sebab Memeluk Islam']}` : '',
                row['Nama Pegawai Yang Mengislamkan'] ? `Pegawai: ${row['Nama Pegawai Yang Mengislamkan']}` : ''
            ].filter(Boolean).join('\n'),
            bank: row['Bank'] || '',
            noAkaun: row['No Akaun'] || '',
            namaDiBank: row['Nama di Bank'] || '',
            lokasi: row['Lokasi'] || ''
        }));

        return NextResponse.json({ count: mappedData.length, data: mappedData });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
