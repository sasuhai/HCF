'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import { MapPin, Clock, Users, FileText, X, Filter, Calendar } from 'lucide-react';
import Link from 'next/link';
import Select from 'react-select';

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

    const stateFilters = selectedStates ? selectedStates.map(s => s.value) : [];
    const kategoriFilters = selectedKategori ? selectedKategori.map(s => s.value) : [];
    const anjuranFilters = selectedAnjuran ? selectedAnjuran.map(s => s.value) : [];
    const statusFilters = selectedStatus ? selectedStatus.map(s => s.value) : [];

    const filteredPrograms = programs.filter(prog => {
        if (stateFilters.length > 0 && !stateFilters.includes(prog.negeri)) return false;
        if (kategoriFilters.length > 0 && !kategoriFilters.includes(prog.kategori_utama)) return false;
        if (statusFilters.length > 0 && !statusFilters.includes(prog.status_program)) return false;

        if (anjuranFilters.length > 0) {
            const progAnjuran = Array.isArray(prog.anjuran) ? prog.anjuran : (prog.anjuran ? [prog.anjuran] : []);
            if (!anjuranFilters.some(a => progAnjuran.includes(a))) return false;
        }

        return true;
    });

    const customSelectStyles = {
        control: (base, state) => ({ ...base, minHeight: '34px', borderRadius: '0.5rem', borderColor: state.isFocused ? '#10b981' : 'white', boxShadow: state.isFocused ? '0 0 0 1px rgba(16, 185, 129, 0.2)' : 'none', '&:hover': { borderColor: '#10b981' }, backgroundColor: 'white', fontSize: '12px' }),
        menu: (base) => ({ ...base, borderRadius: '0.5rem', overflow: 'hidden', zIndex: 9999, fontSize: '12px' }),
        menuPortal: base => ({ ...base, zIndex: 9999 }),
        multiValue: (base) => ({ ...base, backgroundColor: '#d1fae5', borderRadius: '0.25rem' }),
        multiValueLabel: (base) => ({ ...base, color: '#047857', fontWeight: 600, fontSize: '11px' }),
        multiValueRemove: (base) => ({ ...base, color: '#047857', ':hover': { backgroundColor: '#a7f3d0', color: '#047857' } })
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

        let bgColor = '#ecfdf5'; // emerald-50
        let borderColor = '#a7f3d0'; // emerald-200
        let textColor = '#065f46'; // emerald-900

        if (isDone) {
            bgColor = '#eff6ff'; // blue-50
            borderColor = '#bfdbfe'; // blue-200
            textColor = '#1e3a8a'; // blue-900
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
            <div className="min-h-screen bg-gray-50/50 pt-16">
                <Navbar />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-[2rem] p-6 sm:p-8 mb-8 border border-emerald-100/50 shadow-sm relative overflow-hidden">
                        {/* Decorative background shape */}
                        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>

                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                <div>
                                    <div className="flex items-center space-x-3 mb-1">
                                        <div className="bg-white/60 backdrop-blur-sm p-2 rounded-xl shadow-sm border border-white/50">
                                            <Calendar className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Kalendar Aktiviti</h1>
                                    </div>
                                    <p className="text-xs text-emerald-800/70 font-medium whitespace-nowrap md:truncate max-w-full hidden sm:block">
                                        Pantau & rancang kesemua program secara bersepadu. Klik pada mana-mana acara untuk butiran lengkap.
                                    </p>
                                </div>

                                <div
                                    className="flex items-center space-x-2 bg-white border border-white/50 rounded-lg px-3 py-1.5 shadow-sm hover:border-emerald-200 transition-all cursor-pointer group"
                                    onClick={() => setShowHolidays(!showHolidays)}
                                >
                                    <div className={`relative w-8 h-4 transition-colors duration-200 ease-in-out rounded-full shadow-inner ${showHolidays ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                                        <span className={`absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-transform duration-200 ease-in-out shadow-sm ${showHolidays ? 'transform translate-x-4' : ''}`}></span>
                                    </div>
                                    <span className="text-xs text-slate-600 font-bold select-none group-hover:text-emerald-700 transition-colors">Cuti Umum</span>
                                </div>
                            </div>

                            {/* Filters Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white/40 p-3 rounded-xl backdrop-blur-sm border border-white/60">
                                <div className="w-full">
                                    <label className="block text-[9px] font-bold text-emerald-800 uppercase tracking-widest mb-1 flex items-center">
                                        <Filter className="w-3 h-3 mr-1" /> Negeri
                                    </label>
                                    <Select
                                        isMulti
                                        options={states}
                                        value={selectedStates}
                                        onChange={setSelectedStates}
                                        placeholder="Semua Negeri"
                                        className="text-xs shadow-sm rounded-lg border-0"
                                        styles={customSelectStyles}
                                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                    />
                                </div>
                                <div className="w-full">
                                    <label className="block text-[9px] font-bold text-emerald-800 uppercase tracking-widest mb-1 flex items-center">
                                        <Filter className="w-3 h-3 mr-1" /> Kategori
                                    </label>
                                    <Select
                                        isMulti
                                        options={kategoriOptions}
                                        value={selectedKategori}
                                        onChange={setSelectedKategori}
                                        placeholder="Semua Kategori"
                                        className="text-xs shadow-sm rounded-lg border-0"
                                        styles={customSelectStyles}
                                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                    />
                                </div>
                                <div className="w-full">
                                    <label className="block text-[9px] font-bold text-emerald-800 uppercase tracking-widest mb-1 flex items-center">
                                        <Filter className="w-3 h-3 mr-1" /> Anjuran
                                    </label>
                                    <Select
                                        isMulti
                                        options={anjuranOptions}
                                        value={selectedAnjuran}
                                        onChange={setSelectedAnjuran}
                                        placeholder="Semua Anjuran"
                                        className="text-xs shadow-sm rounded-lg border-0"
                                        styles={customSelectStyles}
                                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                    />
                                </div>
                                <div className="w-full">
                                    <label className="block text-[9px] font-bold text-emerald-800 uppercase tracking-widest mb-1 flex items-center">
                                        <Filter className="w-3 h-3 mr-1" /> Status
                                    </label>
                                    <Select
                                        isMulti
                                        options={statusOptions}
                                        value={selectedStatus}
                                        onChange={setSelectedStatus}
                                        placeholder="Semua Status"
                                        className="text-xs shadow-sm rounded-lg border-0"
                                        styles={customSelectStyles}
                                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 p-4 sm:p-8">
                        <div className="flex flex-wrap gap-6 mb-8 px-5 py-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center space-x-2.5">
                                <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 border-2 border-emerald-400 shrink-0 shadow-sm"></span>
                                <span className="text-xs font-bold tracking-wide uppercase text-slate-600">Akan Datang</span>
                            </div>
                            <div className="flex items-center space-x-2.5">
                                <span className="w-3.5 h-3.5 rounded-full bg-blue-100 border-2 border-blue-400 shrink-0 shadow-sm"></span>
                                <span className="text-xs font-bold tracking-wide uppercase text-slate-600">Selesai</span>
                            </div>
                            <div className="flex items-center space-x-2.5">
                                <span className="w-3.5 h-3.5 rounded-full bg-red-100 border-2 border-red-400 shrink-0 shadow-sm"></span>
                                <span className="text-xs font-bold tracking-wide uppercase text-slate-600">Batal / Tangguh</span>
                            </div>
                            <div className="flex items-center space-x-2.5">
                                <span className="w-3.5 h-3.5 rounded-full bg-amber-100 border-2 border-amber-400 shrink-0 shadow-sm"></span>
                                <span className="text-xs font-bold tracking-wide uppercase text-slate-600">Cuti Umum</span>
                            </div>
                        </div>

                        {loading ? (
                            <div className="h-[600px] flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                            </div>
                        ) : (
                            <div className="kalendar-container" style={{ minHeight: '600px' }}>
                                <style jsx global>{`
                                    .fc {
                                        font-family: inherit;
                                        --fc-border-color: #f1f5f9; /* slate-100 */
                                        --fc-button-text-color: #475569;
                                        --fc-button-bg-color: #ffffff;
                                        --fc-button-border-color: #e2e8f0;
                                        --fc-button-hover-bg-color: #f8fafc;
                                        --fc-button-hover-border-color: #cbd5e1;
                                        --fc-button-active-bg-color: #e0e7ff; /* indigo-100 */
                                        --fc-button-active-border-color: #c7d2fe; /* indigo-200 */
                                        --fc-today-bg-color: transparent;
                                    }
                                    .fc .fc-toolbar-title {
                                        font-size: 1.5rem;
                                        font-weight: 800;
                                        color: #0f172a;
                                        letter-spacing: -0.025em;
                                    }
                                    .fc .fc-toolbar-chunk:first-child {
                                        display: flex;
                                        gap: 0.5rem;
                                    }
                                    .fc .fc-button {
                                        padding: 0.5rem 1rem;
                                        font-weight: 600;
                                        font-size: 0.875rem;
                                        text-transform: capitalize;
                                        border-radius: 0.75rem;
                                        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                                        transition: all 0.2s;
                                    }
                                    .fc .fc-button-primary {
                                        color: #475569 !important;
                                    }
                                    .fc .fc-button-primary:not(:disabled).fc-button-active, 
                                    .fc .fc-button-primary:not(:disabled):active {
                                        background-color: #818cf8 !important;
                                        border-color: #6366f1 !important;
                                        color: white !important;
                                        box-shadow: 0 4px 6px -1px rgb(99 102 241 / 0.2), 0 2px 4px -2px rgb(99 102 241 / 0.2);
                                    }
                                                    
                                    .fc-theme-standard td, .fc-theme-standard th {
                                        border-color: #f1f5f9;
                                    }
                                    .fc-theme-standard .fc-scrollgrid {
                                        border-color: transparent;
                                        border-radius: 1rem;
                                        overflow: hidden;
                                    }
                                    .fc-col-header-cell {
                                        padding: 1rem 0;
                                        background-color: #ffffff;
                                        border-bottom: 2px solid #f1f5f9 !important;
                                    }
                                    .fc-col-header-cell-cushion {
                                        color: #64748b;
                                        font-weight: 700;
                                        font-size: 0.875rem;
                                        text-transform: uppercase;
                                        letter-spacing: 0.05em;
                                    }
                                    .fc-daygrid-day-number {
                                        font-size: 0.875rem;
                                        font-weight: 600;
                                        color: #475569;
                                        padding: 0.5rem;
                                        margin: 0.25rem;
                                        border-radius: 9999px;
                                        width: 2rem;
                                        height: 2rem;
                                        display: inline-flex;
                                        align-items: center;
                                        justify-content: center;
                                        transition: all 0.2s;
                                        text-decoration: none !important;
                                    }
                                    .fc-daygrid-day-number:hover {
                                        background-color: #f1f5f9;
                                        color: #0f172a;
                                    }
                                    .fc-day-today {
                                        background-color: #f8fafc !important;
                                    }
                                    .fc-day-today .fc-daygrid-day-number {
                                        background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
                                        color: white;
                                        box-shadow: 0 4px 6px -1px rgb(99 102 241 / 0.3);
                                    }
                                    .fc-day-today .fc-daygrid-day-number:hover {
                                        background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
                                        color: white;
                                    }
                                    .fc-event {
                                        margin: 2px 4px;
                                        border-radius: 6px;
                                        border: none;
                                        box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                                    }
                                    .fc-h-event .fc-event-main {
                                        color: inherit;
                                    }
                                    .fc-daygrid-event-dot {
                                        display: none;
                                    }
                                    .fc-daygrid-event {
                                        white-space: normal !important;
                                        line-height: 1.2;
                                    }
                                    .fc-daygrid-event .fc-event-main {
                                        display: flex;
                                        flex-direction: row;
                                        align-items: flex-start;
                                        padding: 2px 1px;
                                    }
                                    .fc-event-title, .fc-event-time {
                                        font-size: 10px !important;
                                    }
                                    .fc-event-title {
                                        font-weight: 500 !important;
                                        font-family: inherit !important;
                                        flex: 1;
                                        word-break: break-word;
                                        white-space: normal;
                                    }
                                    .fc-event-time {
                                        font-weight: 700 !important;
                                        font-family: inherit !important;
                                        margin-right: 4px;
                                        flex-shrink: 0;
                                        white-space: nowrap;
                                    }
                                    .fc-day-other .fc-daygrid-day-top {
                                        opacity: 0.4;
                                    }
                                    .fc-daygrid-more-link {
                                        font-size: 0.75rem;
                                        font-weight: 700;
                                        color: #4f46e5;
                                        margin-left: 8px;
                                        padding: 2px 6px;
                                        background: #e0e7ff;
                                        border-radius: 4px;
                                        text-decoration: none !important;
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
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all">
                            <div className={`px-6 py-4 flex justify-between items-start ${(selectedEvent.status_program === 'Selesai' || selectedEvent.status_program === 'Done') ? 'bg-blue-500' :
                                (selectedEvent.status_program === 'Dibatalkan' || selectedEvent.status_program === 'Cancelled') ? 'bg-red-500' : 'bg-emerald-500'
                                }`}>
                                <h3 className="text-lg font-bold text-white pr-4 leading-tight">
                                    {selectedEvent.nama_program}
                                </h3>
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="text-white/80 hover:text-white hover:bg-white/20 p-1 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6">
                                <div className="space-y-4">
                                    <div className="flex items-start">
                                        <div className="p-2 bg-slate-50 text-slate-400 rounded-lg mr-3">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tarikh & Masa</p>
                                            <p className="font-semibold text-slate-800 mt-0.5">
                                                {selectedEvent.tarikh_mula} {selectedEvent.tarikh_tamat && selectedEvent.tarikh_tamat !== selectedEvent.tarikh_mula ? ` - ${selectedEvent.tarikh_tamat}` : ''}
                                            </p>
                                            {(selectedEvent.masa_mula || selectedEvent.masa_tamat) && (
                                                <p className="text-sm text-slate-600 flex items-center mt-1">
                                                    <Clock className="w-3.5 h-3.5 mr-1" />
                                                    {selectedEvent.masa_mula || '?'} hingga {selectedEvent.masa_tamat || '?'}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-start">
                                        <div className="p-2 bg-emerald-50 text-emerald-500 rounded-lg mr-3">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Lokasi</p>
                                            <p className="font-semibold text-slate-800 mt-0.5">{selectedEvent.tempat || 'Tidak Dinyatakan'}</p>
                                            <p className="text-sm text-slate-600 mt-1">{selectedEvent.negeri}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</p>
                                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${(selectedEvent.status_program === 'Selesai' || selectedEvent.status_program === 'Done') ? 'bg-blue-100 text-blue-700' :
                                                (selectedEvent.status_program === 'Dibatalkan' || selectedEvent.status_program === 'Cancelled') ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                {selectedEvent.status_program || 'Akan Datang'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Kategori</p>
                                            <span className="font-medium text-slate-800 text-sm">
                                                {selectedEvent.kategori_utama || '-'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1"><Users className="w-3 h-3 inline mr-1 -mt-0.5" /> Jumlah Hadir</p>
                                            <span className="font-bold text-lg text-slate-800">
                                                {selectedEvent.kehadiran_keseluruhan || 0}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Anjuran</p>
                                            <span className="font-medium text-sm text-slate-600 block truncate" title={Array.isArray(selectedEvent.anjuran) ? selectedEvent.anjuran.join(', ') : selectedEvent.anjuran}>
                                                {Array.isArray(selectedEvent.anjuran) ? selectedEvent.anjuran.join(', ') : (selectedEvent.anjuran || '-')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
                                    <Link
                                        href={`/program_details?id=${selectedEvent.id}&from=kalendar&date=${getCurrentDateStr()}`}
                                        className="flex items-center text-emerald-600 hover:text-emerald-700 font-bold text-sm bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg transition-colors"
                                    >
                                        <FileText className="w-4 h-4 mr-2" />
                                        Lihat Laporan Penuh
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
