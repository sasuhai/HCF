'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { getOverallDashboardStats } from '@/lib/supabase/database';
import { Users, BookOpen, UserCheck, TrendingUp, MapPin, Activity, ArrowRight, Loader, Calendar } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    Legend
} from 'recharts';

const COLORS = ['#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444'];

export default function DashboardPage() {
    const { role, profile, loading: authLoading } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        const fetchStats = async () => {
            const { data } = await getOverallDashboardStats(role, profile);
            if (data) {
                setStats(data);
            }
            setLoading(false);
        };
        fetchStats();
    }, [authLoading, role, profile]);

    // Prepare Pie Data (Mualaf by State - Top 5 + Others)
    const pieData = stats ? Object.entries(stats.mualaf.byState)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value) : [];

    const finalPieData = pieData.length > 6 ? [
        ...pieData.slice(0, 6),
        { name: 'Lain-lain', value: pieData.slice(6).reduce((acc, curr) => acc + curr.value, 0) }
    ] : pieData;

    const formatDate = (timestamp) => {
        if (!timestamp) return '-';
        // Handle Firestore Timestamp or Date object
        const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
        return date.toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-50 flex flex-col">
                    <Navbar />
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center space-y-4">
                            <Loader className="w-10 h-10 text-emerald-500 animate-spin" />
                            <p className="text-gray-500 font-medium">Memuatkan data analitik...</p>
                        </div>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 font-sans">
                <Navbar />

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                                Gambaran Keseluruhan
                            </h1>
                            <p className="text-gray-500 mt-1">
                                Ringkasan prestasi dan data terkini HCF iSantuni
                            </p>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                            <Activity className="w-4 h-4 text-emerald-500" />
                            <span>Kemas kini terakhir: {new Date().toLocaleDateString('ms-MY')}</span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Total Mualaf */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Jumlah Mualaf</p>
                                    <h3 className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-emerald-600 transition-colors">
                                        {stats?.mualaf.total}
                                    </h3>
                                </div>
                                <div className="bg-emerald-50 p-3 rounded-xl group-hover:bg-emerald-100 transition-colors">
                                    <Users className="w-6 h-6 text-emerald-600" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block w-max">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                <span className="font-medium">Data Terkini</span>
                            </div>
                        </div>

                        {/* Total Kelas */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Jumlah Kelas</p>
                                    <h3 className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-blue-600 transition-colors">
                                        {stats?.classes.total}
                                    </h3>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-xl group-hover:bg-blue-100 transition-colors">
                                    <BookOpen className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block w-max">
                                <MapPin className="w-3 h-3 mr-1" />
                                <span className="font-medium">Semua Cawangan</span>
                            </div>
                        </div>

                        {/* Total Petugas */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Jumlah Petugas</p>
                                    <h3 className="text-3xl font-bold text-gray-900 mt-2 group-hover:text-violet-600 transition-colors">
                                        {stats?.workers.total}
                                    </h3>
                                </div>
                                <div className="bg-violet-50 p-3 rounded-xl group-hover:bg-violet-100 transition-colors">
                                    <UserCheck className="w-6 h-6 text-violet-600" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-xs text-violet-600 bg-violet-50 px-2 py-1 rounded inline-block w-max">
                                <Activity className="w-3 h-3 mr-1" />
                                <span className="font-medium">Berdaftar</span>
                            </div>
                        </div>

                        {/* Quick Link Card - Report */}
                        <Link href="/mualaf/dashboard" className="group">
                            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-6 shadow-md text-white h-full hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Activity className="w-24 h-24" />
                                </div>
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold mb-1">Laporan Lengkap</h3>
                                        <p className="text-emerald-100 text-sm">Lihat analisis حضور & kewangan terperinci</p>
                                    </div>
                                    <div className="flex items-center mt-4 bg-white/20 w-max px-3 py-1.5 rounded-lg backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                                        <span className="text-sm font-medium">Buka Dashboard</span>
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Chart Row 1: Registration & Geo */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Trend Mualaf (Bar Chart) - Takes 2/3 Width */}
                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-w-0">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Trend Pendaftaran Mualaf</h3>
                                    <p className="text-sm text-gray-500">Jumlah pendaftaran baharu (6 bulan terkini)</p>
                                </div>
                            </div>
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats?.mualaf.trend}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6B7280', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6B7280', fontSize: 12 }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#F3F4F6' }}
                                            contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                        <Bar
                                            dataKey="count"
                                            name="Pendaftaran"
                                            fill="#10B981"
                                            radius={[4, 4, 0, 0]}
                                            barSize={40}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* State Dist (Pie Chart) - Takes 1/3 Width */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-w-0">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-gray-900">Taburan Mengikut Negeri</h3>
                                <p className="text-sm text-gray-500">Pecahan mualaf berdaftar</p>
                            </div>
                            <div className="h-64 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={finalPieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {finalPieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <span className="text-2xl font-bold text-gray-900 block">{stats?.mualaf.total}</span>
                                        <span className="text-xs text-gray-500 uppercase tracking-wider">Total</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Chart Row 2: Attendance Trend (Area Chart) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-w-0">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Trend Kehadiran Kelas (Unik)</h3>
                            <p className="text-sm text-gray-500">Jumlah individu unik (Pelajar & Petugas) yang hadir ke kelas setiap bulan</p>
                        </div>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats?.attendance.trend}>
                                    <defs>
                                        <linearGradient id="colorMualaf" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorWorker" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Legend verticalAlign="top" height={36} />
                                    <Area
                                        type="monotone"
                                        dataKey="mualafCount"
                                        name="Mualaf (Unik)"
                                        stroke="#10B981"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorMualaf)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="workerCount"
                                        name="Petugas (Unik)"
                                        stroke="#6366F1"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorWorker)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Registrations Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Pendaftaran Terkini</h3>
                                <p className="text-sm text-gray-500">5 rekod mualaf terakhir didaftarkan</p>
                            </div>
                            <Link href="/senarai" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center">
                                Lihat Semua <ArrowRight className="w-4 h-4 ml-1" />
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Nama Penuh</th>
                                        <th className="px-6 py-3 font-medium">Tarikh Daftar</th>
                                        <th className="px-6 py-3 font-medium">Negeri</th>
                                        <th className="px-6 py-3 font-medium">Bangsa</th>
                                        <th className="px-6 py-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {stats?.mualaf.recent.length > 0 ? (
                                        stats.mualaf.recent.map((rec, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {rec.displayName || 'Tiada Nama'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    <div className="flex items-center">
                                                        <Calendar className="w-3 h-3 mr-1.5 text-gray-400" />
                                                        {formatDate(rec.createdAt)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        {rec.negeriCawangan || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {rec.bangsa || '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                        {rec.status || 'Active'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                                Tiada rekod terkini buat masa ini.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </main>
            </div>
        </ProtectedRoute>
    );
}
