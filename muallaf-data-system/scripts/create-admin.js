/**
 * Script untuk create admin user (Supabase)
 * 
 * Instructions:
 * 1. Pastikan .env.local mempunyai SUPABASE_SERVICE_ROLE_KEY
 * 2. Run: node scripts/create-admin.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createAdmin() {
    // ============================================================
    // EDIT BAHAGIAN INI - TUKAR KEPADA INFO ADMIN SEBENAR
    // ============================================================
    const email = 'sasuhai0@gmail.com';     // TUKAR INI
    const password = 'ChangeMe123!';        // TUKAR INI (min 6 characters)
    const name = 'Admin User';              // TUKAR INI
    // ============================================================

    console.log('════════════════════════════════════════');
    console.log('🔄 Mencipta Admin User (Supabase)');
    console.log('════════════════════════════════════════');
    console.log('Email:', email);
    console.log('Nama:', name);
    console.log('');

    try {
        // 1. Create User in Auth
        const { data: { user }, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true
        });

        let userId = user?.id;

        if (createError) {
            // If user already exists, try to get user by email? 
            // Supabase Admin API doesn't have getUserByEmail directly in the same way, but listUsers can filter?
            // Actually, standard way is to just proceed if error indicates duplicate, but we need the ID.
            // Let's list users and find by email.
            const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = users.find(u => u.email === email);

            if (existingUser) {
                console.log('⚠️  User dengan email ini sudah wujud dalam Auth!');
                userId = existingUser.id;
            } else {
                throw createError;
            }
        } else {
            console.log('✅ User created in Authentication');
        }

        console.log('UID:', userId);
        console.log('');

        // 2. Create/Update Profile in 'users' table
        console.log('🔧 Mengemaskini profile dalam table users...');

        const { error: upsertError } = await supabaseAdmin
            .from('users')
            .upsert({
                id: userId,
                email: email,
                name: name,
                role: 'admin',
                updatedAt: new Date().toISOString()
            }, { onConflict: 'id' });

        if (upsertError) throw upsertError;

        console.log('✅ Profile dikemaskini dengan role: admin');
        console.log('');
        console.log('════════════════════════════════════════');
        console.log('🎉 Admin Check/Creation Successful!');
        console.log('════════════════════════════════════════');
        console.log('Login dengan credentials berikut:');
        console.log('  Email    :', email);
        console.log('  Password :', password);
        console.log('');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createAdmin();
