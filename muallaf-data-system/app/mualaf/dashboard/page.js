'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import { getRateCategories } from '@/lib/supabase/database';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
    Filter, BarChart2, DollarSign, Users, BookOpen, X, ChevronRight, Eye, Download,
    LayoutDashboard, User, FileText, Map as MapIcon, Search, Printer, ChevronDown, MapPin
} from 'lucide-react';
import BorangF2 from '@/components/BorangF2';

export default function AttendanceDashboard() {
    const { user, role, profile, loading: authLoading } = useAuth();

    // UI State
    const [activeTab, setActiveTab] = useState('overview'); // overview, tracker, reports, geo
    const [showPrintView, setShowPrintView] = useState(false);
    const [printData, setPrintData] = useState([]);

    // Raw Data
    const [allClasses, setAllClasses] = useState({});
    const [allRecords, setAllRecords] = useState([]);
    const [rates, setRates] = useState([]);

    // Details Maps (For Search)
    const [workerDetails, setWorkerDetails] = useState({});
    const [studentDetails, setStudentDetails] = useState({});

    const [loading, setLoading] = useState(false);

    // Filters
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState(''); // '' = All
    const [selectedDay, setSelectedDay] = useState('');     // '' = All
    const [selectedNegeri, setSelectedNegeri] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');

    // Derived Data for Display
    const [tableData, setTableData] = useState([]);
    const [stats, setStats] = useState({
        totalClasses: 0,
        totalWorkers: 0,
        totalStudents: 0,
        totalAllowance: 0
    });

    // Drill Down State
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedRecordDetails, setSelectedRecordDetails] = useState(null);

    // Search State (Tracker)
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [showAllPeople, setShowAllPeople] = useState(false); // Controls dropdown visibility
    const searchWrapperRef = useRef(null);

    // Handle outside click to close dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
                setShowAllPeople(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    // 1. Initial Data Load & Refetch on Year Change
    useEffect(() => {
        if (authLoading) return;

        const loadData = async () => {
            setLoading(true);
            try {
                // Determine Access
                const isRestricted = role !== 'admin' && !profile?.assignedLocations?.includes('All');
                const allowedLocations = isRestricted ? (profile?.assignedLocations || []) : null;

                // Fetch Rates (Once)
                if (rates.length === 0) {
                    const { data: ratesData } = await getRateCategories();
                    setRates(ratesData || []);
                }

                // Fetch Classes (Once)
                // Fetch Classes (Once)
                if (Object.keys(allClasses).length === 0) {
                    const { data: classesData, error: classesError } = await supabase.from('classes').select('*');
                    if (classesError) throw classesError;

                    const classesMap = {};
                    classesData.forEach(data => {
                        // FILTER: Check Access
                        if (isRestricted && !allowedLocations.includes(data.lokasi)) return;
                        classesMap[data.id] = { ...data };
                    });
                    setAllClasses(classesMap);
                }

                // Fetch Workers Details (Once)
                if (Object.keys(workerDetails).length === 0) {
                    const { data: workersData, error: workersError } = await supabase.from('workers').select('*');
                    if (workersError) throw workersError;

                    const wMap = {};
                    workersData.forEach(data => wMap[data.id] = data);
                    setWorkerDetails(wMap);
                }

                // Fetch Students Details (Active) (Once)
                if (Object.keys(studentDetails).length === 0) {
                    const { data: studentsData, error: studentsError } = await supabase
                        .from('submissions')
                        .select('*')
                        .eq('status', 'active');
                    if (studentsError) throw studentsError;

                    const sMap = {};
                    studentsData.forEach(data => sMap[data.id] = data);
                    setStudentDetails(sMap);
                }

                // Fetch Attendance Records (Filtered by Year)
                let queryBuilder = supabase.from('attendance_records').select('*');

                if (selectedYear) {
                    const startMonth = `${selectedYear}-01`;
                    const endMonth = `${selectedYear}-12`;
                    queryBuilder = queryBuilder.gte('month', startMonth).lte('month', endMonth);
                } else {
                    const currentYr = new Date().getFullYear();
                    const startMonth = `${currentYr}-01`;
                    const endMonth = `${currentYr}-12`;
                    queryBuilder = queryBuilder.gte('month', startMonth).lte('month', endMonth);
                }

                const { data: recordsData, error: recordsError } = await queryBuilder;
                if (recordsError) throw recordsError;

                const records = [];
                recordsData.forEach(data => {
                    const idParts = data.id.split('_');
                    if (idParts.length >= 2) {
                        const datePart = idParts.pop(); // YYYY-MM
                        if (/^\d{4}-\d{2}$/.test(datePart)) {
                            const [year, month] = datePart.split('-');
                            const classId = idParts.join('_');
                            records.push({
                                ...data,
                                classId,
                                year,
                                month,
                            });
                        }
                    }
                });
                setAllRecords(records);

            } catch (error) {
                console.error("Error loading data:", error);
                if (error.code === 'resource-exhausted') {
                    alert("Kouta pangkalan data habis. (Quota Exceeded)");
                }
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [authLoading, selectedYear, role, profile]); // Re-run when year changes

    // 2. Compute Available Options (Cascading Filters)
    const filterOptions = useMemo(() => {
        // Hardcode years since we only fetch one year at a time now
        const currentYear = new Date().getFullYear();
        const years = [String(currentYear - 1), String(currentYear), String(currentYear + 1)]; // 3 year window

        const months = new Set();
        const days = new Set();
        const negeris = new Set();
        const locations = new Set();

        const recordsAfterYear = allRecords.filter(r => !selectedYear || String(r.year) === String(selectedYear));
        recordsAfterYear.forEach(r => {
            if (r.month) months.add(String(r.month));
        });

        const recordsAfterMonth = recordsAfterYear.filter(r => !selectedMonth || String(r.month) === String(selectedMonth));

        recordsAfterMonth.forEach(record => {
            const cls = allClasses[record.classId];
            if (cls) {
                if (cls.negeri) negeris.add(cls.negeri);
                if (selectedNegeri && cls.negeri !== selectedNegeri) return;
                if (cls.lokasi) locations.add(cls.lokasi);
            }

            if (selectedMonth) {
                [...(record.workers || []), ...(record.students || [])].forEach(p => {
                    (p.attendance || []).forEach(d => {
                        const val = parseInt(d, 10);
                        if (!isNaN(val) && val >= 1 && val <= 31) days.add(val);
                    });
                });
            }
        });

        return {
            years: years,
            months: Array.from(months).sort(),
            days: Array.from(days).sort((a, b) => parseInt(a) - parseInt(b)),
            negeris: Array.from(negeris).sort(),
            locations: Array.from(locations).sort()
        };
    }, [allRecords, allClasses, selectedYear, selectedMonth, selectedNegeri]);

    // 3. Filter Data & Calculate Stats
    useEffect(() => {
        if (!allRecords.length) return;

        let filtered = allRecords;

        if (selectedYear) filtered = filtered.filter(r => r.year === selectedYear);
        if (selectedMonth) filtered = filtered.filter(r => r.month === selectedMonth);

        filtered = filtered.filter(r => {
            const cls = allClasses[r.classId];
            if (!cls) return false;
            if (selectedNegeri && cls.negeri !== selectedNegeri) return false;
            if (selectedLocation && cls.lokasi !== selectedLocation) return false;
            return true;
        });

        const aggregatedData = {};

        filtered.forEach(record => {
            const cls = allClasses[record.classId];
            if (!cls) return;

            const key = !selectedYear
                ? `${record.year}_${record.classId}`
                : record.id;

            if (!aggregatedData[key]) {
                aggregatedData[key] = {
                    id: key,
                    year: record.year,
                    month: !selectedYear ? 'Semua' : record.month,
                    namaKelas: cls.nama,
                    lokasi: cls.lokasi,
                    negeri: cls.negeri || 'Tiada Negeri',
                    bahasa: record.bahasa || '-',
                    hariMasa: record.hariMasa || '-',
                    kekerapan: record.kekerapan || '-',
                    penaja: record.penaja || '-',
                    bilPetugas: 0,
                    bilPelajar: 0,
                    jumlahElaun: 0,
                    participants: []
                };
            }

            let classWorkersCount = 0;
            let classStudentsCount = 0;
            let classAllowance = 0;
            const recordParticipants = [];

            const processPerson = (person, type) => {
                const attendance = person.attendance || [];
                let daysAttended = attendance.length;
                let isPresent = daysAttended > 0;

                if (selectedDay) {
                    const dayStr = selectedDay.toString().padStart(2, '0');
                    if (!attendance.includes(dayStr)) {
                        isPresent = false;
                        daysAttended = 0;
                    } else {
                        daysAttended = 1;
                    }
                }

                if (isPresent) {
                    if (type === 'worker') classWorkersCount++;
                    else classStudentsCount++;

                    let allowance = 0;
                    const rate = rates.find(r => r.kategori === person.kategoriElaun && r.jenis === (type === 'worker' ? 'petugas' : 'mualaf'));

                    if (rate) {
                        if (rate.jenisPembayaran === 'bayaran/bulan') {
                            allowance = rate.jumlahElaun;
                        } else {
                            allowance = rate.jumlahElaun * daysAttended;
                        }
                    }
                    classAllowance += allowance;

                    const details = type === 'worker' ? (workerDetails[person.id] || {}) : (studentDetails[person.id] || {});

                    recordParticipants.push({
                        id: person.id,
                        name: person.nama || person.namaAsal || details.nama || details.namaAsal || details.namaPenuh || 'Tiada Nama',
                        role: type === 'worker' ? 'Petugas' : 'Pelajar',
                        category: person.kategoriElaun || details.kategoriElaun || details.kategori || '-',
                        sessions: daysAttended,
                        totalSessionsInMonth: attendance.length,
                        allowance: allowance,
                        // Enhanced details for Borang F2
                        noIc: details.noKP || details.noIc || '-',
                        bank: details.bank || details.namaBank || '-',
                        noAkaun: details.noAkaun || '-',
                        namaDiBank: details.namaDiBank || details.namaPenuh || details.nama || '-'
                    });
                }
            };

            (record.workers || []).forEach(w => processPerson(w, 'worker'));
            (record.students || []).forEach(s => processPerson(s, 'student'));

            aggregatedData[key].bilPetugas += classWorkersCount;
            aggregatedData[key].bilPelajar += classStudentsCount;
            aggregatedData[key].jumlahElaun += classAllowance;
            aggregatedData[key].participants.push(...recordParticipants);
        });

        const rows = Object.values(aggregatedData);

        let totalClasses = 0;
        let totalWorkers = 0;
        let totalStudents = 0;
        let totalAllowance = 0;

        rows.forEach(r => {
            totalClasses++;
            totalWorkers += r.bilPetugas;
            totalStudents += r.bilPelajar;
            totalAllowance += r.jumlahElaun;
        });

        // Sort: Year -> Month -> Negeri -> Lokasi -> Kelas
        rows.sort((a, b) =>
            a.year.localeCompare(b.year) ||
            a.month.localeCompare(b.month) ||
            a.negeri.localeCompare(b.negeri) ||
            a.lokasi.localeCompare(b.lokasi) ||
            a.namaKelas.localeCompare(b.namaKelas)
        );

        setTableData(rows);
        setStats({ totalClasses, totalWorkers, totalStudents, totalAllowance });

    }, [allRecords, allClasses, selectedYear, selectedMonth, selectedDay, selectedNegeri, selectedLocation, rates]);

    const getMonthName = (m) => {
        if (m === 'Semua') return 'Semua';
        return new Date(2000, parseInt(m) - 1, 1).toLocaleString('ms-MY', { month: 'long' }); // Changed to long for report
    };

    const getGroupedParticipants = (participants) => {
        const merged = {};
        participants.forEach(p => {
            if (!merged[p.id]) {
                merged[p.id] = { ...p };
            } else {
                merged[p.id].sessions += p.sessions;
                merged[p.id].totalSessionsInMonth += p.totalSessionsInMonth || 0;
                merged[p.id].allowance += p.allowance;
            }
        });

        const list = Object.values(merged);
        const petugas = list.filter(p => p.role === 'Petugas');
        const pelajar = list.filter(p => p.role === 'Pelajar');

        const totalPetugasSessions = petugas.reduce((acc, p) => acc + p.sessions, 0);
        const totalPetugasAllowance = petugas.reduce((acc, p) => acc + p.allowance, 0);

        const totalPelajarSessions = pelajar.reduce((acc, p) => acc + p.sessions, 0);
        const totalPelajarAllowance = pelajar.reduce((acc, p) => acc + p.allowance, 0);

        return {
            petugas,
            pelajar,
            subtotals: {
                petugas: { sessions: totalPetugasSessions, allowance: totalPetugasAllowance },
                pelajar: { sessions: totalPelajarSessions, allowance: totalPelajarAllowance }
            }
        };
    };

    /* --- Individual Tracker Logic --- */
    const allPeople = useMemo(() => {
        const people = new Map();

        allRecords.forEach(record => {
            const classLocation = allClasses[record.classId]?.lokasi || '-';

            // Workers
            (record.workers || []).forEach(p => {
                if (!people.has(p.id)) {
                    const details = workerDetails[p.id] || {};
                    const role = details.peranan || details.kategoriElaun || p.kategoriElaun || 'Petugas';
                    const ic = details.noKP || details.noIc || '-';
                    const name = details.nama || p.nama || p.namaAsal || 'Tiada Nama';
                    const location = details.lokasi || classLocation;

                    people.set(p.id, {
                        id: p.id,
                        name,
                        role,
                        type: 'Petugas',
                        category: p.kategoriElaun || 'N/A',
                        ic,
                        location
                    });
                }
            });

            // Students
            (record.students || []).forEach(p => {
                if (!people.has(p.id)) {
                    const details = studentDetails[p.id] || {};
                    const role = details.kategori || p.kategoriElaun || 'Pelajar';
                    const ic = details.noIc || details.noKP || '-';
                    const name = details.namaPenuh || details.nama || p.nama || p.namaAsal || 'Tiada Nama';
                    const location = details.lokasi || classLocation;

                    people.set(p.id, {
                        id: p.id,
                        name,
                        role,
                        type: 'Pelajar',
                        category: p.kategoriElaun || 'N/A',
                        ic,
                        location
                    });
                }
            });
        });

        // Sort alphabetically
        return Array.from(people.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [allRecords, workerDetails, studentDetails, allClasses]);

    const filteredPeople = useMemo(() => {
        // If search focused but empty query, return top 50 (or all if small) for scrolling
        if (!searchQuery) {
            return showAllPeople ? allPeople.slice(0, 100) : [];
        }

        const q = searchQuery.toLowerCase();
        return allPeople.filter(p =>
            (p.name && p.name.toLowerCase().includes(q)) ||
            (p.ic && p.ic.includes(q)) ||
            (p.role && p.role.toLowerCase().includes(q))
        ).slice(0, 50); // Limit results for performance
    }, [searchQuery, showAllPeople, allPeople]);

    const personStats = useMemo(() => {
        if (!selectedPerson) return null;

        const monthlyData = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, sessions: 0, allowance: 0 }));

        allRecords.forEach(record => {
            if (selectedYear && record.year !== selectedYear) return;

            const mIndex = parseInt(record.month) - 1;
            if (mIndex >= 0 && mIndex < 12) {
                const person = [...(record.workers || []), ...(record.students || [])].find(p => p.id === selectedPerson.id);
                if (person) {
                    const sessions = (person.attendance || []).length;
                    monthlyData[mIndex].sessions += sessions;

                    // Allow Calc
                    let allowance = 0;
                    // Use person.kategoriElaun from the record to be historically accurate for that month
                    // But fetch rate configuration based on it

                    const isWorker = (record.workers || []).some(w => w.id === selectedPerson.id);
                    const type = isWorker ? 'petugas' : 'mualaf';

                    // Note: Use person.kategoriElaun from record (historical)
                    const preciseRate = rates.find(r => r.kategori === person.kategoriElaun && r.jenis === type);

                    if (preciseRate) {
                        if (preciseRate.jenisPembayaran === 'bayaran/bulan') {
                            allowance = preciseRate.jumlahElaun;
                        } else {
                            allowance = preciseRate.jumlahElaun * sessions;
                        }
                    }
                    monthlyData[mIndex].allowance += allowance;
                }
            }
        });
        return monthlyData;
    }, [selectedPerson, allRecords, selectedYear, rates]);


    /* --- Geo Analysis Logic --- */
    const geoStats = useMemo(() => {
        const stats = {};
        Object.values(allClasses).forEach(cls => {
            const state = cls.negeri || 'Tiada Negeri';
            if (!stats[state]) stats[state] = 0;
            stats[state]++;
        });
        // Convert to array
        return Object.entries(stats).map(([state, count]) => ({ state, count })).sort((a, b) => b.count - a.count);
    }, [allClasses]);


    /* --- Reports Logic --- */
    const fetchBankDetails = async (rows) => {
        // ... (Logic kept same, or optimized using pre-fetched maps if rewrite needed, but keeping for safety as report might need fresh data)
        // Actually, we can assume workerDetails/studentDetails map is enough?
        // Let's stick to existing fetch logic for reports to ensure absolute freshness and complete data for ALL rows (maps might be partial if filtered?)
        // Wait, mMaps are loaded fully in useEffect. So we could use them.
        // But for safety and minimal change risk, keep existing function. 
        // Just need to import it or define it. It IS defined in the file.
        // I will copy the implementation.

        setLoading(true);
        const detailsMap = new Map();

        // Use PRE-FETCHED maps to speed up
        rows.forEach(row => {
            row.participants.forEach(p => {
                let d = null;
                if (p.role === 'Petugas') d = workerDetails[p.id];
                else d = studentDetails[p.id];

                if (d) {
                    detailsMap.set(p.id, {
                        bank: d.bank,
                        noAkaun: d.noAkaun,
                        noIc: d.noIc || d.noKP, // Handle both
                        namaDiBank: d.namaDiBank || d.nama || d.namaPenuh
                    });
                }
            });
        });

        setLoading(false);
        return detailsMap;
    };

    const downloadReport = async () => {
        const detailsMap = await fetchBankDetails(tableData);

        // Flatten for CSV
        const flattenParticipants = [];
        tableData.forEach(row => {
            row.participants.forEach(p => {
                const details = detailsMap.get(p.id) || {};
                flattenParticipants.push({
                    ...p,
                    ...details,
                    className: row.namaKelas,
                    month: row.month
                });
            });
        });

        const headers = ['Kelas', 'Bulan', 'Nama', 'Peranan', 'Bank', 'No Akaun', 'Nama Di Bank', 'Jumlah Elaun (RM)'];
        const csvRows = [headers.join(',')];

        flattenParticipants.forEach(item => {
            csvRows.push([
                `"${item.className}"`,
                item.month,
                `"${item.name}"`,
                item.role,
                `"${item.bank || '-'}"`,
                `'${item.noAkaun || '-'}'`,
                `"${item.namaDiBank || '-'}"`,
                item.allowance.toFixed(2)
            ].join(','));
        });

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `laporan_elaun_${selectedYear || 'semua'}_${selectedMonth || 'semua'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrintReport = async () => {
        const detailsMap = await fetchBankDetails(tableData);

        // Enrich tableData with participant details
        const enrichedData = tableData.map(row => ({
            ...row,
            participants: row.participants.map(p => ({
                ...p,
                ...(detailsMap.get(p.id) || {})
            }))
        }));

        setPrintData(enrichedData);
        setShowPrintView(true);
    };

    // --- PRINT VIEW OVERLAY ---
    if (showPrintView) {
        return (
            <div className="min-h-screen bg-slate-200">
                {/* Print Toolbar - Hidden when printing */}
                <div className="bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 print:hidden shadow-2xl border-b border-white/10">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-black flex items-center tracking-tight">
                            <FileText className="mr-2 text-emerald-400" />
                            Pratonton Laporan F2 <span className="ml-2 px-2 py-0.5 bg-white/10 rounded text-xs font-bold text-slate-300 border border-white/10">{printData.length} Kelas</span>
                        </h2>
                        <div className="flex items-center mt-1 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                            <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" /> {selectedNegeri || 'Semua'}</span>
                            <span className="mx-2 opacity-30">|</span>
                            <span>{selectedMonth ? getMonthName(selectedMonth).toUpperCase() : 'SEMUA BULAN'} {selectedYear}</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => window.print()}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-black flex items-center transition-all shadow-lg active:scale-95"
                        >
                            <Printer className="mr-2 h-5 w-5" /> Cetak Laporan
                        </button>
                        <button
                            onClick={() => setShowPrintView(false)}
                            className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-6 py-2.5 rounded-xl font-bold flex items-center transition-all active:scale-95"
                        >
                            <X className="mr-2 h-5 w-5 text-slate-400" /> Kembali
                        </button>
                    </div>
                </div>

                <div className="p-12 print:p-0">
                    {printData.map((cls, idx) => (
                        <div key={cls.id + idx} className="mb-12 print:mb-0">
                            <BorangF2
                                classData={{
                                    namaKelas: cls.namaKelas,
                                    negeri: cls.negeri,
                                    lokasi: cls.lokasi,
                                    participants: cls.participants,
                                    bahasa: cls.bahasa,
                                    hariMasa: cls.hariMasa,
                                    kekerapan: cls.kekerapan,
                                    penaja: cls.penaja
                                }}
                                month={getMonthName(cls.month)}
                                year={cls.year}
                                index={idx + 1}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                <Navbar />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header & Tabs */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center mb-4">
                            <BarChart2 className="h-6 w-6 mr-2 text-indigo-600" />
                            Dashboard Analitik & Kewangan
                        </h1>
                        <div className="flex space-x-2 border-b border-gray-200 overflow-x-auto">
                            {[
                                { id: 'overview', label: 'Ringkasan & Data', icon: LayoutDashboard },
                                { id: 'tracker', label: 'Prestasi Individu', icon: User },
                                { id: 'geo', label: 'Analisis Geografi', icon: MapIcon },
                                { id: 'reports', label: 'Laporan Kewangan', icon: FileText },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                        ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    <tab.icon className="h-4 w-4 mr-2" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filters (Global) */}
                    <div className="bg-white rounded-lg shadow p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {/* Year */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Tahun</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => { setSelectedYear(e.target.value); setSelectedMonth(''); }}
                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm p-2 border focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">Semua Tahun</option>
                                    {filterOptions.years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Month */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Bulan</label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => { setSelectedMonth(e.target.value); setSelectedDay(''); }}
                                    disabled={!selectedYear}
                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm p-2 border focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
                                >
                                    <option value="">Semua Bulan</option>
                                    {filterOptions.months.map(m => (
                                        <option key={m} value={m}>{getMonthName(m)}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Day */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Hari</label>
                                <select
                                    value={selectedDay}
                                    onChange={(e) => setSelectedDay(e.target.value)}
                                    disabled={!selectedMonth}
                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm p-2 border focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
                                >
                                    <option value="">Semua Hari</option>
                                    {filterOptions.days.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Negeri & Location */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Negeri</label>
                                <select
                                    value={selectedNegeri}
                                    onChange={(e) => { setSelectedNegeri(e.target.value); setSelectedLocation(''); }}
                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm p-2 border focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">Semua Negeri</option>
                                    {filterOptions.negeris.map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Lokasi</label>
                                <select
                                    value={selectedLocation}
                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm p-2 border focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="">Semua Lokasi</option>
                                    {filterOptions.locations.map(l => (
                                        <option key={l} value={l}>{l}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* --- TAB CONTENT: OVERVIEW --- */}
                    {activeTab === 'overview' && (
                        <>
                            {/* Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
                                    <div className="text-sm text-gray-500">Jumlah Data Kelas</div>
                                    <div className="text-2xl font-bold">{stats.totalClasses}</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
                                    <div className="text-sm text-gray-500">Aktiviti Petugas</div>
                                    <div className="text-2xl font-bold">{stats.totalWorkers}</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
                                    <div className="text-sm text-gray-500">Aktiviti Pelajar</div>
                                    <div className="text-2xl font-bold">{stats.totalStudents}</div>
                                </div>
                                <div className="bg-white p-4 rounded-lg shadow border-l-4 border-emerald-500">
                                    <div className="text-sm text-gray-500">Anggaran Elaun</div>
                                    <div className="text-2xl font-bold">RM {stats.totalAllowance.toFixed(2)}</div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                {loading ? (
                                    <div className="p-8 text-center text-gray-500">Memuatkan data...</div>
                                ) : tableData.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">Tiada rekod dijumpai.</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tahun</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bulan</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Negeri</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lokasi</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Petugas</th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pelajar</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Elaun (RM)</th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tindakan</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {tableData.map((row) => (
                                                    <tr key={row.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedRecordDetails(row); setDetailsModalOpen(true); }}>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.year}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getMonthName(row.month)}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.negeri}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.lokasi}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.namaKelas}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.bilPetugas}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900">{row.bilPelajar}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-emerald-600">{row.jumlahElaun.toFixed(2)}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            <button className="text-blue-600 hover:text-blue-900"><Eye className="h-5 w-5" /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* --- TAB CONTENT: INDIVIDUAL TRACKER --- */}
                    {activeTab === 'tracker' && (
                        <div className="bg-white rounded-lg shadow p-6" style={{ minHeight: '400px' }}>
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Penjejak Prestasi Individu</h2>
                            <div className="mb-6 relative" ref={searchWrapperRef}>
                                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari nama, No. KP atau kategori..."
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 shadow-sm"
                                    value={searchQuery}
                                    onFocus={() => setShowAllPeople(true)}
                                    onChange={(e) => { setSearchQuery(e.target.value); setShowAllPeople(true); }}
                                />
                                {(searchQuery || showAllPeople) && filteredPeople.length > 0 && !selectedPerson && (
                                    <div className="absolute z-10 w-full bg-white border rounded-lg shadow-xl mt-1 max-h-80 overflow-y-auto divide-y divide-gray-100">
                                        {filteredPeople.map(p => (
                                            <button
                                                key={p.id}
                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex justify-between items-center group transition"
                                                onClick={() => { setSelectedPerson(p); setSearchQuery(''); setShowAllPeople(false); }}
                                            >
                                                <div>
                                                    <div className="font-semibold text-gray-900">{p.name}</div>
                                                    <div className="text-xs text-gray-500 flex items-center mt-1">
                                                        <span className="bg-gray-100 px-2 py-0.5 rounded mr-2">{p.category !== 'N/A' ? p.category : p.type}</span>
                                                        <span className="mr-2">IC: {p.ic}</span>
                                                        <span className="flex items-center"><MapIcon className="w-3 h-3 mr-1" />{p.location}</span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {(searchQuery || showAllPeople) && filteredPeople.length === 0 && !selectedPerson && (
                                    <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 p-4 text-center text-gray-500">
                                        Tiada rekod dijumpai.
                                    </div>
                                )}
                            </div>

                            {selectedPerson && personStats ? (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-start border-b pb-4">
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-900">{selectedPerson.name}</h3>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <span className="px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                    {selectedPerson.role}
                                                </span>
                                                <span className="px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                                    IC: {selectedPerson.ic}
                                                </span>
                                                <span className="px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                                    Lokasi: {selectedPerson.location}
                                                </span>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedPerson(null)} className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium">
                                            <Search className="w-3 h-3 mr-1" />
                                            Cari orang lain
                                        </button>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-4">Trend Kehadiran (Tahun {selectedYear || new Date().getFullYear()})</h4>
                                        <div className="h-64 flex items-end justify-between space-x-2">
                                            {personStats.map((stat, i) => (
                                                <div key={i} className="flex-1 flex flex-col items-center group">
                                                    <div
                                                        className={`w-full max-w-[40px] rounded-t transition-all ${stat.sessions > 0 ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-100'}`}
                                                        style={{ height: `${Math.max(stat.sessions * 10, 4)}px` }} // Scaled height
                                                    >
                                                        {stat.sessions > 0 && (
                                                            <div className="opacity-0 group-hover:opacity-100 absolute -mt-8 text-xs font-bold bg-black text-white px-2 py-1 rounded">
                                                                {stat.sessions} sesi
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-500 mt-2">{getMonthName(stat.month)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 font-medium">Jumlah Anggaran Elaun (Tahun Ini):</span>
                                            <span className="text-2xl font-bold text-emerald-600">
                                                RM {personStats.reduce((acc, curr) => acc + curr.allowance, 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                !showAllPeople && !selectedPerson && (
                                    <div className="text-center py-12 text-gray-400">
                                        <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>Klik kotak carian untuk melihat senarai atau taip nama.</p>
                                    </div>
                                )
                            )}
                        </div>
                    )}

                    {/* --- TAB CONTENT: GEO ANALYSIS --- */}
                    {activeTab === 'geo' && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-6">Taburan Kelas Mengikut Negeri</h2>
                            <div className="space-y-4">
                                {geoStats.map((item, i) => (
                                    <div key={item.state} className="relative">
                                        <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                                            <span>{item.state}</span>
                                            <span>{item.count} kelas</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                            <div
                                                className="bg-blue-600 h-4 rounded-full"
                                                style={{ width: `${(item.count / Math.max(...geoStats.map(s => s.count))) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                                {geoStats.length === 0 && <p className="text-center text-gray-500">Tiada data kelas.</p>}
                            </div>
                        </div>
                    )}

                    {/* --- TAB CONTENT: REPORTS --- */}
                    {activeTab === 'reports' && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-2">Penjanaan Laporan Kewangan</h2>
                            <p className="text-gray-500 mb-6 text-sm">
                                Muat turun laporan pembayaran elaun lengkap dengan maklumat bank untuk tujuan kewangan.
                                Analisis berdasarkan penapisan semasa (Tahun: {selectedYear || 'Semua'}, Bulan: {getMonthName(selectedMonth)}).
                            </p>

                            <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
                                <h4 className="font-bold text-yellow-800 text-sm mb-1">Ringkasan Laporan Semasa:</h4>
                                <ul className="text-sm text-yellow-700 list-disc list-inside">
                                    <li>Jumlah Penerima: <strong>{tableData.reduce((acc, r) => acc + r.participants.length, 0)}</strong> orang</li>
                                    <li>Jumlah Pembayaran: <strong>RM {stats.totalAllowance.toFixed(2)}</strong></li>
                                </ul>
                            </div>

                            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                                <button
                                    onClick={downloadReport}
                                    className="flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium transition-colors"
                                >
                                    <Download className="h-5 w-5 mr-2" />
                                    Muat Turun CSV
                                </button>
                                <button
                                    onClick={handlePrintReport}
                                    className="flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                                >
                                    <Printer className="h-5 w-5 mr-2" />
                                    Jana Borang F2 (Cetak)
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Spreadsheet Modal (Reused) */}
                    {detailsModalOpen && selectedRecordDetails && (
                        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-lg max-w-5xl w-full p-6 max-h-[90vh] flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{selectedRecordDetails.namaKelas}</h3>
                                        <p className="text-sm text-gray-500">
                                            {selectedRecordDetails.lokasi}, {selectedRecordDetails.negeri} | {getMonthName(selectedRecordDetails.month)} {selectedRecordDetails.year}
                                        </p>
                                    </div>
                                    <button onClick={() => setDetailsModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-auto">
                                    {(() => {
                                        const { petugas, pelajar, subtotals } = getGroupedParticipants(selectedRecordDetails.participants);
                                        return (
                                            <table className="min-w-full divide-y divide-gray-200 border">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori Elaun</th>
                                                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Bil. Sesi Hadir</th>
                                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Elaun (RM)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {/* Petugas Section */}
                                                    <tr className="bg-green-50"><td colSpan="4" className="px-4 py-2 text-sm font-bold text-green-800">Senarai Petugas</td></tr>
                                                    {petugas.map((p) => (
                                                        <tr key={p.id}>
                                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-medium pl-8">{p.name}</td>
                                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{p.category}</td>
                                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-center">{p.sessions}</td>
                                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{p.allowance.toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                    {petugas.length === 0 && <tr><td colSpan="4" className="px-4 py-2 text-sm text-gray-500 italic pl-8">Tiada petugas.</td></tr>}
                                                    {/* Petugas Subtotal */}
                                                    <tr className="bg-green-100 font-semibold">
                                                        <td colSpan="2" className="px-4 py-2 text-sm text-right">Sub-Jumlah Petugas:</td>
                                                        <td className="px-4 py-2 text-center text-sm">{subtotals.petugas.sessions}</td>
                                                        <td className="px-4 py-2 text-right text-sm">{subtotals.petugas.allowance.toFixed(2)}</td>
                                                    </tr>

                                                    {/* Pelajar Section */}
                                                    <tr className="bg-purple-50"><td colSpan="4" className="px-4 py-2 text-sm font-bold text-purple-800">Senarai Pelajar</td></tr>
                                                    {pelajar.map((p) => (
                                                        <tr key={p.id}>
                                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 font-medium pl-8">{p.name}</td>
                                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{p.category}</td>
                                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-center">{p.sessions}</td>
                                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{p.allowance.toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                    {pelajar.length === 0 && <tr><td colSpan="4" className="px-4 py-2 text-sm text-gray-500 italic pl-8">Tiada pelajar.</td></tr>}
                                                    {/* Pelajar Subtotal */}
                                                    <tr className="bg-purple-100 font-semibold">
                                                        <td colSpan="2" className="px-4 py-2 text-sm text-right">Sub-Jumlah Pelajar:</td>
                                                        <td className="px-4 py-2 text-center text-sm">{subtotals.pelajar.sessions}</td>
                                                        <td className="px-4 py-2 text-right text-sm">{subtotals.pelajar.allowance.toFixed(2)}</td>
                                                    </tr>
                                                </tbody>
                                                <tfoot className="bg-gray-100 font-bold border-t-2 border-gray-300">
                                                    <tr>
                                                        <td colSpan="2" className="px-4 py-3 text-right text-sm">JUMLAH BESAR:</td>
                                                        <td className="px-4 py-3 text-center text-sm">
                                                            {subtotals.petugas.sessions + subtotals.pelajar.sessions}
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-sm text-emerald-600 text-base">
                                                            {(subtotals.petugas.allowance + subtotals.pelajar.allowance).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        );
                                    })()}
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={() => setDetailsModalOpen(false)}
                                        className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
