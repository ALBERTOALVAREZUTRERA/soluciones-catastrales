import type { GmlFeature } from "@/lib/gml-utils";
import {
    calculatePlanarArea,
    normalizeCadastralGeometry,
} from "@/lib/gml-geometry";

export type CoordinateExportRow = {
    parcelId: string;
    cadastralReference: string;
    ring: string;
    vertex: number;
    x: number;
    y: number;
    type: "Exterior" | "Hueco";
    area: number | null;
};

export type CoordinateParcelSummary = {
    parcelId: string;
    cadastralReference: string;
    area: number;
    vertices: number;
    holes: number;
};

function withoutClosingVertex(ring: number[][]): number[][] {
    if (
        ring.length > 1
        && ring[0][0] === ring.at(-1)?.[0]
        && ring[0][1] === ring.at(-1)?.[1]
    ) {
        return ring.slice(0, -1);
    }
    return ring;
}

export function buildCoordinateExport(features: GmlFeature[]) {
    const rows: CoordinateExportRow[] = [];
    const summaries: CoordinateParcelSummary[] = [];

    features.forEach((feature, featureIndex) => {
        const geometry = normalizeCadastralGeometry(feature.geometry);
        const parcelId = String(feature.id || `PARCELA_${featureIndex + 1}`);
        const cadastralReference = String(feature.cadastralReference || "");
        const area = calculatePlanarArea({ type: "Polygon", coordinates: geometry });
        let vertexCount = 0;

        geometry.forEach((ring, ringIndex) => {
            withoutClosingVertex(ring).forEach((coordinate, vertexIndex) => {
                rows.push({
                    parcelId,
                    cadastralReference,
                    ring: ringIndex === 0 ? "Exterior" : `Hueco ${ringIndex}`,
                    vertex: vertexIndex + 1,
                    x: coordinate[0],
                    y: coordinate[1],
                    type: ringIndex === 0 ? "Exterior" : "Hueco",
                    area: vertexCount === 0 ? area : null,
                });
                vertexCount += 1;
            });
        });

        summaries.push({
            parcelId,
            cadastralReference,
            area,
            vertices: vertexCount,
            holes: geometry.length - 1,
        });
    });

    return { rows, summaries };
}

