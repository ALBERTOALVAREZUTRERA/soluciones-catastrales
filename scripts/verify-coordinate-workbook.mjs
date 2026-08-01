import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = process.argv[2] || "tmp/spreadsheets/coordenadas-muestra.xlsx";
const outputDir = process.argv[3] || "tmp/spreadsheets/render";

const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const overview = await workbook.inspect({
  kind: "sheet,table",
  include: "id,name,values,formulas",
  maxChars: 5000,
  tableMaxRows: 10,
  tableMaxCols: 8,
});
console.log(overview.ndjson);

const formulas = await workbook.inspect({
  kind: "formula",
  sheetId: "Resumen",
  range: "C5:E6",
  maxChars: 3000,
  options: { maxResults: 20 },
});
console.log(formulas.ndjson);

await fs.mkdir(outputDir, { recursive: true });
for (const sheetName of ["Resumen", "Coordenadas"]) {
  const preview = await workbook.render({
    sheetName,
    autoCrop: "all",
    scale: 1.5,
    format: "png",
  });
  await fs.writeFile(
    `${outputDir}/${sheetName.toLowerCase()}.png`,
    new Uint8Array(await preview.arrayBuffer()),
  );
}

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "formula error scan after rendering",
});
console.log(errors.ndjson);
