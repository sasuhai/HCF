'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { getSubmission, updateSubmission, getLocations, getStates, getLookupData } from '@/lib/supabase/database';
import {
    NEGERI_CAWANGAN_OPTIONS,
    KATEGORI_OPTIONS,
    JANTINA_OPTIONS,
    BANGSA_OPTIONS,
    AGAMA_ASAL_OPTIONS,
    WARGANEGARA_OPTIONS,
    NEGERI_PENGISLAMAN_OPTIONS,
    TAHAP_PENDIDIKAN_OPTIONS,
    BANK_OPTIONS,
    MUALAF_KATEGORI_ELAUN
} from '@/lib/constants';
import { ArrowLeft, Save, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { processSubmissionFiles } from '@/lib/supabase/storage';

function EditRekodContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const router = useRouter();
    const { user, role, profile, loading: authLoading } = useAuth();
    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
    const selectedNegeri = watch('negeriCawangan');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadingFile, setUploadingFile] = useState('');
    const [submission, setSubmission] = useState(null);
    const [locations, setLocations] = useState([]);
    const [states, setStates] = useState([]);
    const [races, setRaces] = useState([]);
    const [religions, setReligions] = useState([]);
    const [banks, setBanks] = useState([]);

    useEffect(() => {
        if (authLoading) return;

        getLookupData('locations').then(({ data }) => {
            if (data) {
                // Filter locations based on access
                const isRestricted = role !== 'admin' && !profile?.assignedLocations?.includes('All');
                const allowed = isRestricted
                    ? data.filter(l => profile?.assignedLocations?.includes(l.name))
                    : data;
                setLocations(allowed);
            }
        });

        getStates().then(({ data }) => {
            if (data) setStates(data.map(s => s.name));
        });

        getLookupData('races').then(({ data }) => {
            if (data) setRaces(data.map(r => r.name));
        });

        getLookupData('religions').then(({ data }) => {
            if (data) setReligions(data.map(r => r.name));
        });

        getLookupData('banks').then(({ data }) => {
            if (data) setBanks(data.map(b => b.name));
        });
    }, [role, profile, authLoading]);

    useEffect(() => {
        if (authLoading) return;

        if (id) {
            loadSubmission();
        } else {
            setLoading(false);
            setError('Tiada ID rekod ditemui.');
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
                reset(data);
            } else {
                alert("Anda tidak mempunyai akses untuk mengedit rekod ini.");
                router.push('/senarai');
            }
        }
        setLoading(false);
    };

    const onSubmit = async (data) => {
        setSaving(true);
        setError('');
        setSuccess(false);
        setUploadProgress(0);
        setUploadingFile('');

        try {
            // Prepare file data - extract FileList objects
            const fileData = {
                gambarIC: data.gambarIC,
                gambarKadIslam: data.gambarKadIslam,
                gambarSijilPengislaman: data.gambarSijilPengislaman,
                gambarMualaf: data.gambarMualaf,
                gambarSesiPengislaman: data.gambarSesiPengislaman,
                dokumenLain1: data.dokumenLain1,
                dokumenLain2: data.dokumenLain2,
                dokumenLain3: data.dokumenLain3
            };

            // Process files if any new ones were uploaded
            setUploadingFile('Memproses fail...');
            const processedFiles = await processSubmissionFiles(
                fileData,
                (progress, currentFile) => {
                    setUploadProgress(progress);
                    const fileLabels = {
                        gambarIC: 'IC/Passport',
                        gambarKadIslam: 'Kad Islam',
                        gambarSijilPengislaman: 'Sijil Pengislaman',
                        gambarMualaf: 'Gambar Mualaf',
                        gambarSesiPengislaman: 'Gambar Sesi Pengislaman',
                        dokumenLain1: 'Dokumen 1',
                        dokumenLain2: 'Dokumen 2',
                        dokumenLain3: 'Dokumen 3'
                    };
                    setUploadingFile(`Memproses ${fileLabels[currentFile] || currentFile}... ${progress}%`);
                }
            );

            // Prepare update data
            const updateData = {
                ...data,
                ...processedFiles  // Add new file data if any
            };

            // Sanitize numeric fields - Convert empty strings to null or number
            const numericFields = ['umur', 'pendapatanBulanan', 'tanggungan'];
            numericFields.forEach(field => {
                if (updateData[field] === '' || updateData[field] === undefined) {
                    updateData[field] = null;
                } else {
                    updateData[field] = Number(updateData[field]);
                }
            });

            // Remove FileList objects
            const fieldsToDelete = [
                'gambarIC', 'gambarKadIslam', 'gambarSijilPengislaman',
                'gambarMualaf', 'gambarSesiPengislaman',
                'dokumenLain1', 'dokumenLain2', 'dokumenLain3'
            ];
            fieldsToDelete.forEach(field => delete updateData[field]);

            // Update submission
            setUploadingFile('Menyimpan data...');
            const { error: updateError } = await updateSubmission(id, updateData, user.id);

            if (updateError) {
                throw new Error(updateError);
            }

            setSuccess(true);
            setUploadProgress(100);
            setUploadingFile('Selesai!');
            setSaving(false);

            setTimeout(() => {
                router.push(`/rekod?id=${id}`);
            }, 1500);

        } catch (err) {
            setError('Ralat: ' + err.message);
            setSaving(false);
            setUploadProgress(0);
            setUploadingFile('');
        }
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

    if (!id) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
                    <Navbar />
                    <div className="max-w-4xl mx-auto px-4 py-8">
                        <div className="card text-center py-12">
                            <p className="text-red-500 text-lg">Tiada ID rekod dinyatakan</p>
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
                    {/* Header */}
                    <div className="mb-6">
                        <Link href={`/rekod?id=${id}`} className="flex items-center text-emerald-600 hover:text-emerald-700 mb-4">
                            <ArrowLeft className="h-5 w-5 mr-2" />
                            <span>Kembali</span>
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Rekod</h1>
                        <p className="text-gray-600">Kemaskini maklumat rekod</p>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start space-x-3 animate-pulse">
                            <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-green-700">Berjaya!</p>
                                <p className="text-sm text-green-600">Data telah dikemaskini. Anda akan dibawa ke halaman detail...</p>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start space-x-3">
                            <AlertCircle className="h-6 w-6 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Upload Progress */}
                    {saving && uploadProgress > 0 && (
                        <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <Upload className="h-5 w-5 text-blue-500 animate-bounce" />
                                    <p className="text-sm font-medium text-blue-700">{uploadingFile}</p>
                                </div>
                                <span className="text-sm font-semibold text-blue-700">{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-2.5">
                                <div
                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-8">
                        {/* Section 1: Maklumat Pegawai & Cawangan */}
                        <div className="border-b pb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Maklumat Pegawai & Cawangan</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="form-label">
                                        No Staf / No RH <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        {...register('noStaf', { required: 'Wajib diisi' })}
                                        className="form-input"
                                        placeholder="Contoh: 12345"
                                    />
                                    {errors.noStaf && (
                                        <p className="text-red-500 text-sm mt-1">{errors.noStaf.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="form-label">
                                        Didaftarkan Oleh
                                    </label>
                                    <input
                                        type="text"
                                        {...register('registeredByName')}
                                        className="form-input"
                                        placeholder="Nama penuh pegawai pendaftar"
                                    />
                                </div>

                                <div>
                                    <label className="form-label">
                                        Negeri / Cawangan <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        {...register('negeriCawangan', { required: 'Wajib dipilih' })}
                                        className="form-input"
                                    >
                                        <option value="">Pilih negeri/cawangan</option>
                                        {(states.length > 0 ? states : NEGERI_CAWANGAN_OPTIONS).map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                    {errors.negeriCawangan && (
                                        <p className="text-red-500 text-sm mt-1">{errors.negeriCawangan.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="form-label">
                                        Lokasi
                                    </label>
                                    <select
                                        {...register('lokasi')}
                                        className="form-input"
                                    >
                                        <option value="">Pilih Lokasi</option>
                                        {locations
                                            .filter(loc => !selectedNegeri || !loc.state_name || loc.state_name === selectedNegeri)
                                            .map(loc => (
                                                <option key={loc.id || loc.name} value={loc.name}>{loc.name}</option>
                                            ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Pilih lokasi jika berkaitan</p>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Maklumat Peribadi */}
                        <div className="border-b pb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Maklumat Peribadi</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="form-label">
                                        Kategori <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {KATEGORI_OPTIONS.map(option => (
                                            <label key={option.value} className="flex items-start space-x-3 cursor-pointer p-3 rounded-xl border border-gray-100 hover:bg-emerald-50 hover:border-emerald-200 transition-all">
                                                <input
                                                    type="radio"
                                                    value={option.value}
                                                    {...register('kategori', { required: 'Wajib dipilih' })}
                                                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 mt-1"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-bold text-gray-900 text-sm">{option.label}</div>
                                                    <div className="text-[10px] text-gray-500 mt-1 leading-tight">{option.description}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    {errors.kategori && (
                                        <p className="text-red-500 text-sm mt-1">{errors.kategori.message}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-1">
                                        <label className="form-label">
                                            Nama Asal <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            {...register('namaAsal', { required: 'Wajib diisi' })}
                                            className="form-input"
                                            placeholder="Contoh: Tan Ah Kow"
                                        />
                                        {errors.namaAsal && (
                                            <p className="text-red-500 text-sm mt-1">{errors.namaAsal.message}</p>
                                        )}
                                    </div>

                                    <div className="md:col-span-1">
                                        <label className="form-label">
                                            Nama Islam
                                        </label>
                                        <input
                                            type="text"
                                            {...register('namaIslam')}
                                            className="form-input"
                                            placeholder="Contoh: Muhammad Ali"
                                        />
                                    </div>

                                    <div className="md:col-span-1">
                                        <label className="form-label">
                                            Nama Penuh (Dalam IC/Passport) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            {...register('namaPenuh', { required: 'Wajib diisi' })}
                                            className="form-input"
                                            placeholder="Sama seperti dalam dokumen ID"
                                        />
                                        {errors.namaPenuh && (
                                            <p className="text-red-500 text-sm mt-1">{errors.namaPenuh.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="form-label">
                                            No Kad Pengenalan / No Passport <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            {...register('noKP', { required: 'Wajib diisi' })}
                                            className="form-input"
                                            placeholder="Contoh: 900101015555"
                                        />
                                        {errors.noKP && (
                                            <p className="text-red-500 text-sm mt-1">{errors.noKP.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="form-label">
                                            Jantina <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            {...register('jantina', { required: 'Wajib dipilih' })}
                                            className="form-input"
                                        >
                                            <option value="">Pilih jantina</option>
                                            {JANTINA_OPTIONS.map(option => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="form-label">
                                            Bangsa <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            {...register('bangsa', { required: 'Wajib dipilih' })}
                                            className="form-input"
                                        >
                                            <option value="">Pilih bangsa</option>
                                            {(races.length > 0 ? races : BANGSA_OPTIONS).map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="form-label">
                                            Agama Asal <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            {...register('agamaAsal', { required: 'Wajib dipilih' })}
                                            className="form-input"
                                        >
                                            <option value="">Pilih agama asal</option>
                                            {(religions.length > 0 ? religions : AGAMA_ASAL_OPTIONS).map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="form-label">
                                            Tarikh Lahir
                                        </label>
                                        <input
                                            type="date"
                                            {...register('tarikhLahir')}
                                            className="form-input"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="form-label">
                                            Umur
                                        </label>
                                        <input
                                            type="number"
                                            {...register('umur')}
                                            className="form-input"
                                            placeholder="Contoh: 25"
                                        />
                                    </div>

                                    <div>
                                        <label className="form-label">
                                            Warganegara <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            {...register('warganegara', { required: 'Wajib dipilih' })}
                                            className="form-input"
                                        >
                                            <option value="">Pilih warganegara</option>
                                            {WARGANEGARA_OPTIONS.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Maklumat Pengislaman & Saksi */}
                        <div className="border-b pb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Maklumat Pengislaman & Saksi</h2>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="form-label">
                                            Tarikh Pengislaman <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            {...register('tarikhPengislaman', { required: 'Wajib diisi' })}
                                            className="form-input"
                                        />
                                    </div>

                                    <div>
                                        <label className="form-label">
                                            Masa Pengislaman
                                        </label>
                                        <input
                                            type="time"
                                            {...register('masaPengislaman')}
                                            className="form-input"
                                        />
                                    </div>

                                    <div>
                                        <label className="form-label">
                                            Tempat Pengislaman
                                        </label>
                                        <input
                                            type="text"
                                            {...register('tempatPengislaman')}
                                            className="form-input"
                                            placeholder="Contoh: Masjid Wilayah"
                                        />
                                    </div>

                                    <div>
                                        <label className="form-label">
                                            Negeri Pengislaman <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            {...register('negeriPengislaman', { required: 'Wajib dipilih' })}
                                            className="form-input"
                                        >
                                            <option value="">Pilih negeri</option>
                                            {(states.length > 0 ? states.filter(s => !s.includes(' - ')) : NEGERI_PENGISLAMAN_OPTIONS).map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <h3 className="text-sm font-bold text-emerald-800 mb-4 uppercase tracking-wider">Maklumat Pegawai Mengislamkan</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">Nama Pegawai</label>
                                            <input type="text" {...register('namaPegawaiMengislamkan')} className="form-input mt-1" placeholder="Nama Ustaz/Pegawai" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">No KP Pegawai</label>
                                            <input type="text" {...register('noKPPegawaiMengislamkan')} className="form-input mt-1" placeholder="IC Pegawai" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500 uppercase">No Tel Pegawai</label>
                                            <input type="text" {...register('noTelPegawaiMengislamkan')} className="form-input mt-1" placeholder="No Tel Pegawai" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Saksi Pertama</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">Nama Saksi 1</label>
                                                <input type="text" {...register('namaSaksi1')} className="form-input mt-1" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">No KP Saksi 1</label>
                                                <input type="text" {...register('noKPSaksi1')} className="form-input mt-1" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">No Tel Saksi 1</label>
                                                <input type="text" {...register('noTelSaksi1')} className="form-input mt-1" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Saksi Kedua</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">Nama Saksi 2</label>
                                                <input type="text" {...register('namaSaksi2')} className="form-input mt-1" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">No KP Saksi 2</label>
                                                <input type="text" {...register('noKPSaksi2')} className="form-input mt-1" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-gray-500 uppercase">No Tel Saksi 2</label>
                                                <input type="text" {...register('noTelSaksi2')} className="form-input mt-1" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Maklumat Hubungan & Adres */}
                        <div className="border-b pb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Maklumat Hubungan & Alamat</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="form-label">
                                        No Telefon <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        {...register('noTelefon', { required: 'Wajib diisi' })}
                                        className="form-input"
                                        placeholder="Contoh: 0123456789"
                                    />
                                </div>

                                <div>
                                    <label className="form-label">
                                        Alamat Tempat Tinggal <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        {...register('alamatTinggal', { required: 'Wajib diisi' })}
                                        className="form-input"
                                        rows="2"
                                        placeholder="Alamat penuh terkini"
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="form-label text-xs">Poskod</label>
                                        <input type="text" {...register('poskod')} className="form-input" />
                                    </div>
                                    <div>
                                        <label className="form-label text-xs">Bandar</label>
                                        <input type="text" {...register('bandar')} className="form-input" />
                                    </div>
                                    <div>
                                        <label className="form-label text-xs">Negeri</label>
                                        <select {...register('negeri')} className="form-input">
                                            <option value="">Pilih Negeri</option>
                                            {NEGERI_PENGISLAMAN_OPTIONS.filter(n => n !== 'Luar Negara').map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="form-label">
                                        Alamat Tetap (Ikut IC)
                                    </label>
                                    <textarea
                                        {...register('alamatTetap')}
                                        className="form-input"
                                        rows="2"
                                        placeholder="Jika berbeza dari alamat tinggal"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="form-label">
                                        Maklumat Kenalan / Pengiring
                                    </label>
                                    <input
                                        type="text"
                                        {...register('maklumatKenalanPengiring')}
                                        className="form-input"
                                        placeholder="Nama dan No Telefon kenalan terdekat"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 5: Pekerjaan & Kewangan */}
                        <div className="border-b pb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Pekerjaan & Kewangan</h2>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="form-label">Pekerjaan</label>
                                        <input type="text" {...register('pekerjaan')} className="form-input" placeholder="Contoh: Kerani" />
                                    </div>
                                    <div>
                                        <label className="form-label">Pendapatan Bulanan (RM)</label>
                                        <input type="number" {...register('pendapatanBulanan')} className="form-input" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="form-label">Bilangan Tanggungan</label>
                                        <input type="number" {...register('tanggungan')} className="form-input" />
                                    </div>
                                    <div>
                                        <label className="form-label">Tahap Pendidikan</label>
                                        <select {...register('tahapPendidikan')} className="form-input">
                                            <option value="">Pilih tahap pendidikan</option>
                                            {TAHAP_PENDIDIKAN_OPTIONS.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="form-label text-xs">Bank</label>
                                        <select {...register('bank')} className="form-input">
                                            <option value="">Pilih bank</option>
                                            {(banks.length > 0 ? banks : BANK_OPTIONS).map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label text-xs">No Akaun</label>
                                        <input type="text" {...register('noAkaun')} className="form-input" />
                                    </div>
                                    <div>
                                        <label className="form-label text-xs">Nama di Bank</label>
                                        <input type="text" {...register('namaDiBank')} className="form-input" />
                                    </div>
                                </div>

                                <div>
                                    <label className="form-label">Kategori Elaun</label>
                                    <select {...register('kategoriElaun')} className="form-input">
                                        <option value="">Pilih kategori elaun</option>
                                        {MUALAF_KATEGORI_ELAUN.map(o => (
                                            <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 6: Lampiran & Gambar */}
                        <div className="border-b pb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Lampiran & Gambar</h2>
                            <p className="text-sm text-gray-500 mb-4">Pilih fail baru untuk menggantikan fail sedia ada.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="form-label text-xs">IC / Passport</label>
                                        <input type="file" {...register('gambarIC')} className="form-input text-xs" accept="image/*,application/pdf" />
                                    </div>
                                    <div>
                                        <label className="form-label text-xs">Kad Islam</label>
                                        <input type="file" {...register('gambarKadIslam')} className="form-input text-xs" accept="image/*,application/pdf" />
                                    </div>
                                    <div>
                                        <label className="form-label text-xs">Sijil Pengislaman</label>
                                        <input type="file" {...register('gambarSijilPengislaman')} className="form-input text-xs" accept="image/*,application/pdf" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="form-label text-xs">Gambar Mualaf</label>
                                        <input type="file" {...register('gambarMualaf')} className="form-input text-xs" accept="image/*" />
                                    </div>
                                    <div>
                                        <label className="form-label text-xs">Gambar Sesi/Aktiviti</label>
                                        <input type="file" {...register('gambarSesiPengislaman')} className="form-input text-xs" accept="image/*" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="form-label text-xs">Dokumen Lain 1</label>
                                            <input type="file" {...register('dokumenLain1')} className="form-input text-xs" accept="image/*,application/pdf" />
                                        </div>
                                        <div>
                                            <label className="form-label text-xs">Dokumen Lain 2</label>
                                            <input type="file" {...register('dokumenLain2')} className="form-input text-xs" accept="image/*,application/pdf" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 7: Catatan & Remark */}
                        <div className="pb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Catatan & Pengesahan</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="form-label">Catatan Utama</label>
                                    <textarea {...register('catatan')} className="form-input" rows="3"></textarea>
                                </div>
                                <div>
                                    <label className="form-label text-amber-700 font-bold">Catatan Audit / Remark Pejabat</label>
                                    <textarea {...register('catatanAudit')} className="form-input border-amber-200 bg-amber-50/20" rows="2"></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Metadata Info */}
                        {submission && (
                            <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-gray-400 italic">
                                <div>
                                    <p>Dicipta: {submission.createdAt ? new Date(submission.createdAt).toLocaleString('ms-MY') : '-'}</p>
                                    <p>Oleh: {submission.createdBy || '-'}</p>
                                </div>
                                {submission.updatedAt && (
                                    <div className="sm:text-right">
                                        <p>Dikemaskini: {new Date(submission.updatedAt).toLocaleString('ms-MY')}</p>
                                        <p>Oleh: {submission.updatedBy || '-'}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Form Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
                            <button
                                type="submit"
                                disabled={saving || success}
                                className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5 w-5" />
                                        <span>Simpan Perubahan</span>
                                    </>
                                )}
                            </button>

                            <Link href={`/rekod?id=${id}`} className="flex-1">
                                <button
                                    type="button"
                                    disabled={saving || success}
                                    className="w-full btn-secondary disabled:opacity-50"
                                >
                                    Batal
                                </button>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </ProtectedRoute>
    );
}

export default function EditRekodPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
            <EditRekodContent />
        </Suspense>
    );
}
