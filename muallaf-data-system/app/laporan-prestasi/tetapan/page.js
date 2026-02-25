'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { supabase } from '@/lib/supabase/client';
import {
    Save,
    Plus,
    Trash2,
    Settings,
    ArrowLeft,
    ChevronRight,
    Search,
    RefreshCcw,
    Database,
    Filter,
    Layout
} from 'lucide-react';
import Link from 'next/link';

const SOURCES = [
    { value: 'programs', label: 'Programs Table' },
    { value: 'mualaf', label: 'Mualaf Table' },
    { value: 'other_kpis', label: 'Other KPIs Table' },
    { value: 'attendance', label: 'Attendance Records' },
    { value: 'calc', label: 'Calculation (Ratio/Percentage)' }
];

const CATEGORIES = ['Outreach', 'Mualaf', 'PDS/Pasukan RH', 'Umum'];

export default function KPISettingsPage() {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('kpi_settings')
            .select('*')
            .order('order_index', { ascending: true });

        if (!error) setSettings(data || []);
        else console.error("Error fetching settings:", error);
        setLoading(false);
    };

    const handleAddRow = () => {
        const newRow = {
            id: 'temp-' + Date.now(),
            category: 'Outreach',
            perkara: 'Perkara Baharu',
            source: 'programs',
            config: {},
            order_index: settings.length > 0 ? Math.max(...settings.map(s => s.order_index)) + 10 : 10,
            isNew: true
        };
        setSettings([...settings, newRow]);
    };

    const handleUpdateRow = (id, field, value) => {
        setSettings(prev => prev.map(row => {
            if (row.id === id) {
                if (field.startsWith('config.')) {
                    const configField = field.split('.')[1];
                    return { ...row, config: { ...row.config, [configField]: value } };
                }
                return { ...row, [field]: value };
            }
            return row;
        }));
    };

    const handleDelete = async (id) => {
        if (!confirm('Adakah anda pasti ingin memadam tetapan ini?')) return;

        if (id.toString().startsWith('temp-')) {
            setSettings(settings.filter(s => s.id !== id));
            return;
        }

        const { error } = await supabase.from('kpi_settings').delete().eq('id', id);
        if (!error) {
            setSettings(settings.filter(s => s.id !== id));
        } else {
            alert('Ralat memadam: ' + error.message);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            for (const row of settings) {
                const payload = {
                    category: row.category,
                    perkara: row.perkara,
                    source: row.source,
                    config: row.config,
                    order_index: row.order_index,
                    updatedAt: new Date().toISOString()
                };

                if (row.isNew) {
                    const { error } = await supabase.from('kpi_settings').insert([payload]);
                    if (insertError) throw insertError;
                } else {
                    const { error } = await supabase.from('kpi_settings').update(payload).eq('id', row.id);
                }
            }
            alert('Semua tetapan telah disimpan!');
            fetchSettings();
        } catch (error) {
            console.error("Error saving settings:", error);
            alert('Ralat menyimpan tetapan: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const filteredSettings = settings.filter(s =>
        s.perkara.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-50 pt-16">
                <Navbar />

                <div className="max-w-7xl mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Link href="/laporan-prestasi" className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-slate-200">
                                <ArrowLeft className="h-6 w-6 text-slate-400" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                                    <Settings className="h-6 w-6 text-emerald-600" />
                                    Tetapan Laporan KPI
                                </h1>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Konfigurasi Formula & Kriteria Agregasi Data</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleAddRow}
                                className="flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-bold text-sm shadow-sm transition-all"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah KPI
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold text-sm shadow-lg shadow-emerald-200 transition-all disabled:opacity-50"
                            >
                                {saving ? <RefreshCcw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                Simpan Semua
                            </button>
                        </div>
                    </div>

                    {/* Search & Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="md:col-span-2 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari perkara atau kategori..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                            />
                        </div>
                        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-3 flex items-center justify-between">
                            <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">Jumlah Konfigurasi</span>
                            <span className="text-2xl font-black text-emerald-800">{settings.length}</span>
                        </div>
                    </div>

                    {/* Settings Table */}
                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b-2 border-slate-100">
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[150px]">Kategori</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[250px]">Perkara</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[180px]">Sumber Data</th>
                                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Kriteria / Filter</th>
                                        <th className="px-4 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest w-[80px]">Order</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest w-[80px]">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="py-24 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Memuatkan Tetapan...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredSettings.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-24 text-center">
                                                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Tiada tetapan dijumpai</p>
                                            </td>
                                        </tr>
                                    ) : filteredSettings.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <select
                                                    value={row.category}
                                                    onChange={(e) => handleUpdateRow(row.id, 'category', e.target.value)}
                                                    className="w-full bg-slate-100 group-hover:bg-white border-transparent focus:border-emerald-500 rounded-lg p-1.5 text-xs font-bold text-slate-700 outline-none transition-all"
                                                >
                                                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    value={row.perkara}
                                                    onChange={(e) => handleUpdateRow(row.id, 'perkara', e.target.value)}
                                                    className="w-full bg-slate-100 group-hover:bg-white border-transparent focus:border-emerald-500 rounded-lg p-1.5 text-xs font-bold text-slate-800 outline-none transition-all"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={row.source}
                                                    onChange={(e) => handleUpdateRow(row.id, 'source', e.target.value)}
                                                    className="w-full bg-emerald-50 border-transparent focus:border-emerald-500 rounded-lg p-1.5 text-xs font-bold text-emerald-700 outline-none transition-all"
                                                >
                                                    {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {row.source === 'programs' && (
                                                        <>
                                                            <ConfigInput label="Field" value={row.config.field} onChange={(v) => handleUpdateRow(row.id, 'config.field', v)} placeholder="kg. kehadiran_muallaf" />
                                                            <ConfigInput label="KPI Name" value={row.config.kpiName} onChange={(v) => handleUpdateRow(row.id, 'config.kpiName', v)} placeholder="e.g. Outreach" />
                                                            <ConfigInput label="Anjuran" value={row.config.anjuran} onChange={(v) => handleUpdateRow(row.id, 'config.anjuran', v)} placeholder="e.g. GDM" />
                                                        </>
                                                    )}
                                                    {(row.source === 'mualaf' || row.source === 'submissions') && (
                                                        <>
                                                            <ConfigToggle label="Pengislaman Saja" value={row.config.isPengislaman} onChange={(v) => handleUpdateRow(row.id, 'config.isPengislaman', v)} />
                                                            <ConfigToggle label="Duat Kualiti" value={row.config.isDuatKualiti} onChange={(v) => handleUpdateRow(row.id, 'config.isDuatKualiti', v)} />
                                                            <ConfigToggle label="Disusuli HCF" value={row.config.isFollowedUp} onChange={(v) => handleUpdateRow(row.id, 'config.isFollowedUp', v)} />
                                                        </>
                                                    )}
                                                    {row.source === 'other_kpis' && (
                                                        <>
                                                            <ConfigInput label="Nama KPI" value={row.config.kpiName} onChange={(v) => handleUpdateRow(row.id, 'config.kpiName', v)} placeholder="e.g. Mad'u 3 Bintang" />
                                                            <ConfigInput label="Tab/Category" value={row.config.tab} onChange={(v) => handleUpdateRow(row.id, 'config.tab', v)} placeholder="e.g. ikram" />
                                                            {row.config.tab === 'pasukan_rh' && (
                                                                <ConfigToggle label="Baru Saja" value={row.config.is_baru} onChange={(v) => handleUpdateRow(row.id, 'config.is_baru', v)} />
                                                            )}
                                                        </>
                                                    )}
                                                    {row.source === 'attendance' && (
                                                        <select
                                                            value={row.config.type || 'class_count'}
                                                            onChange={(e) => handleUpdateRow(row.id, 'config.type', e.target.value)}
                                                            className="text-[10px] font-black bg-slate-100 rounded-md px-2 py-1 outline-none"
                                                        >
                                                            <option value="class_count">Bil. Kelas</option>
                                                            <option value="student_count">Bil. Peserta</option>
                                                        </select>
                                                    )}
                                                    {row.source === 'calc' && (
                                                        <>
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Numerator (Atas)</span>
                                                                <select
                                                                    value={row.config.numerator || ''}
                                                                    onChange={(e) => handleUpdateRow(row.id, 'config.numerator', e.target.value)}
                                                                    className="bg-slate-100 rounded-md px-2 py-1 text-[10px] font-bold text-slate-600 outline-none w-[120px]"
                                                                >
                                                                    <option value="">- Pilih KPI -</option>
                                                                    {settings.map(s => <option key={s.id} value={s.perkara}>{s.perkara}</option>)}
                                                                </select>
                                                            </div>
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Denominator (Bawah)</span>
                                                                <select
                                                                    value={row.config.denominator || ''}
                                                                    onChange={(e) => handleUpdateRow(row.id, 'config.denominator', e.target.value)}
                                                                    className="bg-slate-100 rounded-md px-2 py-1 text-[10px] font-bold text-slate-600 outline-none w-[120px]"
                                                                >
                                                                    <option value="">- Pilih KPI -</option>
                                                                    {settings.map(s => <option key={s.id} value={s.perkara}>{s.perkara}</option>)}
                                                                </select>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <input
                                                    type="number"
                                                    value={row.order_index}
                                                    onChange={(e) => handleUpdateRow(row.id, 'order_index', parseInt(e.target.value))}
                                                    className="w-12 bg-slate-100 group-hover:bg-white border-transparent text-center focus:border-emerald-500 rounded-lg p-1.5 text-xs font-bold text-slate-500 outline-none transition-all"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(row.id)}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}

function ConfigInput({ label, value, onChange, placeholder }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{label}</span>
            <input
                type="text"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="bg-slate-100 rounded-md px-2 py-1 text-[10px] font-bold text-slate-600 outline-none w-[120px] focus:bg-white border border-transparent focus:border-emerald-200"
            />
        </div>
    );
}

function ConfigToggle({ label, value, onChange }) {
    return (
        <button
            onClick={() => onChange(!value)}
            className={`flex flex-col items-start gap-0.5 p-1 rounded-md transition-all ${value ? 'bg-emerald-600/10 border border-emerald-200' : 'bg-slate-100 border border-transparent'}`}
        >
            <span className={`text-[8px] font-black uppercase tracking-tighter ${value ? 'text-emerald-700' : 'text-slate-400'}`}>{label}</span>
            <span className={`text-[10px] font-black ${value ? 'text-emerald-600' : 'text-slate-400'}`}>{value ? 'Ya' : 'Tidak'}</span>
        </button>
    );
}
