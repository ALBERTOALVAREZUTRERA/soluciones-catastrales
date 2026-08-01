import assert from "node:assert/strict";
import test from "node:test";

import JSZip from "jszip";

import { createValuationDocxBlob } from "../../src/lib/word-report-generator";

const report = {
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
    valorSuelo: 54_000,
    valorConstruccion: 78_000,
    valorTotal: 132_000,
};

test("el informe Word usa geometría, estilos, listas y paginación reales", async () => {
    const blob = await createValuationDocxBlob(report);
    assert.ok(blob.size > 5_000);

    const archive = await JSZip.loadAsync(await blob.arrayBuffer());
    const documentXml = await archive.file("word/document.xml")!.async("string");
    const stylesXml = await archive.file("word/styles.xml")!.async("string");
    const numberingXml = await archive.file("word/numbering.xml")!.async("string");
    const footerXml = await archive.file("word/footer1.xml")!.async("string");

    assert.match(documentXml, /w:pgSz w:w="12240" w:h="15840"/);
    assert.match(documentXml, /w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/);
    assert.match(documentXml, /w:tblW w:type="dxa" w:w="9360"/);
    assert.match(documentXml, /w:tblInd w:type="dxa" w:w="120"/);
    assert.match(documentXml, /w:gridCol w:w="6660"[\s\S]*w:gridCol w:w="2700"/);
    assert.match(documentXml, /w:tblHeader/);
    assert.doesNotMatch(documentXml, /<w:t>- MBC/);

    assert.match(stylesXml, /w:styleId="ValuationKicker"/);
    assert.match(stylesXml, /w:styleId="ValuationMetadata"/);
    assert.match(numberingXml, /w:numFmt w:val="bullet"/);
    assert.match(footerXml, /PAGE/);
    assert.match(footerXml, /NUMPAGES/);
});

test("el informe Word rechaza datos numéricos imposibles", async () => {
    await assert.rejects(
        createValuationDocxBlob({ ...report, valorTotal: Number.NaN }),
        /no válidos/,
    );
});
