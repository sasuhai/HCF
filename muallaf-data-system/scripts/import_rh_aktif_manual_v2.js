const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const rawData = `
1	VB24026	MAZRINA MOHD MOKHTAR	0126277599	Ampang Jaya	Ketua	1		FALSE	1. majlis pengislaman Daren				/
2	VB19015	FAISAL BIN AHMAD SHAH	0193449765	Ampang Jaya	AJK Outreach			FALSE					
3	VB25009	NAJIHA DHANIA BT IDRIS	0136360591	Ampang Jaya	AJK Lain-lain			FALSE					
4	VB25037	SHAMSUL ANUAR SHAMSUDDIN	184070591	Ampang Jaya	Bendahari			FALSE					
5	VW19032	ISMAYANTY BINTI A RAZAK	0126696971	Ampang Jaya				FALSE					
6	VW20121	NAPISAH AHMAD RADZI	0133524266	Ampang Jaya	AJK Outreach			FALSE					
7	VB25031	AMEERA HURRIN BINTI GHULAM ALI SHAH	1162612012	Ampang Jaya	AJK Lain-lain			FALSE					
8	VB25024	ZURAIDAH BT SANDING	01111795161	Ampang Jaya	AJK Pembangunan Mualaf			FALSE					
9	VB25023	YUHANA YUNUS	0124060933	Ampang Jaya	AJK Pembangunan Mualaf			FALSE					
10	VW25021	SITI RAHMAH ABDUL RAHMAN	183075264	Ampang Jaya	Setiausaha			FALSE					
11	VB24004	AHMAD RAFIF BIN ABDUL MUDTALIB	0134300676	Ampang Jaya				FALSE					
12	VB25007	WAN AHMAD FAIQ BIN W. ADNAN	01123319535	Ampang Jaya				FALSE					/
13	VB99003	NOORAZIAN BINTI ANIDIN		Ampang Jaya	Advisory Committee			FALSE					
14	VB24037	MUHAMMAD SYAFIQ BIN ISMAIL JALI	0173005318	Bandar Baru Bangi	Ketua			FALSE					
15	VB25099	WAN ABDULLAH BIN WAN SALLEH	133308552	Bandar Baru Bangi	Naib Ketua			FALSE					
16	VB25106	MUHAMMAD SYAZWAN BIN AHMAD	1127100141	Bandar Baru Bangi	Setiausaha			FALSE					
17	VB25107	MOHD AQEL AREF BIN ISHAK	132719008	Bandar Baru Bangi	Bendahari			FALSE					
18	VB25101	AHMAD FARID BIN ARIFF	108417848	Bandar Baru Bangi	AJK Outreach			FALSE					
19	VJ25029	ALWI HASRAT	193132246	Bandar Baru Bangi	AJK Lain-lain			FALSE					
20	VB20360	NUR AISYAH AIMI ABD RAHMAN	0137319755	Ampang Jaya		1		FALSE	1. majlis pengislaman fatimah & zaharah				
`;

async function run() {
    const lines = rawData.trim().split('\n');
    const records = lines.map(line => {
        const parts = line.split('\t');

        const parseBool = (val) => {
            if (!val) return false;
            const v = val.trim().toLowerCase();
            return v === 'true' || v === 'ya' || v === '/' || v === '1';
        };

        const parseNumber = (val) => {
            if (!val) return 0;
            return parseInt(val.trim()) || 0;
        };

        return {
            category: 'rh_aktif',
            year: 2026,
            state: 'Selangor',
            data: {
                no_ahli: (parts[1] || '').trim(),
                nama: (parts[2] || '').trim(),
                no_tel: (parts[3] || '').trim(),
                kawasan: (parts[4] || '').trim(),
                jawatan: (parts[5] || '').trim(),
                bil_outreach: parseNumber(parts[6]),
                bil_hcf_lain: parseNumber(parts[7]),
                mualaf: parseBool(parts[8]),
                catatan_1: (parts[9] || '').trim(),
                catatan_2: (parts[10] || '').trim(),
                status_rh_aktif: true, // They are in RH Aktif tab
                status_duat_aktif: parseBool(parts[12]),
                status_duat_kualiti: parseBool(parts[13])
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    });

    console.log(`Inserting ${records.length} records into other_kpis...`);

    // Check for duplicates before inserting (by no_ahli within same year/category/state)
    // But since no_ahli might be empty for some, maybe just insert all as requested.

    const { data, error } = await supabase.from('other_kpis').insert(records);
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Successfully inserted 20 records.');
    }
}

run();
