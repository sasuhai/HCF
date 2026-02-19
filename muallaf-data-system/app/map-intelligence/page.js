'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { getOverallDashboardStats } from '@/lib/supabase/database';
import MalaysiaMap from '@/components/MalaysiaMap';
import {
    Users,
    UserCheck,
    Map as MapIcon,
    TrendingUp,
    Activity,
    ChevronRight,
    Loader,
    X
} from 'lucide-react';

export default function MapIntelligencePage() {
    const { user, role, profile, loading: authLoading } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedState, setSelectedState] = useState(null);
    const [viewMode, setViewMode] = useState('states'); // states or locations

    useEffect(() => {
        if (!authLoading) {
            const fetchStats = async () => {
                try {
                    const { data } = await getOverallDashboardStats(role, profile);
                    if (data) {
                        setStats(data);
                    }
                } catch (error) {
                    console.error("Error fetching map stats:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchStats();
        }
    }, [authLoading, role, profile]);

    // Normalize stats ONLY for map-intelligence (Aggregate Sabah - Tawau, etc -> Sabah)
    const normalizedStats = useMemo(() => {
        if (!stats) return null;

        const stateStats = {};
        Object.entries(stats.mualaf?.stateStats || {}).forEach(([full, data]) => {
            const clean = full.split('-')[0].trim();
            if (!stateStats[clean]) stateStats[clean] = { registrations: 0, conversions: 0 };
            stateStats[clean].registrations += (data.registrations || 0);
            stateStats[clean].conversions += (data.conversions || 0);
        });

        return {
            ...stats,
            mualaf: {
                ...stats.mualaf,
                stateStats
            }
        };
    }, [stats]);

    // Aggregate conversions if missing
    const totalConversions = useMemo(() => {
        if (!normalizedStats) return 0;
        return Object.values(normalizedStats.mualaf.stateStats).reduce((acc, curr) => acc + (curr.conversions || 0), 0);
    }, [normalizedStats]);

    const rankingData = useMemo(() => {
        if (!normalizedStats) return [];
        return Object.entries(normalizedStats.mualaf.stateStats)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => (b.registrations || 0) - (a.registrations || 0));
    }, [normalizedStats]);

    if (loading || authLoading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-slate-50 flex flex-col pt-16">
                    <Navbar />
                    <div className="flex-1 flex items-center justify-center">
                        <Loader className="w-10 h-10 text-emerald-500 animate-spin" />
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[#F8FAFC] pt-16">
                <Navbar />

                <main className="max-w-[1800px] mx-auto px-6 py-6 font-primary">
                    {/* Top Section: Header & Quick Stats */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60">
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-indigo-600 font-bold tracking-widest text-[10px] uppercase">
                                <MapIcon className="w-3 h-3" />
                                <span>Geospatial Intelligence</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                Peta Taburan <span className="text-emerald-500 underline decoration-emerald-200 decoration-4 underline-offset-8">Mualaf</span>
                            </h1>
                        </div>

                        {/* Horizontal Stats */}
                        <div className="flex flex-wrap gap-4 lg:gap-6">
                            <div className="flex items-center space-x-4 px-6 py-3 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                                <div className="p-2 bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-100">
                                    <Users className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-wider leading-none mb-1">Pendaftaran</p>
                                    <p className="text-xl font-black text-emerald-700">{stats?.mualaf?.total || 0}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4 px-6 py-3 bg-indigo-50 rounded-2xl border border-indigo-100/50">
                                <div className="p-2 bg-indigo-500 text-white rounded-lg shadow-lg shadow-indigo-100">
                                    <UserCheck className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-indigo-600/60 uppercase tracking-wider leading-none mb-1">Pengislaman</p>
                                    <p className="text-xl font-black text-indigo-700">{totalConversions}</p>
                                </div>
                            </div>

                            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
                                <button
                                    onClick={() => setViewMode('locations')}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all duration-300 ${viewMode === 'locations' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    PETA INTERAKTIF
                                </button>
                                <button
                                    onClick={() => setViewMode('states')}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all duration-300 ${viewMode === 'states' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    PANDUAN NEGERI
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-[calc(100vh-260px)] min-h-[750px] mb-6">
                        {/* Map Section (Expanded) */}
                        <div className="xl:col-span-9 bg-white rounded-[3rem] shadow-sm border border-slate-200/60 relative overflow-hidden group">
                            <div className="w-full h-full relative z-10 transition-transform duration-700">
                                <MalaysiaMap
                                    stats={normalizedStats}
                                    viewMode={viewMode}
                                    selectedState={selectedState}
                                    onSelect={(name) => setSelectedState(name)}
                                />
                            </div>

                            {/* Map Info Overlay (Floating) */}
                            {selectedState && (
                                <div className="absolute top-6 left-6 z-20 animate-in slide-in-from-top-4 duration-500">
                                    <div className="bg-white/95 backdrop-blur-md p-6 rounded-[2rem] border border-slate-200 shadow-2xl min-w-[280px]">
                                        <div className="flex items-center justify-between mb-4">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detail Wilayah</p>
                                            <button onClick={() => setSelectedState(null)} className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 p-1.5 rounded-full">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <h4 className="text-2xl font-black text-slate-900 mb-6">{selectedState}</h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100/30 text-center">
                                                <p className="text-[8px] font-bold text-emerald-600/60 uppercase tracking-tighter mb-1">Reg</p>
                                                <p className="text-xl font-black text-emerald-600">{normalizedStats?.mualaf?.stateStats?.[selectedState]?.registrations || 0}</p>
                                            </div>
                                            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100/30 text-center">
                                                <p className="text-[8px] font-bold text-indigo-600/60 uppercase tracking-tighter mb-1">Conv</p>
                                                <p className="text-xl font-black text-indigo-600">{normalizedStats?.mualaf?.stateStats?.[selectedState]?.conversions || 0}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Sidebar: All States List (Compact) */}
                        <div className="xl:col-span-3 bg-white rounded-[3rem] shadow-sm border border-slate-200/60 overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-black text-slate-900 flex items-center">
                                        <Activity className="w-4 h-4 mr-2 text-indigo-500" />
                                        Wilayah Malaysia
                                    </h3>
                                    <span className="text-[10px] font-bold text-indigo-600 bg-white px-3 py-1 rounded-full uppercase border border-slate-100 shadow-sm">
                                        {rankingData.length} Negeri
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                <div className="space-y-1.5">
                                    {rankingData.map((state, idx) => (
                                        <div
                                            key={state.name}
                                            onClick={() => setSelectedState(state.name)}
                                            className={`group cursor-pointer px-4 py-2.5 rounded-2xl transition-all duration-200 border border-transparent ${selectedState === state.name
                                                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 border-indigo-600'
                                                : 'hover:bg-slate-50 text-slate-600 hover:border-slate-200'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[11px] ${selectedState === state.name ? 'bg-white/20 text-white' :
                                                        idx < 3 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-50' : 'bg-slate-100 text-slate-400'
                                                        }`}>
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <p className={`text-xs font-black transition-colors ${selectedState === state.name ? 'text-white' : 'text-slate-800'}`}>
                                                            {state.name}
                                                        </p>
                                                        <div className={`flex items-center space-x-2 mt-0.5 ${selectedState === state.name ? 'text-white/70' : 'text-slate-400'}`}>
                                                            <span className="text-[9px] font-bold uppercase tracking-tighter">
                                                                {state.registrations} Reg
                                                            </span>
                                                            <span className="w-1 h-1 bg-current rounded-full opacity-30"></span>
                                                            <span className="text-[9px] font-bold uppercase tracking-tighter">
                                                                {state.conversions} Conv
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <ChevronRight className={`w-4 h-4 transition-all transform ${selectedState === state.name ? 'text-white translate-x-1' : 'text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1'}`} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                <style jsx>{`
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
                `}</style>
            </div>
        </ProtectedRoute>
    );
}
