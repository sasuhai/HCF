'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { supabase } from '@/lib/supabase/client';
import { getStates } from '@/lib/supabase/database';
import {
    Search,
    Download,
    RefreshCcw,
    ChevronDown,
    Activity,
    Table as TableIcon,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Filter,
    Layers,
    MapPin,
    Trophy,
    Settings
} from 'lucide-react';
import Link from 'next/link';

const MONTHS = [
    'JAN', 'FEB', 'MAC', 'APR', 'MEI', 'JUN',
    'JUL', 'OGO', 'SEP', 'OKT', 'NOV', 'DIS'
];

// Fallback rows in case DB is not yet initialized
const FALLBACK_ROWS = [
    { category: 'Outreach', perkara: 'Bil. Aktiviti Outreach', source: 'programs', config: { kpiName: 'Aktiviti Outreach' } },
    { category: 'Outreach', perkara: 'Bil. Aktiviti Outreach anjuran bersama GDM', source: 'programs', config: { anjuran: 'GDM' } },
    { category: 'Outreach', perkara: 'Bil. Syahadah di program outreach', source: 'programs', config: { field: 'kehadiran_syahadah' } },
    { category: 'Outreach', perkara: 'Bil. Engagement dengan Non Muslim', source: 'programs', config: { field: 'kehadiran_non_muslim' } },
    { category: 'Outreach', perkara: 'Bil. Quality Engagement', source: 'programs', config: { field: 'kehadiran_quality' } },
    { category: 'Outreach', perkara: 'Bil. Engagement Mad\'u 3 Bintang', source: 'programs', config: { field: 'kehadiran_madu' } },
    { category: 'Outreach', perkara: 'Bil. Pengislaman (Keseluruhan)', source: 'submissions', config: { isPengislaman: true } },
    { category: 'Outreach', perkara: 'Bil. Pengislaman oleh Duat Kualiti', source: 'submissions', config: { isDuatKualiti: true } },
    { category: 'Outreach', perkara: 'Bil. Pengislaman Lain-lain', source: 'submissions', config: { isPengislaman: false } },
    { category: 'Outreach', perkara: 'Bil. Syahadah Dibantu dan Disusuli oleh HCF', source: 'submissions', config: { isFollowedUp: true } },
    { category: 'Outreach', perkara: 'Bil. Mad\'u 3 Bintang direkodkan', source: 'other_kpis', config: { kpiName: 'Mad\'u 3 Bintang' } },
    { category: 'Outreach', perkara: 'Bil. Organisasi Non-muslim dibina hubungan', source: 'other_kpis', config: { kpiName: 'Organisasi Non-muslim' } }
];

