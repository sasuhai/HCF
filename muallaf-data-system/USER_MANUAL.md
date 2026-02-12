# Manual Pengguna - Sistem Data Kemasukan Mualaf

Panduan lengkap penggunaan sistem untuk pengguna dan pentadbir.

---

## 📖 Kandungan

1. [Pengenalan](#pengenalan)
2. [Log Masuk](#log-masuk)
3. [Dashboard](#dashboard)
4. [Tambah Rekod Baru](#tambah-rekod-baru)
5. [Lihat Senarai Rekod](#lihat-senarai-rekod)
6. [Lihat Detail Rekod](#lihat-detail-rekod)
7. [Edit Rekod](#edit-rekod)
8. [Padam Rekod (Admin)](#padam-rekod-admin)
9. [Export Data](#export-data)
10. [Tips & Tricks](#tips--tricks)

---

## Pengenalan

Sistem Data Kemasukan Mualaf adalah platform web untuk menguruskan data kemasukan mualaf dan anak mualaf. Sistem ini menggantikan Google Form dengan aplikasi yang lebih powerful dan selamat.

### Jenis Pengguna

**👤 Pengguna Biasa**
- Boleh tambah rekod baru
- Boleh edit rekod sendiri
- Boleh lihat semua rekod
- TIDAK boleh padam rekod

**👑 Pentadbir (Admin)**
- Semua fungsi Pengguna Biasa
- Boleh edit semua rekod
- Boleh padam rekod
- Boleh urus pengguna

---

## Log Masuk

### Langkah 1: Buka Aplikasi

Buka browser dan taip URL aplikasi (contoh: `https://muallaf-system.web.app`)

### Langkah 2: Masukkan Credentials

![Login Screen]

1. Masukkan **email** anda
2. Masukkan **kata laluan** anda
3. Klik butang **"Log Masuk"**

### Lupa Kata Laluan?

Hubungi pentadbir sistem untuk reset password.

### Masalah Login?

| Masalah | Penyelesaian |
|---------|--------------|
| "Email atau kata laluan tidak sah" | Pastikan email dan password betul. Check CAPS LOCK. |
| "Sambungan internet" | Semak sambungan internet anda |
| Lain-lain | Hubungi pentadbir sistem |

---

## Dashboard

Selepas log masuk, anda akan dibawa ke Dashboard.

### Bahagian Dashboard

**📊 Statistik**
- **Jumlah Rekod**: Total semua rekod dalam sistem
- **Rekod Hari Ini**: Rekod yang ditambah hari ini
- **Rekod Bulan Ini**: Rekod yang ditambah bulan ini

**🔗 Quick Actions**
- **Tambah Rekod Baru**: Terus ke borang
- **Lihat Senarai Rekod**: Terus ke senarai

**📱 Navigasi** (Menu atas)
- **Dashboard**: Halaman utama
- **Borang Baru**: Tambah rekod
- **Senarai Rekod**: Lihat semua rekod
- **Keluar**: Log keluar dari sistem

---

## Tambah Rekod Baru

### Langkah 1: Buka Borang

Klik **"Borang Baru"** di menu atas atau **"Tambah Rekod Baru"** di dashboard.

### Langkah 2: Isi Maklumat

Borang dibahagikan kepada 4 seksyen:

#### Seksyen 1: Maklumat Pegawai/Cawangan

| Medan | Wajib? | Contoh |
|-------|--------|--------|
| No Staf / No RH | ✓ | 12345 |
| Negeri / Cawangan | ✓ | Selangor |

#### Seksyen 2: Maklumat Peribadi

| Medan | Wajib? | Contoh |
|-------|--------|--------|
| Kategori | ✓ | Non-Muslim / Anak Mualaf |
| Nama Asal | ✓ | Ali Bin Abu |
| Nama Islam | | Abdullah |
| No KP / Passport | ✓ | 900101015555 |
| Jantina | ✓ | Lelaki / Perempuan |
| Bangsa | ✓ | Cina / India / dll |
| Agama Asal | ✓ | Buddha / Hindu / dll |
| Umur | | 34 |
| Warganegara | ✓ | Malaysia |

#### Seksyen 3: Maklumat Pengislaman

| Medan | Wajib? | Contoh |
|-------|--------|--------|
| Tarikh Pengislaman | ✓ | 15/01/2024 |
| Masa Pengislaman | | 10:30 |
| Tempat Pengislaman | | Masjid Wilayah |
| Negeri Pengislaman | ✓ | Kuala Lumpur |

#### Seksyen 4: Maklumat Hubungan & Lain-lain

| Medan | Wajib? | Contoh |
|-------|--------|--------|
| No Telefon | ✓ | 0123456789 |
| Alamat Tempat Tinggal | ✓ | No 1, Jalan 1... |
| Alamat Tetap | | (jika berbeza) |
| Pekerjaan | | Guru |
| Pendapatan Bulanan | | 5000 |
| Tahap Pendidikan | | Ijazah |

**⭐ TIPS:**
- Medan bertanda ( * ) adalah WAJIB diisi
- Pastikan No KP/Passport betul - tidak boleh duplicate
- Tarikh guna format D/M/Y (contoh: 15/01/2024)

### Langkah 3: Simpan Data

Selepas isi semua maklumat:

1. Semak semua maklumat betul
2. Klik butang **"Simpan Data"** 

Sistem akan:
- ✅ Validate semua medan wajib
- ✅ Simpan ke database
- ✅ Tunjuk mesej "Berjaya!"
- ✅ Auto redirect ke senarai rekod

### Jika Silap?

Klik **"Set Semula"** untuk clear semua medan dan mula semula.

---

## Lihat Senarai Rekod

### Langkah 1: Buka Senarai

Klik **"Senarai Rekod"** di menu atas.

### Interface Senarai

**🔍 Search Bar**
- Cari mengikut nama, No KP, atau No Staf
- Type dan tekan Enter atau tunggu auto-search

**🏷️ Filter**
- Dropdown "Semua Kategori"
- Pilih "Non-Muslim" atau "Anak Mualaf"
- Automatic filter senarai

**📥 Export CSV**
- Klik butang "Export CSV"
- Fail akan auto download

**📋 Jadual Rekod**

Columns:
- No Staf
- Nama Asal (dan No KP)
- Nama Islam
- Kategori
- Tarikh (Pengislaman)
- Tindakan (👁️ Lihat | ✏️ Edit | 🗑️ Padam)

**📄 Pagination**
- 10 rekod per halaman
- Navigasi dengan arrows
- Tunjuk "Halaman X / Y"

### Cara Cari Rekod

**Carian Cepat:**
```
1. Type nama dalam search box
2. Automatic search semasa anda menaip
3. Clear search box untuk lihat semua
```

**Carian dengan Filter:**
```
1. Pilih kategori dari dropdown
2. Combine dengan search untuk hasil specific
```

---

## Lihat Detail Rekod

### Langkah 1: Buka Detail

Dari senarai rekod, klik ikon **👁️ (mata)** pada rekod yang ingin dilihat.

### Paparan Detail

Detail rekod ditunjukkan dalam beberapa seksyen:

- 📋 Maklumat Pegawai/Cawangan
- 👤 Maklumat Peribadi
- 📅 Maklumat Pengislaman
- 📞 Maklumat Hubungan
- ℹ️ Maklumat Tambahan
- ⚙️ Maklumat Sistem (audit trail)

### Fungsi dalam Detail View

**Butang Actions:**

1. **⬅️ Kembali**: Balik ke senarai
2. **🖨️ Cetak**: Print rekod (browser print dialog akan open)
3. **✏️ Edit**: Edit rekod ini
4. **🗑️ Padam**: Padam rekod (Admin sahaja)

### Print Rekod

1. Klik butang "Cetak"
2. Browser print dialog akan open
3. Adjust settings (portrait/landscape, margins, dll)
4. Klik "Print" atau "Save as PDF"

---

## Edit Rekod

### Langkah 1: Buka Edit Mode

Dari detail rekod atau senarai, klik butang **✏️ Edit**.

### Langkah 2: Kemaskini Maklumat

- Semua medan akan pre-filled dengan data semasa
- Edit medan yang perlu dikemaskini
- Medan wajib tetap perlu diisi

### Langkah 3: Simpan Perubahan

1. Semak semua perubahan
2. Klik **"Simpan Perubahan"**
3. Atau klik **"Batal"** untuk cancel

### Audit Trail

Setiap edit akan direkod:
- Siapa edit (User ID)
- Bila edit (Tarikh dan masa)
- Data ini boleh dilihat dalam detail rekod

**⭐ NOTA:**
- Pengguna biasa hanya boleh edit rekod sendiri
- Admin boleh edit semua rekod

---

## Padam Rekod (Admin)

**⚠️ AMARAN: Fungsi ini hanya untuk Admin!**

### Cara Padam Rekod

1. Buka detail rekod
2. Klik butang **🗑️ Padam** (merah)
3. Confirmation dialog akan muncul:
   > "Adakah anda pasti ingin memadam rekod ini?"
4. Klik **"OK"** untuk confirm atau "Cancel" untuk batal

### Apa Berlaku Selepas Padam?

- Rekod akan **soft-deleted** (status = 'deleted')
- Rekod tidak akan muncul dalam senarai
- Data masih wujud dalam database (untuk audit)
- TIDAK boleh di-undo!

**💡 Best Practice:**
- Export data dulu sebelum padam
- Pastikan betul-betul perlu dipadam
- Document kenapa padam (dalam system lain atau notes)

---

## Export Data

### Export Semua Rekod

1. Pergi ke **"Senarai Rekod"**
2. (Optional) Apply filter atau search
3. Klik butang **"Export CSV"**
4. Fail `data-mualaf-YYYY-MM-DD.csv` akan download

### Apa yang Di-export?

Columns dalam CSV:
- No Staf
- Nama Asal
- Nama Islam
- No KP
- Kategori
- Jantina
- Bangsa
- Tarikh Pengislaman
- Negeri

### Buka Fail CSV

File CSV boleh dibuka dengan:
- Microsoft Excel
- Google Sheets
- Apple Numbers
- Text editor (Notepad, etc.)

**💡 TIP:** Untuk import ke Excel dengan format yang betul:
1. Buka Excel
2. Data → From Text/CSV
3. Pilih fail CSV
4. Set delimiter: Comma
5. Import

---

## Tips & Tricks

### ⚡ Keyboard Shortcuts

| Shortcut | Fungsi |
|----------|--------|
| Tab | Pindah ke medan seterusnya |
| Shift + Tab | Balik ke medan sebelumnya |
| Ctrl/Cmd + S | (dalam borang, akan trigger save jika implemented) |

### 🎯 Best Practices

**Untuk Pengguna:**
1. ✅ Double-check semua maklumat sebelum save
2. ✅ Gunakan search untuk elak duplicate entry
3. ✅ Update rekod jika ada perubahan maklumat
4. ✅ Export data secara berkala untuk backup

**Untuk Admin:**
1. ✅ Regular audit rekod untuk ensure accuracy
2. ✅ Train pengguna baru properly
3. ✅ Monitor dashboard statistics
4. ✅ Backup data monthly
5. ✅ Review dan tukar password secara berkala

### 📱 Mobile Usage

Aplikasi ini responsive dan boleh digunakan di mobile:

**Tips untuk Mobile:**
- Gunakan portrait mode untuk form
- Landscape mode untuk senarai rekod (lebih column)
- Zoom in jika perlu untuk input
- Gunakan scroll untuk lihat full form

### 🔒 Keselamatan

**DO:**
- ✅ Gunakan password yang kuat
- ✅ Jangan share credentials
- ✅ Log out selepas guna (terutama di komputer shared)
- ✅ Report suspicious activity ke admin

**DON'T:**
- ❌ Share login details dengan orang lain
- ❌ Login dari public WiFi tanpa VPN
- ❌ Save password dalam browser (public computers)
- ❌ Leave browser open di komputer awam

### 🐛 Troubleshooting

| Masalah | Penyelesaian |
|---------|--------------|
| Data tak save | Check internet connection. Refresh dan cuba lagi |
| Search tak jalan | Clear search box dan cuba semula |
| Page tak load | Hard refresh: Ctrl+Shift+R (Windows) atau Cmd+Shift+R (Mac) |
| Tak boleh edit | Pastikan anda ada hak - Pengguna hanya boleh edit rekod sendiri |
| Export CSV fail | Check browser download settings. Cuba browser lain |

### 📞 Dapatkan Bantuan

Jika alami masalah:

1. **Check Manual ini** - Search untuk issue
2. **Cuba di browser lain** - Chrome, Firefox, Safari, Edge
3. **Clear cache** - Ctrl+Shift+Delete
4. **Hubungi Admin** - Email pentadbir sistem dengan:
   - Screenshot error
   - Steps untuk reproduce issue
   - Browser & version yang digunakan

---

## Soalan Lazim (FAQ)

**Q: Bolehkah saya edit rekod orang lain?**  
A: Pengguna biasa hanya boleh edit rekod sendiri. Admin boleh edit semua rekod.

**Q: Berapa lama data disimpan?**  
A: Data disimpan selama-lamanya melainkan dihapus oleh admin.

**Q: Adakah padam rekod adalah permanent?**  
A: Ia adalah "soft delete" - rekod hidden tetapi masih dalam database.

**Q: Bolehkah saya import banyak rekod sekaligus?**  
A: Ya, minta admin untuk run migration script.

**Q: Systempendent internet?**  
A: Ya, sistem ini perlu internet connection untuk berfungsi.

**Q: Adakah data selamat?**  
A: Ya, data encrypted in transit dan at rest. Firebase mempunyai security compliance yang tinggi.

**Q: Boleh akses dari mana sahaja?**  
A: Ya, selagi ada internet connection.

**Q: Support browser apa?**  
A: Chrome, Firefox, Safari, Edge (versions terkini).

---

## Kesimpulan

Sistem Data Kemasukan Mualaf adalah tool yang powerful untuk menguruskan data dengan selamat dan cekap. Gunakan manual ini sebagai rujukan dan jangan ragu untuk hubungi admin jika ada sebarang pertanyaan.

**Selamat menggunakan sistem! 🎉**

---

*Manual ini dikemaskini: Februari 2026*  
*Versi: 1.0*
