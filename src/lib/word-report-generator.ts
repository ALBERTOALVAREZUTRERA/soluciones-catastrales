import {
    AlignmentType,
    BorderStyle,
    Document,
    Footer,
    Header,
    HeadingLevel,
    LevelFormat,
    LineRuleType,
    Packer,
    PageNumber,
    PageOrientation,
    Paragraph,
    ShadingType,
    Table,
    TableCell,
    TableLayoutType,
    TableRow,
    TextRun,
    VerticalAlignTable,
    WidthType,
} from "docx";
import { saveAs } from "file-saver";

import {
    formatReportNumber,
    type ReportData,
    safeReportFilename,
    validateReportData,
} from "./valuation-report";

const PAGE_WIDTH = 12_240;
const PAGE_HEIGHT = 15_840;
const PAGE_MARGIN = 1_440;
const HEADER_FOOTER_DISTANCE = 708;
const CONTENT_WIDTH = 9_360;
const TABLE_INDENT = 120;
const TABLE_COLUMNS = [6_660, 2_700] as const;
const CELL_MARGINS = {
    marginUnitType: WidthType.DXA,
    top: 80,
    bottom: 80,
    left: 120,
    right: 120,
} as const;

const COLORS = {
    heading: "2E74B5",
    headingDark: "1F4D78",
    ink: "1F2937",
    muted: "5F6B7A",
    border: "CBD5E1",
    headerFill: "F2F4F7",
    calloutFill: "F4F6F9",
    totalFill: "E8EEF5",
} as const;

const thinBorder = {
    style: BorderStyle.SINGLE,
    size: 4,
    color: COLORS.border,
} as const;

function detailParagraph(label: string, value: string): Paragraph {
    return new Paragraph({
        style: "ValuationMetadata",
        children: [
            new TextRun({ text: `${label}: `, bold: true }),
            new TextRun(value),
        ],
    });
}

function tableParagraph(
    text: string,
    options: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType] } = {},
): Paragraph {
    return new Paragraph({
        alignment: options.align ?? AlignmentType.LEFT,
        spacing: { before: 0, after: 0, line: 264, lineRule: LineRuleType.AUTO },
        children: [new TextRun({ text, bold: options.bold })],
    });
}

function valueCell(text: string, bold = false, fill?: string): TableCell {
    return new TableCell({
        width: { size: TABLE_COLUMNS[1], type: WidthType.DXA },
        margins: CELL_MARGINS,
        verticalAlign: VerticalAlignTable.CENTER,
        shading: fill ? { fill, type: ShadingType.CLEAR } : undefined,
        children: [tableParagraph(text, { bold, align: AlignmentType.RIGHT })],
    });
}

function labelCell(text: string, bold = false, fill?: string): TableCell {
    return new TableCell({
        width: { size: TABLE_COLUMNS[0], type: WidthType.DXA },
        margins: CELL_MARGINS,
        verticalAlign: VerticalAlignTable.CENTER,
        shading: fill ? { fill, type: ShadingType.CLEAR } : undefined,
        children: [tableParagraph(text, { bold })],
    });
}

function createValuesTable(data: ReportData): Table {
    return new Table({
        width: { size: CONTENT_WIDTH, type: WidthType.DXA },
        indent: { size: TABLE_INDENT, type: WidthType.DXA },
        columnWidths: [...TABLE_COLUMNS],
        layout: TableLayoutType.FIXED,
        margins: CELL_MARGINS,
        borders: {
            top: thinBorder,
            bottom: thinBorder,
            left: thinBorder,
            right: thinBorder,
            insideHorizontal: thinBorder,
            insideVertical: thinBorder,
        },
        rows: [
            new TableRow({
                tableHeader: true,
                cantSplit: true,
                children: [
                    labelCell("Concepto", true, COLORS.headerFill),
                    valueCell("Importe (€)", true, COLORS.headerFill),
                ],
            }),
            new TableRow({
                cantSplit: true,
                children: [
                    labelCell("Valor catastral del suelo (corregido)"),
                    valueCell(`${formatReportNumber(data.valorSuelo)} €`),
                ],
            }),
            new TableRow({
                cantSplit: true,
                children: [
                    labelCell("Valor catastral de la construcción (corregido)"),
                    valueCell(`${formatReportNumber(data.valorConstruccion)} €`),
                ],
            }),
            new TableRow({
                cantSplit: true,
                children: [
                    labelCell("VALOR CATASTRAL TOTAL ESTIMADO", true, COLORS.totalFill),
                    valueCell(`${formatReportNumber(data.valorTotal)} €`, true, COLORS.totalFill),
                ],
            }),
        ],
    });
}

function createDisclaimer(): Paragraph {
    return new Paragraph({
        style: "ValuationNote",
        children: [
            new TextRun({ text: "ALCANCE. ", bold: true, color: COLORS.headingDark }),
            new TextRun("Esta hoja es una estimación técnica de carácter informativo. No sustituye una certificación catastral, una ponencia vigente ni una valoración profesional."),
        ],
    });
}

