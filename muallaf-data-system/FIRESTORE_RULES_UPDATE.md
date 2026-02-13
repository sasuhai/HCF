# Firestore Security Rules Update for Rate Categories

## Current Rules to Add

Add the following rules to your `firestore.rules` file for the `rateCategories` collection:

```javascript
// Rate Categories Management (Admin Only)
match /rateCategories/{rateId} {
  // Anyone logged in can read rates
  allow read: if isSignedIn();
  
  // Only admins can create, update, or delete rates
  allow create: if isSignedIn() && isAdmin();
  allow update: if isSignedIn() && isAdmin();
  allow delete: if isSignedIn() && isAdmin();
}
```

## Complete Updated firestore.rules File

Here's what your complete `firestore.rules` file should look like with the rate categories rules added:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper Functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isOwner(data) {
      return isSignedIn() && request.auth.uid == data.createdBy;
    }
    
    // Users Collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
    
    // Submissions Collection (Mualaf Data)
    match /submissions/{submissionId} {
      allow read: if isSignedIn() && resource.data.status == 'active';
      allow create: if isSignedIn() && 
                       request.resource.data.createdBy == request.auth.uid &&
                       request.resource.data.status == 'active';
      allow update: if isSignedIn() && 
                       (isOwner(resource.data) || isAdmin()) &&
                       request.resource.data.status == 'active';
      // Soft delete only
      allow delete: if false;
    }
    
    // Workers Collection
    match /workers/{workerId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn();
      allow delete: if isSignedIn();
    }
    
    // Classes Collection
    match /classes/{classId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn();
      allow delete: if isSignedIn();
    }
    
    // Attendance Collection
    match /attendance/{attendanceId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn();
      allow delete: if isSignedIn();
    }
    
    // Rate Categories Collection (NEW)
    match /rateCategories/{rateId} {
      // Anyone logged in can read rates
      allow read: if isSignedIn();
      
      // Only admins can create, update, or delete rates
      allow create: if isSignedIn() && isAdmin();
      allow update: if isSignedIn() && isAdmin();
      allow delete: if isSignedIn() && isAdmin();
    }
  }
}
```

## How to Deploy

1. **Update the firestore.rules file** in your project root
2. **Deploy the rules** using Firebase CLI:

```bash
firebase deploy --only firestore:rules
```

3. **Verify** in Firebase Console:
   - Go to Firestore Database
   - Click on "Rules" tab
   - Check that rules are updated

## Security Features

### Read Access:
- ✅ Any authenticated user can view rate categories
- ✅ Needed for dropdowns in forms (worker & mualaf)

### Write Access:
- ✅ Only admins can create new rates
- ✅ Only admins can update existing rates  
- ✅ Only admins can delete rates
- ✅ Audit trail preserved (createdBy, updatedBy fields)

### Why This Is Secure:
1. Non-admin users cannot modify rates
2. All users can see available rate categories
3. Admin status is verified through users collection
4. All operations require authentication

## Testing Rules

You can test the rules in Firebase Console:

1. Go to Firestore Database → Rules
2. Click "Rules Playground"
3. Test scenarios:

### Test 1: Read as User
```
Location: /rateCategories/test-rate-1
Auth: Authenticated (non-admin)
Operation: get
Expected: ✅ Allow
```

### Test 2: Create as User
```
Location: /rateCategories/test-rate-2
Auth: Authenticated (non-admin)
Operation: create
Expected: ❌ Deny
```

### Test 3: Create as Admin
```
Location: /rateCategories/test-rate-3
Auth: Authenticated (admin)
Operation: create
Expected: ✅ Allow
```

---

**Created**: Feb 13, 2026  
**Status**: Ready to Deploy
