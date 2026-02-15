'use client';

import { useState, useEffect, Suspense } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Search, Save, UserPlus, FileText, CheckCircle, Trash2, Home, X, Check, Plus, Calendar, MapPin, Edit2, Copy, AlertCircle, ChevronDown, Download, Globe, Clock, User } from 'lucide-react';

function AttendancePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
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

    // Initial Load from URL
    useEffect(() => {
        if (!searchParams) return;
        const loc = searchParams.get('location');
        const month = searchParams.get('month');
        const clsId = searchParams.get('classId');

        if (loc) setSelectedLocation(loc);
        if (month) setSelectedMonth(month);
        if (clsId) setSelectedClassId(clsId);
    }, [searchParams]);

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
            const { data, error } = await supabase
                .from('classes')
                .select('*')
                .order('nama');

            if (data) {
                setClasses(data);
                const uniqueLocs = [...new Set(data.map(c => c.lokasi).filter(l => l))].sort();
                setLocations(uniqueLocs);
            } else if (error) {
                console.error("Error fetching classes:", error);
                // alert("Ralat memuatkan kelas: " + error.message);
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

    // Reset Class selection if Location changes - REMOVED to allow URL param persistence.
    // Instead handled in onChange of location select.
    // useEffect(() => {
    //    setSelectedClassId('');
    // }, [selectedLocation]);

    // Fetch Attendance Record when Class & Month change
    useEffect(() => {
        if (!selectedClassId || !selectedMonth) {
            setAttendanceRecord(null);
            return;
        }

        setLoading(true);
        const recordId = `${selectedClassId}_${selectedMonth}`;

        async function fetchRecord() {
            const { data, error } = await supabase
                .from('attendance_records')
                .select('*')
                .eq('id', recordId)
                .single();

            if (data) {
                setAttendanceRecord(data);

                // Auto-sync kategoriElaun if missing
                if (data.workers?.some(w => !w.kategoriElaun) || data.students?.some(s => !s.kategoriElaun)) {
                    setTimeout(() => syncKategoriElaunForRecord(data), 500);
                }
            } else {
                // Not found, init new
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
        }

        fetchRecord();
    }, [selectedClassId, selectedMonth]);

    // Sync kategoriElaun from profiles to attendance record
    const syncKategoriElaunForRecord = async (record) => {
        if (!record) return;

        let updated = false;

        // Optimisation: Fetch all needed workers/students in one go if possible, but for now map is ok for small arrays
        const updatedWorkers = await Promise.all(
            (record.workers || []).map(async (worker) => {
                if (!worker.kategoriElaun) {
                    const { data } = await supabase
                        .from('workers')
                        .select('kategoriElaun')
                        .eq('id', worker.id)
                        .single();

                    if (data) {
                        const newKategori = data.kategoriElaun || '';
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
                    const { data } = await supabase
                        .from('submissions')
                        .select('kategoriElaun')
                        .eq('id', student.id)
                        .single();

                    if (data) {
                        const newKategori = data.kategoriElaun || '';
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

            // Construct full object to save (merging with current state)
            const finalData = {
                ...attendanceRecord,
                ...newData,
                id: recordId,
                classId: selectedClassId, // ensure PK fields are present
                month: selectedMonth,
                updatedAt: new Date().toISOString()
            };

            setAttendanceRecord(finalData); // Optimistic Update

            const { error } = await supabase
                .from('attendance_records')
                .upsert(finalData);

            if (error) throw error;

        } catch (error) {
            console.error("Error saving:", error);
            alert("Ralat menyimpan e-kehadiran");
        }
    };

    // Toggle Attendance
    const toggleAttendance = (type, personId, day) => {
        if (!attendanceRecord) return;

        const listName = type === 'worker' ? 'workers' : 'students';
        const list = [...(attendanceRecord[listName] || [])];
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

        // Save to DB (Optimistic update happened via saveAttendance calling setAttendanceRecord first)
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
            const { data: previousData, error } = await supabase
                .from('attendance_records')
                .select('*')
                .eq('id', previousRecordId)
                .single();

            if (!previousData || error) {
                alert(`Tiada data untuk bulan sebelumnya (${previousMonth}).`);
                return;
            }

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
                const { data } = await supabase
                    .from('workers')
                    .select('*')
                    .order('nama');
                if (data) setAllWorkers(data);
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
                const { data } = await supabase
                    .from('submissions')
                    .select('*')
                    .eq('status', 'active')
                    .order('namaIslam');
                if (data) setAllStudents(data);
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

    const handleGenerateReport = () => {
        if (!selectedMonth || !selectedLocation) {
            alert("Sila pilih Lokasi dan Bulan untuk menjana laporan.");
            return;
        }
        const [year, month] = selectedMonth.split('-');
        const query = new URLSearchParams({
            tab: 'reports',
            view: 'print',
            year,
            month,
            location: selectedLocation,
            classId: selectedClassId // Pass classId for return navigation
        }).toString();
        router.push(`/mualaf/dashboard?${query}`);
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                <Navbar />

                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Header Controls (Redesigned) */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row items-end gap-4 mb-6">

                        {/* Wrapper for filters to keep them together */}
                        <div className="flex flex-col md:flex-row gap-4 w-full flex-grow">
                            {/* Location Selector */}
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Pilih Lokasi</label>
                                <div className="relative group">
                                    <select
                                        value={selectedLocation}
                                        onChange={(e) => {
                                            setSelectedLocation(e.target.value);
                                            setSelectedClassId(''); // Reset for manual change
                                        }}
                                        className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg pl-3 pr-10 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer hover:border-blue-300 shadow-sm"
                                    >
                                        <option value="">-- Sila Pilih --</option>
                                        {availableLocations.map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                    <MapPin className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 group-hover:text-blue-500 transition-colors pointer-events-none" />
                                </div>
                            </div>

                            {/* Class Selector */}
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Pilih Kelas</label>
                                <div className="relative group">
                                    <select
                                        value={selectedClassId}
                                        onChange={(e) => setSelectedClassId(e.target.value)}
                                        disabled={!selectedLocation}
                                        className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg pl-3 pr-10 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer hover:border-blue-300 shadow-sm disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                                    >
                                        <option value="">-- Sila Pilih Kelas --</option>
                                        {availableClasses.map(c => (
                                            <option key={c.id} value={c.id}>{c.nama} ({c.jenis})</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 group-hover:text-blue-500 transition-colors pointer-events-none" />
                                </div>
                            </div>

                            {/* Month Selector */}
                            <div className="w-40 flex-shrink-0">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Bulan</label>
                                <input
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full bg-white text-gray-900 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                />
                            </div>

                            {/* Copy from Previous Month Button */}
                            {selectedClassId && selectedMonth && (
                                <div className="flex-none">
                                    <label className="block text-[10px] font-bold text-transparent mb-1.5">&nbsp;</label>
                                    <button
                                        onClick={() => setIsCopyConfirmModalOpen(true)}
                                        className="h-[42px] bg-purple-600 hover:bg-purple-700 text-white px-4 rounded-lg flex items-center text-sm font-medium shadow-sm shadow-purple-200 transition-all transform active:scale-95 whitespace-nowrap"
                                        title="Salin data dari bulan sebelumnya"
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Salin Dari Bulan Lepas
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Report Button - Visible only if data loaded AND has participants */}
                        {selectedClassId && attendanceRecord && (attendanceRecord.workers?.length > 0 || attendanceRecord.students?.length > 0) && (
                            <div className="flex-none w-full lg:w-auto">
                                <label className="block text-[10px] font-bold text-transparent mb-1.5 hidden lg:block">&nbsp;</label>
                                <button
                                    onClick={handleGenerateReport}
                                    className="h-[42px] w-full lg:w-auto flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 rounded-lg text-sm font-medium transition-colors border border-blue-100"
                                >
                                    <FileText className="h-4 w-4 mr-2" />
                                    <span>Jana Borang F2 (Laporan & Pembayaran)</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Class Information Card */}
                    {selectedClassId && attendanceRecord && (() => {
                        const selectedClass = classes.find(c => c.id === selectedClassId);
                        if (!selectedClass) return null;

                        return (
                            <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-3 mb-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-bold text-gray-900">{selectedClass.nama}</h3>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${selectedClass.jenis === 'Online' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {selectedClass.jenis}
                                            </span>
                                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                                                {selectedClass.tahap}
                                            </span>
                                            <button onClick={openClassInfoModal} className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit maklumat kelas">
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-600">
                                            <div className="flex items-center" title="Lokasi">
                                                <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                                                {selectedClass.lokasi}
                                            </div>
                                            {attendanceRecord.bahasa && (
                                                <div className="flex items-center" title="Bahasa Pengantar">
                                                    <Globe className="h-3 w-3 mr-1.5 text-gray-400" />
                                                    <span className="text-gray-400 mr-1">Bahasa:</span> {attendanceRecord.bahasa}
                                                </div>
                                            )}
                                            {attendanceRecord.hariMasa && (
                                                <div className="flex items-center" title="Hari & Masa">
                                                    <Clock className="h-3 w-3 mr-1.5 text-gray-400" />
                                                    {attendanceRecord.hariMasa}
                                                </div>
                                            )}
                                            {attendanceRecord.pic && (
                                                <div className="flex items-center" title="Person In Charge">
                                                    <User className="h-3 w-3 mr-1.5 text-gray-400" />
                                                    <span className="text-gray-400 mr-1">PIC:</span> {attendanceRecord.pic}
                                                    {attendanceRecord.noTelPIC && <span className="text-gray-400 ml-1">({attendanceRecord.noTelPIC})</span>}
                                                </div>
                                            )}
                                            {attendanceRecord.penaja && (
                                                <div className="flex items-center" title="Penaja">
                                                    <span className="text-gray-400 mr-1 font-semibold text-[10px] uppercase">Penaja:</span> {attendanceRecord.penaja}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {attendanceRecord.catatan && (
                                    <div className="mt-2 pt-2 border-t border-gray-100 text-xs flex items-start text-gray-500">
                                        <span className="font-semibold mr-2 text-gray-400 uppercase text-[10px]">Catatan:</span>
                                        {attendanceRecord.catatan}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {selectedClassId && selectedMonth ? (
                        <div className="space-y-8">
                            {/* Workers Table */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                                    <h2 className="text-base font-bold text-gray-900 flex items-center">
                                        Maklumat Guru / Petugas / Sukarelawan
                                    </h2>
                                    <button
                                        onClick={openWorkerModal}
                                        className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-700 shadow-sm transition-all flex items-center"
                                    >
                                        <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Tambah
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase">
                                                <th className="p-3 text-left sticky left-0 bg-gray-50 z-10 w-48 font-semibold border-r border-gray-200 shadow-[1px_0_0_0_rgba(229,231,235,1)]">Nama</th>
                                                <th className="p-3 text-left w-24 font-semibold border-r border-gray-200">Peranan</th>
                                                <th className="p-3 text-left w-24 font-semibold border-r border-gray-200 text-[10px]">Kategori Elaun</th>
                                                {daysArray.map(d => (
                                                    <th key={d} className="p-1 w-9 text-center border-r border-gray-100 font-normal">
                                                        <div className="font-bold text-gray-700">{d}</div>
                                                        <div className="text-[9px] text-gray-400">{getDayName(selectedMonth, d)}</div>
                                                    </th>
                                                ))}
                                                <th className="p-2 text-center w-16 bg-gray-50 font-bold sticky right-0 border-l border-gray-200">Jum</th>
                                                <th className="p-2 w-10 sticky right-0 bg-gray-50"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {attendanceRecord?.workers?.length === 0 ? (
                                                <tr><td colSpan={totalDays + 5} className="p-8 text-center text-gray-400 italic">Tiada pekerja disenaraikan.</td></tr>
                                            ) : (
                                                attendanceRecord?.workers?.map((worker) => (
                                                    <tr key={worker.id} className="hover:bg-gray-50/80 transition-colors">
                                                        <td className="p-2.5 sticky left-0 bg-white border-r border-gray-200 font-medium text-gray-900 truncate shadow-[1px_0_0_0_rgba(229,231,235,1)]">{worker.nama}</td>
                                                        <td className="p-2.5 border-r border-gray-100 text-gray-600">{worker.role}</td>
                                                        <td className="p-2.5 border-r border-gray-100">
                                                            {worker.kategoriElaun ? (
                                                                <span className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded text-[9px] font-medium leading-tight inline-block text-center min-w-[50px]">
                                                                    {worker.kategoriElaun}
                                                                </span>
                                                            ) : (
                                                                <div className="flex items-center justify-center text-amber-500" title="Kategori Elaun tiada. Sila kemaskini profil untuk pengiraan tepat.">
                                                                    <AlertCircle className="h-4 w-4" />
                                                                </div>
                                                            )}
                                                        </td>
                                                        {daysArray.map(d => {
                                                            const isChecked = worker.attendance?.includes(d);
                                                            return (
                                                                <td key={d} className="p-0 text-center border-r border-gray-50 relative h-9">
                                                                    <label className="cursor-pointer w-full h-full flex items-center justify-center hover:bg-emerald-50/50 transition-colors">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="rounded-sm text-emerald-600 focus:ring-emerald-500/30 h-4 w-4 border-gray-300"
                                                                            checked={isChecked || false}
                                                                            onChange={() => toggleAttendance('worker', worker.id, d)}
                                                                        />
                                                                    </label>
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="p-2 text-center font-bold bg-gray-50/50 sticky right-0 border-l border-gray-100 text-emerald-600">
                                                            {worker.attendance?.length || 0}
                                                        </td>
                                                        <td className="p-2 text-center sticky right-0 bg-white">
                                                            <button onClick={() => handleRemovePerson('worker', worker.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50">
                                                                <Trash2 className="h-3.5 w-3.5" />
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
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                                    <h2 className="text-base font-bold text-gray-900 flex items-center">
                                        Maklumat Pelajar
                                    </h2>
                                    <button
                                        onClick={openStudentModal}
                                        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm transition-all flex items-center"
                                    >
                                        <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Tambah
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase">
                                                <th className="p-3 text-left sticky left-0 bg-gray-50 z-10 w-48 font-semibold border-r border-gray-200 shadow-[1px_0_0_0_rgba(229,231,235,1)]">Nama</th>
                                                <th className="p-3 text-left w-32 font-semibold border-r border-gray-200">Data Mualaf</th>
                                                <th className="p-3 text-left w-24 font-semibold border-r border-gray-200 text-[10px]">Kategori Elaun</th>
                                                {daysArray.map(d => (
                                                    <th key={d} className="p-1 w-9 text-center border-r border-gray-100 font-normal">
                                                        <div className="font-bold text-gray-700">{d}</div>
                                                        <div className="text-[9px] text-gray-400">{getDayName(selectedMonth, d)}</div>
                                                    </th>
                                                ))}
                                                <th className="p-2 text-center w-16 bg-gray-50 font-bold sticky right-0 border-l border-gray-200">Jum</th>
                                                <th className="p-2 w-10 sticky right-0 bg-gray-50"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {attendanceRecord?.students?.length === 0 ? (
                                                <tr><td colSpan={totalDays + 5} className="p-8 text-center text-gray-400 italic">Tiada pelajar disenaraikan.</td></tr>
                                            ) : (
                                                attendanceRecord?.students?.map((student) => (
                                                    <tr key={student.id} className="hover:bg-gray-50/80 transition-colors">
                                                        <td className="p-2.5 sticky left-0 bg-white border-r border-gray-200 font-medium text-gray-900 truncate shadow-[1px_0_0_0_rgba(229,231,235,1)]" title={student.nama}>{student.nama}</td>
                                                        <td className="p-2.5 border-r border-gray-100 text-gray-500 truncate" title={student.icNo}>{student.icNo}</td>
                                                        <td className="p-2.5 border-r border-gray-100">
                                                            {student.kategoriElaun ? (
                                                                <span className="bg-yellow-50 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded text-[9px] font-medium leading-tight inline-block text-center min-w-[50px]">
                                                                    {student.kategoriElaun}
                                                                </span>
                                                            ) : (
                                                                <div className="flex items-center justify-center text-amber-500" title="Kategori Elaun tiada. Sila kemaskini profil untuk pengiraan tepat.">
                                                                    <AlertCircle className="h-4 w-4" />
                                                                </div>
                                                            )}
                                                        </td>
                                                        {daysArray.map(d => {
                                                            const isChecked = student.attendance?.includes(d);
                                                            return (
                                                                <td key={d} className="p-0 text-center border-r border-gray-50 relative h-9">
                                                                    <label className="cursor-pointer w-full h-full flex items-center justify-center hover:bg-blue-50/50 transition-colors">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="rounded-sm text-blue-600 focus:ring-blue-500/30 h-4 w-4 border-gray-300"
                                                                            checked={isChecked || false}
                                                                            onChange={() => toggleAttendance('student', student.id, d)}
                                                                        />
                                                                    </label>
                                                                </td>
                                                            );
                                                        })}
                                                        <td className="p-2 text-center font-bold bg-gray-50/50 sticky right-0 border-l border-gray-100 text-blue-600">
                                                            {student.attendance?.length || 0}
                                                        </td>
                                                        <td className="p-2 text-center sticky right-0 bg-white">
                                                            <button onClick={() => handleRemovePerson('student', student.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50">
                                                                <Trash2 className="h-3.5 w-3.5" />
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
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-dashed border-gray-300">
                            <div className="bg-gray-50 p-4 rounded-full mb-4">
                                <Calendar className="h-10 w-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Sila pilih Lokasi, Kelas dan Bulan</h3>
                            <p className="text-gray-500 text-sm max-w-sm text-center">Isi pilihan di bahagian atas untuk mula merekod kehadiran bagi kelas dan bulan yang berkenaan.</p>
                        </div>
                    )}
                </div>

                {/* Modals are kept similar but can be refined if needed, focusing on main page design first */}
                {/* Worker Modal */}
                {isWorkerModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-lg w-full p-6 h-[80vh] flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Tambah Guru / Petugas</h3>
                                <button onClick={() => setIsWorkerModalOpen(false)}><X className="h-6 w-6 text-gray-400" /></button>
                            </div>
                            <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <input
                                        type="text"
                                        placeholder="Cari nama..."
                                        className="w-full pl-9 pr-4 py-2 border rounded-md"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto border rounded-md">
                                {filteredWorkers.map(w => (
                                    <div key={w.id} className="p-3 border-b hover:bg-gray-50 flex justify-between items-center">
                                        <div>
                                            <div className="font-medium text-sm">{w.nama}</div>
                                            <div className="text-xs text-gray-500">{w.peranan} • {w.lokasi}</div>
                                        </div>
                                        <button
                                            onClick={() => handleAddWorker(w)}
                                            className="bg-emerald-100 text-emerald-700 p-1.5 rounded hover:bg-emerald-200"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Student Modal */}
                {isStudentModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-lg w-full p-6 h-[80vh] flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900">Tambah Pelajar</h3>
                                <button onClick={() => setIsStudentModalOpen(false)}><X className="h-6 w-6 text-gray-400" /></button>
                            </div>
                            <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <input
                                        type="text"
                                        placeholder="Cari nama / kp..."
                                        className="w-full pl-9 pr-4 py-2 border rounded-md"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto border rounded-md">
                                {filteredStudents.map(s => (
                                    <div key={s.id} className="p-3 border-b hover:bg-gray-50 flex justify-between items-center">
                                        <div>
                                            <div className="font-medium text-sm">{s.namaAsal || s.namaIslam}</div>
                                            <div className="text-xs text-gray-500">{s.noKP}</div>
                                        </div>
                                        <button
                                            onClick={() => handleAddStudent(s)}
                                            className="bg-blue-100 text-blue-700 p-1.5 rounded hover:bg-blue-200"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Class Info Modal */}
                {isClassInfoModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-lg w-full p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Maklumat Kelas Bulan Ini</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Bahasa Pengantar</label>
                                        <select
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                            value={classInfoForm.bahasa}
                                            onChange={(e) => setClassInfoForm({ ...classInfoForm, bahasa: e.target.value })}
                                        >
                                            <option>Bahasa Melayu</option>
                                            <option>Bahasa Inggeris</option>
                                            <option>Bahasa Cina</option>
                                            <option>Bahasa Tamil</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Kekerapan</label>
                                        <select
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                            value={classInfoForm.kekerapan}
                                            onChange={(e) => setClassInfoForm({ ...classInfoForm, kekerapan: e.target.value })}
                                        >
                                            <option>Mingguan</option>
                                            <option>Dwi-Mingguan</option>
                                            <option>Bulanan</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Hari & Masa</label>
                                    <input
                                        type="text"
                                        placeholder="cth: Sabtu, 9.00 Pagi"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={classInfoForm.hariMasa}
                                        onChange={(e) => setClassInfoForm({ ...classInfoForm, hariMasa: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Penaja</label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        value={classInfoForm.penaja}
                                        onChange={(e) => setClassInfoForm({ ...classInfoForm, penaja: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">PIC</label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                            value={classInfoForm.pic}
                                            onChange={(e) => setClassInfoForm({ ...classInfoForm, pic: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">No Tel PIC</label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                            value={classInfoForm.noTelPIC}
                                            onChange={(e) => setClassInfoForm({ ...classInfoForm, noTelPIC: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Catatan</label>
                                    <textarea
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        rows="3"
                                        value={classInfoForm.catatan}
                                        onChange={(e) => setClassInfoForm({ ...classInfoForm, catatan: e.target.value })}
                                    ></textarea>
                                </div>
                                <div className="flex justify-end space-x-3 mt-4">
                                    <button
                                        onClick={() => setIsClassInfoModalOpen(false)}
                                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleSaveClassInfo}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                                    >
                                        Simpan
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirmation Modal for Copy */}
                {isCopyConfirmModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg max-w-sm w-full p-6 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
                                <Copy className="h-6 w-6 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Salin dari bulan lepas?</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Ini akan menyalin senarai petugas, pelajar, dan maklumat kelas dari bulan sebelumnya ({getPreviousMonth(selectedMonth)}).
                                Data sedia ada tidak akan dipadam.
                            </p>
                            <div className="flex justify-center space-x-3">
                                <button
                                    onClick={() => setIsCopyConfirmModalOpen(false)}
                                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleCopyFromPreviousMonth}
                                    className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                                >
                                    Ya, Salin
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </ProtectedRoute>
    );
}

export default function AttendancePage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>}>
            <AttendancePageContent />
        </Suspense>
    );
}