function csvCell(value: unknown): string {
    let text = String(value ?? "");
    if (/^[=+@]/.test(text) || /^-\D/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
}

export function createCoordinatesCsv(features: GmlFeature[], crs: string): string {
    if (features.length === 0) throw new Error("No hay geometrías que exportar.");
    const { rows } = buildCoordinateExport(features);
    const data = [
        ["ID Parcela", "Referencia Catastral", "Anillo", "Vértice", "X (m)", "Y (m)", "Tipo", "Área (m²)", "CRS"],
        ...rows.map(row => [
            row.parcelId,
            row.cadastralReference,
            row.ring,
            row.vertex,
            row.x.toFixed(3),
            row.y.toFixed(3),
            row.type,
            row.area === null ? "" : row.area.toFixed(2),
            crs,
        ]),
    ];
    return `\uFEFF${data.map(row => row.map(csvCell).join(";")).join("\r\n")}`;
}

function escapeXml(value: unknown): string {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}

function columnName(index: number): string {
    let result = "";
    for (let value = index; value > 0; value = Math.floor((value - 1) / 26)) {
        result = String.fromCharCode(65 + ((value - 1) % 26)) + result;
    }
    return result;
}

function inlineCell(ref: string, value: unknown, style = 0): string {
    return `<c r="${ref}" t="inlineStr" s="${style}"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}

function numberCell(ref: string, value: number, style = 0): string {
    return `<c r="${ref}" s="${style}"><v>${Number.isFinite(value) ? value : 0}</v></c>`;
}

function formulaCell(ref: string, formula: string, cachedValue: number, style = 0): string {
    return `<c r="${ref}" s="${style}"><f>${escapeXml(formula)}</f><v>${cachedValue}</v></c>`;
}

function rowXml(index: number, cells: string[], height?: number): string {
    return `<row r="${index}"${height ? ` ht="${height}" customHeight="1"` : ""}>${cells.join("")}</row>`;
}

export async function createCoordinatesXlsx(features: GmlFeature[], crs: string): Promise<Blob> {
    if (features.length === 0) throw new Error("No hay geometrías que exportar.");
    const { rows, summaries } = buildCoordinateExport(features);
    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    const coordinateLastRow = rows.length + 4;
    const summaryLastRow = summaries.length + 4;

    const coordinateRows = [
        rowXml(1, [inlineCell("A1", "COORDENADAS CATASTRALES", 1)], 28),
        rowXml(2, [inlineCell("A2", "Sistema de referencia", 2), inlineCell("B2", crs, 2)]),
        rowXml(4, ["ID Parcela", "Referencia Catastral", "Anillo", "Vértice", "X (m)", "Y (m)", "Tipo", "Área (m²)"].map((value, index) => inlineCell(`${columnName(index + 1)}4`, value, 3)), 24),
        ...rows.map((row, index) => {
            const excelRow = index + 5;
            return rowXml(excelRow, [
                inlineCell(`A${excelRow}`, row.parcelId),
                inlineCell(`B${excelRow}`, row.cadastralReference),
                inlineCell(`C${excelRow}`, row.ring),
                numberCell(`D${excelRow}`, row.vertex, 6),
                numberCell(`E${excelRow}`, row.x, 4),
                numberCell(`F${excelRow}`, row.y, 4),
                inlineCell(`G${excelRow}`, row.type),
                row.area === null ? "" : numberCell(`H${excelRow}`, row.area, 5),
            ]);
        }),
    ];

    const totalArea = summaries.reduce((sum, item) => sum + item.area, 0);
    const totalVertices = summaries.reduce((sum, item) => sum + item.vertices, 0);
    const totalHoles = summaries.reduce((sum, item) => sum + item.holes, 0);
    const summaryRows = [
        rowXml(1, [inlineCell("A1", "RESUMEN DE PARCELAS", 1)], 28),
        rowXml(2, [inlineCell("A2", "Sistema de referencia", 2), inlineCell("B2", crs, 2)]),
        rowXml(4, ["ID Parcela", "Referencia Catastral", "Área (m²)", "Vértices", "Huecos"].map((value, index) => inlineCell(`${columnName(index + 1)}4`, value, 3)), 24),
        ...summaries.map((summary, index) => {
            const excelRow = index + 5;
            return rowXml(excelRow, [
                inlineCell(`A${excelRow}`, summary.parcelId),
                inlineCell(`B${excelRow}`, summary.cadastralReference),
                numberCell(`C${excelRow}`, summary.area, 5),
                formulaCell(
                    `D${excelRow}`,
                    `COUNTIF('Coordenadas'!$A$5:$A$${coordinateLastRow},A${excelRow})`,
                    summary.vertices,
                    6,
                ),
                formulaCell(
                    `E${excelRow}`,
                    `COUNTIFS('Coordenadas'!$A$5:$A$${coordinateLastRow},A${excelRow},'Coordenadas'!$G$5:$G$${coordinateLastRow},"Hueco",'Coordenadas'!$D$5:$D$${coordinateLastRow},1)`,
                    summary.holes,
                    6,
                ),
            ]);
        }),
        rowXml(summaryLastRow + 1, [
            inlineCell(`A${summaryLastRow + 1}`, "TOTAL", 3),
            "",
            formulaCell(`C${summaryLastRow + 1}`, `SUM(C5:C${summaryLastRow})`, totalArea, 5),
            formulaCell(`D${summaryLastRow + 1}`, `SUM(D5:D${summaryLastRow})`, totalVertices, 6),
            formulaCell(`E${summaryLastRow + 1}`, `SUM(E5:E${summaryLastRow})`, totalHoles, 6),
        ]),
    ];

    const worksheet = (rowsXml: string[], columns: string, dimension: string, filter: string, merge: string) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="${dimension}"/><sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${columns}</cols><sheetData>${rowsXml.join("")}</sheetData><autoFilter ref="${filter}"/><mergeCells count="1"><mergeCell ref="${merge}"/></mergeCells><pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/></worksheet>`;

    zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`);
    zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
    zip.file("xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Resumen" sheetId="1" r:id="rId1"/><sheet name="Coordenadas" sheetId="2" r:id="rId2"/></sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`);
    zip.file("xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
    zip.file("xl/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.000"/></numFmts><fonts count="3"><font><sz val="10"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="16"/><name val="Aptos Display"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="10"/><name val="Aptos"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1E293B"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE2E8F0"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFCBD5E1"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="7"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="3" borderId="0" xfId="0"/><xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1"/><xf numFmtId="4" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1"/><xf numFmtId="1" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`);
    zip.file("xl/worksheets/sheet1.xml", worksheet(summaryRows, `<col min="1" max="1" width="26" customWidth="1"/><col min="2" max="2" width="24" customWidth="1"/><col min="3" max="5" width="14" customWidth="1"/>`, `A1:E${summaryLastRow + 1}`, `A4:E${summaryLastRow}`, "A1:E1"));
    zip.file("xl/worksheets/sheet2.xml", worksheet(coordinateRows, `<col min="1" max="2" width="24" customWidth="1"/><col min="3" max="4" width="14" customWidth="1"/><col min="5" max="6" width="16" customWidth="1"/><col min="7" max="8" width="14" customWidth="1"/>`, `A1:H${coordinateLastRow}`, `A4:H${coordinateLastRow}`, "A1:H1"));

    return zip.generateAsync({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        compression: "DEFLATE",
    });
}
