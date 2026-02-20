# Sistem Data Kemasukan Mualaf

Sistem Web-Based Data Entry moden untuk pengurusan data kemasukan mualaf dan anak mualaf. Sistem ini dibina menggunakan Next.js dan Firebase, dengan keselamatan tinggi dan scalable.

## 🌟 Ciri-ciri Utama

- ✅ **Authentication** - Login selamat dengan Firebase Authentication
- 👥 **Role-Based Access** - Pentadbir dan Pengguna dengan hak akses berbeza
- 📝 **Borang Digital** - Borang kemasukan data lengkap berdasarkan Google Form asal
- 📊 **Dashboard** - Statistik dan paparan ringkas
- 📋 **Senarai Rekod** - Carian, tapisan, susun, dan pagination
- 🔍 **Paparan Detail** - Lihat maklumat penuh setiap rekod
- ✏️ **Edit Rekod** - Kemaskini data dengan audit trail
- 🗑️ **Padam Rekod** - Soft delete (Admin sahaja)
- 📥 **Export CSV** - Export data ke format CSV
- 🖨️ **Print View** - Cetak rekod individu
- 📱 **Mobile Responsive** - Berfungsi di semua peranti
- 🔒 **Secure** - Firebase Security Rules dengan role-based access

## 📁 Struktur Projek

```
muallaf-data-system/
├── app/                        # Next.js App Router
│   ├── layout.js              # Root layout
│   ├── page.js                # Landing page
│   ├── globals.css            # Global styles
│   ├── login/                 # Halaman login
│   ├── dashboard/             # Dashboard
│   ├── borang/                # Borang kemasukan data
│   ├── senarai/               # Senarai rekod
│   └── rekod/[id]/           # Detail & Edit rekod
├── components/                 # Reusable components
│   ├── Navbar.js
│   └── ProtectedRoute.js
├── contexts/                   # React Context
│   └── AuthContext.js
├── lib/                        # Utilities & helpers
│   ├── constants.js
│   └── firebase/
│       ├── config.js
│       ├── auth.js
│       └── firestore.js
├── scripts/                    # Migration scripts
│   └── migrate-data.js
├── public/                     # Static files
├── firestore.rules            # Firebase Security Rules
├── .env.local.example         # Environment variables template
└── package.json
```

## 🚀 Setup & Installation

### 1. Prerequisites

- Node.js 18 atau lebih tinggi
- npm atau yarn
- Akaun Firebase

### 2. Clone Repository

```bash
git clone <repository-url>
cd muallaf-data-system
```

### 3. Install Dependencies

**PENTING**: Jika terdapat masalah dengan npm cache, jalankan terlebih dahulu:

```bash
sudo chown -R $(whoami) ~/.npm
```

Kemudian install dependencies:

```bash
npm install
```

### 4. Setup Firebase

#### a) Cipta Projek Firebase

1. Pergi ke [Firebase Console](https://console.firebase.google.com/)
2. Klik "Add project"
3. Masukkan nama projek (contoh: `muallaf-data-system`)
4. Ikuti langkah-langkah sehingga selesai

#### b) Enable Authentication

1. Dalam Firebase Console, pergi ke **Authentication**
2. Klik tab **Sign-in method**
3. Enable **Email/Password**

#### c) Create Firestore Database

1. Pergi to **Firestore Database**
2. Klik **Create database**
3. Pilih **Start in production mode**
4. Pilih location (Asia Southeast - Singapore recommended)

#### d) Dapatkan Firebase Configuration

1. Pergi ke **Project Settings** (ikon gear)
2. Scroll ke bahagian **Your apps**
3. Klik **Web app** icon (</>)
4. Daftar app dengan nama (contoh: `muallaf-web`)
5. Copy configuration values

#### e) Buat File Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` dan masukkan nilai dari Firebase:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 5. Deploy Security Rules

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login ke Firebase:
```bash
firebase login
```

3. Initialize project:
```bash
firebase init
```
- Pilih **Firestore**
- Pilih existing project
- Tekan Enter untuk default file paths

4. Deploy security rules:
```bash
firebase deploy --only firestore:rules
```

### 6. Tambah Admin Pertama

Lihat fail `SETUP_ADMIN.md` untuk panduan lengkap.

### 7. Jalankan Development Server

```bash
npm run dev
```

Buka browser ke `http://localhost:3000`

## 📦 Build untuk Production

```bash
npm run build
```

## 🚀 Deploy ke Firebase Hosting

Lihat fail `DEPLOYMENT.md` untuk panduan lengkap.

## 🔄 Migrasi Data dari Google Sheets

Lihat fail `MIGRATION.md` untuk panduan lengkap.

## 📊 Struktur Database

### Collection: `mualaf`

```javascript
{
  // Maklumat Pegawai
  noStaf: string,
  negeriCawangan: string,
  
  // Maklumat Peribadi
  kategori: string, // "Non-Muslim" atau "Anak Mualaf"
  namaAsal: string,
  namaIslam: string | null,
  noKP: string,
  jantina: string,
  bangsa: string,
  agamaAsal: string,
  umur: number | null,
  warganegara: string,
  
  // Maklumat Pengislaman
  tarikhPengislaman: string, // YYYY-MM-DD
  masaPengislaman: string | null, // HH:MM
  tempatPengislaman: string | null,
  negeriPengislaman: string,
  
  // Maklumat Hubungan
  noTelefon: string,
  alamatTinggal: string,
  alamatTetap: string | null,
  
  // Maklumat Tambahan
  pekerjaan: string | null,
  pendapatanBulanan: number | null,
  tahapPendidikan: string | null,
  
  // Metadata
  status: "active" | "deleted",
  createdAt: Timestamp,
  createdBy: string, // User UID
  updatedAt: Timestamp,
  updatedBy: string, // User UID
  deletedAt: Timestamp | null
}
```

### Collection: `users`

```javascript
{
  email: string,
  name: string,
  role: "admin" | "user",
  createdAt: string
}
```

## 📝 Manual Pengguna

Lihat fail `USER_MANUAL.md` untuk panduan pengguna lengkap.

## 📄 License

Idiahus © 2026 - Hak Cipta Terpelihara
