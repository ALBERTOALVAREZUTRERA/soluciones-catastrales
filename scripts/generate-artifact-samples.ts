import fs from "node:fs/promises";

import { createCoordinatesCsv, createCoordinatesXlsx } from "../src/lib/coordinate-export";
import { createTechnicalReportPdf, createValuationPdf } from "../src/lib/report-generator";
import { createValuationDocxBlob } from "../src/lib/word-report-generator";

const circle = (centerX: number, centerY: number, radius: number, count: number) => {
  const points = Array.from({ length: count }, (_, index) => {
    const angle = (Math.PI * 2 * index) / count;
    return [centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius];
  });
  return [...points, [...points[0]]];
};

const features = [{
  id: "PARCELA_MUESTRA",
  cadastralReference: "1234567AB1234C0001DE",
  area: 0,
  geometry: [
    circle(500000, 4200000, 50, 120),
    circle(500000, 4200000, 10, 24).reverse(),
  ],
}];

async function main() {
  await fs.mkdir("tmp/pdfs", { recursive: true });
  await fs.mkdir("tmp/spreadsheets", { recursive: true });
  await fs.mkdir("tmp/documents", { recursive: true });

  const pdf = createTechnicalReportPdf(features, "EPSG:25830");
  await fs.writeFile("tmp/pdfs/informe-coordenadas-muestra.pdf", Buffer.from(pdf.output("arraybuffer")));
  const valuationPdf = createValuationPdf({
    referenciaCatastral: "1234567AB1234C0001DE",
    municipio: "Andújar",
    clase: "Urbano",
    uso: "Residencial",
    superficie: 120,
    anioConstruccion: 1998,
    mbc: 650,
    mbr: 300,
    rm: 0.5,
    gb: 1.4,
    valorSuelo: 54000,
    valorConstruccion: 78000,
    valorTotal: 132000,
  });
  await fs.writeFile("tmp/pdfs/valoracion-muestra.pdf", Buffer.from(valuationPdf.output("arraybuffer")));

  const valuationDocx = await createValuationDocxBlob({
    referenciaCatastral: "1234567AB1234C0001DE",
    municipio: "Andújar",
    clase: "Urbano",
    uso: "Residencial",
    superficie: 120,
    anioConstruccion: 1998,
    mbc: 650,
    mbr: 300,
    rm: 0.5,
    gb: 1.4,
    valorSuelo: 54000,
    valorConstruccion: 78000,
    valorTotal: 132000,
  });
  await fs.writeFile("tmp/documents/valoracion-muestra.docx", Buffer.from(await valuationDocx.arrayBuffer()));

  const xlsx = await createCoordinatesXlsx(features, "EPSG:25830");
  await fs.writeFile("tmp/spreadsheets/coordenadas-muestra.xlsx", Buffer.from(await xlsx.arrayBuffer()));
  await fs.writeFile("tmp/spreadsheets/coordenadas-muestra.csv", createCoordinatesCsv(features, "EPSG:25830"), "utf8");
}

void main();
