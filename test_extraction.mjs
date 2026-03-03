import { XMLParser } from 'fast-xml-parser';

async function testExtraction() {
    const rc14 = '23005A01200573';
    const url = `https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?Provincia=&Municipio=&RC=${rc14}`;

    const res = await fetch(url);
    const xmlText = await res.text();

    const parser = new XMLParser({
        ignoreAttributes: false,
        parseAttributeValue: true,
        trimValues: true,
        isArray: (name) => {
            return ['ssp', 'cons', 'rcdnp', 'spr'].includes(name);
        }
    });

    const jsonObj = parser.parse(xmlText);
    const root = jsonObj?.consulta_dnp || jsonObj?.['rcdnp'];
    const birc = root.birc || root.bico?.bi || root;

    const construcciones = [];
    const lcons = birc.lcons?.cons || root.bico?.lcons?.cons || root.lcons?.cons || [];

    for (const cons of lcons) {
        const lcd = cons.lcd || (typeof cons.dfcons === 'string' ? cons.dfcons : '');
        const uso = cons.uso || cons.tuso || lcd || '';

        const dfcons = cons.dfcons || {};
        const rawSup = cons.stl || cons.sup || dfcons.stl || dfcons.sup;
        const supM2 = parseFloat(rawSup?.toString().replace(',', '.') || '0');
        const anio = parseInt(cons.aco?.toString() || dfcons.aco?.toString() || '0') || 0;

        const pt = cons.dt?.lourb?.loint?.pt ?? cons.dt?.lourb?.loint?.es ?? '';

        if (supM2 > 0 || lcd) {
            construcciones.push({ uso, tipologia: lcd, superficieM2: supM2, anioConstruccion: anio, planta: pt });
        }
    }

    console.log("Extracted Constructions:", JSON.stringify(construcciones, null, 2));
}

testExtraction();
