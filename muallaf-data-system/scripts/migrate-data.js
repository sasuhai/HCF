/**
 * Script untuk import data dari Google Sheets ke Firestore
 * 
 * Langkah-langkah:
 * 1. Export Google Sheet ke CSV
 * 2. Letakkan fail CSV dalam folder ini dengan nama 'data.csv'
 * 3. Jalankan script ini dengan: node migrate-data.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Mapping column names dari Google Sheets ke field names dalam Firestore
const COLUMN_MAPPING = {
    'Timestamp': 'timestamp',
    'No Staf / No RH': 'noStaf',
    'Negeri / Cawangan': 'negeriCawangan',
    'Kategori': 'kategori',
    'Nama Asal': 'namaAsal',
    'Nama Islam': 'namaIslam',
    'No Kad Pengenalan / No Passport': 'noKP',
    'Jantina': 'jantina',
    'Bangsa': 'bangsa',
    'Agama Asal': 'agamaAsal',
    'Umur': 'umur',
    'Warganegara': 'warganegara',
    'Tarikh Pengislaman': 'tarikhPengislaman',
    'Masa Pengislaman': 'masaPengislaman',
    'Tempat Pengislaman': 'tempatPengislaman',
    'Negeri Pengislaman': 'negeriPengislaman',
    'No Telefon': 'noTelefon',
    'Alamat Tempat Tinggal': 'alamatTinggal',
    'Alamat Tetap': 'alamatTetap',
    'Pekerjaan': 'pekerjaan',
    'Pendapatan Bulanan (RM)': 'pendapatanBulanan',
    'Tahap Pendidikan': 'tahapPendidikan'
};

async function migrateData() {
    const results = [];

    console.log('📖 Membaca fail CSV...');

    // Read CSV file
    fs.createReadStream('data.csv')
        .pipe(csv())
        .on('data', (row) => {
            const mappedRow = {};

            // Map columns
            for (const [originalKey, newKey] of Object.entries(COLUMN_MAPPING)) {
                if (row[originalKey]) {
                    mappedRow[newKey] = row[originalKey];
                }
            }

            // Add metadata
            mappedRow.status = 'active';
            mappedRow.createdAt = admin.firestore.Timestamp.now();
            mappedRow.updatedAt = admin.firestore.Timestamp.now();
            mappedRow.createdBy = 'migration-script';
            mappedRow.updatedBy = 'migration-script';

            // Convert numeric fields
            if (mappedRow.umur) {
                mappedRow.umur = parseInt(mappedRow.umur) || null;
            }
            if (mappedRow.pendapatanBulanan) {
                mappedRow.pendapatanBulanan = parseFloat(mappedRow.pendapatanBulanan) || null;
            }

            results.push(mappedRow);
        })
        .on('end', async () => {
            console.log(`✅ ${results.length} baris data dijumpai`);
            console.log('📤 Memulakan import ke Firestore...');

            let successCount = 0;
            let errorCount = 0;

            // Batch write
            const batch = db.batch();
            const batchSize = 500; // Firestore limit

            for (let i = 0; i < results.length; i++) {
                const docRef = db.collection('submissions').doc();
                batch.set(docRef, results[i]);

                // Commit batch every 500 documents
                if ((i + 1) % batchSize === 0) {
                    try {
                        await batch.commit();
                        successCount += batchSize;
                        console.log(`✅ ${successCount} rekod berjaya diimport`);
                    } catch (error) {
                        console.error('❌ Ralat batch write:', error);
                        errorCount += batchSize;
                    }
                }
            }

            // Commit remaining documents
            const remaining = results.length % batchSize;
            if (remaining > 0) {
                try {
                    await batch.commit();
                    successCount += remaining;
                    console.log(`✅ ${successCount} rekod berjaya diimport`);
                } catch (error) {
                    console.error('❌ Ralat batch write:', error);
                    errorCount += remaining;
                }
            }

            console.log('\n🎉 Import selesai!');
            console.log(`✅ Berjaya: ${successCount} rekod`);
            console.log(`❌ Gagal: ${errorCount} rekod`);

            process.exit(0);
        })
        .on('error', (error) => {
            console.error('❌ Ralat membaca CSV:', error);
            process.exit(1);
        });
}

// Jalankan migration
migrateData().catch(console.error);
