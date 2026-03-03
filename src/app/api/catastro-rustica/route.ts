import { NextResponse } from 'next/server'
import { XMLParser } from 'fast-xml-parser'

// ── API Route: Consultar datos de parcela rústica del Catastro ──
// Proxy server-side al servicio DNPRC del Catastro
// GET /api/catastro-rustica?rc=23005A01700312

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const rc = searchParams.get('rc')?.trim().toUpperCase()

    if (!rc || rc.length < 14) {
        return NextResponse.json(
            { error: 'La referencia catastral debe tener al menos 14 caracteres' },
            { status: 400 }
        )
    }

    // Truncar a 14 caracteres (la API del Catastro solo acepta 14)
    const rc14 = rc.substring(0, 14)

    try {
        // 1. Consultar DNPRC del Catastro
        const url = `https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?Provincia=&Municipio=&RC=${rc14}`
        const response = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
        })

        if (!response.ok) {
            return NextResponse.json(
                { error: `Error del Catastro: HTTP ${response.status}` },
                { status: 502 }
            )
        }

        const xmlText = await response.text()

        // 2. Parsear XML de Forma Segura usando fast-xml-parser
        const parser = new XMLParser({
            ignoreAttributes: false,
            parseAttributeValue: true,
            trimValues: true,
            isArray: (name) => {
                // Forzar que estas etiquetas siempre sean Array para evitar lógica condicional
                return ['ssp', 'cons', 'rcdnp'].includes(name);
            }
        });

        let jsonObj;
        try {
            jsonObj = parser.parse(xmlText);
        } catch (e) {
            return NextResponse.json(
                { error: `Catastro XML Malformed` },
                { status: 502 }
            )
        }

        const root = jsonObj?.consulta_dnp || jsonObj?.['rcdnp'];

        if (!root) {
            return NextResponse.json({ error: `Formato de respuesta desconocido de Catastro` }, { status: 502 })
        }

        // 3. Comprobar errores del Catastro
        const control = root.control;
        if (control?.cuerr && control.cuerr !== 0) {
            const errName = root.lerr?.err?.des || 'Error en Catastro';
            return NextResponse.json(
                { error: `Catastro: ${errName}` },
                { status: 404 }
            )
        }

        const birc = root.birc || root.bico?.bi || root;
        const dt = birc.dt || root.bico?.bi?.dt || root.dt;

        // 4. Extraer info básica de forma robusta
        const municipio = dt?.nm || '';
        const provincia = dt?.np || '';
        const direccion = birc.ldt || dt?.ldt || root.bico?.bi?.ldt || '';

        // Determinar Rústica
        const clase = birc.idbi?.cn || birc.cn || '';
        const esRustica = clase.toUpperCase() === 'RU' ||
            xmlText.toLowerCase().includes('rústico') ||
            xmlText.toLowerCase().includes('rustico') ||
            /\d{5}[A-Z]\d{3}/.test(rc14);

        // Suelo
        const luso = birc.debi?.luso || birc.luso || '';
        const lsuelo = birc.debi?.sfc || birc.lsuelo || root.lsuelo || {};
        let superficieParcela = 0;
        if (typeof lsuelo === 'number' || typeof lsuelo === 'string') {
            superficieParcela = parseFloat(lsuelo.toString().replace(',', '.'));
        } else {
            superficieParcela = parseFloat(lsuelo.spt?.toString().replace(',', '.') || lsuelo.supf?.toString().replace(',', '.') || '0');
        }

        // 5. Extraer SUBPARCELAS (cultivos)
        const subparcelas: {
            clave: string;
            descripcion: string;
            intensidad: string;
            superficieHa: number;
        }[] = [];

        // Buscar subparcelas en lssp (lista de subparcelas normal) o lspr (otra variante)
        const lssp = birc.lssp?.ssp || root.lssp?.ssp || root.bico?.lspr?.spr || [];
        const sspArray = Array.isArray(lssp) ? lssp : [lssp];

        for (const ssp of sspArray) {
            if (!ssp) continue;

            // La información a veces viene directamente o metida dentro de dspr
            const dataObj = ssp.dspr && typeof ssp.dspr === 'object' ? ssp.dspr : ssp;

            const clave = dataObj.cspr || dataObj.ccc || ssp.cspr || '';
            const desc = dataObj.dspr || dataObj.dcc || '';
            const intensidad = dataObj.ip?.toString() || '0';

            // Buscar superficie (puede venir en m2 o Ha dependiendo de la etiqueta)
            let supHa = 0;
            const rawSup = dataObj.ssp || dataObj.sup || ssp.ssp || ssp.sup;
            if (rawSup !== undefined) {
                // Catastro rustica (OVC) a veces devuelve metros cuadrados (ssp) o Has (sup)
                const val = parseFloat(rawSup.toString().replace(',', '.'));
                // Si es > 1000 y se llama ssp probablemente sean m2
                if (val > 1000 && Object.keys(dataObj).includes('ssp')) {
                    supHa = val / 10000;
                } else {
                    supHa = val;
                }
            } else if (typeof ssp === 'string') {
                const numMatch = ssp.match(/(\d+[.,]\d+)/);
                if (numMatch) supHa = parseFloat(numMatch[1].replace(',', '.'));
            }

            if (clave || desc) {
                subparcelas.push({ clave, descripcion: desc, intensidad, superficieHa: supHa });
            }
        }

        // Si no hay, buscar en rcdnp (formato alternativo rústico)
        if (subparcelas.length === 0 && Array.isArray(root.rcdnp)) {
            for (const item of root.rcdnp) {
                const ssp = item.lssp?.ssp || item;
                if (Array.isArray(ssp)) {
                    // Anidación extraída por si acaso
                    for (const subItem of ssp) {
                        const clave = subItem.ccc || subItem.cspr || '';
                        const desc = subItem.dcc || subItem.dspr || '';
                        const intensidad = subItem.ip?.toString() || '0';
                        const supHa = parseFloat(subItem.ssp?.toString().replace(',', '.') || subItem.sup?.toString().replace(',', '.') || '0');
                        if (clave || desc) {
                            subparcelas.push({ clave, descripcion: desc, intensidad, superficieHa: supHa });
                        }
                    }
                } else {
                    const clave = ssp.ccc || ssp.cspr || '';
                    const desc = ssp.dcc || ssp.dspr || '';
                    const intensidad = ssp.ip?.toString() || '0';
                    const supHa = parseFloat(ssp.ssp?.toString().replace(',', '.') || ssp.sup?.toString().replace(',', '.') || '0');
                    if (clave || desc) {
                        subparcelas.push({ clave, descripcion: desc, intensidad, superficieHa: supHa });
                    }
                }
            }
        }

        // 6. Extraer construcciones (cons)
        const construcciones: {
            uso: string;
            tipologia: string;
            superficieM2: number;
            anioConstruccion: number;
        }[] = [];

        const lcons = birc.lcons?.cons || root.bico?.lcons?.cons || root.lcons?.cons || [];
        for (const cons of lcons) {
            const lcd = cons.lcd || (typeof cons.dfcons === 'string' ? cons.dfcons : '');
            const uso = cons.uso || cons.tuso || lcd || '';

            const dfcons = cons.dfcons || {};
            const rawSup = cons.stl || cons.sup || dfcons.stl || dfcons.sup;
            const supM2 = parseFloat(rawSup?.toString().replace(',', '.') || '0');
            const anio = parseInt(cons.aco?.toString() || dfcons.aco?.toString() || '0') || 0;

            if (supM2 > 0 || lcd) {
                construcciones.push({ uso, tipologia: lcd, superficieM2: supM2, anioConstruccion: anio });
            }
        }

        // 7. Devolver datos con CACHE (revalidar cada 7 días)
        const headers = new Headers();
        headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');

        return NextResponse.json({
            encontrado: true,
            rc: rc14,
            esRustica,
            municipio,
            provincia,
            direccion,
            uso: luso || (construcciones.length > 0 ? construcciones[0].uso : ''),
            superficieParcela,
            subparcelas,
            construcciones
        }, {
            status: 200,
            headers: headers
        })

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        return NextResponse.json(
            { error: `Error conectando con el Catastro: ${message}` },
            { status: 502 }
        )
    }
}
