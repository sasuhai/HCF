'use client';

import { useState, useEffect, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { supabase } from '@/lib/supabase/client';
import { getSubmissions, getStates, getLocations } from '@/lib/supabase/database';
import { calculateKPI } from '@/lib/utils/kpi';
import {
    Search,
    Filter,
    Download,
    RefreshCcw,
    Save,
    X,
    Grid,
    Table as TableIcon,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ChevronDown,
    Activity,
    CheckCircle,
    XCircle,
    Calendar,
    MapPin,
    AlertCircle
} from 'lucide-react';
import Select from 'react-select';

const KPI_COLUMNS = [
    { id: 'negeriCawangan', label: 'Negeri', width: 'min-w-[120px]', type: 'top-readonly' },
    { id: 'lokasi', label: 'Lokasi', width: 'min-w-[150px]', type: 'top-readonly' },
    { id: 'createdAt', label: 'Daftar SPO', width: 'min-w-[110px]', type: 'date-readonly' },
    { id: 'keyInDelay', label: 'Key-in Delay', width: 'min-w-[100px]', type: 'metric-readonly' },
    { id: 'kawasan', label: 'Kawasan', width: 'min-w-[150px]', type: 'select' },
    { id: 'hubungi48j', label: 'Hubungi 48j', width: 'min-w-[100px]', type: 'checkbox' },
    { id: 'daftar2m', label: 'Daftar 2m', width: 'min-w-[100px]', type: 'checkbox' },
    { id: 'kelas1b', label: 'Atur Kelas 1b', width: 'min-w-[100px]', type: 'checkbox' },
    { id: 'whatsappGroup', label: 'Group WA', width: 'min-w-[100px]', type: 'checkbox' },
    { id: 'ziarah3b', label: 'Ziarah 3b', width: 'min-w-[100px]', type: 'checkbox' },
    { id: 'hubungRH1b', label: 'Hubung RH 1b', width: 'min-w-[100px]', type: 'checkbox' },
    { id: 'usahaDakwah', label: 'Usaha Dakwah oleh Duat', width: 'min-w-[250px]' },
    { id: 'catatanKPI', label: 'Catatan KPI', width: 'min-w-[250px]' },
];

const MONTH_OPTIONS = [
    { value: 0, label: 'Semua Bulan' },
    { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' },
    { value: 3, label: 'Mac' }, { value: 4, label: 'April' },
    { value: 5, label: 'Mei' }, { value: 6, label: 'Jun' },
    { value: 7, label: 'Julai' }, { value: 8, label: 'Ogos' },
    { value: 9, label: 'September' }, { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' }, { value: 12, label: 'Disember' }
];

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

export default function PengislamanKPIPage() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSpreadsheetMode, setIsSpreadsheetMode] = useState(false);
    const [pendingChanges, setPendingChanges] = useState({});
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'tarikhPengislaman', direction: 'desc' });
    const [columnFilters, setColumnFilters] = useState({});

    // Top Filters
    const [selectedYear, setSelectedYear] = useState(0); // Default to Semua
    const [selectedMonth, setSelectedMonth] = useState(0); // Default to Semua
    const [selectedState, setSelectedState] = useState('');
    const [states, setStates] = useState([]);
    const [locations, setLocations] = useState([]);
    const [availableYears, setAvailableYears] = useState([]);
    const [availableMonths, setAvailableMonths] = useState([]);
    const [availableStates, setAvailableStates] = useState([]);

    // Load State from Session
    useEffect(() => {
        const savedState = sessionStorage.getItem('kpi_spreadsheet_state');
        if (savedState) {
            try {
                const { pendingChanges: savedChanges, isSpreadsheetMode: savedMode, selectedYear: savedYear, selectedMonth: savedMonth, selectedState: savedStateVal, searchTerm: savedSearch, sortConfig: savedSort } = JSON.parse(savedState);
                if (savedChanges) setPendingChanges(savedChanges);
                if (savedMode !== undefined) setIsSpreadsheetMode(savedMode);
                if (savedYear) setSelectedYear(savedYear);
                if (savedMonth !== undefined) setSelectedMonth(savedMonth);
                if (savedStateVal !== undefined) setSelectedState(savedStateVal);
                if (savedSearch !== undefined) setSearchTerm(savedSearch);
                if (savedSort) setSortConfig(savedSort);
            } catch (e) {
                console.error("Error restoring session state", e);
            }
        }

        const fetchLookups = async () => {
            const [statesRes, locsRes] = await Promise.all([
                getStates(),
                getLocations()
            ]);
            if (statesRes.data) setStates(statesRes.data);
            if (locsRes.data) setLocations(locsRes.data);
        };
        fetchLookups();
    }, []);

    // Generate available filter options based on all records in this category
    useEffect(() => {
        const yCounts = {};
        const mCounts = {};
        const sCounts = {};
        let blankCount = 0;

        records.forEach(item => {
            const date = item.tarikhPengislaman ? new Date(item.tarikhPengislaman) : null;
            const isInvalid = !date || isNaN(date.getTime());
            const y = isInvalid ? 0 : date.getFullYear();
            const m = isInvalid ? 0 : date.getMonth() + 1;
            const s = item.negeriCawangan || 'Semua';

            // 1. Year counts (affected by State)
            if (!selectedState || s === selectedState) {
                if (y) {
                    yCounts[y] = (yCounts[y] || 0) + 1;
                } else {
                    blankCount++;
                }
            }

            // 2. Month counts (affected by Year and State)
            if ((selectedYear === 0 || y === selectedYear) && (!selectedState || s === selectedState) && m) {
                mCounts[m] = (mCounts[m] || 0) + 1;
            }

            // 3. State counts (affected by Year)
            if (selectedYear === 0 || y === selectedYear || (selectedYear === -1 && y === 0)) {
                sCounts[s] = (sCounts[s] || 0) + 1;
            }
        });

        const ySorted = Object.entries(yCounts)
            .map(([year, count]) => ({ value: Number(year), label: `${year} (${count})` }))
            .sort((a, b) => b.value - a.value);

        const mSorted = Object.entries(mCounts)
            .map(([month, count]) => ({
                value: Number(month),
                label: `${MONTH_OPTIONS.find(mo => mo.value === Number(month))?.label} (${count})`
            }))
            .sort((a, b) => a.value - b.value);

        const sSorted = Object.entries(sCounts)
            .map(([state, count]) => ({ value: state, label: `${state} (${count})` }))
            .sort((a, b) => a.value.localeCompare(b.value));

        if (blankCount > 0) {
            ySorted.push({ value: -1, label: `Tiada Tarikh (${blankCount})` });
        }

        setAvailableYears(ySorted);
        setAvailableMonths(mSorted);
        setAvailableStates(sSorted);
    }, [records, selectedYear, selectedState]);

    // Save State to Session
    useEffect(() => {
        const stateToSave = {
            pendingChanges,
            isSpreadsheetMode,
            selectedYear,
            selectedMonth,
            selectedState,
            searchTerm,
            sortConfig
        };
        sessionStorage.setItem('kpi_spreadsheet_state', JSON.stringify(stateToSave));
    }, [pendingChanges, isSpreadsheetMode, selectedYear, selectedMonth, selectedState, searchTerm, sortConfig]);

    useEffect(() => {
        loadRecords();
    }, []);

    const loadRecords = async () => {
        setLoading(true);
        try {
            const filters = {
                category: 'Pengislaman'
                // We fetch all for this category and filter client-side for top filters
                // to allow complex combinations and 'Tiada Tarikh' accurately.
            };

            const { data, error } = await getSubmissions(filters);
            if (error) throw error;
            setRecords(data || []);
        } catch (err) {
            console.error("Error loading mualaf records:", err);
            alert("Ralat memuatkan data.");
        } finally {
            setLoading(false);
        }
    };

    const handleCellChange = (recordId, field, value) => {
        setPendingChanges(prev => {
            const currentChanges = prev[recordId] || {};

            // If the field is one of the KPI fields (except kawasan, usahaDakwah, catatanKPI), 
            // it's likely nested in the pengislamanKPI object in the database.
            // But for state management simplicity, we'll flat map it and structure it later.

            return {
                ...prev,
                [recordId]: {
                    ...currentChanges,
                    [field]: value
                }
            };
        });
    };

    const saveAllChanges = async () => {
        const ids = Object.keys(pendingChanges);
        if (ids.length === 0) return;

        setSaving(true);
        try {
            const updatePromises = ids.map(async (id) => {
                const changes = pendingChanges[id];
                const original = records.find(r => r.id === id);

                // Construct the updated pengislamanKPI object
                const currentKPI = original.pengislamanKPI || {};
                const updatedKPIBase = {
                    ...currentKPI,
                    ...changes // This might override flat fields like 'kawasan' if they are in changes
                };

                // Move specifically handled fields into updatedKPIBase if they were flat in changes
                const kpiFields = ['kawasan', 'hubungi48j', 'daftar2m', 'kelas1b', 'whatsappGroup', 'ziarah3b', 'hubungRH1b', 'usahaDakwah', 'catatanKPI'];
                kpiFields.forEach(f => {
                    if (changes[f] !== undefined) {
                        updatedKPIBase[f] = changes[f];
                    }
                });

                // Recalculate metrics
                const finalKPIData = calculateKPI(original, updatedKPIBase);

                return supabase.from('mualaf').update({
                    pengislamanKPI: finalKPIData
                }).eq('id', id);
            });

            const results = await Promise.all(updatePromises);
            const errors = results.filter(r => r.error);

            if (errors.length > 0) {
                console.error("Errors saving some changes:", errors.map(e => e.error.message));
                alert(`Ralat semasa menyimpan ${errors.length} rekod. Sila semak konsol untuk maklumat lanjut.`);
            } else {
                await loadRecords();
                setPendingChanges({});
                setIsSpreadsheetMode(false);
                sessionStorage.removeItem('kpi_spreadsheet_state');
                alert('Semua perubahan telah berjaya disimpan!');
            }
        } catch (err) {
            console.error("Error saving KPI changes", err);
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

    const handleFilterChange = (field, value) => {
        setColumnFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const getUniqueValues = (field) => {
        const filteredByOthers = records.filter(record => {
            return Object.entries(columnFilters).every(([key, value]) => {
                if (key === field || !value) return true;
                const cleanValue = value.replace(/\s\(\d+\)$/, '');
                if (cleanValue === '(Kosong)') {
                    if (['noStaf', 'namaIslam', 'noKP', 'negeriCawangan'].includes(key)) return !record[key];
                    return !record.pengislamanKPI?.[key];
                }
                let val = '';
                if (['noStaf', 'namaIslam', 'noKP', 'negeriCawangan'].includes(key)) {
                    val = record[key];
                } else {
                    val = record.pengislamanKPI?.[key];
                }
                if (typeof val === 'boolean') val = val ? 'Ya' : 'Tidak';
                return val?.toString().toLowerCase().includes(cleanValue.toLowerCase());
            });
        });

        const counts = {};
        let blankCount = 0;

        filteredByOthers.forEach(record => {
            let val = '';
            if (['noStaf', 'namaIslam', 'noKP', 'negeriCawangan'].includes(field)) {
                val = record[field];
            } else {
                val = record.pengislamanKPI?.[field];
            }

            if (val === null || val === undefined || val === '') {
                blankCount++;
            } else {
                if (typeof val === 'boolean') val = val ? 'Ya' : 'Tidak';
                counts[val] = (counts[val] || 0) + 1;
            }
        });

        const options = Object.entries(counts).map(([val, count]) => ({
            value: val,
            label: `${val} (${count})`
        })).sort((a, b) => a.value.localeCompare(b.value));

        if (blankCount > 0) {
            options.push({ value: '(Kosong)', label: `(Kosong) (${blankCount})` });
        }

        return options;
    };

    const columnTotals = useMemo(() => {
        const totals = {};
        KPI_COLUMNS.forEach(col => {
            if (col.type === 'checkbox') {
                totals[col.id] = records.filter(r => r.pengislamanKPI?.[col.id]).length;
            }
        });
        return totals;
    }, [records]);

    const filteredRecords = useMemo(() => {
        return records.filter(record => {
            // Top Level Filters (Strictly based on tarikhPengislaman)
            const date = record.tarikhPengislaman ? new Date(record.tarikhPengislaman) : null;
            const isInvalidDate = !date || isNaN(date.getTime());
            const recYear = isInvalidDate ? 0 : date.getFullYear();
            const recMonth = isInvalidDate ? 0 : date.getMonth() + 1;

            if (selectedYear > 0 && recYear !== selectedYear) return false;
            if (selectedYear === -1 && recYear !== 0) return false; // Tiada Tarikh
            if (selectedMonth > 0 && recMonth !== selectedMonth) return false;
            if (selectedState && record.negeriCawangan !== selectedState) return false;

            // Search filter
            const searchStr = `${record.namaIslam} ${record.noKP} ${record.noStaf} ${record.negeriCawangan}`.toLowerCase();
            if (searchTerm && !searchStr.includes(searchTerm.toLowerCase())) return false;

            // Column filters
            for (const [key, value] of Object.entries(columnFilters)) {
                if (!value) continue;
                const cleanValue = value.replace(/\s\(\d+\)$/, '');

                let recordValue = '';
                if (key === 'noStaf' || key === 'namaIslam' || key === 'noKP' || key === 'negeriCawangan') {
                    recordValue = String(record[key] || '');
                } else {
                    recordValue = String(record.pengislamanKPI?.[key] || '');
                }

                if (cleanValue === '(Kosong)') {
                    const isEmpty = !recordValue || recordValue === '' || recordValue === 'undefined' || recordValue === 'null';
                    if (!isEmpty) return false;
                    continue;
                }

                const displayVal = (key === 'noStaf' || key === 'namaIslam' || key === 'noKP' || key === 'negeriCawangan')
                    ? recordValue
                    : (typeof record.pengislamanKPI?.[key] === 'boolean'
                        ? (record.pengislamanKPI[key] ? 'Ya' : 'Tidak')
                        : recordValue);

                if (!displayVal.toLowerCase().includes(cleanValue.toLowerCase())) return false;
            }
            return true;
        }).sort((a, b) => {
            let valA, valB;

            if (['noStaf', 'namaIslam', 'noKP', 'negeriCawangan', 'createdAt', 'tarikhPengislaman'].includes(sortConfig.key)) {
                valA = a[sortConfig.key];
                valB = b[sortConfig.key];
            } else if (sortConfig.key === 'score') {
                valA = a.pengislamanKPI?.metrics?.followUpScore || 0;
                valB = b.pengislamanKPI?.metrics?.followUpScore || 0;
            } else {
                valA = a.pengislamanKPI?.[sortConfig.key];
                valB = b.pengislamanKPI?.[sortConfig.key];
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [records, searchTerm, columnFilters, sortConfig, selectedYear, selectedMonth, selectedState]);

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-50 pt-16">
                <Navbar />

                <div className="max-w-[1600px] mx-auto px-4 py-4">
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-3 gap-2">
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 leading-tight">Pengurusan KPI Pengislaman</h1>
                            <p className="text-slate-500 text-[11px]">Kemaskini status susulan dan pantau prestasi KPI secara pukal.</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={loadRecords}
                                className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
                                title="Refresh data"
                            >
                                <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>

                            <button
                                onClick={() => setIsSpreadsheetMode(!isSpreadsheetMode)}
                                className={`flex items-center px-3 py-1.5 text-sm rounded-lg border transition-all shadow-sm ${isSpreadsheetMode
                                    ? 'bg-amber-50 border-amber-200 text-amber-700 font-medium'
                                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                {isSpreadsheetMode ? <TableIcon className="h-3.5 w-3.5 mr-2" /> : <Grid className="h-3.5 w-3.5 mr-2" />}
                                {isSpreadsheetMode ? 'Lihat Data' : 'Edit Data'}
                            </button>

                            {Object.keys(pendingChanges).length > 0 && (
                                <button
                                    onClick={saveAllChanges}
                                    disabled={saving}
                                    className="flex items-center px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-all disabled:opacity-50"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {saving ? 'Menyimpan...' : `Simpan ${Object.keys(pendingChanges).length}`}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Compact Filters Bar */}
                    <div className="bg-white p-2.5 px-4 rounded-xl border border-slate-200 shadow-sm mb-3">
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                            <div className="flex items-center gap-2">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">Tahun</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500 outline-none w-[100px]"
                                >
                                    <option value={0}>Semua Tahun</option>
                                    {availableYears.map(y => (
                                        <option key={y.value} value={y.value}>{y.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">Bulan</label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                    className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500 outline-none w-[130px]"
                                >
                                    <option value={0}>Semua Bulan</option>
                                    {availableMonths.map(m => (
                                        <option key={m.value} value={m.value}>{m.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="text-[9px] font-bold text-slate-400 uppercase whitespace-nowrap">Negeri / Kawasan</label>
                                <select
                                    value={selectedState}
                                    onChange={(e) => setSelectedState(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500 outline-none min-w-[150px]"
                                >
                                    <option value="">Semua Negeri</option>
                                    {availableStates.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Search */}
                            <div className="relative flex-1 min-w-[200px] max-w-sm">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari Nama, No KP, ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                                />
                            </div>

                            <button
                                onClick={() => {
                                    setSelectedYear(0);
                                    setSelectedMonth(0);
                                    setSelectedState('');
                                    setSearchTerm('');
                                    setPendingChanges({});
                                    sessionStorage.removeItem('kpi_spreadsheet_state');
                                }}
                                className="text-[10px] text-slate-400 hover:text-emerald-600 flex items-center gap-1 transition-colors"
                            >
                                <X className="h-3 w-3" /> Reset
                            </button>

                            <div className="ml-auto flex items-center gap-2 text-[11px] text-slate-500 whitespace-nowrap">
                                <Activity className="h-3.5 w-3.5 text-emerald-500" />
                                <span>Menunjukkan <strong>{filteredRecords.length}</strong> daripada <strong>{records.length}</strong> rekod</span>
                            </div>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
                            <table className="w-full border-collapse text-[11px]">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        {/* Frozen Column 1: Mualaf ID */}
                                        <th className="sticky top-0 left-0 z-40 bg-slate-100 p-1.5 text-left font-semibold text-slate-700 border-r border-slate-200 border-b-2 border-emerald-500 min-w-[70px] align-top">
                                            <div className="flex items-center cursor-pointer group mb-1" onClick={() => handleSort('noStaf')}>
                                                ID {sortConfig.key === 'noStaf' ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />) : <ArrowUpDown className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100" />}
                                            </div>
                                            <FilterInput
                                                value={columnFilters['noStaf']}
                                                onChange={(val) => handleFilterChange('noStaf', val)}
                                                options={getUniqueValues('noStaf')}
                                                listId="list-noStaf"
                                            />
                                        </th>
                                        {/* Frozen Column 2: Nama */}
                                        <th className="sticky top-0 left-[70px] z-40 bg-slate-100 p-1.5 text-left font-semibold text-slate-700 border-r border-slate-200 border-b-2 border-emerald-500 min-w-[160px] align-top">
                                            <div className="flex items-center cursor-pointer group mb-1" onClick={() => handleSort('namaIslam')}>
                                                Nama Islam {sortConfig.key === 'namaIslam' ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />) : <ArrowUpDown className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100" />}
                                            </div>
                                            <FilterInput
                                                value={columnFilters['namaIslam']}
                                                onChange={(val) => handleFilterChange('namaIslam', val)}
                                                options={getUniqueValues('namaIslam')}
                                                listId="list-namaIslam"
                                            />
                                        </th>
                                        {/* Frozen Column 3: Tarikh Pengislaman */}
                                        <th className="sticky top-0 left-[230px] z-40 bg-slate-100 p-1.5 text-left font-semibold text-slate-700 border-r border-slate-200 border-b-2 border-emerald-500 min-w-[90px] align-top">
                                            <div className="flex items-center cursor-pointer group mb-1" onClick={() => handleSort('tarikhPengislaman')}>
                                                Tkh. Islam {sortConfig.key === 'tarikhPengislaman' ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />) : <ArrowUpDown className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100" />}
                                            </div>
                                            <FilterInput
                                                value={columnFilters['tarikhPengislaman']}
                                                onChange={(val) => handleFilterChange('tarikhPengislaman', val)}
                                                options={getUniqueValues('tarikhPengislaman')}
                                                listId="list-tarikhPengislaman"
                                            />
                                        </th>
                                        {/* Frozen Column 4: Score / Status */}
                                        <th className="sticky top-0 left-[320px] z-40 bg-emerald-100 p-1.5 text-left font-semibold text-emerald-800 border-r border-emerald-200 border-b-2 border-emerald-500 min-w-[90px]">
                                            <div className="flex items-center cursor-pointer group" onClick={() => handleSort('score')}>
                                                Skor {sortConfig.key === 'score' ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />) : <ArrowUpDown className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100" />}
                                            </div>
                                        </th>

                                        {/* Frozen Column 5: Tindakan */}
                                        <th className="sticky top-0 left-[410px] z-40 bg-slate-100 p-1.5 text-left font-semibold text-slate-700 border-r border-slate-200 border-b-2 border-emerald-500 min-w-[70px]">
                                            Tindakan
                                        </th>

                                        {/* Scrollable Column Headers */}
                                        {KPI_COLUMNS.map(col => (
                                            <th key={col.id} className={`sticky top-0 z-30 p-1.5 text-left font-semibold text-slate-700 border-r border-slate-200 bg-slate-50 border-b-2 border-emerald-500 ${col.width} align-top`}>
                                                <div className="flex items-center cursor-pointer group mb-1" onClick={() => handleSort(col.id)}>
                                                    <div className="flex flex-col">
                                                        <span>{col.label}</span>
                                                        {col.type === 'checkbox' && (
                                                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-1 w-fit">
                                                                {columnTotals[col.id]?.toLocaleString() || 0}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {sortConfig.key === col.id ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />) : <ArrowUpDown className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100" />}
                                                </div>
                                                <FilterInput
                                                    value={columnFilters[col.id]}
                                                    onChange={(val) => handleFilterChange(col.id, val)}
                                                    options={getUniqueValues(col.id)}
                                                    listId={`list-${col.id}`}
                                                />
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={KPI_COLUMNS.length + 5} className="p-8 text-center bg-white">
                                                <RefreshCcw className="h-6 w-6 animate-spin text-emerald-600 mx-auto mb-2" />
                                                <span className="text-slate-500">Memuatkan rekod...</span>
                                            </td>
                                        </tr>
                                    ) : filteredRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan={KPI_COLUMNS.length + 5} className="p-8 text-center bg-white text-slate-500">
                                                Tiada rekod dijumpai.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRecords.map(record => {
                                            const recordChanges = pendingChanges[record.id];
                                            const isEdited = !!recordChanges;
                                            const kpi = record.pengislamanKPI || {};

                                            // Ensure metrics are always calculated for display (especially key-in delay)
                                            const currentKPIBase = { ...kpi, ...recordChanges };
                                            const calculated = calculateKPI(record, currentKPIBase);

                                            const score = calculated.metrics?.followUpScore || 0;
                                            const overallStatus = calculated.metrics?.overallStatus || 'Belum Disusuli';
                                            const currentMetrics = calculated.metrics || {};

                                            return (
                                                <tr key={record.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${isEdited ? 'bg-amber-50/30' : ''}`}>
                                                    {/* Frozen 1: ID */}
                                                    <td className="sticky left-0 z-10 bg-white p-1.5 border-r border-slate-200 font-mono text-slate-500 group-hover:bg-slate-50 align-top">
                                                        {record.noStaf || 'N/A'}
                                                    </td>
                                                    {/* Frozen 2: Nama */}
                                                    <td className="sticky left-[70px] z-10 bg-white p-1.5 border-r border-slate-200 group-hover:bg-slate-50 align-top">
                                                        <div className="font-bold text-slate-800 uppercase truncate max-w-[150px]" title={record.namaIslam}>
                                                            {record.namaIslam || record.namaAsal}
                                                        </div>
                                                        <div className="text-[9px] text-slate-400">{record.noKP}</div>
                                                    </td>
                                                    {/* Frozen 3: Tarikh Pengislaman */}
                                                    <td className="sticky left-[230px] z-10 bg-white p-1.5 border-r border-slate-200 group-hover:bg-slate-50 text-slate-600 align-top">
                                                        {record.tarikhPengislaman ? new Date(record.tarikhPengislaman).toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                                                    </td>
                                                    {/* Frozen 4: Score */}
                                                    <td className="sticky left-[320px] z-10 bg-emerald-100 p-1.5 border-r border-emerald-200 group-hover:bg-emerald-200/50 align-top text-center">
                                                        <div className={`text-[11px] font-bold ${score === 100 ? 'text-emerald-700' : score > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                                                            {score}%
                                                        </div>
                                                        <div className="text-[8px] mt-0.5 text-emerald-900/60 font-semibold leading-none">
                                                            {overallStatus.replace('Disusuli', '')}
                                                        </div>
                                                    </td>

                                                    {/* Frozen 5: Tindakan */}
                                                    <td className="sticky left-[410px] z-10 bg-white p-1.5 border-r border-slate-200 group-hover:bg-slate-50 align-top">
                                                        <div className="flex items-center gap-1 justify-center">
                                                            <a
                                                                href={`/rekod?id=${record.id}`}
                                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                title="Lihat Detail"
                                                            >
                                                                <Activity className="h-3.5 w-3.5" />
                                                            </a>
                                                            {isEdited && (
                                                                <button
                                                                    onClick={() => {
                                                                        const nc = { ...pendingChanges };
                                                                        delete nc[record.id];
                                                                        setPendingChanges(nc);
                                                                    }}
                                                                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                    title="Batal perubahan"
                                                                >
                                                                    <X className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Scrollable Data Cells */}
                                                    {KPI_COLUMNS.map(col => {
                                                        const fieldKey = col.id;
                                                        const rawValue = pendingChanges[record.id]?.[fieldKey] !== undefined
                                                            ? pendingChanges[record.id][fieldKey]
                                                            : kpi[fieldKey];

                                                        const isCellEdited = pendingChanges[record.id]?.[fieldKey] !== undefined;

                                                        if (col.type === 'metric-readonly') {
                                                            const delay = currentMetrics.daysTakenToKeyIn || 0;
                                                            const onTime = currentMetrics.isKeyInOnTime;
                                                            return (
                                                                <td key={col.id} className="p-1 border-r border-slate-100 bg-slate-50 text-center align-top">
                                                                    <div className={`text-[10px] font-bold ${onTime ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                        {delay} Hari
                                                                    </div>
                                                                    <div className="text-[8px] text-slate-400 font-medium">
                                                                        {onTime ? 'PATUH' : 'LEWAT'}
                                                                    </div>
                                                                </td>
                                                            );
                                                        }

                                                        if (col.type === 'top-readonly') {
                                                            const val = record[fieldKey];
                                                            return (
                                                                <td key={col.id} className="p-1 border-r border-slate-100 bg-slate-50 group-hover:bg-white transition-colors align-top">
                                                                    <div className="text-[10px] font-medium text-slate-600 px-1 truncate" title={val}>
                                                                        {val || '-'}
                                                                    </div>
                                                                </td>
                                                            );
                                                        }

                                                        if (col.type === 'date-readonly') {
                                                            const dateVal = record[fieldKey];
                                                            return (
                                                                <td key={col.id} className="p-1 border-r border-slate-100 bg-slate-50 group-hover:bg-white transition-colors align-top">
                                                                    <div className="text-[9px] font-mono text-slate-500 text-center">
                                                                        {dateVal ? new Date(dateVal).toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
                                                                    </div>
                                                                </td>
                                                            );
                                                        }

                                                        if (col.type === 'checkbox') {
                                                            return (
                                                                <td key={col.id} className={`p-1 border-r border-slate-100 text-center align-top ${isCellEdited ? 'bg-amber-100/30' : ''}`}>
                                                                    {isSpreadsheetMode ? (
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={!!rawValue}
                                                                            onChange={(e) => handleCellChange(record.id, col.id, e.target.checked)}
                                                                            className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                                                                        />
                                                                    ) : (
                                                                        rawValue ? <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" /> : <XCircle className="h-4 w-4 text-slate-200 mx-auto" />
                                                                    )}
                                                                </td>
                                                            );
                                                        }

                                                        if (col.type === 'select' && col.id === 'kawasan') {
                                                            // Logic requested by user: check record.negeriCawangan and find branches in states table
                                                            const recordNegeri = record.negeriCawangan;
                                                            const stateObj = states.find(s => s.name === recordNegeri);
                                                            const cawanganList = stateObj?.cawangan || [];

                                                            // Fallback to global locations if state-specific cawangan is empty
                                                            // This ensures we always have options if the states table is incomplete
                                                            const dropdownOptions = cawanganList.length > 0 ? cawanganList : locations;

                                                            return (
                                                                <td key={col.id} className={`p-1 border-r border-slate-100 align-top ${isCellEdited ? 'bg-amber-100/30' : ''}`}>
                                                                    {isSpreadsheetMode ? (
                                                                        <select
                                                                            value={rawValue || ''}
                                                                            onChange={(e) => handleCellChange(record.id, col.id, e.target.value)}
                                                                            className="w-full bg-white border border-slate-200 rounded px-1 py-0.5 text-[10px] focus:ring-1 focus:ring-emerald-500 outline-none"
                                                                        >
                                                                            <option value="">Pilih Kawasan</option>
                                                                            {dropdownOptions.length > 0 ? [...dropdownOptions].sort().map(loc => (
                                                                                <option key={loc} value={loc}>{loc}</option>
                                                                            )) : <option disabled>Tiada Pilihan</option>}
                                                                        </select>
                                                                    ) : (
                                                                        <div className="truncate max-w-[150px]" title={rawValue}>
                                                                            {rawValue || '-'}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            );
                                                        }

                                                        return (
                                                            <td key={col.id} className={`p-1 border-r border-slate-100 align-top ${isCellEdited ? 'bg-amber-100/30' : ''}`}>
                                                                {isSpreadsheetMode ? (
                                                                    <textarea
                                                                        value={rawValue || ''}
                                                                        onChange={(e) => handleCellChange(record.id, col.id, e.target.value)}
                                                                        className="w-full bg-white border border-slate-200 rounded px-1 py-0.5 min-h-[22px] resize-none focus:ring-1 focus:ring-emerald-500 outline-none"
                                                                        rows={1}
                                                                    />
                                                                ) : (
                                                                    <div className="truncate max-w-[200px]" title={rawValue}>
                                                                        {rawValue || '-'}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
