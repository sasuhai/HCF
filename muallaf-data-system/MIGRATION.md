# Panduan Migrasi Data dari Google Sheets

Panduan ini menerangkan cara import data sedia ada dari Google Sheet ke Firestore.

---

## Prerequisites

- Data dalam Google Sheets
- Firebase project sudah setup
- Node.js installed
- Service Account Key

---

## Langkah 1: Export Data dari Google Sheets

### Method 1: Manual Export

1. Buka Google Sheets anda
2. **File** → **Download** → **Comma Separated Values (.csv)**
3. Simpan file sebagai `data.csv`

### Method2: Menggunakan Google Sheets API (Advanced)

*Skip jika anda guna manual export*

---

## Langkah 2: Verify Data Format

Buka `data.csv` dan pastikan headers tepat seperti berikut:

```csv
Timestamp,No Staf / No RH,Negeri / Cawangan,Kategori,Nama Asal,Nama Islam,No Kad Pengenalan / No Passport,Jantina,Bangsa,Agama Asal,Umur,Warganegara,Tarikh Pengislaman,Masa Pengislaman,Tempat Pengislaman,Negeri Pengislaman,No Telefon,Alamat Tempat Tinggal,Alamat Tetap,Pekerjaan,Pendapatan Bulanan (RM),Tahap Pendidikan
```

**Format contoh:**
```csv
2/12/2026 13:48:57,12345,Selangor,Non-Muslim,Ali Bin Abu,Abdullah,900101015555,Lelaki,Cina,Buddha,34,Malaysia,2024-01-15,10:30,Masjid Wilayah,Kuala Lumpur,0123456789,"No 1, Jalan 1, Taman 1","",Guru,5000,Ijazah
```

---

## Langkah 3: Download Service Account Key

