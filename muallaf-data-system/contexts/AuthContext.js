'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getUserProfile, signIn, signOut, resetPassword, updatePassword } from '@/lib/supabase/auth';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('hcf_role');
        return null;
    });
    const [profile, setProfile] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('hcf_profile');
            try { return saved ? JSON.parse(saved) : null; } catch (e) { return null; }
        }
        return null;
    });
    const [loading, setLoading] = useState(true);
    const [isRecovery, setIsRecovery] = useState(false);
    const lastUserFetchRef = useRef(null);

    // Initial session check should not be redundant with onAuthStateChange if possible
    // But we keep it for consistency.

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
            console.log(`AuthProvider: Event [${event}] for ${session?.user?.email || 'no-user'}`);

            if (event === 'PASSWORD_RECOVERY') {
                setIsRecovery(true);
            }

            if (session?.user) {
                // Background update
                handleUser(session.user);
            } else if (event === 'SIGNED_OUT') {
                console.log("AuthProvider: Explicit sign out recorded.");
                setUser(null);
                setRole(null);
                setProfile(null);
                lastUserFetchRef.current = null;
                localStorage.removeItem('hcf_role');
                localStorage.removeItem('hcf_profile');
                setLoading(false);
            } else if (!session) {
                // If session is null but it's not a sign out, we might be in middle of refresh
                // Only clear if we are sure we're logic out
                console.log("AuthProvider: Null session event - ignoring to prevent flicker");
            }
        });

        return () => {
            mounted = false;
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
        };
    }, []);

    const handleUser = async (currentUser) => {
        if (!currentUser) return;

        // Update user object immediately
        setUser(currentUser);

        // LOCK: If already fetching or already fetched for this exact user ID
        if (lastUserFetchRef.current === currentUser.id && profile && role) {
            return;
        }

        const metadataRole = currentUser.app_metadata?.role || currentUser.user_metadata?.role;
        // Only use metadataRole as a fallback if it's 'admin' or if we have absolutely no other role
        if (metadataRole && (!role || (metadataRole === 'admin' && metadataRole !== role))) {
            console.log("AuthProvider: Using metadata role fallback:", metadataRole);
            setRole(metadataRole);
            localStorage.setItem('hcf_role', metadataRole);
        }

        console.log("AuthProvider: Syncing profile for", currentUser.id);
        lastUserFetchRef.current = currentUser.id;

        try {
            // Fetch profile with long timeout
            const fetchProfilePromise = getUserProfile(currentUser.id);
            const timeoutPromise = new Promise(resolve => setTimeout(() => resolve('timeout'), 6000));

            const userProfile = await Promise.race([fetchProfilePromise, timeoutPromise]);

            if (userProfile && userProfile !== 'timeout') {
                const fetchedRole = userProfile.role || 'editor';

                // CRITICAL: Prevents flickering back to editor if we had a role
                if (fetchedRole !== role) {
                    console.log(`AuthProvider: Role update: ${role} -> ${fetchedRole}`);
                    setRole(fetchedRole);
                    localStorage.setItem('hcf_role', fetchedRole);
                }

                setProfile(userProfile);
                localStorage.setItem('hcf_profile', JSON.stringify(userProfile));
            } else {
                console.warn("AuthProvider: Profile fetch deferred. Persistence kept role as:", role);
                // If we have nothing at all, default
                if (!role) setRole('editor');
            }
        } catch (error) {
            console.error("AuthProvider: handleUser error:", error);
            if (!role) setRole('editor');
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
                lastUserFetchRef.current = null;
                localStorage.removeItem('hcf_role');
                localStorage.removeItem('hcf_profile');
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
