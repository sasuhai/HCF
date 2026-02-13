'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { getSubmission, updateSubmission, getLocations } from '@/lib/firebase/firestore';
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
import { processSubmissionFiles } from '@/lib/firebase/storage';

function EditRekodContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const router = useRouter();
    const { user } = useAuth();
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadingFile, setUploadingFile] = useState('');
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        getLocations().then(({ data }) => {
            if (data) setLocations(data);
        });
    }, []);

    useEffect(() => {
        if (id) {
            loadSubmission();
        } else {
            setLoading(false);
            setError('Tiada ID rekod ditemui.');
        }
    }, [id]);

    const loadSubmission = async () => {
        const { data, error } = await getSubmission(id);
        if (!error && data) {
            reset(data);
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

            // Remove FileList objects
            delete updateData.gambarIC;
            delete updateData.gambarKadIslam;
            delete updateData.gambarSijilPengislaman;
            delete updateData.dokumenLain1;
            delete updateData.dokumenLain2;
            delete updateData.dokumenLain3;

            // Update submission
            setUploadingFile('Menyimpan data...');
            const { error: updateError } = await updateSubmission(id, updateData, user.uid);

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

                    {/* Form - Sama dengan borang page tetapi dengan data pre-filled */}
                    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-6">
                        {/* Section 1: Maklumat Pegawai/Cawangan */}
                        <div className="border-b pb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Maklumat Pegawai/Cawangan</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="form-label">
                                        No Staf / No RH <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        {...register('noStaf', { required: 'Wajib diisi' })}
                                        className="form-input"
                                    />
                                    {errors.noStaf && (
                                        <p className="text-red-500 text-sm mt-1">{errors.noStaf.message}</p>
                                    )}
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
                                        {NEGERI_CAWANGAN_OPTIONS.map(option => (
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
                                        {locations.map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
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
                                    <div className="space-y-3">
                                        {KATEGORI_OPTIONS.map(option => (
                                            <label
                                                key={option.value}
                                                className="flex items-start space-x-3 p-3 rounded-lg border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all cursor-pointer"
                                            >
                                                <input
                                                    type="radio"
                                                    value={option.value}
                                                    {...register('kategori', { required: 'Wajib dipilih' })}
                                                    className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-600"
                                                />
                                                <div className="flex-1">
                                                    <span className="font-medium text-gray-900">{option.label}</span>
                                                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    {errors.kategori && (
                                        <p className="text-red-500 text-sm mt-1">{errors.kategori.message}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="form-label">Nama Asal <span className="text-red-500">*</span></label>
                                        <input type="text" {...register('namaAsal', { required: 'Wajib diisi' })} className="form-input" />
                                        {errors.namaAsal && <p className="text-red-500 text-sm mt-1">{errors.namaAsal.message}</p>}
                                    </div>
                                    <div>
                                        <label className="form-label">Nama Islam</label>
                                        <input type="text" {...register('namaIslam')} className="form-input" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="form-label">No KP / Passport <span className="text-red-500">*</span></label>
                                        <input type="text" {...register('noKP', { required: 'Wajib diisi' })} className="form-input" />
                                        {errors.noKP && <p className="text-red-500 text-sm mt-1">{errors.noKP.message}</p>}
                                    </div>
                                    <div>
                                        <label className="form-label">Jantina <span className="text-red-500">*</span></label>
                                        <select {...register('jantina', { required: 'Wajib dipilih' })} className="form-input">
                                            <option value="">Pilih jantina</option>
                                            {JANTINA_OPTIONS.map(option => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </select>
                                        {errors.jantina && <p className="text-red-500 text-sm mt-1">{errors.jantina.message}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="form-label">Bangsa <span className="text-red-500">*</span></label>
                                        <select {...register('bangsa', { required: 'Wajib dipilih' })} className="form-input">
                                            <option value="">Pilih bangsa</option>
                                            {BANGSA_OPTIONS.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                        {errors.bangsa && <p className="text-red-500 text-sm mt-1">{errors.bangsa.message}</p>}
                                    </div>
                                    <div>
                                        <label className="form-label">Agama Asal <span className="text-red-500">*</span></label>
                                        <select {...register('agamaAsal', { required: 'Wajib dipilih' })} className="form-input">
                                            <option value="">Pilih agama asal</option>
                                            {AGAMA_ASAL_OPTIONS.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                        {errors.agamaAsal && <p className="text-red-500 text-sm mt-1">{errors.agamaAsal.message}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="form-label">Umur</label>
                                        <input type="number" {...register('umur')} className="form-input" />
                                    </div>
                                    <div>
                                        <label className="form-label">Warganegara <span className="text-red-500">*</span></label>
                                        <select {...register('warganegara', { required: 'Wajib dipilih' })} className="form-input">
                                            <option value="">Pilih warganegara</option>
                                            {WARGANEGARA_OPTIONS.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                        {errors.warganegara && <p className="text-red-500 text-sm mt-1">{errors.warganegara.message}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Maklumat Pengislaman */}
                        <div className="border-b pb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Maklumat Pengislaman</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="form-label">Tarikh Pengislaman <span className="text-red-500">*</span></label>
                                    <input type="date" {...register('tarikhPengislaman', { required: 'Wajib diisi' })} className="form-input" />
                                    {errors.tarikhPengislaman && <p className="text-red-500 text-sm mt-1">{errors.tarikhPengislaman.message}</p>}
                                </div>
                                <div>
                                    <label className="form-label">Masa Pengislaman</label>
                                    <input type="time" {...register('masaPengislaman')} className="form-input" />
                                </div>
                                <div>
                                    <label className="form-label">Tempat Pengislaman</label>
                                    <input type="text" {...register('tempatPengislaman')} className="form-input" />
                                </div>
                                <div>
                                    <label className="form-label">Negeri Pengislaman <span className="text-red-500">*</span></label>
                                    <select {...register('negeriPengislaman', { required: 'Wajib dipilih' })} className="form-input">
                                        <option value="">Pilih negeri</option>
                                        {NEGERI_PENGISLAMAN_OPTIONS.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                    {errors.negeriPengislaman && <p className="text-red-500 text-sm mt-1">{errors.negeriPengislaman.message}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Maklumat Hubungan */}
                        <div className="border-b pb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Maklumat Hubungan & Lain-lain</h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="form-label">No Telefon <span className="text-red-500">*</span></label>
                                    <input type="tel" {...register('noTelefon', { required: 'Wajib diisi' })} className="form-input" />
                                    {errors.noTelefon && <p className="text-red-500 text-sm mt-1">{errors.noTelefon.message}</p>}
                                </div>
                                <div>
                                    <label className="form-label">Alamat Tempat Tinggal <span className="text-red-500">*</span></label>
                                    <textarea {...register('alamatTinggal', { required: 'Wajib diisi' })} className="form-input" rows="3"></textarea>
                                    {errors.alamatTinggal && <p className="text-red-500 text-sm mt-1">{errors.alamatTinggal.message}</p>}
                                </div>
                                <div>
                                    <label className="form-label">Alamat Tetap</label>
                                    <textarea {...register('alamatTetap')} className="form-input" rows="3"></textarea>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="form-label">Pekerjaan</label>
                                        <input type="text" {...register('pekerjaan')} className="form-input" />
                                    </div>
                                    <div>
                                        <label className="form-label">Pendapatan Bulanan (RM)</label>
                                        <input type="number" {...register('pendapatanBulanan')} className="form-input" />
                                    </div>
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
                        </div>

                        {/* Section 5: Maklumat Tambahan & Gambar */}
                        <div className="border-b pb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Maklumat Tambahan & Gambar</h2>

                            <div className="space-y-6">
                                {/* Bank */}
                                <div>
                                    <label className="form-label">
                                        Bank
                                    </label>
                                    <select
                                        {...register('bank')}
                                        className="form-input"
                                    >
                                        <option value="">Pilih bank</option>
                                        {BANK_OPTIONS.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* No Akaun */}
                                <div>
                                    <label className="form-label">
                                        No Akaun
                                    </label>
                                    <input
                                        type="text"
                                        {...register('noAkaun')}
                                        className="form-input"
                                        placeholder="Contoh: 1234567890"
                                    />
                                </div>

                                {/* Nama di Bank */}
                                <div>
                                    <label className="form-label">
                                        Nama di Bank
                                    </label>
                                    <input
                                        type="text"
                                        {...register('namaDiBank')}
                                        className="form-input"
                                        placeholder="Nama seperti dalam akaun bank"
                                    />
                                </div>

                                {/* Kategori Elaun */}
                                <div>
                                    <label className="form-label">
                                        Kategori Elaun
                                    </label>
                                    <select
                                        {...register('kategoriElaun')}
                                        className="form-input"
                                    >
                                        <option value="">Pilih kategori elaun</option>
                                        {MUALAF_KATEGORI_ELAUN.map(option => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Kategori untuk kadar elaun/bayaran</p>
                                </div>


                                {/* File Uploads Section */}
                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Muat Naik Dokumen</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Pilih fail baru untuk menggantikan dokumen sedia ada. Jika tiada fail dipilih, dokumen asal akan dikekalkan.
                                    </p>

                                    <div className="space-y-4">
                                        {/* Nombor IC/Passport */}
                                        <div>
                                            <label className="form-label">
                                                Nombor IC / Passport
                                            </label>
                                            <input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                {...register('gambarIC')}
                                                className="form-input file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Upload salinan IC atau Passport (pilih fail baru untuk ganti)</p>
                                        </div>

                                        {/* Gambar Kad Islam */}
                                        <div>
                                            <label className="form-label">
                                                Gambar Kad Islam
                                            </label>
                                            <input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                {...register('gambarKadIslam')}
                                                className="form-input file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Upload salinan Kad Islam (pilih fail baru untuk ganti)</p>
                                        </div>

                                        {/* Gambar Sijil Pengislaman */}
                                        <div>
                                            <label className="form-label">
                                                Gambar Sijil Pengislaman
                                            </label>
                                            <input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                {...register('gambarSijilPengislaman')}
                                                className="form-input file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Upload salinan Sijil Pengislaman (pilih fail baru untuk ganti)</p>
                                        </div>

                                        {/* Gambar/Dokumen Lain 1 */}
                                        <div>
                                            <label className="form-label">
                                                Gambar / Dokumen Lain 1
                                            </label>
                                            <input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                {...register('dokumenLain1')}
                                                className="form-input file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Upload dokumen sokongan tambahan (jika ada)</p>
                                        </div>

                                        {/* Gambar/Dokumen Lain 2 */}
                                        <div>
                                            <label className="form-label">
                                                Gambar / Dokumen Lain 2
                                            </label>
                                            <input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                {...register('dokumenLain2')}
                                                className="form-input file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Upload dokumen sokongan tambahan (jika ada)</p>
                                        </div>

                                        {/* Gambar/Dokumen Lain 3 */}
                                        <div>
                                            <label className="form-label">
                                                Gambar / Dokumen Lain 3
                                            </label>
                                            <input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                {...register('dokumenLain3')}
                                                className="form-input file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Upload dokumen sokongan tambahan (jika ada)</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Catatan */}
                                <div>
                                    <label className="form-label">
                                        Catatan
                                    </label>
                                    <textarea
                                        {...register('catatan')}
                                        rows={4}
                                        className="form-input"
                                        placeholder="Masukkan sebarang catatan atau maklumat tambahan di sini (jika ada)"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Masukkan apa-apa nota atau catatan yang perlu didokumentasikan
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
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
