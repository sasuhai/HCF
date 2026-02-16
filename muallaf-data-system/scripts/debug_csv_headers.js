const fs = require('fs');
const Papa = require('papaparse');

const CSV_FILE_PATH = '/Users/sasuhai/Desktop/HCFBTR/spo2025.csv';

const debugHeaders = () => {
    const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');
    Papa.parse(fileContent, {
        header: true,
        preview: 1,
        complete: (results) => {
            console.log('Headers found by PapaParse:');
            console.log(results.meta.fields);
            console.log('\nSample Row:');
            console.log(results.data[0]);
        }
    });
};

debugHeaders();
