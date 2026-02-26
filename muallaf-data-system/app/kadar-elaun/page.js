'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import {
    getRateCategories,
    createRateCategory,
    updateRateCategory,
    deleteRateCategory,
    initializeDefaultRates
} from '@/lib/supabase/database';
import { DEFAULT_RATE_CATEGORIES } from '@/lib/constants';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { DollarSign, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';

export default function RatesPage() {
    const { user, role } = useAuth();
    const { showAlert, showSuccess, showError, showConfirm } = useModal();

    // Data State
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [filterType, setFilterType] = useState('all'); // all, mualaf, petugas

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRate, setCurrentRate] = useState(null);
    const [formData, setFormData] = useState({
        kategori: '',
        jumlahElaun: 0,
        jenisPembayaran: 'bayaran/kelas',
        jenis: 'petugas'
    });

    // Load rates
    useEffect(() => {
        loadRates();
    }, []);

    const loadRates = async () => {
        setLoading(true);
        const { data, error } = await getRateCategories();
        if (error) {
            console.error('Error loading rates:', error);
        } else {
            setRates(data);
        }
        setLoading(false);
    };

    const handleInitializeDefaults = () => {
        showConfirm('Sahkan Inisialisasi', 'Adakah anda pasti mahu memulakan kadar elaun dengan nilai default? Ini tidak akan memadam data sedia ada.', async () => {
            setLoading(true);
            const { error } = await initializeDefaultRates(DEFAULT_RATE_CATEGORIES, user.id);
            if (error) {
                showError('Ralat', error);
            } else {
                showSuccess('Berjaya', 'Kadar elaun default berjaya ditambah!');
                loadRates();
            }
            setLoading(false);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (currentRate) {
                const { error } = await updateRateCategory(currentRate.id, formData, user.id);
                if (error) throw new Error(error);
            } else {
                const { error } = await createRateCategory(formData, user.id);
                if (error) throw new Error(error);
            }

            setIsModalOpen(false);
            resetForm();
            loadRates();
            showSuccess('Berjaya', 'Data kadar elaun telah disimpan.');
        } catch (error) {
            console.error('Error saving rate:', error);
            showError('Ralat Simpan', 'Ralat menyimpan data kadar elaun: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        showConfirm('Sahkan Padam', 'Adakah anda pasti mahu memadam kadar elaun ini?', async () => {
            const { error } = await deleteRateCategory(id);
            if (error) {
                showError('Ralat Padam', error);
            } else {
                loadRates();
                showSuccess('Berjaya', 'Kadar elaun telah dipadam.');
            }
        });
    };

    const openModal = (rate = null) => {
        if (rate) {
            setCurrentRate(rate);
            setFormData({
                kategori: rate.kategori || '',
                jumlahElaun: rate.jumlahElaun || 0,
                jenisPembayaran: rate.jenisPembayaran || 'bayaran/kelas',
                jenis: rate.jenis || 'petugas'
            });
        } else {
            setCurrentRate(null);
            resetForm();
        }
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            kategori: '',
            jumlahElaun: 0,
            jenisPembayaran: 'bayaran/kelas',
            jenis: 'petugas'
        });
    };

    // Filter rates
    const filteredRates = rates.filter(rate => {
        if (filterType === 'all') return true;
        return rate.jenis === filterType;
    });

    // Group rates by type for display
    const mualaafRates = filteredRates.filter(r => r.jenis === 'mualaf');
    const petugasRates = filteredRates.filter(r => r.jenis === 'petugas');

    // Only admins can access this page
    if (role !== 'admin') {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-50 pt-16">
                    <Navbar />
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-red-900 mb-2">Akses Ditolak</h2>
                            <p className="text-red-700">Halaman ini hanya boleh diakses oleh pentadbir sahaja.</p>
                        </div>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 pt-16">
                <Navbar />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                                <DollarSign className="h-6 w-6 mr-2 text-emerald-600" />
                                Pengurusan Kadar Elaun
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">
                                Penetapan kadar elaun untuk Mualaf dan Petugas
                            </p>
                        </div>

                        <div className="flex items-center space-x-3">
                            {rates.length === 0 && (
                                <button
                                    onClick={handleInitializeDefaults}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 shadow-sm transition-colors"
                                >
                                    <Plus className="h-5 w-5 mr-1" /> Mula dengan Default
                                </button>
                            )}
                            <button
                                onClick={() => openModal()}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-emerald-700 shadow-sm transition-colors"
                            >
                                <Plus className="h-5 w-5 mr-1" /> Tambah Kadar
                            </button>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="bg-white rounded-lg shadow mb-6 p-1 flex gap-2">
                        <button
                            onClick={() => setFilterType('all')}
                            className={`flex-1 py-2 px-4 rounded-md transition-colors ${filterType === 'all'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Semua ({rates.length})
                        </button>
                        <button
                            onClick={() => setFilterType('mualaf')}
                            className={`flex-1 py-2 px-4 rounded-md transition-colors ${filterType === 'mualaf'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Mualaf ({mualaafRates.length})
                        </button>
                        <button
                            onClick={() => setFilterType('petugas')}
                            className={`flex-1 py-2 px-4 rounded-md transition-colors ${filterType === 'petugas'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Petugas ({petugasRates.length})
                        </button>
                    </div>

                    {/* Info Banner */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start">
                        <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Nota Penting:</p>
                            <p>* Sila rujuk Unit Pembangunan Mualaf untuk penetapan kadar elaun yang betul</p>
                            <p>* Kadar ini akan digunakan untuk pengiraan bayaran/elaun secara automatik</p>
                        </div>
                    </div>

                    {/* Rates Display */}
                    {loading ? (
                        <div className="text-center py-10">Loading...</div>
                    ) : (
                        <div className={`grid grid-cols-1 ${filterType === 'all' ? 'lg:grid-cols-2' : ''} gap-6`}>
                            {/* Petugas Table */}
                            {(filterType === 'all' || filterType === 'petugas') && (
                                <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                                    <div className="bg-blue-50 px-4 py-2 border-b border-blue-100 flex justify-between items-center">
                                        <h3 className="font-bold text-blue-800 text-sm">Kadar Elaun Petugas</h3>
                                        <span className="bg-blue-200 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">{petugasRates.length}</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Kategori</th>
                                                    <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">RM</th>
                                                    <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Per</th>
                                                    <th className="px-3 py-2 text-center text-[10px] font-bold text-gray-500 uppercase">Tindakan</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {petugasRates.map((rate) => (
                                                    <tr key={rate.id} className="hover:bg-blue-50/50 transition-colors">
                                                        <td className="px-3 py-1.5 whitespace-nowrap text-xs font-semibold text-gray-900">{rate.kategori}</td>
                                                        <td className="px-3 py-1.5 whitespace-nowrap text-right text-xs font-bold text-emerald-600">
                                                            {rate.jumlahElaun.toFixed(2)}
                                                        </td>
                                                        <td className="px-3 py-1.5 whitespace-nowrap text-[10px] text-gray-500">{rate.jenisPembayaran.replace('bayaran/', '')}</td>
                                                        <td className="px-3 py-1.5 whitespace-nowrap text-center text-xs">
                                                            <div className="flex justify-center space-x-2">
                                                                <button onClick={() => openModal(rate)} className="text-gray-400 hover:text-blue-600 transition-colors"><Edit2 className="h-3 w-3" /></button>
                                                                <button onClick={() => handleDelete(rate.id)} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="h-3 w-3" /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {petugasRates.length === 0 && (
                                                    <tr><td colSpan="4" className="text-center py-4 text-xs text-gray-400">Tiada rekod</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Mualaf Table */}
                            {(filterType === 'all' || filterType === 'mualaf') && (
                                <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                                    <div className="bg-purple-50 px-4 py-2 border-b border-purple-100 flex justify-between items-center">
                                        <h3 className="font-bold text-purple-800 text-sm">Kadar Elaun Mualaf</h3>
                                        <span className="bg-purple-200 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-bold">{mualaafRates.length}</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Kategori</th>
                                                    <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">RM</th>
                                                    <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Per</th>
                                                    <th className="px-3 py-2 text-center text-[10px] font-bold text-gray-500 uppercase">Tindakan</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {mualaafRates.map((rate) => (
                                                    <tr key={rate.id} className="hover:bg-purple-50/50 transition-colors">
                                                        <td className="px-3 py-1.5 whitespace-nowrap text-xs font-semibold text-gray-900">{rate.kategori}</td>
                                                        <td className="px-3 py-1.5 whitespace-nowrap text-right text-xs font-bold text-emerald-600">
                                                            {rate.jumlahElaun.toFixed(2)}
                                                        </td>
                                                        <td className="px-3 py-1.5 whitespace-nowrap text-[10px] text-gray-500">{rate.jenisPembayaran.replace('bayaran/', '')}</td>
                                                        <td className="px-3 py-1.5 whitespace-nowrap text-center text-xs">
                                                            <div className="flex justify-center space-x-2">
                                                                <button onClick={() => openModal(rate)} className="text-gray-400 hover:text-blue-600 transition-colors"><Edit2 className="h-3 w-3" /></button>
                                                                <button onClick={() => handleDelete(rate.id)} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 className="h-3 w-3" /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {mualaafRates.length === 0 && (
                                                    <tr><td colSpan="4" className="text-center py-4 text-xs text-gray-400">Tiada rekod</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-lg w-full p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {currentRate ? 'Kemaskini Kadar Elaun' : 'Tambah Kadar Elaun Baru'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)}>
                                    <X className="h-6 w-6 text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Jenis
                                    </label>
                                    <select
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        value={formData.jenis}
                                        onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
                                    >
                                        <option value="petugas">Petugas</option>
                                        <option value="mualaf">Mualaf</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Kategori
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        value={formData.kategori}
                                        onChange={(e) => setFormData({ ...formData, kategori: e.target.value.toUpperCase() })}
                                        placeholder="cth: GURU 1, MUALAF 1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Jumlah Elaun (RM)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        value={formData.jumlahElaun}
                                        onChange={(e) => setFormData({ ...formData, jumlahElaun: parseFloat(e.target.value) })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Jenis Pembayaran
                                    </label>
                                    <select
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        value={formData.jenisPembayaran}
                                        onChange={(e) => setFormData({ ...formData, jenisPembayaran: e.target.value })}
                                    >
                                        <option value="bayaran/kelas">bayaran/kelas</option>
                                        <option value="bayaran/bulan">bayaran/bulan</option>
                                        <option value="bayaran/hari">bayaran/hari</option>
                                    </select>
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
