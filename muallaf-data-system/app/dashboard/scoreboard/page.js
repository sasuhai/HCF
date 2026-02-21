'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { getScoreboardStats } from '@/lib/supabase/database';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from 'recharts';
import {
    Activity,
    Users,
    Target,
    TrendingUp,
    Calendar,
    ChevronDown,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Download,
    Eye,
    Zap,
    Flag,
    Shield
} from 'lucide-react';

const COLORS = {
    emerald: ['#10B981', '#059669', '#047857', '#064E3B'],
    indigo: ['#6366F1', '#4F46E5', '#4338CA', '#312E81'],
    amber: ['#F59E0B', '#D97706', '#B45309', '#78350F'],
    slate: ['#64748B', '#475569', '#334155', '#1E293B'],
    rose: ['#F43F5E', '#E11D48', '#BE123C', '#881337'],
    white: '#FFFFFF',
    bg: '#F8FAFC'
};

const CATEGORIES = [
    { id: 'MUALAF', label: 'Pengurusan Mualaf', icon: Users, color: 'emerald' },
    { id: 'OUTREACH', label: 'Program Outreach', icon: Zap, color: 'indigo' },
    { id: 'DU\'AT', label: 'Pasukan Du\'at', icon: Shield, color: 'amber' },
    { id: 'Sukarelawan', label: 'Rakan Hidayah', icon: Flag, color: 'rose' }
];

