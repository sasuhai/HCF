'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { getStates, getLocationsTable, getLookupData } from '@/lib/supabase/database';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Search, Plus, Edit2, Trash2, User, X, MapPin, Download, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { PETUGAS_KATEGORI_ELAUN, NEGERI_CAWANGAN_OPTIONS, BANK_OPTIONS } from '@/lib/constants';

// Helper component for filter inputs
const FilterInput = ({ value, onChange, options, placeholder, listId }) => (
    <div className="relative">
        <input
            type="text"
            list={listId}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="block w-full bg-white text-[10px] border-gray-300 rounded-md shadow-sm focus:border-emerald-500 focus:ring-emerald-500 py-0.5 px-1"
            placeholder={placeholder || "Cari..."}
        />
        <datalist id={listId}>
            {options.map(val => (
                <option key={val} value={val} />
            ))}
        </datalist>
    </div>
);

export default function WorkersPage() {
    const { user, role, profile, loading: authLoading } = useAuth();
    const router = useRouter();

    // Data State
    const [workers, setWorkers] = useState([]);
    const [locations, setLocations] = useState([]); // Stores full objects: {id, name, state_name}
    const [states, setStates] = useState([]);
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter & Sort State
    const [columnFilters, setColumnFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: 'nama', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentWorker, setCurrentWorker] = useState(null);
    const [formData, setFormData] = useState({
        nama: '',
        noKP: '',
        bank: '',
        noAkaun: '',
        peranan: 'Sukarelawan',
        lokasi: '',
        negeri: '',
        kategoriElaun: '',
        staff_id: '',
        jantina: '',
        tarikh_daftar: '',
        daerah_kediaman: '',
        negeri_kediaman: '',
        tel_bimbit: '',
        email: '',
        pekerjaan: '',
        kepakaran: '',
        tarikh_lahir: ''
    });

    // Fetch Reference Data
    useEffect(() => {
        if (!authLoading) {
            fetchLocations();
            fetchStates();
            fetchBanks();
            fetchWorkers();
        }
    }, [authLoading]);

    const fetchLocations = async () => {
        // Use getLocationsTable to get full metadata (name, state_name)
        // If getLocationsTable is not available, we can fallback or ensure it is imported
        const { data } = await getLocationsTable();
        if (data) setLocations(data);
    };

    const fetchBanks = async () => {
        const { data } = await getLookupData('banks');
        if (data) setBanks(data.map(b => b.name));
    };

    const fetchStates = async () => {
        const { data } = await getStates();
        if (data) setStates(data.map(s => s.name));
    };

    const fetchWorkers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('workers')
            .select('*')
            .order('nama');

        if (!error && data) {
            // Apply permission filtering immediately
            if (role !== 'admin' && profile?.assignedLocations && !profile.assignedLocations.includes('All')) {
                const allowedData = data.filter(w => profile.assignedLocations.includes(w.lokasi));
                setWorkers(allowedData);
            } else {
                setWorkers(data);
            }
        }
        setLoading(false);
    };

    // Derived: Available Locations Logic
    // 1. Filter by User Permissions
    const permittedLocations = (role === 'admin' || profile?.assignedLocations?.includes('All'))
        ? locations
        : locations.filter(l => profile?.assignedLocations?.includes(l.name));

    // 2. Filter by Selected State (in Modal)
    const modalLocations = formData.negeri
        ? permittedLocations.filter(l => l.state_name === formData.negeri)
        : permittedLocations;

    // Handle Form Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Validation
            if (!formData.nama || !formData.noKP || !formData.negeri || !formData.lokasi) {
                alert("Sila isi semua maklumat mandatori (Nama, No KP, Negeri, dan Lokasi).");
                return;
            }

            if (currentWorker) {
                const { error } = await supabase
                    .from('workers')
                    .update({
                        ...formData,
                        updatedAt: new Date().toISOString(),
                        updatedBy: user.id
                    })
                    .eq('id', currentWorker.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('workers')
                    .insert({
                        ...formData,
                        createdAt: new Date().toISOString(),
                        createdBy: user.id
                    });
                if (error) throw error;
            }
            setIsModalOpen(false);
            resetForm();
            fetchWorkers();
        } catch (error) {
            console.error("Error saving worker:", error);
            alert("Ralat menyimpan data pekerja.");
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Adakah anda pasti mahu memadam pekerja ini?")) {
            const { error } = await supabase.from('workers').delete().eq('id', id);
            if (error) {
                alert("Ralat memadam pekerja: " + error.message);
            } else {
                fetchWorkers();
            }
        }
    };

    const openModal = (worker = null) => {
        if (worker) {
            setCurrentWorker(worker);
            setFormData({
                nama: worker.nama || '',
                noKP: worker.noKP || '',
                bank: worker.bank || '',
                noAkaun: worker.noAkaun || '',
                peranan: worker.peranan || 'Sukarelawan',
                lokasi: worker.lokasi || '',
                negeri: worker.negeri || '',
                kategoriElaun: worker.kategoriElaun || '',
                staff_id: worker.staff_id || '',
                jantina: worker.jantina || '',
                tarikh_daftar: worker.tarikh_daftar || '',
                daerah_kediaman: worker.daerah_kediaman || '',
                negeri_kediaman: worker.negeri_kediaman || '',
                tel_bimbit: worker.tel_bimbit || '',
                email: worker.email || '',
                pekerjaan: worker.pekerjaan || '',
                kepakaran: worker.kepakaran || '',
                tarikh_lahir: worker.tarikh_lahir || ''
            });
        } else {
            setCurrentWorker(null);
            resetForm();
        }
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            nama: '',
            noKP: '',
            bank: '',
            noAkaun: '',
            peranan: 'Sukarelawan',
            lokasi: '',
            negeri: '',
            kategoriElaun: '',
            staff_id: '',
            jantina: '',
            tarikh_daftar: '',
            daerah_kediaman: '',
            negeri_kediaman: '',
            tel_bimbit: '',
            email: '',
            pekerjaan: '',
            kepakaran: '',
            tarikh_lahir: ''
        });
    };

    // --- Table Logic ---

    // Get unique values for a column, respecting other filters
    const getUniqueValues = (field) => {
        const relevantSubmissions = workers.filter(sub => {
            return Object.entries(columnFilters).every(([key, value]) => {
                if (key === field) return true;
                if (!value) return true;
                if (value === '(Kosong)') {
                    return !sub[key] || sub[key] === '';
                }
                return sub[key]?.toString().toLowerCase().includes(value.toLowerCase());
            });
        });

        const hasBlanks = relevantSubmissions.some(sub => !sub[field] || sub[field] === '');
        const values = relevantSubmissions
            .map(sub => sub[field])
            .filter(val => val && val !== '' && val !== null && val !== undefined);

        const uniqueValues = [...new Set(values)].sort();
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
        setCurrentPage(1);
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
        setSortConfig({ key: 'nama', direction: 'asc' });
        setCurrentPage(1);
    };

    const filteredWorkers = workers.filter(worker => {
        return Object.entries(columnFilters).every(([field, value]) => {
            if (!value) return true;
            if (value === '(Kosong)') {
                return !worker[field] || worker[field] === '';
            }
            return worker[field]?.toString().toLowerCase().includes(value.toLowerCase());
        });
    }).sort((a, b) => {
        if (!sortConfig.key) return 0;
        let aVal = a[sortConfig.key] || '';
        let bVal = b[sortConfig.key] || '';
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const exportToCSV = () => {
        const headers = [
            'Nama', 'Peranan', 'No KP', 'Lokasi Bertugas', 'Negeri Bertugas', 'Kategori Elaun', 'Bank', 'No Akaun',
            'S-ID (Staf/Sukarelawan)', 'Jantina', 'Tarikh Daftar', 'Daerah/Bandar Tempat Tinggal', 'Negeri Tempat Tinggal',
            'Tel Bimbit', 'Email', 'Pekerjaan', 'Kepakaran/Pengalaman', 'Tarikh Lahir'
        ];

        // Helper to escape commas in values
        const escapeCSV = (str) => {
            if (str === null || str === undefined) return '';
            const s = String(str);
            if (s.includes(',') || s.includes('"') || s.includes('\n')) {
                return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
        };

        const csvContent = [
            headers.join(','),
            ...filteredWorkers.map(w => [
                escapeCSV(w.nama), w.peranan || '', escapeCSV(w.noKP), escapeCSV(w.lokasi), escapeCSV(w.negeri),
                escapeCSV(w.kategoriElaun), escapeCSV(w.bank), escapeCSV(w.noAkaun),
                escapeCSV(w.staff_id), escapeCSV(w.jantina), escapeCSV(w.tarikh_daftar), escapeCSV(w.daerah_kediaman),
                escapeCSV(w.negeri_kediaman), escapeCSV(w.tel_bimbit), escapeCSV(w.email), escapeCSV(w.pekerjaan),
                escapeCSV(w.kepakaran), escapeCSV(w.tarikh_lahir)
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `data-pekerja-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // Pagination
    const totalPages = Math.ceil(filteredWorkers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedWorkers = filteredWorkers.slice(startIndex, startIndex + itemsPerPage);

    // Statistics Calculation
    const roleCounts = filteredWorkers.reduce((acc, curr) => {
        const role = curr.peranan || 'Tiada Peranan';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
    }, {});

    const allowanceCounts = filteredWorkers.reduce((acc, curr) => {
        const allow = curr.kategoriElaun || 'Tiada Kat. Elaun';
        acc[allow] = (acc[allow] || 0) + 1;
        return acc;
    }, {});

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 pt-16">
                <Navbar />

                <div className="w-full mx-auto px-2 sm:px-4 py-4">
                    {/* Header */}
                    <div className="mb-4">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center mb-2">
                            <User className="h-6 w-6 mr-2 text-emerald-600" />
                            Pengurusan Petugas
                        </h1>

                        {/* Statistics Badges */}
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                            {/* Peranan Stats */}
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-emerald-100 flex-1">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Ringkasan Peranan</h3>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(roleCounts).sort((a, b) => a[0].localeCompare(b[0])).map(([role, count]) => (
                                        <div key={role} className="flex items-center bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                                            <span className="text-xs font-medium text-gray-600 mr-2">{role}</span>
                                            <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-1.5 py-0.5 rounded-md min-w-[24px] text-center">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Kategori Elaun Stats */}
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-100 flex-1">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Ringkasan Kategori Elaun</h3>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(allowanceCounts).sort((a, b) => a[0].localeCompare(b[0])).map(([cat, count]) => (
                                        <div key={cat} className="flex items-center bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                                            <span className="text-xs font-medium text-gray-600 mr-2">{cat}</span>
                                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-1.5 py-0.5 rounded-md min-w-[24px] text-center">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <p className="text-gray-600 text-xs">
                            Jumlah {filteredWorkers.length} rekod dijumpai
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center mb-2">
                        <div>
                            {Object.keys(columnFilters).length > 0 && (
                                <button
                                    onClick={clearAllFilters}
                                    className="px-3 py-1 bg-red-50 text-red-600 rounded text-xs font-medium hover:bg-red-100 transition-colors"
                                >
                                    Padam Semua Filter
                                </button>
                            )}
                        </div>
                        <div className="flex bg-transparent space-x-2">
                            <button
                                onClick={exportToCSV}
                                className="flex items-center justify-center space-x-1 whitespace-nowrap bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-3 py-1 rounded text-xs font-medium shadow-sm transition-colors"
                            >
                                <Download className="h-4 w-4" />
                                <span>Export CSV</span>
                            </button>
                            <button
                                onClick={() => openModal()}
                                className="bg-emerald-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-emerald-700 shadow-sm transition-colors flex items-center"
                            >
                                <Plus className="h-4 w-4 mr-1" /> Tambah
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="card">
                            <div className="space-y-4">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="animate-shimmer h-16 rounded-lg"></div>
                                ))}
                            </div>
                        </div>
                    ) : filteredWorkers.length === 0 ? (
                        <div className="card text-center py-12">
                            <p className="text-gray-500 text-lg">Tiada rekod dijumpai</p>
                        </div>
                    ) : (
                        <div className="border rounded-lg shadow-sm bg-white overflow-auto max-h-[calc(100vh-180px)]">
                            <table className="w-full text-xs sticky-table">
                                <thead>
                                    <tr className="bg-emerald-100">
                                        {/* Frozen: Nama */}
                                        <th className="sticky left-0 top-0 z-50 bg-emerald-200 text-left py-1 px-2 font-semibold text-gray-700 border-b-2 border-emerald-500 shadow-[1px_0_0_0_#10b981] min-w-[200px] align-top">
                                            <div
                                                className="flex items-center cursor-pointer mb-1 group"
                                                onClick={() => handleSort('nama')}
                                            >
                                                <span>Nama</span>
                                                {sortConfig.key === 'nama' ? (
                                                    sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1 text-emerald-600" /> : <ArrowDown className="h-3 w-3 ml-1 text-emerald-600" />
                                                ) : (
                                                    <ArrowUpDown className="h-3 w-3 ml-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                )}
                                            </div>
                                            <FilterInput
                                                value={columnFilters['nama']}
                                                onChange={(val) => handleFilterChange('nama', val)}
                                                options={getUniqueValues('nama')}
                                                listId="list-nama"
                                                placeholder="Cari Nama"
                                            />
                                        </th>
                                        {/* Frozen: Tindakan */}
                                        <th className="sticky left-[200px] top-0 z-40 bg-emerald-200 text-left py-1 px-2 font-semibold text-gray-700 border-b-2 border-emerald-500 shadow-[1px_0_0_0_#10b981] min-w-[100px] align-top">
                                            <div className="mb-1">Tindakan</div>
                                        </th>

                                        {/* Scrollable Columns */}
                                        {[
                                            { id: 'peranan', label: 'Peranan', width: 'min-w-[120px]' },
                                            { id: 'noKP', label: 'No KP', width: 'min-w-[150px]' },
                                            { id: 'lokasi', label: 'Lokasi', width: 'min-w-[140px]' },
                                            { id: 'negeri', label: 'Negeri', width: 'min-w-[140px]' },
                                            { id: 'kategoriElaun', label: 'Kat. Elaun', width: 'min-w-[140px]' },
                                            { id: 'bank', label: 'Bank', width: 'min-w-[140px]' },
                                            { id: 'noAkaun', label: 'No Akaun', width: 'min-w-[160px]' },
                                            { id: 'staff_id', label: 'S-ID', width: 'min-w-[120px]' },
                                            { id: 'jantina', label: 'Jantina', width: 'min-w-[100px]' },
                                            { id: 'tarikh_daftar', label: 'Tarikh Daftar', width: 'min-w-[120px]' },
                                            { id: 'tarikh_lahir', label: 'Tarikh Lahir', width: 'min-w-[120px]' },
                                            { id: 'tel_bimbit', label: 'No. Tel Bimbit', width: 'min-w-[120px]' },
                                            { id: 'email', label: 'Emel', width: 'min-w-[150px]' },
                                            { id: 'daerah_kediaman', label: 'Daerah Tinggal', width: 'min-w-[150px]' },
                                            { id: 'negeri_kediaman', label: 'Negeri Tinggal', width: 'min-w-[140px]' },
                                            { id: 'pekerjaan', label: 'Pekerjaan', width: 'min-w-[150px]' },
                                            { id: 'kepakaran', label: 'Kepakaran/Pengalaman', width: 'min-w-[600px]' }
                                        ].map(col => (
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
                                    {paginatedWorkers.map((worker) => (
                                        <tr key={worker.id} className="border-b border-gray-200 hover:bg-emerald-50 transition-colors">
                                            <td className="sticky left-0 z-10 bg-emerald-50 py-1 px-2 shadow-[1px_0_0_0_#10b981] min-w-[200px] font-medium text-gray-900">
                                                {worker.nama}
                                            </td>
                                            <td className="sticky left-[200px] z-10 bg-emerald-50 py-1 px-2 shadow-[1px_0_0_0_#10b981] min-w-[100px]">
                                                <div className="flex items-center space-x-2">
                                                    <button onClick={() => openModal(worker)} className="text-gray-400 hover:text-emerald-600 transition-colors p-1" title="Edit">
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(worker.id)} className="text-gray-400 hover:text-red-600 transition-colors p-1" title="Padam">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>

                                            <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[120px]">
                                                <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${worker.peranan === 'Guru' ? 'bg-indigo-100 text-indigo-700' :
                                                    worker.peranan === 'Petugas' ? 'bg-blue-100 text-blue-700' :
                                                        worker.peranan === 'Koordinator' ? 'bg-purple-100 text-purple-700' :
                                                            'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                    {worker.peranan}
                                                </span>
                                            </td>
                                            <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[150px]">{worker.noKP || '-'}</td>
                                            <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[140px]">{worker.lokasi || '-'}</td>
                                            <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[140px]">{worker.negeri || '-'}</td>
                                            <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[140px]">
                                                {worker.kategoriElaun ? (
                                                    <span className="inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap bg-yellow-100 text-yellow-800">
                                                        {worker.kategoriElaun}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[140px]">{worker.bank || '-'}</td>
                                            <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[160px]">{worker.noAkaun || '-'}</td>
                                            <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[120px]">{worker.staff_id || '-'}</td>
                                            <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[100px]">{worker.jantina || '-'}</td>
                                            <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[120px]">{worker.tarikh_daftar || '-'}</td>
                                            <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[120px]">{worker.tarikh_lahir || '-'}</td>
                                            <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[120px]">{worker.tel_bimbit || '-'}</td>
                                            <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[150px]">{worker.email || '-'}</td>
                                            <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[150px]">{worker.daerah_kediaman || '-'}</td>
                                            <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[140px]">{worker.negeri_kediaman || '-'}</td>
                                            <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[150px]">{worker.pekerjaan || '-'}</td>
                                            <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[600px]">{worker.kepakaran || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-6 flex items-center justify-between border-t pt-4">
                                    <p className="text-sm text-gray-600">
                                        Menunjukkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredWorkers.length)} daripada {filteredWorkers.length}
                                    </p>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                        <span className="text-sm font-medium">
                                            Halaman {currentPage} / {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Modal (kept largely same style but ensured it works with new structure/imports) */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {currentWorker ? 'Kemaskini Pekerja' : 'Tambah Pekerja Baru'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)}><X className="h-6 w-6 text-gray-400" /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nama Penuh <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        value={formData.nama}
                                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Moved Negeri first */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Negeri <span className="text-red-500">*</span></label>
                                        <select
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            required
                                            value={formData.negeri}
                                            onChange={(e) => setFormData({ ...formData, negeri: e.target.value, lokasi: '' })}
                                        >
                                            <option value="">-- Pilih Negeri --</option>
                                            {(states.length > 0 ? states : NEGERI_CAWANGAN_OPTIONS).map(negeri => (
                                                <option key={negeri} value={negeri}>{negeri}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Lokasi <span className="text-red-500">*</span></label>
                                        <select
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            value={formData.lokasi}
                                            onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                                            disabled={!formData.negeri}
                                        >
                                            <option value="">-- Pilih --</option>
                                            {modalLocations.map(loc => (
                                                <option key={loc.id || loc.name} value={loc.name}>{loc.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Peranan</label>
                                        <select
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            value={formData.peranan}
                                            onChange={(e) => setFormData({ ...formData, peranan: e.target.value })}
                                        >
                                            <option value="Guru">Guru</option>
                                            <option value="Petugas">Petugas</option>
                                            <option value="Sukarelawan">Sukarelawan</option>
                                            <option value="Koordinator">Koordinator</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">No. Kad Pengenalan <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        value={formData.noKP}
                                        onChange={(e) => setFormData({ ...formData, noKP: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Kategori Elaun</label>
                                    <select
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        value={formData.kategoriElaun}
                                        onChange={(e) => setFormData({ ...formData, kategoriElaun: e.target.value })}
                                    >
                                        <option value="">-- Pilih Kategori Elaun --</option>
                                        {PETUGAS_KATEGORI_ELAUN.map(kategori => (
                                            <option key={kategori.value} value={kategori.value}>{kategori.label}</option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-xs text-gray-500">Kategori untuk kadar elaun/bayaran</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Nama Bank</label>
                                        <select
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            value={formData.bank}
                                            onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                                        >
                                            <option value="">-- Pilih Bank --</option>
                                            {(banks.length > 0 ? banks : BANK_OPTIONS).map(bank => (
                                                <option key={bank} value={bank}>{bank}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">No. Akaun</label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            value={formData.noAkaun}
                                            onChange={(e) => setFormData({ ...formData, noAkaun: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Sukarelawan / Additional Details Section */}
                                <div className="pt-4 mt-6 border-t border-gray-200">
                                    <h4 className="text-md font-semibold text-gray-800 mb-4">Maklumat Tambahan</h4>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">ID Staf / Sukarelawan</label>
                                            <input
                                                type="text"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                value={formData.staff_id}
                                                onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Tarikh Daftar</label>
                                            <input
                                                type="date"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                value={formData.tarikh_daftar || ''}
                                                onChange={(e) => setFormData({ ...formData, tarikh_daftar: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Jantina</label>
                                            <select
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                value={formData.jantina}
                                                onChange={(e) => setFormData({ ...formData, jantina: e.target.value })}
                                            >
                                                <option value="">-- Pilih Jantina --</option>
                                                <option value="Lelaki">Lelaki</option>
                                                <option value="Perempuan">Perempuan</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Tarikh Lahir</label>
                                            <input
                                                type="date"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                value={formData.tarikh_lahir || ''}
                                                onChange={(e) => setFormData({ ...formData, tarikh_lahir: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">No. Tel Bimbit</label>
                                            <input
                                                type="text"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                value={formData.tel_bimbit}
                                                onChange={(e) => setFormData({ ...formData, tel_bimbit: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Emel</label>
                                            <input
                                                type="email"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Daerah/Bandar Tempat Tinggal</label>
                                            <input
                                                type="text"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                value={formData.daerah_kediaman}
                                                onChange={(e) => setFormData({ ...formData, daerah_kediaman: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Negeri Tempat Tinggal</label>
                                            <select
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                value={formData.negeri_kediaman}
                                                onChange={(e) => setFormData({ ...formData, negeri_kediaman: e.target.value })}
                                            >
                                                <option value="">-- Pilih Negeri --</option>
                                                {(states.length > 0 ? states : NEGERI_CAWANGAN_OPTIONS).map(negeri => (
                                                    <option key={negeri} value={negeri}>{negeri}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Pekerjaan</label>
                                            <input
                                                type="text"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                value={formData.pekerjaan}
                                                onChange={(e) => setFormData({ ...formData, pekerjaan: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Kepakaran / Pengalaman</label>
                                            <input
                                                type="text"
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                                                value={formData.kepakaran}
                                                onChange={(e) => setFormData({ ...formData, kepakaran: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 flex items-center"
                                    >
                                        <Plus className="h-4 w-4 mr-1" /> Simpan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
