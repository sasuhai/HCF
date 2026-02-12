'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { getSubmission, deleteSubmission } from '@/lib/firebase/firestore';
import { ArrowLeft, Edit, Trash2, User, Calendar, MapPin, Phone, Mail, Briefcase } from 'lucide-react';

export default function RekodDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { role } = useAuth();
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSubmission();
    }, [params.id]);

    const loadSubmission = async () => {
        const { data, error } = await getSubmission(params.id);
        if (!error && data) {
            setSubmission(data);
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        if (confirm('Adakah anda pasti ingin memadam rekod ini?')) {
            const { error } = await deleteSubmission(params.id);
            if (!error) {
                router.push('/senarai');
            } else {
                alert('Ralat memadam rekod: ' + error);
            }
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
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
                <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
                    <Navbar />
                    <div className="max-w-4xl mx-auto px-4 py-8">
                        <div className="card text-center py-12">
                            <p className="text-gray-500 text-lg">Rekod tidak dijumpai</p>
                            <Link href="/senarai" className="btn-primary inline-block mt-4">
                                Kembali ke Senarai
                            </Link>
                        </div>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
                <Navbar />

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header with Actions */}
                    <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <Link href="/senarai" className="flex items-center text-emerald-600 hover:text-emerald-700">
                            <ArrowLeft className="h-5 w-5 mr-2" />
                            <span>Kembali</span>
                        </Link>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handlePrint}
                                className="btn-secondary flex items-center space-x-2"
                            >
                                <span>Cetak</span>
                            </button>
                            <Link href={`/rekod/${params.id}/edit`}>
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
                    <div className="card print:shadow-none">
                        {/* Title */}
                        <div className="border-b pb-4 mb-6">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">Butiran Rekod Penuh</h1>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className={`px-3 py-1 rounded-full font-semibold ${submission.kategori === 'Non-Muslim'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-purple-100 text-purple-700'
                                    }`}>
                                    {submission.kategori}
                                </span>
                                <span>ID: {submission.id}</span>
                            </div>
                        </div>

                        {/* Section 1: Maklumat Pegawai */}
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Briefcase className="h-5 w-5 mr-2 text-emerald-600" />
                                Maklumat Pegawai/Cawangan
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DetailItem label="No Staf / No RH" value={submission.noStaf} />
                                <DetailItem label="Negeri / Cawangan" value={submission.negeriCawangan} />
                            </div>
                        </div>

                        {/* Section 2: Maklumat Peribadi */}
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <User className="h-5 w-5 mr-2 text-emerald-600" />
                                Maklumat Peribadi
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DetailItem label="Nama Asal" value={submission.namaAsal} />
                                <DetailItem label="Nama Islam" value={submission.namaIslam || '-'} />
                                <DetailItem label="No KP / Passport" value={submission.noKP} />
                                <DetailItem label="Jantina" value={submission.jantina} />
                                <DetailItem label="Bangsa" value={submission.bangsa} />
                                <DetailItem label="Agama Asal" value={submission.agamaAsal} />
                                <DetailItem label="Umur" value={submission.umur || '-'} />
                                <DetailItem label="Warganegara" value={submission.warganegara} />
                            </div>
                        </div>

                        {/* Section 3: Maklumat Pengislaman */}
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Calendar className="h-5 w-5 mr-2 text-emerald-600" />
                                Maklumat Pengislaman
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DetailItem label="Tarikh Pengislaman" value={submission.tarikhPengislaman} />
                                <DetailItem label="Masa Pengislaman" value={submission.masaPengislaman || '-'} />
                                <DetailItem label="Tempat Pengislaman" value={submission.tempatPengislaman || '-'} />
                                <DetailItem label="Negeri Pengislaman" value={submission.negeriPengislaman} />
                            </div>
                        </div>

                        {/* Section 4: Maklumat Hubungan */}
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <Phone className="h-5 w-5 mr-2 text-emerald-600" />
                                Maklumat Hubungan
                            </h2>
                            <div className="space-y-4">
                                <DetailItem label="No Telefon" value={submission.noTelefon} />
                                <DetailItem label="Alamat Tempat Tinggal" value={submission.alamatTinggal} fullWidth />
                                <DetailItem label="Alamat Tetap" value={submission.alamatTetap || '-'} fullWidth />
                            </div>
                        </div>

                        {/* Section 5: Maklumat Lain-lain */}
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Maklumat Tambahan</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <DetailItem label="Pekerjaan" value={submission.pekerjaan || '-'} />
                                <DetailItem label="Pendapatan Bulanan" value={submission.pendapatanBulanan ? `RM ${submission.pendapatanBulanan}` : '-'} />
                                <DetailItem label="Tahap Pendidikan" value={submission.tahapPendidikan || '-'} />
                            </div>
                        </div>

                        {/* Audit Trail */}
                        {submission.createdAt && (
                            <div className="border-t pt-6 mt-6">
                                <h2 className="text-sm font-semibold text-gray-700 mb-3">Maklumat Sistem</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
                                    <div>
                                        <span className="font-medium">Dicipta pada:</span>{' '}
                                        {submission.createdAt?.toDate?.().toLocaleString('ms-MY') || submission.createdAt}
                                    </div>
                                    {submission.updatedAt && (
                                        <div>
                                            <span className="font-medium">Dikemaskini pada:</span>{' '}
                                            {submission.updatedAt?.toDate?.().toLocaleString('ms-MY') || submission.updatedAt}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}

function DetailItem({ label, value, fullWidth = false }) {
    return (
        <div className={fullWidth ? 'col-span-full' : ''}>
            <dt className="text-sm font-medium text-gray-600 mb-1">{label}</dt>
            <dd className="text-base text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">{value}</dd>
        </div>
    );
}
