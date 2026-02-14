'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { createSubmission, getLocations, getStates, getLookupData } from '@/lib/supabase/database';
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
import { Save, RotateCcw, CheckCircle, AlertCircle, Zap, Upload } from 'lucide-react';
import { processSubmissionFiles } from '@/lib/supabase/storage';

export default function BorangPage() {
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
    const selectedNegeri = watch('negeriCawangan');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadingFile, setUploadingFile] = useState('');
    const [locations, setLocations] = useState([]); // State for locations
    const [states, setStates] = useState([]); // State for states (negeri)
    const [races, setRaces] = useState([]);
    const [religions, setReligions] = useState([]);
    const [banks, setBanks] = useState([]);

    // Fetch locations and states on mount
    useEffect(() => {
        const fetchData = async () => {
            const [locsRes, statesRes, racesRes, religionsRes, banksRes] = await Promise.all([
                getLookupData('locations'),
                getStates(),
                getLookupData('races'),
                getLookupData('religions'),
                getLookupData('banks')
            ]);

            if (locsRes.data) setLocations(locsRes.data);
            if (statesRes.data) setStates(statesRes.data.map(s => s.name));
            if (racesRes.data) setRaces(racesRes.data.map(r => r.name));
            if (religionsRes.data) setReligions(religionsRes.data.map(r => r.name));
            if (banksRes.data) setBanks(banksRes.data.map(b => b.name));
        };
        fetchData();
    }, []);
    const { user } = useAuth();
    const router = useRouter();


    const onSubmit = async (data) => {
        setLoading(true);
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

            // Process files to Base64 if any
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

            // Prepare submission data with file data
            const submissionData = {
                ...data,
                ...processedFiles  // Add Base64 file data directly to document
            };

            // Remove FileList objects from data (keep only Base64)
            delete submissionData.gambarIC;
            delete submissionData.gambarKadIslam;
            delete submissionData.gambarSijilPengislaman;
            delete submissionData.dokumenLain1;
            delete submissionData.dokumenLain2;
            delete submissionData.dokumenLain3;

            // Create submission with all data including files
            setUploadingFile('Menyimpan data...');
            const { id: submissionId, error: submitError } = await createSubmission(submissionData, user.id);

            if (submitError) {
                throw new Error(submitError);
            }

            setSuccess(true);
            setUploadProgress(100);
            setUploadingFile('Selesai!');
            setLoading(false);

            setTimeout(() => {
                router.push('/senarai');
            }, 2000);

        } catch (err) {
            setError('Ralat: ' + err.message);
            setLoading(false);
            setUploadProgress(0);
            setUploadingFile('');
        }
    };


    const handleReset = () => {
        reset();
        setSuccess(false);
        setError('');
    };

    // Autofill test data for development
    const fillTestData = () => {
        const testData = {
            noStaf: 'TEST' + Math.floor(Math.random() * 10000),
            negeriCawangan: 'Selangor',
            kategori: 'Pengislaman',
            namaAsal: 'Ahmad Bin Abdullah',
            namaIslam: 'Muhammad Ahmad',
            noKP: '900101' + String(Math.floor(Math.random() * 1000000)).padStart(6, '0'),
            jantina: 'Lelaki',
            bangsa: 'Cina',
            agamaAsal: 'Buddha',
            umur: 34,
            warganegara: 'Malaysia',
            tarikhPengislaman: '2024-01-15',
            masaPengislaman: '10:30',
            tempatPengislaman: 'Masjid Wilayah Persekutuan',
            negeriPengislaman: 'Kuala Lumpur',
            noTelefon: '0123456789',
            alamatTinggal: 'No 123, Jalan Test 1/2, Taman Testing, 47800 Petaling Jaya, Selangor',
            alamatTetap: '',
            pekerjaan: 'Guru',
            pendapatanBulanan: 5000,
            tahapPendidikan: 'Ijazah',
            bank: 'Maybank',
            noAkaun: '1234567890123',
            namaDiBank: 'MUHAMMAD AHMAD BIN ABDULLAH',
            catatan: 'Data ujian untuk sistem pendaftaran mualaf HCF 2026',
            lokasi: 'Wangsa Maju' // Default test location
        };

        // Use setValue to fill all fields
        Object.keys(testData).forEach(key => {
            setValue(key, testData[key]);
        });

        setError('');
        setSuccess(false);
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
                <Navbar />

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Borang Kemasukan Data</h1>
                        <p className="text-gray-600">Sila isi semua maklumat dengan lengkap dan tepat</p>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start space-x-3 animate-pulse">
                            <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-semibold text-green-700">Berjaya!</p>
                                <p className="text-sm text-green-600">Data telah disimpan. Anda akan dibawa ke senarai rekod...</p>
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
                    {loading && uploadProgress > 0 && (
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

                    {/* Form */}
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
                                        placeholder="Contoh: 12345"
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
                                {/* Kategori */}
                                <div>
                                    <label className="form-label">
                                        Kategori <span className="text-red-500">*</span>
                                    </label>
                                    <div className="space-y-3">
                                        {KATEGORI_OPTIONS.map(option => (
                                            <label key={option.value} className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                                <input
                                                    type="radio"
                                                    value={option.value}
                                                    {...register('kategori', { required: 'Wajib dipilih' })}
                                                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 mt-1"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900">{option.label}</div>
                                                    <div className="text-sm text-gray-600 mt-1">{option.description}</div>
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
                                        <label className="form-label">
                                            Nama Asal <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            {...register('namaAsal', { required: 'Wajib diisi' })}
                                            className="form-input"
                                            placeholder="Nama penuh"
                                        />
                                        {errors.namaAsal && (
                                            <p className="text-red-500 text-sm mt-1">{errors.namaAsal.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="form-label">
                                            Nama Islam
                                        </label>
                                        <input
                                            type="text"
                                            {...register('namaIslam')}
                                            className="form-input"
                                            placeholder="Nama Islam (jika ada)"
                                        />
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
                                        {errors.jantina && (
                                            <p className="text-red-500 text-sm mt-1">{errors.jantina.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                        {errors.bangsa && (
                                            <p className="text-red-500 text-sm mt-1">{errors.bangsa.message}</p>
                                        )}
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
                                        {errors.agamaAsal && (
                                            <p className="text-red-500 text-sm mt-1">{errors.agamaAsal.message}</p>
                                        )}
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
                                        {errors.warganegara && (
                                            <p className="text-red-500 text-sm mt-1">{errors.warganegara.message}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Maklumat Pengislaman */}
                        <div className="border-b pb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Maklumat Pengislaman</h2>

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
                                    {errors.tarikhPengislaman && (
                                        <p className="text-red-500 text-sm mt-1">{errors.tarikhPengislaman.message}</p>
                                    )}
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
                                    {errors.negeriPengislaman && (
                                        <p className="text-red-500 text-sm mt-1">{errors.negeriPengislaman.message}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Maklumat Hubungan & Lain-lain */}
                        <div className="border-b pb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Maklumat Hubungan & Lain-lain</h2>

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
                                    {errors.noTelefon && (
                                        <p className="text-red-500 text-sm mt-1">{errors.noTelefon.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="form-label">
                                        Alamat Tempat Tinggal <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        {...register('alamatTinggal', { required: 'Wajib diisi' })}
                                        className="form-input"
                                        rows="3"
                                        placeholder="Alamat lengkap tempat tinggal semasa"
                                    ></textarea>
                                    {errors.alamatTinggal && (
                                        <p className="text-red-500 text-sm mt-1">{errors.alamatTinggal.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="form-label">
                                        Alamat Tetap
                                    </label>
                                    <textarea
                                        {...register('alamatTetap')}
                                        className="form-input"
                                        rows="3"
                                        placeholder="Alamat tetap (jika berbeza)"
                                    ></textarea>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="form-label">
                                            Pekerjaan
                                        </label>
                                        <input
                                            type="text"
                                            {...register('pekerjaan')}
                                            className="form-input"
                                            placeholder="Contoh: Guru"
                                        />
                                    </div>

                                    <div>
                                        <label className="form-label">
                                            Pendapatan Bulanan (RM)
                                        </label>
                                        <input
                                            type="number"
                                            {...register('pendapatanBulanan')}
                                            className="form-input"
                                            placeholder="Contoh: 3000"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="form-label">
                                        Tahap Pendidikan
                                    </label>
                                    <select
                                        {...register('tahapPendidikan')}
                                        className="form-input"
                                    >
                                        <option value="">Pilih tahap pendidikan</option>
                                        {TAHAP_PENDIDIKAN_OPTIONS.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Page 3: Maklumat Tambahan & Gambar */}
                        <div className="card">
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
                                        {(banks.length > 0 ? banks : BANK_OPTIONS).map(option => (
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
                                        Nota: Sila naik dokumen dalam format PDF, JPG atau PNG. Saiz maksimum 5MB bagi setiap fail.
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
                                            <p className="text-xs text-gray-500 mt-1">Upload salinan IC atau Passport</p>
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
                                            <p className="text-xs text-gray-500 mt-1">Upload salinan Kad Islam</p>
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
                                            <p className="text-xs text-gray-500 mt-1">Upload salinan Sijil Pengislaman</p>
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
                                disabled={loading || success}
                                className="flex-1 btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5 w-5" />
                                        <span>Simpan Data</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={fillTestData}
                                disabled={loading || success}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
                            >
                                <Zap className="h-5 w-5" />
                                <span>Autofill Test Data</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleReset}
                                disabled={loading || success}
                                className="flex-1 btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50"
                            >
                                <RotateCcw className="h-5 w-5" />
                                <span>Set Semula</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </ProtectedRoute>
    );
}
