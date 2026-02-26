'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { useModal } from '@/contexts/ModalContext';
import { getStates, getClassLevels, getClassTypes, getLocationsTable } from '@/lib/supabase/database';
import { NEGERI_CAWANGAN_OPTIONS } from '@/lib/constants';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Search, Plus, Edit2, Trash2, MapPin, X, CheckCircle, Download, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

// Helper component for filter inputs
const FilterInput = ({ value, onChange, options, placeholder, listId }) => (
    <div className="relative">
        <input
            type="text"
            list={listId}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="block w-full bg-white text-[10px] border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-0.5 px-1"
            placeholder={placeholder || "Cari..."}
        />
        <datalist id={listId}>
            {options.map(val => (
                <option key={val} value={val} />
            ))}
        </datalist>
    </div>
);

export default function ClassesPage() {
    const { user, role, profile, loading: authLoading } = useAuth();
    const { showAlert, showSuccess, showError, showConfirm } = useModal();
    const router = useRouter();

    const [classes, setClasses] = useState([]);
    const [locations, setLocations] = useState([]);
    const [states, setStates] = useState([]);
    const [levels, setLevels] = useState([]);
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter & Sort State
    const [columnFilters, setColumnFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: 'nama', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentClass, setCurrentClass] = useState(null);
    const [formData, setFormData] = useState({
        nama: '',
        negeri: '',
        lokasi: '',
        jenis: 'Fizikal',
        tahap: 'Asas'
    });

    // Fetch Locations (using dynamic locations table)
    useEffect(() => {
        if (authLoading) return;

        const fetchMetadata = async () => {
            const [locsRes, statesRes, levelsRes, typesRes] = await Promise.all([
                getLocationsTable(),
                getStates(),
                getClassLevels(),
                getClassTypes()
            ]);

            if (locsRes.data) setLocations(locsRes.data);
            if (statesRes.data) setStates(statesRes.data.map(s => s.name));
            if (levelsRes.data) setLevels(levelsRes.data.map(l => l.name));
            if (typesRes.data) setTypes(typesRes.data.map(t => t.name));
        };
        fetchMetadata();
    }, [authLoading]);


    // Fetch Classes
    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('classes')
            .select('*')
            .order('nama');

        if (error) {
            console.error("Error fetching classes:", error);
        } else {
            // Apply permission filtering immediately
            if (role !== 'admin' && profile?.assignedLocations && !profile.assignedLocations.includes('All')) {
                const allowedData = data.filter(c => profile.assignedLocations.includes(c.lokasi));
                setClasses(allowedData || []);
            } else {
                setClasses(data || []);
            }
        }
        setLoading(false);
    };

    const availableLocations = (role === 'admin' || profile?.assignedLocations?.includes('All'))
        ? locations
        : locations.filter(l => profile?.assignedLocations?.includes(l.name));

    // Modal Locations Filtered by State
    const modalLocations = formData.negeri
        ? availableLocations.filter(l => l.state_name === formData.negeri)
        : availableLocations;


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentClass) {
                const { error } = await supabase
                    .from('classes')
                    .update({
                        ...formData,
                        updatedAt: new Date().toISOString(),
                        updatedBy: user.id
                    })
                    .eq('id', currentClass.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('classes')
                    .insert({
                        ...formData,
                        createdAt: new Date().toISOString(),
                        createdBy: user.id
                    });

                if (error) throw error;
            }
            setIsModalOpen(false);
            resetForm();
            fetchClasses();
            showSuccess('Berjaya', 'Data kelas telah disimpan.');
        } catch (error) {
            console.error("Error saving class:", error);
            showError('Ralat Simpan', "Ralat menyimpan kelas.");
        }
    };

    const handleDelete = async (id) => {
        showConfirm('Sahkan Padam', 'Adakah anda pasti mahu memadam kelas ini?', async () => {
            const { error } = await supabase
                .from('classes')
                .delete()
                .eq('id', id);

            if (error) {
                showError('Ralat Padam', error.message);
            } else {
                fetchClasses();
                showSuccess('Berjaya', 'Kelas telah dipadam.');
            }
        });
    };

    const openModal = (cls = null) => {
        if (cls) {
            setCurrentClass(cls);
            setFormData({
                nama: cls.nama || '',
                negeri: cls.negeri || '',
                lokasi: cls.lokasi || '',
                jenis: cls.jenis || 'Fizikal',
                tahap: cls.tahap || 'Asas'
            });
        } else {
            setCurrentClass(null);
            resetForm();
        }
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            nama: '',
            negeri: '',
            lokasi: '',
            jenis: 'Fizikal',
            tahap: 'Asas'
        });
    };

    // --- Table Logic ---

    // Get unique values for a column, respecting other filters
    const getUniqueValues = (field) => {
        const relevantSubmissions = classes.filter(sub => {
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

    const filteredClasses = classes.filter(cls => {
        return Object.entries(columnFilters).every(([field, value]) => {
            if (!value) return true;
            if (value === '(Kosong)') {
                return !cls[field] || cls[field] === '';
            }
            return cls[field]?.toString().toLowerCase().includes(value.toLowerCase());
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
        const headers = ['Nama Kelas', 'Negeri', 'Lokasi', 'Jenis', 'Tahap'];
        const csvContent = [
            headers.join(','),
            ...filteredClasses.map(c => [
                c.nama, c.negeri, c.lokasi, c.jenis, c.tahap
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `data-kelas-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // Pagination
    const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedClasses = filteredClasses.slice(startIndex, startIndex + itemsPerPage);

    // Statistics Calculation
    const typeCounts = filteredClasses.reduce((acc, curr) => {
        const type = curr.jenis || 'Tiada Jenis';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    const levelCounts = filteredClasses.reduce((acc, curr) => {
        const level = curr.tahap || 'Tiada Tahap';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
    }, {});

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-50 pt-16">
                <Navbar />

                <div className="w-full mx-auto px-2 sm:px-4 py-4">
                    {/* Header */}
                    <div className="mb-4">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center mb-2">
                            <MapPin className="h-6 w-6 mr-2 text-blue-600" />
                            Pengurusan Kelas & Lokasi
                        </h1>

                        {/* Statistics Badges */}
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                            {/* Jenis Stats */}
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-purple-100 flex-1">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Ringkasan Jenis</h3>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(typeCounts).sort((a, b) => a[0].localeCompare(b[0])).map(([type, count]) => (
                                        <div key={type} className="flex items-center bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                                            <span className="text-xs font-medium text-gray-600 mr-2">{type}</span>
                                            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-1.5 py-0.5 rounded-md min-w-[24px] text-center">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tahap Stats */}
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-100 flex-1">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Ringkasan Tahap</h3>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(levelCounts).sort((a, b) => a[0].localeCompare(b[0])).map(([level, count]) => (
                                        <div key={level} className="flex items-center bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                                            <span className="text-xs font-medium text-gray-600 mr-2">{level}</span>
                                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-1.5 py-0.5 rounded-md min-w-[24px] text-center">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <p className="text-gray-600 text-xs">
                            Jumlah {filteredClasses.length} rekod dijumpai
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
                                className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 shadow-sm transition-colors flex items-center"
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
                    ) : filteredClasses.length === 0 ? (
                        <div className="card text-center py-12">
                            <p className="text-gray-500 text-lg">Tiada rekod dijumpai</p>
                        </div>
                    ) : (
                        <div className="card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-blue-500 bg-blue-100">
                                            {/* Frozen: Nama */}
                                            <th className="sticky left-0 z-20 bg-blue-200 text-left py-1 px-2 font-semibold text-gray-700 shadow-[1px_0_0_0_#3b82f6] min-w-[200px] align-top">
                                                <div
                                                    className="flex items-center cursor-pointer mb-1 group"
                                                    onClick={() => handleSort('nama')}
                                                >
                                                    <span>Nama</span>
                                                    {sortConfig.key === 'nama' ? (
                                                        sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1 text-blue-600" /> : <ArrowDown className="h-3 w-3 ml-1 text-blue-600" />
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
                                            <th className="sticky left-[200px] z-20 bg-blue-200 text-left py-1 px-2 font-semibold text-gray-700 shadow-[1px_0_0_0_#3b82f6] min-w-[100px] align-top">
                                                <div className="mb-1">Tindakan</div>
                                            </th>

                                            {/* Scrollable Columns */}
                                            {[
                                                { id: 'negeri', label: 'Negeri', width: 'min-w-[150px]' },
                                                { id: 'lokasi', label: 'Lokasi', width: 'min-w-[150px]' },
                                                { id: 'jenis', label: 'Jenis', width: 'min-w-[120px]' },
                                                { id: 'tahap', label: 'Tahap', width: 'min-w-[120px]' },
                                            ].map(col => (
                                                <th key={col.id} className={`text-left py-1 px-2 font-semibold text-gray-700 bg-blue-100 border-r border-gray-200 ${col.width} align-top`}>
                                                    <div
                                                        className="flex items-center cursor-pointer mb-1 group"
                                                        onClick={() => handleSort(col.id)}
                                                    >
                                                        <span>{col.label}</span>
                                                        {sortConfig.key === col.id ? (
                                                            sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1 text-blue-600" /> : <ArrowDown className="h-3 w-3 ml-1 text-blue-600" />
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
                                        {paginatedClasses.map((cls) => (
                                            <tr key={cls.id} className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                                                <td className="sticky left-0 z-10 bg-blue-50 py-1 px-2 shadow-[1px_0_0_0_#3b82f6] min-w-[200px] font-medium text-gray-900">
                                                    {cls.nama}
                                                </td>
                                                <td className="sticky left-[200px] z-10 bg-blue-50 py-1 px-2 shadow-[1px_0_0_0_#3b82f6] min-w-[100px]">
                                                    <div className="flex items-center space-x-2">
                                                        <button onClick={() => openModal(cls)} className="text-gray-400 hover:text-blue-600 transition-colors p-1" title="Edit">
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button onClick={() => handleDelete(cls.id)} className="text-gray-400 hover:text-red-600 transition-colors p-1" title="Padam">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>

                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[150px]">{cls.negeri || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[150px]">{cls.lokasi || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[120px]">
                                                    <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${cls.jenis === 'Online' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                                        {cls.jenis}
                                                    </span>
                                                </td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[120px]">
                                                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                                                        {cls.tahap}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="mt-6 flex items-center justify-between border-t pt-4">
                                    <p className="text-sm text-gray-600">
                                        Menunjukkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredClasses.length)} daripada {filteredClasses.length}
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

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl transform transition-all">
                            <div className="flex justify-between items-center mb-4 border-b pb-4">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {currentClass ? 'Kemaskini Kelas' : 'Tambah Kelas Baru'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kelas / Kumpulan</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        value={formData.nama}
                                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                        placeholder="cth: Kelas BTR 1"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Negeri</label>
                                        <select
                                            required
                                            className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            value={formData.negeri}
                                            onChange={(e) => setFormData({ ...formData, negeri: e.target.value, lokasi: '' })}
                                        >
                                            <option value="">-- Sila Pilih Negeri --</option>
                                            {(states.length > 0 ? states : NEGERI_CAWANGAN_OPTIONS).map(negeri => (
                                                <option key={negeri} value={negeri}>{negeri}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                                        <select
                                            required
                                            className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            value={formData.lokasi}
                                            onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                                            disabled={!formData.negeri}
                                        >
                                            <option value="">-- Sila Pilih Lokasi --</option>
                                            {modalLocations.map(loc => (
                                                <option key={loc.id || loc.name} value={loc.name}>{loc.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            value={formData.jenis}
                                            onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
                                        >
                                            {(types.length > 0 ? types : ['Fizikal', 'Online']).map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tahap</label>
                                        <select
                                            className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            value={formData.tahap}
                                            onChange={(e) => setFormData({ ...formData, tahap: e.target.value })}
                                        >
                                            {(levels.length > 0 ? levels : ['Asas', 'Lanjutan']).map(l => (
                                                <option key={l} value={l}>{l}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-6 flex justify-end space-x-3 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-md transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md flex items-center shadow-sm transition-colors"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-2" /> Simpan
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
