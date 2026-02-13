'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, AlertCircle, LogIn, ArrowLeft, CheckCircle } from 'lucide-react';

export default function LoginPage() {
    const [view, setView] = useState('login'); // 'login' or 'forgot'

    // Login State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Reset Password State
    const [resetEmail, setResetEmail] = useState('');
    const [resetStatus, setResetStatus] = useState({ error: '', success: '' });
    const [resetLoading, setResetLoading] = useState(false);

    const { user, signIn, resetPassword } = useAuth(); // Destructure user
    const router = useRouter();

    // Effect: Redirect when user is authenticated
    useEffect(() => {
        if (user) {
            router.replace('/dashboard');
        }
    }, [user, router]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Use FormData to reliably get values (fixes autofill sync issues)
        const formData = new FormData(e.currentTarget);
        const emailVal = formData.get('email');
        const passwordVal = formData.get('password');

        if (!emailVal || !passwordVal) {
            setError('Sila isi kedua-dua email dan kata laluan.');
            setLoading(false);
            return;
        }

        try {
            const result = await signIn(emailVal, passwordVal);
            if (result.error) {
                setError('Email atau kata laluan tidak sah. Sila cuba lagi.');
                setLoading(false);
            }
            // Do not redirect here manually. Let useEffect handle it.
            // But we keep loading true to prevent user interacting while redirect happens.
        } catch (err) {
            setError('Ralat semasa log masuk. Sila cuba lagi.');
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
                        {view === 'login' ? 'Sila log masuk untuk meneruskan' : 'Reset Kata Laluan'}
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
                                <input
                                    name="password"
                                    type="password"
                                    defaultValue={password}
                                    className="form-input"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                    disabled={loading}
                                />
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
