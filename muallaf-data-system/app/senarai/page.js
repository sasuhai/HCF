'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { getSubmissions, deleteSubmission } from '@/lib/supabase/database';
import { Search, Eye, Edit, Trash2, Download, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

// Helper component for filter inputs - Moved outside to prevent re-renders
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

export default function SenaraiPage() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [columnFilters, setColumnFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const { role, profile, loading: authLoading } = useAuth();
    const itemsPerPage = 20;

    useEffect(() => {
        if (!authLoading) {
            loadSubmissions();
        }
    }, [authLoading, profile]);

    const loadSubmissions = async () => {
        setLoading(true);
        const { data, error } = await getSubmissions({});

        if (!error && data) {
            if (role !== 'admin' && profile?.assignedLocations && !profile.assignedLocations.includes('All')) {
                const allowedData = data.filter(sub => profile.assignedLocations.includes(sub.lokasi));
                setSubmissions(allowedData);
            } else {
                setSubmissions(data);
            }
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (confirm('Adakah anda pasti ingin memadam rekod ini?')) {
            const { error } = await deleteSubmission(id);
            if (!error) {
                loadSubmissions();
            } else {
                alert('Ralat memadam rekod: ' + error);
            }
        }
    };

    // Get unique values for a column, respecting other filters
    const getUniqueValues = (field) => {
        // Filter submissions using ALL filters EXCEPT specific filter for this 'field'
        const relevantSubmissions = submissions.filter(sub => {
            return Object.entries(columnFilters).every(([key, value]) => {
                if (key === field) return true; // Ignore current field's filter
                if (!value) return true;
                return sub[key]?.toString().toLowerCase().includes(value.toLowerCase());
            });
        });

        const values = relevantSubmissions
            .map(sub => sub[field])
            .filter(val => val && val !== '' && val !== null && val !== undefined);
        return [...new Set(values)].sort();
    };

    // Handle column filter change
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
        setCurrentPage(1); // Reset to first page when filtering
    };

    // Handle sorting
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Clear all filters
    const clearAllFilters = () => {
        setColumnFilters({});
        setSortConfig({ key: null, direction: 'asc' });
        setCurrentPage(1);
    };

    // Apply column filters and sorting
    const filteredSubmissions = submissions.filter(submission => {
        return Object.entries(columnFilters).every(([field, value]) => {
            if (!value) return true;
            // Changed strict equality to includes for search functionalities
            return submission[field]?.toString().toLowerCase().includes(value.toLowerCase());
        });
    }).sort((a, b) => {
        if (!sortConfig.key) return 0;

        let aVal = a[sortConfig.key] || '';
        let bVal = b[sortConfig.key] || '';

        // Handle numeric values if necessary, but simple string comparison works for most here
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const exportToCSV = () => {
        const headers = [
            'No Staf',
            'Didaftarkan Oleh',
            'Nama Asal',
            'Nama Penuh',
            'Nama Islam',
            'No KP',
            'Kategori',
            'Kategori Elaun',
            'Jantina',
            'Bangsa',
            'Tarikh Lahir',
            'Tarikh Pengislaman',
            'Pegawai Mengislamkan',
            'Saksi 1',
            'Saksi 2',
            'Poskod',
            'Bandar',
            'Negeri Adres',
            'Negeri Cawangan',
            'Lokasi',
            'Tanggungan',
            'Kenalan/Pengiring',
            'Bank',
            'No Akaun',
            'Nama di Bank',
            'Catatan',
            'Catatan Audit',
            'Dicipta Pada',
            'Dikemaskini Pada',
            'Dicipta Oleh',
            'Dikemaskini Oleh'
        ];

        const csvContent = [
            headers.join(','),
            ...filteredSubmissions.map(sub => [
                sub.noStaf,
                sub.registeredByName || '',
                sub.namaAsal,
                sub.namaPenuh || '',
                sub.namaIslam || '',
                sub.noKP,
                sub.kategori,
                sub.kategoriElaun || '',
                sub.jantina,
                sub.bangsa,
                sub.tarikhLahir || '',
                sub.tarikhPengislaman,
                sub.namaPegawaiMengislamkan || '',
                sub.namaSaksi1 || '',
                sub.namaSaksi2 || '',
                sub.poskod || '',
                sub.bandar || '',
                sub.negeri || '',
                sub.negeriCawangan,
                sub.lokasi || '',
                sub.tanggungan || '',
                sub.maklumatKenalanPengiring || '',
                sub.bank || '',
                sub.noAkaun || '',
                sub.namaDiBank || '',
                sub.catatan || '',
                sub.catatanAudit || '',
                sub.createdAt,
                sub.updatedAt,
                sub.createdBy,
                sub.updatedBy
            ].map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `data-mualaf-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // Pagination
    const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedSubmissions = filteredSubmissions.slice(startIndex, startIndex + itemsPerPage);

    // Statistics Calculation
    const categoryCounts = filteredSubmissions.reduce((acc, curr) => {
        const cat = curr.kategori || 'Tiada Kategori';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});

    const allowanceCounts = filteredSubmissions.reduce((acc, curr) => {
        const allow = curr.kategoriElaun || 'Tiada Elaun';
        acc[allow] = (acc[allow] || 0) + 1;
        return acc;
    }, {});

    // Helper for category badge colors
    const getCategoryColorParams = (cat) => {
        if (cat === 'Pengislaman') return { bg: 'bg-green-100', text: 'text-green-700' };
        if (cat === 'Sokongan') return { bg: 'bg-blue-100', text: 'text-blue-700' };
        if (cat === 'Non-Muslim') return { bg: 'bg-purple-100', text: 'text-purple-700' };
        return { bg: 'bg-orange-100', text: 'text-orange-700' };
    };

    // Helper for consistent badge colors with max differentiation for few items
    const getAllowanceColorParams = (type) => {
        if (!type || type === 'Tiada Elaun') return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' };

        // High contrast palette for maximum differentiation
        const colors = [
            { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },      // Distinct Blue
            { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },        // Distinct Red
            { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' }, // Distinct Green
            { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' }, // Distinct Purple
            { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },   // Distinct Orange/Yellow
            { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },      // Distinct Pink
        ];

        let hash = 0;
        for (let i = 0; i < type.length; i++) {
            hash = type.charCodeAt(i) + ((hash << 5) - hash);
        }

        const index = Math.abs(hash) % colors.length;
        return colors[index];
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            return date.toLocaleString('ms-MY', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
                <Navbar />

                <div className="w-full mx-auto px-2 sm:px-4 py-4">
                    {/* Header */}
                    <div className="mb-4">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Senarai Rekod</h1>

                        {/* Statistics Badges */}
                        <div className="flex flex-col md:flex-row gap-4 mb-4">
                            {/* Kategori Stats */}
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-emerald-100 flex-1">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Ringkasan Kategori <span className="text-emerald-600">({filteredSubmissions.length})</span></h3>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(categoryCounts).sort((a, b) => a[0].localeCompare(b[0])).map(([cat, count]) => {
                                        const colors = getCategoryColorParams(cat);
                                        return (
                                            <div key={cat} className="flex items-center bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                                                <span className="text-xs font-medium text-gray-600 mr-2">{cat}</span>
                                                <span className={`${colors.bg} ${colors.text} text-xs font-bold px-1.5 py-0.5 rounded-md min-w-[24px] text-center`}>{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Kategori Elaun Stats */}
                            <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-100 flex-1">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Ringkasan Kategori Elaun <span className="text-blue-600">({filteredSubmissions.filter(s => s.kategoriElaun).length})</span></h3>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(allowanceCounts).sort((a, b) => a[0].localeCompare(b[0])).map(([cat, count]) => {
                                        const colors = getAllowanceColorParams(cat);
                                        return (
                                            <div key={cat} className="flex items-center bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                                                <span className="text-xs font-medium text-gray-600 mr-2">{cat}</span>
                                                <span className={`${colors.bg} ${colors.text} text-xs font-bold px-1.5 py-0.5 rounded-md min-w-[24px] text-center`}>{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <p className="text-gray-600 text-xs">
                            Jumlah {filteredSubmissions.length} rekod dijumpai
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
                        <button
                            onClick={exportToCSV}
                            className="flex items-center justify-center space-x-1 whitespace-nowrap bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-3 py-1 rounded text-xs font-medium shadow-sm transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            <span>Export CSV</span>
                        </button>
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
                    ) : paginatedSubmissions.length === 0 ? (
                        <div className="card text-center py-12">
                            <p className="text-gray-500 text-lg">Tiada rekod dijumpai</p>
                        </div>
                    ) : (
                        <div className="card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-emerald-500 bg-emerald-100">
                                            {/* Frozen columns with solid backgrounds */}
                                            <th className="sticky left-0 z-20 bg-emerald-200 text-left py-1 px-2 font-semibold text-gray-700 shadow-[1px_0_0_0_#10b981] min-w-[90px] align-top">
                                                <div
                                                    className="flex items-center cursor-pointer mb-1 group"
                                                    onClick={() => handleSort('noStaf')}
                                                >
                                                    <span>No Staf</span>
                                                    {sortConfig.key === 'noStaf' ? (
                                                        sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1 text-emerald-600" /> : <ArrowDown className="h-3 w-3 ml-1 text-emerald-600" />
                                                    ) : (
                                                        <ArrowUpDown className="h-3 w-3 ml-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    )}
                                                </div>
                                                <FilterInput
                                                    value={columnFilters['noStaf']}
                                                    onChange={(val) => handleFilterChange('noStaf', val)}
                                                    options={getUniqueValues('noStaf')}
                                                    listId="list-noStaf"
                                                    placeholder="No Staf"
                                                />
                                            </th>
                                            <th className="sticky left-[90px] z-20 bg-emerald-200 text-left py-1 px-2 font-semibold text-gray-700 shadow-[1px_0_0_0_#10b981] min-w-[140px] align-top">
                                                <div
                                                    className="flex items-center cursor-pointer mb-1 group"
                                                    onClick={() => handleSort('namaAsal')}
                                                >
                                                    <span>Nama Asal</span>
                                                    {sortConfig.key === 'namaAsal' ? (
                                                        sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1 text-emerald-600" /> : <ArrowDown className="h-3 w-3 ml-1 text-emerald-600" />
                                                    ) : (
                                                        <ArrowUpDown className="h-3 w-3 ml-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    )}
                                                </div>
                                                <FilterInput
                                                    value={columnFilters['namaAsal']}
                                                    onChange={(val) => handleFilterChange('namaAsal', val)}
                                                    options={getUniqueValues('namaAsal')}
                                                    listId="list-namaAsal"
                                                    placeholder="Cari Nama"
                                                />
                                            </th>
                                            <th className="sticky left-[230px] z-20 bg-emerald-200 text-left py-1 px-2 font-semibold text-gray-700 shadow-[1px_0_0_0_#10b981] min-w-[100px] align-top">
                                                <div className="mb-1">Tindakan</div>
                                            </th>

                                            {/* Scrollable columns */}
                                            {/* Helper function logic inlined for clarity in replacement */}
                                            {[
                                                { id: 'negeriCawangan', label: 'Negeri/Cawangan', width: 'min-w-[120px]' },
                                                { id: 'lokasi', label: 'Lokasi', width: 'min-w-[120px]' },
                                                { id: 'registeredByName', label: 'Didaftarkan Oleh', width: 'min-w-[150px]' },
                                                { id: 'kategori', label: 'Kategori', width: 'min-w-[110px]' },
                                                { id: 'kategoriElaun', label: 'Kategori Elaun', width: 'min-w-[120px]' },
                                                { id: 'namaPenuh', label: 'Nama Penuh', width: 'min-w-[150px]' },
                                                { id: 'namaIslam', label: 'Nama Islam', width: 'min-w-[120px]' },
                                                { id: 'noKP', label: 'No KP', width: 'min-w-[130px]' },
                                                { id: 'jantina', label: 'Jantina', width: 'min-w-[80px]' },
                                                { id: 'bangsa', label: 'Bangsa', width: 'min-w-[90px]' },
                                                { id: 'agamaAsal', label: 'Agama Asal', width: 'min-w-[100px]' },
                                                { id: 'tarikhLahir', label: 'Tarikh Lahir', width: 'min-w-[100px]' },
                                                { id: 'umur', label: 'Umur', width: 'min-w-[70px]' },
                                                { id: 'warganegara', label: 'Warganegara', width: 'min-w-[100px]' },
                                                { id: 'tarikhPengislaman', label: 'Tarikh Pengislaman', width: 'min-w-[130px]' },
                                                { id: 'masaPengislaman', label: 'Masa', width: 'min-w-[80px]' },
                                                { id: 'tempatPengislaman', label: 'Tempat', width: 'min-w-[150px]' },
                                                { id: 'namaPegawaiMengislamkan', label: 'Pegawai Mengislamkan', width: 'min-w-[150px]' },
                                                { id: 'negeriPengislaman', label: 'Negeri Pengislaman', width: 'min-w-[130px]' },
                                                { id: 'namaSaksi1', label: 'Saksi 1', width: 'min-w-[150px]' },
                                                { id: 'namaSaksi2', label: 'Saksi 2', width: 'min-w-[150px]' },
                                                { id: 'noTelefon', label: 'No Telefon', width: 'min-w-[120px]' },
                                                { id: 'alamatTinggal', label: 'Alamat Tinggal', width: 'min-w-[200px]' },
                                                { id: 'poskod', label: 'Poskod', width: 'min-w-[80px]' },
                                                { id: 'bandar', label: 'Bandar', width: 'min-w-[100px]' },
                                                { id: 'negeri', label: 'Negeri Adres', width: 'min-w-[120px]' },
                                                { id: 'alamatTetap', label: 'Alamat Tetap', width: 'min-w-[200px]' },
                                                { id: 'maklumatKenalanPengiring', label: 'Kenalan/Pengiring', width: 'min-w-[150px]' },
                                                { id: 'pekerjaan', label: 'Pekerjaan', width: 'min-w-[120px]' },
                                                { id: 'pendapatanBulanan', label: 'Pendapatan', width: 'min-w-[100px]' },
                                                { id: 'tanggungan', label: 'Tanggungan', width: 'min-w-[90px]' },
                                                { id: 'tahapPendidikan', label: 'Pendidikan', width: 'min-w-[120px]' },
                                                { id: 'bank', label: 'Bank', width: 'min-w-[120px]' },
                                                { id: 'noAkaun', label: 'No Akaun', width: 'min-w-[130px]' },
                                                { id: 'namaDiBank', label: 'Nama di Bank', width: 'min-w-[140px]' },
                                                { id: 'catatan', label: 'Catatan', width: 'min-w-[200px]' },
                                                { id: 'catatanAudit', label: 'Catatan Audit', width: 'min-w-[200px]' },
                                                { id: 'createdAt', label: 'Dicipta Pada', width: 'min-w-[150px]' },
                                                { id: 'updatedAt', label: 'Dikemaskini Pada', width: 'min-w-[150px]' },
                                                { id: 'createdBy', label: 'Dicipta Oleh', width: 'min-w-[150px]' },
                                                { id: 'updatedBy', label: 'Dikemaskini Oleh', width: 'min-w-[150px]' },
                                            ].map((col) => (
                                                <th key={col.id} className={`text-left py-1 px-2 font-semibold text-gray-700 bg-emerald-100 border-r border-gray-200 ${col.width} align-top`}>
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
                                        {paginatedSubmissions.map((submission, idx) => (
                                            <tr key={submission.id} className="border-b border-gray-200 hover:bg-emerald-50 transition-colors">
                                                {/* Frozen columns with solid white backgrounds */}
                                                <td className="sticky left-0 z-10 bg-emerald-50 py-1 px-2 shadow-[1px_0_0_0_#10b981] min-w-[90px]">
                                                    <span className="font-semibold text-gray-900">{submission.noStaf}</span>
                                                </td>
                                                <td className="sticky left-[90px] z-10 bg-emerald-50 py-1 px-2 shadow-[1px_0_0_0_#10b981] min-w-[140px]">
                                                    <div className="font-medium text-gray-900">{submission.namaAsal}</div>
                                                    <div className="text-[10px] text-gray-500">{submission.noKP}</div>
                                                </td>
                                                <td className="sticky left-[230px] z-10 bg-emerald-50 py-1 px-2 shadow-[1px_0_0_0_#10b981] min-w-[100px]">
                                                    <div className="flex items-center justify-start gap-1">
                                                        <Link href={`/rekod?id=${submission.id}`}>
                                                            <button className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors" title="Lihat">
                                                                <Eye className="h-4 w-4" />
                                                            </button>
                                                        </Link>
                                                        <Link href={`/rekod/edit?id=${submission.id}`}>
                                                            <button className="p-1 text-emerald-600 hover:bg-emerald-100 rounded transition-colors" title="Edit">
                                                                <Edit className="h-4 w-4" />
                                                            </button>
                                                        </Link>
                                                        {role === 'admin' && (
                                                            <button
                                                                onClick={() => handleDelete(submission.id)}
                                                                className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                                                title="Padam"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Scrollable columns */}
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[120px]">{submission.negeriCawangan || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[120px]">{submission.lokasi || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[150px]">{submission.registeredByName || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[110px]">
                                                    <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${submission.kategori === 'Pengislaman' ? 'bg-green-100 text-green-700' :
                                                        submission.kategori === 'Sokongan' ? 'bg-blue-100 text-blue-700' :
                                                            submission.kategori === 'Non-Muslim' ? 'bg-purple-100 text-purple-700' :
                                                                'bg-orange-100 text-orange-700'
                                                        }`}>
                                                        {submission.kategori}
                                                    </span>
                                                </td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[120px]">
                                                    {submission.kategoriElaun ? (
                                                        <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap border ${(() => {
                                                            const c = getAllowanceColorParams(submission.kategoriElaun);
                                                            return `${c.bg} ${c.text} ${c.border}`;
                                                        })()}`}>
                                                            {submission.kategoriElaun}
                                                        </span>
                                                    ) : '-'}
                                                </td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[150px]">{submission.namaPenuh || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[120px]">{submission.namaIslam || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[130px]">{submission.noKP || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[80px]">{submission.jantina || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[90px]">{submission.bangsa || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[100px]">{submission.agamaAsal || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[100px]">{submission.tarikhLahir || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[70px]">{submission.umur || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[100px]">{submission.warganegara || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 whitespace-nowrap min-w-[130px]">{submission.tarikhPengislaman || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[80px]">{submission.masaPengislaman || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[150px]">
                                                    <div className="max-w-[150px] truncate" title={submission.tempatPengislaman}>{submission.tempatPengislaman || '-'}</div>
                                                </td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[150px]">{submission.namaPegawaiMengislamkan || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[130px]">{submission.negeriPengislaman || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[150px]">{submission.namaSaksi1 || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[150px]">{submission.namaSaksi2 || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 whitespace-nowrap min-w-[120px]">{submission.noTelefon || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[200px]">
                                                    <div className="max-w-[200px] truncate" title={submission.alamatTinggal}>{submission.alamatTinggal || '-'}</div>
                                                </td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[80px]">{submission.poskod || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[100px]">{submission.bandar || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[120px]">{submission.negeri || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[200px]">
                                                    <div className="max-w-[200px] truncate" title={submission.alamatTetap}>{submission.alamatTetap || '-'}</div>
                                                </td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[150px]">{submission.maklumatKenalanPengiring || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[120px]">{submission.pekerjaan || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[100px]">{submission.pendapatanBulanan ? `RM ${submission.pendapatanBulanan}` : '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[90px]">{submission.tanggungan || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[120px]">{submission.tahapPendidikan || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[120px]">{submission.bank || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[130px]">{submission.noAkaun || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[140px]">{submission.namaDiBank || '-'}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[200px]">
                                                    <div className="max-w-[200px] truncate" title={submission.catatan}>{submission.catatan || '-'}</div>
                                                </td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[200px]">
                                                    <div className="max-w-[200px] truncate" title={submission.catatanAudit}>{submission.catatanAudit || '-'}</div>
                                                </td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 whitespace-nowrap min-w-[150px]">{formatDate(submission.createdAt)}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 whitespace-nowrap min-w-[150px]">{formatDate(submission.updatedAt)}</td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[150px]">
                                                    <div className="max-w-[150px] truncate text-[9px] text-gray-500" title={submission.createdBy}>{submission.createdBy || '-'}</div>
                                                </td>
                                                <td className="py-1 px-2 bg-white border-r border-gray-200 min-w-[150px]">
                                                    <div className="max-w-[150px] truncate text-[9px] text-gray-500" title={submission.updatedBy}>{submission.updatedBy || '-'}</div>
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
                                        Menunjukkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredSubmissions.length)} daripada {filteredSubmissions.length}
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
            </div>
        </ProtectedRoute>
    );
}
