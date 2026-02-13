'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, doc, setDoc, onSnapshot, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Search, Save, UserPlus, FileText, CheckCircle, Trash2, Home, X, Check, Plus, Calendar, MapPin, Edit2, Copy } from 'lucide-react';

export default function AttendancePage() {
    const { user, role, profile, loading: authLoading } = useAuth();

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
    const [isClassInfoModalOpen, setIsClassInfoModalOpen] = useState(false);
    const [isCopyConfirmModalOpen, setIsCopyConfirmModalOpen] = useState(false);

    // Selection lists (Cache)
    const [allWorkers, setAllWorkers] = useState([]);
    const [allStudents, setAllStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [classInfoForm, setClassInfoForm] = useState({
        bahasa: 'Bahasa Melayu',
        hariMasa: '',
        penaja: '',
        kekerapan: 'Mingguan',
        pic: '',
        noTelPIC: '',
        catatan: ''
    });

    // Save Class Info
    const handleSaveClassInfo = async () => {
        if (!attendanceRecord) return;

        await saveAttendance(classInfoForm);
        setIsClassInfoModalOpen(false);
    };

    // Open Class Info Modal
    const openClassInfoModal = () => {
        if (attendanceRecord) {
            setClassInfoForm({
                bahasa: attendanceRecord.bahasa || 'Bahasa Melayu',
                hariMasa: attendanceRecord.hariMasa || '',
                penaja: attendanceRecord.penaja || '',
                kekerapan: attendanceRecord.kekerapan || 'Mingguan',
                pic: attendanceRecord.pic || '',
                noTelPIC: attendanceRecord.noTelPIC || '',
                catatan: attendanceRecord.catatan || ''
            });
        }
        setIsClassInfoModalOpen(true);
    };

    // Fetch Classes & Compute Locations
    useEffect(() => {
        if (authLoading) return;

        const fetchClasses = async () => {
            try {
                const q = query(collection(db, 'classes'));
                const snapshot = await getDocs(q);
                const classesList = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.nama.localeCompare(b.nama));

                setClasses(classesList);

                const uniqueLocs = [...new Set(classesList.map(c => c.lokasi).filter(l => l))].sort();
                setLocations(uniqueLocs);
            } catch (error) {
                console.error("Error fetching classes:", error);
                if (error.code === 'resource-exhausted') {
                    alert("Kouta pangkalan data habis. Tidak dapat memuatkan senarai kelas.");
                } else {
                    alert("Ralat memuatkan kelas: " + error.message);
                }
            }
        };
        fetchClasses();
    }, [authLoading]);

    // Derived State: Available Locations & Classes
    const availableLocations = (role === 'admin' || profile?.assignedLocations?.includes('All'))
        ? locations
        : locations.filter(l => profile?.assignedLocations?.includes(l));

    const availableClasses = classes.filter(c => {
        // Must match selected location (if selected)
        if (selectedLocation && c.lokasi !== selectedLocation) return false;

        // Must be accessible to user
        if (role !== 'admin' && !profile?.assignedLocations?.includes('All') && !profile?.assignedLocations?.includes(c.lokasi)) return false;

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

        const unsubscribe = onSnapshot(recordRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() };
                setAttendanceRecord(data);

                // Auto-sync kategoriElaun if missing
                if (data.workers?.some(w => !w.kategoriElaun) || data.students?.some(s => !s.kategoriElaun)) {
                    setTimeout(() => syncKategoriElaunForRecord(data), 500);
                }
            } else {
                setAttendanceRecord({
                    id: recordId,
                    classId: selectedClassId,
                    month: selectedMonth,
                    workers: [],
                    students: [],
                    // Monthly class info
                    bahasa: 'Bahasa Melayu',
                    hariMasa: '',
                    penaja: '',
                    kekerapan: 'Mingguan',
                    pic: '',
                    noTelPIC: '',
                    catatan: ''
                });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [selectedClassId, selectedMonth]);

    // Sync kategoriElaun from profiles to attendance record
    const syncKategoriElaunForRecord = async (record) => {
        if (!record) return;

        let updated = false;
        const updatedWorkers = await Promise.all(
            (record.workers || []).map(async (worker) => {
                if (!worker.kategoriElaun) {
                    const workerSnap = await getDocs(query(collection(db, 'workers'), where('__name__', '==', worker.id), limit(1)));
                    if (!workerSnap.empty) {
                        const workerData = workerSnap.docs[0].data();
                        const newKategori = workerData.kategoriElaun || '';

                        // Check if value actually changes to avoid infinite loop
                        if (worker.kategoriElaun !== newKategori) {
                            updated = true;
                            return { ...worker, kategoriElaun: newKategori };
                        }
                    }
                }
                return worker;
            })
        );

        const updatedStudents = await Promise.all(
            (record.students || []).map(async (student) => {
                if (!student.kategoriElaun) {
                    const studentSnap = await getDocs(query(collection(db, 'submissions'), where('__name__', '==', student.id), limit(1)));
                    if (!studentSnap.empty) {
                        const studentData = studentSnap.docs[0].data();
                        const newKategori = studentData.kategoriElaun || '';

                        // Check if value actually changes
                        if (student.kategoriElaun !== newKategori) {
                            updated = true;
                            return { ...student, kategoriElaun: newKategori };
                        }
                    }
                }
                return student;
            })
        );

        if (updated) {
            await saveAttendance({ workers: updatedWorkers, students: updatedStudents });
        }
    };

    // Save Logic
    const saveAttendance = async (newData) => {
        try {
            const recordId = `${selectedClassId}_${selectedMonth}`;
            await setDoc(doc(db, 'attendance_records', recordId), {
                ...newData,
                month: selectedMonth,
                classId: selectedClassId,
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
            kategoriElaun: worker.kategoriElaun || '',
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
            kategoriElaun: student.kategoriElaun || '',
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

    // Get previous month in YYYY-MM format
    const getPreviousMonth = (currentMonth) => {
        if (!currentMonth) return null;
        const [year, month] = currentMonth.split('-').map(Number);
        const date = new Date(year, month - 1, 1); // month is 0-indexed
        date.setMonth(date.getMonth() - 1); // Go back one month
        const prevYear = date.getFullYear();
        const prevMonth = String(date.getMonth() + 1).padStart(2, '0');
        return `${prevYear}-${prevMonth}`;
    };

    // Copy from previous month
    const handleCopyFromPreviousMonth = async () => {
        setIsCopyConfirmModalOpen(false);

        const previousMonth = getPreviousMonth(selectedMonth);
        if (!previousMonth) {
            alert('Tidak dapat menentukan bulan sebelumnya.');
            return;
        }

        const previousRecordId = `${selectedClassId}_${previousMonth}`;

        try {
            const previousSnap = await getDocs(query(collection(db, 'attendance_records'), where('__name__', '==', previousRecordId), limit(1)));

            if (previousSnap.empty) {
                alert(`Tiada data untuk bulan sebelumnya (${previousMonth}).`);
                return;
            }

            const previousData = previousSnap.docs[0].data();

            // Current Data
            const currentWorkers = attendanceRecord?.workers || [];
            const currentStudents = attendanceRecord?.students || [];

            // Merge Workers (Skip duplicates)
            const newWorkers = [...currentWorkers];
            let addedWorkersCount = 0;

            (previousData.workers || []).forEach(prevWorker => {
                const exists = newWorkers.some(w => w.id === prevWorker.id);
                if (!exists) {
                    newWorkers.push({
                        id: prevWorker.id,
                        nama: prevWorker.nama,
                        role: prevWorker.role,
                        kategoriElaun: prevWorker.kategoriElaun || '',
                        attendance: [] // Reset attendance
                    });
                    addedWorkersCount++;
                }
            });

            // Merge Students (Skip duplicates)
            const newStudents = [...currentStudents];
            let addedStudentsCount = 0;

            (previousData.students || []).forEach(prevStudent => {
                const exists = newStudents.some(s => s.id === prevStudent.id);
                if (!exists) {
                    newStudents.push({
                        id: prevStudent.id,
                        nama: prevStudent.nama,
                        icNo: prevStudent.icNo,
                        kategoriElaun: prevStudent.kategoriElaun || '',
                        attendance: [] // Reset attendance
                    });
                    addedStudentsCount++;
                }
            });

            // Merge Class Info (Only fill empty fields)
            const classInfo = {
                bahasa: (attendanceRecord?.bahasa && attendanceRecord.bahasa !== 'Bahasa Melayu') ? attendanceRecord.bahasa : (previousData.bahasa || 'Bahasa Melayu'),
                hariMasa: attendanceRecord?.hariMasa || previousData.hariMasa || '',
                penaja: attendanceRecord?.penaja || previousData.penaja || '',
                kekerapan: (attendanceRecord?.kekerapan && attendanceRecord.kekerapan !== 'Mingguan') ? attendanceRecord.kekerapan : (previousData.kekerapan || 'Mingguan'),
                pic: attendanceRecord?.pic || previousData.pic || '',
                noTelPIC: attendanceRecord?.noTelPIC || previousData.noTelPIC || '',
                catatan: attendanceRecord?.catatan || previousData.catatan || ''
            };

            // Save merged data
            await saveAttendance({
                workers: newWorkers,
                students: newStudents,
                ...classInfo
            });

            const totalAdded = addedWorkersCount + addedStudentsCount;
            if (totalAdded > 0) {
                alert(`Berjaya menyalin data! (${addedWorkersCount} petugas, ${addedStudentsCount} pelajar ditambah).`);
            } else {
                alert('Tiada data baharu untuk disalin. Semua petugas dan pelajar sudah wujud.');
            }

        } catch (error) {
            console.error('Error copying from previous month:', error);
            alert('Ralat menyalin data dari bulan sebelumnya.');
        }
    };


    // Fetch lists when modals open
    const openWorkerModal = async () => {
        if (allWorkers.length === 0) {
            try {
                const snap = await getDocs(query(collection(db, 'workers')));
                setAllWorkers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) {
                console.error("Error loading workers:", err);
                alert("Gagal memuatkan senarai pekerja.");
            }
        }
        setIsWorkerModalOpen(true);
    };

    const openStudentModal = async () => {
        if (allStudents.length === 0) {
            try {
                const snap = await getDocs(query(collection(db, 'submissions'), where('status', '==', 'active')));
                setAllStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (err) {
                console.error("Error loading students:", err);
                alert("Gagal memuatkan senarai pelajar.");
            }
        }
        setIsStudentModalOpen(true);
    };

    const daysInMonth = (yearMonth) => {
        if (!yearMonth) return 31;
        const [y, m] = yearMonth.split('-');
        return new Date(y, m, 0).getDate();
    };

    const getDayName = (yearMonth, day) => {
        if (!yearMonth) return '';
        const [y, m] = yearMonth.split('-');
        const date = new Date(y, parseInt(m) - 1, day);
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return dayNames[date.getDay()];
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

                        {/* Copy from Previous Month Button */}
                        {selectedClassId && selectedMonth && (
                            <div className="flex items-end">
                                <button
                                    onClick={() => setIsCopyConfirmModalOpen(true)}
                                    className="bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700 flex items-center text-sm"
                                    title="Salin data dari bulan sebelumnya"
                                >
                                    <Copy className="h-4 w-4 mr-1.5" />
                                    Salin Dari Bulan Lepas
                                </button>
                            </div>
                        )}

                        <div className="ml-auto flex items-center bg-blue-50 px-4 py-2 rounded text-blue-700 text-sm">
                            <FileText className="h-4 w-4 mr-2" />
                            <span>Laporan & Pembayaran Auto-Generated</span>
                        </div>
                    </div>

                    {/* Class Information Card */}
                    {selectedClassId && attendanceRecord && (() => {
                        const selectedClass = classes.find(c => c.id === selectedClassId);
                        if (!selectedClass) return null;

                        return (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm p-4 mb-6">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 flex items-center">
                                            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                                            {selectedClass.nama}
                                        </h3>
                                        <p className="text-sm text-gray-600 mt-1 flex items-center">
                                            <MapPin className="h-4 w-4 mr-1" />
                                            {selectedClass.lokasi}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${selectedClass.jenis === 'Online' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                            {selectedClass.jenis}
                                        </span>
                                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                            {selectedClass.tahap}
                                        </span>
                                        <button
                                            onClick={openClassInfoModal}
                                            className="ml-2 p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                            title="Edit maklumat kelas bulanan"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 pt-3 border-t border-blue-200">
                                    {attendanceRecord.bahasa && (
                                        <div className="bg-white bg-opacity-60 rounded p-2">
                                            <div className="text-xs text-gray-500 font-medium">Bahasa</div>
                                            <div className="text-sm text-gray-900 mt-0.5">{attendanceRecord.bahasa}</div>
                                        </div>
                                    )}
                                    {attendanceRecord.hariMasa && (
                                        <div className="bg-white bg-opacity-60 rounded p-2">
                                            <div className="text-xs text-gray-500 font-medium">Hari & Masa</div>
                                            <div className="text-sm text-gray-900 mt-0.5">{attendanceRecord.hariMasa}</div>
                                        </div>
                                    )}
                                    {attendanceRecord.kekerapan && (
                                        <div className="bg-white bg-opacity-60 rounded p-2">
                                            <div className="text-xs text-gray-500 font-medium">Kekerapan Kelas</div>
                                            <div className="text-sm text-gray-900 mt-0.5">{attendanceRecord.kekerapan}</div>
                                        </div>
                                    )}
                                    {attendanceRecord.penaja && (
                                        <div className="bg-white bg-opacity-60 rounded p-2">
                                            <div className="text-xs text-gray-500 font-medium">Penaja</div>
                                            <div className="text-sm text-gray-900 mt-0.5">{attendanceRecord.penaja}</div>
                                        </div>
                                    )}
                                    {attendanceRecord.pic && (
                                        <div className="bg-white bg-opacity-60 rounded p-2">
                                            <div className="text-xs text-gray-500 font-medium">PIC</div>
                                            <div className="text-sm text-gray-900 mt-0.5">{attendanceRecord.pic}</div>
                                        </div>
                                    )}
                                    {attendanceRecord.noTelPIC && (
                                        <div className="bg-white bg-opacity-60 rounded p-2">
                                            <div className="text-xs text-gray-500 font-medium">No Tel PIC</div>
                                            <div className="text-sm text-gray-900 mt-0.5">{attendanceRecord.noTelPIC}</div>
                                        </div>
                                    )}
                                </div>

                                {attendanceRecord.catatan && (
                                    <div className="mt-3 pt-3 border-t border-blue-200">
                                        <div className="text-xs text-gray-500 font-medium mb-1">Catatan</div>
                                        <div className="text-sm text-gray-700 bg-white bg-opacity-60 rounded p-2">{attendanceRecord.catatan}</div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

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
                                                <th className="p-2 text-left w-24 border-r text-xs">Kategori Elaun</th>
                                                {daysArray.map(d => (
                                                    <th key={d} className="p-1 w-10 text-center border-r font-normal text-gray-500">
                                                        <div className="font-medium text-gray-700">{d}</div>
                                                        <div className="text-[9px] text-gray-400 mt-0.5">{getDayName(selectedMonth, d)}</div>
                                                    </th>
                                                ))}
                                                <th className="p-2 text-center w-16 bg-gray-50 font-bold sticky right-0">Jum</th>
                                                <th className="p-2 w-10 sticky right-0"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attendanceRecord?.workers?.length === 0 ? (
                                                <tr><td colSpan={totalDays + 5} className="p-8 text-center text-gray-400">Tiada pekerja disenaraikan.</td></tr>
                                            ) : (
                                                attendanceRecord?.workers?.map((worker) => (
                                                    <tr key={worker.id} className="border-b hover:bg-gray-50">
                                                        <td className="p-2 sticky left-0 bg-white border-r font-medium truncate">{worker.nama}</td>
                                                        <td className="p-2 border-r">{worker.role}</td>
                                                        <td className="p-2 border-r text-xs">
                                                            {worker.kategoriElaun && (
                                                                <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-[8.4px] leading-tight">
                                                                    {worker.kategoriElaun}
                                                                </span>
                                                            )}
                                                        </td>
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
                                                <th className="p-2 text-left w-24 border-r text-xs">Kategori Elaun</th>
                                                {daysArray.map(d => (
                                                    <th key={d} className="p-1 w-10 text-center border-r font-normal text-gray-500">
                                                        <div className="font-medium text-gray-700">{d}</div>
                                                        <div className="text-[9px] text-gray-400 mt-0.5">{getDayName(selectedMonth, d)}</div>
                                                    </th>
                                                ))}
                                                <th className="p-2 text-center w-16 bg-gray-50 font-bold sticky right-0">Jum</th>
                                                <th className="p-2 w-10 sticky right-0"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {attendanceRecord?.students?.length === 0 ? (
                                                <tr><td colSpan={totalDays + 5} className="p-8 text-center text-gray-400">Tiada pelajar disenaraikan.</td></tr>
                                            ) : (
                                                attendanceRecord?.students?.map((student) => (
                                                    <tr key={student.id} className="border-b hover:bg-gray-50">
                                                        <td className="p-2 sticky left-0 bg-white border-r font-medium truncate" title={student.nama}>{student.nama}</td>
                                                        <td className="p-2 border-r text-gray-500 truncate" title={student.icNo}>{student.icNo}</td>
                                                        <td className="p-2 border-r text-xs">
                                                            {student.kategoriElaun && (
                                                                <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-[8.4px] leading-tight">
                                                                    {student.kategoriElaun}
                                                                </span>
                                                            )}
                                                        </td>
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
                                {filteredWorkers.map(w => {
                                    // Fallback: If worker has no state, checking if location matches a class in that state
                                    const classInfo = classes.find(c => c.lokasi === w.lokasi);
                                    const displayNegeri = w.negeri || classInfo?.negeri || '';

                                    return (
                                        <button
                                            key={w.id}
                                            onClick={() => handleAddWorker(w)}
                                            className="w-full text-left p-3 hover:bg-gray-50 border rounded flex justify-between items-center"
                                        >
                                            <div>
                                                <div className="font-medium">{w.nama}</div>
                                                <div className="text-sm text-gray-500">
                                                    {w.peranan}
                                                    {w.lokasi ? ` • ${w.lokasi}` : ''}
                                                    {displayNegeri ? `, ${displayNegeri}` : ''}
                                                </div>
                                            </div>
                                            <Plus className="h-5 w-5 text-emerald-600" />
                                        </button>
                                    );
                                })}
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
                                            <div className="text-sm text-gray-500">
                                                {s.namaIslam} • {s.noKP}
                                                {s.lokasi ? ` • ${s.lokasi}` : ''}
                                                {(s.negeri || s.negeriCawangan) ? `, ${s.negeri || s.negeriCawangan}` : ''}
                                            </div>
                                        </div>
                                        <Plus className="h-5 w-5 text-blue-600" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Class Info Edit Modal */}
                {isClassInfoModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-gray-900">Maklumat Kelas Bulanan</h3>
                                <button onClick={() => setIsClassInfoModalOpen(false)}><X className="h-6 w-6 text-gray-400" /></button>
                            </div>

                            <div className="space-y-4">
                                {/* Bahasa */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Bahasa</label>
                                    <select
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={classInfoForm.bahasa}
                                        onChange={(e) => setClassInfoForm({ ...classInfoForm, bahasa: e.target.value })}
                                    >
                                        <option value="Bahasa Melayu">Bahasa Melayu</option>
                                        <option value="English">English</option>
                                        <option value="中文">中文 (Chinese)</option>
                                        <option value="தமிழ்">தமிழ் (Tamil)</option>
                                    </select>
                                </div>

                                {/* Hari & Masa */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Hari & Masa</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={classInfoForm.hariMasa}
                                        onChange={(e) => setClassInfoForm({ ...classInfoForm, hariMasa: e.target.value })}
                                        placeholder="cth: Ahad 8:00 PM - 10:00 PM"
                                    />
                                </div>

                                {/* Kekerapan Kelas */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Kekerapan Kelas</label>
                                    <select
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={classInfoForm.kekerapan}
                                        onChange={(e) => setClassInfoForm({ ...classInfoForm, kekerapan: e.target.value })}
                                    >
                                        <option value="Harian">Harian</option>
                                        <option value="Mingguan">Mingguan</option>
                                        <option value="Dua Minggu Sekali">Dua Minggu Sekali</option>
                                        <option value="Bulanan">Bulanan</option>
                                    </select>
                                </div>

                                {/* Penaja */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Penaja</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={classInfoForm.penaja}
                                        onChange={(e) => setClassInfoForm({ ...classInfoForm, penaja: e.target.value })}
                                        placeholder="cth: Lembaga Zakat Selangor"
                                    />
                                </div>

                                {/* PIC */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">PIC (Person In Charge)</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={classInfoForm.pic}
                                        onChange={(e) => setClassInfoForm({ ...classInfoForm, pic: e.target.value })}
                                        placeholder="cth: Ustaz Ahmad bin Ali"
                                    />
                                </div>

                                {/* No Tel PIC */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">No Tel PIC</label>
                                    <input
                                        type="tel"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={classInfoForm.noTelPIC}
                                        onChange={(e) => setClassInfoForm({ ...classInfoForm, noTelPIC: e.target.value })}
                                        placeholder="cth: 012-3456789"
                                    />
                                </div>

                                {/* Catatan */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Catatan</label>
                                    <textarea
                                        rows="3"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                                        value={classInfoForm.catatan}
                                        onChange={(e) => setClassInfoForm({ ...classInfoForm, catatan: e.target.value })}
                                        placeholder="Catatan tambahan tentang kelas bulan ini..."
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={() => setIsClassInfoModalOpen(false)}
                                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleSaveClassInfo}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                                >
                                    <Save className="h-4 w-4 mr-1" /> Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirm Copy Modal */}
                {isCopyConfirmModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-md w-full p-6">
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Salin Data Bulan Lepas</h3>
                                <p className="text-gray-600 text-sm">
                                    Adakah anda mahu menyalin maklumat kelas, senarai petugas, dan senarai mualaf dari bulan sebelumnya?
                                </p>
                                <p className="text-blue-600 text-xs mt-2 font-medium">
                                    Nota: Data sedia ada tidak akan dipadam. Petugas/pelajar yang belum ada akan ditambah, dan info kelas yang kosong akan diisi.
                                </p>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setIsCopyConfirmModalOpen(false)}
                                    className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleCopyFromPreviousMonth}
                                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                                >
                                    Ya, Salin Data
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
