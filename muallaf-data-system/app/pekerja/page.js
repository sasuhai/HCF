'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo, useDeferredValue } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { supabase } from '@/lib/supabase/client';
import { getStates, getLocationsTable, getLookupData, fetchAll } from '@/lib/supabase/database';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Search, Plus, Edit2, Trash2, User, X, MapPin, Download, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, RefreshCw, Loader2, ChevronDown } from 'lucide-react';
import { PETUGAS_KATEGORI_ELAUN, NEGERI_CAWANGAN_OPTIONS, BANK_OPTIONS } from '@/lib/constants';

// Role Color helper
const getRoleColorParams = (role) => {
    if (role === 'Guru') return { bg: 'bg-indigo-100', text: 'text-indigo-700' };
    if (role === 'Petugas') return { bg: 'bg-blue-100', text: 'text-blue-700' };
    if (role === 'Koordinator') return { bg: 'bg-purple-100', text: 'text-purple-700' };
    if (role === 'Sukarelawan') return { bg: 'bg-emerald-100', text: 'text-emerald-700' };
    return { bg: 'bg-gray-100', text: 'text-gray-700' };
};

// Allowance Color helper
const getAllowanceColorParams = (type) => {
    if (!type || type === 'Tiada Elaun') return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' };
    const colors = [
        { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
        { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
        { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
        { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
        { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
    ];
    let hash = 0;
    for (let i = 0; i < type.length; i++) hash = type.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

// Optimized Row Component
const WorkerRow = React.memo(({ worker, openModal, handleDelete }) => {
    const roleColor = getRoleColorParams(worker.peranan);
    const allowColor = getAllowanceColorParams(worker.kategoriElaun);

    return (
        <tr className="border-b border-gray-100 hover:bg-emerald-50/50 transition-colors group" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 40px' }}>
            <td className="sticky left-0 z-10 bg-emerald-50/80 py-1.5 px-2 shadow-[1px_0_0_0_#10b981] min-w-[100px] font-bold text-emerald-800">
                {worker.staff_id || '-'}
            </td>
            <td className="sticky left-[100px] z-10 bg-emerald-50/80 py-1.5 px-2 shadow-[1px_0_0_0_#10b981] min-w-[180px]">
                <div className="font-semibold text-gray-900 leading-tight">{worker.nama}</div>
                <div className="text-[9px] text-gray-500 font-medium uppercase mt-0.5">{worker.pekerjaan || 'Tiada Pekerjaan'}</div>
            </td>
            <td className="sticky left-[280px] z-10 bg-emerald-50/80 py-1.5 px-2 shadow-[1px_0_0_0_#10b981] min-w-[80px]">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(worker)} className="p-1 text-emerald-600 hover:bg-emerald-100 rounded transition-colors" title="Edit">
                        <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(worker.id)} className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors" title="Padam">
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </td>

            <td className="py-1.5 px-2 bg-white border-r border-gray-100">
                <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tight text shadow-sm ${roleColor.bg} ${roleColor.text}`}>
                    {worker.peranan}
                </span>
            </td>
            <td className="py-1.5 px-2 bg-white border-r border-gray-100 font-medium text-gray-600">{worker.negeri || '-'}</td>
            <td className="py-1.5 px-2 bg-white border-r border-gray-100 font-medium text-gray-600">{worker.lokasi || '-'}</td>
            <td className="py-1.5 px-2 bg-white border-r border-gray-100">
                {worker.kategoriElaun ? (
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tight border ${allowColor.bg} ${allowColor.text} ${allowColor.border}`}>
                        {worker.kategoriElaun}
                    </span>
                ) : '-'}
            </td>
            <td className="py-1.5 px-2 bg-white border-r border-gray-100 font-mono text-gray-500">{worker.noKP || '-'}</td>
            <td className="py-1.5 px-2 bg-white border-r border-gray-100">{worker.jantina || '-'}</td>
            <td className="py-1.5 px-2 bg-white border-r border-gray-100 font-medium">{worker.tel_bimbit || '-'}</td>
            <td className="py-1.5 px-2 bg-white border-r border-gray-100">{worker.bank || '-'}</td>
            <td className="py-1.5 px-2 bg-white border-r border-gray-100 font-mono text-gray-500">{worker.noAkaun || '-'}</td>
            <td className="py-1.5 px-2 bg-white border-r border-gray-100">{worker.tarikh_lahir || '-'}</td>
            <td className="py-1.5 px-2 bg-white border-r border-gray-100">{worker.pekerjaan || '-'}</td>
            <td className="py-1.5 px-2 bg-white border-r border-gray-100 whitespace-normal">
                <div className="max-w-[400px] text-[10px] text-gray-500 italic line-clamp-2" title={worker.kepakaran}>
                    {worker.kepakaran || '-'}
                </div>
            </td>
        </tr>
    );
});

// Helper component for filter inputs
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

export default function WorkersPage() {
    const { user, role, profile, loading: authLoading } = useAuth();
    const { showAlert, showSuccess, showError, showConfirm } = useModal();
    const router = useRouter();

    // Data State
    const [workers, setWorkers] = useState([]);
    const [locations, setLocations] = useState([]);
    const [states, setStates] = useState([]);
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter & Sort State
    const [columnFilters, setColumnFilters] = useState({});
    const [sortConfig, setSortConfig] = useState({ key: 'nama', direction: 'asc' });

    // Deferred Filters for Performance
    const deferredFilters = useDeferredValue(columnFilters);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentWorker, setCurrentWorker] = useState(null);
    const [formData, setFormData] = useState({
        nama: '', noKP: '', bank: '', noAkaun: '', peranan: 'Sukarelawan', lokasi: '', negeri: '',
        kategoriElaun: '', staff_id: '', jantina: '', tarikh_daftar: '', daerah_kediaman: '',
        negeri_kediaman: '', tel_bimbit: '', email: '', pekerjaan: '', kepakaran: '', tarikh_lahir: ''
    });

    // Fetch Reference Data
    useEffect(() => {
        if (!authLoading) {
            initData();
        }
    }, [authLoading]);

    const initData = async () => {
        setLoading(true);
        await Promise.all([
            fetchLocations(),
            fetchStates(),
            fetchBanks(),
            fetchWorkers()
        ]);
        setLoading(false);
    };

    const fetchLocations = async () => {
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
        let query = supabase.from('workers').select('*').order('nama');
        const { data, error } = await fetchAll(query);

        if (!error && data) {
            if (role !== 'admin' && profile?.assignedLocations && !profile.assignedLocations.includes('All')) {
                setWorkers(data.filter(w => profile.assignedLocations.includes(w.lokasi)));
            } else {
                setWorkers(data);
            }
        }
    };

    // Permitted Locations
    const permittedLocations = useMemo(() => {
        return (role === 'admin' || profile?.assignedLocations?.includes('All'))
            ? locations
            : locations.filter(l => profile?.assignedLocations?.includes(l.name));
    }, [role, profile, locations]);

    const modalLocations = useMemo(() => {
        return formData.negeri
            ? permittedLocations.filter(l => l.state_name === formData.negeri)
            : permittedLocations;
    }, [formData.negeri, permittedLocations]);

    // Handle Form Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!formData.nama || !formData.noKP || !formData.negeri || !formData.lokasi) {
                showError('Maklumat Tidak Lengkap', "Sila isi semua maklumat mandatori.");
                return;
            }

            const payload = { ...formData, updatedAt: new Date().toISOString(), updatedBy: user.id };
            if (currentWorker) {
                await supabase.from('workers').update(payload).eq('id', currentWorker.id);
            } else {
                await supabase.from('workers').insert({ ...payload, createdAt: new Date().toISOString(), createdBy: user.id });
            }
            setIsModalOpen(false);
            resetForm();
            fetchWorkers();
            showSuccess('Berjaya', 'Data petugas telah disimpan.');
        } catch (error) {
            console.error(error);
            showError('Ralat Simpan', "Ralat menyimpan data.");
        }
    };

    const handleDelete = useCallback(async (id) => {
        showConfirm('Sahkan Padam', 'Padam pekerja ini?', async () => {
            await supabase.from('workers').delete().eq('id', id);
            fetchWorkers();
            showSuccess('Berjaya', 'Petugas telah dipadam.');
        });
    }, [fetchWorkers, showConfirm, showSuccess]);

    const openModal = useCallback((worker = null) => {
        if (worker) {
            setCurrentWorker(worker);
            setFormData({
                nama: worker.nama || '', noKP: worker.noKP || '', bank: worker.bank || '',
                noAkaun: worker.noAkaun || '', peranan: worker.peranan || 'Sukarelawan',
                lokasi: worker.lokasi || '', negeri: worker.negeri || '', kategoriElaun: worker.kategoriElaun || '',
                staff_id: worker.staff_id || '', jantina: worker.jantina || '', tarikh_daftar: worker.tarikh_daftar || '',
                daerah_kediaman: worker.daerah_kediaman || '', negeri_kediaman: worker.negeri_kediaman || '',
                tel_bimbit: worker.tel_bimbit || '', email: worker.email || '', pekerjaan: worker.pekerjaan || '',
                kepakaran: worker.kepakaran || '', tarikh_lahir: worker.tarikh_lahir || ''
            });
        } else {
            setCurrentWorker(null);
            resetForm();
        }
        setIsModalOpen(true);
    }, []);

    const resetForm = () => {
        setFormData({
            nama: '', noKP: '', bank: '', noAkaun: '', peranan: 'Sukarelawan', lokasi: '', negeri: '',
            kategoriElaun: '', staff_id: '', jantina: '', tarikh_daftar: '', daerah_kediaman: '',
            negeri_kediaman: '', tel_bimbit: '', email: '', pekerjaan: '', kepakaran: '', tarikh_lahir: ''
        });
    };

    // Logic
    const getUniqueValues = (field) => {
        const relevant = workers.filter(w => {
            return Object.entries(columnFilters).every(([key, value]) => {
                if (key === field || !value) return true;
                const cleanValue = value.replace(/\s\(\d+\)$/, '');
                if (cleanValue === '(Kosong)') return !w[key];
                return w[key]?.toString().toLowerCase().includes(cleanValue.toLowerCase());
            });
        });

        const counts = {};
        let blankCount = 0;

        relevant.forEach(w => {
            const val = w[field];
            if (!val) {
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
            const next = { ...prev };
            if (!value) delete next[field];
            else next[field] = value;
            return next;
        });
    };

    const handleSort = (key) => {
        setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
    };

    const filteredWorkers = useMemo(() => {
        return workers.filter(worker => {
            return Object.entries(deferredFilters).every(([field, value]) => {
                if (!value) return true;
                const cleanValue = value.replace(/\s\(\d+\)$/, '');
                if (cleanValue === '(Kosong)') return !worker[field];
                return worker[field]?.toString().toLowerCase().includes(cleanValue.toLowerCase());
            });
        }).sort((a, b) => {
            if (!sortConfig.key) return 0;
            let aVal = (a[sortConfig.key] || '').toString().toLowerCase();
            let bVal = (b[sortConfig.key] || '').toString().toLowerCase();
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [workers, deferredFilters, sortConfig]);

    const exportToCSV = () => {
        const headers = ['Nama', 'Peranan', 'No KP', 'Lokasi', 'Negeri', 'Kategori Elaun', 'Bank', 'No Akaun', 'S-ID', 'Jantina', 'Tarikh Daftar', 'Tel Bimbit', 'Email', 'Pekerjaan', 'Kepakaran', 'Tarikh Lahir'];
        const csv = [headers.join(','), ...filteredWorkers.map(w => [w.nama, w.peranan, w.noKP, w.lokasi, w.negeri, w.kategoriElaun, w.bank, w.noAkaun, w.staff_id, w.jantina, w.tarikh_daftar, w.tel_bimbit, w.email, w.pekerjaan, w.kepakaran, w.tarikh_lahir].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'pekerja.csv'; a.click();
    };

    // Stats
    const stats = useMemo(() => {
        const roles = {};
        const allow = {};
        const negeriRaw = {};

        filteredWorkers.forEach(w => {
            roles[w.peranan || 'Tiada'] = (roles[w.peranan || 'Tiada'] || 0) + 1;
            allow[w.kategoriElaun || 'Tiada'] = (allow[w.kategoriElaun || 'Tiada'] || 0) + 1;

            const n = w.negeri || 'Tiada Negeri';
            negeriRaw[n] = (negeriRaw[n] || 0) + 1;
        });

        // Process Negeri to Top 5 + Others
        const sortedNegeri = Object.entries(negeriRaw)
            .sort((a, b) => b[1] - a[1]);

        const top5 = sortedNegeri.slice(0, 5);
        const othersCount = sortedNegeri.slice(5).reduce((acc, curr) => acc + curr[1], 0);

        const negeriFinal = top5.map(([name, count]) => ({ name, count }));
        if (othersCount > 0) {
            negeriFinal.push({ name: 'Lain-lain', count: othersCount });
        }

        return { roles, allow, negeri: negeriFinal };
    }, [filteredWorkers]);

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 pt-16">
                <Navbar />
                <div className="w-full mx-auto px-2 sm:px-4 py-2">
                    <div className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                            <h1 className="text-xl font-bold text-gray-900 flex items-center">
                                <User className="h-5 w-5 mr-2 text-emerald-600" /> Pengurusan Petugas
                            </h1>
                            <div className="flex items-center space-x-2">
                                <button onClick={initData} className="p-1.5 bg-white text-gray-600 rounded-lg border border-gray-200 shadow-sm transition-transform active:scale-90"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
                                <button onClick={() => openModal()} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm flex items-center transform active:scale-95"><Plus className="h-4 w-4 mr-1" /> Tambah</button>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-2 mb-2">
                            <div className="bg-white p-2 rounded-xl shadow-sm border border-emerald-100 flex-1">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Peranan <span className="text-emerald-600">({filteredWorkers.length})</span></h3>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(stats.roles).map(([r, c]) => (
                                        <div key={r} className="flex items-center bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                                            <span className="text-xs font-medium text-gray-600 mr-2">{r}</span>
                                            <span className={`${getRoleColorParams(r).bg} ${getRoleColorParams(r).text} text-xs font-bold px-1.5 py-0.5 rounded-md`}>{c}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white p-2 rounded-xl shadow-sm border border-blue-100 flex-1">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Elaun</h3>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(stats.allow).map(([cat, c]) => (
                                        <div key={cat} className="flex items-center bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                                            <span className="text-xs font-medium text-gray-600 mr-2">{cat}</span>
                                            <span className={`${getAllowanceColorParams(cat).bg} ${getAllowanceColorParams(cat).text} text-xs font-bold px-1.5 py-0.5 rounded-md`}>{c}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white p-2 rounded-xl shadow-sm border border-purple-100 flex-1">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Taburan Negeri (Top 5)</h3>
                                <div className="flex flex-wrap gap-2">
                                    {stats.negeri.map((n) => (
                                        <div key={n.name} className="flex items-center bg-gray-50 border border-gray-100 rounded-lg px-2 py-1">
                                            <span className="text-xs font-medium text-gray-600 mr-2">{n.name}</span>
                                            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-1.5 py-0.5 rounded-md">{n.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center px-1">
                            <p className="text-gray-600 text-[10px] uppercase font-bold">{filteredWorkers.length} REKOD</p>
                            <div className="flex items-center space-x-2">
                                {Object.keys(columnFilters).length > 0 && <button onClick={() => setColumnFilters({})} className="text-red-600 text-[10px] font-bold uppercase hover:underline">Padam Filter</button>}
                                <button onClick={exportToCSV} className="flex items-center space-x-1 bg-white border border-gray-300 px-2 py-1 rounded text-[10px] font-bold uppercase shadow-sm"><Download className="h-3 w-3" /><span>Export</span></button>
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-lg shadow-sm bg-white overflow-auto max-h-[calc(100vh-210px)] relative">
                        {loading && (
                            <div className="absolute inset-0 bg-white/80 z-[60] flex items-center justify-center backdrop-blur-[2px]">
                                <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
                            </div>
                        )}
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-emerald-100">
                                    <th className="sticky left-0 top-0 z-50 bg-emerald-200 text-left py-1 px-2 font-semibold text-gray-700 border-b-2 border-emerald-500 shadow-[1px_0_0_0_#10b981] min-w-[100px] align-top">
                                        <div className="flex items-center cursor-pointer mb-1 group" onClick={() => handleSort('staff_id')}><span>S-ID</span>{sortConfig.key === 'staff_id' ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />) : <ArrowUpDown className="h-3 w-3 ml-1 opacity-20" />}</div>
                                        <FilterInput value={columnFilters['staff_id']} onChange={(v) => handleFilterChange('staff_id', v)} options={getUniqueValues('staff_id')} listId="l-sid" />
                                    </th>
                                    <th className="sticky left-[100px] top-0 z-40 bg-emerald-200 text-left py-1 px-2 font-semibold text-gray-700 border-b-2 border-emerald-500 shadow-[1px_0_0_0_#10b981] min-w-[180px] align-top">
                                        <div className="flex items-center cursor-pointer mb-1 group" onClick={() => handleSort('nama')}><span>Nama</span>{sortConfig.key === 'nama' ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />) : <ArrowUpDown className="h-3 w-3 ml-1 opacity-20" />}</div>
                                        <FilterInput value={columnFilters['nama']} onChange={(v) => handleFilterChange('nama', v)} options={getUniqueValues('nama')} listId="l-nama" />
                                    </th>
                                    <th className="sticky left-[280px] top-0 z-40 bg-emerald-200 text-left py-2 px-2 font-semibold text-gray-700 border-b-2 border-emerald-500 shadow-[1px_0_0_0_#10b981] min-w-[80px]">Tindakan</th>
                                    {[
                                        { id: 'peranan', label: 'Peranan', w: 'min-w-[120px]' },
                                        { id: 'negeri', label: 'Negeri', w: 'min-w-[130px]' },
                                        { id: 'lokasi', label: 'Lokasi', w: 'min-w-[130px]' },
                                        { id: 'kategoriElaun', label: 'Kat. Elaun', w: 'min-w-[130px]' },
                                        { id: 'noKP', label: 'No KP', w: 'min-w-[130px]' },
                                        { id: 'jantina', label: 'Jantina', w: 'min-w-[90px]' },
                                        { id: 'tel_bimbit', label: 'No Tel', w: 'min-w-[120px]' },
                                        { id: 'bank', label: 'Bank', w: 'min-w-[120px]' },
                                        { id: 'noAkaun', label: 'No Akaun', w: 'min-w-[150px]' },
                                        { id: 'tarikh_lahir', label: 'T. Lahir', w: 'min-w-[110px]' },
                                        { id: 'pekerjaan', label: 'Pekerjaan', w: 'min-w-[150px]' },
                                        { id: 'kepakaran', label: 'Kepakaran/Pengalaman', w: 'min-w-[400px]' },
                                    ].map(col => (
                                        <th key={col.id} className={`sticky top-0 z-30 text-left py-1 px-2 font-semibold text-gray-700 bg-emerald-100 border-r border-gray-200 border-b-2 border-emerald-500 ${col.w} align-top`}>
                                            <div className="flex items-center cursor-pointer mb-1 group" onClick={() => handleSort(col.id)}><span>{col.label}</span>{sortConfig.key === col.id ? (sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />) : <ArrowUpDown className="h-3 w-3 ml-1 opacity-20" />}</div>
                                            <FilterInput value={columnFilters[col.id]} onChange={(v) => handleFilterChange(col.id, v)} options={getUniqueValues(col.id)} listId={`l-${col.id}`} />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredWorkers.map((worker) => (
                                    <WorkerRow
                                        key={worker.id}
                                        worker={worker}
                                        openModal={openModal}
                                        handleDelete={handleDelete}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal remains largely the same but with premium style */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600"><User className="h-6 w-6" /></div>
                                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{currentWorker ? 'Kemaskini Petugas' : 'Tambah Petugas Baru'}</h3>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="h-6 w-6 text-gray-400" /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nama Penuh <span className="text-red-500">*</span></label>
                                        <input type="text" required className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-emerald-500 font-medium" value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Negeri <span className="text-red-500">*</span></label>
                                        <select className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-emerald-500 font-medium" required value={formData.negeri} onChange={(e) => setFormData({ ...formData, negeri: e.target.value, lokasi: '' })}>
                                            <option value="">-- Pilih --</option>
                                            {(states.length > 0 ? states : NEGERI_CAWANGAN_OPTIONS).map(negeri => <option key={negeri} value={negeri}>{negeri}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Lokasi <span className="text-red-500">*</span></label>
                                        <select required className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-emerald-500 font-medium disabled:opacity-50" value={formData.lokasi} onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })} disabled={!formData.negeri}>
                                            <option value="">-- Pilih --</option>
                                            {modalLocations.map(loc => <option key={loc.id || loc.name} value={loc.name}>{loc.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Peranan</label>
                                        <select className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-emerald-500 font-medium" value={formData.peranan} onChange={(e) => setFormData({ ...formData, peranan: e.target.value })}>
                                            <option value="Sukarelawan">Sukarelawan</option>
                                            <option value="Guru">Guru</option>
                                            <option value="Petugas">Petugas</option>
                                            <option value="Koordinator">Koordinator</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">No. KP <span className="text-red-500">*</span></label>
                                        <input type="text" required className="w-full px-4 py-3 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-emerald-500 font-medium" value={formData.noKP} onChange={(e) => setFormData({ ...formData, noKP: e.target.value })} />
                                    </div>
                                </div>
                                <div className="pt-8 flex justify-end gap-4 border-t border-gray-100">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-sm font-bold text-gray-400 uppercase tracking-widest">Batal</button>
                                    <button type="submit" className="px-8 py-3 bg-emerald-600 text-white rounded-2xl text-sm font-bold uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-200 transform active:scale-95">Simpan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
