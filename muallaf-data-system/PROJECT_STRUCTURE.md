# SISTEM DATA KEMASUKAN MUALAF

## 📋 Project Files Overview

Berikut adalah fail-fail penting dalam projek ini:

```
muallaf-data-system/
├── 📱 APPLICATION FILES
│   ├── app/                          # Next.js pages
│   │   ├── layout.js                # Root layout dengan AuthProvider
│   │   ├── page.js                  # Landing page (redirect)
│   │   ├── globals.css              # Global styles & utilities
│   │   ├── login/page.js            # Login page
│   │   ├── dashboard/page.js        # Dashboard dengan stats
│   │   ├── borang/page.js           # Form kemasukan data
│   │   ├── senarai/page.js          # List rekod dengan search/filter
│   │   └── rekod/[id]/             
│   │       ├── page.js              # Detail rekod
│   │       └── edit/page.js         # Edit rekod
│   ├── components/
│   │   ├── Navbar.js                # Navigation bar
│   │   └── ProtectedRoute.js        # Route protection HOC
│   ├── contexts/
│   │   └── AuthContext.js           # Authentication context
│   └── lib/
│       ├── constants.js             # Dropdown options & constants
│       └── firebase/
│           ├── config.js            # Firebase initialization
│           ├── auth.js              # Auth functions
│           └── firestore.js         # Database CRUD functions
│
├── 🔐 FIREBASE CONFIGURATION
│   ├── firestore.rules              # Security rules
│   ├── firestore.indexes.json       # Database indexes
│   ├── firebase.json                # Hosting config
│   └── .env.local.example           # Environment variables template
│
├── 🛠️ SCRIPTS
│   ├── create-admin.js              # Create admin user
│   ├── migrate-data.js              # Import dari Google Sheets
│   └── package.json                 # Scripts dependencies
│
├── 📚 DOCUMENTATION
│   ├── README.md                    # Main documentation
│   ├── SETUP_ADMIN.md              # Admin setup guide
│   ├── DEPLOYMENT.md               # Deployment guide
│   ├── MIGRATION.md                # Data migration guide
│   ├── USER_MANUAL.md              # User manual
│   └── PROJECT_STRUCTURE.md        # This file
│
└── ⚙️ CONFIG FILES
    ├── package.json                 # Project dependencies
    ├── next.config.mjs              # Next.js configuration
    ├── tailwind.config.js           # Tailwind CSS config
    ├── jsconfig.json                # JavaScript config
    └── .gitignore                   # Git ignore rules
```

## 🎯 Key Files Explained

### Application Core

**`app/layout.js`**
- Root layout untuk semua pages
- Wraps app dengan AuthProvider
- Sets up fonts dan metadata

**`contexts/AuthContext.js`**
- Manages authentication state
- Provides user info dan role
- Handles login/logout

**`lib/firebase/config.js`**
- Initialize Firebase app
- Exports auth dan db instances

### Pages

**`app/login/page.js`**
- Login form
- Error handling
- Auto-redirect jika sudah logged in

**`app/dashboard/page.js`**
- Statistics cards
- Quick action buttons
- Protected route

**`app/borang/page.js`**
- Complete data entry form
- Form validation dengan react-hook-form
- Success/error messages

**`app/senarai/page.js`**
- Data table dengan pagination
- Search dan filter
- Export ke CSV

**`app/rekod/[id]/page.js`**
- Full detail view
- Print functionality
- Edit/Delete buttons

**`app/rekod/[id]/edit/page.js`**
- Edit form pre-filled dengan data
- Update dengan audit trail

### Firebase Functions

**`lib/firebase/auth.js`**
- `signIn()` - Login user
- `signOut()` - Logout user
- `resetPassword()` - Send reset email
- `registerUser()` - Create new user
- `getUserRole()` - Get user's role

**`lib/firebase/firestore.js`**
- `createSubmission()` - Add new record
- `updateSubmission()` - Update record
- `deleteSubmission()` - Soft delete record
- `getSubmission()` - Get single record
- `getSubmissions()` - Get all records dengan filters
- `getStatistics()` - Get dashboard stats

### Security

**`firestore.rules`**
- Role-based access control
- Validates data structure
- Prevents unauthorized access
- Example rule:
  ```
  allow read: if isSignedIn() && resource.data.status == 'active';
  allow create: if isSignedIn() && request.resource.data.createdBy == request.auth.uid;
  allow update: if isOwner(resource.data) || isAdmin();
  allow delete: if false; // Soft delete only
  ```

### Scripts

**`scripts/create-admin.js`**
- Creates admin user in Firebase Auth
- Adds admin document in Firestore
- Usage: `cd scripts && node create-admin.js`

**`scripts/migrate-data.js`**
- Imports data from CSV
- Maps Google Sheets columns to Firestore fields
- Batch processing untuk large datasets
- Usage: `cd scripts && node migrate-data.js`

## 📦 Dependencies

### Main Dependencies

