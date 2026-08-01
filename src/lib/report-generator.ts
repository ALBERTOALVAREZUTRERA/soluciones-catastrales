import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { GmlFeature } from "./gml-utils";
import { buildCoordinateExport } from "./coordinate-export";
import {
    type ReportData,
    safeReportFilename,
    validateReportData,
} from "./valuation-report";

export type { ReportData } from "./valuation-report";

// Extender tipos para jsPDF con autotable
interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
        finalY: number;
    };
}

export function createTechnicalReportPdf(features: GmlFeature[], crs: string): jsPDFWithAutoTable {
    if (features.length === 0) throw new Error("No hay geometrías para incluir en el informe.");
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const date = new Date().toLocaleDateString("es-ES");

    features.forEach((feature, index) => {
        const exportData = buildCoordinateExport([feature]);
        const summary = exportData.summaries[0];
        if (index > 0) doc.addPage();

        // --- CABECERA ELEGANTE ---
        doc.setFillColor(30, 41, 59); // Slate-800
        doc.rect(0, 0, 210, 40, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("INFORME DE COORDENADAS", 105, 17, { align: "center" });
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text("Documento automático de apoyo - Requiere revisión técnica", 105, 26, { align: "center" });

        // --- INFO PROFESIONAL ---
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("ORIGEN:", 15, 55);
        doc.setFont("helvetica", "normal");
        doc.text("Geometría facilitada por el usuario", 72, 55);

        doc.setFont("helvetica", "bold");
        doc.text("FECHA DEL INFORME:", 15, 62);
        doc.setFont("helvetica", "normal");
        doc.text(date, 72, 62);

        doc.setFont("helvetica", "bold");
        doc.text("SISTEMA DE REFERENCIA:", 15, 69);
        doc.setFont("helvetica", "normal");
        doc.text(crs, 72, 69);

        // --- DATOS DE LA PARCELA ---
        doc.setDrawColor(30, 41, 59);
        doc.setLineWidth(0.5);
        doc.line(15, 75, 195, 75);

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        const parcelTitle = summary.cadastralReference
            ? `PARCELA: ${feature.cadastralReference}`
            : `PARCELA ID: ${feature.id}`;
        const titleLines = doc.splitTextToSize(parcelTitle, 180);
        doc.text(titleLines, 15, 85);

        doc.setFontSize(10);
        const summaryHeadingY = 95 + Math.max(0, titleLines.length - 1) * 5;
        doc.text("RESUMEN DE SUPERFICIES", 15, summaryHeadingY);

        autoTable(doc, {
            startY: summaryHeadingY + 5,
            head: [["Concepto", "Valor"]],
            body: [
                ["Superficie geométrica", `${summary.area.toFixed(2)} m²`],
                ["Vértices (sin repetir cierre)", summary.vertices.toString()],
                ["Huecos interiores", summary.holes.toString()],
                ["Sistema de Coordenadas", crs]
            ],
            theme: "striped",
            headStyles: { fillColor: [30, 41, 59] },
            margin: { left: 15 }
        });

        // --- LISTADO DE COORDENADAS ---
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        const finalY = doc.lastAutoTable.finalY || 100;
        doc.text("LISTADO DE VÉRTICES", 15, finalY + 15);

        const tableData = exportData.rows.map(row => [
            row.ring,
            row.vertex.toString(),
            row.x.toFixed(3),
            row.y.toFixed(3),
        ]);

        autoTable(doc, {
            startY: (doc.lastAutoTable.finalY || 100) + 20,
            head: [["Anillo", "Vértice", "Coordenada X (m)", "Coordenada Y (m)"]],
            body: tableData,
            theme: "grid",
            headStyles: { fillColor: [30, 41, 59], halign: "center" },
            columnStyles: {
                0: { halign: "left" },
                1: { halign: "center" },
                2: { halign: "right" },
                3: { halign: "right" }
            },
            margin: { left: 15, right: 15, top: 18, bottom: 18 },
            didDrawPage: (data: { pageNumber: number }) => {
                if (data.pageNumber > 1) {
                    doc.setFontSize(8);
                    doc.setTextColor(80);
                    doc.text(`Continuación - ${summary.parcelId}`, 15, 10);
                }
            },
        });
    });

    const pageCount = doc.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page);
        doc.setDrawColor(203, 213, 225);
        doc.line(15, 280, 195, 280);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(
            `Página ${page} de ${pageCount} - Generado en solucionescatastrales.app`,
            105,
            286,
            { align: "center" },
        );
    }
    return doc;
}

