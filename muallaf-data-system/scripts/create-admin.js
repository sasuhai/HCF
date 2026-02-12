/**
 * Script untuk create admin user
 * 
 * Instructions:
 * 1. npm install firebase-admin
 * 2. Download serviceAccountKey.json dari Firebase Console
 * 3. Letakkan serviceAccountKey.json dalam folder ini
 * 4. Edit email, password, dan name di bawah
 * 5. Run: node create-admin.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function createAdmin() {
    // ============================================================
    // EDIT BAHAGIAN INI - TUKAR KEPADA INFO ADMIN SEBENAR
    // ============================================================
    const email = 'admin@example.com';        // TUKAR INI
    const password = 'ChangeMe123!';    // TUKAR INI (min 8 characters)
    const name = 'Admin User';             // TUKAR INI
    // ============================================================

    console.log('════════════════════════════════════════');
    console.log('🔄 Mencipta Admin User');
    console.log('════════════════════════════════════════');
    console.log('Email:', email);
    console.log('Nama:', name);
    console.log('');

    try {
        // Check if user already exists
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(email);
            console.log('⚠️  User dengan email ini sudah wujud!');
            console.log('UID:', userRecord.uid);
            console.log('');

            // Update role to admin
            await db.collection('users').doc(userRecord.uid).set({
                email: email,
                name: name,
                role: 'admin',
                updatedAt: new Date().toISOString()
            }, { merge: true });

            console.log('✅ Role dikemaskini kepada admin');

        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                // User doesn't exist, create new one
                console.log('🔧 Mencipta user baru dalam Authentication...');
                userRecord = await admin.auth().createUser({
                    email: email,
                    password: password,
                    displayName: name
                });
                console.log('✅ User created in Authentication');
                console.log('UID:', userRecord.uid);
                console.log('');

                // Add to Firestore
                console.log('🔧 Menambah document dalam Firestore...');
                await db.collection('users').doc(userRecord.uid).set({
                    email: email,
                    name: name,
                    role: 'admin',
                    createdAt: new Date().toISOString()
                });
                console.log('✅ Document created in Firestore');

            } else {
                throw error;
            }
        }

        console.log('');
        console.log('════════════════════════════════════════');
        console.log('🎉 Admin Created Successfully!');
        console.log('════════════════════════════════════════');
        console.log('');
        console.log('Login dengan credentials berikut:');
        console.log('  Email    :', email);
        console.log('  Password :', password);
        console.log('  Role     : admin');
        console.log('');
        console.log('⚠️  PENTING:');
        console.log('1. Simpan credentials ini dengan selamat');
        console.log('2. Tukar password selepas login pertama');
        console.log('3. Jangan share credentials dengan orang lain');
        console.log('');

        process.exit(0);

    } catch (error) {
        console.error('');
        console.error('════════════════════════════════════════');
        console.error('❌ Error Creating Admin');
        console.error('════════════════════════════════════════');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        console.error('');

        if (error.code === 'auth/email-already-exists') {
            console.error('💡 Penyelesaian:');
            console.error('   User dengan email ini sudah wujud.');
            console.error('   Gunakan email lain atau delete user sedia ada.');
        } else if (error.code === 'auth/invalid-email') {
            console.error('💡 Penyelesaian:');
            console.error('   Format email tidak sah. Pastikan email format betul.');
        } else if (error.code === 'auth/weak-password') {
            console.error('💡 Penyelesaian:');
            console.error('   Password terlalu lemah. Gunakan minimum 6 characters.');
        }

        console.error('');
        process.exit(1);
    }
}

// Run the script
createAdmin().catch(console.error);
