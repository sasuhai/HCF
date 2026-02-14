'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, AlertCircle, LogIn, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const [view, setView] = useState('login'); // 'login' or 'forgot'

    // Login State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Reset Password State
    const [resetEmail, setResetEmail] = useState('');
    const [resetStatus, setResetStatus] = useState({ error: '', success: '' });
    const [resetLoading, setResetLoading] = useState(false);

    // Update Password State (after link clicked)
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const { user, signIn, resetPassword, updatePassword, isRecovery, setIsRecovery } = useAuth();
    const router = useRouter();

    // Effect: Switch to reset view if in recovery mode
    useEffect(() => {
        if (isRecovery) {
            setView('reset');
        }
    }, [isRecovery]);

    // Effect: Redirect when user is authenticated
    useEffect(() => {
        if (user && !isRecovery) {
            console.log("LoginPage: User authenticated, redirecting...");
            window.location.href = '/';
        }
    }, [user, isRecovery]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const emailVal = formData.get('email').trim();
        const passwordVal = formData.get('password').trim();

        if (!emailVal || !passwordVal) {
            setError('Sila isi kedua-dua email dan kata laluan.');
            setLoading(false);
            return;
        }

        console.log("LoginPage: Attempting login for", emailVal);

        try {
            const result = await signIn(emailVal, passwordVal);
            console.log("LoginPage: SignIn result:", result);

            if (result.error) {
                console.error("LoginPage: Login failed:", result.error);
                setError('Email atau kata laluan tidak sah. Sila cuba lagi.');
                setLoading(false);
            } else {
                console.log("LoginPage: Login success. User:", result.user?.email);
                // Manually redirect if useEffect doesn't trigger quickly enough
                setTimeout(() => {
                    console.log("LoginPage: Manual redirect timeout triggering...");
                    window.location.href = '/';
                }, 1000);
            }
        } catch (err) {
            console.error("LoginPage: Login exception:", err);
            setError('Ralat semasa log masuk: ' + (err.message || "Unknown error"));
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setResetStatus({ error: '', success: '' });
        setResetLoading(true);

        try {
            const result = await resetPassword(resetEmail);
            if (result.error) {
                setResetStatus({ error: 'Gagal menghantar email. Pastikan alamat email sah.', success: '' });
            } else {
                setResetStatus({
                    error: '',
                    success: 'Pautan reset kata laluan telah dihantar. Sila semak peti masuk atau folder SPAM email anda.'
                });
                setResetEmail(''); // Clear input
            }
        } catch (err) {
            setResetStatus({ error: 'Ralat tidak dijangka.', success: '' });
        } finally {
            setResetLoading(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setError('');
        setResetStatus({ error: '', success: '' });

        if (newPassword.length < 6) {
            setError('Kata laluan mesti sekurang-kurangnya 6 aksara.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Kata laluan tidak sepadan.');
            return;
        }

        setLoading(true);
        try {
            const result = await updatePassword(newPassword);
            if (result.error) {
                setError(result.error);
            } else {
                setResetStatus({
                    error: '',
                    success: 'Kata laluan berjaya dikemaskini. Sila log masuk semula.'
                });
                setIsRecovery(false);
                setView('login');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (err) {
            setError('Ralat semasa mengemaskini kata laluan.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl mb-4 shadow-lg">
                        <LogIn className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                        Sistem Data Mualaf
                    </h1>
                    <p className="text-gray-600">
                        {view === 'login' ? 'Sila log masuk untuk meneruskan' :
                            view === 'forgot' ? 'Reset Kata Laluan' : 'Tukar Kata Laluan Baru'}
                    </p>
                </div>

                {/* Card Container */}
                <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">

                    {/* LOGIN VIEW */}
                    {view === 'login' && (
                        <form onSubmit={handleLogin} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start space-x-3">
                                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            <div>
                                <label className="form-label flex items-center space-x-2">
                                    <Mail className="h-4 w-4 text-emerald-600" />
                                    <span>Alamat Email</span>
                                </label>
                                <input
                                    name="email"
                                    type="email"
                                    defaultValue={email}
                                    className="form-input"
                                    placeholder="nama@contoh.com"
                                    required
                                    autoComplete="email"
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="form-label flex items-center space-x-2">
                                    <Lock className="h-4 w-4 text-emerald-600" />
                                    <span>Kata Laluan</span>
                                </label>
                                <div className="relative">
                                    <input
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        defaultValue={password}
                                        className="form-input pr-10"
                                        placeholder="••••••••"
                                        required
                                        autoComplete="current-password"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                <div className="text-right mt-1">
                                    <button
                                        type="button"
                                        onClick={() => { setView('forgot'); setResetEmail(email); }}
                                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                                    >
                                        Lupa / Tukar Kata Laluan?
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transform transition-transform active:scale-95"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Memuatkan...</span>
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="h-5 w-5" />
                                        <span>Log Masuk</span>
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* RESET PASSWORD (UPDATE) VIEW */}
                    {view === 'reset' && (
                        <form onSubmit={handleUpdatePassword} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start space-x-3">
                                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            <p className="text-sm text-gray-600">
                                Sila masukkan kata laluan baru anda di bawah.
                            </p>

                            <div>
                                <label className="form-label flex items-center space-x-2">
                                    <Lock className="h-4 w-4 text-emerald-600" />
                                    <span>Kata Laluan Baru</span>
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="form-input"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="form-label flex items-center space-x-2">
                                    <Lock className="h-4 w-4 text-emerald-600" />
                                    <span>Sahkan Kata Laluan Baru</span>
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="form-input"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Mengemaskini...</span>
                                    </>
                                ) : (
                                    <span>Simpan Kata Laluan Baru</span>
                                )}
                            </button>
                        </form>
                    )}

                    {/* FORGOT PASSWORD VIEW */}
                    {view === 'forgot' && (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            {/* Status Messages */}
                            {resetStatus.error && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start space-x-3">
                                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-red-700">{resetStatus.error}</p>
                                </div>
                            )}
                            {resetStatus.success && (
                                <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start space-x-3">
                                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-green-700">{resetStatus.success}</p>
                                </div>
                            )}

                            <div>
                                <label className="form-label flex items-center space-x-2">
                                    <Mail className="h-4 w-4 text-emerald-600" />
                                    <span>Alamat Email</span>
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                    Masukkan email anda untuk menerima pautan bagi menetapkan semula atau menukar kata laluan.
                                </p>
                                <input
                                    type="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    className="form-input"
                                    placeholder="nama@contoh.com"
                                    required
                                    autoComplete="email"
                                    disabled={resetLoading}
                                />
                            </div>

                            <div className="space-y-3">
                                <button
                                    type="submit"
                                    disabled={resetLoading}
                                    className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
                                >
                                    {resetLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            <span>Menghantar...</span>
                                        </>
                                    ) : (
                                        <span>Hantar Pautan Reset</span>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setView('login'); setResetStatus({ error: '', success: '' }); }}
                                    className="w-full flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800 text-sm font-medium py-2"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    <span>Kembali ke Log Masuk</span>
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Footer */}
                    <div className="mt-6 text-center text-sm text-gray-600 border-t border-gray-100 pt-4">
                        <p>Hubungi pentadbir sistem untuk bantuan</p>
                    </div>
                </div>

                {/* Version */}
                <p className="text-center text-xs text-gray-500 mt-6">
                    Versi 1.0.0 © 2026
                </p>
            </div>
        </div>
    );
}
