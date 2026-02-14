# Panduan Pengurusan Kadar Elaun

## Gambaran Keseluruhan

Sistem Pengurusan Kadar Elaun membolehkan pentadbir untuk menetapkan dan menguruskan kadar bayaran/elaun untuk kategori Mualaf dan Petugas yang berbeza.

## Kategori Elaun

### Untuk Mualaf

Terdapat 3 kategori elaun untuk mualaf:
- **MUALAF 1** - RM15.00 (bayaran/kelas)
- **MUALAF 2** - RM30.00 (bayaran/kelas)
- **MUALAF 3** - RM50.00 (bayaran/kelas)

### Untuk Petugas

Terdapat 8 kategori elaun untuk petugas:
- **GURU 1** - RM50.00 (bayaran/kelas)
- **GURU 2** - RM80.00 (bayaran/kelas)
- **GURU 3** - RM160.00 (bayaran/kelas)
- **KOORDINATOR** - RM100.00 (bayaran/bulan)
- **PETUGAS** - RM30.00 (bayaran/kelas)
- **SUKARELAWAN 1** - RM0.00 (bayaran/kelas)
- **SUKARELAWAN 2** - RM0.00 (bayaran/kelas)
- **SUKARELAWAN 3** - RM0.00 (bayaran/kelas)

## Akses ke Halaman Pengurusan Kadar Elaun

1. Log masuk sebagai **Admin**
2. Klik menu **Pengurusan** di navigation bar
3. Pilih **Kadar Elaun** dari dropdown

> ⚠️ **Nota:** Halaman ini hanya boleh diakses oleh pentadbir sahaja.

## Cara Menggunakan

### Memulakan dengan Kadar Default

Jika tiada kadar elaun yang telah ditetapkan:

1. Klik butang **"Mula dengan Default"**
2. Sahkan tindakan
3. Sistem akan menambah semua 11 kategori kadar elaun dengan nilai default

### Menambah Kadar Elaun Baru

1. Klik butang **"Tambah Kadar"**
2. Isi maklumat berikut:
   - **Jenis**: Pilih sama ada `Petugas` atau `Mualaf`
   - **Kategori**: Masukkan nama kategori (contoh: GURU 4, MUALAF 4)
   - **Jumlah Elaun (RM)**: Masukkan nilai dalam Ringgit Malaysia
   - **Jenis Pembayaran**: Pilih sama ada:
     - `bayaran/kelas` - Bayaran setiap kelas
     - `bayaran/bulan` - Bayaran bulanan
     - `bayaran/hari` - Bayaran harian
3. Klik **"Simpan"**

### Mengemas kini Kadar Elaun

1. Klik ikon **edit** (pensil) di sebelah kadar yang ingin dikemaskini
2. Ubah maklumat yang diperlukan
3. Klik **"Simpan"**

### Memadam Kadar Elaun

1. Klik ikon **delete** (tong sampah) di sebelah kadar yang ingin dipadam
2. Sahkan tindakan
3. Kadar akan dipadam sepenuhnya dari sistem

> ⚠️ **Amaran:** Pemadaman adalah KEKAL. Pastikan tiada rekod yang masih menggunakan kategori ini.

### Menapis Kadar Elaun

Gunakan tab di bahagian atas jadual untuk menapis mengikut jenis:
- **Semua** - Papar semua kadar elaun
- **Mualaf** - Papar hanya kadar untuk mualaf
- **Petugas** - Papar hanya kadar untuk petugas

## Penggunaan Kategori Elaun

### Untuk Data Mualaf

Apabila menambah atau mengedit data mualaf melalui **Borang Kemasukan Data**:

1. Isi semua maklumat peribadi seperti biasa
2. Di bahagian **Maklumat Tambahan & Gambar**, cari field **Kategori Elaun**
3. Pilih kategori yang bersesuaian (MUALAF 1, MUALAF 2, atau MUALAF 3)
4. Simpan borang

### Untuk Data Petugas

Apabila menambah atau mengedit petugas melalui **Pengurusan Petugas**:

1. Isi nama, peranan, lokasi, dan maklumat bank
2. Di field **Kategori Elaun**, pilih kategori yang bersesuaian
3. Simpan data petugas

## Struktur Data

### Collection: `rateCategories`

Setiap dokumen kadar elaun mengandungi:

```javascript
{
  kategori: "GURU 1",          // Nama kategori
  jumlahElaun: 50.00,          // Jumlah dalam RM
  jenisPembayaran: "bayaran/kelas",  // Jenis pembayaran
  jenis: "petugas",            // "petugas" atau "mualaf"
  createdAt: Timestamp,        // Tarikh dicipta
  createdBy: "user-id",        // ID pengguna yang cipta
  updatedAt: Timestamp,        // Tarikh dikemas kini
  updatedBy: "user-id"         // ID pengguna yang kemaskini
}
```

### Field `kategoriElaun` dalam Dokumen Lain

- **Collection `submissions` (Data Mualaf)**: Mengandungi field `kategoriElaun` yang menyimpan kategori seperti "MUALAF 1"
- **Collection `workers` (Data Petugas)**: Mengandungi field `kategoriElaun` yang menyimpan kategori seperti "GURU 1"

## Kegunaan untuk Sistem Bayaran (Masa Hadapan)

Kadar elaun ini akan digunakan untuk:

1. **Pengiraan Automatik**: Mengira jumlah bayaran berdasarkan:
   - Bilangan kelas yang dihadiri (untuk bayaran/kelas)
   - Bulan perkhidmatan (untuk bayaran/bulan)
   - Hari kehadiran (untuk bayaran/hari)

2. **Laporan Kewangan**: Menjana laporan kos operasi dan bayaran

3. **Slip Gaji**: Mencetak slip bayaran/elaun untuk petugas dan mualaf

## Nota Penting

⚠️ **Sila rujuk Unit Pembangunan Mualaf untuk penetapan kadar elaun yang betul**

- Kadar yang ditetapkan perlu mengikut garis panduan rasmi organisasi
- Pastikan kadar dikemas kini secara berkala jika ada perubahan polisi
- Audit kadar elaun secara berkala untuk memastikan ketepatan

## Soalan Lazim

### Bolehkah saya ubah kadar elaun yang sudah ditetapkan?

Ya, admin boleh mengemas kini kadar elaun pada bila-bila masa. Perubahan tidak akan menjejaskan rekod lama.

### Apa yang berlaku kepada rekod sedia ada jika saya padam kategori?

Rekod sedia ada yang menggunakan kategori tersebut tidak akan terjejas - mereka akan terus menyimpan nama kategori. Walau bagaimanapun, anda tidak boleh memilih kategori yang telah dipadam untuk rekod baru.

### Bolehkah pengguna biasa (bukan admin) lihat kadar elaun?

Tidak. Halaman pengurusan kadar elaun hanya boleh diakses oleh admin sahaja.

### Adakah saya perlu menetapkan kategori elaun untuk semua mualaf dan petugas?

Tidak wajib, tetapi disyorkan untuk tujuan pengurusan kewangan yang lebih baik. Field kategori elaun adalah optional dalam borang.

---

**Versi:** 1.0  
**Tarikh:** Februari 2026  
**Dicipta untuk:** HCF iSantuni
