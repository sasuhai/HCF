'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { getLocations } from '@/lib/supabase/database';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { User, Plus, Search, Edit2, Trash2, Shield, MapPin, X, Check, Eye, EyeOff } from 'lucide-react';

export default function UsersPage() {
    const { user, role } = useAuth();
    const router = useRouter();

    const [users, setUsers] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
    const [currentUser, setCurrentUser] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        role: 'editor',
        assignedLocations: []
    });

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            if (role !== 'admin') return;

            try {
                // Fetch Users
                const { data: usersList, error: usersError } = await supabase
                    .from('users')
                    .select('*')
                    .order('name');
                if (usersError) throw usersError;
                setUsers(usersList || []);

                // Fetch Locations from lookup table
                const { data: locs, error: locsError } = await getLocations();
                if (locsError) throw locsError;
                setLocations(locs || []);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user && role === 'admin') {
            fetchData();
        }
    }, [user, role]);


    // Handlers
    const handleOpenModal = (mode, userToEdit = null) => {
        setModalMode(mode);
        if (mode === 'edit' && userToEdit) {
            setCurrentUser(userToEdit);
            setFormData({
                email: userToEdit.email,
                password: '', // Password not editable directly here usually
                name: userToEdit.name || '',
                role: (userToEdit.role === 'user' ? 'editor' : userToEdit.role) || 'editor',
                assignedLocations: userToEdit.assignedLocations || []
            });
        } else {
            setCurrentUser(null);
            setFormData({
                email: '',
                password: '',
                name: '',
                role: 'editor',
                assignedLocations: []
            });
        }
        setIsModalOpen(true);
    };

    const handleLocationToggle = (loc) => {
        setFormData(prev => {
            const current = prev.assignedLocations || [];

            if (loc === 'All') {
                if (current.includes('All')) {
                    // Uncheck All
                    return { ...prev, assignedLocations: [] };
                } else {
                    // Check All - clear everything else and just put All
                    return { ...prev, assignedLocations: ['All'] };
                }
            } else {
                if (current.includes('All')) return prev;

                if (current.includes(loc)) {
                    return { ...prev, assignedLocations: current.filter(l => l !== loc) };
                } else {
                    return { ...prev, assignedLocations: [...current, loc] };
                }
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (modalMode === 'add') {
                // Use API Route to create user (DB + Auth) securely
                const res = await fetch('/api/admin/create-user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.email,
                        password: formData.password,
                        name: formData.name,
                        role: formData.role,
                        assignedLocations: formData.assignedLocations
                    })
                });

                const json = await res.json();
                if (!res.ok) throw new Error(json.error || 'Failed to create user');

                alert("Pengguna berjaya dicipta!");
                setIsModalOpen(false);

                // Refresh list
                const { data: refreshedUsers } = await supabase.from('users').select('*');
                if (refreshedUsers) setUsers(refreshedUsers);

            } else {
                // Edit User (Direct DB update allowed by RLS policy for Admin)
                const { error } = await supabase
                    .from('users')
                    .update({
                        name: formData.name,
                        role: formData.role,
                        assignedLocations: formData.assignedLocations,
                        updatedAt: new Date().toISOString()
                    })
                    .eq('id', currentUser.id);

                if (error) throw error;

                // Update local state
                setUsers(prev => prev.map(u => u.id === currentUser.id ? {
                    ...u,
                    name: formData.name,
                    role: formData.role,
                    assignedLocations: formData.assignedLocations
                } : u));

                alert("Pengguna berjaya dikemaskini!");
                setIsModalOpen(false);
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("Ralat memproses borang: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (targetUser) => {
        if (!confirm(`Adakah anda pasti ingin memadam pengguna "${targetUser.name}"?`)) return;

        // Check if admin is trying to delete themselves
        if (targetUser.id === user.id) {
            alert("Ralat: Anda tidak boleh memadam akaun anda sendiri.");
            return;
        }

        const confirmFinal = confirm("PERHATIAN: Tindakan ini akan memadam rekod pangkalan data DAN pengguna Auth login. Teruskan?");
        if (!confirmFinal) return;

        try {
            // Use API Route to delete (Auth + DB)
            const res = await fetch(`/api/admin/users/${targetUser.id}`, {
                method: 'DELETE'
            });
            const json = await res.json();

            if (!res.ok) throw new Error(json.error || 'Failed to delete user');

            // Update local state
            setUsers(prev => prev.filter(u => u.id !== targetUser.id));

            alert(`Pengguna berjaya dipadam.`);
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("Ralat memadam pengguna: " + error.message);
        }
    };

    // Filter Users
    const filteredUsers = users.filter(u =>
        (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (role !== 'admin' && !loading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center p-8">
                        <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900">Akses Ditolak</h1>
                        <p className="text-gray-600">Hanya Admin boleh mengakses halaman ini.</p>
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
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                                <User className="h-6 w-6 mr-2 text-indigo-600" />
                                Pengurusan Pengguna
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">Urus akses, peranan, dan lokasi pengguna sistem.</p>
                        </div>
                        <button
                            onClick={() => handleOpenModal('add')}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 shadow-sm transition-colors"
                        >
                            <Plus className="h-5 w-5 mr-1" /> Tambah Pengguna
                        </button>
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-white p-4 rounded-lg shadow mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Cari nama atau emel..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Users List */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama / Emel</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peranan</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lokasi Ditugaskan</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tindakan</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading && users.length === 0 ? (
                                    <tr><td colSpan="4" className="px-6 py-4 text-center">Loading...</td></tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr><td colSpan="4" className="px-6 py-4 text-center text-gray-500">Tiada pengguna dijumpai.</td></tr>
                                ) : (
                                    filteredUsers.map((u) => (
                                        <tr key={u.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{u.name || 'Tanpa Nama'}</div>
                                                <div className="text-sm text-gray-500">{u.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                                    {u.role === 'admin' ? 'Admin' : 'Editor'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {(u.assignedLocations || []).includes('All') ? (
                                                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs border border-blue-200 font-semibold">
                                                            Semua Lokasi
                                                        </span>
                                                    ) : (
                                                        (u.assignedLocations || []).map((loc, idx) => (
                                                            <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs border border-gray-200">
                                                                {loc}
                                                            </span>
                                                        ))
                                                    )}
                                                    {(!u.assignedLocations || u.assignedLocations.length === 0) && (
                                                        <span className="text-gray-400 text-xs italic">Tiada Lokasi</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button onClick={() => handleOpenModal('edit', u)} className="text-indigo-600 hover:text-indigo-900 mr-3" title="Edit">
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(u)} className="text-red-600 hover:text-red-900" title="Padam">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-lg w-full p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900">
                                    {modalMode === 'add' ? 'Tambah Pengguna Baru' : 'Kemaskini Pengguna'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)}><X className="h-6 w-6 text-gray-400" /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {modalMode === 'add' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Emel</label>
                                            <input
                                                type="email"
                                                required
                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Kata Laluan</label>
                                            <div className="relative mt-1">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    required
                                                    minLength={6}
                                                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2 pr-10 focus:ring-indigo-500 focus:border-indigo-500"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-5 w-5" />
                                                    ) : (
                                                        <Eye className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Minima 6 karakter.</p>
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nama Penuh</label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Peranan</label>
                                    <select
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        value={formData.role}
                                        onChange={(e) => {
                                            const newRole = e.target.value;
                                            setFormData(prev => {
                                                let newLocations = prev.assignedLocations || [];
                                                if (newRole === 'admin') {
                                                    // Auto-select 'All' for admin
                                                    newLocations = ['All'];
                                                } else {
                                                    // If switching to editor, remove 'All' if present
                                                    if (newLocations.includes('All')) {
                                                        newLocations = [];
                                                    }
                                                }
                                                return { ...prev, role: newRole, assignedLocations: newLocations };
                                            });
                                        }}
                                    >
                                        <option value="editor">Editor</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Admin boleh akses semua data secara automatik.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Lokasi Ditugaskan</label>
                                    <div className="bg-gray-50 p-3 rounded-md border border-gray-200 max-h-48 overflow-y-auto grid grid-cols-2 gap-2">
                                        <label className={`flex items-center space-x-2 text-sm font-semibold col-span-2 pb-2 border-b border-gray-200 mb-2 ${formData.role === 'editor' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <input
                                                type="checkbox"
                                                checked={formData.assignedLocations?.includes('All')}
                                                onChange={() => formData.role !== 'editor' && handleLocationToggle('All')}
                                                disabled={formData.role === 'editor'}
                                                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                            />
                                            <span>Semua Lokasi (Akses Penuh)</span>
                                        </label>
                                        {locations.map(loc => (
                                            <label key={loc} className={`flex items-center space-x-2 text-sm ${formData.assignedLocations?.includes('All') ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.assignedLocations?.includes(loc) || formData.assignedLocations?.includes('All')}
                                                    onChange={() => handleLocationToggle(loc)}
                                                    disabled={formData.assignedLocations?.includes('All')}
                                                    className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                                />
                                                <span>{loc}</span>
                                            </label>
                                        ))}
                                        {locations.length === 0 && <p className="text-sm text-gray-500 col-span-2">Tiada lokasi dijumpai. Sila tambah Kelas dahulu.</p>}
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
                                        disabled={loading}
                                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
                                    >
                                        {loading ? 'Processing...' : (modalMode === 'add' ? 'Cipta Pengguna' : 'Simpan Perubahan')}
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
