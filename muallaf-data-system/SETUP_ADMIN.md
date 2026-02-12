# Panduan Menambah Admin Pertama

## Kaedah 1: Melalui Firebase Console (Mudah)

### Langkah 1: Jalankan Dev Server

```bash
npm run dev
```

### Langkah 2: Cipta User dalam Firebase Authentication

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih projek anda
3. Pergi ke **Authentication**
4. Klik tab **Users**
5. Klik **Add user**
6. Masukkan:
   - **Email**: admin@example.com (tukar kepada email sebenar)
   - **Password**: Buat password yang kuat (min. 8 karakter)
7. Klik **Add user**
8. **Copy UID** pengguna yang baru dicipta

### Langkah 3: Tambah Document dalam Firestore

1. Pergi ke **Firestore Database**
2. Jika collection `users` belum wujud:
   - Klik **Start collection**
   - Collection ID: `users`
   - Document ID: *Tampal UID yang dicopy tadi*
3. Jika collection `users` sudah wujud:
   - Klik collection `users`
   - Klik **Add document**
   - Document ID: *Tampal UID yang dicopy tadi*

4. Tambah fields berikut:

| Field | Type | Value |
|-------|------|-------|
| email | string | admin@example.com |
| name | string | Administrator |
| role | string | admin |
| createdAt | string | 2026-02-12T00:00:00Z |

5. Klik **Save**

### Langkah 4: Login

1. Buka browser ke `http://localhost:3000`
2. Login dengan:
   - Email: admin@example.com
   - Password: (password yang anda tetapkan)

✅ Anda sekarang boleh login sebagai admin!

---

## Kaedah 2: Menggunakan Script (Disyorkan untuk Production)

### Langkah 1: Download Service Account Key

1. Firebase Console → Project Settings → Service Accounts
2. Klik **Generate new private key**
3. Download file JSON
4. Simpan sebagai `scripts/serviceAccountKey.json`

**⚠️ PENTING**: Jangan commit file ini ke Git! Tambah `serviceAccountKey.json` dalam `.gitignore`

### Langkah 2: Buat Script Create Admin

```bash
cd scripts
npm init -y
npm install firebase-admin
```

Buat file `scripts/create-admin.js`:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function createAdmin() {
  // Konfigurasi admin
  const email = 'admin@example.com'; // TUKAR INI
  const password = 'SecurePassword123!'; // TUKAR INI
  const name = 'Administrator'; // TUKAR INI
  
  console.log('🔄 Mencipta admin...');
  console.log('Email:', email);
  
  try {
    // Cipta user dalam Authentication
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: name
    });
    
    console.log('✅ User created in Authentication');
    console.log('UID:', userRecord.uid);
    
    // Tambah document dalam Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      name: name,
      role: 'admin',
      createdAt: new Date().toISOString()
    });
    
    console.log('✅ Document created in Firestore');
    console.log('\n🎉 Admin created successfully!');
    console.log('Login dengan:');
    console.log('  Email:', email);
    console.log('  Password:', password);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
```

### Langkah 3: Jalankan Script

```bash
cd scripts
node create-admin.js
```

Output:
```
🔄 Mencipta admin...
Email: admin@example.com
✅ User created in Authentication
UID: abc123xyz456
✅ Document created in Firestore

🎉 Admin created successfully!
Login dengan:
  Email: admin@example.com
  Password: SecurePassword123!
```

### Langkah 4: Login

Buka aplikasi dan login dengan credentials yang ditetapkan.

---

## Kaedah 3: Temporary Admin Workaround (Development Only)

### Jika anda perlu akses admin SEGERA untuk development:

1. Cipta user biasa melalui aplikasi atau Firebase Console
2. Copy UID pengguna
3. Dalam Firestore, tambah/edit document dalam collection `users/{uid}`:
   ```json
   {
     "email": "your@email.com",
     "name": "Your Name",
     "role": "admin",
     "createdAt": "2026-02-12T00:00:00Z"
   }
   ```
4. Logout dan login semula

---

## Menambah Admin Tambahan (Lepas Admin Pertama)

Selepas admin pertama dicipta, admin boleh tambah admin lain:

### Melalui Firebase Console:

1. Login sebagai admin
2. Buka Firebase Console → Authentication → Add user
3. Copy UID
4. Firestore → users → Add document dengan role: "admin"

### Melalui Script:

Gunakan script `create-admin.js` seperti di atas, tukar email dan password sahaja.

---

## Troubleshooting

### Error: "Email already exists"

User dengan email tersebut sudah wujud. Options:
1. Gunakan email lain
2. Atau delete user sedia ada dari Firebase Console → Authentication

### Error: "Permission denied"

Pastikan Service Account Key adalah sah dan projek Firebase adalah betul.

### Admin tidak boleh delete rekod

Pastikan:
1. Field `role` dalam Firestore adalah EXAC "admin" (lowercase)
2. Security rules sudah di-deploy
3. User sudah logout dan login semula selepas role ditukar

---

## Security Best Practices

1. ✅ Gunakan password yang kuat (min. 12 karakter)
2. ✅ Jangan share credentials
3. ✅ Jangan commit `serviceAccountKey.json` ke Git
4. ✅ Untuk production, enable 2FA dalam Firebase Console
5. ✅ Audit admin access secara berkala
