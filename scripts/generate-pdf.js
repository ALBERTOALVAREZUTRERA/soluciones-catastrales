const { jsPDF } = require("jspdf");
const fs = require("fs");
const path = require("path");

function generateGuide() {
    // Create a new PDF document
    const doc = new jsPDF();

    // Set fonts and colors
    doc.setFont("helvetica", "bold");
    doc.setTextColor(5, 150, 105); // Emerald green

    // Title
    doc.setFontSize(22);
    doc.text("GUÍA DE SUPERVIVENCIA CATASTRAL 2026", 105, 30, { align: "center" });

    doc.setFontSize(16);
    doc.setTextColor(30, 58, 138); // Blue
    doc.text("Los 5 errores que te hacen perder dinero y cómo evitarlos", 105, 45, { align: "center" });

    // Reset for body
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(12);

    let y = 65;
    const lineHeight = 7;
    const margin = 20;
    const maxWidth = 170;

    const content = [
        {
            title: "ERROR 1: Pagar un IBI calculado sobre una superficie incorrecta",
            body: "El 85% de los recibos de IBI en España contienen imprecisiones a favor de la Administración. Si el Catastro le atribuye a tu parcela más metros de los que realmente tiene, o considera una piscina o porche como superficie habitable de alto valor, estarás pagando cientos de euros de más cada año. Solución: Un ingeniero puede realizar una medición topográfica exacta y presentar un informe de subsanación."
        },
        {
            title: "ERROR 2: Creer que las escrituras del Notario mandan sobre la realidad",
            body: "Muchos propietarios descubren al ir a vender que los metros que dicen sus escrituras no coinciden con los del Catastro ni con la realidad del terreno. La Ley Hipotecaria exige ahora una coordinación estricta. Ya no sirve 'lo que diga el papel antiguo'. Solución: Antes de ir a Notaría, debes generar un archivo GML con las coordenadas georreferenciadas exactas de tu propiedad."
        },
        {
            title: "ERROR 3: Dejar que el vecino modifique los linderos poco a poco",
            body: "Las discrepancias de linderos son el origen número uno de litigios entre vecinos en fincas rústicas. Si un vecino mueve una valla y el Catastro actualiza la ortofoto, estarás perdiendo propiedad legalmente. Solución: Marcar los límites con precisión centimétrica usando tecnología GNSS (GPS de alta precisión) y levantar acta técnica."
        },
        {
            title: "ERROR 4: Construir sin declarar las alteraciones a tiempo (Multas)",
            body: "Hacer una ampliación en tu casa, cerrar una terraza o construir una nave agrícola y no comunicarlo al Catastro a través del Modelo 902 conlleva expedientes sancionadores e inspecciones. Solución: Legalizar las construcciones existentes mediante un Informe de Ubicación de Construcciones (ICUC) elaborado por un técnico."
        },
        {
            title: "ERROR 5: Hacer trámites a ciegas, sin asesoramiento técnico",
            body: "Intentar pelear contra la Administración con escritos hechos en casa suele terminar en requerimientos denegados y plazos caducados. El lenguaje catastral y registral es muy técnico. Solución: Confiar en un Ingeniero Técnico especializado que hable 'el mismo idioma' que los registradores y técnicos de Hacienda, ahorrando meses de quebraderos de cabeza."
        }
    ];

    content.forEach((section, index) => {
        // Check if we need a new page
        if (y > 250) {
            doc.addPage();
            y = 30;
        }

        // Title
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 58, 138); // Blue
        const splitTitle = doc.splitTextToSize(section.title, maxWidth);
        doc.text(splitTitle, margin, y);
        y += (splitTitle.length * lineHeight) + 2;

        // Body
        doc.setFont("helvetica", "normal");
        doc.setTextColor(70, 70, 70);
        const splitBody = doc.splitTextToSize(section.body, maxWidth);
        doc.text(splitBody, margin, y);
        y += (splitBody.length * lineHeight) + 12; // Extra space between sections
    });

    // Footer / CTA
    if (y > 230) {
        doc.addPage();
        y = 30;
    }

    y += 10;
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y - 10, maxWidth, 60, "F");

    doc.setFont("helvetica", "bold");
    doc.setTextColor(5, 150, 105);
    doc.text("¿Necesitas ayuda con tu propiedad?", 105, y + 5, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    doc.text("Contacta con Alberto Álvarez, Ingeniero Técnico especializado.", 105, y + 15, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 138);
    doc.text("Teléfono: 665 890 608", 105, y + 25, { align: "center" });
    doc.text("Email: alberto.alvarez.utrera@gmail.com", 105, y + 35, { align: "center" });

    // Save the PDF
    const outputDir = path.join(__dirname, "..", "public", "descargas");
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, "guia-supervivencia-catastral.pdf");
    const arrayBuffer = doc.output("arraybuffer");
    fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));

    console.log("✅ PDF generado con exito en:", outputPath);
}

generateGuide();
