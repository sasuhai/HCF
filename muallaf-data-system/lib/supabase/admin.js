
import { createClient } from '@supabase/supabase-js';

// Only for Server-Side (API Routes) use.
// This requires SUPABASE_SERVICE_ROLE_KEY environment variable.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
    // throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations.');
    // Don't throw for now, just log or allow empty client to be created (which will fail later)
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey || '', {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
