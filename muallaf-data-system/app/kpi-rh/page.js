'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { Plus, Search, Filter, Activity, FileText, ArrowUp, ArrowDown, ArrowUpDown, Trash2, Loader2, RefreshCw, Download, Save, LayoutGrid, Check, X, Copy, ChevronDown } from 'lucide-react';
import Select from 'react-select';

// Configuration for each Tab
const TABS = [
    { id: 'kpi_utama', label: 'KPI Utama' },
    { id: 'pasukan_rh', label: 'Pasukan RH' },
    { id: 'rh_aktif', label: 'RH Aktif' },
    { id: 'ikram', label: 'IKRAM' },
    { id: 'peserta_latihan', label: 'Peserta Latihan' }
];

// Column Definitions for each Category
const COLUMNS_MAP = {
    'kpi_utama': [
        { id: 'jenis', label: 'Jenis', type: 'select-jenis-rh', width: 'min-w-[150px]' },
        { id: 'kpi', label: 'KPI', type: 'text', width: 'min-w-[200px]' },
        { id: 'definisi', label: 'Definisi KPI', type: 'textarea', width: 'min-w-[400px]' },
        { id: 'sasaran', label: 'Sasaran 2026', type: 'number', width: 'min-w-[120px]' },
        { id: 'pencapaian', label: 'Pencapaian 2026', type: 'number', width: 'min-w-[120px]' }
    ],
    'pasukan_rh': [
        { id: 'kawasan', label: 'Kawasan', type: 'select', width: 'min-w-[150px]' },
        { id: 'ajk_ketua', label: 'Struktur: Ketua', type: 'checkbox', width: 'min-w-[120px]' },
        { id: 'ajk_su', label: 'Struktur: SU', type: 'checkbox', width: 'min-w-[120px]' },
        { id: 'ajk_bendahari', label: 'Struktur: Bendahari', type: 'checkbox', width: 'min-w-[120px]' },
        { id: 'ajk_lain', label: 'Struktur: AJK Lain', type: 'checkbox', width: 'min-w-[120px]' },
        { id: 'prog_outreach', label: 'Prog: Outreach', type: 'number', width: 'min-w-[120px]' },
        { id: 'prog_mualaf', label: 'Prog: Mualaf', type: 'number', width: 'min-w-[120px]' },
        { id: 'prog_kebersamaan', label: 'Prog: Kebersamaan', type: 'number', width: 'min-w-[120px]' },
        { id: 'skor', label: 'Skor (%)', type: 'text', width: 'min-w-[100px]' },
        { id: 'status_aktif', label: 'Status Aktif', type: 'checkbox', width: 'min-w-[120px]' }
    ],
    'rh_aktif': [
        { id: 'no_ahli', label: 'No. Ahli / S-ID', type: 'sukarelawan-search', width: 'min-w-[200px]' },
        { id: 'nama', label: 'Nama', type: 'text', width: 'min-w-[200px]' },
        { id: 'no_tel', label: 'No. Telefon', type: 'text', width: 'min-w-[120px]' },
        { id: 'kawasan', label: 'Kawasan', type: 'select', width: 'min-w-[150px]' },
        { id: 'jawatan', label: 'Jawatan', type: 'text', width: 'min-w-[150px]' },
        { id: 'bil_outreach', label: 'Bil Prog Outreach', type: 'number', width: 'min-w-[120px]' },
        { id: 'bil_hcf_lain', label: 'Bil Prog HCF Lain', type: 'number', width: 'min-w-[120px]' },
        { id: 'mualaf', label: 'Mualaf', type: 'checkbox', width: 'min-w-[100px]' },
        { id: 'status_rh_aktif', label: 'RH Aktif', type: 'checkbox', width: 'min-w-[100px]' },
        { id: 'status_duat_aktif', label: 'Duat Aktif', type: 'checkbox', width: 'min-w-[100px]' },
        { id: 'status_duat_kualiti', label: 'Duat Kualiti', type: 'checkbox', width: 'min-w-[120px]' },
        { id: 'catatan_1', label: 'Catatan 1', type: 'text', width: 'min-w-[200px]' },
        { id: 'catatan_2', label: 'Catatan 2', type: 'text', width: 'min-w-[200px]' }
    ],
    'ikram': [
        { id: 'kawasan_ikram', label: 'Kawasan IKRAM', type: 'select', width: 'min-w-[150px]' },
        { id: 'kriteria_jkd', label: 'Kriteria JKD', type: 'checkbox', width: 'min-w-[120px]' },
        { id: 'kriteria_program', label: 'Program', type: 'checkbox', width: 'min-w-[120px]' },
        { id: 'kriteria_dana_staf', label: 'Dana (Taja Staf)', type: 'checkbox', width: 'min-w-[120px]' },
        { id: 'kriteria_dana_tahunan', label: 'Dana (Tahunan/Bulanan)', type: 'checkbox', width: 'min-w-[120px]' },
        { id: 'kriteria_fasiliti', label: 'Fasiliti Tanpa Sewa', type: 'checkbox', width: 'min-w-[120px]' },
        { id: 'skor', label: 'Skor (%)', type: 'text', width: 'min-w-[100px]' }
    ],
    'peserta_latihan': [
        { id: 'nama_program', label: 'Nama Program', type: 'text', width: 'min-w-[200px]' },
        { id: 'tarikh', label: 'Tarikh', type: 'date', width: 'min-w-[120px]' },
        { id: 'tempat', label: 'Tempat', type: 'text', width: 'min-w-[200px]' },
        { id: 'kawasan_anjuran', label: 'Kawasan/Cawangan', type: 'select', width: 'min-w-[150px]' },
        { id: 'jenis_program', label: 'Jenis Program', type: 'text', width: 'min-w-[150px]' },
        { id: 'kategori_utama', label: 'Kategori Utama', type: 'text', width: 'min-w-[150px]' },
        { id: 'kategori_sub', label: 'Kategori Sub', type: 'text', width: 'min-w-[150px]' },
        { id: 'anjuran', label: 'Anjuran', type: 'text', width: 'min-w-[150px]' },
        { id: 'nama_peserta', label: 'Nama Peserta', type: 'text', width: 'min-w-[200px]' },
        { id: 'no_ic', label: 'No IC', type: 'text', width: 'min-w-[150px]' },
        { id: 'no_tel', label: 'No Tel', type: 'text', width: 'min-w-[120px]' },
        { id: 'catatan', label: 'Catatan', type: 'text', width: 'min-w-[200px]' }
    ]
};

