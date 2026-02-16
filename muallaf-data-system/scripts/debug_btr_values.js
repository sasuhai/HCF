const fs = require('fs');
const Papa = require('papaparse');

const CSV_FILE_PATH = '/Users/sasuhai/Desktop/HCFBTR/spo2025.csv';

const debugValues = () => {
    const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');
    Papa.parse(fileContent, {
        header: true,
        complete: (results) => {
            const records = results.data;
            const registeredBy = new Set();
            const tempatPengislaman = new Set();
            const negeriPengislaman = new Set();

            records.forEach(r => {
                if (r['Didaftarkan Oleh :']) registeredBy.add(r['Didaftarkan Oleh :'].trim());
                if (r['TempatPengislaman']) tempatPengislaman.add(r['TempatPengislaman'].trim());
                if (r['NegeriPengislaman']) negeriPengislaman.add(r['NegeriPengislaman'].trim());
            });

            console.log('Sample "Didaftarkan Oleh :" values:');
            console.log(Array.from(registeredBy).slice(0, 20));

            console.log('\nSample "TempatPengislaman" values:');
            console.log(Array.from(tempatPengislaman).slice(0, 20));

            console.log('\nSample "NegeriPengislaman" values:');
            console.log(Array.from(negeriPengislaman).slice(0, 20));

            const btr = records.filter(r =>
                (r['Didaftarkan Oleh :'] && r['Didaftarkan Oleh :'].includes('BANDAR TUN RAZAK')) ||
                (r['TempatPengislaman'] && r['TempatPengislaman'].includes('Bandar Tun Razak'))
            );
            console.log(`\nFound ${btr.length} records matching "Bandar Tun Razak"`);
            if (btr.length > 0) {
                console.log('Sample BTR record fields:');
                console.log({
                    NegeriCawangan: btr[0]['NegeriCawangan'],
                    TempatPengislaman: btr[0]['TempatPengislaman'],
                    NegeriPengislaman: btr[0]['NegeriPengislaman'],
                    'Didaftarkan Oleh :': btr[0]['Didaftarkan Oleh :']
                });
            }
        }
    });
};

debugValues();
