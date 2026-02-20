'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
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
    const { markAsDirty } = useData();
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
    const selectedNegeri = watch('negeriCawangan');
    const selectedKategori = watch('kategori');
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
                gambarMualaf: data.gambarMualaf,
                gambarSesiPengislaman: data.gambarSesiPengislaman,
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
                        gambarMualaf: 'Gambar Mualaf',
                        gambarSesiPengislaman: 'Gambar Sesi Pengislaman',
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

            // Sanitize numeric fields - Convert empty strings to null or number
            const numericFields = ['umur', 'pendapatanBulanan', 'tanggungan'];
            numericFields.forEach(field => {
                if (submissionData[field] === '' || submissionData[field] === undefined) {
                    submissionData[field] = null;
                } else {
                    submissionData[field] = Number(submissionData[field]);
                }
            });

            // Remove FileList objects from data (keep only Base64)
            const fieldsToDelete = [
                'gambarIC', 'gambarKadIslam', 'gambarSijilPengislaman',
                'gambarMualaf', 'gambarSesiPengislaman',
                'dokumenLain1', 'dokumenLain2', 'dokumenLain3'
            ];
            fieldsToDelete.forEach(field => delete submissionData[field]);

            // Create submission with all data including files
            setUploadingFile('Menyimpan data...');
            const { id: submissionId, error: submitError } = await createSubmission(submissionData, user.id);

            if (submitError) {
                throw new Error(submitError);
            }

            // Mark as dirty so list page knows to show refresh button
            markAsDirty('mualaf');

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
            namaPenuh: 'MUHAMMAD AHMAD BIN ABDULLAH',
            noKP: '900101' + String(Math.floor(Math.random() * 1000000)).padStart(6, '0'),
            jantina: 'Lelaki',
            bangsa: 'Cina',
            agamaAsal: 'Buddha',
            tarikhLahir: '1990-01-01',
            umur: 34,
            warganegara: 'Malaysia',
            tarikhPengislaman: '2024-01-15',
            masaPengislaman: '10:30',
            tempatPengislaman: 'Masjid Wilayah Persekutuan',
            negeriPengislaman: 'Kuala Lumpur',
            noTelefon: '0123456789',
            alamatTinggal: 'No 123, Jalan Test 1/2, Taman Testing',
            poskod: '47800',
            bandar: 'Petaling Jaya',
            negeri: 'Selangor',
            alamatTetap: '',
            pekerjaan: 'Guru',
            pendapatanBulanan: 5000,
            tanggungan: 3,
            tahapPendidikan: 'Ijazah',
            bank: 'Maybank',
            noAkaun: '1234567890123',
            namaDiBank: 'MUHAMMAD AHMAD BIN ABDULLAH',
            catatan: 'Data ujian untuk sistem pendaftaran mualaf HCF 2026',
            lokasi: 'Wangsa Maju',
            kategoriElaun: 'MUALAF 1',
            registeredByName: 'Test User',
            namaPegawaiMengislamkan: 'Ustaz Abu Bakar',
            noKPPegawaiMengislamkan: '700101145555',
            noTelPegawaiMengislamkan: '0198887776',
            namaSaksi1: 'Zaid Bin Harithah',
            noKPSaksi1: '850505104444',
            noTelSaksi1: '0171112223',
            namaSaksi2: 'Usamah Bin Zaid',
            noKPSaksi2: '950202103333',
            noTelSaksi2: '0163334445',
            maklumatKenalanPengiring: 'Ali Bin Abi Talib (Bapa saudara) - 0112223334',
            catatanAudit: 'Tiada masalah dikesan'
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
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 pt-16">
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
                        {selectedKategori !== 'Non-Muslim' && (
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
                                                {...register('tarikhPengislaman', {
                                                    required: selectedKategori !== 'Non-Muslim' ? 'Wajib diisi' : false
                                                })}
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
                                                {...register('negeriPengislaman', {
                                                    required: selectedKategori !== 'Non-Muslim' ? 'Wajib dipilih' : false
                                                })}
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
                        )}

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

                        {/* Form Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
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
                                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
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
