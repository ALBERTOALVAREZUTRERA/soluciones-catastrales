import { jsPDF } from "jspdf";
import "jspdf-autotable";
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
