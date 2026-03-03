import { XMLParser } from 'fast-xml-parser';

async function testRC() {
    const rc = '23005A012005730000HW';
    const rc14 = rc.substring(0, 14);
    const url = `https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?Provincia=&Municipio=&RC=${rc14}`;

    console.log(`Fetching: ${url}`);
    const res = await fetch(url);
    const text = await res.text();

    const parser = new XMLParser({
        ignoreAttributes: false,
        parseAttributeValue: true,
        trimValues: true,
        isArray: (name) => {
            return ['ssp', 'cons', 'rcdnp', 'spr'].includes(name);
        }
    });

    const parsed = parser.parse(text);
    console.log(JSON.stringify(parsed, null, 2));
}

testRC();
