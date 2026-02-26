'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useModal } from '@/contexts/ModalContext';
import { getSubmission, deleteSubmission } from '@/lib/supabase/database';
import { ArrowLeft, Edit, Trash2, User, Calendar, MapPin, Phone, Mail, Briefcase, Activity, CheckCircle, XCircle } from 'lucide-react';

function RekodDetailContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const router = useRouter();
    const { role, profile, loading: authLoading } = useAuth();
    const { showAlert, showSuccess, showError, showConfirm } = useModal();
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (id) {
            loadSubmission();
        } else {
            setLoading(false);
        }
    }, [id, role, profile, authLoading]);

    const loadSubmission = async () => {
        const { data, error } = await getSubmission(id);
        if (!error && data) {
            // Check Access
            const isAccessible = role === 'admin' ||
                profile?.assignedLocations?.includes('All') ||
                (data.lokasi && profile?.assignedLocations?.includes(data.lokasi));

            if (isAccessible) {
                setSubmission(data);
            } else {
                showError("Akses Ditolak", "Anda tidak mempunyai akses untuk melihat rekod ini.");
                router.push('/senarai');
            }
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        showConfirm('Sahkan Padam', 'Adakah anda pasti ingin memadam rekod ini?', async () => {
            const { error } = await deleteSubmission(id);
            if (!error) {
                showSuccess('Berjaya', 'Rekod telah dipadam.');
                router.push('/senarai');
            } else {
                showError('Ralat Padam', 'Ralat memadam rekod: ' + error);
            }
        });
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 pt-16">
                    <Navbar />
                    <div className="max-w-4xl mx-auto px-4 py-8">
                        <div className="card animate-shimmer h-96"></div>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    if (!submission) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 pt-16">
                    <Navbar />
                    <div className="max-w-4xl mx-auto px-4 py-8">
                        <div className="card text-center py-12">
                            <p className="text-gray-500 text-lg">Rekod tidak dijumpai</p>
                            <button onClick={() => router.back()} className="btn-primary inline-block mt-4">
                                Kembali
                            </button>
                        </div>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 pt-16">
                <Navbar />

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header with Actions */}
                    <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center text-emerald-600 hover:text-emerald-700 font-semibold"
                        >
                            <ArrowLeft className="h-5 w-5 mr-2" />
                            <span>Kembali</span>
                        </button>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handlePrint}
                                className="btn-secondary flex items-center space-x-2"
                            >
                                <span>Cetak</span>
                            </button>
                            <Link href={`/rekod/edit?id=${id}`}>
                                <button className="btn-primary flex items-center space-x-2">
                                    <Edit className="h-5 w-5" />
                                    <span>Edit</span>
                                </button>
                            </Link>
                            {role === 'admin' && (
                                <button
                                    onClick={handleDelete}
                                    className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-all duration-200 flex items-center space-x-2"
                                >
                                    <Trash2 className="h-5 w-5" />
                                    <span>Padam</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Detail Card */}
                    <div className="card shadow-2xl print:shadow-none border-t-4 border-emerald-500">
                        {/* Title */}
                        <div className="border-b pb-4 mb-6 relative">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Butiran Rekod Penuh</h1>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                <span className={`px-3 py-1 rounded-full font-bold shadow-sm ${submission.kategori === 'Non-Muslim'
                                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                    : 'bg-purple-100 text-purple-700 border border-purple-200'
                                    }`}>
                                    {submission.kategori}
                                </span>
                                <span className="flex items-center bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                                    <span className="font-bold mr-1">ID:</span> {submission.id}
                                </span>
                                {submission.lokasi && (
                                    <span className="flex items-center bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 text-emerald-700 font-medium">
                                        <MapPin className="h-4 w-4 mr-1" />
                                        {submission.lokasi}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Section 1: Maklumat Pegawai & Cawangan */}
                        <div className="mb-10 group">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center border-l-4 border-emerald-600 pl-3">
                                <Briefcase className="h-5 w-5 mr-2 text-emerald-600" />
                                Maklumat Pegawai & Cawangan
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-4 rounded-xl border border-gray-50 shadow-sm group-hover:shadow-md transition-shadow">
                                <DetailItem label="No Staf / No RH" value={submission.noStaf} />
                                <DetailItem label="Didaftarkan Oleh" value={submission.registeredByName || '-'} />
                                <DetailItem label="Negeri / Cawangan" value={submission.negeriCawangan} />
                                <DetailItem label="Lokasi" value={submission.lokasi || '-'} />
                            </div>
                        </div>

                        {/* Section 2: Maklumat Peribadi */}
                        <div className="mb-10 group">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center border-l-4 border-blue-600 pl-3">
                                <User className="h-5 w-5 mr-2 text-blue-600" />
                                Maklumat Peribadi
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-4 rounded-xl border border-gray-50 shadow-sm group-hover:shadow-md transition-shadow">
                                <DetailItem label="Nama Asal" value={submission.namaAsal} />
                                <DetailItem label="Nama Islam" value={submission.namaIslam || '-'} />
                                <DetailItem label="Nama Penuh (Dalam IC/Passport)" value={submission.namaPenuh || '-'} fullWidth />
                                <DetailItem label="No KP / Passport" value={submission.noKP} />
                                <DetailItem label="Jantina" value={submission.jantina} />
                                <DetailItem label="Bangsa" value={submission.bangsa} />
                                <DetailItem label="Agama Asal" value={submission.agamaAsal} />
                                <DetailItem label="Tarikh Lahir" value={submission.tarikhLahir || '-'} />
                                <DetailItem label="Umur" value={submission.umur || '-'} />
                                <DetailItem label="Warganegara" value={submission.warganegara} />
                            </div>
                        </div>

                        {/* Section 3: Maklumat Pengislaman & Saksi */}
                        {submission.kategori !== 'Non-Muslim' && (
                            <div className="mb-10 group">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center border-l-4 border-purple-600 pl-3">
                                    <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                                    Maklumat Pengislaman & Saksi
                                </h2>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-4 rounded-xl border border-gray-50 shadow-sm group-hover:shadow-md transition-shadow">
                                        <DetailItem label="Tarikh Pengislaman" value={submission.tarikhPengislaman} />
                                        <DetailItem label="Masa Pengislaman" value={submission.masaPengislaman || '-'} />
                                        <DetailItem label="Tempat Pengislaman" value={submission.tempatPengislaman || '-'} />
                                        <DetailItem label="Negeri Pengislaman" value={submission.negeriPengislaman} />
                                    </div>

                                    <div className="p-5 bg-emerald-50 rounded-xl border border-emerald-100">
                                        <h3 className="text-sm font-bold text-emerald-800 mb-4 uppercase tracking-wider flex items-center">
                                            <div className="w-2 h-4 bg-emerald-500 mr-2 rounded-sm"></div>
                                            Pegawai Mengislamkan
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <DetailItem label="Nama Pegawai" value={submission.namaPegawaiMengislamkan || '-'} />
                                            <DetailItem label="No KP Pegawai" value={submission.noKPPegawaiMengislamkan || '-'} />
                                            <DetailItem label="No Tel Pegawai" value={submission.noTelPegawaiMengislamkan || '-'} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                                            <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider flex items-center">
                                                <div className="w-2 h-4 bg-gray-400 mr-2 rounded-sm"></div>
                                                Saksi Pertama
                                            </h3>
                                            <div className="space-y-4">
                                                <DetailItem label="Nama Saksi 1" value={submission.namaSaksi1 || '-'} />
                                                <DetailItem label="No KP Saksi 1" value={submission.noKPSaksi1 || '-'} />
                                                <DetailItem label="No Tel Saksi 1" value={submission.noTelSaksi1 || '-'} />
                                            </div>
                                        </div>

                                        <div className="p-5 bg-gray-50 rounded-xl border border-gray-100">
                                            <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider flex items-center">
                                                <div className="w-2 h-4 bg-gray-400 mr-2 rounded-sm"></div>
                                                Saksi Kedua
                                            </h3>
                                            <div className="space-y-4">
                                                <DetailItem label="Nama Saksi 2" value={submission.namaSaksi2 || '-'} />
                                                <DetailItem label="No KP Saksi 2" value={submission.noKPSaksi2 || '-'} />
                                                <DetailItem label="No Tel Saksi 2" value={submission.noTelSaksi2 || '-'} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Section: Maklumat Susulan & KPI */}
                        {submission.pengislamanKPI && (
                            <div className="mb-10 group">
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center border-l-4 border-emerald-600 pl-3">
                                    <Activity className="h-5 w-5 mr-2 text-emerald-600" />
                                    Maklumat Susulan & KPI
                                </h2>
                                <div className="space-y-6">
                                    {/* Metrics Summary Card */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                        <KPIMetricCard
                                            label="Skor KPI"
                                            value={`${submission.pengislamanKPI?.metrics?.followUpScore?.toFixed(0) || 0}%`}
                                            subValue="Keseluruhan"
                                            color="emerald"
                                        />
                                        <KPIMetricCard
                                            label="Status"
                                            value={submission.pengislamanKPI?.metrics?.overallStatus || 'Belum Disusuli'}
                                            subValue="Follow-up"
                                            color={submission.pengislamanKPI?.metrics?.followUpScore === 100 ? 'emerald' : 'amber'}
                                        />
                                        <KPIMetricCard
                                            label="Key-in 7 Hari"
                                            value={submission.pengislamanKPI?.metrics?.isKeyInOnTime ? 'PATUH' : 'LEWAT'}
                                            subValue={`${submission.pengislamanKPI?.metrics?.daysTakenToKeyIn || 0} Hari Diambil`}
                                            color={submission.pengislamanKPI?.metrics?.isKeyInOnTime ? 'emerald' : 'red'}
                                        />
                                        <KPIMetricCard
                                            label="Kawasan"
                                            value={submission.pengislamanKPI?.kawasan || '-'}
                                            subValue="Zon Cakupan"
                                            color="blue"
                                        />
                                    </div>

                                    {/* Follow-up Details */}
                                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Senarai Semak Follow-up</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                            <KPICheckItem label="Hubungi dlm tempoh 48 jam" checked={submission.pengislamanKPI?.hubungi48j} />
                                            <KPICheckItem label="Daftar Pengislaman dlm tempoh 2 minggu" checked={submission.pengislamanKPI?.daftar2m} />
                                            <KPICheckItem label="Usaha aturkan kelas dalam tempoh 1 bulan" checked={submission.pengislamanKPI?.kelas1b} />
                                            <KPICheckItem label="Mualaf dimasukkan ke group whatsapp" checked={submission.pengislamanKPI?.whatsappGroup} />
                                            <KPICheckItem label="Ziarah dalam tempoh 3 bulan" checked={submission.pengislamanKPI?.ziarah3b} />
                                            <KPICheckItem label="Dihubungkan dgn RH/CRS dlm tempoh 1 bulan" checked={submission.pengislamanKPI?.hubungRH1b} />
                                        </div>
                                    </div>

                                    {/* Additional info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                            <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">Usaha Dakwah Duat</h3>
                                            <p className="text-gray-700 text-sm whitespace-pre-wrap">{submission.pengislamanKPI?.usahaDakwah || 'Tiada maklumat.'}</p>
                                        </div>
                                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                            <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">Catatan KPI</h3>
                                            <p className="text-gray-700 text-sm whitespace-pre-wrap">{submission.pengislamanKPI?.catatanKPI || 'Tiada catatan.'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Section 4: Hubungan & Alamat */}
                        <div className="mb-10 group">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center border-l-4 border-orange-600 pl-3">
                                <Phone className="h-5 w-5 mr-2 text-orange-600" />
                                Maklumat Hubungan & Lokasi
                            </h2>
                            <div className="bg-white p-4 rounded-xl border border-gray-50 shadow-sm group-hover:shadow-md transition-shadow">
                                <DetailItem label="No Telefon" value={submission.noTelefon} />
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                                    <DetailItem label="Poskod" value={submission.poskod || '-'} />
                                    <DetailItem label="Bandar" value={submission.bandar || '-'} />
                                    <DetailItem label="Negeri" value={submission.negeri || '-'} />
                                </div>
                                <div className="mt-4">
                                    <DetailItem label="Alamat Tempat Tinggal" value={submission.alamatTinggal} fullWidth />
                                </div>
                                <div className="mt-4">
                                    <DetailItem label="Alamat Tetap (Ikut IC)" value={submission.alamatTetap || '-'} fullWidth />
                                </div>
                                <div className="mt-4">
                                    <DetailItem label="Maklumat Kenalan / Pengiring" value={submission.maklumatKenalanPengiring || '-'} fullWidth />
                                </div>
                            </div>
                        </div>

                        {/* Section 5: Pekerjaan & Kewangan */}
                        <div className="mb-10 group">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center border-l-4 border-indigo-600 pl-3">
                                <Briefcase className="h-5 w-5 mr-2 text-indigo-600" />
                                Pekerjaan & Kewangan
                            </h2>
                            <div className="space-y-6 bg-white p-4 rounded-xl border border-gray-50 shadow-sm group-hover:shadow-md transition-shadow">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <DetailItem label="Pekerjaan" value={submission.pekerjaan || '-'} />
                                    <DetailItem label="Pendapatan Bulanan" value={submission.pendapatanBulanan ? `RM ${submission.pendapatanBulanan}` : '-'} />
                                    <DetailItem label="Bilangan Tanggungan" value={submission.tanggungan || '-'} />
                                    <DetailItem label="Tahap Pendidikan" value={submission.tahapPendidikan || '-'} />
                                </div>

                                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <h3 className="text-sm font-bold text-indigo-800 mb-4 uppercase tracking-wider">Maklumat Perbankan</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <DetailItem label="Bank" value={submission.bank || '-'} />
                                        <DetailItem label="No Akaun" value={submission.noAkaun || '-'} />
                                        <DetailItem label="Nama di Bank" value={submission.namaDiBank || '-'} />
                                    </div>
                                </div>

                                <div>
                                    <dt className="text-sm font-bold text-gray-500 uppercase tracking-tight mb-2">Kategori Elaun</dt>
                                    <dd className="inline-flex px-4 py-2 rounded-xl text-base font-bold bg-amber-100 text-amber-900 border border-amber-200">
                                        {submission.kategoriElaun || 'N/A'}
                                    </dd>
                                </div>
                            </div>
                        </div>

                        {/* Section 6: Gambar & Dokumen */}
                        <div className="mb-10 group">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center border-l-4 border-cyan-600 pl-3">
                                <MapPin className="h-5 w-5 mr-2 text-cyan-600" />
                                Gambar & Dokumen
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                <ImagePreview label="Gambar Mualaf" src={submission.gambarMualaf} />
                                <ImagePreview label="Gambar Aktiviti" src={submission.gambarSesiPengislaman} />
                                <ImagePreview label="Salinan IC" src={submission.gambarIC} />
                                <ImagePreview label="Kad Islam" src={submission.gambarKadIslam} />
                                <ImagePreview label="Sijil Pengislaman" src={submission.gambarSijilPengislaman} />
                                <ImagePreview label="Dokumen 1" src={submission.dokumenLain1} />
                                <ImagePreview label="Dokumen 2" src={submission.dokumenLain2} />
                                <ImagePreview label="Dokumen 3" src={submission.dokumenLain3} />
                            </div>
                        </div>

                        {/* Section 7: Catatan */}
                        <div className="mb-8">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Catatan & Remark</h2>
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 min-h-[100px]">
                                    <p className="text-sm font-bold text-gray-500 uppercase mb-2">Catatan Utama</p>
                                    <p className="text-gray-800 whitespace-pre-wrap">{submission.catatan || 'Tiada catatan.'}</p>
                                </div>
                                {submission.catatanAudit && (
                                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                                        <p className="text-sm font-bold text-amber-800 uppercase mb-2">Remark Pejabat / Audit</p>
                                        <p className="text-amber-900 whitespace-pre-wrap">{submission.catatanAudit}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Audit Trail */}
                        <div className="border-t pt-6 mt-6 bg-gray-50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                            <h2 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-widest">Maklumat Sistem</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] text-gray-500 uppercase">
                                <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                        <span className="font-bold text-gray-400">DICIUPTA:</span>
                                        <span>{submission.createdAt}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="font-bold text-gray-400">OLEH:</span>
                                        <span className="truncate">{submission.createdBy || '-'}</span>
                                    </div>
                                </div>
                                {submission.updatedAt && (
                                    <div className="space-y-1">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-bold text-gray-400">DIKEMASKINI:</span>
                                            <span>{submission.updatedAt}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="font-bold text-gray-400">OLEH:</span>
                                            <span className="truncate">{submission.updatedBy || '-'}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}

function DetailItem({ label, value, fullWidth = false }) {
    return (
        <div className={fullWidth ? 'col-span-full' : ''}>
            <dt className="text-xs font-bold text-gray-500 uppercase tracking-tight mb-1">{label}</dt>
            <dd className="text-base text-gray-900 font-medium">{value}</dd>
        </div>
    );
}

function ImagePreview({ label, src }) {
    if (!src) return null;

    const isPdf = typeof src === 'string' && src.startsWith('data:application/pdf');

    return (
        <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-500 uppercase mb-2">{label}</span>
            <div className="relative group aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50 shadow-sm hover:shadow-md transition-all">
                {isPdf ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4">
                        <Calendar className="h-12 w-12 text-red-400 mb-2" />
                        <span className="text-[10px] font-bold text-gray-400">DOKUMEN PDF</span>
                        <a
                            href={src}
                            download={`${label}.pdf`}
                            className="mt-2 text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded-full font-bold hover:bg-red-100"
                        >
                            MUAT TURUN
                        </a>
                    </div>
                ) : (
                    <>
                        <img
                            src={src}
                            alt={label}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <a
                                href={src}
                                download={`${label}.jpg`}
                                className="bg-white text-gray-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg"
                            >
                                Lihat / Muat Turun
                            </a>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}


export default function RekodDetailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">Loading...</div>}>
            <RekodDetailContent />
        </Suspense>
    );
}

function KPIMetricCard({ label, value, subValue, color }) {
    const colorClasses = {
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        amber: 'bg-amber-50 text-amber-700 border-amber-100',
        red: 'bg-red-50 text-red-700 border-red-100',
        blue: 'bg-blue-50 text-blue-700 border-blue-100'
    };

    const valueColors = {
        emerald: 'text-emerald-700',
        amber: 'text-amber-700',
        red: 'text-red-700',
        blue: 'text-blue-700'
    };

    return (
        <div className={`p-4 rounded-xl border ${colorClasses[color]} shadow-sm`}>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">{label}</p>
            <p className={`text-xl font-black ${valueColors[color]}`}>{value}</p>
            <p className="text-[10px] font-medium opacity-60 mt-1">{subValue}</p>
        </div>
    );
}

function KPICheckItem({ label, checked }) {
    return (
        <div className="flex items-center justify-between py-1 px-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded transition-colors">
            <span className="text-xs text-gray-700">{label}</span>
            {checked ? (
                <div className="flex items-center text-emerald-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span className="text-[10px] font-bold">YES</span>
                </div>
            ) : (
                <div className="flex items-center text-gray-400">
                    <XCircle className="h-4 w-4 mr-1" />
                    <span className="text-[10px] font-bold uppercase">NO / NA</span>
                </div>
            )}
        </div>
    );
}
