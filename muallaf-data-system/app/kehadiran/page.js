'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Search, Save, UserPlus, FileText, CheckCircle, Trash2, Home, X, Check, Plus, Calendar, MapPin } from 'lucide-react';

export default function AttendancePage() {
    const { user, role, profile } = useAuth();

    // Selection state
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    // Data state
    const [classes, setClasses] = useState([]);
    const [locations, setLocations] = useState([]);
    const [attendanceRecord, setAttendanceRecord] = useState(null);
    const [loading, setLoading] = useState(false);

    // Modal state
    const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
    const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

    // Selection lists (Cache)
    const [allWorkers, setAllWorkers] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch Classes & Compute Locations
    useEffect(() => {
        const fetchClasses = async () => {
            const q = query(collection(db, 'classes'));
            const snapshot = await getDocs(q);
            const classesList = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.nama.localeCompare(b.nama));

            // Filter classes based on user access immediately? 
            // Better to fetch all and filter in render/logic to avoid permission refetching issues
            // But for locations list, we need unique values

            setClasses(classesList);

            const uniqueLocs = [...new Set(classesList.map(c => c.lokasi).filter(l => l))].sort();
            setLocations(uniqueLocs);

            // Default Location Selection
            if (role === 'admin') {
                if (uniqueLocs.length > 0) setSelectedLocation(uniqueLocs[0]);
            } else if (profile?.assignedLocations?.length > 0) {
                const validLocs = uniqueLocs.filter(l => profile.assignedLocations.includes(l));
                if (validLocs.length > 0) setSelectedLocation(validLocs[0]);
            }
        };
        fetchClasses();
    }, [role, profile]);

    // Derived State: Available Locations & Classes
    const availableLocations = role === 'admin'
        ? locations
        : locations.filter(l => profile?.assignedLocations?.includes(l));

    const availableClasses = classes.filter(c => {
        // Must match selected location (if selected)
        if (selectedLocation && c.lokasi !== selectedLocation) return false;

        // Must be accessible to user
        if (role !== 'admin' && !profile?.assignedLocations?.includes(c.lokasi)) return false;

        return true;
    });

    // Reset Class selection if Location changes
    useEffect(() => {
        setSelectedClassId('');
    }, [selectedLocation]);

    // Fetch Attendance Record when Class & Month change
    useEffect(() => {
        if (!selectedClassId || !selectedMonth) {
            setAttendanceRecord(null);
            return;
        }

        setLoading(true);
        const recordId = `${selectedClassId}_${selectedMonth}`;
        const recordRef = doc(db, 'attendance_records', recordId);

        const unsubscribe = onSnapshot(recordRef, (docSnap) => {
            if (docSnap.exists()) {
                setAttendanceRecord({ id: docSnap.id, ...docSnap.data() });
            } else {
                setAttendanceRecord({
                    id: recordId,
                    classId: selectedClassId,
                    month: selectedMonth,
                    workers: [],
                    students: []
                });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [selectedClassId, selectedMonth]);

    // Save Logic
    const saveAttendance = async (newData) => {
        try {
            const recordId = `${selectedClassId}_${selectedMonth}`;
            await setDoc(doc(db, 'attendance_records', recordId), {
                ...newData,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("Error saving:", error);
            alert("Ralat menyimpan e-kehadiran");
        }
    };

    // Toggle Attendance
    const toggleAttendance = (type, personId, day) => {
        if (!attendanceRecord) return;

        const listName = type === 'worker' ? 'workers' : 'students';
        const list = [...attendanceRecord[listName]];
        const personIndex = list.findIndex(p => p.id === personId);

        if (personIndex === -1) return;

        const currentAttendance = list[personIndex].attendance || [];
        let newAttendance;

        if (currentAttendance.includes(day)) {
            newAttendance = currentAttendance.filter(d => d !== day);
        } else {
            newAttendance = [...currentAttendance, day];
        }

        list[personIndex] = { ...list[personIndex], attendance: newAttendance };

        // Optimistic update
        setAttendanceRecord({ ...attendanceRecord, [listName]: list });

        // Save to DB
        saveAttendance({ [listName]: list });
    };

    // Add Functions
    const handleAddWorker = async (worker) => {
        const currentList = attendanceRecord?.workers || [];
        if (currentList.some(w => w.id === worker.id)) {
            alert('Pekerja sudah ada dalam senarai.');
            return;
        }

        const newList = [...currentList, {
            id: worker.id,
            nama: worker.nama,
            role: worker.peranan,
            attendance: []
        }];

        await saveAttendance({ workers: newList });
        setIsWorkerModalOpen(false);
    };

    const handleAddStudent = async (student) => {
        const currentList = attendanceRecord?.students || [];
        if (currentList.some(s => s.id === student.id)) {
            alert('Pelajar sudah ada dalam senarai.');
            return;
        }

        const newList = [...currentList, {
            id: student.id,
            nama: student.namaAsal, // Or namaIslam
            icNo: student.noKP,
            attendance: []
        }];

        await saveAttendance({ students: newList });
        setIsStudentModalOpen(false);
    };

    const handleRemovePerson = async (type, personId) => {
        if (!confirm("Buang dari senarai kehadiran bulan ini?")) return;

        const listName = type === 'worker' ? 'workers' : 'students';
        const list = attendanceRecord[listName].filter(p => p.id !== personId);
        await saveAttendance({ [listName]: list });
    };

    // Fetch lists when modals open
    const openWorkerModal = async () => {
        if (allWorkers.length === 0) {
            const snap = await getDocs(query(collection(db, 'workers')));
            setAllWorkers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
        setIsWorkerModalOpen(true);
    };

    const openStudentModal = async () => {
        if (allStudents.length === 0) {
            // Fetch students from submissions. With 'active' status filter.
            const snap = await getDocs(query(collection(db, 'submissions'), where('status', '==', 'active')));
            setAllStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
        setIsStudentModalOpen(true);
    };

    const daysInMonth = (yearMonth) => {
        if (!yearMonth) return 31;
        const [y, m] = yearMonth.split('-');
        return new Date(y, m, 0).getDate();
    };

    const totalDays = daysInMonth(selectedMonth);
    const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

    // Filter logic for modals
    const filteredWorkers = allWorkers.filter(w => w.nama.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredStudents = allStudents.filter(s =>
        (s.namaAsal || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.namaIslam || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.noKP || '').includes(searchTerm)
    );

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                <Navbar />

                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Header Controls */}
                    <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4 items-end">
                        {/* Location Selector */}
                        <div className="w-1/4 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Lokasi</label>
                            <div className="relative">
                                <select
                                    value={selectedLocation}
                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 p-2 border appearance-none"
                                >
                                    <option value="">-- Sila Pilih --</option>
                                    {availableLocations.map(loc => (
                                        <option key={loc} value={loc}>{loc}</option>
                                    ))}
                                </select>
                                <MapPin className="h-4 w-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
                            </div>
                        </div>

                        {/* Class Selector */}
                        <div className="w-1/4 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kelas</label>
                            <select
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value)}
                                disabled={!selectedLocation}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 p-2 border disabled:bg-gray-100 disabled:text-gray-400"
                            >
                                <option value="">-- Sila Pilih Kelas --</option>
                                {availableClasses.map(c => (
                                    <option key={c.id} value={c.id}>{c.nama} ({c.jenis})</option>
                                ))}
                            </select>
                        </div>

                        <div className="w-48">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 p-2 border"
                            />
                        </div>
                        <div className="ml-auto flex items-center bg-blue-50 px-4 py-2 rounded text-blue-700 text-sm">
                            <FileText className="h-4 w-4 mr-2" />
                            <span>Laporan & Pembayaran Auto-Generated</span>
                        </div>
                    </div>

                    {selectedClassId && selectedMonth ? (
                        <div className="space-y-8">
                            {/* Workers Table */}
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center">
                                        <UserPlus className="h-5 w-5 mr-2 text-emerald-600" />
                                        Maklumat Guru / Petugas / Sukarelawan
                                    </h2>
                                    <button
                                        onClick={openWorkerModal}
                                        className="bg-emerald-600 text-white px-3 py-1.5 rounded text-sm hover:bg-emerald-700 flex items-center"
                                    >
                                        <UserPlus className="h-4 w-4 mr-1" /> Tambah
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-gray-100 border-b">
                                                <th className="p-2 text-left sticky left-0 bg-gray-100 z-10 w-48 border-r">Nama</th>
                                                <th className="p-2 text-left w-24 border-r">Peranan</th>
                                                {daysArray.map(d => (
                                                    <th key={d} className="p-1 w-8 text-center border-r font-normal text-gray-500">{d}</th>
                                                ))}
                                                <th className="p-2 text-center w-16 bg-gray-50 font-bold sticky right-0">Jum</th>
                                                <th className="p-2 w-10 sticky right-0"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attendanceRecord?.workers?.length === 0 ? (
                                                <tr><td colSpan={totalDays + 4} className="p-8 text-center text-gray-400">Tiada pekerja disenaraikan.</td></tr>
                                            ) : (
                                                attendanceRecord?.workers?.map((worker) => (
                                                    <tr key={worker.id} className="border-b hover:bg-gray-50">
                                                        <td className="p-2 sticky left-0 bg-white border-r font-medium truncate">{worker.nama}</td>
                                                        <td className="p-2 border-r">{worker.role}</td>
                                                        {daysArray.map(d => {
                                                            const isChecked = worker.attendance?.includes(d);
                                                            return (
                                                                <td key={d} className="p-0 text-center border-r relative h-8">
                                                                    <label className="cursor-pointer w-full h-full flex items-center justify-center hover:bg-emerald-50 absolute inset-0">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                                                            checked={isChecked || false}
                                                                            onChange={() => toggleAttendance('worker', worker.id, d)}
                                                                        />
                                                                    </label>
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="p-2 text-center font-bold bg-gray-50 sticky right-0">
                                                            {worker.attendance?.length || 0}
                                                        </td>
                                                        <td className="p-2 text-center sticky right-0">
                                                            <button onClick={() => handleRemovePerson('worker', worker.id)} className="text-red-400 hover:text-red-600">
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

                            {/* Students Table */}
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center">
                                        <UserPlus className="h-5 w-5 mr-2 text-blue-600" />
                                        Maklumat Pelajar
                                    </h2>
                                    <button
                                        onClick={openStudentModal}
                                        className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 flex items-center"
                                    >
                                        <UserPlus className="h-4 w-4 mr-1" /> Tambah
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-gray-100 border-b">
                                                <th className="p-2 text-left sticky left-0 bg-gray-100 z-10 w-48 border-r">Nama</th>
                                                <th className="p-2 text-left w-32 border-r">Data Mualaf</th>
                                                {daysArray.map(d => (
                                                    <th key={d} className="p-1 w-8 text-center border-r font-normal text-gray-500">{d}</th>
                                                ))}
                                                <th className="p-2 text-center w-16 bg-gray-50 font-bold sticky right-0">Jum</th>
                                                <th className="p-2 w-10 sticky right-0"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attendanceRecord?.students?.length === 0 ? (
                                                <tr><td colSpan={totalDays + 4} className="p-8 text-center text-gray-400">Tiada pelajar disenaraikan.</td></tr>
                                            ) : (
                                                attendanceRecord?.students?.map((student) => (
                                                    <tr key={student.id} className="border-b hover:bg-gray-50">
                                                        <td className="p-2 sticky left-0 bg-white border-r font-medium truncate" title={student.nama}>{student.nama}</td>
                                                        <td className="p-2 border-r text-gray-500 truncate" title={student.icNo}>{student.icNo}</td>
                                                        {daysArray.map(d => {
                                                            const isChecked = student.attendance?.includes(d);
                                                            return (
                                                                <td key={d} className="p-0 text-center border-r relative h-8">
                                                                    <label className="cursor-pointer w-full h-full flex items-center justify-center hover:bg-blue-50 absolute inset-0">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                                                                            checked={isChecked || false}
                                                                            onChange={() => toggleAttendance('student', student.id, d)}
                                                                        />
                                                                    </label>
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="p-2 text-center font-bold bg-gray-50 sticky right-0">
                                                            {student.attendance?.length || 0}
                                                        </td>
                                                        <td className="p-2 text-center sticky right-0">
                                                            <button onClick={() => handleRemovePerson('student', student.id)} className="text-red-400 hover:text-red-600">
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
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-lg shadow border-2 border-dashed border-gray-300">
                            <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">Sila pilih Lokasi, Kelas dan Bulan</h3>
                            <p className="text-gray-500">Isi pilihan di atas untuk mula mengisi kehadiran.</p>
                        </div>
                    )}
                </div>

                {/* Worker Selection Modal */}
                {isWorkerModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-lg w-full p-6 h-[80vh] flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Pilih Pekerja</h3>
                                <button onClick={() => setIsWorkerModalOpen(false)}><X className="h-6 w-6 text-gray-400" /></button>
                            </div>
                            <input
                                type="text"
                                placeholder="Cari pekerja..."
                                className="w-full border p-2 rounded mb-4"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="flex-1 overflow-y-auto space-y-2">
                                {filteredWorkers.map(w => (
                                    <button
                                        key={w.id}
                                        onClick={() => handleAddWorker(w)}
                                        className="w-full text-left p-3 hover:bg-gray-50 border rounded flex justify-between items-center"
                                    >
                                        <div>
                                            <div className="font-medium">{w.nama}</div>
                                            <div className="text-sm text-gray-500">{w.peranan}{w.lokasi ? ` • ${w.lokasi}` : ''}</div>
                                        </div>
                                        <Plus className="h-5 w-5 text-emerald-600" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Student Selection Modal */}
                {isStudentModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-lg w-full p-6 h-[80vh] flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Pilih Pelajar (Data Mualaf)</h3>
                                <button onClick={() => setIsStudentModalOpen(false)}><X className="h-6 w-6 text-gray-400" /></button>
                            </div>
                            <input
                                type="text"
                                placeholder="Cari pelajar..."
                                className="w-full border p-2 rounded mb-4"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="flex-1 overflow-y-auto space-y-2">
                                {filteredStudents.slice(0, 50).map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => handleAddStudent(s)}
                                        className="w-full text-left p-3 hover:bg-gray-50 border rounded flex justify-between items-center"
                                    >
                                        <div>
                                            <div className="font-medium">{s.namaAsal}</div>
                                            <div className="text-sm text-gray-500">{s.namaIslam} • {s.noKP}</div>
                                        </div>
                                        <Plus className="h-5 w-5 text-blue-600" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
