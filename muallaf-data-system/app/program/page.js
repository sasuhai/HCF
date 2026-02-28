'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { useModal } from '@/contexts/ModalContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { Plus, Search, Filter, Activity, FileText, ArrowUp, ArrowDown, ArrowUpDown, Eye, Edit, Trash2, Loader2, RefreshCw, Download, Check, Square, Save, X, LayoutGrid, Calendar, ExternalLink } from 'lucide-react';
import Select from 'react-select';

const FilterInput = ({ value, onChange, options, placeholder, listId }) => (
    <div className="relative">
        <input
            type="text"
            list={listId}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="block w-full bg-white text-[10px] border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-0.5 px-1 mt-1"
            placeholder={placeholder || "Cari..."}
        />
        <datalist id={listId}>
            {options.map(val => (
                <option key={val} value={val} />
            ))}
        </datalist>
    </div>
);

export default function ProgramPage() {
    const { role } = useAuth();
    const { showAlert, showSuccess, showError, showConfirm, showDestructiveConfirm } = useModal();
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedState, setSelectedState] = useState('');
    const [states, setStates] = useState([]);
    const [statusOptions, setStatusOptions] = useState([]);
    const [kategoriOptions, setKategoriOptions] = useState([]);
    const [lookupOptions, setLookupOptions] = useState({
        kawasan: [],
        anjuran: [],
        jenis: [],
        subKategori: []
    });

    const months = [
        { value: 0, label: 'Semua Bulan' },
        { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' },
        { value: 3, label: 'Mac' }, { value: 4, label: 'April' },
        { value: 5, label: 'Mei' }, { value: 6, label: 'Jun' },
        { value: 7, label: 'Julai' }, { value: 8, label: 'Ogos' },
        { value: 9, label: 'September' }, { value: 10, label: 'Oktober' },
        { value: 11, label: 'November' }, { value: 12, label: 'Disember' }
    ];

    const [columnFilters, setColumnFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [displayLimit, setDisplayLimit] = useState(50);
    const [isSpreadsheetMode, setIsSpreadsheetMode] = useState(false);
    const [pendingChanges, setPendingChanges] = useState({});
    const [saving, setSaving] = useState(false);
    const observerTarget = useRef(null);
    const INCREMENT = 50;

    const loadPrograms = async () => {
        setLoading(true);
        try {
            // Fetch lookups
            const [statesRes, statusRes, catRes, orgRes, typesRes, kawasanRes] = await Promise.all([
                supabase.from('states').select('name').order('name'),
                supabase.from('program_status').select('name').order('name'),
                supabase.from('program_categories').select('name').order('name'),
                supabase.from('program_organizers').select('name').order('name'),
                supabase.from('program_types').select('name').order('name'),
                supabase.from('locations').select('name').order('name')
            ]);

            if (statesRes.data) setStates(statesRes.data.map(s => s.name));
            if (statusRes.data) setStatusOptions(statusRes.data.map(s => s.name));
            if (catRes.data) setKategoriOptions(catRes.data.map(c => c.name));

            setLookupOptions({
                anjuran: orgRes.data ? orgRes.data.map(o => ({ value: o.name, label: o.name })) : [],
                jenis: typesRes.data ? typesRes.data.map(t => ({ value: t.name, label: t.name })) : [],
                kawasan: kawasanRes.data ? kawasanRes.data.map(k => ({ value: k.name, label: k.name })) : [],
                subKategori: catRes.data ? catRes.data.map(c => ({ value: c.name, label: c.name })) : []
            });

            let query = supabase.from('programs').select('*');
            if (selectedYear) {
                query = query.eq('tahun', selectedYear);
            }
            if (selectedMonth) {
                query = query.eq('bulan', selectedMonth);
            }
            if (selectedState) {
                query = query.eq('negeri', selectedState);
            }
            query = query.order('tarikh_mula', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;
            setPrograms(data || []);
        } catch (err) {
            console.error("Error loading programs", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPrograms();
    }, [selectedYear, selectedMonth, selectedState]);

    const handleDelete = async (id) => {
        const prog = programs.find(p => p.id === id);
        if (!prog) return;

        showDestructiveConfirm(
            'Sahkan Padam Program',
            `Adakah anda pasti ingin memadam rekod program berikut?\n\n• Nama: ${prog.nama_program}\n• Tarikh: ${prog.tarikh_mula || '-'}\n• Lokasi: ${prog.tempat || '-'}\n\n\nTindakan ini tidak boleh dikembalikan semula.`,
            async () => {
                const { error } = await supabase.from('programs').delete().eq('id', id);
                if (!error) {
                    setPrograms(prev => prev.filter(p => p.id !== id));
                    showSuccess('Berjaya', 'Rekod program telah dipadam.');
                } else {
                    showError('Ralat Padam', error.message);
                }
            }
        );
    };

    const getUniqueValues = (field) => {
        const relevantPrograms = programs.filter(prog => {
            return Object.entries(columnFilters).every(([key, value]) => {
                if (key === field) return true;
                if (!value) return true;
                if (value === '(Kosong)') {
                    return !prog[key] || prog[key] === '';
                }
                const progVal = Array.isArray(prog[key]) ? prog[key].join(', ') : prog[key];
                return progVal?.toString().toLowerCase().includes(value.toLowerCase());
            });
        });

        const hasBlanks = relevantPrograms.some(prog => !prog[field] || prog[field] === '');
        const values = relevantPrograms
            .map(prog => prog[field])
            .filter(val => val !== '' && val !== null && val !== undefined);

        const processedValues = values.map(v => Array.isArray(v) ? v.join(', ') : v);

        const uniqueValues = [...new Set(processedValues)].sort();
        if (hasBlanks) {
            return ['(Kosong)', ...uniqueValues];
        }
        return uniqueValues;
    };

    const handleFilterChange = (field, value) => {
        setColumnFilters(prev => {
            const newFilters = { ...prev };
            if (value === '') {
                delete newFilters[field];
            } else {
                newFilters[field] = value;
            }
            return newFilters;
        });
        setDisplayLimit(INCREMENT);
    };

    const handleCellChange = (programId, field, value) => {
        setPendingChanges(prev => ({
            ...prev,
            [programId]: {
                ...(prev[programId] || {}),
                [field]: value
            }
        }));
    };

    const saveAllChanges = async () => {
        const ids = Object.keys(pendingChanges);
        if (ids.length === 0) return;

        setSaving(true);
        try {
            const arrayFields = ['kawasan_cawangan', 'jenis_program', 'sub_kategori', 'anjuran'];

            const updatePromises = ids.map(id => {
                const changes = { ...pendingChanges[id] };

                // Convert temporary string back to array if modified
                arrayFields.forEach(field => {
                    if (changes[field] !== undefined && typeof changes[field] === 'string') {
                        changes[field] = changes[field]
                            .split(',')
                            .map(s => s.trim())
                            .filter(s => s !== '');
                    }
                });

                return supabase.from('programs').update(changes).eq('id', id);
            });

            const results = await Promise.all(updatePromises);
            const errors = results.filter(r => r.error);

            if (errors.length > 0) {
                console.error("Errors saving some changes:", errors);
                showError('Ralat Simpan', `Ralat semasa menyimpan beberapa rekod.`);
            } else {
                await loadPrograms();
                setPendingChanges({});
                setIsSpreadsheetMode(false);
                showSuccess('Berjaya', 'Semua perubahan telah berjaya disimpan!');
            }
        } catch (err) {
            console.error("Error saving layout changes", err);
            showError('Ralat Sistem', "Ralat sistem semasa menyimpan. Cuba lagi.");
        } finally {
            setSaving(false);
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const clearAllFilters = () => {
        setColumnFilters({});
        setSortConfig({ key: null, direction: 'asc' });
        setDisplayLimit(INCREMENT);
    };

    const filteredPrograms = programs.filter(prog => {
        return Object.entries(columnFilters).every(([field, value]) => {
            if (!value) return true;
            if (value === '(Kosong)') {
                return !prog[field] || prog[field] === '';
            }
            const progVal = Array.isArray(prog[field]) ? prog[field].join(', ') : prog[field];
            return progVal?.toString().toLowerCase().includes(value.toLowerCase());
        });
    }).sort((a, b) => {
        if (!sortConfig.key) return 0;

        let aVal = a[sortConfig.key] || '';
        let bVal = b[sortConfig.key] || '';
        if (Array.isArray(aVal)) aVal = aVal.join(', ');
        if (Array.isArray(bVal)) bVal = bVal.join(', ');

        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const ALL_COLUMNS = [
        { id: 'negeri', label: 'Negeri', width: 'min-w-[120px]' },
        { id: 'tahun', label: 'Tahun', width: 'min-w-[80px]' },
        { id: 'bulan', label: 'Bulan', width: 'min-w-[80px]' },
        { id: 'tarikh_mula', label: 'Tarikh Mula', width: 'min-w-[120px]' },
        { id: 'tarikh_tamat', label: 'Tarikh Tamat', width: 'min-w-[120px]' },
        { id: 'masa_mula', label: 'Masa Mula', width: 'min-w-[100px]' },
        { id: 'masa_tamat', label: 'Masa Tamat', width: 'min-w-[100px]' },
        { id: 'tempat', label: 'Tempat/Venue', width: 'min-w-[200px]' },
        { id: 'kawasan_cawangan', label: 'Kawasan/Cawangan', width: 'min-w-[200px]' },
        { id: 'jenis_program', label: 'Jenis Program', width: 'min-w-[150px]' },
        { id: 'kategori_utama', label: 'Kategori Utama', width: 'min-w-[150px]' },
        { id: 'sub_kategori', label: 'Sub Kategori', width: 'min-w-[180px]' },
        { id: 'kehadiran_rh', label: 'Hadir RH', width: 'min-w-[100px]' },
        { id: 'kehadiran_daie', label: 'Hadir Daie', width: 'min-w-[100px]' },
        { id: 'kehadiran_non_muslim', label: 'Hadir Non-Muslim', width: 'min-w-[120px]' },
        { id: 'kehadiran_quality', label: 'Quality Engage', width: 'min-w-[120px]' },
        { id: 'kehadiran_madu', label: 'Hadir Madu', width: 'min-w-[100px]' },
        { id: 'kehadiran_syahadah', label: 'Syahadah', width: 'min-w-[100px]' },
        { id: 'kehadiran_muallaf', label: 'Hadir Muallaf', width: 'min-w-[100px]' },
        { id: 'kehadiran_keseluruhan', label: 'Jumlah Hadir', width: 'min-w-[100px]' },
        { id: 'anjuran', label: 'Anjuran', width: 'min-w-[150px]' },
        { id: 'kawasan_ikram', label: 'Kawasan IKRAM', width: 'min-w-[150px]' },
        { id: 'link_facebook', label: 'Pautan FB', width: 'min-w-[150px]' },
        { id: 'catatan_1', label: 'Catatan 1', width: 'min-w-[200px]' },
        { id: 'catatan_2', label: 'Catatan 2', width: 'min-w-[200px]' },
        { id: 'selesai_laporan', label: 'Selesai Laporan', width: 'min-w-[120px]' },
        { id: 'createdAt', label: 'Dicipta Pada', width: 'min-w-[150px]' },
    ];

    const exportToCSV = () => {
        const csvContent = [
            ['Nama Program', 'Status', ...ALL_COLUMNS.map(c => c.label)].join(','),
            ...filteredPrograms.map(prog => [
                `"${(prog.nama_program || '').toString().replace(/"/g, '""')}"`,
                `"${(prog.status_program || '').toString().replace(/"/g, '""')}"`,
                ...ALL_COLUMNS.map(c => {
                    let val = prog[c.id];
                    if (Array.isArray(val)) val = val.join('; ');
                    if (c.id === 'selesai_laporan') {
                        val = prog.selesai_laporan ? 'Telah Selesai' : 'Belum Selesai';
                    }
                    if (c.id === 'createdAt') {
                        val = formatDate(prog.createdAt);
                    }
                    return `"${(val || '').toString().replace(/"/g, '""')}"`;
                })
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `senarai-program-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const displayedPrograms = filteredPrograms.slice(0, displayLimit);
    const hasMore = displayLimit < filteredPrograms.length;

    const loadMore = useCallback(() => {
        if (hasMore) {
            setDisplayLimit(prev => prev + INCREMENT);
        }
    }, [hasMore]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [loadMore, hasMore]);


    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            return date.toLocaleString('ms-MY', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 pt-16">
                <Navbar />

                <div className="w-full mx-auto px-2 sm:px-4 py-2">
                    <div className="mb-2">
                        <div className="flex justify-between items-center mb-1">
                            <h1 className="text-xl font-bold text-gray-900">Senarai Program & Aktiviti</h1>
                            <Link
                                href="/program/tambah"
                                className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-medium text-sm shadow-sm"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Tambah Program Baru
                            </Link>
                        </div>

                        {/* Filter Section */}
                        <div className="bg-white rounded-xl p-4 mt-3 mb-1 shadow-sm border border-slate-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tahun</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium"
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    >
                                        <option value={0}>Semua Tahun</option>
                                        {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bulan</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium"
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                    >
                                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Negeri / Kawasan</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium"
                                        value={selectedState}
                                        onChange={(e) => setSelectedState(e.target.value)}
                                    >
                                        <option value="">Semua Negeri</option>
                                        {states.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-3">
                            <p className="text-gray-600 text-xs">
                                Jumlah {filteredPrograms.length} program dijumpai
                            </p>
                            <div className="flex items-center space-x-2">
                                {Object.keys(columnFilters).length > 0 && (
                                    <button
                                        onClick={clearAllFilters}
                                        className="px-3 py-1 bg-red-50 text-red-600 rounded text-xs font-medium hover:bg-red-100 transition-colors"
                                    >
                                        Padam Semua Filter
                                    </button>
                                )}
                                <button
                                    onClick={loadPrograms}
                                    disabled={loading}
                                    className="flex items-center justify-center space-x-1 whitespace-nowrap bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-3 py-1 rounded text-xs font-medium shadow-sm transition-colors"
                                >
                                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                    <span>Muat Semula</span>
                                </button>
                                <button
                                    onClick={exportToCSV}
                                    className="flex items-center justify-center space-x-1 whitespace-nowrap bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-3 py-1 rounded text-xs font-medium shadow-sm transition-colors"
                                >
                                    <Download className="h-4 w-4" />
                                    <span>Export CSV</span>
                                </button>
                                <Link
                                    href={`/program/kalendar${(selectedYear || selectedMonth) ? `?date=${selectedYear || new Date().getFullYear()}-${String(selectedMonth || 1).padStart(2, '0')}-01` : ''}${selectedState ? ((selectedYear || selectedMonth) ? '&' : '?') + `state=${selectedState}` : ''}`}
                                    className="flex items-center justify-center space-x-1 whitespace-nowrap bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 px-3 py-1 rounded text-xs font-bold shadow-sm transition-colors"
                                >
                                    <Calendar className="h-4 w-4" />
                                    <span>Paparan Kalendar</span>
                                </Link>
                                {(role === 'admin' || role === 'editor') && (
                                    <button
                                        onClick={() => {
                                            if (isSpreadsheetMode) {
                                                setPendingChanges({});
                                            }
                                            setIsSpreadsheetMode(!isSpreadsheetMode);
                                        }}
                                        className={`flex items-center justify-center space-x-1 whitespace-nowrap px-3 py-1 rounded text-xs font-bold shadow-sm transition-all ${isSpreadsheetMode ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50'}`}
                                    >
                                        <LayoutGrid className="h-4 w-4" />
                                        <span>{isSpreadsheetMode ? 'Batal Edit' : 'Mod Spreadsheet'}</span>
                                    </button>
                                )}
                                {Object.keys(pendingChanges).length > 0 && (
                                    <button
                                        onClick={saveAllChanges}
                                        disabled={saving}
                                        className="flex items-center justify-center space-x-1 whitespace-nowrap bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-1 rounded text-xs font-bold shadow-md transition-all animate-pulse"
                                    >
                                        <Save className="h-4 w-4 mr-1" />
                                        <span>Simpan {Object.keys(pendingChanges).length} Perubahan</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {isSpreadsheetMode && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 flex items-start space-x-3 shadow-sm">
                                <Activity className="w-5 h-5 text-amber-600 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-amber-800 uppercase tracking-tight">Mod Spreadsheet Aktif</p>
                                    <p className="text-[9px] text-amber-700">
                                        Anda boleh mengedit data secara terus dalam jadual di bawah. Untuk medan pelbagai pilihan, anda boleh memilih dari senarai yang disediakan.
                                        Klik <span className="font-bold">"Simpan Perubahan"</span> di atas setelah selesai.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="animate-pulse bg-white h-16 rounded-lg shadow-sm border border-emerald-100"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="border rounded-lg shadow-sm bg-white overflow-auto max-h-[calc(100vh-170px)]">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-emerald-100">
                                        {/* Frozen Column 1: Nama Program */}
                                        <th className="sticky left-0 top-0 z-50 bg-emerald-200 text-left py-1 px-2 font-semibold text-gray-700 border-b-2 border-emerald-500 shadow-[1px_0_0_0_#10b981] min-w-[200px] align-top">
                                            <div
                                                className="flex items-center cursor-pointer mb-1 group"
                                                onClick={() => handleSort('nama_program')}
                                            >
                                                <span>Nama Program</span>
                                                {sortConfig.key === 'nama_program' ? (
                                                    sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1 text-emerald-600" /> : <ArrowDown className="h-3 w-3 ml-1 text-emerald-600" />
                                                ) : (
                                                    <ArrowUpDown className="h-3 w-3 ml-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                )}
                                            </div>
                                            <FilterInput
                                                value={columnFilters['nama_program']}
                                                onChange={(val) => handleFilterChange('nama_program', val)}
                                                options={getUniqueValues('nama_program')}
                                                listId="list-namaprogram"
                                                placeholder="Cari program"
                                            />
                                        </th>

                                        {/* Frozen Column 2: Status */}
                                        <th className="sticky left-[200px] top-0 z-40 bg-emerald-200 text-left py-1 px-2 font-semibold text-gray-700 border-b-2 border-emerald-500 shadow-[1px_0_0_0_#10b981] min-w-[110px] align-top">
                                            <div
                                                className="flex items-center cursor-pointer mb-1 group"
                                                onClick={() => handleSort('status_program')}
                                            >
                                                <span>Status</span>
                                                {sortConfig.key === 'status_program' ? (
                                                    sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1 text-emerald-600" /> : <ArrowDown className="h-3 w-3 ml-1 text-emerald-600" />
                                                ) : (
                                                    <ArrowUpDown className="h-3 w-3 ml-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                )}
                                            </div>
                                            <FilterInput
                                                value={columnFilters['status_program']}
                                                onChange={(val) => handleFilterChange('status_program', val)}
                                                options={getUniqueValues('status_program')}
                                                listId="list-status"
                                                placeholder="Semua"
                                            />
                                        </th>

                                        {/* Frozen Column 3: Tindakan */}
                                        <th className="sticky left-[310px] top-0 z-40 bg-emerald-200 text-left py-1 px-2 font-semibold text-gray-700 border-b-2 border-emerald-500 shadow-[1px_0_0_0_#10b981] min-w-[120px] align-top">
                                            <div className="mb-1">Tindakan</div>
                                        </th>

                                        {/* Scrollable Columns */}
                                        {ALL_COLUMNS.map((col) => (
                                            <th key={col.id} className={`sticky top-0 z-30 text-left py-1 px-2 font-semibold text-gray-700 bg-emerald-100 border-r border-gray-200 border-b-2 border-emerald-500 ${col.width} align-top`}>
                                                <div
                                                    className="flex items-center cursor-pointer mb-1 group"
                                                    onClick={() => handleSort(col.id)}
                                                >
                                                    <span>{col.label}</span>
                                                    {sortConfig.key === col.id ? (
                                                        sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1 text-emerald-600" /> : <ArrowDown className="h-3 w-3 ml-1 text-emerald-600" />
                                                    ) : (
                                                        <ArrowUpDown className="h-3 w-3 ml-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    )}
                                                </div>
                                                <FilterInput
                                                    value={columnFilters[col.id]}
                                                    onChange={(val) => handleFilterChange(col.id, val)}
                                                    options={getUniqueValues(col.id)}
                                                    listId={`list-${col.id}`}
                                                    placeholder="Cari..."
                                                />
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedPrograms.length === 0 ? (
                                        <tr>
                                            <td colSpan={ALL_COLUMNS.length + 3} className="py-12 text-center text-gray-500 text-sm bg-white border-b">
                                                Tiada rekod program dijumpai.
                                            </td>
                                        </tr>
                                    ) : displayedPrograms.map((prog) => (
                                        <tr key={prog.id} className="border-b border-gray-200 hover:bg-emerald-50 transition-colors">
                                            {/* Frozen 1: Nama Program */}
                                            <td className={`sticky left-0 z-10 py-1 px-2 shadow-[1px_0_0_0_#10b981] min-w-[200px] ${pendingChanges[prog.id]?.nama_program !== undefined ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                                                {isSpreadsheetMode ? (
                                                    <input
                                                        type="text"
                                                        value={pendingChanges[prog.id]?.nama_program !== undefined ? pendingChanges[prog.id].nama_program : (prog.nama_program || '')}
                                                        onChange={(e) => handleCellChange(prog.id, 'nama_program', e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded px-1 py-0.5 text-[10px] focus:ring-1 focus:ring-emerald-500"
                                                    />
                                                ) : (
                                                    <span className="font-bold text-gray-900 block truncate max-w-[190px]" title={prog.nama_program}>
                                                        {prog.nama_program}
                                                    </span>
                                                )}
                                            </td>
                                            {/* Frozen 2: Status */}
                                            <td className={`sticky left-[200px] z-10 py-1 px-2 shadow-[1px_0_0_0_#10b981] min-w-[110px] ${pendingChanges[prog.id]?.status_program !== undefined ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                                                {isSpreadsheetMode ? (
                                                    <select
                                                        value={pendingChanges[prog.id]?.status_program !== undefined ? pendingChanges[prog.id].status_program : (prog.status_program || '')}
                                                        onChange={(e) => handleCellChange(prog.id, 'status_program', e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded px-1 py-0.5 text-[10px] focus:ring-1 focus:ring-emerald-500"
                                                    >
                                                        <option value="">-- Pilih --</option>
                                                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                ) : (
                                                    <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${prog.status_program === 'Selesai' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                                                        {prog.status_program || 'Akan Datang'}
                                                    </span>
                                                )}
                                            </td>
                                            {/* Frozen 3: Tindakan */}
                                            <td className="sticky left-[310px] z-10 bg-emerald-50 py-1 px-2 shadow-[1px_0_0_0_#10b981] min-w-[120px]">
                                                <div className="flex items-center justify-start gap-1">
                                                    <Link href={`/program_details?id=${prog.id}`}>
                                                        <button className="p-1 text-emerald-600 hover:bg-emerald-100 rounded transition-colors" title="Lihat Laporan">
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                    </Link>
                                                    {(role === 'admin' || role === 'editor') && (
                                                        <Link href={`/program/edit?id=${prog.id}`}>
                                                            <button className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors" title="Kemaskini">
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                        </Link>
                                                    )}
                                                    {(role === 'admin' || role === 'editor') && (
                                                        <button onClick={() => handleDelete(prog.id)} className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors" title="Padam">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Scrollable */}
                                            {ALL_COLUMNS.map((col) => {
                                                const isEdited = pendingChanges[prog.id]?.[col.id] !== undefined;
                                                const rawValue = isEdited ? pendingChanges[prog.id][col.id] : prog[col.id];

                                                if (isSpreadsheetMode) {
                                                    // Render specific inputs based on column type
                                                    if (col.id === 'negeri') {
                                                        return (
                                                            <td key={col.id} className={`py-1 px-2 border-r border-gray-200 ${isEdited ? 'bg-amber-50' : 'bg-white'}`}>
                                                                <select
                                                                    value={rawValue || ''}
                                                                    onChange={(e) => handleCellChange(prog.id, col.id, e.target.value)}
                                                                    className="w-full bg-white border border-slate-200 rounded px-1 py-0.5 text-[10px]"
                                                                >
                                                                    <option value="">-- Pilih --</option>
                                                                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                                                                </select>
                                                            </td>
                                                        );
                                                    }
                                                    if (col.id === 'kategori_utama') {
                                                        return (
                                                            <td key={col.id} className={`py-1 px-2 border-r border-gray-200 ${isEdited ? 'bg-amber-50' : 'bg-white'}`}>
                                                                <select
                                                                    value={rawValue || ''}
                                                                    onChange={(e) => handleCellChange(prog.id, col.id, e.target.value)}
                                                                    className="w-full bg-white border border-slate-200 rounded px-1 py-0.5 text-[10px]"
                                                                >
                                                                    <option value="">-- Pilih --</option>
                                                                    {kategoriOptions.map(k => <option key={k} value={k}>{k}</option>)}
                                                                </select>
                                                            </td>
                                                        );
                                                    }
                                                    if (col.id.includes('tarikh')) {
                                                        return (
                                                            <td key={col.id} className={`py-1 px-2 border-r border-gray-200 ${isEdited ? 'bg-amber-50' : 'bg-white'}`}>
                                                                <input
                                                                    type="date"
                                                                    value={rawValue || ''}
                                                                    onChange={(e) => handleCellChange(prog.id, col.id, e.target.value)}
                                                                    className="w-full bg-white border border-slate-200 rounded px-1 py-0.5 text-[10px]"
                                                                />
                                                            </td>
                                                        );
                                                    }
                                                    if (col.id.includes('masa')) {
                                                        return (
                                                            <td key={col.id} className={`py-1 px-2 border-r border-gray-200 ${isEdited ? 'bg-amber-50' : 'bg-white'}`}>
                                                                <input
                                                                    type="time"
                                                                    value={rawValue || ''}
                                                                    onChange={(e) => handleCellChange(prog.id, col.id, e.target.value)}
                                                                    className="w-full bg-white border border-slate-200 rounded px-1 py-0.5 text-[10px]"
                                                                />
                                                            </td>
                                                        );
                                                    }
                                                    if (col.id.startsWith('kehadiran_')) {
                                                        return (
                                                            <td key={col.id} className={`py-1 px-2 border-r border-gray-200 ${isEdited ? 'bg-amber-50' : 'bg-white'}`}>
                                                                <input
                                                                    type="number"
                                                                    value={rawValue === null || rawValue === undefined ? '' : rawValue}
                                                                    onChange={(e) => handleCellChange(prog.id, col.id, parseInt(e.target.value) || 0)}
                                                                    className="w-full bg-white border border-slate-200 rounded px-1 py-0.5 text-[10px] text-center"
                                                                />
                                                            </td>
                                                        );
                                                    }
                                                    if (col.id === 'selesai_laporan') {
                                                        return (
                                                            <td key={col.id} className={`py-1 px-2 border-r border-gray-200 ${isEdited ? 'bg-amber-50' : 'bg-white'}`}>
                                                                <div className="flex justify-center">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={!!rawValue}
                                                                        onChange={(e) => handleCellChange(prog.id, col.id, e.target.checked)}
                                                                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                                                    />
                                                                </div>
                                                            </td>
                                                        );
                                                    }
                                                    // Multi-select dropdowns
                                                    if (['kawasan_cawangan', 'jenis_program', 'sub_kategori', 'anjuran'].includes(col.id)) {
                                                        const options = col.id === 'kawasan_cawangan' ? lookupOptions.kawasan :
                                                            col.id === 'jenis_program' ? lookupOptions.jenis :
                                                                col.id === 'sub_kategori' ? lookupOptions.subKategori :
                                                                    lookupOptions.anjuran;

                                                        const currentArray = Array.isArray(rawValue) ? rawValue : (rawValue ? (typeof rawValue === 'string' ? rawValue.split(',').map(v => v.trim()).filter(v => v) : []) : []);
                                                        const selectedOptions = currentArray.map(item => ({ value: item, label: item }));

                                                        return (
                                                            <td key={col.id} className={`py-0 px-1 border-r border-gray-200 ${isEdited ? 'bg-amber-50' : 'bg-white'} min-w-[200px]`}>
                                                                <Select
                                                                    isMulti
                                                                    options={options}
                                                                    value={selectedOptions}
                                                                    onChange={(selected) => handleCellChange(prog.id, col.id, selected ? selected.map(s => s.value) : [])}
                                                                    className="text-[10px]"
                                                                    menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                                                                    styles={{
                                                                        control: (base) => ({
                                                                            ...base,
                                                                            minHeight: '22px',
                                                                            fontSize: '9px',
                                                                            border: 'none',
                                                                            boxShadow: 'none',
                                                                            backgroundColor: 'transparent'
                                                                        }),
                                                                        valueContainer: (base) => ({
                                                                            ...base,
                                                                            padding: '0 2px',
                                                                        }),
                                                                        indicatorsContainer: (base) => ({
                                                                            ...base,
                                                                            height: '22px',
                                                                        }),
                                                                        multiValue: (base) => ({
                                                                            ...base,
                                                                            backgroundColor: '#f1f5f9',
                                                                            border: '1px solid #e2e8f0',
                                                                            margin: '1px'
                                                                        }),
                                                                        multiValueLabel: (base) => ({
                                                                            ...base,
                                                                            fontSize: '8px',
                                                                            padding: '0 1px',
                                                                        }),
                                                                        menuPortal: base => ({ ...base, zIndex: 9999 })
                                                                    }}
                                                                />
                                                            </td>
                                                        );
                                                    }
                                                    // Default text input
                                                    return (
                                                        <td key={col.id} className={`py-1 px-2 border-r border-gray-200 ${isEdited ? 'bg-amber-50' : 'bg-white'}`}>
                                                            <input
                                                                type="text"
                                                                value={rawValue || ''}
                                                                onChange={(e) => handleCellChange(prog.id, col.id, e.target.value)}
                                                                className="w-full bg-white border border-slate-200 rounded px-1 py-0.5 text-[10px]"
                                                            />
                                                        </td>
                                                    );
                                                }

                                                // Normal Display Mode
                                                let displayValue = prog[col.id];
                                                if (col.id === 'createdAt') {
                                                    displayValue = formatDate(displayValue);
                                                }
                                                if (col.id === 'selesai_laporan') {
                                                    displayValue = displayValue ? (
                                                        <div className="flex justify-center">
                                                            <div className="bg-emerald-100 p-1 rounded-md border border-emerald-200">
                                                                <Check className="h-4 w-4 text-emerald-600 stroke-[3px]" />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-center">
                                                            <div className="bg-slate-50 p-1 rounded-md border border-slate-200">
                                                                <Square className="h-4 w-4 text-slate-300" />
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                if (['kawasan_cawangan', 'jenis_program', 'sub_kategori', 'anjuran'].includes(col.id)) {
                                                    const items = Array.isArray(prog[col.id]) ? prog[col.id] : (prog[col.id] ? (typeof prog[col.id] === 'string' ? prog[col.id].split(', ') : []) : []);
                                                    displayValue = (
                                                        <div className="flex flex-wrap gap-1">
                                                            {items.length > 0 ? items.map((item, idx) => {
                                                                const colors = {
                                                                    'kawasan_cawangan': 'bg-indigo-50 text-indigo-700 border-indigo-100',
                                                                    'jenis_program': 'bg-emerald-50 text-emerald-700 border-emerald-100',
                                                                    'sub_kategori': 'bg-blue-50 text-blue-700 border-blue-100',
                                                                    'anjuran': 'bg-violet-50 text-violet-700 border-violet-100'
                                                                };
                                                                return (
                                                                    <span key={idx} className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${colors[col.id] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                                                                        {item}
                                                                    </span>
                                                                );
                                                            }) : '-'}
                                                        </div>
                                                    );
                                                } else if (typeof displayValue === 'string' && (displayValue.startsWith('http') || displayValue.startsWith('www.'))) {
                                                    const url = displayValue.startsWith('www.') ? `https://${displayValue}` : displayValue;
                                                    displayValue = (
                                                        <a
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-emerald-600 hover:text-emerald-700 hover:underline flex items-center"
                                                        >
                                                            <ExternalLink className="w-3 h-3 mr-1" />
                                                            <span className="truncate max-w-[150px]">{displayValue}</span>
                                                        </a>
                                                    );
                                                }

                                                return (
                                                    <td key={col.id} className="py-1 px-2 bg-white border-r border-gray-200" title={typeof displayValue === 'string' ? displayValue : ''}>
                                                        {displayValue || '-'}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div ref={observerTarget} className="py-8 flex flex-col items-center justify-center border-t border-gray-100 bg-white">
                                {hasMore ? (
                                    <div className="flex items-center space-x-2 text-emerald-600 font-medium">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>Memuatkan lebih banyak program...</span>
                                    </div>
                                ) : filteredPrograms.length > 0 ? (
                                    <div className="text-gray-400 text-sm italic">
                                        — Akhir senarai ({filteredPrograms.length} program) —
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
