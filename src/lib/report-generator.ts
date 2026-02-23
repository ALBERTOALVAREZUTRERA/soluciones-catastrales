import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { GmlFeature } from "./gml-utils";

// Extender tipos para jsPDF con autotable
interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
        finalY: number;
    };
}

export async function generateTechnicalReport(features: GmlFeature[], crs: string) {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const date = new Date().toLocaleDateString("es-ES");

    features.forEach((feature, index) => {
        if (index > 0) doc.addPage();

        // --- CABECERA ELEGANTE ---
        doc.setFillColor(30, 41, 59); // Slate-800
        doc.rect(0, 0, 210, 40, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("INFORME TÉCNICO DE COORDENADAS", 105, 18, { align: "center" });
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text("GEORREFERENCIACIÓN CATASTRAL - LEY 13/2015", 105, 26, { align: "center" });

        // --- INFO PROFESIONAL ---
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("TÉCNICO RESPONSABLE:", 15, 55);
        doc.setFont("helvetica", "normal");
        doc.text("Alberto Álvarez Utrera - Ingeniero Técnico", 60, 55);

        doc.setFont("helvetica", "bold");
        doc.text("FECHA DEL INFORME:", 15, 62);
        doc.setFont("helvetica", "normal");
        doc.text(date, 60, 62);

        doc.setFont("helvetica", "bold");
        doc.text("SISTEMA DE REFERENCIA:", 15, 69);
        doc.setFont("helvetica", "normal");
        doc.text(crs, 60, 69);

        // --- DATOS DE LA PARCELA ---
        doc.setDrawColor(30, 41, 59);
        doc.setLineWidth(0.5);
        doc.line(15, 75, 195, 75);

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        const parcelTitle = feature.cadastralReference
            ? `PARCELA: ${feature.cadastralReference}`
            : `PARCELA ID: ${feature.id}`;
        doc.text(parcelTitle, 15, 85);

        doc.setFontSize(10);
        doc.text("RESUMEN DE SUPERFICIES", 15, 95);

        const areaValue = feature.area ? `${feature.area.toFixed(2)} m²` : "No calculada";

        doc.autoTable({
            startY: 100,
            head: [["Concepto", "Valor"]],
            body: [
                ["Superficie Geométrica", areaValue],
                ["Número de Vértices", feature.geometry[0].length.toString()],
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
        doc.text("LISTADO DE VÉRTICES (UTM)", 15, finalY + 15);

        const tableData = feature.geometry[0].map((coord, i) => [
            (i + 1).toString(),
            coord[0].toFixed(3),
            coord[1].toFixed(3)
        ]);

        doc.autoTable({
            startY: (doc.lastAutoTable.finalY || 100) + 20,
            head: [["Vértice", "Coordenada X (m)", "Coordenada Y (m)"]],
            body: tableData,
            theme: "grid",
            headStyles: { fillColor: [30, 41, 59], halign: "center" },
            columnStyles: {
                0: { halign: "center" },
                1: { halign: "right" },
                2: { halign: "right" }
            },
            margin: { left: 15, right: 15 }
        });

        // --- PIE DE PÁGINA ---
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
            `Página ${index + 1} de ${features.length} - Informe generado en solucionescatastrales.es`,
            105,
            285,
            { align: "center" }
        );
    });

    const fileName = features.length === 1
        ? `Informe_Coordenadas_${features[0].id}.pdf`
        : `Informe_Coordenadas_Multiple.pdf`;

    doc.save(fileName);
}

// Define the shape of our input data
export interface ReportData {
    referenciaCatastral: string;
    municipio: string;
    clase: string;
    uso: string;
    superficie: number;
    anioConstruccion: number;
    mbc: number;
    mbr: number;
    rm: number;
    gb: number;
    valorSuelo: number;
    valorConstruccion: number;
    valorTotal: number;
}

export const generatePDFReport = (data: ReportData) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("HOJA INFORMATIVA DE VALORACIÓN CATASTRAL DESGRANADA", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text(`Documento basado en la parametrización para ${data.municipio}.`, pageWidth / 2, 28, { align: "center" });
    doc.text("Nota: Este documento es una estimación técnica y no tiene validez legal oficial.", pageWidth / 2, 33, { align: "center" });

    // Section 1: Identification
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("1. IDENTIFICACIÓN DEL BIEN INMUEBLE Y TITULAR", 14, 45);

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
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("2. MÓDULOS BÁSICOS Y PARÁMETROS DE PONENCIA", 14, currY); currY += 10;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`• MBC (Módulo Básico de Construcción): ${data.mbc.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €/m²`, leftCol, currY); currY += lineH;
    doc.text(`• MBR (Módulo Básico de Repercusión): ${data.mbr.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €/m²`, leftCol, currY); currY += lineH;
    currY += 3;
    doc.setFont("helvetica", "italic");
    doc.text(`Coeficientes de Corrección Finales Aplicados: RM (${data.rm.toLocaleString("es-ES", { minimumFractionDigits: 2 })}) y G+B (${data.gb.toLocaleString("es-ES", { minimumFractionDigits: 2 })}).`, leftCol, currY); currY += lineH;

    currY += 5;

    // Section 3: Values Table
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("3. VALORES CATASTRALES OFICIALES", 14, currY); currY += 5;

    doc.autoTable({
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

    doc.save(`Valoracion_${data.referenciaCatastral || 'Catastral'}.pdf`);
};

export const generateWordReport = async (data: ReportData) => {
    const doc = new Document({
        sections: [
            {
                properties: {},
                children: [
                    new Paragraph({
                        text: "HOJA INFORMATIVA DE VALORACIÓN CATASTRAL DESGRANADA",
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: `Documento basado en la parametrización para ${data.municipio}.`, italics: true })
                        ],
                        alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Nota: Este documento es una estimación técnica y no tiene validez legal oficial.", italics: true })
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    }),

                    new Paragraph({ text: "1. IDENTIFICACIÓN DEL BIEN INMUEBLE", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }),
                    new Paragraph(`Referencia Catastral: ${data.referenciaCatastral || "No especificada"}`),
                    new Paragraph(`Clase / Uso Principal: ${data.clase.toUpperCase()} / ${data.uso.toUpperCase()}`),
                    new Paragraph(`Superficie: ${data.superficie} m²`),
                    new Paragraph({ text: `Año de Construcción: ${data.anioConstruccion}`, spacing: { after: 300 } }),

                    new Paragraph({ text: "2. MÓDULOS BÁSICOS Y PARÁMETROS DE PONENCIA", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }),
                    new Paragraph(`• MBC (Módulo Básico de Construcción): ${data.mbc.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €/m²`),
                    new Paragraph(`• MBR (Módulo Básico de Repercusión): ${data.mbr.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €/m²`),
                    new Paragraph({
                        children: [
                            new TextRun({ text: `Coeficientes de Corrección Finales Aplicados: RM (${data.rm.toLocaleString("es-ES", { minimumFractionDigits: 2 })}) y G+B (${data.gb.toLocaleString("es-ES", { minimumFractionDigits: 2 })}).`, italics: true })
                        ],
                        spacing: { before: 100, after: 300 }
                    }),

                    new Paragraph({ text: "3. VALORES CATASTRALES OFICIALES", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 200 } }),

                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        borders: {
                            top: { style: BorderStyle.SINGLE, size: 1 },
                            bottom: { style: BorderStyle.SINGLE, size: 1 },
                            left: { style: BorderStyle.SINGLE, size: 1 },
                            right: { style: BorderStyle.SINGLE, size: 1 },
                            insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                            insideVertical: { style: BorderStyle.SINGLE, size: 1 },
                        },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Concepto", bold: true })] })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Importe (€)", bold: true })], alignment: AlignmentType.RIGHT })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph("Valor Catastral Suelo (Corregido)")], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                                    new TableCell({ children: [new Paragraph({ text: `${data.valorSuelo.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`, alignment: AlignmentType.RIGHT })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph("Valor Catastral Construcción (Corregido)")], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                                    new TableCell({ children: [new Paragraph({ text: `${data.valorConstruccion.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`, alignment: AlignmentType.RIGHT })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                                ],
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "VALOR CATASTRAL TOTAL", bold: true })] })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${data.valorTotal.toLocaleString("es-ES", { minimumFractionDigits: 2 })} €`, bold: true })], alignment: AlignmentType.RIGHT })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
                                ],
                            }),
                        ],
                    }),
                ],
            },
        ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Valoracion_${data.referenciaCatastral || 'Catastral'}.docx`);
};
