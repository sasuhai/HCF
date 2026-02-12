'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getUserProfile, signIn as firebaseSignIn, signOut as firebaseSignOut } from '@/lib/firebase/auth';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Fetch full profile
                const userProfile = await getUserProfile(user.uid);
                setUser(user);
                setRole(userProfile?.role || 'editor');
                setProfile(userProfile);
            } else {
                setUser(null);
                setRole(null);
                setProfile(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signIn = async (email, password) => {
        return await firebaseSignIn(email, password);
    };

    const signOut = async () => {
        return await firebaseSignOut();
    };

    const value = {
        user,
        role,
        profile,
        loading,
        signIn,
        signOut,
        isAdmin: role === 'admin'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
