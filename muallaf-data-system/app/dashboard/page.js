'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { getStatistics } from '@/lib/firebase/firestore';
import { Users, Calendar, TrendingUp, FileText } from 'lucide-react';

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        const { data, error } = await getStatistics();
        if (!error && data) {
            setStats(data);
        }
        setLoading(false);
    };

    const statCards = [
        {
            title: 'Jumlah Rekod',
            value: stats?.total || 0,
            icon: Users,
            color: 'emerald',
            gradient: 'from-emerald-500 to-teal-500'
        },
        {
            title: 'Rekod Hari Ini',
            value: stats?.today || 0,
            icon: Calendar,
            color: 'blue',
            gradient: 'from-blue-500 to-cyan-500'
        },
        {
            title: 'Rekod Bulan Ini',
            value: stats?.thisMonth || 0,
            icon: TrendingUp,
            color: 'purple',
            gradient: 'from-purple-500 to-pink-500'
        }
    ];

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
                <Navbar />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
                        <p className="text-gray-600">Selamat datang ke Sistem Pengurusan Data Mualaf</p>
                    </div>

                    {/* Stats Grid */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="animate-shimmer h-32 rounded-xl"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {statCards.map((stat, index) => {
                                const Icon = stat.icon;
                                return (
                                    <div
                                        key={index}
                                        className="stat-card border-emerald-500 hover:scale-105 cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-600 mb-1">
                                                    {stat.title}
                                                </p>
                                                <p className="text-4xl font-bold text-gray-900">
                                                    {stat.value}
                                                </p>
                                            </div>
                                            <div className={`bg-gradient-to-r ${stat.gradient} p-3 rounded-xl`}>
                                                <Icon className="h-8 w-8 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Link href="/borang">
                            <div className="card hover:shadow-xl transition-all duration-200 cursor-pointer group">
                                <div className="flex items-center space-x-4">
                                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 rounded-xl group-hover:scale-110 transition-transform duration-200">
                                        <FileText className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                            Tambah Rekod Baru
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Daftar data kemasukan mualaf baharu
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        <Link href="/senarai">
                            <div className="card hover:shadow-xl transition-all duration-200 cursor-pointer group">
                                <div className="flex items-center space-x-4">
                                    <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 rounded-xl group-hover:scale-110 transition-transform duration-200">
                                        <Users className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                            Lihat Senarai Rekod
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Semak dan urus data sedia ada
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Info Card */}
                    <div className="mt-8 card bg-gradient-to-r from-emerald-50 to-teal-50 border-l-4 border-emerald-500">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Maklumat Sistem
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-center space-x-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                <span>Semua data disimpan dengan selamat dalam Cloud Firestore</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                <span>Setiap perubahan data direkod untuk audit trail</span>
                            </li>
                            <li className="flex items-center space-x-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                <span>Hanya pentadbir boleh memadam rekod</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
