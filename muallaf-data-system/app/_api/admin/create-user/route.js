
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request) {
    try {
        const body = await request.json();
        const { email, password, name, role, assignedLocations } = body;

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        // Call Supabase Admin Auth
        const { data: user, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true // Confirm email immediately (no email sent by default unless configured)
        });

        // Note: Supabase Admin createUser does NOT send confirmation email by default unless configured.
        // It creates a confirmed user if email_confirm: true.

        if (authError) {
            console.error('Error creating auth user:', authError);
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        if (!user || !user.user) {
            return NextResponse.json({ error: "Failed to create user object" }, { status: 500 });
        }

        // Insert into 'users' table
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .insert({
                id: user.user.id,
                email,
                name: name || '',
                role: role || 'editor',
                assignedLocations: assignedLocations || [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

        if (dbError) {
            console.error('Error creating user profile in DB:', dbError);
            // Rollback auth user? 
            await supabaseAdmin.auth.admin.deleteUser(user.user.id);
            return NextResponse.json({ error: "Database error: " + dbError.message }, { status: 400 });
        }

        return NextResponse.json({ success: true, user: user.user });
    } catch (err) {
        console.error('Create user error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
