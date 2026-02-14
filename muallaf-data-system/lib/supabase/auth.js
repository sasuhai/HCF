import { supabase } from './client';

// Login
export const signIn = async (email, password) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        return { user: data.user, error: null };
    } catch (error) {
        return { user: null, error: error.message };
    }
};

// Logout
export const signOut = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

// Reset Password
export const resetPassword = async (email) => {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/login`,
        });
        if (error) throw error;
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

// Update Password
export const updatePassword = async (newPassword) => {
    try {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });
        if (error) throw error;
        return { error: null };
    } catch (error) {
        return { error: error.message };
    }
};

// Register User (Admin only)
export const registerUser = async (email, password, userData) => {
    try {
        // Supabase Admin API needed to create user without logging in?
        // Or just use signUp? If use signUp, it might log the current user out if not mindful.
        // Actually, Supabase client handles session.
        // If an admin is creating a user, usually they use the service_role key or Admin API.
        // But here we are using the public client.
        // If we use signUp while logged in, it acts as the new user?
        // documentation says: verify if signUp signs in automatically. Yes it does by default unless `autoSignIn: false` is set in options?
        // Actually no, creates a user. 
        // Wait, standard `signUp` often creates a session.
        // `supabase.auth.admin.createUser` requires service_role key.
        // The existing firebase implementation uses `createUserWithEmailAndPassword` which definitely signs in the new user immediately in client SDK.
        // So the Admin would be logged out?
        // Let's check `scripts/create-admin.js`. It runs in node, so likely not logged in.
        // But the app might have an admin page to create users?
        // Feature Matrix says: "Manage Users: Admin only".
        // If Admin is logged in and calls `registerUser`, we don't want to log them out.
        // Firebase `createUserWithEmailAndPassword` signs in automatically.
        // The app `registerUser` function in `lib/firebase/auth.js` does exactly that.
        // If the Admin uses this to create *another* user, they will be switched to that new user session!
        // This is a common pitfall in client-side Firebase admin panels.
        // If the user accepts this current behavior, I will replicate it in Supabase using `signUp`.
        // However, Supabase `signUp` might restrict creation if email confirmation is on.

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: userData.name,
                    role: userData.role
                }
            }
        });

        if (error) throw error;

        if (data.user) {
            // Manually insert into public users table
            const { error: dbError } = await supabase
                .from('users')
                .insert({
                    id: data.user.id,
                    email: email,
                    role: userData.role || 'editor',
                    name: userData.name,
                    assignedLocations: userData.assignedLocations || [],
                    createdAt: new Date().toISOString()
                });

            if (dbError) {
                // cleaning up auth user if db insert fails is hard without admin key
                console.error('Error creating user profile:', dbError);
                return { user: data.user, error: 'User created but profile failed: ' + dbError.message };
            }
        }

        return { user: data.user, error: null };
    } catch (error) {
        return { user: null, error: error.message };
    }
};

// Get User Role
export const getUserRole = async (uid) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', uid)
            .single();

        if (error || !data) return 'editor';
        return data.role;
    } catch (error) {
        console.error('Error getting user role:', error);
        return 'editor';
    }
};

// Get User Profile
export const getUserProfile = async (uid) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', uid)
            .single();

        if (error) {
            // Check for specific error code for "no rows found" if applicable, though .single() returns error if none.
            // Supabase returns code: "PGRST116" for no rows.
            if (error.code === 'PGRST116') {
                return null;
            }
            throw error;
        }
        return data;
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
};
