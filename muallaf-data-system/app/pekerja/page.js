'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { getStates, getLocations, getLookupData } from '@/lib/supabase/database';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Search, Plus, Edit2, Trash2, User, X, MapPin } from 'lucide-react';
import { PETUGAS_KATEGORI_ELAUN, NEGERI_CAWANGAN_OPTIONS, BANK_OPTIONS } from '@/lib/constants';

export default function WorkersPage() {
    const { user, role, profile, loading: authLoading } = useAuth(); // Profile contains assignedLocations
    const router = useRouter();

    // Data State
    const [workers, setWorkers] = useState([]);
    const [locations, setLocations] = useState([]); // Unique locations from classes
    const [states, setStates] = useState([]);
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [selectedLocation, setSelectedLocation] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentWorker, setCurrentWorker] = useState(null);
    const [formData, setFormData] = useState({
        nama: '',
        noKP: '',
        bank: '',
        noAkaun: '',
        peranan: 'Sukarelawan',
        lokasi: '', // New Field
        negeri: '', // New Field: Negeri
        kategoriElaun: '' // Kategori for allowance rates
    });

    // Fetch Locations
    useEffect(() => {
        if (authLoading) return;

        const fetchLocs = async () => {
            const { data } = await getLocations();
            if (data) setLocations(data);
        };
        fetchLocs();
    }, [authLoading]);

    // Fetch workers and states
    useEffect(() => {
        fetchWorkers();
        fetchStates();
        fetchBanks();
    }, []);

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

        if (error) {
            console.error("Error fetching workers:", error);
            // alert("Ralat memuatkan data pekerja: " + error.message);
        } else {
            setWorkers(data || []);
        }
        setLoading(false);
    };

    // Derived: Available Locations for Current User
    const availableLocations = (role === 'admin' || profile?.assignedLocations?.includes('All'))
        ? locations
        : locations.filter(l => profile?.assignedLocations?.includes(l));

    // Handle Form Submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
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
            const { error } = await supabase
                .from('workers')
                .delete()
                .eq('id', id);

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
                lokasi: worker.lokasi || selectedLocation || '',
                negeri: worker.negeri || '',
                kategoriElaun: worker.kategoriElaun || ''
            });
        } else {
            setCurrentWorker(null);
            resetForm();
            // Default location to currently selected filter if valid
            if (selectedLocation && availableLocations.includes(selectedLocation)) {
                setFormData(prev => ({ ...prev, lokasi: selectedLocation }));
            }
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
            lokasi: selectedLocation || '',
            negeri: '',
            kategoriElaun: ''
        });
    };

    // Filter Logic
    const filteredWorkers = workers.filter(worker => {
        const matchesSearch = worker.nama.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLocation = selectedLocation ? worker.lokasi === selectedLocation : true;

        // Strict Access Control: If user is not admin, they can ONLY see workers in their assigned locations
        // However, if they haven't selected a location, show all valid ones?
        // UI enforces selection via dropdown.
        // Also ensure worker.lokasi is in availableLocations
        const isAccessible = role === 'admin' || profile?.assignedLocations?.includes('All') || (worker.lokasi && profile?.assignedLocations?.includes(worker.lokasi));

        return matchesSearch && matchesLocation && isAccessible;
    });

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                <Navbar />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header with Location Filter */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                                <User className="h-6 w-6 mr-2 text-emerald-600" />
                                Pengurusan Petugas
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">Senarai Guru, Petugas, Koordinator, dan Sukarelawan.</p>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Location Dropdown */}
                            <div className="relative">
                                <select
                                    value={selectedLocation}
                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                    className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-emerald-500"
                                >
                                    <option value="">-- Pilih Lokasi --</option>
                                    {availableLocations.map(loc => (
                                        <option key={loc} value={loc}>{loc}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <MapPin className="h-4 w-4" />
                                </div>
                            </div>

                            <button
                                onClick={() => openModal()}
                                disabled={!selectedLocation && availableLocations.length > 0}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={!selectedLocation ? "Sila pilih lokasi dahulu" : "Tambah Pekerja"}
                            >
                                <Plus className="h-5 w-5 mr-1" /> Tambah
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="bg-white p-4 rounded-lg shadow mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Cari nama pekerja..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Workers Grid */}
                    {loading ? (
                        <div className="text-center py-10">Loading...</div>
                    ) : filteredWorkers.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                            {selectedLocation ? "Tiada petugas di lokasi ini." : "Sila pilih lokasi untuk melihat senarai."}
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredWorkers.map((worker) => (
                                <div key={worker.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-5 border-l-4 border-emerald-500">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900">{worker.nama}</h3>
                                            <span className="inline-block bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full mt-1">
                                                {worker.peranan}
                                            </span>
                                            {worker.lokasi && (
                                                <span className="ml-2 inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full mt-1">
                                                    {worker.lokasi}
                                                    {worker.negeri ? `, ${worker.negeri}` : ''}
                                                </span>
                                            )}
                                            {worker.kategoriElaun && (
                                                <span className="ml-2 inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full mt-1">
                                                    {worker.kategoriElaun}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex space-x-2">
                                            <button onClick={() => openModal(worker)} className="text-gray-400 hover:text-emerald-600 p-1">
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(worker.id)} className="text-gray-400 hover:text-red-500 p-1">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex justify-between border-b pb-1">
                                            <span>No. KP:</span>
                                            <span className="font-medium">{worker.noKP || '-'}</span>
                                        </div>
                                        <div className="flex justify-between border-b pb-1">
                                            <span>Bank:</span>
                                            <span className="font-medium">{worker.bank || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>No. Akaun:</span>
                                            <span className="font-medium">{worker.noAkaun || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-lg w-full p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {currentWorker ? 'Kemaskini Pekerja' : 'Tambah Pekerja Baru'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)}><X className="h-6 w-6 text-gray-400" /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nama Penuh</label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        value={formData.nama}
                                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                    />
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
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Lokasi</label>
                                        <select
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                                            value={formData.lokasi}
                                            onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                                        >
                                            <option value="">-- Pilih --</option>
                                            {availableLocations.map(loc => (
                                                <option key={loc} value={loc}>{loc}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Negeri</label>
                                    <select
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        value={formData.negeri}
                                        onChange={(e) => setFormData({ ...formData, negeri: e.target.value })}
                                    >
                                        <option value="">-- Pilih Negeri --</option>
                                        {(states.length > 0 ? states : NEGERI_CAWANGAN_OPTIONS).map(negeri => (
                                            <option key={negeri} value={negeri}>{negeri}</option>
                                        ))}
                                    </select>
                                </div>


                                <div>
                                    <label className="block text-sm font-medium text-gray-700">No. Kad Pengenalan</label>
                                    <input
                                        type="text"
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
                )
                }
            </div >
        </ProtectedRoute >
    );
}