const FilterInput = ({ value, onChange, options, placeholder, listId }) => (
    <div className="relative mt-1">
        <input
            type="text"
            list={listId}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="block w-full bg-white text-[10px] border border-gray-300 rounded shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-0.5 px-1 pr-4 font-medium"
            placeholder={placeholder || "Cari..."}
        />
        <datalist id={listId}>
            {options && options.map((opt, idx) => (
                <option key={`${opt.value}-${idx}`} value={opt.label} />
            ))}
        </datalist>
        <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown className="h-2.5 w-2.5 text-gray-400" />
        </div>
    </div>
);

export default function RakanHidayahKPIPage() {
    const { role } = useAuth();
    const [activeTab, setActiveTab] = useState(TABS[0].id);
    const [kpiData, setKpiData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const years = [2024, 2025, 2026, 2027];

    const [selectedState, setSelectedState] = useState('');
    const [states, setStates] = useState([]);
    const [availableYears, setAvailableYears] = useState([]);
    const [availableStates, setAvailableStates] = useState([]);

    const [columnFilters, setColumnFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [displayLimit, setDisplayLimit] = useState(50);

    // Mualaf lookup data
    const [mualafList, setMualafList] = useState([]);

    // Sukarelawan lookup data
    const [sukarelawanList, setSukarelawanList] = useState([]);

    // Background lookup data
    const [religions, setReligions] = useState([]);
    const [races, setRaces] = useState([]);
    const [isSpreadsheetMode, setIsSpreadsheetMode] = useState(false);
    const [pendingChanges, setPendingChanges] = useState({});
    const [saving, setSaving] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const observerTarget = useRef(null);
    const INCREMENT = 50;

    const currentColumns = COLUMNS_MAP[activeTab];

    const loadData = async () => {
        setLoading(true);
        try {
            // Load states once
            if (states.length === 0) {
                const { data: statesRes } = await supabase.from('states').select('*').order('name');
                if (statesRes) setStates(statesRes);
            }

            // Load Sukarelawan data once
            if (sukarelawanList.length === 0) {
                const { data: volRes } = await supabase.from('workers').select('staff_id, nama').eq('peranan', 'Sukarelawan').order('nama');
                if (volRes) setSukarelawanList(volRes.map(v => ({ noStaf: v.staff_id, nama: v.nama })));
            }

            let query = supabase.from('other_kpis').select('*').eq('category', activeTab);

            if (selectedYear) {
                query = query.eq('year', selectedYear);
            }
            if (selectedState) {
                query = query.eq('state', selectedState);
            }
            query = query.order('createdAt', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;

            // Flatten JSON for easier rendering
            let flattenedData = data.map(item => ({
                id: item.id,
                year: item.year,
                state: item.state,
                createdAt: item.createdAt,
                ...item.data
            }));

            if (activeTab === 'kpi_utama') {
                const allowedJenis = ["DU'AT", "Sukarelawan"];
                flattenedData = flattenedData.filter(item => !item.jenis || allowedJenis.includes(item.jenis));
            }

            setKpiData(flattenedData || []);
        } catch (err) {
            console.error("Error loading KPI data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchAvailableFilters = async () => {
            const { data } = await supabase.from('other_kpis').select('year, state').eq('category', activeTab);
            // Instead of custom fetchAll here, we can just fetch all for count since it's just 2 columns
            // But let's use the helper if possible, or just calculate from kpiData if loadData fetches all.
            // Actually, loadData filters by state/year, so we need a separate global fetch.

            // Re-fetch all filter options for the CURRENT tab
            const { data: allTabRecords } = await supabase.from('other_kpis').select('year, state').eq('category', activeTab);

            if (allTabRecords) {
                const yCounts = {};
                const sCounts = {};
                allTabRecords.forEach(item => {
                    const y = item.year || 0;
                    const s = item.state || 'Semua';
                    if (y) yCounts[y] = (yCounts[y] || 0) + 1;
                    sCounts[s] = (sCounts[s] || 0) + 1;
                });

                const ySorted = Object.entries(yCounts)
                    .map(([year, count]) => ({ value: Number(year), label: `${year} (${count})` }))
                    .sort((a, b) => b.value - a.value);

                const sSorted = Object.entries(sCounts)
                    .map(([state, count]) => ({ value: state, label: `${state} (${count})` }))
                    .sort((a, b) => a.value.localeCompare(b.value));

                setAvailableYears(ySorted);
                setAvailableStates(sSorted);
            }
        };
        fetchAvailableFilters();
        setColumnFilters({});
        setSortConfig({ key: null, direction: 'asc' });
        setPendingChanges({});
        loadData();
    }, [activeTab, selectedYear, selectedState]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setIsSpreadsheetMode(false);
    };

    const executeDelete = async (id) => {
        setDeleteConfirmId(null);
        const { data, error } = await supabase.from('other_kpis').delete().eq('id', id).select();
        if (error) {
            alert('Ralat memadam rekod: ' + error.message);
        } else if (!data || data.length === 0) {
            alert('Ralat: Tiada kebenaran untuk memadam rekod ini (RLS policy block) atau rekod gagal dijumpai.');
        } else {
            setKpiData(prev => prev.filter(p => p.id !== id));
        }
    };

    const handleAddRow = async () => {
        setLoading(true);
        try {
            const newRecord = {
                category: activeTab,
                year: selectedYear || new Date().getFullYear(),
                state: selectedState || 'Semua', // Provide a default if possible
                data: {}
            };
            const { data, error } = await supabase.from('other_kpis').insert([newRecord]).select();
            if (error) throw error;

            if (data && data.length > 0) {
                const inserted = data[0];
                setKpiData(prev => [{
                    id: inserted.id,
                    year: inserted.year,
                    state: inserted.state,
                    createdAt: inserted.createdAt,
                    ...inserted.data
                }, ...prev]);
                setIsSpreadsheetMode(true); // Automatically enter edit mode
            }
        } catch (error) {
            alert('Ralat menambah rekod: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDuplicateRow = async (row) => {
        setLoading(true);
        try {
            const baseData = { ...row };
            delete baseData.id;
            delete baseData.year;
            delete baseData.state;
            delete baseData.createdAt;

            // Optional: For 'peserta_latihan', clear out the participant specific info so it's ready for a new person
            if (activeTab === 'peserta_latihan') {
                baseData.nama_peserta = '';
                baseData.no_ic = '';
                baseData.no_tel = '';
            }

            const newRecord = {
                category: activeTab,
                year: row.year || selectedYear || new Date().getFullYear(),
                state: row.state || selectedState || 'Semua',
                data: baseData
            };

            const { data, error } = await supabase.from('other_kpis').insert([newRecord]).select();
            if (error) throw error;

            if (data && data.length > 0) {
                const inserted = data[0];
                setKpiData(prev => [{
                    id: inserted.id,
                    year: inserted.year,
                    state: inserted.state,
                    createdAt: inserted.createdAt,
                    ...inserted.data
                }, ...prev]);
                setIsSpreadsheetMode(true); // Automatically enter edit mode

                // If we are already in edit mode, initialize the pending changes for this new row
                // so the user sees the cleared fields immediately (since they might have had unsaved state)
                if (isSpreadsheetMode) {
                    setPendingChanges(prevChanges => ({
                        ...prevChanges,
                        [inserted.id]: { ...baseData }
                    }));
                }
            }
        } catch (error) {
            alert('Ralat menyalin rekod: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const getUniqueValues = (field) => {
        const filteredByOthers = kpiData.filter(prog => {
            return Object.entries(columnFilters).every(([key, value]) => {
                if (key === field || !value) return true;
                const cleanValue = value.replace(/\s\(\d+\)$/, '');
                if (cleanValue === '(Kosong)') return !prog[key] || prog[key] === '';
                const progVal = typeof prog[key] === 'boolean' ? (prog[key] ? 'Ya' : 'Tidak') : prog[key];
                return progVal?.toString().toLowerCase().includes(cleanValue.toLowerCase());
            });
        });

        const counts = {};
        let blankCount = 0;

        filteredByOthers.forEach(prog => {
            let val = prog[field];
            if (typeof val === 'boolean') val = val ? 'Ya' : 'Tidak';

            if (val === undefined || val === null || val === '') {
                blankCount++;
            } else {
                counts[val] = (counts[val] || 0) + 1;
            }
        });

        const results = Object.entries(counts).map(([value, count]) => ({
            value,
            label: `${value} (${count})`
        })).sort((a, b) => a.value.toString().localeCompare(b.value.toString()));

        if (blankCount > 0) {
            results.unshift({ value: '(Kosong)', label: `(Kosong) (${blankCount})` });
        }

        return results;
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

    const handleCellChange = (recordId, field, value) => {
        setPendingChanges(prev => ({
            ...prev,
            [recordId]: {
                ...(prev[recordId] || {}),
                [field]: value
            }
        }));
    };

    const saveAllChanges = async () => {
        const ids = Object.keys(pendingChanges);
        if (ids.length === 0) return;

        if (activeTab === 'kpi_utama') {
            for (const id of ids) {
                const originalRow = kpiData.find(item => item.id === id);
                const isJenisEdited = pendingChanges[id]?.jenis !== undefined;
                const currentJenis = isJenisEdited ? pendingChanges[id].jenis : originalRow?.jenis;

                if (!currentJenis) {
                    alert("Sila pilih Jenis (DU'AT / Sukarelawan) untuk semua rekod yang disunting sebelum menyimpan.");
                    return;
                }
            }
        }

        setSaving(true);
        try {
            const updatePromises = ids.map(id => {
                const changes = { ...pendingChanges[id] };

                // Separate 'year' and 'state' from JSONB data
                const yearUpdate = changes.year;
                const stateUpdate = changes.state;
                delete changes.year;
                delete changes.state;

                // We need to fetch the existing JSONB data to merge, or we can just send the keys that changed.
                // Supabase doesn't support easy partial JSONB deep updates via standard update if we don't fetch first.
                // Alternatively, we can find the complete original row from `kpiData`.

                const originalRow = kpiData.find(item => item.id === id);
                if (!originalRow) return Promise.resolve({ error: { message: "Row not found locally" } });

                // Reconstruct data object
                const originalData = { ...originalRow };
                delete originalData.id;
                delete originalData.year;
                delete originalData.state;
                delete originalData.createdAt;

                const newDataObject = { ...originalData, ...changes };

                const updatePayload = { data: newDataObject, updatedAt: new Date().toISOString() };
                if (yearUpdate !== undefined) updatePayload.year = yearUpdate;
                if (stateUpdate !== undefined) updatePayload.state = stateUpdate;

                return supabase.from('other_kpis').update(updatePayload).eq('id', id);
            });

            const results = await Promise.all(updatePromises);
            const errors = results.filter(r => r.error);

            if (errors.length > 0) {
                console.error("Errors saving some changes:", errors);
                alert(`Ralat semasa menyimpan beberapa rekod.`);
            } else {
                await loadData();
                setPendingChanges({});
                setIsSpreadsheetMode(false);
                alert('Semua perubahan telah berjaya disimpan!');
            }
        } catch (err) {
            console.error("Error saving layout changes", err);
            alert("Ralat sistem semasa menyimpan. Cuba lagi.");
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

    const filteredData = kpiData.filter(prog => {
        return Object.entries(columnFilters).every(([field, value]) => {
            if (!value) return true;
            const cleanValue = value.replace(/\s\(\d+\)$/, '');
            if (cleanValue === '(Kosong)') {
                return prog[field] === undefined || prog[field] === null || prog[field] === '';
            }
            const progVal = typeof prog[field] === 'boolean' ? (prog[field] ? 'Ya' : 'Tidak') : prog[field];
            return progVal?.toString().toLowerCase().includes(cleanValue.toLowerCase());
        });
    }).sort((a, b) => {
        if (!sortConfig.key) return 0;

        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (aVal === undefined || aVal === null) aVal = '';
        if (bVal === undefined || bVal === null) bVal = '';

        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const columnTotals = useMemo(() => {
        const totals = {};
        currentColumns.forEach(col => {
            if (col.type === 'number') {
                totals[col.id] = filteredData.reduce((sum, row) => sum + (Number(row[col.id]) || 0), 0);
            } else if (col.type === 'checkbox') {
                totals[col.id] = filteredData.filter(row => !!row[col.id]).length;
            }
        });
        return totals;
    }, [filteredData, currentColumns]);

    const exportToCSV = () => {
        const csvContent = [
            ['Tahun', 'Negeri', ...currentColumns.map(c => c.label)].join(','),
            ...filteredData.map(prog => [
                `"${(prog.year || '').toString().replace(/"/g, '""')}"`,
                `"${(prog.state || '').toString().replace(/"/g, '""')}"`,
                ...currentColumns.map(c => {
                    let val = prog[c.id];
                    if (c.type === 'checkbox') {
                        val = val ? 'Ya' : 'Tidak';
                    }
                    return `"${(val || '').toString().replace(/"/g, '""')}"`;
                })
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kpi-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const displayedData = filteredData.slice(0, displayLimit);
    const hasMore = displayLimit < filteredData.length;

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

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 pt-16">
                <Navbar />

                <div className="w-full mx-auto px-2 sm:px-4 py-2">
                    <div className="mb-2">
                        <div className="flex justify-between items-center mb-4">
                            <h1 className="text-2xl font-bold text-gray-900">KPI Rakan Hidayah & Latihan Daie</h1>
                        </div>

                        {/* TABS */}
                        <div className="flex overflow-x-auto space-x-2 border-b border-gray-200 mb-4 pb-2">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`px-4 py-2 rounded-t-lg font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-white text-gray-600 hover:bg-emerald-50 border border-transparent'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Filter Section */}
                        <div className="bg-white rounded-xl p-4 mt-3 mb-1 shadow-sm border border-slate-200 flex items-center justify-between">
                            <div className="w-1/4 mr-4">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tahun</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                >
                                    <option value={0}>Semua Tahun</option>
                                    {availableYears.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
                                    {!availableYears.some(y => y.value === selectedYear) && selectedYear !== 0 && (
                                        <option value={selectedYear}>{selectedYear}</option>
                                    )}
                                </select>
                            </div>

                            <div className="w-1/4 mr-4">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Negeri / Kawasan</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium"
                                    value={selectedState}
                                    onChange={(e) => setSelectedState(e.target.value)}
                                >
                                    <option value="">Semua Negeri</option>
                                    {availableStates.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    {!availableStates.some(s => s.value === selectedState) && selectedState !== '' && (
                                        <option value={selectedState}>{selectedState}</option>
                                    )}
                                </select>
                            </div>

                            <div className="flex items-end h-full space-x-2">
                                {(role === 'admin' || role === 'editor') && (
                                    <button
                                        onClick={() => {
                                            if (isSpreadsheetMode) {
                                                setPendingChanges({});
                                            }
                                            setIsSpreadsheetMode(!isSpreadsheetMode);
                                        }}
                                        className={`inline-flex items-center justify-center px-4 py-2 rounded-lg transition-all font-medium text-sm shadow-sm h-10 ${isSpreadsheetMode ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50'}`}
                                    >
                                        <LayoutGrid className="h-4 w-4 mr-2" />
                                        {isSpreadsheetMode ? 'Batal Edit' : 'Edit Data'}
                                    </button>
                                )}
                                <button
                                    onClick={handleAddRow}
                                    className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-medium text-sm shadow-sm h-10"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Tambah Rekod
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mt-3 mb-2">
                            <p className="text-gray-600 text-xs font-semibold">
                                {TABS.find(t => t.id === activeTab)?.label}: Jumlah {filteredData.length} rekod dijumpai
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
                                    onClick={loadData}
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
                                        Anda boleh mengedit data secara terus dalam jadual di bawah.
                                        Klik <span className="font-bold">"Simpan Perubahan"</span> di atas setelah selesai.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {loading && kpiData.length === 0 ? (
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="animate-pulse bg-white h-16 rounded-lg shadow-sm border border-emerald-100"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="border rounded-lg shadow-sm bg-white overflow-auto max-h-[calc(100vh-250px)]">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-emerald-100">
                                        <th className="sticky left-0 top-0 z-40 bg-emerald-200 text-left py-1 px-2 font-semibold text-gray-700 border-b-2 border-emerald-500 shadow-[1px_0_0_0_#10b981] min-w-[60px] align-top">
                                            <div className="mb-1">Tindakan</div>
                                        </th>
                                        <th className="sticky top-0 z-30 bg-emerald-100 text-left py-1 px-2 font-semibold text-gray-700 border-r border-gray-200 border-b-2 border-emerald-500 min-w-[150px] align-top">
                                            <div
                                                className="flex items-center cursor-pointer mb-1 group"
                                                onClick={() => handleSort('year')}
                                            >
                                                <span>Tahun</span>
                                                {sortConfig.key === 'year' ? (
                                                    sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1 text-emerald-600" /> : <ArrowDown className="h-3 w-3 ml-1 text-emerald-600" />
                                                ) : (
                                                    <ArrowUpDown className="h-3 w-3 ml-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                )}
                                            </div>
                                            <FilterInput
                                                value={columnFilters['year']}
                                                onChange={(val) => handleFilterChange('year', val)}
                                                options={getUniqueValues('year')}
                                                listId="list-year"
                                                placeholder="Semua"
                                            />
                                        </th>
                                        <th className="sticky top-0 z-30 bg-emerald-100 text-left py-1 px-2 font-semibold text-gray-700 border-r border-gray-200 border-b-2 border-emerald-500 min-w-[150px] align-top">
                                            <div
                                                className="flex items-center cursor-pointer mb-1 group"
                                                onClick={() => handleSort('state')}
                                            >
                                                <span>Negeri</span>
                                                {sortConfig.key === 'state' ? (
                                                    sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1 text-emerald-600" /> : <ArrowDown className="h-3 w-3 ml-1 text-emerald-600" />
                                                ) : (
                                                    <ArrowUpDown className="h-3 w-3 ml-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                )}
                                            </div>
                                            <FilterInput
                                                value={columnFilters['state']}
                                                onChange={(val) => handleFilterChange('state', val)}
                                                options={getUniqueValues('state')}
                                                listId="list-state"
                                                placeholder="Semua"
                                            />
                                        </th>

                                        {currentColumns.map((col) => (
                                            <th key={col.id} className={`sticky top-0 z-30 text-left py-1 px-2 font-semibold text-gray-700 bg-emerald-100 border-r border-gray-200 border-b-2 border-emerald-500 ${col.width || 'min-w-[120px]'} align-top`}>
                                                <div
                                                    className="flex items-center cursor-pointer mb-1 group"
                                                    onClick={() => handleSort(col.id)}
                                                >
                                                    <div className="flex flex-col">
                                                        <span>{col.label}</span>
                                                        {(col.type === 'number' || col.type === 'checkbox') && (
                                                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-1 w-fit">
                                                                {columnTotals[col.id]?.toLocaleString() || 0}
                                                            </span>
                                                        )}
                                                    </div>
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
                                    {displayedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={currentColumns.length + 2} className="py-12 text-center text-gray-500 text-sm bg-white border-b">
                                                Tiada rekod dijumpai.
                                            </td>
                                        </tr>
                                    ) : displayedData.map((row) => (
                                        <tr key={row.id} className="border-b border-gray-200 hover:bg-emerald-50 transition-colors">
                                            <td className="sticky left-0 z-10 bg-emerald-50 py-1 px-2 shadow-[1px_0_0_0_#10b981] min-w-[60px]">
                                                <div className="flex items-center justify-start gap-1">
                                                    {deleteConfirmId === row.id ? (
                                                        <div className="flex flex-col gap-1 items-start">
                                                            <span className="text-[9px] font-bold text-red-600 leading-tight">Padam?</span>
                                                            <div className="flex gap-1">
                                                                <button onClick={() => executeDelete(row.id)} className="bg-red-600 text-white p-1 rounded shadow-sm hover:bg-red-700" title="Ya">
                                                                    <Check className="h-3 w-3" />
                                                                </button>
                                                                <button onClick={() => setDeleteConfirmId(null)} className="bg-slate-200 text-slate-700 p-1 rounded shadow-sm hover:bg-slate-300" title="Batal">
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        (role === 'admin' || role === 'editor') && (
                                                            <>
                                                                <button onClick={() => handleDuplicateRow(row)} className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors" title="Salin (Duplicate) Rekod">
                                                                    <Copy className="h-4 w-4" />
                                                                </button>
                                                                <button onClick={() => setDeleteConfirmId(row.id)} className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors" title="Padam">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        )
                                                    )}
                                                </div>
                                            </td>

                                            {/* TAHUN COLUMN */}
                                            <td className={`py-1 px-2 border-r border-gray-200 ${pendingChanges[row.id]?.['year'] !== undefined ? 'bg-amber-50' : 'bg-white'}`}>
                                                {isSpreadsheetMode ? (
                                                    <div className="relative">
                                                        <select
                                                            value={pendingChanges[row.id]?.['year'] !== undefined ? pendingChanges[row.id].year : (row.year || '')}
                                                            onChange={(e) => handleCellChange(row.id, 'year', Number(e.target.value))}
                                                            className="w-full bg-white border border-slate-200 rounded pl-1 pr-5 py-0.5 text-[10px] appearance-none"
                                                        >
                                                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                                                        </select>
                                                        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                                                    </div>
                                                ) : (
                                                    <span>{row.year}</span>
                                                )}
                                            </td>

                                            {/* NEGERI COLUMN */}
                                            <td className={`py-1 px-2 border-r border-gray-200 ${pendingChanges[row.id]?.['state'] !== undefined ? 'bg-amber-50' : 'bg-white'}`}>
                                                {isSpreadsheetMode ? (
                                                    <div className="relative">
                                                        <select
                                                            value={pendingChanges[row.id]?.['state'] !== undefined ? pendingChanges[row.id].state : (row.state || '')}
                                                            onChange={(e) => handleCellChange(row.id, 'state', e.target.value)}
                                                            className="w-full bg-white border border-slate-200 rounded pl-1 pr-5 py-0.5 text-[10px] appearance-none truncate"
                                                        >
                                                            <option value="">-- Pilih --</option>
                                                            {states.map((s, index) => <option key={s.id || index} value={s.name}>{s.name}</option>)}
                                                        </select>
                                                        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                                                    </div>
                                                ) : (
                                                    <span>{row.state}</span>
                                                )}
                                            </td>

                                            {currentColumns.map((col) => {
                                                const isEdited = pendingChanges[row.id]?.[col.id] !== undefined;
                                                const rawValue = isEdited ? pendingChanges[row.id][col.id] : row[col.id];

                                                if (isSpreadsheetMode) {
                                                    if (col.type === 'checkbox') {
                                                        return (
                                                            <td key={col.id} className={`py-1 px-2 border-r border-gray-200 text-center ${isEdited ? 'bg-amber-50' : 'bg-white'}`}>
                                                                <div className="flex justify-center items-center w-full h-full">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={!!rawValue}
                                                                        onChange={(e) => handleCellChange(row.id, col.id, e.target.checked)}
                                                                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                                                    />
                                                                </div>
                                                            </td>
                                                        );
                                                    }

                                                    if (col.type === 'select' && (col.id === 'kawasan' || col.id === 'kawasan_ikram' || col.id === 'kawasan_anjuran')) {
                                                        const rowStateName = pendingChanges[row.id]?.['state'] !== undefined ? pendingChanges[row.id].state : (row.state || '');
                                                        const stateObj = states.find(s => s.name === rowStateName);
                                                        const dropdownOptions = stateObj?.cawangan || [];
                                                        const datalistId = `list-${col.id}-${rowStateName.replace(/\s+/g, '-')}`;

                                                        return (
                                                            <td key={col.id} className={`py-1 px-2 border-r border-gray-200 ${isEdited ? 'bg-amber-50' : 'bg-white'} align-top`}>
                                                                {isSpreadsheetMode ? (
                                                                    <div className="relative group">
                                                                        <input
                                                                            type="text"
                                                                            list={datalistId}
                                                                            value={rawValue || ''}
                                                                            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                                                                            placeholder="Pilih/Taip..."
                                                                            className="w-full bg-white border border-slate-200 rounded pl-1 pr-5 py-0.5 text-[10px] focus:ring-1 focus:ring-emerald-500 outline-none truncate"
                                                                        />
                                                                        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none group-hover:text-emerald-500 transition-colors" />
                                                                        <datalist id={datalistId}>
                                                                            {dropdownOptions.map(loc => (
                                                                                <option key={loc} value={loc} />
                                                                            ))}
                                                                        </datalist>
                                                                    </div>
                                                                ) : (
                                                                    <div className="truncate max-w-[150px]" title={rawValue}>
                                                                        {rawValue || '-'}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    }

                                                    if (col.type === 'select-agama' || col.type === 'select-bangsa' || col.type === 'select-jenis-rh') {
                                                        let dropdownOptions = [];
                                                        let placeholder = '';

                                                        if (col.type === 'select-agama') {
                                                            dropdownOptions = religions;
                                                            placeholder = 'Pilih Agama';
                                                        } else if (col.type === 'select-bangsa') {
                                                            dropdownOptions = races;
                                                            placeholder = 'Pilih Bangsa';
                                                        } else if (col.type === 'select-jenis-rh') {
                                                            dropdownOptions = ["DU'AT", "Sukarelawan"];
                                                            placeholder = 'Pilih Jenis';
                                                        }

                                                        return (
                                                            <td key={col.id} className={`py-1 px-2 border-r border-gray-200 ${isEdited ? 'bg-amber-50' : 'bg-white'} align-top`}>
                                                                {isSpreadsheetMode ? (
                                                                    <div className="relative">
                                                                        <select
                                                                            value={rawValue || ''}
                                                                            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                                                                            className="w-full bg-white border border-slate-200 rounded pl-1 pr-5 py-0.5 text-[10px] focus:ring-1 focus:ring-emerald-500 outline-none appearance-none truncate"
                                                                        >
                                                                            <option value="">{placeholder}</option>
                                                                            {dropdownOptions.length > 0 ? [...dropdownOptions].sort().map(opt => (
                                                                                <option key={opt} value={opt}>{opt}</option>
                                                                            )) : <option disabled>Tiada Pilihan</option>}
                                                                        </select>
                                                                        <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="truncate max-w-[150px]" title={rawValue}>
                                                                        {rawValue || '-'}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    }

                                                    if (col.type === 'mualaf-search') {
                                                        const mualafOptions = mualafList.map(m => ({
                                                            value: m.noStaf,
                                                            label: `${m.noStaf} - ${m.namaIslam || m.namaAsal}`,
                                                            nama: m.namaIslam || m.namaAsal
                                                        }));

                                                        const selectedOption = mualafOptions.find(opt => opt.value === rawValue) || null;

                                                        return (
                                                            <td key={col.id} className={`py-1 px-2 border-r border-gray-200 ${isEdited ? 'bg-amber-50' : 'bg-white'} align-top`}>
                                                                {isSpreadsheetMode ? (
                                                                    <div className="min-w-[180px]">
                                                                        <Select
                                                                            options={mualafOptions}
                                                                            value={selectedOption}
                                                                            onChange={(selected) => {
                                                                                handleCellChange(row.id, col.id, selected ? selected.value : '');
                                                                                if (selected) {
                                                                                    // Auto-fill nama_mualaf
                                                                                    handleCellChange(row.id, 'nama_mualaf', selected.nama);
                                                                                }
                                                                            }}
                                                                            placeholder="Cari ID / Nama..."
                                                                            isClearable
                                                                            formatOptionLabel={(option, { context }) => (
                                                                                <div className={context === 'menu' ? 'text-[9px]' : 'text-[10px]'}>
                                                                                    {context === 'menu' ? option.label : option.value}
                                                                                </div>
                                                                            )}
                                                                            menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                                                                            menuPosition="fixed"
                                                                            className="text-[10px]"
                                                                            styles={{
                                                                                menuPortal: base => ({ ...base, zIndex: 9999 }),
                                                                                control: (base) => ({
                                                                                    ...base,
                                                                                    minHeight: '26px',
                                                                                    height: '26px',
                                                                                    fontSize: '10px'
                                                                                }),
                                                                                valueContainer: (base) => ({
                                                                                    ...base,
                                                                                    padding: '0 4px',
                                                                                }),
                                                                                input: (base) => ({
                                                                                    ...base,
                                                                                    margin: 0,
                                                                                    padding: 0
                                                                                }),
                                                                                indicatorsContainer: (base) => ({
                                                                                    ...base,
                                                                                    height: '26px'
                                                                                })
                                                                            }}
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div className="truncate max-w-[200px]" title={rawValue}>
                                                                        {rawValue || '-'}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    }

                                                    if (col.type === 'sukarelawan-search') {
                                                        const lookup = sukarelawanList.find(s => s.noStaf?.toString() === rawValue?.toString());
                                                        const notFound = rawValue && !lookup;

                                                        return (
                                                            <td key={col.id} className={`py-1 px-2 border-r border-gray-200 ${isEdited ? 'bg-amber-50' : 'bg-white'} ${notFound ? 'bg-red-50' : ''} align-top`}>
                                                                {isSpreadsheetMode ? (
                                                                    <div className="relative group">
                                                                        <input
                                                                            type="text"
                                                                            list="sukarelawan-datalist"
                                                                            value={rawValue || ''}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value;
                                                                                handleCellChange(row.id, col.id, val);
                                                                                const found = sukarelawanList.find(s => s.noStaf?.toString() === val);
                                                                                if (found) {
                                                                                    handleCellChange(row.id, 'nama', found.nama);
                                                                                }
                                                                            }}
                                                                            className={`w-full bg-white border rounded px-1 py-0.5 text-[10px] focus:ring-1 focus:ring-emerald-500 outline-none transition-colors ${notFound ? 'border-red-500 text-red-600 font-bold bg-red-50' : 'border-gray-200'}`}
                                                                            placeholder="No. Ahli..."
                                                                        />
                                                                        {notFound && (
                                                                            <div className="absolute hidden group-hover:block z-50 bg-red-600 text-white text-[9px] p-1 rounded -top-8 left-0 whitespace-nowrap shadow-lg">
                                                                                ID tidak dijumpai dalam pangkalan data pekerja
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className={`truncate max-w-[200px] ${notFound ? 'text-red-600 font-bold' : ''}`} title={rawValue}>
                                                                        {rawValue || '-'}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    }

                                                    if (col.type === 'number') {
                                                        return (
                                                            <td key={col.id} className={`py-1 px-2 border-r border-gray-200 ${isEdited ? 'bg-amber-50' : 'bg-white'}`}>
                                                                <input
                                                                    type="number"
                                                                    value={rawValue === null || rawValue === undefined ? '' : rawValue}
                                                                    onChange={(e) => handleCellChange(row.id, col.id, parseFloat(e.target.value) || 0)}
                                                                    className="w-full bg-white border border-slate-200 rounded px-1 py-0.5 text-[10px] text-center"
                                                                />
                                                            </td>
                                                        );
                                                    }
                                                    if (col.type === 'date') {
                                                        return (
                                                            <td key={col.id} className={`py-1 px-2 border-r border-gray-200 ${isEdited ? 'bg-amber-50' : 'bg-white'}`}>
                                                                <input
                                                                    type="date"
                                                                    value={rawValue || ''}
                                                                    onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                                                                    className="w-full bg-white border border-slate-200 rounded px-1 py-0.5 text-[10px]"
                                                                />
                                                            </td>
                                                        );
                                                    }

                                                    if (col.id === 'nama_mualaf') {
                                                        return (
                                                            <td key={col.id} className={`py-1 px-2 border-r border-gray-200 ${isEdited ? 'bg-amber-50' : 'bg-slate-50'}`}>
                                                                <input
                                                                    type="text"
                                                                    value={rawValue || ''}
                                                                    readOnly
                                                                    className="w-full bg-slate-100 border border-slate-200 rounded px-1 py-0.5 text-[10px] text-slate-500 cursor-not-allowed"
                                                                    title="Diisi secara automatik"
                                                                />
                                                            </td>
                                                        );
                                                    }

                                                    if (col.id === 'nama' && activeTab === 'rh_aktif') {
                                                        const noAhliVal = isEdited ? (pendingChanges[row.id]?.no_ahli ?? row.no_ahli) : row.no_ahli;
                                                        const workerLookup = sukarelawanList.find(s => s.noStaf?.toString() === noAhliVal?.toString());
                                                        const mismatch = workerLookup && workerLookup.nama !== rawValue;

                                                        return (
                                                            <td key={col.id} className={`py-1 px-2 border-r border-gray-200 ${isEdited ? 'bg-amber-50' : 'bg-white'} ${mismatch ? 'bg-red-50' : ''} align-top`}>
                                                                {isSpreadsheetMode ? (
                                                                    <div className="flex items-center gap-1 group relative">
                                                                        <input
                                                                            type="text"
                                                                            value={rawValue || ''}
                                                                            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                                                                            className={`w-full bg-white border rounded px-1 py-0.5 text-[10px] focus:ring-1 focus:ring-emerald-500 outline-none transition-colors ${mismatch ? 'border-red-500 text-red-600 font-bold bg-red-50' : 'border-gray-200'}`}
                                                                        />
                                                                        {mismatch && (
                                                                            <>
                                                                                <button
                                                                                    onClick={() => handleCellChange(row.id, 'nama', workerLookup.nama)}
                                                                                    className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 shadow-sm transition-colors"
                                                                                    title={`Pilih Nama dari Lookup: ${workerLookup.nama}`}
                                                                                >
                                                                                    <RefreshCw className="h-3.5 w-3.5" />
                                                                                </button>
                                                                                <div className="absolute hidden group-hover:block z-50 bg-red-600 text-white text-[9px] p-1.5 rounded -top-10 right-0 whitespace-nowrap shadow-xl">
                                                                                    Nama tidak sepadan dengan rekod pekerja. <br />
                                                                                    Dijumpai: <b>{workerLookup.nama}</b>
                                                                                </div>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className={`truncate max-w-[200px] ${mismatch ? 'text-red-600 font-bold' : ''}`} title={rawValue}>
                                                                        {rawValue || '-'}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    }

                                                    if (col.type === 'textarea') {
                                                        return (
                                                            <td key={col.id} className={`py-1 px-2 border-r border-gray-200 ${isEdited ? 'bg-amber-50' : 'bg-white'}`}>
                                                                <textarea
                                                                    value={rawValue || ''}
                                                                    onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                                                                    className="w-full bg-white border border-slate-200 rounded px-1 py-0.5 text-[10px] min-h-[60px]"
                                                                />
                                                            </td>
                                                        );
                                                    }

                                                    // Default text
                                                    return (
                                                        <td key={col.id} className={`py-1 px-2 border-r border-gray-200 ${isEdited ? 'bg-amber-50' : 'bg-white'}`}>
                                                            <input
                                                                type="text"
                                                                value={rawValue || ''}
                                                                onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                                                                className="w-full bg-white border border-slate-200 rounded px-1 py-0.5 text-[10px]"
                                                            />
                                                        </td>
                                                    );
                                                }

                                                // Display Mode
                                                if (col.type === 'checkbox') {
                                                    return (
                                                        <td key={col.id} className="py-1 px-2 border-r border-gray-200 text-center">
                                                            {rawValue ? <Check className="h-4 w-4 text-emerald-600 mx-auto" /> : '-'}
                                                        </td>
                                                    )
                                                }
                                                if (col.type === 'textarea') {
                                                    return (
                                                        <td key={col.id} className="py-1 px-2 border-r border-gray-200 whitespace-pre-wrap">
                                                            {rawValue}
                                                        </td>
                                                    );
                                                }
                                                if (col.type === 'sukarelawan-search') {
                                                    const lookup = sukarelawanList.find(s => s.noStaf?.toString() === rawValue?.toString());
                                                    const notFound = rawValue && !lookup;
                                                    return (
                                                        <td key={col.id} className={`py-1 px-2 border-r border-gray-200 ${notFound ? 'bg-red-50 text-red-600 font-bold' : ''}`}>
                                                            {rawValue || '-'}
                                                        </td>
                                                    );
                                                }

                                                if (col.id === 'nama' && activeTab === 'rh_aktif') {
                                                    const noAhliVal = pendingChanges[row.id]?.no_ahli !== undefined ? pendingChanges[row.id].no_ahli : row.no_ahli;
                                                    const workerLookup = sukarelawanList.find(s => s.noStaf?.toString() === noAhliVal?.toString());
                                                    const mismatch = workerLookup && workerLookup.nama !== rawValue;
                                                    return (
                                                        <td key={col.id} className={`py-1 px-2 border-r border-gray-200 ${mismatch ? 'bg-red-50 text-red-600 font-bold' : ''}`}>
                                                            {rawValue || '-'}
                                                        </td>
                                                    );
                                                }

                                                return (
                                                    <td key={col.id} className="py-1 px-2 border-r border-gray-200">
                                                        {rawValue}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                    {/* Scroll Observer Target */}
                                    {hasMore && (
                                        <tr ref={observerTarget}>
                                            <td colSpan={currentColumns.length + 2} className="py-4 text-center">
                                                <Loader2 className="h-5 w-5 animate-spin mx-auto text-emerald-500" />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <datalist id="sukarelawan-datalist">
                    {sukarelawanList.map((s, idx) => (
                        <option key={`${s.noStaf}-${idx}`} value={s.noStaf}>{s.nama}</option>
                    ))}
                </datalist>
            </div>
        </ProtectedRoute>
    );
}
