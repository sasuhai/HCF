'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getUserProfile, signIn, signOut, resetPassword, updatePassword } from '@/lib/supabase/auth';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRecovery, setIsRecovery] = useState(false);

    useEffect(() => {
        let mounted = true;
        console.log("AuthProvider: Mounting...");

        // Safety timeout to prevent infinite loading
        const safetyTimeout = setTimeout(() => {
            if (mounted && loading) {
                console.warn("AuthProvider: Safety timeout triggered. Forcing loading to false.");
                setLoading(false);
            }
        }, 5000); // 5 seconds timeout

        // Check active session first
        const checkSession = async () => {
            console.log("AuthProvider: Checking session...");
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (session?.user) {
                    console.log("AuthProvider: Session found for", session.user.email);
                    if (mounted) await handleUser(session.user);
                } else {
                    console.log("AuthProvider: No session found.");
                    if (mounted) setLoading(false);
                }
            } catch (error) {
                console.error("AuthProvider: Auth check failed:", error);
                if (mounted) setLoading(false);
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;
            console.log("AuthProvider: Auth state change event:", event);

            if (event === 'PASSWORD_RECOVERY') {
                setIsRecovery(true);
            }

            if (session?.user) {
                await handleUser(session.user);
            } else {
                console.log("AuthProvider: No user in session (signed out)");
                setUser(null);
                setRole(null);
                setProfile(null);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const handleUser = async (user) => {
        console.log("AuthProvider: Handling user update for", user.id);

        // Optimistically set user to unblock UI immediately
        setUser(user);

        try {
            // Add a timeout to profile fetch so it doesn't block forever
            const fetchProfilePromise = getUserProfile(user.id);
            const timeoutPromise = new Promise(resolve => setTimeout(() => resolve(null), 3000));

            const userProfile = await Promise.race([fetchProfilePromise, timeoutPromise]);

            console.log("AuthProvider: Profile fetched:", userProfile ? "Found" : "Not Found (or timed out)");

            // Update with full profile info
            if (userProfile) {
                setRole(userProfile.role || 'editor');
                setProfile(userProfile);
            } else {
                setRole('editor'); // Default call
            }
        } catch (error) {
            console.error("AuthProvider: Error in handleUser:", error);
            setRole('editor');
        } finally {
            setLoading(false);
        }
    };

    // Wrap signIn to force state update
    const signInWrapper = async (email, password) => {
        setLoading(true);
        try {
            const result = await signIn(email, password);
            if (result.user) {
                console.log("AuthProvider: SignIn successful, updating user state manually.");
                await handleUser(result.user);
            } else {
                setLoading(false);
            }
            return result;
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    // Wrap signOut
    const signOutWrapper = async () => {
        setLoading(true);
        try {
            const result = await signOut();
            if (!result.error) {
                setUser(null);
                setRole(null);
                setProfile(null);
            }
            setLoading(false);
            return result;
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const value = {
        user,
        role,
        profile,
        loading,
        signIn: signInWrapper,
        signOut: signOutWrapper,
        resetPassword,
        updatePassword,
        isRecovery,
        setIsRecovery,
        isAdmin: role === 'admin'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
