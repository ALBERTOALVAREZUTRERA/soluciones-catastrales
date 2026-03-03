import { XMLParser } from 'fast-xml-parser';

async function checkOther() {
    // Vamos a chequear otra RC que el usuario proporcionó previamente, por ejemplo la que daba fallos
    const rc14 = '23061A01000066';
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

    const lcons = birc.lcons?.cons || root.bico?.lcons?.cons || root.lcons?.cons || [];

    console.log("RAW CONSTRUCCIONES OTRA RC:");
    console.log(JSON.stringify(lcons, null, 2));
}

checkOther();
