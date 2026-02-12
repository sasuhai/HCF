# 🚀 Quick Start Guide - Sistem Data Kemasukan Mualaf

Panduan ringkas untuk setup dan jalankan sistem.

---

## ⚡ Setup dalam 10 Minit

### Step 1: Install Dependencies ⏱️ 2 min

**Jika ada npm cache error:**
```bash
sudo chown -R $(whoami) ~/.npm
```

**Install packages:**
```bash
cd muallaf-data-system
npm install
```

---

### Step 2: Setup Firebase ⏱️ 3 min

1. **Buka**: [Firebase Console](https://console.firebase.google.com/)
2. **Create** project baru
3. **Enable**:
   - Authentication → Email/Password
   - Firestore Database (production mode, Singapore)
4. **Get config**:
   - Project Settings → Web App → Copy config

---

### Step 3: Environment Setup ⏱️ 1 min

```bash
cp .env.local.example .env.local
```

Edit `.env.local` dan tampal Firebase config:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

---

### Step 4: Deploy Security Rules ⏱️ 2 min

```bash
# Install Firebase CLI (jika belum)
npm install -g firebase-tools

# Login
firebase login

# Init & deploy
firebase init firestore
firebase deploy --only firestore:rules
```

---

### Step 5: Create Admin ⏱️ 2 min

**Method 1: Firebase Console (Cepat)**
1. Authentication → Add user (email + password)
2. Copy UID
3. Firestore → Collection `users` → Add document:
   ```
   Document ID: [paste UID]
   Fields:
     email: "admin@example.com"
     name: "Administrator"
     role: "admin"
     createdAt: "2026-02-12T00:00:00Z"
   ```

**Method 2: Script (Better)**
```bash
cd scripts
npm install
# Edit create-admin.js (line 18-20: email, password, name)
node create-admin.js
```

---

### Step 6: Run! ⏱️ 0 min

```bash
npm run dev
```

Open: `http://localhost:3000`  
Login dengan admin credentials!

---

## 📋 Checklist

- [ ] npm install berjaya
- [ ] Firebase project created
- [ ] Authentication enabled
- [ ] Firestore created
- [ ] .env.local configured
- [ ] Security rules deployed
- [ ] Admin user created
- [ ] App running di localhost:3000
- [ ] Boleh login sebagai admin

---

## 🎯 What's Next?

### Production Deployment

```bash
# Build
npm run build

# Deploy to Firebase Hosting
firebase init hosting
firebase deploy
```

See: [DEPLOYMENT.md](DEPLOYMENT.md)

### Migrate Existing Data

```bash
# Export Google Sheet ke CSV
# Letak dalam scripts/data.csv
cd scripts
npm install
node migrate-data.js
```

See: [MIGRATION.md](MIGRATION.md)

### Add More Users

Method 1: Firebase Console (sama macam Step 5)  
Method 2: Admin Panel (coming soon)

---

## 🐛 Common Issues

### Issue: npm install gagal

```bash
sudo chown -R $(whoami) ~/.npm
npm cache clean --force
npm install
```

### Issue: Firebase config not loading

Pastikan `.env.local` wujud dengan semua variables.  
Restart dev server selepas edit `.env.local`.

### Issue: Security rules denied

```bash
firebase deploy --only firestore:rules
```

Pastikan admin document dalam Firestore mempunyai field `role: "admin"`.

###Issue: "Module not found"

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Full Documentation

| Document | Purpose |
|----------|---------|
| [README.md](README.md) | Overview & setup lengkap |
| [SETUP_ADMIN.md](SETUP_ADMIN.md) | Detailed admin setup |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production deployment |
| [MIGRATION.md](MIGRATION.md) | Data migration guide |
| [USER_MANUAL.md](USER_MANUAL.md) | User guide |
| [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) | Code structure |

---

## 🔥 Pro Tips

1. **Test locally first** sebelum deploy
2. **Export data regularly** untuk backup
3. **Create multiple admins** untuk redundancy
4. **Monitor Firebase usage** dalam console
5. **Use environment-specific configs** untuk dev/staging/prod

---

## 📞 Need Help?

1. Check dokumentasi dalam repo
2. Check Firebase Console untuk errors
3. Check browser Developer Console
4. Hubungi pentadbir sistem

---

## 🎉 Ready to Go!

Sistema Data Kemasukan Mualaf sekarang sudah ready!

**Test List:**
- ✅ Login sebagai admin
- ✅ Lihat dashboard
- ✅ Tambah rekod baru
- ✅ Edit rekod
- ✅ Delete rekod (admin)
- ✅ Export CSV
- ✅ Logout

Selamat menggunakan! 🚀

---

*Last updated: February 2026*
