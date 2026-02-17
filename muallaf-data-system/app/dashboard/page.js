'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { getOverallDashboardStats } from '@/lib/supabase/database';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
    ReferenceLine,
} from 'recharts';

import {
    Users,
    BookOpen,
    UserCheck,
    TrendingUp,
    MapPin,
    Activity,
    ArrowRight,
    Loader,
    Calendar,
    ChevronRight,
    Search,
    Filter,
    ArrowUpRight,
    Database,
    Clock,
    Map
} from 'lucide-react';

const COLORS = {
    primary: '#10B981', // Emerald 500
    secondary: '#6366F1', // Indigo 500
    accent: '#3B82F6', // Blue 500
    danger: '#EF4444', // Red 500
    warning: '#F59E0B', // Amber 500
    neutral: '#64748B', // Slate 500
    bg: '#F8FAFC', // Slate 50
    card: '#FFFFFF'
};

export default function DashboardPage() {
    const { role, profile, loading: authLoading } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [trendView, setTrendView] = useState('yearly'); // 'yearly' or 'monthly'
    const [selectedLokasi, setSelectedLokasi] = useState(null);
    const [selectedNegeri, setSelectedNegeri] = useState(null);

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



    // Location Drill-down Data
    const locationData = stats?.mualaf.byLocation || [];

    // 1. Isolate "Tiada Lokasi"
    const tiadaLokasiItem = locationData.find(l => l.name === 'Tiada Lokasi');
    const filteredLocations = locationData.filter(l => l.name !== 'Tiada Lokasi');

    // 2. Get Top 20 from known locations
    const top20 = filteredLocations.slice(0, 20);
    const remainingKnown = filteredLocations.slice(20);

    // 3. Combine remaining known into "Lain-lain"
    const lainLainCount = remainingKnown.reduce((acc, curr) => acc + curr.value, 0);

    // 4. Build final list
    const finalLocationData = [...top20];
    if (lainLainCount > 0) {
        finalLocationData.push({ name: 'Lain-lain Lokasi', value: lainLainCount });
    }
    if (tiadaLokasiItem && tiadaLokasiItem.value > 0) {
        finalLocationData.push({ name: 'Tiada Lokasi', value: tiadaLokasiItem.value });
    }

    const selectedLocationTrend = selectedLokasi ? stats?.mualaf.locationTrends[selectedLokasi] : null;

    // State Drill-down Data
    const stateData = stats?.mualaf.byState || [];
    const selectedStateTrend = selectedNegeri ? stats?.mualaf.stateTrends[selectedNegeri] : null;

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;

            const day = String(date.getDate()).padStart(2, '0');
            const months = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
            const month = months[date.getMonth()];
            const year = date.getFullYear();

            return `${day}/${month}/${year}`;
        } catch (e) {
            return dateString;
        }
    };

    const formatXAxisLabel = (value) => {
        if (!value || typeof value !== 'string') return value;

        // Handle Monthly labels like "Apr 25" or "Dis 25"
        const parts = value.split(' ');
        if (parts.length === 2) {
            const monthMap = {
                'Jan': '01', 'Feb': '02', 'Mar': '03', 'Mac': '03',
                'Apr': '04', 'May': '05', 'Mei': '05', 'Jun': '06',
                'Jul': '07', 'Aug': '08', 'Ogo': '08', 'Sep': '09',
                'Oct': '10', 'Okt': '10', 'Nov': '11', 'Dec': '12', 'Dis': '12'
            };
            const month = monthMap[parts[0]];
            if (month) return `${month}/${parts[1]}`;
        }
        return value;
    };

    const getAvg = (data, key) => {
        if (!data || data.length === 0) return 0;
        const sum = data.reduce((acc, curr) => acc + (curr[key] || 0), 0);
        return parseFloat((sum / data.length).toFixed(2));
    };

    const stateAvgReg = getAvg(selectedStateTrend, 'registrations');
    const stateAvgConv = getAvg(selectedStateTrend, 'conversions');
    const locAvgReg = getAvg(selectedLocationTrend, 'registrations');
    const locAvgConv = getAvg(selectedLocationTrend, 'conversions');

    const attendanceTrend = stats?.attendance.trend || [];
    const avgMualafAttend = getAvg(attendanceTrend, 'mualafCount');
    const avgWorkerAttend = getAvg(attendanceTrend, 'workerCount');

    const currentTrendData = trendView === 'yearly'
        ? stats?.mualaf.trend || []
        : stats?.mualaf.monthlyTrend || [];

    const mainAvgReg = getAvg(currentTrendData, 'registrations');
    const mainAvgConv = getAvg(currentTrendData, 'conversions');

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

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-emerald-600 font-semibold tracking-wider text-xs uppercase">
                                <Database className="w-4 h-4" />
                                <span>Pusat Kawalan Data</span>
                            </div>
                            <h1 className="text-4xl font-extrabold text-[#1E293B] tracking-tight">
                                iSantuni <span className="text-emerald-500">Analytics</span>
                            </h1>
                            <p className="text-slate-500 font-medium max-w-lg">
                                Selamat datang kembali. Pantau semua aktiviti pendaftaran, pengislaman dan kehadiran dalam satu paparan pintar.
                            </p>
                        </div>
                        <div className="flex items-center space-x-3 text-sm text-slate-600 bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200/60 backdrop-blur-sm">
                            <div className="bg-emerald-50 p-2 rounded-lg">
                                <Clock className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Status Terkini</p>
                                <span className="font-semibold">{new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {/* Total Mualaf */}
                        <div className="relative overflow-hidden bg-white rounded-3xl p-7 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 group">
                            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-emerald-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-emerald-100/50 rounded-2xl group-hover:bg-emerald-500 group-hover:rotate-6 transition-all duration-300">
                                        <Users className="w-6 h-6 text-emerald-600 group-hover:text-white" />
                                    </div>
                                    <div className="flex items-center text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                        <TrendingUp className="w-3 h-3 mr-1" />
                                        <span>LIVE</span>
                                    </div>
                                </div>
                                <p className="text-slate-500 font-medium text-sm">Jumlah Mualaf</p>
                                <div className="flex items-baseline space-x-2">
                                    <h3 className="text-4xl font-bold text-slate-900 mt-1">
                                        {stats?.mualaf.total.toLocaleString()}
                                    </h3>
                                    <span className="text-xs text-slate-400 font-medium">Orang</span>
                                </div>
                            </div>
                        </div>

                        {/* Total Kelas */}
                        <div className="relative overflow-hidden bg-white rounded-3xl p-7 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 group">
                            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-indigo-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-indigo-100/50 rounded-2xl group-hover:bg-indigo-500 group-hover:rotate-6 transition-all duration-300">
                                        <BookOpen className="w-6 h-6 text-indigo-600 group-hover:text-white" />
                                    </div>
                                    <div className="flex items-center text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                        <MapPin className="w-3 h-3 mr-1" />
                                        <span>NASIONAL</span>
                                    </div>
                                </div>
                                <p className="text-slate-500 font-medium text-sm">Jumlah Kelas</p>
                                <div className="flex items-baseline space-x-2">
                                    <h3 className="text-4xl font-bold text-slate-900 mt-1">
                                        {stats?.classes.total.toLocaleString()}
                                    </h3>
                                    <span className="text-xs text-slate-400 font-medium">Aktif</span>
                                </div>
                            </div>
                        </div>

                        {/* Total Petugas */}
                        <div className="relative overflow-hidden bg-white rounded-3xl p-7 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 group">
                            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-amber-50 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-amber-100/50 rounded-2xl group-hover:bg-amber-500 group-hover:rotate-6 transition-all duration-300">
                                        <UserCheck className="w-6 h-6 text-amber-600 group-hover:text-white" />
                                    </div>
                                    <div className="flex items-center text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                                        <Activity className="w-3 h-3 mr-1" />
                                        <span>PETUGAS</span>
                                    </div>
                                </div>
                                <p className="text-slate-500 font-medium text-sm">Jumlah Petugas</p>
                                <div className="flex items-baseline space-x-2">
                                    <h3 className="text-4xl font-bold text-slate-900 mt-1">
                                        {stats?.workers.total.toLocaleString()}
                                    </h3>
                                    <span className="text-xs text-slate-400 font-medium">Staf</span>
                                </div>
                            </div>
                        </div>

                        {/* Link Card: Map Intelligence */}
                        <Link href="/map-intelligence" className="group">
                            <div className="relative overflow-hidden bg-white rounded-3xl p-7 border-2 border-dashed border-slate-200 hover:border-emerald-500 transition-all duration-500 h-full flex flex-col justify-between group">
                                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
                                    <Map className="w-32 h-32 text-slate-900" />
                                </div>
                                <div className="relative z-10">
                                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-500 transition-colors duration-300">
                                        <Map className="w-6 h-6 text-emerald-600 group-hover:text-white" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 leading-tight">Peta Pintar<br />Geospatial</h3>
                                    <p className="text-slate-500 text-xs font-medium mt-2">Analisis taburan mualaf melalui peta interaktif.</p>
                                </div>
                                <div className="relative z-10 mt-6 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">Kecerdasan</span>
                                    <div className="bg-slate-100 p-2 rounded-full group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        </Link>

                        {/* Quick Link Card - Analytics */}
                        <Link href="/mualaf/dashboard" className="group">
                            <div className="relative overflow-hidden bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-3xl p-7 shadow-xl h-full flex flex-col justify-between hover:scale-[1.02] transition-all duration-500 transform-gpu">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                                    <TrendingUp className="w-24 h-24 text-white" />
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-xl font-bold text-white mb-2 leading-tight">Laporan Analitik<br />Lengkap</h3>
                                    <p className="text-slate-400 text-xs font-medium">Terokai data kehadiran dan kewangan yang mendalam.</p>
                                </div>
                                <div className="relative z-10 mt-6 flex items-center justify-between">
                                    <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-3 py-1.5 rounded-xl backdrop-blur-md border border-emerald-400/20">Dashboard</span>
                                    <div className="bg-white/10 p-2 rounded-full rotate-[-45deg] group-hover:rotate-0 transition-transform duration-500">
                                        <ArrowRight className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Chart Row 1: Registration Trend (Full Width) */}
                    <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 p-8 min-w-0 mb-8 transition-all duration-500 hover:shadow-[0_20px_50px_rgb(0,0,0,0.06)]">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Prestasi Pertumbuhan Mualaf</h3>
                                <p className="text-sm text-slate-500 font-medium">
                                    Analisis {trendView === 'yearly' ? 'tahunan sepanjang 10 tahun' : 'bulanan sepanjang setahun'}
                                </p>
                            </div>
                            <div className="flex bg-slate-100/80 p-1.5 rounded-2xl backdrop-blur-md">
                                <button
                                    onClick={() => setTrendView('yearly')}
                                    className={`px-5 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${trendView === 'yearly' ? 'bg-white text-slate-900 shadow-sm scale-100' : 'text-slate-500 hover:text-slate-700 scale-95'}`}
                                >
                                    TAHUNAN
                                </button>
                                <button
                                    onClick={() => setTrendView('monthly')}
                                    className={`px-5 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${trendView === 'monthly' ? 'bg-white text-slate-900 shadow-sm scale-100' : 'text-slate-500 hover:text-slate-700 scale-95'}`}
                                >
                                    BULANAN
                                </button>
                            </div>
                        </div>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={currentTrendData} margin={{ top: 20, bottom: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                                        dy={15} tickFormatter={formatXAxisLabel}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F8FAFC' }}
                                        contentStyle={{
                                            borderRadius: '1.25rem',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            padding: '1rem'
                                        }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Legend
                                        verticalAlign="top"
                                        align="right"
                                        height={50}
                                        iconType="circle"
                                        formatter={(value) => <span className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">{value}</span>}
                                    />
                                    <Bar
                                        dataKey="registrations"
                                        name="Pendaftaran"
                                        fill="#10B981"
                                        radius={[8, 8, 8, 8]}
                                        barSize={trendView === 'yearly' ? 40 : 25}
                                        label={{ position: 'top', fill: '#10B981', fontSize: 10, fontWeight: 'bold', offset: 8 }}
                                    />
                                    <Bar
                                        dataKey="conversions"
                                        name="Pengislaman"
                                        fill="#3B82F6"
                                        radius={[8, 8, 8, 8]}
                                        barSize={trendView === 'yearly' ? 40 : 25}
                                        label={{ position: 'top', fill: '#3B82F6', fontSize: 10, fontWeight: 'bold', offset: 8 }}
                                    />
                                    {mainAvgReg > 0 && (
                                        <ReferenceLine y={mainAvgReg} label={{ position: 'right', value: `Purata Pendaftaran: ${mainAvgReg}`, fill: '#10B981', fontSize: 10, fontWeight: 'bold' }} stroke="#10B981" strokeDasharray="3 3" />
                                    )}
                                    {mainAvgConv > 0 && (
                                        <ReferenceLine y={mainAvgConv} label={{ position: 'right', value: `Purata Pengislaman: ${mainAvgConv}`, fill: '#3B82F6', fontSize: 10, fontWeight: 'bold' }} stroke="#3B82F6" strokeDasharray="3 3" />
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Chart Row 2: State Drill-down */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* State List Card */}
                        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 p-8 transition-all duration-500 hover:shadow-[0_20px_50px_rgb(0,0,0,0.06)]">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Taburan Mengikut Negeri</h3>
                                    <p className="text-sm text-slate-500 font-medium">Klik untuk analisis trend bulanan</p>
                                </div>
                                {selectedNegeri && (
                                    <button
                                        onClick={() => setSelectedNegeri(null)}
                                        className="text-[10px] font-bold text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-500 px-3 py-1.5 rounded-xl transition-all duration-300 uppercase tracking-widest border border-emerald-100"
                                    >
                                        RESET
                                    </button>
                                )}
                            </div>
                            <div className="h-[700px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        layout="vertical"
                                        data={stateData}
                                        margin={{ left: 10, right: 40, top: 0, bottom: 0 }}
                                        onClick={(data) => {
                                            if (data && data.activeLabel) setSelectedNegeri(data.activeLabel);
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F1F5F9" />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            axisLine={false}
                                            tickLine={false}
                                            width={180}
                                            tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#F8FAFC', cursor: 'pointer' }}
                                            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value) => [`${value.toLocaleString()} orang`, 'Jumlah']}
                                        />
                                        <Bar
                                            dataKey="value"
                                            fill="#6366F1"
                                            radius={[0, 8, 8, 0]}
                                            barSize={20}
                                            className="cursor-pointer"
                                            label={{
                                                position: 'right',
                                                fill: '#64748B',
                                                fontSize: 10,
                                                fontWeight: 'bold',
                                                offset: 10,
                                                formatter: (val) => val > 0 ? val.toLocaleString() : ''
                                            }}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* State Trend Drill-down Container */}
                        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 p-8 transition-all duration-500 hover:shadow-[0_20px_50px_rgb(0,0,0,0.06)] flex flex-col justify-center min-h-[700px]">
                            {selectedNegeri ? (
                                <div className="w-full h-full animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="mb-8">
                                        <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
                                            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-xl mr-3 text-sm">{selectedNegeri}</span>
                                            Analisis Trend Bulanan
                                        </h3>
                                        <p className="text-sm text-slate-500 font-medium mt-2">Pendaftaran & Pengislaman (12 bulan terkini)</p>
                                    </div>
                                    <div className="space-y-8 w-full">
                                        <div className="bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100">
                                            <div className="flex items-center space-x-2 mb-4">
                                                <div className="w-2 h-4 bg-emerald-500 rounded-full"></div>
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trend Pendaftaran</h4>
                                            </div>
                                            <div className="h-[250px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={selectedStateTrend}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 600 }} tickFormatter={formatXAxisLabel} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 600 }} />
                                                        <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 / 0.1)' }} />
                                                        <Bar dataKey="registrations" name="Pendaftaran" fill="#10B981" barSize={14} radius={[4, 4, 4, 4]} label={{ position: 'top', fontSize: 9, fill: '#10B981', fontWeight: 'bold', offset: 5 }} />
                                                        {stateAvgReg > 0 && (
                                                            <ReferenceLine y={stateAvgReg} label={{ position: 'right', value: `Purata: ${stateAvgReg}`, fill: '#10B981', fontSize: 10, fontWeight: 'bold' }} stroke="#10B981" strokeDasharray="3 3" />
                                                        )}
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100">
                                            <div className="flex items-center space-x-2 mb-4">
                                                <div className="w-2 h-4 bg-blue-500 rounded-full"></div>
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trend Pengislaman</h4>
                                            </div>
                                            <div className="h-[250px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={selectedStateTrend}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 600 }} tickFormatter={formatXAxisLabel} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 600 }} />
                                                        <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 / 0.1)' }} />
                                                        <Bar dataKey="conversions" name="Pengislaman" fill="#3B82F6" barSize={14} radius={[4, 4, 4, 4]} label={{ position: 'top', fontSize: 9, fill: '#3B82F6', fontWeight: 'bold', offset: 5 }} />
                                                        {stateAvgConv > 0 && (
                                                            <ReferenceLine y={stateAvgConv} label={{ position: 'right', value: `Purata: ${stateAvgConv}`, fill: '#3B82F6', fontSize: 10, fontWeight: 'bold' }} stroke="#3B82F6" strokeDasharray="3 3" />
                                                        )}
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-20 animate-in zoom-in duration-500">
                                    <div className="bg-indigo-50/50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 transform group-hover:rotate-12 transition-transform duration-500">
                                        <MapPin className="w-10 h-10 text-indigo-300" />
                                    </div>
                                    <h4 className="text-slate-900 font-extrabold text-2xl mb-3 tracking-tight">Pilih Negeri</h4>
                                    <p className="text-slate-500 max-w-[280px] mx-auto text-sm font-medium leading-relaxed">
                                        Klik pada mana-mana bar di carta sebelah kiri untuk meneroka statistik trend bulanan.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chart Row 3: Location Drill-down */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Location List Card */}
                        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 p-8 transition-all duration-500 hover:shadow-[0_20px_50px_rgb(0,0,0,0.06)]">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Mualaf Mengikut Lokasi</h3>
                                    <p className="text-sm text-slate-500 font-medium">Klik lokasi untuk pecahan trend</p>
                                </div>
                                {selectedLokasi && (
                                    <button
                                        onClick={() => setSelectedLokasi(null)}
                                        className="text-[10px] font-bold text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-500 px-3 py-1.5 rounded-xl transition-all duration-300 uppercase tracking-widest border border-emerald-100"
                                    >
                                        RESET
                                    </button>
                                )}
                            </div>
                            <div className="h-[600px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        layout="vertical"
                                        data={finalLocationData}
                                        margin={{ left: 10, right: 40, top: 0, bottom: 0 }}
                                        onClick={(data) => {
                                            if (data && data.activeLabel) setSelectedLokasi(data.activeLabel);
                                        }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F1F5F9" />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            axisLine={false}
                                            tickLine={false}
                                            width={140}
                                            tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#F8FAFC', cursor: 'pointer' }}
                                            contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value) => [`${value.toLocaleString()} orang`, 'Jumlah']}
                                        />
                                        <Bar
                                            dataKey="value"
                                            fill="#10B981"
                                            radius={[0, 8, 8, 0]}
                                            barSize={18}
                                            className="cursor-pointer"
                                            label={{
                                                position: 'right',
                                                fill: '#64748B',
                                                fontSize: 10,
                                                fontWeight: 'bold',
                                                offset: 10,
                                                formatter: (val) => val > 0 ? val.toLocaleString() : ''
                                            }}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Location Trend Drill-down Container */}
                        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 p-8 transition-all duration-500 hover:shadow-[0_20px_50px_rgb(0,0,0,0.06)] flex flex-col justify-center min-h-[600px]">
                            {selectedLokasi ? (
                                <div className="w-full h-full animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="mb-8">
                                        <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
                                            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-xl mr-3 text-sm">{selectedLokasi}</span>
                                            Analisis Trend Bulanan
                                        </h3>
                                        <p className="text-sm text-slate-500 font-medium mt-2">Pendaftaran & Pengislaman (12 bulan terkini)</p>
                                    </div>
                                    <div className="space-y-8 w-full">
                                        <div className="bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100">
                                            <div className="flex items-center space-x-2 mb-4">
                                                <div className="w-2 h-4 bg-emerald-500 rounded-full"></div>
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trend Pendaftaran</h4>
                                            </div>
                                            <div className="h-[210px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={selectedLocationTrend}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 600 }} tickFormatter={formatXAxisLabel} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 600 }} />
                                                        <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 / 0.1)' }} />
                                                        <Bar dataKey="registrations" name="Pendaftaran" fill="#10B981" barSize={12} radius={[4, 4, 4, 4]} label={{ position: 'top', fontSize: 9, fill: '#10B981', fontWeight: 'bold', offset: 5 }} />
                                                        {locAvgReg > 0 && (
                                                            <ReferenceLine y={locAvgReg} label={{ position: 'right', value: `Purata: ${locAvgReg}`, fill: '#10B981', fontSize: 10, fontWeight: 'bold' }} stroke="#10B981" strokeDasharray="3 3" />
                                                        )}
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50/50 p-6 rounded-[1.5rem] border border-slate-100">
                                            <div className="flex items-center space-x-2 mb-4">
                                                <div className="w-2 h-4 bg-blue-500 rounded-full"></div>
                                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trend Pengislaman</h4>
                                            </div>
                                            <div className="h-[210px] w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={selectedLocationTrend}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 600 }} tickFormatter={formatXAxisLabel} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 9, fontWeight: 600 }} />
                                                        <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 / 0.1)' }} />
                                                        <Bar dataKey="conversions" name="Pengislaman" fill="#3B82F6" barSize={12} radius={[4, 4, 4, 4]} label={{ position: 'top', fontSize: 9, fill: '#3B82F6', fontWeight: 'bold', offset: 5 }} />
                                                        {locAvgConv > 0 && (
                                                            <ReferenceLine y={locAvgConv} label={{ position: 'right', value: `Purata: ${locAvgConv}`, fill: '#3B82F6', fontSize: 10, fontWeight: 'bold' }} stroke="#3B82F6" strokeDasharray="3 3" />
                                                        )}
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-20 animate-in zoom-in duration-500">
                                    <div className="bg-emerald-50/50 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-6 transform group-hover:rotate-12 transition-transform duration-500">
                                        <MapPin className="w-10 h-10 text-emerald-300" />
                                    </div>
                                    <h4 className="text-slate-900 font-extrabold text-2xl mb-3 tracking-tight">Pilih Lokasi</h4>
                                    <p className="text-slate-500 max-w-[280px] mx-auto text-sm font-medium leading-relaxed">
                                        Pilih mana-mana lokasi dari carta di sebelah untuk memperincikan data.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chart Row 4: Attendance Trend (Area Chart) */}
                    <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 p-8 min-w-0 transition-all duration-500 hover:shadow-[0_20px_50px_rgb(0,0,0,0.06)]">
                        <div className="flex items-center justify-between mb-8 cursor-default">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Kemandirian Komuniti</h3>
                                <p className="text-sm text-slate-500 font-medium">Trend kehadiran unik (Mualaf & Petugas)</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mualaf</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Petugas</span>
                                </div>
                            </div>
                        </div>
                        <div className="h-80 w-full mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={attendanceTrend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                                        dy={15} tickFormatter={formatXAxisLabel}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '1.25rem',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            padding: '1rem'
                                        }}
                                        itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                                    />
                                    <Bar
                                        dataKey="mualafCount"
                                        name="Mualaf"
                                        fill="#10B981"
                                        barSize={20}
                                        radius={[4, 4, 0, 0]}
                                        animationDuration={1500}
                                    />
                                    <Bar
                                        dataKey="workerCount"
                                        name="Petugas"
                                        fill="#6366F1"
                                        barSize={20}
                                        radius={[4, 4, 0, 0]}
                                        animationDuration={1500}
                                    />
                                    {avgMualafAttend > 0 && (
                                        <ReferenceLine y={avgMualafAttend} label={{ position: 'right', value: `Avg Mualaf: ${avgMualafAttend}`, fill: '#10B981', fontSize: 10, fontWeight: 'bold' }} stroke="#10B981" strokeDasharray="3 3" />
                                    )}
                                    {avgWorkerAttend > 0 && (
                                        <ReferenceLine y={avgWorkerAttend} label={{ position: 'right', value: `Avg Petugas: ${avgWorkerAttend}`, fill: '#6366F1', fontSize: 10, fontWeight: 'bold' }} stroke="#6366F1" strokeDasharray="3 3" />
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Registrations Table */}
                    <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200/60 transition-all duration-500 hover:shadow-[0_20px_50px_rgb(0,0,0,0.06)] overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                            <div className="flex items-center space-x-4">
                                <div className="p-3 bg-white rounded-2xl shadow-sm">
                                    <Users className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Pendaftaran Terkini</h3>
                                    <p className="text-sm text-slate-500 font-medium">Rekod mualaf terbaru mengikut sistem</p>
                                </div>
                            </div>
                            <Link href="/senarai" className="group flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest">
                                <span>Lihat Semua</span>
                                <div className="bg-slate-100 p-1.5 rounded-lg group-hover:bg-emerald-50 transition-colors">
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Penuh</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tarikh Daftar</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Negeri</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bangsa</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {stats?.mualaf.recent.length > 0 ? (
                                        stats.mualaf.recent.map((rec, idx) => (
                                            <tr key={idx} className="group hover:bg-slate-50/80 transition-all duration-300">
                                                <td className="px-8 py-6">
                                                    <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{rec.displayName || 'Tiada Nama'}</div>
                                                    <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{rec.namaAsal || 'N/A'}</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center text-slate-600 font-medium text-sm">
                                                        <Calendar className="w-3.5 h-3.5 mr-2 text-slate-300" />
                                                        {formatDate(rec.createdAt)}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-tight">
                                                        {rec.negeriCawangan || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-slate-600 font-semibold text-sm">
                                                    {rec.bangsa || '-'}
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-tight">
                                                        AKTIF
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-16 text-center">
                                                <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                    <Database className="w-8 h-8 text-slate-200" />
                                                </div>
                                                <p className="text-slate-400 font-medium">Tiada rekod terkini ditemui.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </main>
            </div >
        </ProtectedRoute >
    );
}
