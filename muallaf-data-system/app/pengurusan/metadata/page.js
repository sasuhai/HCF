'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import {
    getLookupData,
    createLookupItem,
    updateLookupItem,
    deleteLookupItem,
    getStates
} from '@/lib/supabase/database';
import { NEGERI_CAWANGAN_OPTIONS } from '@/lib/constants';
import {
    Settings,
    Plus,
    Edit2,
    Trash2,
    Save,
    X,
    MapPin,
    Globe,
    Layers,
    Tag,
    ChevronRight,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Heart,
    Landmark,
    Users,
    Search,
    Activity,
    ChevronDown
} from 'lucide-react';

const TABS = [
    { id: 'states', name: 'Negeri', icon: Globe, table: 'states' },
    { id: 'locations', name: 'Sub Lokasi', icon: MapPin, table: 'locations' },
    { id: 'class_levels', name: 'Tahap Kelas', icon: Layers, table: 'class_levels' },
    { id: 'class_types', name: 'Jenis Kelas', icon: Tag, table: 'class_types' },
    { id: 'races', name: 'Bangsa', icon: Users, table: 'races' },
    { id: 'religions', name: 'Agama Asal', icon: Heart, table: 'religions' },
    { id: 'banks', name: 'Bank', icon: Landmark, table: 'banks' },
    { id: 'program_status', name: 'Status Program', icon: Activity, table: 'program_status' },
    { id: 'program_categories', name: 'Kategori Program', icon: Layers, table: 'program_categories' },
    { id: 'program_organizers', name: 'Anjuran', icon: Users, table: 'program_organizers' },
    { id: 'program_types', name: 'Jenis Program', icon: Layers, table: 'program_types' },
];

