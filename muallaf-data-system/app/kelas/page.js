'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { getStates, getClassLevels, getClassTypes, getLocationsTable } from '@/lib/supabase/database';
import { NEGERI_CAWANGAN_OPTIONS } from '@/lib/constants';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Search, Plus, Edit2, Trash2, MapPin, X, CheckCircle } from 'lucide-react';

export default function ClassesPage() {
    const { user, role, profile, loading: authLoading } = useAuth();
    const router = useRouter();

    const [classes, setClasses] = useState([]);
    const [locations, setLocations] = useState([]);
    const [states, setStates] = useState([]);
    const [levels, setLevels] = useState([]);
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [selectedLocation, setSelectedLocation] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

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

    const fetchStates = async () => {
        const { data } = await getStates();
        if (data) setStates(data.map(s => s.name));
    };

    const fetchClasses = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('classes')
            .select('*')
            .order('nama');

        if (error) {
            console.error("Error fetching classes:", error);
        } else {
            setClasses(data || []);
        }
        setLoading(false);
    };

    const availableLocations = (role === 'admin' || profile?.assignedLocations?.includes('All'))
        ? locations
        : locations.filter(l => profile?.assignedLocations?.includes(l.name));

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
        } catch (error) {
            console.error("Error saving class:", error);
            alert("Ralat menyimpan kelas.");
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Adakah anda pasti mahu memadam kelas ini?")) {
            const { error } = await supabase
                .from('classes')
                .delete()
                .eq('id', id);

            if (error) {
                alert("Ralat memadam kelas: " + error.message);
            } else {
                fetchClasses();
            }
        }
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
            // Default location to currently selected filter if valid (and if user has permission to add there? 
            // If creating a NEW location, input allows custom text)
            if (selectedLocation && availableLocations.some(l => l.name === selectedLocation)) {
                setFormData(prev => ({ ...prev, lokasi: selectedLocation }));
            }
        }
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            nama: '',
            negeri: '',
            lokasi: selectedLocation || '',
            jenis: 'Fizikal',
            tahap: 'Asas'
        });
    };

    // Filter Logic
    const filteredClasses = classes.filter(cls => {
        const matchesSearch = cls.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cls.lokasi.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLocation = selectedLocation ? cls.lokasi === selectedLocation : true;

        const isAccessible = role === 'admin' || profile?.assignedLocations?.includes('All') || (profile?.assignedLocations?.includes(cls.lokasi));

        return matchesSearch && matchesLocation && isAccessible;
    });

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                <Navbar />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                                <MapPin className="h-6 w-6 mr-2 text-blue-600" />
                                Pengurusan Kelas & Lokasi
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">Senarai lokasi dan kelas pengajian.</p>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Location Dropdown */}
                            <div className="relative">
                                <select
                                    value={selectedLocation}
                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                    className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
                                >
                                    <option value="">-- Semua Lokasi --</option>
                                    {availableLocations.map(loc => (
                                        <option key={loc.id || loc.name} value={loc.name}>{loc.name}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <MapPin className="h-4 w-4" />
                                </div>
                            </div>

                            <button
                                onClick={() => openModal()}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 shadow-sm transition-colors"
                            >
                                <Plus className="h-5 w-5 mr-1" /> Tambah
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Cari nama kelas atau lokasi..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-10">Loading...</div>
                    ) : filteredClasses.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                            Tiada kelas dijumpai.
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredClasses.map((cls) => (
                                <div key={cls.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-5 border-l-4 border-blue-500">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900">{cls.nama}</h3>
                                            <div className="flex items-center text-gray-500 text-sm mt-1">
                                                <MapPin className="h-3 w-3 mr-1" />
                                                {cls.lokasi}{cls.negeri ? `, ${cls.negeri}` : ''}
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button onClick={() => openModal(cls)} className="text-gray-400 hover:text-blue-600 p-1">
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(cls.id)} className="text-gray-400 hover:text-red-500 p-1">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm mt-4 pt-4 border-t">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${cls.jenis === 'Online' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                            {cls.jenis}
                                        </span>
                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                            {cls.tahap}
                                        </span>
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
                                    {currentClass ? 'Kemaskini Kelas' : 'Tambah Kelas Baru'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)}><X className="h-6 w-6 text-gray-400" /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nama Kelas / Kumpulan</label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.nama}
                                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                                        placeholder="cth: Kelas BTR 1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Negeri</label>
                                    <select
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.negeri}
                                        onChange={(e) => setFormData({ ...formData, negeri: e.target.value })}
                                    >
                                        <option value="">-- Sila Pilih Negeri --</option>
                                        {(states.length > 0 ? states : NEGERI_CAWANGAN_OPTIONS).map(negeri => (
                                            <option key={negeri} value={negeri}>{negeri}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Lokasi (Daerah/Kawasan)</label>
                                    <select
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={formData.lokasi}
                                        onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                                    >
                                        <option value="">-- Sila Pilih Lokasi --</option>
                                        {availableLocations
                                            .filter(loc => !formData.negeri || !loc.state_name || loc.state_name === formData.negeri)
                                            .map(loc => (
                                                <option key={loc.id || loc.name} value={loc.name}>{loc.name}</option>
                                            ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Jenis</label>
                                        <select
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.jenis}
                                            onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
                                        >
                                            {(types.length > 0 ? types : ['Fizikal', 'Online']).map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Tahap</label>
                                        <select
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={formData.tahap}
                                            onChange={(e) => setFormData({ ...formData, tahap: e.target.value })}
                                        >
                                            {(levels.length > 0 ? levels : ['Asas', 'Lanjutan']).map(l => (
                                                <option key={l} value={l}>{l}</option>
                                            ))}
                                        </select>
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
                                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
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