function safeFilename(value: string): string {
    return value.normalize("NFKD").replace(/[^A-Za-z0-9_-]+/g, "_").slice(0, 80) || "Coordenadas";
}

export async function generateTechnicalReport(features: GmlFeature[], crs: string) {
    const doc = createTechnicalReportPdf(features, crs);

    const fileName = features.length === 1
        ? `Informe_Coordenadas_${safeFilename(features[0].id)}.pdf`
        : `Informe_Coordenadas_Multiple.pdf`;

    doc.save(fileName);
}

export const createValuationPdf = (data: ReportData): jsPDFWithAutoTable => {
    validateReportData(data);
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("HOJA INFORMATIVA DE VALORACIÓN CATASTRAL DESGRANADA", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text(`Documento basado en la parametrización para ${data.municipio}.`, pageWidth / 2, 28, { align: "center" });
    doc.text("Nota: Este documento es una estimación técnica y no tiene validez legal oficial.", pageWidth / 2, 33, { align: "center" });

    // Section 1: Identification
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("1. IDENTIFICACIÓN DEL BIEN INMUEBLE", 14, 45);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const leftCol = 14;
    const lineH = 7;
    let currY = 55;

    doc.text(`Referencia Catastral: ${data.referenciaCatastral || "No especificada"}`, leftCol, currY); currY += lineH;
    doc.text(`Clase / Uso Principal: ${data.clase.toUpperCase()} / ${data.uso.toUpperCase()}`, leftCol, currY); currY += lineH;
    doc.text(`Superficie: ${data.superficie} m²`, leftCol, currY); currY += lineH;
    doc.text(`Año de Construcción: ${data.anioConstruccion}`, leftCol, currY); currY += lineH;

    currY += 5;

    // Section 2: Modules
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("2. MÓDULOS BÁSICOS Y PARÁMETROS DE PONENCIA", 14, currY); currY += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`- MBC (Módulo Básico de Construcción): ${data.mbc.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €/m²`, leftCol, currY); currY += lineH;
    doc.text(`- MBR (Módulo Básico de Repercusión): ${data.mbr.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €/m²`, leftCol, currY); currY += lineH;
    currY += 3;
    doc.setFont("helvetica", "italic");
    const coefficientLines = doc.splitTextToSize(
        `Coeficientes de corrección aplicados: RM (${data.rm.toLocaleString("es-ES", { minimumFractionDigits: 2 })}) y G+B (${data.gb.toLocaleString("es-ES", { minimumFractionDigits: 2 })}).`,
        180,
    );
    doc.text(coefficientLines, leftCol, currY);
    currY += lineH * coefficientLines.length;

    currY += 5;

    // Section 3: Values Table
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("3. VALORES CATASTRALES ESTIMADOS", 14, currY); currY += 5;

    autoTable(doc, {
        startY: currY,
        head: [['Concepto', 'Importe (€)']],
        body: [
            ['Valor Catastral Suelo (Corregido)', `${data.valorSuelo.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`],
            ['Valor Catastral Construcción (Corregido)', `${data.valorConstruccion.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`],
            ['VALOR CATASTRAL TOTAL', `${data.valorTotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [200, 200, 200], textColor: 0, fontStyle: 'bold', lineWidth: 0.1, lineColor: [0, 0, 0] },
        bodyStyles: { textColor: 0, lineWidth: 0.1, lineColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [255, 255, 255] },
        columnStyles: {
            0: { fontStyle: 'normal', cellWidth: 130 },
            1: { halign: 'right' }
        },
        didParseCell: function (data: any) {
            if (data.row.index === 2 && data.section === 'body') {
                data.cell.styles.fontStyle = 'bold';
            }
        }
    });

    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("Estimación informativa - Requiere comprobación profesional", pageWidth / 2, 286, { align: "center" });
    return doc;
};

export const generatePDFReport = (data: ReportData) => {
    const doc = createValuationPdf(data);
    doc.save(`Valoracion_${safeReportFilename(data.referenciaCatastral)}.pdf`);
};