export default function MetadataManagementPage() {
    const { role } = useAuth();
    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [items, setItems] = useState([]);
    const [statesList, setStatesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [isProgramsOpen, setIsProgramsOpen] = useState(true);

    // Modal/Edit state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({ name: '', state_name: '', cawangan: [], groups: '' });
    const [newCawanganValue, setNewCawanganValue] = useState('');

    // Fetch data when tab changes
    useEffect(() => {
        fetchData();
        setSearchTerm(''); // Reset search when switching tabs
    }, [activeTab]);

    useEffect(() => {
        const fetchStates = async () => {
            const { data } = await getStates();
            if (data) setStatesList(data.map(s => s.name));
        };
        fetchStates();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const orderFields = activeTab.id === 'program_types' ? ['groups', 'name'] : ['name'];
        const { data, error } = await getLookupData(activeTab.table, orderFields);
        if (!error) {
            setItems(data);
        }
        setLoading(false);
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                state_name: item.state_name || '',
                cawangan: item.cawangan || [],
                groups: item.groups || ''
            });
        } else {
            setEditingItem(null);
            setFormData({ name: '', state_name: '', cawangan: [], groups: '' });
        }
        setIsModalOpen(true);
        setMessage({ type: '', text: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setActionLoading(true);
        let result;

        let extraData = {};
        if (activeTab.id === 'states') extraData = { cawangan: formData.cawangan };
        if (activeTab.id === 'locations') extraData = { state_name: formData.state_name };
        if (activeTab.id === 'program_types') extraData = { groups: formData.groups };

        if (editingItem) {
            result = await updateLookupItem(activeTab.table, editingItem.id, formData.name, extraData);
        } else {
            result = await createLookupItem(activeTab.table, formData.name, extraData);
        }

        if (!result.error) {
            setMessage({ type: 'success', text: `Berjaya ${editingItem ? 'mengemaskini' : 'menambah'} data.` });
            setTimeout(() => {
                setIsModalOpen(false);
                fetchData();
            }, 1000);
        } else {
            setMessage({ type: 'error', text: result.error });
        }
        setActionLoading(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Adakah anda pasti ingin memadam data ini? Ia mungkin menjejaskan rekod sedia ada.')) return;

        setActionLoading(true);
        const { error } = await deleteLookupItem(activeTab.table, id);
        if (!error) {
            fetchData();
        } else {
            alert('Ralat memadam: ' + error);
        }
        setActionLoading(false);
    };

    if (role !== 'admin') {
        return (
            <ProtectedRoute>
                <Navbar />
                <div className="flex items-center justify-center min-h-[60vh] pt-16">
                    <p className="text-gray-500">Hanya Admin boleh mengakses halaman ini.</p>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 flex flex-col pt-16">
                <Navbar />

                <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                    {/* Header */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                                <Settings className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Tetapan Sistem</h1>
                                <p className="text-gray-500 text-sm">Urus data rujukan (lookups) untuk borang dan pendaftaran</p>
                            </div>
                        </div>

                        <button
                            onClick={() => handleOpenModal()}
                            className="btn-primary flex items-center space-x-2 px-6 py-2.5 shadow-sm hover:shadow-md transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Tambah {activeTab.name}</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {/* Sidebar Navigation */}
                        <div className="lg:col-span-1 space-y-2">
                            {TABS.filter(t => !['program_status', 'program_categories', 'program_organizers', 'program_types'].includes(t.id)).map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab.id === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setActiveTab(tab);
                                            // Optional: close programs when switching to other tabs?
                                            // No, keep it open if user wants.
                                        }}
                                        className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${isActive
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                                            : 'bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 border border-gray-100'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <Icon className="w-5 h-5" />
                                            <span className="font-medium">{tab.name}</span>
                                        </div>
                                        <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                                    </button>
                                );
                            })}

                            <div className="pt-4 pb-2">
                                <div className="h-px bg-gray-200 w-full mb-4"></div>
                                <button
                                    onClick={() => setIsProgramsOpen(!isProgramsOpen)}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${['program_status', 'program_categories', 'program_organizers', 'program_types'].includes(activeTab.id)
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 border-gray-100'
                                        } border`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <Activity className="w-5 h-5" />
                                        <span className="font-bold">Programs</span>
                                    </div>
                                    {isProgramsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </button>

                                {isProgramsOpen && (
                                    <div className="ml-4 pl-4 border-l-2 border-emerald-100 space-y-1 mt-2">
                                        {TABS.filter(t => ['program_status', 'program_categories', 'program_organizers', 'program_types'].includes(t.id)).map((tab) => {
                                            const Icon = tab.icon;
                                            const isActive = activeTab.id === tab.id;
                                            return (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setActiveTab(tab)}
                                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${isActive
                                                        ? 'bg-emerald-600 text-white shadow-md'
                                                        : 'bg-white text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'
                                                        }`}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <Icon className="w-4 h-4" />
                                                        <span className="text-sm font-medium">{tab.name}</span>
                                                    </div>
                                                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="lg:col-span-3">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-50/30">
                                    <div className="flex flex-col">
                                        <h2 className="text-lg font-semibold text-gray-900">Senarai {activeTab.name}</h2>
                                        <span className="text-xs text-gray-500">{items.length} rekod dijumpai</span>
                                    </div>
                                    <div className="relative flex-1 max-w-xs">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder={`Cari ${activeTab.name.toLowerCase()}...`}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
                                        />
                                        {searchTerm && (
                                            <button
                                                onClick={() => setSearchTerm('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="p-0">
                                    {loading ? (
                                        <div className="p-20 flex flex-col items-center justify-center text-gray-400">
                                            <Loader2 className="w-10 h-10 animate-spin mb-4 text-emerald-500" />
                                            <p>Memuatkan data...</p>
                                        </div>
                                    ) : items.length === 0 ? (
                                        <div className="p-20 flex flex-col items-center justify-center text-gray-400 text-center">
                                            <div className="p-4 bg-gray-50 rounded-full mb-4">
                                                <activeTab.icon className="w-10 h-10" />
                                            </div>
                                            <p className="max-w-xs">Tiada rekod {activeTab.name} disimpan lagi. Gunakan butang di atas untuk menambah.</p>
                                        </div>
                                    ) : (
                                        (() => {
                                            const filteredItems = items.filter(item =>
                                                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                (item.state_name && item.state_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                                (item.groups && item.groups.toLowerCase().includes(searchTerm.toLowerCase()))
                                            );

                                            if (activeTab.id === 'program_types') {
                                                const groupNames = [...new Set(filteredItems.map(i => i.groups || 'Tanpa Kumpulan'))].sort((a, b) => {
                                                    if (a === 'Tanpa Kumpulan') return 1;
                                                    if (b === 'Tanpa Kumpulan') return -1;
                                                    return a.localeCompare(b);
                                                });
                                                return groupNames.map(group => (
                                                    <div key={group}>
                                                        <div className="bg-gray-50/50 px-4 py-1.5 border-y border-gray-100 flex items-center justify-between">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{group}</span>
                                                            <span className="text-[10px] font-medium text-slate-400">{filteredItems.filter(i => (i.groups || 'Tanpa Kumpulan') === group).length} Items</span>
                                                        </div>
                                                        <div className="divide-y divide-gray-100">
                                                            {filteredItems
                                                                .filter(i => (i.groups || 'Tanpa Kumpulan') === group)
                                                                .sort((a, b) => a.name.localeCompare(b.name))
                                                                .map(item => (
                                                                    <div key={item.id} className="p-4 py-2 hover:bg-emerald-50/50 transition-all flex items-center justify-between group">
                                                                        <div className="flex items-center space-x-4 min-w-0">
                                                                            <div className="flex-shrink-0 w-8 h-8 bg-gray-50 rounded-md flex items-center justify-center text-gray-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                                                                                <activeTab.icon className="w-4 h-4" />
                                                                            </div>
                                                                            <div className="min-w-0">
                                                                                <p className="font-medium text-gray-900 text-sm break-words">{item.name}</p>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center space-x-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity ml-4 flex-shrink-0">
                                                                            <button
                                                                                onClick={() => handleOpenModal(item)}
                                                                                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all"
                                                                                title="Edit"
                                                                            >
                                                                                <Edit2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDelete(item.id)}
                                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                                                                                title="Padam"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    </div>
                                                ));
                                            }

                                            return (
                                                <div className="divide-y divide-gray-100">
                                                    {filteredItems
                                                        .sort((a, b) => a.name.localeCompare(b.name))
                                                        .map((item) => (
                                                            <div key={item.id} className="p-4 py-2 hover:bg-emerald-50/50 transition-all flex items-center justify-between group">
                                                                <div className="flex items-center space-x-4 min-w-0">
                                                                    <div className="flex-shrink-0 w-8 h-8 bg-gray-50 rounded-md flex items-center justify-center text-gray-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                                                                        <activeTab.icon className="w-4 h-4" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="font-medium text-gray-900 text-sm break-words">{item.name}</p>
                                                                        {(item.state_name || item.groups) && (
                                                                            <p className="text-[10px] text-gray-500">{item.state_name || item.groups}</p>
                                                                        )}
                                                                        {activeTab.id === 'states' && item.cawangan && item.cawangan.length > 0 && (
                                                                            <div className="flex flex-wrap gap-1 mt-1 max-w-md">
                                                                                {item.cawangan.map((cw, i) => (
                                                                                    <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[9px] font-medium rounded border border-gray-200 uppercase tracking-tighter">
                                                                                        {cw}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center space-x-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity ml-4 flex-shrink-0">
                                                                    <button
                                                                        onClick={() => handleOpenModal(item)}
                                                                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all"
                                                                        title="Edit"
                                                                    >
                                                                        <Edit2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDelete(item.id)}
                                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                                                                        title="Padam"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            );
                                        })()
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Modal */}
                {
                    isModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                                <div className="p-6 bg-emerald-600 text-white flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <activeTab.icon className="w-5 h-5" />
                                        <h3 className="text-xl font-bold">{editingItem ? 'Edit' : 'Tambah'} {activeTab.name}</h3>
                                    </div>
                                    <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                    {message.text && (
                                        <div className={`p-4 rounded-xl flex items-center space-x-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                            }`}>
                                            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                            <p className="text-sm font-medium">{message.text}</p>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Nama {activeTab.name}
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder={`Masukkan nama ${activeTab.name.toLowerCase()}`}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                        />
                                    </div>

                                    {activeTab.id === 'states' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Cawangan (Lokasi)
                                            </label>
                                            <div className="flex space-x-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={newCawanganValue}
                                                    onChange={(e) => setNewCawanganValue(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            if (newCawanganValue.trim()) {
                                                                setFormData({ ...formData, cawangan: [...formData.cawangan, newCawanganValue.trim()] });
                                                                setNewCawanganValue('');
                                                            }
                                                        }
                                                    }}
                                                    placeholder="Tambah cawangan baru..."
                                                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (newCawanganValue.trim()) {
                                                            setFormData({ ...formData, cawangan: [...formData.cawangan, newCawanganValue.trim()] });
                                                            setNewCawanganValue('');
                                                        }
                                                    }}
                                                    className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-200 hover:bg-emerald-200 transition-colors font-bold"
                                                >
                                                    Tambah
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {formData.cawangan.length === 0 && <span className="text-sm text-gray-400">Tiada cawangan lagi</span>}
                                                {formData.cawangan.map((cw, i) => (
                                                    <div key={i} className="flex items-center space-x-1 bg-gray-100 text-gray-700 font-medium px-3 py-1.5 rounded-lg border border-gray-200">
                                                        <span>{cw}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, cawangan: formData.cawangan.filter((_, idx) => idx !== i) })}
                                                            className="text-gray-400 hover:text-red-500 p-0.5 rounded-md"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab.id === 'program_types' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Kumpulan (Group)
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                list="group-options"
                                                value={formData.groups}
                                                onChange={(e) => setFormData({ ...formData, groups: e.target.value })}
                                                placeholder="Contoh: Outreach, Latihan Daie..."
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                            />
                                            <datalist id="group-options">
                                                {['Outreach', 'Pembangunan Mualaf', 'Latihan Daie', 'Sukarelawan', 'Program Kesedaran', 'UMUM'].map(g => (
                                                    <option key={g} value={g} />
                                                ))}
                                            </datalist>
                                        </div>
                                    )}

                                    {activeTab.id === 'locations' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Negeri
                                            </label>
                                            <select
                                                value={formData.state_name}
                                                onChange={(e) => setFormData({ ...formData, state_name: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all cursor-pointer"
                                            >
                                                <option value="">-- Pilih Negeri --</option>
                                                {(statesList.length > 0 ? statesList : NEGERI_CAWANGAN_OPTIONS).map(state => (
                                                    <option key={state} value={state}>{state}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="pt-4 flex flex-col gap-3">
                                        <button
                                            type="submit"
                                            disabled={actionLoading}
                                            className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 shadow-lg shadow-emerald-100 flex items-center justify-center space-x-2 transition-all"
                                        >
                                            {actionLoading ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Save className="w-5 h-5" />
                                            )}
                                            <span>{editingItem ? 'Kemaskini' : 'Simpan'} Maklumat</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="w-full bg-gray-100 text-gray-700 font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-all"
                                        >
                                            Batal
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )
                }
            </div >
        </ProtectedRoute >
    );
}
