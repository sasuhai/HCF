'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { supabase } from '@/lib/supabase/client';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import {
    ArrowLeft, Loader, Edit, Trash2, ShieldAlert,
    Activity, MapPin, Users, FileText, Calendar as CalendarIcon, Clock, Link as LinkIcon
} from 'lucide-react';

export default function ProgramDetailsClient() {
    const { role } = useAuth();
    const { showAlert, showSuccess, showError, showConfirm } = useModal();
    const router = useRouter();
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const fromParam = searchParams.get('from');
    const dateParam = searchParams.get('date');

    const backLink = fromParam === 'kalendar' ? `/program/kalendar${dateParam ? `?date=${dateParam}` : ''}` : '/program';
    const backText = fromParam === 'kalendar' ? 'Kembali ke Kalendar' : 'Kembali ke Senarai';

    const [program, setProgram] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        const fetchProgram = async () => {
            try {
                const { data, error } = await supabase
                    .from('programs')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                if (!data) throw new Error("Program tidak dijumpai");

                setProgram(data);
            } catch (err) {
                console.error("Error fetching program:", err);
                setError(err.message || "Ralat memuatkan data program.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProgram();
        }
    }, [id]);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('programs')
                .delete()
                .eq('id', id);

            if (error) throw error;
            router.push('/program');
        } catch (err) {
            console.error("Error deleting program:", err);
            showError('Ralat Padam', "Ralat memadam program. Sila cuba lagi.");
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-50 flex flex-col pt-16">
                    <Navbar />
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center space-y-4">
                            <Loader className="w-10 h-10 text-emerald-500 animate-spin" />
                            <p className="text-gray-500 font-medium">Memuatkan data program...</p>
                        </div>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    if (error || !program) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gray-50 pt-16 font-sans">
                    <Navbar />
                    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                        <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-200">
                            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4 opacity-80" />
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Ralat</h2>
                            <p className="text-slate-500 mb-6">{error || 'Program tidak dijumpai'}</p>
                            <Link href={backLink} className="inline-flex items-center justify-center px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-medium">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                {backText}
                            </Link>
                        </div>
                    </main>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 pt-16 font-sans pb-20">
                <Navbar />

                <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                    {/* Header & Actions */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <Link
                                href={backLink}
                                className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors mb-4"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                {backText}
                            </Link>
                            <div className="flex items-center space-x-3 mb-2">
                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${program.status_program === 'Selesai' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {program.status_program}
                                </span>
                                <span className="px-3 py-1 bg-slate-200 text-slate-600 text-xs font-bold rounded-full">
                                    {program.tahun} / {program.bulan}
                                </span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-[#1E293B] tracking-tight">
                                {program.nama_program}
                            </h1>
                            <p className="text-slate-500 font-medium mt-1 flex items-center">
                                <MapPin className="w-4 h-4 mr-1" /> {program.negeri}
                            </p>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                            {(role === 'admin' || role === 'editor') && (
                                <>
                                    <Link
                                        href={`/program/edit?id=${id}`}
                                        className="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all font-medium text-sm shadow-sm"
                                    >
                                        <Edit className="w-4 h-4 mr-2" />
                                        Kemaskini
                                    </Link>
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2.5 bg-white text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-all font-medium text-sm shadow-sm"
                                    >
                                        <Trash2 className="w-4 h-4 md:mr-2" />
                                        <span className="hidden md:inline">Padam</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Delete Confirmation Modal */}
                    {showDeleteConfirm && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                                <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
                                <h3 className="text-xl font-bold text-slate-900 mb-2">Padam Program?</h3>
                                <p className="text-slate-500 text-sm mb-6">Tindakan ini tidak boleh diundur. Adakah anda pasti mahu memadam rekod program ini?</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex justify-center items-center"
                                    >
                                        {isDeleting ? <Loader className="w-4 h-4 animate-spin" /> : 'Ya, Padam'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

                        <div className="lg:col-span-2 space-y-6 md:space-y-8">
                            {/* Maklumat Asas */}
                            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200/60">
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center mb-6">
                                    <Activity className="w-5 h-5 mr-3 text-emerald-500" />
                                    Perincian Program
                                </h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                                    <div>
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Jenis Program</span>
                                        <span className="text-sm font-medium text-slate-900 bg-slate-100 px-3 py-1 rounded-lg inline-block">{program.jenis_program || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kategori Utama</span>
                                        <span className="text-sm font-medium text-slate-900">{program.kategori_utama || '-'}</span>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sub Kategori</span>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {program.sub_kategori && program.sub_kategori.length > 0 ?
                                                program.sub_kategori.map((sub, i) => (
                                                    <span key={i} className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">{sub}</span>
                                                ))
                                                : <span className="text-sm text-slate-500">-</span>
                                            }
                                        </div>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kawasan / Cawangan Terlibat</span>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {program.kawasan_cawangan && program.kawasan_cawangan.length > 0 ?
                                                program.kawasan_cawangan.map((kaw, i) => (
                                                    <span key={i} className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">{kaw}</span>
                                                ))
                                                : <span className="text-sm text-slate-500">-</span>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Info Masa & Tempat */}
                            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200/60">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="flex items-start">
                                        <div className="bg-amber-50 p-3 rounded-2xl mr-4 flex-shrink-0">
                                            <CalendarIcon className="w-6 h-6 text-amber-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-800 mb-1">Tarikh Penganjuran</h3>
                                            <p className="text-slate-600 font-medium">
                                                {program.tarikh_mula ? new Date(program.tarikh_mula).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                                {program.tarikh_tamat && ` hingga ${new Date(program.tarikh_tamat).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                                            </p>
                                            {(program.masa_mula || program.masa_tamat) && (
                                                <p className="text-slate-500 text-sm mt-1 flex items-center">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {program.masa_mula || '?'} - {program.masa_tamat || '?'}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-start md:border-l md:border-slate-100 md:pl-8">
                                        <div className="bg-blue-50 p-3 rounded-2xl mr-4 flex-shrink-0">
                                            <MapPin className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-800 mb-1">Tempat / Venue</h3>
                                            <p className="text-slate-600 font-medium">
                                                {program.tempat || 'Tidak dinyatakan'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Maklumat Tambahan */}
                            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200/60">
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center mb-6">
                                    <FileText className="w-5 h-5 mr-3 text-slate-400" />
                                    Maklumat Tambahan
                                </h2>

                                <div className="space-y-6">
                                    <div>
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Penganjur Bersama</span>
                                        <p className="text-sm font-medium text-slate-900">
                                            {program.anjuran && program.anjuran.length > 0 ? program.anjuran.join(', ') : '-'}
                                        </p>
                                    </div>
                                    {program.kawasan_ikram && (
                                        <div>
                                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kerjasama IKRAM</span>
                                            <p className="text-sm font-medium text-slate-900">{program.kawasan_ikram}</p>
                                        </div>
                                    )}
                                    {program.link_facebook && (
                                        <div>
                                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pautan Laporan</span>
                                            <a href={program.link_facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
                                                <LinkIcon className="w-3 h-3 mr-1" />
                                                Buka Laporan FB
                                            </a>
                                        </div>
                                    )}

                                    {(program.catatan_1 || program.catatan_2) && (
                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                            {program.catatan_1 && (
                                                <div className="mb-3">
                                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Catatan 1</span>
                                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{program.catatan_1}</p>
                                                </div>
                                            )}
                                            {program.catatan_2 && (
                                                <div>
                                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Catatan 2</span>
                                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{program.catatan_2}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar: Kehadiran */}
                        <div className="space-y-6">
                            <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-[2rem] p-6 shadow-xl text-white">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-bold tracking-tight flex items-center">
                                        <Users className="w-5 h-5 mr-2 text-emerald-400" />
                                        Kehadiran
                                    </h2>
                                    <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-medium border border-white/20">
                                        Laporan
                                    </div>
                                </div>

                                <div className="text-center bg-white/5 rounded-2xl py-6 mb-6 border border-white/10">
                                    <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">Jumlah Hadir / Capaian</p>
                                    <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">
                                        {program.kehadiran_keseluruhan || 0}
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                                        <span className="text-sm text-slate-300">RH (Rakan Hidayah)</span>
                                        <span className="font-bold">{program.kehadiran_rh || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                                        <span className="text-sm text-slate-300">Daie Dilatih</span>
                                        <span className="font-bold">{program.kehadiran_daie || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                                        <span className="text-sm text-slate-300">Non Muslim</span>
                                        <span className="font-bold text-amber-300">{program.kehadiran_non_muslim || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                                        <span className="text-sm text-slate-300">Quality Engage</span>
                                        <span className="font-bold text-amber-300">{program.kehadiran_quality || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                                        <span className="text-sm text-slate-300">Mad'u 3 Bintang</span>
                                        <span className="font-bold text-amber-300">{program.kehadiran_madu || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                                        <span className="text-sm text-slate-300">Syahadah</span>
                                        <span className="font-bold text-emerald-400">{program.kehadiran_syahadah || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm text-slate-300">Muallaf</span>
                                        <span className="font-bold text-emerald-400">{program.kehadiran_muallaf || 0}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Status Checklist / Indicator */}
                            <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-200">
                                <h3 className="text-sm font-bold text-slate-800 mb-4">Status Dokumen</h3>
                                <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${program.selesai_laporan ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                        {program.selesai_laporan ? <Edit className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${program.selesai_laporan ? 'text-emerald-700' : 'text-slate-600'}`}>
                                            {program.selesai_laporan ? 'Laporan Telah Selesai' : 'Laporan Belum Selesai'}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {program.selesai_laporan ? 'Dokumentasi untuk rekod ini telah ditandakan selesai.' : 'Sila pastikan semua dokumen diisi.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