```json
{
  "next": "16.1.6",           // React framework
  "react": "^19.0.0",          // UI library
  "firebase": "^11.2.0",       // Firebase SDK
  "react-hook-form": "^7.54.2", // Form handling
  "date-fns": "^4.1.0",        // Date utilities
  "lucide-react": "^0.468.0"   // Icon library
}
```

### Dev Dependencies

```json
{
  "tailwindcss": "^4.0.0",    // CSS framework
  "eslint": "^9",              // Linting
  "eslint-config-next": "16.1.6" // Next.js eslint config
}
```

## 🗂️ Database Structure

### Collection: `mualaf`
```javascript
{
  // Pegawai Info
  noStaf: string,
  negeriCawangan: string,
  
  // Personal Info
  kategori: "Non-Muslim" | "Anak Mualaf",
  namaAsal: string,
  namaIslam: string?,
  noKP: string,
  jantina: "Lelaki" | "Perempuan",
  bangsa: string,
  agamaAsal: string,
  umur: number?,
  warganegara: string,
  
  // Conversion Info
  tarikhPengislaman: string, // YYYY-MM-DD
  masaPengislaman: string?,
  tempatPengislaman: string?,
  negeriPengislaman: string,
  
  // Contact
  noTelefon: string,
  alamatTinggal: string,
  alamatTetap: string?,
  
  // Others
  pekerjaan: string?,
  pendapatanBulanan: number?,
  tahapPendidikan: string?,
  
  // Metadata
  status: "active" | "deleted",
  createdAt: Timestamp,
  createdBy: string,
  updatedAt: Timestamp,
  updatedBy: string,
  deletedAt: Timestamp?
}
```

### Collection: `users`
```javascript
{
  email: string,
  name: string,
  role: "admin" | " user",
  createdAt: string
}
```

## 🔄 Data Flow

### Create New Record
```
User → Borang Page → react-hook-form validation
  → createSubmission() → Firestore
  → Success → Redirect to Senarai
```

### Edit Record
```
User → Rekod Detail → Edit Page → Pre-fill form
  → Update fields → updateSubmission() → Firestore
  → Audit trail updated → Success → Back to Detail
```

### Delete Record (Admin)
```
Admin → Rekod Detail → Delete button → Confirm dialog
  → deleteSubmission() → Update status to 'deleted'
  → Record hidden from UI → Audit trail preserved
```

### Authentication Flow
```
Login Page → signIn() → Firebase Auth
  → Get user role from Firestore
  → AuthContext updates → Redirect to Dashboard
```

## 🎨 Styling Architecture

### Global Styles (`app/globals.css`)
- CSS custom properties
- Tailwind directives
- Custom utility classes:
  - `.form-input` - Standard input styling
  - `.form-label` - Label styling
  - `.btn-primary` - Primary button
  - `.btn-secondary` - Secondary button
  - `.card` - Card container
  - `.stat-card` - Statistics card

### Tailwind Configuration
- Custom colors: emerald, teal untuk brand
- Custom animations: shimmer loading
- Responsive breakpoints
- Font family: Inter

## 🔐 Security Features

1. **Authentication**
   - Email/password via Firebase Auth
   - Session management
   - Auto logout on token expiry

2. **Authorization**
   - Role-based access control
   - Protected routes
   - Function-level security

3. **Data Validation**
   - Client-side: react-hook-form
   - Server-side: Firestore rules
   - Input sanitization

4. **Audit Trail**
   - createdBy/updatedBy tracking
   - Timestamp for all operations
   - Soft delete preservation

## 📊 Features Matrix

| Feature | User | Admin |
|---------|------|-------|
| View Dashboard | ✅ | ✅ |
| Add Record | ✅ | ✅ |
| View All Records | ✅ | ✅ |
| Edit Own Record | ✅ | ✅ |
| Edit Any Record | ❌ | ✅ |
| Delete Record | ❌ | ✅ |
| Export CSV | ✅ | ✅ |
| Manage Users | ❌ | ✅ |

## 🚀 Getting Started Quick Reference

```bash
# 1. Install dependencies
npm install

# 2. Setup Firebase
# - Create project in Firebase Console
# - Enable Auth & Firestore
# - Copy config to .env.local

# 3. Deploy security rules
firebase deploy --only firestore:rules

# 4. Create admin
cd scripts
npm install
node create-admin.js

# 5. Run dev server
npm run dev

# 6. Build for production
npm run build

# 7. Deploy to Firebase Hosting
firebase deploy --only hosting
```

## 📝 Important Notes

1. **Never commit:**
   - `.env.local`
   - `serviceAccountKey.json`
   - `data.csv`

2. **Always backup:**
   - Firestore data (monthly)
   - Firebase config
   - User list

3. **Regular maintenance:**
   - Update dependencies
   - Review security rules
   - Audit user access
   - Monitor usage quotas

## 📞 Support & Resources

- **Documentation**: See README.md
- **User Manual**: USER_MANUAL.md
- **Setup Guide**: SETUP_ADMIN.md
- **Deployment**: DEPLOYMENT.md
- **Migration**: MIGRATION.md

## 📄 License

© 2026 - All Rights Reserved
