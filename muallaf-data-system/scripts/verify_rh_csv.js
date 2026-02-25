const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const CSV_FILE_PATH = "/Users/sasuhai/Downloads/spo2026 - RH.csv";

const fileContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');

Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
        console.log("Found " + results.data.length + " records.");
        console.log("Header found:", results.meta.fields);
        console.log("Sample records:");
        results.data.slice(0, 5).forEach((row, i) => {
            console.log(`Record ${i}:`, row);
        });
    }
});
