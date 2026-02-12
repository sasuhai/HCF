// Form field constants based on Google Form structure

export const NEGERI_CAWANGAN_OPTIONS = [
    'Perlis',
    'Kedah',
    'Pulau Pinang',
    'Perak',
    'Kuala Lumpur',
    'Selangor',
    'Negeri Sembilan',
    'Melaka',
    'Johor',
    'Kelantan',
    'Terengganu',
    'Pahang',
    'Sarawak - Kuching',
    'Sarawak - Sibu',
    'Sarawak - Miri',
    'Sarawak - Bintulu',
    'Sabah - Kota Kinabalu',
    'Sabah - Sandakan',
    'Sabah - Tawau'
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
    'Cina',
    'India',
    'Serani',
    'Punjabi',
    'Kadazan',
    'Dusun',
    'Bajau',
    'Murut',
    'Iban',
    'Bidayuh',
    'Melanau',
    'Orang Asli',
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
    'Malaysia',
    'Indonesia',
    'Filipina',
    'Thailand',
    'Myanmar',
    'Vietnam',
    'China',
    'India',
    'Bangladesh',
    'Pakistan',
    'Nepal',
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
    'Maybank',
    'CIMB Bank',
    'Public Bank',
    'RHB Bank',
    'Hong Leong Bank',
    'AmBank',
    'Bank Islam',
    'Bank Rakyat',
    'BSN (Bank Simpanan Nasional)',
    'OCBC Bank',
    'HSBC Bank',
    'Standard Chartered',
    'UOB (United Overseas Bank)',
    'Affin Bank',
    'Alliance Bank',
    'Bank Muamalat',
    'MBSB Bank',
    'Agro Bank',
    'Lain-lain'
];
