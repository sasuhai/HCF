# Panduan Deployment ke Firebase Hosting

## Prerequisites

- Projek Next.js sudah siap
- Firebase CLI installed
- Firebase project already created
- Sudah login ke Firebase (`firebase login`)

---

## Langkah 1: Setup Firebase Hosting

### Initialize Firebase Hosting

```bash
firebase init hosting
```

Jawab soalan seperti berikut:

```
? What do you want to use as your public directory? out
? Configure as a single-page app (rewrite all urls to /index.html)? Yes
? Set up automatic builds and deploys with GitHub? No
? File out/index.html already exists. Overwrite? No
```

Ini akan mencipta 2 fail:
- `.firebaserc` - Configuration untuk project
- `firebase.json` - Hosting configuration

---

## Langkah 2: Update next.config.mjs

Edit file `next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },
  // Optional: Jika anda host di subdirectory
  // basePath: '/myapp',
  // assetPrefix: '/myapp',
};

export default nextConfig;
```

**Penjelasan:**
- `output: 'export'` - Export sebagai static site
- `images.unoptimized: true` - Disable Next.js Image Optimization (tidak disokong oleh static export)

---

## Langkah 3: Update firebase.json

Edit `firebase.json`:

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "**/*.@(jpg|jpeg|gif|png|webp|svg)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  }
}
```

---

## Langkah 4: Build Aplikasi

```bash
npm run build
```

Ini akan:
1. Build Next.js app
2. Export static files ke folder `out/`

Jika berjaya, anda akan lihat:
```
✓ Generating static pages (X/X)
✓ Collecting page data
✓ Finalizing page optimization
Export successful. Files written to /path/to/out
```

---

## Langkah 5: Test Locally (Optional)

Sebelum deploy, test locally:

```bash
firebase serve
```

atau

```bash
npx serve out
```

Buka browser ke URL yang diberikan untuk test.

---

## Langkah 6: Deploy ke Firebase Hosting

### Deploy Hosting sahaja:

````bash
firebase deploy --only hosting
```

### Deploy semua (Hosting + Firestore Rules):

```bash
firebase deploy
```

Output:
```
=== Deploying to 'your-project-id'...

✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/your-project-id/overview
Hosting URL: https://your-project-id.web.app
```

---

## Langkah 7: Verify Deployment

1. Buka Hosting URL yang diberikan
2. Test login
3. Test semua functionality
4. Check Developer Console untuk sebarang errors

---

## Setup Custom Domain (Optional)

### 1. Tambah Domain

```bash
firebase hosting:channel:deploy preview
```

atau dalam Firebase Console:
1. Hosting → Add custom domain
2. Masukkan domain anda (contoh: muallaf.yourdomain.com)
3. Ikut arahan untuk verify domain
4. Tambah DNS records:
   - Type: A
   - Name: @ atau subdomain
   - Value: IP yang diberikan

### 2. Setup SSL

Firebase automatically provisions SSL certificate. Tunggu beberapa minit hingga beberapa jam.

---

## Automatic Deployment dengan GitHub Actions

### 1. Buat Workflow File

Create `.github/workflows/firebase-hosting.yml`:

```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_FIREBASE_API_KEY: ${{ secrets.NEXT_PUBLIC_FIREBASE_API_KEY }}
          NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${{ secrets.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN }}
          NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_PROJECT_ID }}
          NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${{ secrets.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET }}
          NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID }}
          NEXT_PUBLIC_FIREBASE_APP_ID: ${{ secrets.NEXT_PUBLIC_FIREBASE_APP_ID }}
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: your-project-id
```

### 2. Setup GitHub Secrets

Dalam GitHub repository:
1. Settings → Secrets and variables → Actions
2. Tambah secrets:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `FIREBASE_SERVICE_ACCOUNT` (dapatkan dari Firebase Console)

Sekarang setiap push ke `main` branch akan auto-deploy!

---

## Troubleshooting

### Build Error: "Image Optimization not supported"

Solution: Tambah `images: { unoptimized: true }` dalam `next.config.mjs`

### Error: "Module not found"

Solution:
```bash
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

### Firebase CLI Error: "Not authorized"

Solution:
```bash
firebase login --reauth
```

### 404 Error pada refreshroutes

Pastikan `firebase.json` ada rewrite rule untuk SPA.

---

## Best Practices

1. ✅ Test locally sebelum deploy
2. ✅ Gunakan environment variables untuk sensitive data
3. ✅ Setup GitHub Actions untuk auto-deployment
4. ✅ Monitor performance dalam Firebase Console
5. ✅ Setup budget alerts dalam Google Cloud Console
6. ✅ Enable Firebase Performance Monitoring
7. ✅ Regular backup Firestore data

---

## Monitoring & Analytics

### Enable Analytics

```bash
firebase init analytics
```

### Monitor Performance

Firebase Console → Performance → Enable monitoring

### Check Quota

Firebase Console → Usage and billing

---

## Rollback Deployment

Jika terdapat issue dengan deployment terbaru:

```bash
firebase hosting:clone your-project-id:live your-project-id:previous-version
```

atau dalam Firebase Console:
1. Hosting → Release history
2. Pilih version sebelumnya
3. Klik "Rollback"

---

## Cost Optimization

Firebase Hosting Free Tier:
- 10 GB storage
- 360 MB/day transfer
- Custom domain (1 free)

Tips untuk jimat:
1. Enable caching headers (sudah setup dalam `firebase.json`)
2. Optimize images sebelum upload
3. Monitor usage dalam Console
4. Set up budget alerts

---

## Next Steps

Selepas deployment:
1. ✅ Test semua functionality
2. ✅ Setup custom domain
3. ✅ Enable monitoring
4. ✅ Setup backup strategy
5. ✅ Train users
