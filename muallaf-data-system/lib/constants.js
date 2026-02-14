// Form field constants based on Google Form structure

export const NEGERI_CAWANGAN_OPTIONS = [
    'Johor',
    'Kedah',
    'Kelantan',
    'Kuala Lumpur',
    'Melaka',
    'Negeri Sembilan',
    'Pahang',
    'Perak',
    'Perlis',
    'Pulau Pinang',
    'Sabah - Kota Kinabalu',
    'Sabah - Sandakan',
    'Sabah - Tawau',
    'Sarawak - Bintulu',
    'Sarawak - Kuching',
    'Sarawak - Miri',
    'Sarawak - Sibu',
    'Selangor',
    'Terengganu'
];

export const KATEGORI_OPTIONS = [
    {
        value: 'Pengislaman',
        label: 'Pengislaman',
        description: 'Pendaftaran pengislaman yang dikendalikan oleh HCF'
    },
    {
        value: 'Sokongan',
        label: 'Sokongan',
        description: 'Pendaftaran mualaf yang tidak memeluk Islam dengan HCF tetapi disantunani / diberi sokongan atau mengikuti kelas HCF'
    },
    {
        value: 'Non-Muslim',
        label: 'Non-Muslim',
        description: 'Pendaftaran non-muslim yang disantuni atau mengikuti kelas pengajian (Isi maklumat yang berkaitan sahaja)'
    },
    {
        value: 'Anak Mualaf',
        label: 'Anak Mualaf',
        description: 'Anak kepada ibu bapa mualaf'
    }
];

export const JANTINA_OPTIONS = [
    { value: 'Lelaki', label: 'Lelaki' },
    { value: 'Perempuan', label: 'Perempuan' }
];

export const BANGSA_OPTIONS = [
    'Bajau',
    'Bidayuh',
    'Cina',
    'Dusun',
    'Iban',
    'India',
    'Kadazan',
    'Melanau',
    'Murut',
    'Orang Asli',
    'Punjabi',
    'Serani',
    'Lain-lain'
];

export const AGAMA_ASAL_OPTIONS = [
    'Animisme',
    'Atheis',
    'Buddha',
    'Hindu',
    'Kristian',
    'Taoisme',
    'Lain-lain'
];

export const WARGANEGARA_OPTIONS = [
    'Bangladesh',
    'China',
    'Filipina',
    'India',
    'Indonesia',
    'Malaysia',
    'Myanmar',
    'Nepal',
    'Pakistan',
    'Thailand',
    'Vietnam',
    'Lain-lain'
];

export const NEGERI_PENGISLAMAN_OPTIONS = [
    ...NEGERI_CAWANGAN_OPTIONS.filter(n => !n.includes(' - ')),
    'Luar Negara'
];

export const TAHAP_PENDIDIKAN_OPTIONS = [
    'PhD',
    'Sarjana',
    'Ijazah',
    'Diploma',
    'STPM',
    'SPM',
    'PMR',
    'Sekolah Rendah',
    'Tidak Bersekolah'
];

export const BANK_OPTIONS = [
    'Affin Bank',
    'Agro Bank',
    'Alliance Bank',
    'AmBank',
    'Bank Islam',
    'Bank Muamalat',
    'Bank Rakyat',
    'BSN (Bank Simpanan Nasional)',
    'CIMB Bank',
    'Hong Leong Bank',
    'HSBC Bank',
    'Maybank',
    'MBSB Bank',
    'OCBC Bank',
    'Public Bank',
    'RHB Bank',
    'Standard Chartered',
    'UOB (United Overseas Bank)',
    'Lain-lain'
];

// Rate Categories for Mualaf
export const MUALAF_KATEGORI_ELAUN = [
    { value: 'MUALAF 1', label: 'MUALAF 1' },
    { value: 'MUALAF 2', label: 'MUALAF 2' },
    { value: 'MUALAF 3', label: 'MUALAF 3' }
];

// Rate Categories for Petugas (Staff/Workers)
export const PETUGAS_KATEGORI_ELAUN = [
    { value: 'GURU 1', label: 'GURU 1' },
    { value: 'GURU 2', label: 'GURU 2' },
    { value: 'GURU 3', label: 'GURU 3' },
    { value: 'KOORDINATOR', label: 'KOORDINATOR' },
    { value: 'PETUGAS', label: 'PETUGAS' },
    { value: 'SUKARELAWAN 1', label: 'SUKARELAWAN 1' },
    { value: 'SUKARELAWAN 2', label: 'SUKARELAWAN 2' },
    { value: 'SUKARELAWAN 3', label: 'SUKARELAWAN 3' }
];

// Default Rate Structure (initial data)
export const DEFAULT_RATE_CATEGORIES = [
    { kategori: 'MUALAF 1', jumlahElaun: 15.00, jenisPembayaran: 'bayaran/kelas', jenis: 'mualaf' },
    { kategori: 'MUALAF 2', jumlahElaun: 30.00, jenisPembayaran: 'bayaran/kelas', jenis: 'mualaf' },
    { kategori: 'MUALAF 3', jumlahElaun: 50.00, jenisPembayaran: 'bayaran/kelas', jenis: 'mualaf' },
    { kategori: 'GURU 1', jumlahElaun: 50.00, jenisPembayaran: 'bayaran/kelas', jenis: 'petugas' },
    { kategori: 'GURU 2', jumlahElaun: 80.00, jenisPembayaran: 'bayaran/kelas', jenis: 'petugas' },
    { kategori: 'GURU 3', jumlahElaun: 160.00, jenisPembayaran: 'bayaran/kelas', jenis: 'petugas' },
    { kategori: 'KOORDINATOR', jumlahElaun: 100.00, jenisPembayaran: 'bayaran/bulan', jenis: 'petugas' },
    { kategori: 'PETUGAS', jumlahElaun: 30.00, jenisPembayaran: 'bayaran/kelas', jenis: 'petugas' },
    { kategori: 'SUKARELAWAN 1', jumlahElaun: 0.00, jenisPembayaran: 'bayaran/kelas', jenis: 'petugas' },
    { kategori: 'SUKARELAWAN 2', jumlahElaun: 0.00, jenisPembayaran: 'bayaran/kelas', jenis: 'petugas' },
    { kategori: 'SUKARELAWAN 3', jumlahElaun: 0.00, jenisPembayaran: 'bayaran/kelas', jenis: 'petugas' }
];
