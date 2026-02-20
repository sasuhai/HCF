'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { ArrowLeft, Save, Loader, AlertCircle, Activity, MapPin, Users, FileText, Search, X } from 'lucide-react';

export default function EditProgramClient() {
    const { role } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Form lookups
    const [lookups, setLookups] = useState({
        states: [],
        kawasan: [],
        subKategori: [], // Store objects {name, groups}
        anjuran: [],
        statusOptions: [],
        kategoriOptions: []
    });

    // Form data state
    const [formData, setFormData] = useState({
        negeri: '',
        tahun: new Date().getFullYear(),
        bulan: new Date().getMonth() + 1,
        status_program: 'Akan Datang',
        nama_program: '',
        tarikh_mula: '',
        tarikh_tamat: '',
        masa_mula: '',
        masa_tamat: '',
        tempat: '',
        kawasan_cawangan: [],
        mod_program: 'Fizikal',
        jenis_program: [], // Now multi-select
        kategori_utama: '',
        sub_kategori: [], // Uses main categories list as multi-select
        kehadiran_rh: 0,
        kehadiran_daie: 0,
        kehadiran_non_muslim: 0,
        kehadiran_quality: 0,
        kehadiran_madu: 0,
        kehadiran_syahadah: 0,
        kehadiran_muallaf: 0,
        kehadiran_keseluruhan: 0,
        anjuran: [],
        kawasan_ikram: '',
        link_facebook: '',
        catatan_1: '',
        catatan_2: '',
        selesai_laporan: false
    });

    const [searchTermSubKat, setSearchTermSubKat] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setLoading(true);
            try {
                // Fetch lookups
                const { data: statesData } = await supabase.from('states').select('name, cawangan').order('name');

                let allKawasan = [];
                if (statesData) {
                    statesData.forEach(s => {
                        if (s.cawangan && Array.isArray(s.cawangan)) {
                            // Sort cawangan natively here if we want or sort the final object array
                            s.cawangan.sort((a, b) => a.localeCompare(b)).forEach(cw => {
                                allKawasan.push({ name: cw, state_name: s.name });
                            });
                        }
                    });
                }

                // Final sort by name just in case
                allKawasan.sort((a, b) => a.name.localeCompare(b.name));

                const { data: statusData } = await supabase.from('program_status').select('name').order('name');
                const { data: catData } = await supabase.from('program_categories').select('name').order('name');
                const { data: orgData } = await supabase.from('program_organizers').select('name').order('name');
                const { data: typeData } = await supabase.from('program_types').select('name, groups').order('groups').order('name');

                const categories = (catData && catData.length > 0) ? catData.map(c => c.name) : ['Program Kesedaran', 'Latihan Daie', 'Sukarelawan', 'Outreach', 'Pembangunan Mualaf', 'UMUM'];
                const organizers = (orgData && orgData.length > 0) ? orgData.map(o => o.name) : ['Staf Negeri', 'Wilayah', 'HQ', 'RH', 'IKRAM', 'GDM', 'MAIN / JAIN', 'Lain-lain'];
                const subKats = (typeData && typeData.length > 0) ? typeData.sort((a, b) => {
                    const groupA = a.groups || 'ZZZZZ'; // Push null to end
                    const groupB = b.groups || 'ZZZZZ';
                    if (groupA !== groupB) return groupA.localeCompare(groupB);
                    return a.name.localeCompare(b.name);
                }) : [];

                setLookups({
                    states: statesData ? statesData.map(s => s.name).sort((a, b) => a.localeCompare(b)) : ["Selangor", "Kuala Lumpur"],
                    kawasan: allKawasan,
                    subKategori: subKats,
                    anjuran: organizers,
                    statusOptions: statusData ? statusData.map(s => s.name) : ['On-schedule', 'Done', 'Cancelled', 'Postponed'],
                    kategoriOptions: categories
                });

                // Fetch program from DB
                const { data, error: fetchErr } = await supabase.from('programs').select('*').eq('id', id).single();
                if (fetchErr) throw fetchErr;

                if (data) {
                    setFormData({
                        negeri: data.negeri || '',
                        tahun: data.tahun || new Date().getFullYear(),
                        bulan: data.bulan || new Date().getMonth() + 1,
                        status_program: data.status_program || 'Akan Datang',
                        nama_program: data.nama_program || '',
                        tarikh_mula: data.tarikh_mula || '',
                        tarikh_tamat: data.tarikh_tamat || '',
                        masa_mula: data.masa_mula || '',
                        masa_tamat: data.masa_tamat || '',
                        tempat: data.tempat || '',
                        kawasan_cawangan: Array.isArray(data.kawasan_cawangan) ? data.kawasan_cawangan : [],
                        mod_program: data.jenis_program === 'Online' || data.jenis_program === 'Fizikal' || data.jenis_program === 'Hybrid' ? data.jenis_program : 'Fizikal',
                        jenis_program: Array.isArray(data.jenis_program) ? data.jenis_program : [],
                        kategori_utama: data.kategori_utama || '',
                        sub_kategori: Array.isArray(data.sub_kategori) ? data.sub_kategori : [],
                        kehadiran_rh: data.kehadiran_rh || 0,
                        kehadiran_daie: data.kehadiran_daie || 0,
                        kehadiran_non_muslim: data.kehadiran_non_muslim || 0,
                        kehadiran_quality: data.kehadiran_quality || 0,
                        kehadiran_madu: data.kehadiran_madu || 0,
                        kehadiran_syahadah: data.kehadiran_syahadah || 0,
                        kehadiran_muallaf: data.kehadiran_muallaf || 0,
                        kehadiran_keseluruhan: data.kehadiran_keseluruhan || 0,
                        anjuran: Array.isArray(data.anjuran) ? data.anjuran : [],
                        kawasan_ikram: data.kawasan_ikram || '',
                        link_facebook: data.link_facebook || '',
                        catatan_1: data.catatan_1 || '',
                        catatan_2: data.catatan_2 || '',
                        selesai_laporan: !!data.selesai_laporan
                    });
                }
            } catch (err) {
                console.error(err);
                setError("Ralat memuatkan data program.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    useEffect(() => {
        const total =
            Number(formData.kehadiran_rh || 0) +
            Number(formData.kehadiran_daie || 0) +
            Number(formData.kehadiran_non_muslim || 0) +
            Number(formData.kehadiran_quality || 0) +
            Number(formData.kehadiran_madu || 0) +
            Number(formData.kehadiran_syahadah || 0) +
            Number(formData.kehadiran_muallaf || 0);

        setFormData(prev => ({ ...prev, kehadiran_keseluruhan: total }));
    }, [
        formData.kehadiran_rh, formData.kehadiran_daie, formData.kehadiran_non_muslim,
        formData.kehadiran_quality, formData.kehadiran_madu, formData.kehadiran_syahadah,
        formData.kehadiran_muallaf
    ]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            // This is for standalone checkboxes like selesai_laporan
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleMultiSelect = (e, field) => {
        const options = Array.from(e.target.selectedOptions, option => option.value);
        setFormData(prev => ({
            ...prev,
            [field]: options
        }));
    };

    const handleCheckboxListChange = (field, itemValue) => {
        setFormData(prev => {
            const current = prev[field] || [];
            if (current.includes(itemValue)) {
                return { ...prev, [field]: current.filter(item => item !== itemValue) };
            } else {
                return { ...prev, [field]: [...current, itemValue] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            if (!formData.negeri || !formData.tahun || !formData.bulan || !formData.nama_program || !formData.tarikh_mula) {
                throw new Error("Sila isi semua ruangan yang wajib.");
            }

            const { mod_program, ...rest } = formData;
            const payload = {
                ...rest,
                jenis_program: formData.jenis_program
            };
            if (!payload.masa_mula) payload.masa_mula = null;
            if (!payload.masa_tamat) payload.masa_tamat = null;
            if (!payload.tarikh_tamat) payload.tarikh_tamat = null;

            const { error: updateError } = await supabase.from('programs').update(payload).eq('id', id);
            if (updateError) throw updateError;

            // Optional: return back to previous page or program list
            router.push('/program');
        } catch (err) {
            console.error(err);
            setError(err.message || "Ralat semasa mengemaskini rekod program. Sila cuba lagi.");
            setSubmitting(false);
        }
    };

    if (!id) {
        return <div className="p-8 text-center text-red-500 bg-gray-50 min-h-screen">ID Program tidak dijumpai.</div>;
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 pt-16 font-sans">
                <Navbar />
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                    <div className="mb-8 flex flex-col items-start gap-4">
                        <button
                            onClick={() => router.back()}
                            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm hover:shadow"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Kembali
                        </button>

                        <div>
                            <div className="flex items-center space-x-2 text-emerald-600 font-semibold tracking-wider text-xs uppercase mb-1">
                                <Activity className="w-4 h-4" />
                                <span>Kemaskini Program</span>
                            </div>
                            <h1 className="text-3xl font-extrabold text-[#1E293B] tracking-tight">
                                Kemaskini <span className="text-emerald-500">Program / Aktiviti</span>
                            </h1>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start">
                            <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                            <p className="text-sm font-medium text-red-800">{error}</p>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center p-12 bg-white rounded-3xl shadow-sm border border-slate-200">
                            <Loader className="w-8 h-8 text-emerald-500 animate-spin" />
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Section 1: Klasifikasi & Masa */}
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200/60 transition-all hover:shadow-md">
                                <div className="flex items-center mb-6 border-b border-slate-100 pb-4">
                                    <div className="bg-emerald-50 p-2 rounded-xl mr-3">
                                        <FileText className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Maklumat Asas</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Negeri / Cawangan Utama <span className="text-red-500">*</span></label>
                                        <select
                                            name="negeri" value={formData.negeri} onChange={handleChange} required
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        >
                                            <option value="">-- Pilih --</option>
                                            {lookups.states.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Tahun <span className="text-red-500">*</span></label>
                                        <select
                                            name="tahun" value={formData.tahun} onChange={handleChange} required
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        >
                                            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Bulan <span className="text-red-500">*</span></label>
                                        <select
                                            name="bulan" value={formData.bulan} onChange={handleChange} required
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        >
                                            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 mb-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Nama Program / Aktiviti <span className="text-red-500">*</span></label>
                                        <input
                                            type="text" name="nama_program" value={formData.nama_program} onChange={handleChange} required
                                            placeholder="Contoh: Kempen Muallaf Bestari"
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Tarikh Mula <span className="text-red-500">*</span></label>
                                        <input
                                            type="date" name="tarikh_mula" value={formData.tarikh_mula} onChange={handleChange} required
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Tarikh Tamat <span className="text-slate-400 text-[10px]">(jika lebih 1 hari)</span></label>
                                        <input
                                            type="date" name="tarikh_tamat" value={formData.tarikh_tamat} onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Masa Mula</label>
                                        <input
                                            type="time" name="masa_mula" value={formData.masa_mula} onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Masa Tamat</label>
                                        <input
                                            type="time" name="masa_tamat" value={formData.masa_tamat} onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Lokasi & Kategori */}
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200/60 transition-all hover:shadow-md">
                                <div className="flex items-center mb-6 border-b border-slate-100 pb-4">
                                    <div className="bg-indigo-50 p-2 rounded-xl mr-3">
                                        <MapPin className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Lokasi & Kategori</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Tempat / Venue</label>
                                        <input
                                            type="text" name="tempat" value={formData.tempat} onChange={handleChange}
                                            placeholder="Nama dewan, masjid..."
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Kawasan / Cawangan Terlibat <span className="text-slate-400 text-[10px]">(Boleh pilih lebih drpd 1)</span></label>
                                            {(role === 'admin' || role === 'editor') && (
                                                <Link href="/pengurusan/metadata" target="_blank" className="text-[10px] items-center flex text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100 transition-colors">
                                                    Urus Cawangan <Activity className="w-3 h-3 ml-1" />
                                                </Link>
                                            )}
                                        </div>
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-48 overflow-y-auto space-y-2">
                                            {lookups.kawasan
                                                .filter(k => !formData.negeri || k.state_name === formData.negeri)
                                                .length === 0 && <span className="text-xs text-slate-400 italic">Sila pilih negeri dahulu atau tiada cawangan dijumpai</span>}
                                            {lookups.kawasan
                                                .filter(k => !formData.negeri || k.state_name === formData.negeri)
                                                .map(k => (
                                                    <label key={k.name} className="flex items-center group cursor-pointer">
                                                        <div className="relative flex items-center justify-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.kawasan_cawangan.includes(k.name)}
                                                                onChange={() => handleCheckboxListChange('kawasan_cawangan', k.name)}
                                                                className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-md checked:bg-emerald-500 checked:border-emerald-500 transition-all duration-200 cursor-pointer"
                                                            />
                                                            <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                        </div>
                                                        <span className="ml-3 text-sm font-medium text-slate-700 group-hover:text-emerald-600 transition-colors">{k.name}</span>
                                                    </label>
                                                ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Status Program</label>
                                        <select
                                            name="status_program" value={formData.status_program} onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        >
                                            <option value="">-- Pilih --</option>
                                            {lookups.statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Mod Program</label>
                                        <select
                                            name="mod_program" value={formData.mod_program} onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        >
                                            <option value="Fizikal">Fizikal</option>
                                            <option value="Online">Online</option>
                                            <option value="Hybrid">Hybrid</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Kategori Utama Program</label>
                                        <select
                                            name="kategori_utama" value={formData.kategori_utama} onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                        >
                                            <option value="">-- Pilih Kategori Utama --</option>
                                            {lookups.kategoriOptions.map(k => <option key={k} value={k}>{k}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Sub Kategori Program <span className="text-slate-400 text-[10px]">(Tema Tambahan)</span></label>
                                        </div>
                                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto p-2 space-y-1">
                                            {lookups.kategoriOptions.map(k => {
                                                const isChecked = formData.sub_kategori.includes(k);
                                                return (
                                                    <label key={k} className={`flex items-center p-2 rounded-lg cursor-pointer transition-all hover:bg-slate-50 ${isChecked ? 'bg-indigo-50/50' : ''}`}>
                                                        <div className="relative flex items-center justify-center">
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={isChecked}
                                                                onChange={() => handleCheckboxListChange('sub_kategori', k)}
                                                            />
                                                            <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all ${isChecked ? 'bg-indigo-500 border-indigo-500' : 'bg-white border-slate-300'}`}>
                                                                {isChecked && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                                            </div>
                                                        </div>
                                                        <span className={`ml-3 text-xs font-medium ${isChecked ? 'text-indigo-700' : 'text-slate-600'}`}>{k}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Jenis Program <span className="text-slate-400 text-[10px]">(Boleh pilih lebih drpd 1)</span></label>
                                        {formData.jenis_program.length > 0 && (
                                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                {formData.jenis_program.length} terpilih
                                            </span>
                                        )}
                                    </div>

                                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                                        <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center space-x-2">
                                            <Search className="w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Cari jenis program..."
                                                value={searchTermSubKat}
                                                onChange={(e) => setSearchTermSubKat(e.target.value)}
                                                className="w-full bg-transparent border-none text-sm focus:ring-0 placeholder:text-slate-400"
                                            />
                                            {searchTermSubKat && (
                                                <button onClick={() => setSearchTermSubKat('')} className="text-slate-400 hover:text-slate-600">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                                            {(() => {
                                                const filteredItems = lookups.subKategori.filter(k =>
                                                    k.name.toLowerCase().includes(searchTermSubKat.toLowerCase()) ||
                                                    (k.groups && k.groups.toLowerCase().includes(searchTermSubKat.toLowerCase()))
                                                );

                                                const groups = [...new Set(filteredItems.map(k => k.groups || 'Tanpa Kumpulan'))]
                                                    .sort((a, b) => (a === 'Tanpa Kumpulan' ? 1 : b === 'Tanpa Kumpulan' ? -1 : a.localeCompare(b)));

                                                if (filteredItems.length === 0) return <div className="p-8 text-center text-xs text-slate-400 italic bg-white">Tiada jenis program dijumpai</div>;

                                                return groups.map(group => (
                                                    <div key={group} className="bg-white">
                                                        <div className="bg-slate-50/80 px-4 py-1.5 flex items-center sticky top-0 z-10 border-b border-slate-100/50">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{group}</span>
                                                        </div>
                                                        <div className="p-1 grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-100">
                                                            {filteredItems
                                                                .filter(k => (k.groups || 'Tanpa Kumpulan') === group)
                                                                .sort((a, b) => a.name.localeCompare(b.name))
                                                                .map(k => {
                                                                    const isChecked = formData.jenis_program.includes(k.name);
                                                                    return (
                                                                        <label
                                                                            key={k.name}
                                                                            className={`flex items-center p-3 cursor-pointer transition-all bg-white hover:bg-emerald-50/50 ${isChecked ? 'bg-emerald-50/80' : ''}`}
                                                                        >
                                                                            <input
                                                                                type="checkbox"
                                                                                className="hidden"
                                                                                checked={isChecked}
                                                                                onChange={() => handleCheckboxListChange('jenis_program', k.name)}
                                                                            />
                                                                            <div className="relative flex-shrink-0 flex items-center justify-center">
                                                                                <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all ${isChecked ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300 group-hover:border-emerald-300'}`}>
                                                                                    {isChecked && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                                                                </div>
                                                                            </div>
                                                                            <span className={`ml-3 text-sm font-medium transition-colors ${isChecked ? 'text-emerald-700' : 'text-slate-600'}`}>{k.name}</span>
                                                                        </label>
                                                                    );
                                                                })
                                                            }
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Kehadiran */}
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200/60 transition-all hover:shadow-md">
                                <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                                    <div className="flex items-center">
                                        <div className="bg-amber-50 p-2 rounded-xl mr-3">
                                            <Users className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Kehadiran (Kuantiti)</h2>
                                            <p className="text-[11px] text-slate-500 font-medium">Rekod bilangan kehadiran mengikut sasaran</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Jumlah Keseluruhan</span>
                                        <span className="text-2xl font-extrabold text-slate-800">{formData.kehadiran_keseluruhan}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">RH</label>
                                        <input
                                            type="number" min="0" name="kehadiran_rh" value={formData.kehadiran_rh} onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-xl px-4 py-3 text-center focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Daie Dilatih</label>
                                        <input
                                            type="number" min="0" name="kehadiran_daie" value={formData.kehadiran_daie} onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-xl px-4 py-3 text-center focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Non Muslim</label>
                                        <input
                                            type="number" min="0" name="kehadiran_non_muslim" value={formData.kehadiran_non_muslim} onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-xl px-4 py-3 text-center focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Quality Engage</label>
                                        <input
                                            type="number" min="0" name="kehadiran_quality" value={formData.kehadiran_quality} onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-xl px-4 py-3 text-center focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Mad'u 3 Bintang</label>
                                        <input
                                            type="number" min="0" name="kehadiran_madu" value={formData.kehadiran_madu} onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-xl px-4 py-3 text-center focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Syahadah</label>
                                        <input
                                            type="number" min="0" name="kehadiran_syahadah" value={formData.kehadiran_syahadah} onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-xl px-4 py-3 text-center focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Muallaf</label>
                                        <input
                                            type="number" min="0" name="kehadiran_muallaf" value={formData.kehadiran_muallaf} onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-xl px-4 py-3 text-center focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Maklumat Tambahan */}
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200/60 transition-all hover:shadow-md">
                                <div className="flex items-center mb-6 border-b border-slate-100 pb-4">
                                    <div className="bg-blue-50 p-2 rounded-xl mr-3">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Maklumat Rekod Tambahan</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Anjuran <span className="text-slate-400 text-[10px]">(Boleh pilih lebih drpd 1)</span></label>
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-48 overflow-y-auto space-y-2">
                                            {lookups.anjuran.map(k => (
                                                <label key={k} className="flex items-center group cursor-pointer">
                                                    <div className="relative flex items-center justify-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.anjuran.includes(k)}
                                                            onChange={() => handleCheckboxListChange('anjuran', k)}
                                                            className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-md checked:bg-blue-500 checked:border-blue-500 transition-all duration-200 cursor-pointer"
                                                        />
                                                        <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    </div>
                                                    <span className="ml-3 text-sm font-medium text-slate-700 group-hover:text-blue-600 transition-colors">{k}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Kawasan IKRAM <span className="text-slate-400 text-[10px]">(Jika ada kerjasama)</span></label>
                                        <input
                                            type="text" name="kawasan_ikram" value={formData.kawasan_ikram} onChange={handleChange}
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Pautan Laporan Facebook (URL)</label>
                                    <input
                                        type="url" name="link_facebook" value={formData.link_facebook} onChange={handleChange}
                                        placeholder="https://facebook.com/..."
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Catatan 1</label>
                                        <textarea
                                            name="catatan_1" value={formData.catatan_1} onChange={handleChange} rows="3"
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        ></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Catatan 2</label>
                                        <textarea
                                            name="catatan_2" value={formData.catatan_2} onChange={handleChange} rows="3"
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="flex items-center mt-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <input
                                        type="checkbox" id="selesai_laporan" name="selesai_laporan"
                                        checked={formData.selesai_laporan} onChange={handleChange}
                                        className="w-5 h-5 text-emerald-600 bg-white border-gray-300 rounded focus:ring-emerald-500"
                                    />
                                    <label htmlFor="selesai_laporan" className="ml-3 text-sm font-bold text-slate-800 cursor-pointer">
                                        Tanda sebagai Laporan Selesai
                                    </label>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end gap-4 pt-4">
                                <Link
                                    href="/program"
                                    className="px-6 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 hover:text-slate-800 transition-colors"
                                >
                                    Batal
                                </Link>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center justify-center px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    {submitting ? (
                                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                                    ) : (
                                        <Save className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                                    )}
                                    {submitting ? 'Menyimpan...' : 'Kemaskini Program'}
                                </button>
                            </div>
                        </form>
                    )}
                </main>
            </div>
        </ProtectedRoute>
    );
}