export default function ScoreboardPage() {
    const { role, profile, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

    useEffect(() => {
        if (authLoading) return;
        fetchData();
    }, [authLoading, selectedYear, selectedMonth]);

    const fetchData = async () => {
        setLoading(true);
        const { data } = await getScoreboardStats(selectedYear);
        if (data) {
            setStats(data);
        }
        setLoading(false);
    };

    // Calculate Achievements for Summary Cards
    const summaryData = useMemo(() => {
        if (!stats) return CATEGORIES.map(cat => ({ ...cat, target: 0, actual: 0, percent: 0, data: [] }));

        return CATEGORIES.map(cat => {
            const catData = stats.rawKpi.filter(d =>
                (d.jenis === cat.id || d.jenis === cat.id.toUpperCase()) &&
                (!d.month || d.month === selectedMonth)
            );

            // Sum targets and actuals for this category in the selected month
            let totalTarget = 0;
            let totalActual = 0;

            catData.forEach(item => {
                totalTarget += (item.sasaran || 0);
                totalActual += (item.pencapaian || 0);
            });

            const percent = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;

            return {
                ...cat,
                target: totalTarget,
                actual: totalActual,
                percent,
                data: catData
            };
        });
    }, [stats, selectedMonth]);

    // Calculate YTD Progress for the circle indicator
    const overallProgress = useMemo(() => {
        if (!stats) return 0;
        const totalTarget = stats.rawKpi.reduce((acc, curr) => acc + curr.sasaran, 0);
        const totalActual = stats.rawKpi.reduce((acc, curr) => acc + curr.pencapaian, 0);
        return totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
    }, [stats]);

    // Calculate Area Chart Data for Monthly Trend
    const areaChartData = useMemo(() => {
        if (!stats) return [];
        const monthsShort = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
        return monthsShort.map((m, i) => {
            const mIdx = i + 1;
            const mData = stats.rawKpi.filter(d => d.month === mIdx);
            return {
                name: m,
                target: mData.reduce((acc, curr) => acc + curr.sasaran, 0),
                actual: mData.reduce((acc, curr) => acc + curr.pencapaian, 0)
            };
        });
    }, [stats]);

    if (loading && !stats) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-slate-50 flex flex-col pt-16">
                    <Navbar />
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-500 font-medium">Memuatkan Scoreboard...</p>
                        </div>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#F8FAFC] font-sans pt-16">
                <Navbar />

                <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10">

                    {/* Header with Glassmorphism Filter */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-emerald-600 font-bold tracking-wider text-[10px] uppercase">
                                <Shield className="w-3.5 h-3.5" />
                                <span>Strategic Performance Scoreboard</span>
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                                HCF Scoreboard <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">v1.2</span>
                            </h1>
                            <p className="text-slate-500 text-sm font-medium">Pantau prestasi KPI tahunan dan bulanan secara visual dan interaktif.</p>
                        </div>

                        <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl shadow-slate-200/50 p-2 rounded-[2rem] flex items-center space-x-2">
                            <div className="flex items-center space-x-1 px-4 py-2 bg-slate-100 rounded-2xl border border-slate-200/50">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                    className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                                >
                                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center space-x-1 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Bulan</span>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                    className="bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer"
                                >
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {new Date(2000, i).toLocaleString('ms-MY', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                                <Download className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Summary Achievement Donuts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {summaryData.map((item, idx) => (
                            <div key={idx} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100/80 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
                                <div className={`absolute -right-4 -top-4 w-32 h-32 bg-${item.color}-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 scale-0 group-hover:scale-110`}></div>

                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-3.5 bg-${item.color}-50 rounded-[1.25rem] group-hover:bg-${item.color}-500 transition-all duration-300`}>
                                        <item.icon className={`w-6 h-6 text-${item.color}-600 group-hover:text-white`} />
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className={`text-[10px] font-black text-${item.color}-600 uppercase tracking-widest`}>Achievement</span>
                                        <div className="flex items-center">
                                            {item.percent >= 100 ? (
                                                <TrendingUp className="w-3 h-3 text-emerald-500 mr-1" />
                                            ) : (
                                                <TrendingUp className="w-3 h-3 text-amber-500 mr-1" />
                                            )}
                                            <span className="text-xl font-black text-slate-900">{item.percent}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1 relative z-10">
                                    <h3 className="text-slate-500 font-bold text-xs uppercase tracking-tight">{item.label}</h3>
                                    <div className="flex items-baseline space-x-2">
                                        <span className="text-3xl font-black text-slate-900 tracking-tighter">
                                            {item.actual.toLocaleString()}
                                        </span>
                                        <span className="text-slate-400 font-bold text-sm">/ {item.target.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Mini Progress Bar */}
                                <div className="mt-6 h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                                    <div
                                        className={`h-full rounded-full bg-gradient-to-r from-${item.color}-400 to-${item.color}-600 transition-all duration-1000`}
                                        style={{ width: `${Math.min(item.percent, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                        {/* KPI Breakdown Table (Large) */}
                        <div className="xl:col-span-2 space-y-8">
                            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                                <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight">KPI Detail Breakdown</h3>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Januari — Disember {selectedYear}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-bold">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                            <span>Live Analytics</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-white">
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Metric Name</th>
                                                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-center">Target</th>
                                                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-center">Actual</th>
                                                <th className="px-5 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-center">% Achv.</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {stats?.rawKpi.filter(d => (!d.month || d.month === selectedMonth)).map((kpi, idx) => {
                                                const percent = kpi.sasaran > 0 ? Math.round((kpi.pencapaian / kpi.sasaran) * 100) : 0;
                                                const getStatusColor = (p) => {
                                                    if (p >= 100) return 'bg-emerald-500 text-white';
                                                    if (p >= 80) return 'bg-amber-500 text-white';
                                                    if (p >= 50) return 'bg-indigo-500 text-white';
                                                    return 'bg-rose-500 text-white';
                                                };

                                                return (
                                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center">
                                                                <div className={`w-1.5 h-8 bg-slate-300 rounded-full mr-4 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                                                                <div>
                                                                    <div className="text-sm font-black text-slate-800">{kpi.kpi_name}</div>
                                                                    <div className="text-[10px] font-bold text-slate-400 uppercase">{kpi.jenis}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-5 py-5 text-center font-bold text-slate-500 text-sm">{kpi.sasaran}</td>
                                                        <td className="px-5 py-5 text-center font-black text-slate-900 text-sm">{kpi.pencapaian}</td>
                                                        <td className="px-5 py-5">
                                                            <div className="flex flex-col items-center">
                                                                <span className="text-xs font-black text-slate-800 mb-1">{percent}%</span>
                                                                <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full bg-slate-600 transition-all duration-1000`}
                                                                        style={{ width: `${Math.min(percent, 100)}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 text-right">
                                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(percent)} shadow-lg shadow-slate-100`}>
                                                                {percent >= 100 ? 'Achieved' : percent >= 80 ? 'Warning' : 'Critical'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {(!stats || stats.rawKpi.filter(d => (!d.month || d.month === selectedMonth)).length === 0) && (
                                                <tr>
                                                    <td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-medium italic">
                                                        Tiada data KPI dijumpai bagi bulan yang dipilih.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Monthly Achievement Trend (Area Chart) */}
                            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 h-[400px]">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight">Monthly Achievement Trend</h3>
                                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Historical Performance across {selectedYear}</p>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                            <span className="text-[10px] font-black text-slate-500 uppercase">Actual</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
                                            <span className="text-[10px] font-black text-slate-500 uppercase">Target</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-[280px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={areaChartData}>
                                            <defs>
                                                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '1.25rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                            />
                                            <Area type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorActual)" />
                                            <Line type="monotone" dataKey="target" stroke="#E2E8F0" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar: Quick Stats & Insights */}
                        <div className="space-y-8">

                            {/* Performance Radar/Donut */}
                            <div className="bg-[#1E293B] rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                                <Activity className="absolute -right-4 -top-4 w-32 h-32 text-white/5" />
                                <div className="relative z-10">
                                    <h3 className="text-white font-black text-lg tracking-tight mb-2">Overall Year Progress</h3>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">Snapshot for {selectedYear}</p>

                                    <div className="flex flex-col items-center">
                                        <div className="relative w-48 h-48">
                                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                                <circle className="text-slate-700" strokeWidth="8" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                                                <circle
                                                    className="text-emerald-500"
                                                    strokeWidth="8"
                                                    strokeDasharray="251.2"
                                                    strokeDashoffset={251.2 - (251.2 * (overallProgress / 100))}
                                                    strokeLinecap="round"
                                                    stroke="currentColor"
                                                    fill="transparent"
                                                    r="40" cx="50" cy="50"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-4xl font-black text-white">{overallProgress}%</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">National YTD</span>
                                            </div>
                                        </div>

                                        <div className="mt-8 w-full space-y-4">
                                            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-3xl border border-slate-700/50">
                                                <div className="flex items-center space-x-3">
                                                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                                                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-200">High Performer</span>
                                                </div>
                                                <span className="text-sm font-black text-white">
                                                    {summaryData.sort((a, b) => b.percent - a.percent)[0]?.label || '-'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-3xl border border-slate-700/50">
                                                <div className="flex items-center space-x-3">
                                                    <div className="p-2 bg-rose-500/10 rounded-xl">
                                                        <Activity className="w-4 h-4 text-rose-500" />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-200">Needs Focus</span>
                                                </div>
                                                <span className="text-sm font-black text-white">
                                                    {summaryData.sort((a, b) => a.percent - b.percent)[0]?.label || '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity / Insights */}
                            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6 flex items-center">
                                    <Target className="w-5 h-5 text-indigo-500 mr-2" />
                                    Performance Insights
                                </h3>
                                <div className="space-y-6">
                                    {summaryData.filter(d => d.percent > 0).length > 0 ? (
                                        summaryData.filter(d => d.percent > 0).map((note, i) => (
                                            <div key={i} className="flex space-x-4 group">
                                                <div className={`w-1.5 h-auto rounded-full ${note.percent >= 100 ? 'bg-emerald-500' : note.percent >= 50 ? 'bg-indigo-500' : 'bg-rose-500'}`}></div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-800">{note.label}</h4>
                                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                                        {note.percent >= 100 ? `Tahniah! Sasaran ${note.label} telah dicapai.` :
                                                            note.percent >= 70 ? `Prestasi ${note.label} memberangsangkan (${note.percent}%).` :
                                                                `Prestasi ${note.label} memerlukan pemantauan rapi.`}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-slate-400 text-xs italic">Sila pilih bulan yang mempunyai data KPI.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}