1. [Firebase Console](https://console.firebase.google.com/)
2. Project Settings → Service Accounts
3. Klik **Generate new private key**
4. Download file JSON
5. Simpan dalam `scripts/serviceAccountKey.json`

**⚠️ PENTING**: 
- Jangan commit file ini ke Git!
- Tambah `serviceAccountKey.json` dalam `.gitignore`

---

## Langkah 4: Setup Migration Script

### Install Dependencies

```bash
cd scripts
npm init -y
npm install firebase-admin csv-parser
```

### Copy CSV File

```bash
cp /path/to/your/data.csv scripts/data.csv
```

### Verify File Structure

```bash
ls scripts/
```

Sepatutnya ada:
```
scripts/
├── data.csv
├── migrate-data.js
├── serviceAccountKey.json
├── package.json
└── node_modules/
```

---

## Langkah 5: Customize Migration Script (Optional)

Edit `scripts/migrate-data.js` jika perlu:

### Tukar Batch Size (jika import data besar)

```javascript
const batchSize = 500; // Default
// Tukar ke 100 jika terdapat error
const batchSize = 100;
```

### Tambah Data Transformation

Contoh - Auto-capitalize names:

```javascript
if (mappedRow.namaAsal) {
  mappedRow.namaAsal = mappedRow.namaAsal
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
```

### Add Custom Metadata

```javascript
// Tambah custom fields
mappedRow.importDate = new Date().toISOString();
mappedRow.source = 'google-sheets-import';
```

---

## Langkah 6: Test Migration (Dry Run)

Sebelum import sebenar, test dengan subset kecil data:

### Create Test CSV

Buat file `scripts/data-test.csv` dengan 5-10 rows sahaja.

### Run Test

```bash
cd scripts
node migrate-data.js
```

Jika berjaya, anda akan lihat:
```
📖 Membaca fail CSV...
✅ 10 baris data dijumpai
📤 Memulakan import ke Firestore...
✅ 10 rekod berjaya diimport

🎉 Import selesai!
✅ Berjaya: 10 rekod
❌ Gagal: 0 rekod
```

### Verify dalam Firestore

1. Firebase Console → Firestore Database
2. Collection `mualaf`
3. Check beberapa documents untuk pastikan data betul

### Delete Test Data

Jika test data perlu dibuang:

```bash
# Install firestore-clear
npm install -g firestore-clear

# Clear collection
firestore-clear --project your-project-id mualaf
```

atau delete manually dalam Firebase Console.

---

## Langkah 7: Run Full Migration

Selepas test berjaya:

### Backup Existing Data (jika ada)

```bash
# Using firestore-export
npm install -g node-firestore-import-export
firestore-export --accountCredentials serviceAccountKey.json --backupFile backup.json
```

### Run Full Import

```bash
cd scripts
node migrate-data.js
```

**NOTA**: Untuk data besar (>1000 records), proses mungkin ambil beberapa minit.

Progress akan ditunjukkan:
```
📖 Membaca fail CSV...
✅ 1547 baris data dijumpai
📤 Memulakan import ke Firestore...
✅ 500 rekod berjaya diimport
✅ 1000 rekod berjaya diimport
✅ 1500 rekod berjaya diimport
✅ 1547 rekod berjaya diimport

🎉 Import selesai!
✅ Berjaya: 1547 rekod
❌ Gagal: 0 rekod
```

---

## Langkah 8: Verify Import

### Check Firestore Console

1. Firebase Console → Firestore Database
2. Collection `mualaf` sepatutnya ada semua records
3. Spot check beberapa records untuk accuracy

### Check dalam Aplikasi

1. Jalankan aplikasi: `npm run dev`
2. Login dan pergi ke "Senarai Rekod"
3. Verify data ditunjukkan dengan betul
4. Test search, filter functionality

### Run Queries untuk Verify

Dalam Firebase Console → Firestore → Query:

```javascript
// Count total records
mualaf where status == 'active'

// Check specific data
mualaf where kategori == 'Non-Muslim' limit 10
```

---

## Troubleshooting

### Error: "CSV file not found"

Pastikan file `data.csv` dalam folder `scripts/`

### Error: "Permission denied"

Pastikan Service Account Key adalah valid dan mempunyai hak untuk write ke Firestore.

### Error: "Invalid date format"

Date dalam CSV mesti dalam format yang betul. Update script untuk parse date:

```javascript
// Tambah dalam migrate-data.js
const parseDate = (dateStr) => {
  // Handle different date formats
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

if (mappedRow.tarikhPengislaman) {
  mappedRow.tarikhPengislaman = parseDate(mappedRow.tarikhPengislaman);
}
```

### Import Stopped Halfway

Jika import stopped, script boleh dirun semula. Ia akan create duplicate entries. Options:

1. Delete semua dan run semula
2. Atau modify script untuk skip existing records:

```javascript
// Check if record exists
const existingDoc = await db.collection('submissions')
  .where('noKP', '==', mappedRow.noKP)
  .limit(1)
  .get();

if (!existingDoc.empty) {
  console.log(`Skipping duplicate: ${mappedRow.noKP}`);
  continue;
}
```

### Memory Error (Large Dataset)

Untuk dataset sangat besar (>100,000 records):

```javascript
// Process in smaller chunks
const chunkSize = 1000;
// Add streaming logic instead of loading all into memory
```

---

## Advanced: Incremental Updates

Untuk auto-sync dari Google Sheets secara berkala:

### Setup Google Sheets API

1. Enable Google Sheets API dalam Google Cloud Console
2. Create Service Account
3. Share Google Sheet dengan service account email

### Create Sync Script

```javascript
const { google } = require('googleapis');

async function syncFromSheets() {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'serviceAccountKey.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: 'YOUR_SPREADSHEET_ID',
    range: 'Sheet1!A:Z',
  });

  // Process and import...
}
```

### Schedule with Cron

```bash
# Run every day at 2 AM
0 2 * * * cd /path/to/scripts && node sync-sheets.js
```

---

## Data Validation

Selepas import, jalankan validation:

### Create Validation Script

```javascript
// scripts/validate-data.js
const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert(require('./serviceAccountKey.json'))
});

async function validateData() {
  const snapshot = await admin.firestore().collection('mualaf').get();
  
  let errors = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    
    // Validate required fields
    const required = ['noStaf', 'namaAsal', 'noKP', 'tarikhPengislaman'];
    required.forEach(field => {
      if (!data[field]) {
        errors.push(`${doc.id}: Missing ${field}`);
      }
    });
    
    // Validate data types
    if (data.umur && typeof data.umur !== 'number') {
      errors.push(`${doc.id}: Umur should be number`);
    }
  });
  
  if (errors.length > 0) {
    console.log('❌ Validation errors found:');
    errors.forEach(err => console.log(err));
  } else {
    console.log('✅ All data validated successfully');
  }
}

validateData();
```

---

## Cleanup After Migration

Selepas migration berjaya:

1. ✅ Backup `data.csv` ke secure location
2. ✅ Delete `serviceAccountKey.json` dari local (keep in secure vault)
3. ✅ Document migration date dan count
4. ✅ Update REAMDE dengan info migration stats

---

## Next Steps

- Setup regular backups
- Create data export functionality dalam app
- Monitor Firestore usage and costs
