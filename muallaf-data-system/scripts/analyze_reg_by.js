const fs = require('fs');
const Papa = require('papaparse');

const CSV_FILE_PATH = '/Users/sasuhai/Desktop/HCFBTR/spo2025.csv';

const analyzeDidaftarkanOleh = () => {
    const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');
    Papa.parse(fileContent, {
        header: true,
        complete: (results) => {
            const records = results.data;
            const counts = {};

            records.forEach(r => {
                const val = (r['Didaftarkan Oleh :'] || '').trim();
                if (val) counts[val] = (counts[val] || 0) + 1;
            });

            console.log('Top values in "Didaftarkan Oleh :":');
            const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
            console.log(sorted.slice(0, 50));
        }
    });
};

analyzeDidaftarkanOleh();
