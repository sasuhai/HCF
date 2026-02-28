'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import { MapPin, Clock, Users, FileText, X, Filter, Calendar, Search } from 'lucide-react';
import Link from 'next/link';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';

// Approximate major public holidays for Malaysia (2026/2027)
const PUBLIC_HOLIDAYS = [
    { title: "Tahun Baru", start: "2026-01-01", type: "holiday" },
    { title: "Tahun Baru Cina", start: "2026-02-17", end: "2026-02-19", type: "holiday" },
    { title: "Nuzul Al-Quran", start: "2026-03-04", type: "holiday" },
    { title: "Hari Raya Aidilfitri", start: "2026-03-20", end: "2026-03-22", type: "holiday" },
    { title: "Hari Pekerja", start: "2026-05-01", type: "holiday" },
    { title: "Hari Raya Aidiladha", start: "2026-05-27", type: "holiday" },
    { title: "Hari Keputeraan YDP Agong", start: "2026-06-01", type: "holiday" },
    { title: "Awal Muharram", start: "2026-06-16", type: "holiday" },
    { title: "Hari Kebangsaan", start: "2026-08-31", type: "holiday" },
    { title: "Maulidur Rasul", start: "2026-08-26", type: "holiday" },
    { title: "Hari Malaysia", start: "2026-09-16", type: "holiday" },
    { title: "Deepavali", start: "2026-11-08", type: "holiday" },
    { title: "Krismas", start: "2026-12-25", type: "holiday" },
    { title: "Tahun Baru", start: "2027-01-01", type: "holiday" },
    // Add more if needed
];

