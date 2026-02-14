
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function DELETE(request, { params }) {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        // Attempt to delete DB record first (so FK constraints don't block Auth delete if not cascade)
        // Assuming Supabase Admin can do this even with RLS, because service_role bypasses RLS.
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', id);

        if (dbError) {
            console.error("DB User Delete Error:", dbError);
            return NextResponse.json({ error: "Database Delete Error: " + dbError.message }, { status: 400 });
        }

        // Delete Auth User
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (authError) {
            console.error("Auth User Delete Error:", authError);
            // Even if DB delete succeeds, if Auth delete fails, we have inconsistent state (Orphaned Auth User).
            // But better than failing both.
            return NextResponse.json({ error: "Auth Delete Error: " + authError.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Internal Delete Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
