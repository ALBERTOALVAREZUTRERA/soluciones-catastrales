const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = "D:\\WEB_CATASTRO_ALBERTO\\HOJAS VALORACION EJEMPLO\\SUPUESTOS VALORACIÓN I.xls";

try {
    const workbook = xlsx.readFile(filePath);
    
    workbook.SheetNames.forEach(sheetName => {
        console.log(`\n\n--- Sheet: ${sheetName} ---`);
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to CSV for readability in console
        const csv = xlsx.utils.sheet_to_csv(sheet);
        console.log(csv);
    });
} catch (error) {
    console.error("Error reading file:", error.message);
}