export default function LaporanKPIPage() {
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedState, setSelectedState] = useState('');
    const [selectedZone, setSelectedZone] = useState('');

    const [states, setStates] = useState([]);
    const [kpiRows, setKpiRows] = useState(FALLBACK_ROWS);
    const [rawData, setRawData] = useState({
        programs: [],
        submissions: [],
        other_kpis: [],
        attendance: []
    });

    const years = [2024, 2025, 2026];
    const zones = Array.from(new Set(states.map(s => s.zon).filter(Boolean))).sort();
    const filteredStates = selectedZone ? states.filter(s => s.zon === selectedZone).map(s => s.name) : states.map(s => s.name);

    useEffect(() => {
        const fetchLookups = async () => {
            const { data } = await getStates();
            if (data) setStates(data);
        };
        fetchLookups();
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const { data, error } = await supabase
                .from('kpi_settings')
                .select('*')
                .order('order_index', { ascending: true });

            if (!error && data && data.length > 0) {
                setKpiRows(data);
            }
        } catch (e) {
            console.log("Config table not available, using fallback.");
        }
    };

    useEffect(() => {
        loadData();
    }, [selectedYear]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [progRes, subRes, kpiRes, attRes] = await Promise.all([
                supabase.from('programs').select('*').eq('tahun', selectedYear),
                supabase.from('mualaf').select('*').gte('tarikhPengislaman', `${selectedYear}-01-01`).lte('tarikhPengislaman', `${selectedYear}-12-31`),
                supabase.from('other_kpis').select('*').eq('year', selectedYear),
                supabase.from('attendance_records').select('*').eq('year', selectedYear.toString())
            ]);

            setRawData({
                programs: progRes.data || [],
                submissions: subRes.data || [],
                other_kpis: kpiRes.data || [],
                attendance: attRes.data || []
            });
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const matchesFilter = (record, source) => {
        const stateField = source === 'submissions' ? 'negeriCawangan' : (source === 'attendance' ? 'negeri' : (source === 'programs' ? 'negeri' : 'state'));
        const recState = record[stateField];

        if (selectedState && recState !== selectedState) return false;
        if (selectedZone) {
            const stateObj = states.find(s => s.name === recState);
            if (stateObj?.zon !== selectedZone) return false;
        }
        return true;
    };

    const getMonthData = (rowConfig, monthIdx) => {
        const m = monthIdx + 1;
        const config = rowConfig.config || {};
        let filtered = [];

        if (rowConfig.source === 'programs') {
            filtered = rawData.programs.filter(p => p.bulan === m && matchesFilter(p, 'programs'));
            if (config.field) {
                return filtered.reduce((acc, curr) => acc + (Number(curr[config.field]) || 0), 0);
            }
            if (config.subKategori) {
                return filtered.filter(p => p.sub_kategori?.includes(config.subKategori)).length;
            }
            if (config.anjuran) {
                return filtered.filter(p => p.anjuran?.includes(config.anjuran)).length;
            }
            return filtered.length;
        }

        if (rowConfig.source === 'mualaf' || rowConfig.source === 'submissions') {
            filtered = rawData.submissions.filter(s => {
                const date = new Date(s.tarikhPengislaman);
                return (date.getMonth() + 1) === m && matchesFilter(s, 'submissions');
            });
            if (config.isPengislaman === true) filtered = filtered.filter(s => s.kategori?.toLowerCase() === 'pengislaman');
            if (config.isPengislaman === false) filtered = filtered.filter(s => s.kategori?.toLowerCase() !== 'pengislaman');
            if (config.isDuatKualiti) filtered = filtered.filter(s => s.pengislamanKPI?.isDuatKualiti);
            if (config.isFollowedUp) filtered = filtered.filter(s => s.pengislamanKPI?.isFollowedUp);
            return filtered.length;
        }

        if (rowConfig.source === 'other_kpis') {
            const kpis = rawData.other_kpis.filter(k => k.month === m && matchesFilter(k, 'other_kpis'));
            if (config.tab) {
                filtered = kpis.filter(k => k.category === config.tab);
                if (config.is_baru !== undefined) {
                    filtered = filtered.filter(d => !!d.data?.is_baru === config.is_baru);
                }
                if (config.status_rh_aktif !== undefined) {
                    filtered = filtered.filter(d => !!d.data?.status_rh_aktif === config.status_rh_aktif);
                }
                return filtered.length;
            }
            if (config.kpiName) {
                const kpi = kpis.find(k => k.data?.kpi === config.kpiName || k.data?.nama_kpi === config.kpiName);
                return Number(kpi?.data?.pencapaian) || 0;
            }
            return 0;
        }

        if (rowConfig.source === 'attendance') {
            filtered = rawData.attendance.filter(a => {
                let monthNum = Number(a.month);
                if (isNaN(monthNum) && a.id?.includes('-')) {
                    monthNum = Number(a.id.split('-').pop());
                }
                return monthNum === m && matchesFilter(a, 'attendance');
            });
            if (config.type === 'class_count') return filtered.length;
            if (config.type === 'student_count') {
                return filtered.reduce((acc, curr) => acc + (curr.students?.length || 0), 0);
            }
        }

        if (rowConfig.source === 'calc') {
            return 0; // Handled in second pass
        }

        return 0;
    };

    const getSasaran = (rowConfig) => {
        const config = rowConfig.config || {};
        const kpiName = config.kpiName || (rowConfig.perkara === 'Bil. Aktiviti Outreach' ? 'Aktiviti Outreach' : null);

        if (kpiName) {
            const target = rawData.other_kpis.find(k =>
                k.category === 'kpi_utama' &&
                (k.data?.kpi === kpiName || k.data?.nama_kpi === kpiName) &&
                matchesFilter(k, 'other_kpis')
            );
            return Number(target?.data?.sasaran) || 0;
        }

        return '-';
    };

    const aggregatedRows = useMemo(() => {
        // First pass: aggregate data for all rows
        const rows = kpiRows.map(row => {
            const monthsData = MONTHS.map((_, i) => getMonthData(row, i));
            const totalPencapaian = row.source === 'calc' ? 0 : monthsData.reduce((acc, curr) => acc + curr, 0);
            const sasaran = getSasaran(row);

            return {
                ...row,
                months: monthsData,
                total: totalPencapaian,
                sasaran: sasaran
            };
        });

        // Second pass: Update 'calc' rows correctly if they depend on other rows
        return rows.map(row => {
            if (row.source === 'calc') {
                if (row.config?.type === 'ratio') {
                    const numRow = rows.find(r => r.perkara === row.config.numerator);
                    const denRow = rows.find(r => r.perkara === row.config.denominator);

                    if (numRow && denRow) {
                        const monthsData = MONTHS.map((_, i) => {
                            const numVal = numRow.months[i] || 0;
                            const denVal = denRow.months[i] || 0;
                            return denVal > 0 ? Math.round((numVal / denVal) * 100) : 0;
                        });
                        const totalPencapaian = denRow.total > 0 ? Math.round((numRow.total / denRow.total) * 100) : 0;
                        return { ...row, months: monthsData, total: totalPencapaian };
                    }
                }
            }
            return row;
        });
    }, [rawData, selectedState, selectedZone, states, kpiRows]);

    const exportToCSV = () => {
        const headers = ['Kategori', 'Perkara', 'Sasaran', 'Pencapaian', ...MONTHS];
        const rows = aggregatedRows.map(row => [
            row.category,
            row.perkara,
            row.sasaran,
            row.total,
            ...row.months
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Laporan_KPI_${selectedYear}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-50 pt-16">
                <Navbar />

                <div className="max-w-[1800px] mx-auto px-4 py-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-emerald-600 p-3 rounded-2xl shadow-lg shadow-emerald-200">
                                <Trophy className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Laporan KPI Strategik</h1>
                                <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Dashboard Prestasi Keseluruhan HCF</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link href="/laporan-prestasi/tetapan" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-all shadow-sm flex items-center gap-2 font-bold text-sm">
                                <Settings className="h-4 w-4" />
                                Tetapan KPI
                            </Link>
                            <button
                                onClick={loadData}
                                className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-all shadow-sm"
                                title="Kemaskini Data"
                            >
                                <RefreshCcw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                            <button
                                onClick={exportToCSV}
                                className="flex items-center px-4 py-2 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Eksport CSV
                            </button>
                        </div>
                    </div>

                    {/* Filters Bar */}
                    <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 mb-6 sticky top-[72px] z-40">
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg">
                                    <Activity className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Tahun Analisis</label>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        className="bg-transparent font-bold text-slate-800 text-sm outline-none cursor-pointer pr-4"
                                    >
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg">
                                    <Layers className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Zon / Wilayah</label>
                                    <select
                                        value={selectedZone}
                                        onChange={(e) => {
                                            setSelectedZone(e.target.value);
                                            setSelectedState('');
                                        }}
                                        className="bg-transparent font-bold text-slate-800 text-sm outline-none cursor-pointer pr-4"
                                    >
                                        <option value="">Semua Zon</option>
                                        {zones.map(z => <option key={z} value={z}>{z}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 rounded-lg">
                                    <MapPin className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Negeri / Cawangan</label>
                                    <select
                                        value={selectedState}
                                        onChange={(e) => setSelectedState(e.target.value)}
                                        className="bg-transparent font-bold text-slate-800 text-sm outline-none cursor-pointer pr-4 w-[200px]"
                                    >
                                        <option value="">Semua Negeri</option>
                                        {filteredStates.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="ml-auto bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 flex items-center gap-3">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Dynamic Engine v2.0</span>
                            </div>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden mb-10">
                        <div className="overflow-x-auto min-h-[600px]">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b-2 border-slate-200">
                                        <th className="sticky left-0 z-20 bg-slate-50 px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0] min-w-[150px]">Kategori</th>
                                        <th className="sticky left-[150px] z-20 bg-slate-50 px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0] min-w-[250px]">Perkara</th>
                                        <th className="px-5 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest bg-emerald-50 border-r border-emerald-100 min-w-[100px]">Sasaran</th>
                                        <th className="px-5 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest bg-emerald-600 text-white min-w-[120px]">Pencapaian</th>
                                        {MONTHS.map(m => (
                                            <th key={m} className={`px-4 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 min-w-[80px]`}>
                                                {m}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={MONTHS.length + 4} className="py-24 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Menjana Data Dinamik...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : aggregatedRows.map((row, idx) => {
                                        const isNewCategory = idx === 0 || aggregatedRows[idx - 1].category !== row.category;
                                        const percent = typeof row.sasaran === 'number' && row.sasaran > 0 ? Math.round((row.total / row.sasaran) * 100) : null;
                                        const isRatio = row.source === 'calc' && row.config?.type === 'ratio';

                                        return (
                                            <tr key={idx} className="hover:bg-slate-50 group transition-colors">
                                                <td className={`sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-6 py-4 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0] font-black text-[10px] text-slate-400 uppercase ${!isNewCategory ? 'opacity-0' : ''}`}>
                                                    {row.category}
                                                </td>
                                                <td className="sticky left-[150px] z-10 bg-white group-hover:bg-slate-50 px-6 py-4 border-r border-slate-200 shadow-[1px_0_0_0_#e2e8f0]">
                                                    <div className="text-sm font-bold text-slate-700 leading-tight">
                                                        {row.perkara}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-center bg-slate-50 group-hover:bg-white font-black text-slate-500 text-xs border-r border-slate-100">
                                                    {row.sasaran}
                                                </td>
                                                <td className="px-5 py-4 text-xl font-black text-emerald-600 text-center bg-emerald-50/30 group-hover:bg-emerald-50 transition-all border-r border-emerald-100">
                                                    <div className="flex flex-col items-center">
                                                        {row.total.toLocaleString()}{isRatio ? '%' : ''}
                                                        {percent !== null && !isRatio && (
                                                            <div className="mt-1 flex items-center gap-1">
                                                                <div className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-emerald-500" style={{ width: `${Math.min(percent, 100)}%` }}></div>
                                                                </div>
                                                                <span className="text-[10px] text-slate-400 font-bold">{percent}%</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                {row.months.map((val, i) => (
                                                    <td key={i} className={`px-4 py-4 text-center font-bold text-xs border-r border-slate-100 transition-all ${val > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                                                        {val === 0 ? '-' : val.toLocaleString()}{isRatio ? '%' : ''}
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                ::-webkit-scrollbar {
                  width: 8px;
                  height: 8px;
                }
                ::-webkit-scrollbar-track {
                  background: #f1f5f9;
                  border-radius: 10px;
                }
                ::-webkit-scrollbar-thumb {
                  background: #cbd5e1;
                  border-radius: 10px;
                }
                ::-webkit-scrollbar-thumb:hover {
                  background: #94a3b8;
                }
            `}</style>
        </ProtectedRoute>
    );
}