export default function KalendarProgram() {
    const { role } = useAuth();
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [states, setStates] = useState([]);
    const [selectedStates, setSelectedStates] = useState(null);
    const [selectedKategori, setSelectedKategori] = useState(null);
    const [selectedAnjuran, setSelectedAnjuran] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [selectedProgramTitles, setSelectedProgramTitles] = useState(null);
    const [showHolidays, setShowHolidays] = useState(true);

    // Modal State
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [initialDateStr, setInitialDateStr] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const calendarRef = useRef(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statesRes, programsRes] = await Promise.all([
                supabase.from('states').select('name').order('name'),
                supabase.from('programs').select('*').order('tarikh_mula', { ascending: true })
            ]);

            if (statesRes.data) {
                setStates(statesRes.data.map(s => ({ value: s.name, label: s.name })));
            }

            if (programsRes.data) {
                setPrograms(programsRes.data);
            }
        } catch (err) {
            console.error("Error loading data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const dateParam = params.get('date');
            if (dateParam) {
                setInitialDateStr(dateParam);
            }
            const stateParam = params.get('state');
            if (stateParam) {
                setSelectedStates([{ value: stateParam, label: stateParam }]);
            }
            setIsReady(true);
        }
    }, []);

    const getCurrentDateStr = () => {
        if (calendarRef.current) {
            const date = calendarRef.current.getApi().getDate();
            // Convert to local YYYY-MM-DD string to prevent timezone rollbacks
            const offset = date.getTimezoneOffset() * 60000;
            return new Date(date.getTime() - offset).toISOString().split('T')[0];
        }
        return '';
    };

    const handleEventClick = (clickInfo) => {
        const eventId = clickInfo.event.id;
        if (eventId.startsWith('holiday')) return; // Do not open modal for simple holidays

        const prog = programs.find(p => p.id === eventId);
        if (prog) {
            setSelectedEvent(prog);
        }
    };

    // Prepare dynamic options
    const kategoriOptions = Array.from(new Set(programs.map(p => p.kategori_utama).filter(Boolean))).map(k => ({ value: k, label: k }));
    const statusOptions = Array.from(new Set(programs.map(p => p.status_program).filter(Boolean))).map(s => ({ value: s, label: s }));
    const anjuranOptions = Array.from(new Set(programs.flatMap(p => Array.isArray(p.anjuran) ? p.anjuran : (p.anjuran ? [p.anjuran] : [])))).filter(Boolean).map(a => ({ value: a, label: a }));
    const programTitleOptions = Array.from(new Set(programs.map(p => p.nama_program).filter(Boolean))).map(t => ({ value: t, label: t }));

    const stateFilters = selectedStates ? selectedStates.map(s => s.value) : [];
    const kategoriFilters = selectedKategori ? selectedKategori.map(s => s.value) : [];
    const anjuranFilters = selectedAnjuran ? selectedAnjuran.map(s => s.value) : [];
    const statusFilters = selectedStatus ? selectedStatus.map(s => s.value) : [];
    const programTitleFilters = selectedProgramTitles ? selectedProgramTitles.map(s => s.value) : [];

    const filteredPrograms = programs.filter(prog => {
        if (stateFilters.length > 0 && !stateFilters.includes(prog.negeri)) return false;
        if (kategoriFilters.length > 0 && !kategoriFilters.includes(prog.kategori_utama)) return false;
        if (statusFilters.length > 0 && !statusFilters.includes(prog.status_program)) return false;

        if (programTitleFilters.length > 0) {
            const progName = (prog.nama_program || '').toLowerCase();
            const matchesTitle = programTitleFilters.some(filter =>
                progName.includes(filter.toLowerCase())
            );
            if (!matchesTitle) return false;
        }

        if (anjuranFilters.length > 0) {
            const progAnjuran = Array.isArray(prog.anjuran) ? prog.anjuran : (prog.anjuran ? [prog.anjuran] : []);
            if (!anjuranFilters.some(a => progAnjuran.includes(a))) return false;
        }

        return true;
    });

    const facets = useMemo(() => {
        const getCounts = (filterType) => {
            const othersFiltered = programs.filter(p => {
                const s = stateFilters;
                const k = kategoriFilters;
                const a = anjuranFilters;
                const st = statusFilters;
                const pt = programTitleFilters;

                if (filterType !== 'negeri' && s.length > 0 && !s.includes(p.negeri)) return false;
                if (filterType !== 'kategori' && k.length > 0 && !k.includes(p.kategori_utama)) return false;
                if (filterType !== 'status' && st.length > 0 && !st.includes(p.status_program)) return false;
                if (pt.length > 0) {
                    const pName = (p.nama_program || '').toLowerCase();
                    const matchesTitle = pt.some(filter => pName.includes(filter.toLowerCase()));
                    if (!matchesTitle) return false;
                }
                if (filterType !== 'anjuran' && a.length > 0) {
                    const pA = Array.isArray(p.anjuran) ? p.anjuran : (p.anjuran ? [p.anjuran] : []);
                    if (!a.some(val => pA.includes(val))) return false;
                }
                return true;
            });

            const cnts = {};
            othersFiltered.forEach(p => {
                if (filterType === 'negeri' && p.negeri) cnts[p.negeri] = (cnts[p.negeri] || 0) + 1;
                else if (filterType === 'kategori' && p.kategori_utama) cnts[p.kategori_utama] = (cnts[p.kategori_utama] || 0) + 1;
                else if (filterType === 'status' && p.status_program) cnts[p.status_program] = (cnts[p.status_program] || 0) + 1;
                else if (filterType === 'anjuran') {
                    const pA = Array.isArray(p.anjuran) ? p.anjuran : (p.anjuran ? [p.anjuran] : []);
                    pA.forEach(val => cnts[val] = (cnts[val] || 0) + 1);
                }
            });
            return cnts;
        };

        return {
            negeri: getCounts('negeri'),
            kategori: getCounts('kategori'),
            anjuran: getCounts('anjuran'),
            status: getCounts('status')
        };
    }, [programs, stateFilters, kategoriFilters, anjuranFilters, statusFilters]);

    const formatOptionLabel = (filterType) => ({ label, value }, { context }) => {
        const count = facets[filterType][label] || 0;
        return (
            <div className="flex justify-between items-center w-full min-w-0">
                <span className="truncate mr-2">{label}</span>
                {count > 0 && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${context === 'value' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                        {count}
                    </span>
                )}
            </div>
        );
    };

    const customSelectStyles = {
        control: (base, state) => ({ ...base, minHeight: '38px', borderRadius: '0.75rem', borderColor: state.isFocused ? '#eab308' : '#e2e8f0', boxShadow: state.isFocused ? '0 0 0 2px rgba(234, 179, 8, 0.2)' : 'none', '&:hover': { borderColor: '#eab308' }, backgroundColor: 'white', fontSize: '13px', transition: 'all 0.2s ease' }),
        menu: (base) => ({ ...base, borderRadius: '0.75rem', overflow: 'hidden', zIndex: 9999, fontSize: '13px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0' }),
        menuPortal: base => ({ ...base, zIndex: 9999 }),
        multiValue: (base) => ({ ...base, backgroundColor: '#fef9c3', borderRadius: '0.375rem', border: '1px solid #fef08a' }),
        multiValueLabel: (base) => ({ ...base, color: '#854d0e', fontWeight: 600, fontSize: '12px', padding: '2px 6px' }),
        multiValueRemove: (base) => ({ ...base, color: '#854d0e', ':hover': { backgroundColor: '#fde047', color: '#713f12' } }),
        option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? '#fef9c3' : 'white', color: state.isFocused ? '#854d0e' : '#334155', cursor: 'pointer', '&:active': { backgroundColor: '#fef08a' } })
    };

    const events = [];

    if (showHolidays) {
        PUBLIC_HOLIDAYS.forEach((hol, index) => {
            events.push({
                id: `holiday-${index}`,
                title: hol.title,
                start: hol.start,
                end: hol.end,
                allDay: true,
                display: 'background',
                backgroundColor: '#fef3c7', // amber-100
                textColor: '#92400e', // amber-800
                className: 'opacity-40 rounded-lg',
                extendedProps: { isHoliday: true }
            });
            // Text representation on top
            events.push({
                id: `holidayText-${index}`,
                title: '🎉 ' + hol.title,
                start: hol.start,
                end: hol.end,
                allDay: true,
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                textColor: '#b45309', // amber-700
                className: 'font-sans font-medium text-[10px] text-center border-0 shadow-none hover:bg-transparent pointer-events-none mt-1',
                extendedProps: { isHoliday: true }
            });
        });
    }

    filteredPrograms.forEach(prog => {
        const isDone = prog.status_program === 'Selesai' || prog.status_program === 'Done';
        const isCancelled = prog.status_program === 'Dibatalkan' || prog.status_program === 'Cancelled';

        let bgColor = '#fffbeb'; // amber-50
        let borderColor = '#fde68a'; // amber-200
        let textColor = '#92400e'; // amber-900

        if (isDone) {
            bgColor = '#f8fafc'; // slate-50
            borderColor = '#cbd5e1'; // slate-300
            textColor = '#334155'; // slate-700
        } else if (isCancelled) {
            bgColor = '#fef2f2'; // red-50
            borderColor = '#fecaca'; // red-200
            textColor = '#7f1d1d'; // red-900
        }

        const startDate = prog.tarikh_mula || '';
        const endDate = prog.tarikh_tamat || '';

        let start = startDate;
        let end = endDate;
        let allDay = true;

        if (startDate && prog.masa_mula) {
            start = `${startDate}T${formatTimeForCalendar(prog.masa_mula)}`;
            allDay = false;
        }

        if (endDate && prog.masa_tamat) {
            // Need to handle multi-day with specific time. Fullcalendar uses T
            end = `${endDate}T${formatTimeForCalendar(prog.masa_tamat)}`;
            allDay = false;
        } else if (!endDate && prog.masa_tamat && startDate) {
            end = `${startDate}T${formatTimeForCalendar(prog.masa_tamat)}`;
        } else if (endDate && startDate !== endDate) {
            // Include next day for inclusive all-day events
            const d = new Date(endDate);
            d.setDate(d.getDate() + 1);
            end = d.toISOString().split('T')[0];
            allDay = true;
        }

        if (!start) return; // Skip invalid events

        events.push({
            id: prog.id,
            title: prog.nama_program || 'Tiada Nama',
            start: start,
            end: end,
            allDay: allDay,
            display: 'block',
            backgroundColor: bgColor,
            borderColor: borderColor,
            textColor: textColor,
            className: 'shadow-sm rounded-md text-[10px] font-sans font-medium cursor-pointer transition-all px-1.5 py-0.5 border hover:shadow hover:-translate-y-0.5',
            extendedProps: {
                negeri: prog.negeri,
                tempat: prog.tempat,
                masaMula: prog.masa_mula,
                masaTamat: prog.masa_tamat
            }
        });
    });

    function formatTimeForCalendar(timeStr) {
        if (!timeStr) return '00:00:00';
        // Convert various time formats to HH:MM:00
        let [time, modifier] = timeStr.toLowerCase().split(' ');
        if (!modifier && timeStr.includes('m')) {
            modifier = timeStr.slice(-2);
            time = timeStr.slice(0, -2).trim();
        }

        let [hours, minutes] = time.split(':');
        if (!minutes) minutes = '00';

        // Remove text from minutes if merged like "30pm" to "30"
        minutes = minutes.replace(/[^\d]/g, '');

        if (hours === '12') hours = '00';
        if (modifier === 'pm') hours = parseInt(hours, 10) + 12;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-50/50 pt-16 selection:bg-yellow-200 selection:text-yellow-900 font-sans">
                <Navbar />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
                    {/* Header Banner */}
                    <div className="bg-slate-900 rounded-[2rem] p-6 sm:p-10 mb-8 shadow-2xl relative overflow-hidden text-white border border-slate-800">
                        {/* Decorative background shapes */}
                        <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 animate-pulse"></div>
                        <div className="absolute left-0 bottom-0 w-[300px] h-[300px] bg-slate-500/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>

                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 border-b border-white/10 pb-8">
                                <div className="space-y-4">
                                    <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 shadow-lg">
                                        <span className="flex h-2.5 w-2.5 rounded-full bg-yellow-400 animate-pulse"></span>
                                        <span className="text-xs font-bold text-yellow-100 tracking-wider uppercase">Kalendar Pintar HCF</span>
                                    </div>
                                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight drop-shadow-md">
                                        Kalendar <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-300">Aktiviti</span>
                                    </h1>
                                    <p className="text-sm font-medium text-slate-300 max-w-xl leading-relaxed">
                                        Pantau & rancang kesemua program secara bersepadu. Klik pada mana-mana acara untuk butiran lengkap mengenai lokasi, masa, dan rekod program.
                                    </p>
                                </div>

                                <div
                                    className="flex items-center space-x-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 shadow-lg cursor-pointer group hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1"
                                    onClick={() => setShowHolidays(!showHolidays)}
                                >
                                    <div className={`relative w-10 h-5 transition-colors duration-300 ease-in-out rounded-full shadow-inner ${showHolidays ? 'bg-yellow-500' : 'bg-slate-600'}`}>
                                        <span className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-bounce shadow-md ${showHolidays ? 'transform translate-x-5' : ''}`}></span>
                                    </div>
                                    <span className="text-sm text-white font-bold select-none tracking-wide">Papar Cuti Umum</span>
                                </div>
                            </div>

                            {/* Filters Row */}
                            <div className="flex flex-col gap-4">
                                <div className="w-full">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center">
                                        <Search className="w-3.5 h-3.5 mr-1 text-yellow-500" /> Carian Nama Program
                                    </label>
                                    <CreatableSelect
                                        isMulti
                                        options={programTitleOptions}
                                        value={selectedProgramTitles}
                                        onChange={setSelectedProgramTitles}
                                        placeholder="Taip untuk mencari nama program..."
                                        formatCreateLabel={(inputValue) => `Cari "${inputValue}"`}
                                        className="text-sm shadow-lg rounded-xl border-0 text-slate-800"
                                        styles={customSelectStyles}
                                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="w-full">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center">
                                            <Filter className="w-3.5 h-3.5 mr-1 text-yellow-500" /> Negeri
                                        </label>
                                        <Select
                                            isMulti
                                            options={states}
                                            value={selectedStates}
                                            onChange={setSelectedStates}
                                            placeholder="Semua Negeri"
                                            className="text-sm shadow-lg rounded-xl border-0 text-slate-800"
                                            styles={customSelectStyles}
                                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                            formatOptionLabel={formatOptionLabel('negeri')}
                                        />
                                    </div>
                                    <div className="w-full">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center">
                                            <Filter className="w-3.5 h-3.5 mr-1 text-yellow-500" /> Kategori
                                        </label>
                                        <Select
                                            isMulti
                                            options={kategoriOptions}
                                            value={selectedKategori}
                                            onChange={setSelectedKategori}
                                            placeholder="Semua Kategori"
                                            className="text-sm shadow-lg rounded-xl border-0 text-slate-800"
                                            styles={customSelectStyles}
                                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                            formatOptionLabel={formatOptionLabel('kategori')}
                                        />
                                    </div>
                                    <div className="w-full">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center">
                                            <Filter className="w-3.5 h-3.5 mr-1 text-yellow-500" /> Anjuran
                                        </label>
                                        <Select
                                            isMulti
                                            options={anjuranOptions}
                                            value={selectedAnjuran}
                                            onChange={setSelectedAnjuran}
                                            placeholder="Semua Anjuran"
                                            className="text-sm shadow-lg rounded-xl border-0 text-slate-800"
                                            styles={customSelectStyles}
                                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                            formatOptionLabel={formatOptionLabel('anjuran')}
                                        />
                                    </div>
                                    <div className="w-full">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center">
                                            <Filter className="w-3.5 h-3.5 mr-1 text-yellow-500" /> Status
                                        </label>
                                        <Select
                                            isMulti
                                            options={statusOptions}
                                            value={selectedStatus}
                                            onChange={setSelectedStatus}
                                            placeholder="Semua Status"
                                            className="text-sm shadow-lg rounded-xl border-0 text-slate-800"
                                            styles={customSelectStyles}
                                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                            formatOptionLabel={formatOptionLabel('status')}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Calendar Card */}
                    <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-slate-200 p-4 sm:p-8 animate-fade-in-up delay-100">
                        <div className="flex flex-wrap gap-4 mb-8 px-6 py-4 bg-slate-50/80 rounded-2xl border border-slate-200/60 shadow-inner">
                            <div className="flex items-center space-x-2.5">
                                <span className="w-3.5 h-3.5 rounded-full bg-yellow-100 border-[3px] border-yellow-400 shrink-0 shadow-sm"></span>
                                <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-600">Akan Datang</span>
                            </div>
                            <div className="flex items-center space-x-2.5">
                                <span className="w-3.5 h-3.5 rounded-full bg-slate-100 border-[3px] border-slate-400 shrink-0 shadow-sm"></span>
                                <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-600">Selesai</span>
                            </div>
                            <div className="flex items-center space-x-2.5">
                                <span className="w-3.5 h-3.5 rounded-full bg-red-100 border-[3px] border-red-400 shrink-0 shadow-sm"></span>
                                <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-600">Batal / Tangguh</span>
                            </div>
                            <div className="flex items-center space-x-2.5">
                                <span className="w-3.5 h-3.5 rounded-full bg-amber-100 border-[3px] border-amber-500 shrink-0 shadow-sm opacity-60"></span>
                                <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-600">Cuti Umum</span>
                            </div>
                        </div>

                        {loading ? (
                            <div className="h-[600px] flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                            </div>
                        ) : (
                            <div className="kalendar-container" style={{ minHeight: '600px' }}>
                                <style jsx global>{`
                                    .custom-scrollbar::-webkit-scrollbar {
                                        width: 4px;
                                    }
                                    .custom-scrollbar::-webkit-scrollbar-track {
                                        background: transparent;
                                    }
                                    .custom-scrollbar::-webkit-scrollbar-thumb {
                                        background: #d1fae5;
                                        border-radius: 10px;
                                    }
                                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                                        background: #a7f3d0;
                                    }

                                    .fc {
                                        font-family: inherit;
                                        --fc-border-color: #f1f5f9; /* slate-100 */
                                        --fc-button-text-color: #475569;
                                        --fc-button-bg-color: #ffffff;
                                        --fc-button-border-color: #e2e8f0;
                                        --fc-button-hover-bg-color: #f8fafc;
                                        --fc-button-hover-border-color: #cbd5e1;
                                        --fc-button-active-bg-color: #fef08a; /* yellow-200 */
                                        --fc-button-active-border-color: #fde047; /* yellow-300 */
                                        --fc-today-bg-color: rgba(250, 204, 21, 0.05); /* yellow-500 light */
                                    }
                                    .fc .fc-toolbar-title {
                                        font-size: 1.75rem;
                                        font-weight: 900;
                                        color: #0f172a;
                                        letter-spacing: -0.025em;
                                        text-transform: capitalize;
                                    }
                                    .fc .fc-toolbar-chunk:first-child {
                                        display: flex;
                                        gap: 0.5rem;
                                    }
                                    .fc .fc-button {
                                        padding: 0.6rem 1.25rem;
                                        font-weight: 700;
                                        font-size: 0.875rem;
                                        text-transform: capitalize;
                                        border-radius: 0.75rem;
                                        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
                                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                                    }
                                    .fc .fc-button-primary {
                                        color: #475569 !important;
                                    }
                                    .fc .fc-button-primary:hover {
                                        background-color: #f8fafc !important;
                                        transform: translateY(-1px);
                                        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
                                    }
                                    .fc .fc-button-primary:not(:disabled).fc-button-active, 
                                    .fc .fc-button-primary:not(:disabled):active {
                                        background-color: #0f172a !important; /* slate-900 */
                                        border-color: #0f172a !important;
                                        color: #fde047 !important; /* yellow-300 */
                                        box-shadow: 0 10px 15px -3px rgb(15 23 42 / 0.3), 0 4px 6px -4px rgb(15 23 42 / 0.3);
                                        transform: translateY(1px);
                                    }
                                                    
                                    .fc-theme-standard td, .fc-theme-standard th {
                                        border-color: #e2e8f0;
                                    }
                                    .fc-theme-standard .fc-scrollgrid {
                                        border-color: #cbd5e1;
                                        border-radius: 1rem;
                                        overflow: hidden;
                                        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
                                    }
                                    .fc-col-header-cell {
                                        padding: 1.25rem 0;
                                        background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
                                        border-bottom: 2px solid #cbd5e1 !important;
                                    }
                                    .fc-col-header-cell-cushion {
                                        color: #334155;
                                        font-weight: 800;
                                        font-size: 0.875rem;
                                        text-transform: uppercase;
                                        letter-spacing: 0.1em;
                                    }
                                    .fc-daygrid-day-number {
                                        font-size: 0.9rem;
                                        font-weight: 700;
                                        color: #475569;
                                        padding: 0.5rem;
                                        margin: 0.35rem;
                                        border-radius: 9999px;
                                        width: 2.25rem;
                                        height: 2.25rem;
                                        display: inline-flex;
                                        align-items: center;
                                        justify-content: center;
                                        transition: all 0.3s;
                                        text-decoration: none !important;
                                    }
                                    .fc-daygrid-day-number:hover {
                                        background-color: #e2e8f0;
                                        color: #0f172a;
                                        transform: scale(1.1);
                                    }
                                    .fc-day-today {
                                        background-color: #fffbeb !important; /* amber-50 */
                                    }
                                    .fc-day-today .fc-daygrid-day-number {
                                        background: linear-gradient(135deg, #eab308 0%, #d97706 100%); /* yellow-500 to amber-600 */
                                        color: white;
                                        box-shadow: 0 10px 15px -3px rgb(234 179 8 / 0.4);
                                    }
                                    .fc-day-today .fc-daygrid-day-number:hover {
                                        background: linear-gradient(135deg, #ca8a04 0%, #b45309 100%);
                                        color: white;
                                    }
                                    .fc-event {
                                        margin: 2px 5px;
                                        border-radius: 0.5rem;
                                        border: 1px solid transparent;
                                        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                                        transition: all 0.2s;
                                    }
                                    .fc-event:hover {
                                        transform: translateY(-2px);
                                        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                                    }
                                    .fc-h-event .fc-event-main {
                                        color: inherit;
                                    }
                                    .fc-daygrid-event-dot {
                                        display: none;
                                    }
                                    .fc-daygrid-event {
                                        white-space: normal !important;
                                        line-height: 1.3;
                                    }
                                    .fc-daygrid-event .fc-event-main {
                                        display: flex;
                                        flex-direction: row;
                                        align-items: flex-start;
                                        padding: 4px 3px;
                                    }
                                    .fc-event-title, .fc-event-time {
                                        font-size: 11px !important;
                                    }
                                    .fc-event-title {
                                        font-weight: 600 !important;
                                        font-family: inherit !important;
                                        flex: 1;
                                        word-break: break-word;
                                        white-space: normal;
                                    }
                                    .fc-event-time {
                                        font-weight: 800 !important;
                                        font-family: inherit !important;
                                        margin-right: 6px;
                                        flex-shrink: 0;
                                        white-space: nowrap;
                                        color: rgba(0,0,0,0.6);
                                    }
                                    .fc-day-other .fc-daygrid-day-top {
                                        opacity: 0.3;
                                    }
                                    .fc-daygrid-more-link {
                                        font-size: 0.75rem;
                                        font-weight: 800;
                                        color: #0f172a;
                                        margin-left: 8px;
                                        padding: 3px 8px;
                                        background: #fde047; /* yellow-300 */
                                        border-radius: 6px;
                                        text-decoration: none !important;
                                        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                                        transition: all 0.2s;
                                        display: inline-block;
                                        margin-top: 2px;
                                    }
                                    .fc-daygrid-more-link:hover {
                                        background: #facc15;
                                        transform: scale(1.05);
                                    }
                                `}</style>

                                {isReady && (
                                    <FullCalendar
                                        ref={calendarRef}
                                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, multiMonthPlugin]}
                                        initialView="dayGridMonth"
                                        initialDate={initialDateStr || undefined}
                                        headerToolbar={{
                                            left: 'prev,next today',
                                            center: 'title',
                                            right: 'multiMonthYear,dayGridMonth,timeGridWeek,timeGridDay'
                                        }}
                                        events={events}
                                        eventClick={handleEventClick}
                                        height="auto"
                                        dayMaxEvents={3}
                                        moreLinkContent={(args) => `+${args.num} lagi`}
                                        firstDay={1}
                                        buttonText={{
                                            today: 'Hari Ini',
                                            year: 'Tahun',
                                            month: 'Bulan',
                                            week: 'Minggu',
                                            day: 'Hari'
                                        }}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Event Detail Modal */}
                {selectedEvent && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedEvent(null)}></div>
                        <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-scale-in relative z-10 border border-slate-100">
                            {/* Header Image/Gradient */}
                            <div className={`px-8 py-6 flex justify-between items-start relative overflow-hidden ${(selectedEvent.status_program === 'Selesai' || selectedEvent.status_program === 'Done') ? 'bg-slate-800' :
                                (selectedEvent.status_program === 'Dibatalkan' || selectedEvent.status_program === 'Cancelled') ? 'bg-red-900' : 'bg-slate-900'
                                }`}>
                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                                <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                <div className="relative z-10 pr-8">
                                    <h3 className="text-2xl font-extrabold text-white leading-tight mb-2 drop-shadow-md">
                                        {selectedEvent.nama_program}
                                    </h3>
                                    <div className="flex items-center space-x-2">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${(selectedEvent.status_program === 'Selesai' || selectedEvent.status_program === 'Done') ? 'bg-slate-700/50 text-slate-200 border-slate-500/50' :
                                            (selectedEvent.status_program === 'Dibatalkan' || selectedEvent.status_program === 'Cancelled') ? 'bg-red-800/50 text-red-100 border-red-500/50' : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${(selectedEvent.status_program === 'Selesai' || selectedEvent.status_program === 'Done') ? 'bg-slate-300' :
                                                (selectedEvent.status_program === 'Dibatalkan' || selectedEvent.status_program === 'Cancelled') ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'
                                                }`}></span>
                                            {selectedEvent.status_program || 'Akan Datang'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="relative z-10 text-white/60 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all hover:rotate-90"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-8">
                                <div className="space-y-6">
                                    <div className="flex items-start group">
                                        <div className="p-3 bg-slate-50 border border-slate-100 text-slate-400 rounded-xl mr-4 group-hover:bg-yellow-50 group-hover:text-yellow-600 transition-colors shadow-sm">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Tarikh & Masa</p>
                                            <p className="text-base font-bold text-slate-800">
                                                {selectedEvent.tarikh_mula} {selectedEvent.tarikh_tamat && selectedEvent.tarikh_tamat !== selectedEvent.tarikh_mula ? ` hingga ${selectedEvent.tarikh_tamat}` : ''}
                                            </p>
                                            {(selectedEvent.masa_mula || selectedEvent.masa_tamat) && (
                                                <p className="text-sm font-medium text-slate-500 flex items-center mt-1">
                                                    <Clock className="w-4 h-4 mr-1.5 opacity-70" />
                                                    {selectedEvent.masa_mula || '?'} - {selectedEvent.masa_tamat || '?'}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-start group">
                                        <div className="p-3 bg-slate-50 border border-slate-100 text-slate-400 rounded-xl mr-4 group-hover:bg-yellow-50 group-hover:text-yellow-600 transition-colors shadow-sm">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Lokasi</p>
                                            <p className="text-base font-bold text-slate-800">{selectedEvent.tempat || 'Tidak Dinyatakan'}</p>
                                            <p className="text-sm font-medium text-slate-500 mt-1">{selectedEvent.negeri}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center">
                                                <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                                                Jumlah Hadir
                                            </p>
                                            <span className="font-extrabold text-2xl text-slate-800">
                                                {selectedEvent.kehadiran_keseluruhan || 0}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Kategori</p>
                                            <span className="font-semibold text-slate-700 text-sm bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm inline-block">
                                                {selectedEvent.kategori_utama || '-'}
                                            </span>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Anjuran</p>
                                            <p className="font-medium text-sm text-slate-700 leading-relaxed bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-sm" title={Array.isArray(selectedEvent.anjuran) ? selectedEvent.anjuran.join(', ') : selectedEvent.anjuran}>
                                                {Array.isArray(selectedEvent.anjuran) ? selectedEvent.anjuran.join(', ') : (selectedEvent.anjuran || '-')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                                    <Link
                                        href={`/program_details?id=${selectedEvent.id}&from=kalendar&date=${getCurrentDateStr()}`}
                                        className="w-full sm:w-auto flex items-center justify-center text-slate-900 hover:text-black font-bold text-sm bg-yellow-400 hover:bg-yellow-500 px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 transform hover:-translate-y-0.5"
                                    >
                                        <span>Lihat Laporan Penuh</span>
                                        <FileText className="w-4 h-4 ml-2" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