export function createValuationDocx(data: ReportData): Document {
    validateReportData(data);

    const generatedAt = new Intl.DateTimeFormat("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(new Date());

    return new Document({
        title: "Hoja informativa de valoración catastral",
        subject: "Estimación técnica de valoración catastral",
        creator: "Soluciones Catastrales",
        lastModifiedBy: "Soluciones Catastrales",
        description: "Informe automático de apoyo sujeto a comprobación profesional.",
        styles: {
            default: {
                document: {
                    run: { font: "Calibri", size: 22, color: COLORS.ink },
                    paragraph: {
                        alignment: AlignmentType.LEFT,
                        spacing: { before: 0, after: 120, line: 264, lineRule: LineRuleType.AUTO },
                    },
                },
                title: {
                    run: { font: "Calibri", size: 46, bold: true, color: "000000" },
                    paragraph: {
                        alignment: AlignmentType.LEFT,
                        spacing: { before: 0, after: 80, line: 276, lineRule: LineRuleType.AUTO },
                        keepNext: true,
                    },
                },
                heading1: {
                    run: { font: "Calibri", size: 32, bold: true, color: COLORS.heading },
                    paragraph: {
                        spacing: { before: 320, after: 160, line: 264, lineRule: LineRuleType.AUTO },
                        keepNext: true,
                        outlineLevel: 0,
                    },
                },
                heading2: {
                    run: { font: "Calibri", size: 26, bold: true, color: COLORS.heading },
                    paragraph: {
                        spacing: { before: 240, after: 120, line: 264, lineRule: LineRuleType.AUTO },
                        keepNext: true,
                        outlineLevel: 1,
                    },
                },
                heading3: {
                    run: { font: "Calibri", size: 24, bold: true, color: COLORS.headingDark },
                    paragraph: {
                        spacing: { before: 160, after: 80, line: 264, lineRule: LineRuleType.AUTO },
                        keepNext: true,
                        outlineLevel: 2,
                    },
                },
                listParagraph: {
                    run: { font: "Calibri", size: 22, color: COLORS.ink },
                    paragraph: { spacing: { before: 0, after: 160, line: 280, lineRule: LineRuleType.AUTO } },
                },
            },
            paragraphStyles: [
                {
                    id: "ValuationKicker",
                    name: "Valuation Kicker",
                    basedOn: "Normal",
                    next: "Title",
                    quickFormat: true,
                    run: { font: "Calibri", size: 19, bold: true, color: COLORS.heading, allCaps: true },
                    paragraph: { spacing: { before: 0, after: 60, line: 240, lineRule: LineRuleType.AUTO }, keepNext: true },
                },
                {
                    id: "ValuationSubtitle",
                    name: "Valuation Subtitle",
                    basedOn: "Normal",
                    next: "ValuationMetadata",
                    quickFormat: true,
                    run: { font: "Calibri", size: 22, italics: true, color: COLORS.muted },
                    paragraph: { spacing: { before: 0, after: 200, line: 264, lineRule: LineRuleType.AUTO }, keepNext: true },
                },
                {
                    id: "ValuationMetadata",
                    name: "Valuation Metadata",
                    basedOn: "Normal",
                    next: "ValuationMetadata",
                    quickFormat: true,
                    run: { font: "Calibri", size: 20, color: COLORS.ink },
                    paragraph: { spacing: { before: 0, after: 40, line: 240, lineRule: LineRuleType.AUTO } },
                },
                {
                    id: "ValuationNote",
                    name: "Valuation Note",
                    basedOn: "Normal",
                    next: "Normal",
                    quickFormat: true,
                    run: { font: "Calibri", size: 19, color: COLORS.ink },
                    paragraph: {
                        indent: { left: TABLE_INDENT, right: TABLE_INDENT },
                        spacing: { before: 120, after: 160, line: 264, lineRule: LineRuleType.AUTO },
                        shading: { fill: COLORS.calloutFill, type: ShadingType.CLEAR },
                        border: {
                            top: { ...thinBorder, space: 8 },
                            bottom: { ...thinBorder, space: 8 },
                            left: { ...thinBorder, space: 8 },
                            right: { ...thinBorder, space: 8 },
                        },
                    },
                },
            ],
        },
        numbering: {
            config: [
                {
                    reference: "valuation-bullets",
                    levels: [
                        {
                            level: 0,
                            format: LevelFormat.BULLET,
                            text: "•",
                            alignment: AlignmentType.LEFT,
                            style: {
                                run: { font: "Calibri", size: 22, color: COLORS.headingDark },
                                paragraph: {
                                    indent: { left: 720, hanging: 360 },
                                    spacing: { before: 0, after: 160, line: 280, lineRule: LineRuleType.AUTO },
                                },
                            },
                        },
                    ],
                },
            ],
        },
        sections: [
            {
                properties: {
                    page: {
                        size: {
                            width: PAGE_WIDTH,
                            height: PAGE_HEIGHT,
                            orientation: PageOrientation.PORTRAIT,
                        },
                        margin: {
                            top: PAGE_MARGIN,
                            right: PAGE_MARGIN,
                            bottom: PAGE_MARGIN,
                            left: PAGE_MARGIN,
                            header: HEADER_FOOTER_DISTANCE,
                            footer: HEADER_FOOTER_DISTANCE,
                            gutter: 0,
                        },
                    },
                },
                headers: {
                    default: new Header({
                        children: [
                            new Paragraph({
                                spacing: { before: 0, after: 0 },
                                children: [
                                    new TextRun({
                                        text: "VALORACIÓN CATASTRAL · INFORME TÉCNICO",
                                        bold: true,
                                        size: 17,
                                        color: COLORS.muted,
                                    }),
                                ],
                            }),
                        ],
                    }),
                },
                footers: {
                    default: new Footer({
                        children: [
                            new Paragraph({
                                alignment: AlignmentType.RIGHT,
                                spacing: { before: 0, after: 0 },
                                children: [
                                    new TextRun({
                                        text: "Estimación informativa · Página ",
                                        size: 17,
                                        color: COLORS.muted,
                                    }),
                                    new TextRun({ children: [PageNumber.CURRENT], size: 17, color: COLORS.muted }),
                                    new TextRun({ text: " de ", size: 17, color: COLORS.muted }),
                                    new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 17, color: COLORS.muted }),
                                ],
                            }),
                        ],
                    }),
                },
                children: [
                    new Paragraph({ text: "INFORME DE APOYO", style: "ValuationKicker" }),
                    new Paragraph({
                        text: "Hoja informativa de valoración catastral desglosada",
                        heading: HeadingLevel.TITLE,
                    }),
                    new Paragraph({
                        text: `Parametrización aplicada al municipio de ${data.municipio}.`,
                        style: "ValuationSubtitle",
                    }),
                    detailParagraph("Referencia catastral", data.referenciaCatastral || "No especificada"),
                    detailParagraph("Fecha de generación", generatedAt),
                    detailParagraph("Estado", "Estimación pendiente de comprobación profesional"),
                    new Paragraph({ spacing: { before: 0, after: 160 }, children: [] }),
                    createDisclaimer(),

                    new Paragraph({
                        text: "1. Identificación del inmueble",
                        heading: HeadingLevel.HEADING_1,
                    }),
                    detailParagraph("Clase y uso principal", `${data.clase.toUpperCase()} / ${data.uso.toUpperCase()}`),
                    detailParagraph("Superficie considerada", `${formatReportNumber(data.superficie)} m²`),
                    detailParagraph("Año de construcción", String(data.anioConstruccion)),

                    new Paragraph({
                        text: "2. Módulos y parámetros aplicados",
                        heading: HeadingLevel.HEADING_1,
                    }),
                    new Paragraph({
                        numbering: { reference: "valuation-bullets", level: 0 },
                        children: [
                            new TextRun({ text: "MBC · Módulo básico de construcción: ", bold: true }),
                            new TextRun(`${formatReportNumber(data.mbc)} €/m²`),
                        ],
                    }),
                    new Paragraph({
                        numbering: { reference: "valuation-bullets", level: 0 },
                        children: [
                            new TextRun({ text: "MBR · Módulo básico de repercusión: ", bold: true }),
                            new TextRun(`${formatReportNumber(data.mbr)} €/m²`),
                        ],
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Coeficientes de corrección: ", bold: true }),
                            new TextRun(`RM (${formatReportNumber(data.rm)}) y G+B (${formatReportNumber(data.gb)}).`),
                        ],
                    }),

                    new Paragraph({
                        text: "3. Valores catastrales estimados",
                        heading: HeadingLevel.HEADING_1,
                    }),
                    createValuesTable(data),
                    new Paragraph({
                        spacing: { before: 80, after: 0, line: 240, lineRule: LineRuleType.AUTO },
                        children: [
                            new TextRun({
                                text: "Los importes se muestran con dos decimales y deben contrastarse con la documentación catastral vigente.",
                                size: 18,
                                italics: true,
                                color: COLORS.muted,
                            }),
                        ],
                    }),
                ],
            },
        ],
    });
}

export async function createValuationDocxBlob(data: ReportData): Promise<Blob> {
    return Packer.toBlob(createValuationDocx(data));
}

export async function generateWordReport(data: ReportData): Promise<void> {
    const blob = await createValuationDocxBlob(data);
    saveAs(blob, `Valoracion_${safeReportFilename(data.referenciaCatastral)}.docx`);
}
