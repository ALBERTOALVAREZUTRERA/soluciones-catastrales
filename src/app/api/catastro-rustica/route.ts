import { XMLParser } from 'fast-xml-parser'
import {
    apiError,
    apiJson,
    getRequestId,
    logApiError,
} from '@/lib/api-observability'
import {
    isValidCadastralReference,
    normalizeCadastralReference,
} from '@/lib/catastro-reference'
import { fetchWithRetry } from '@/lib/server-fetch'

// ── API Route: Consultar datos de parcela rústica del Catastro ──
// Proxy server-side al servicio DNPRC del Catastro
// GET /api/catastro-rustica?rc=23005A01700312

export async function GET(request: Request) {
    const requestId = getRequestId(request)
    const { searchParams } = new URL(request.url)
    const rc = normalizeCadastralReference(searchParams.get('rc') || '')

    if (!isValidCadastralReference(rc)) {
        return apiError(
            'La referencia catastral debe tener 14, 18 o 20 caracteres alfanuméricos',
            'invalid_cadastral_reference',
            400,
            requestId,
        )
    }

    // Truncar a 14 caracteres (la API del Catastro solo acepta 14)
    const rc14 = rc.substring(0, 14)

    try {
        // 1. Consultar DNPRC del Catastro
        const url = `https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/rest/Consulta_DNPRC?RefCat=${encodeURIComponent(rc14)}`
        const response = await fetchWithRetry(url, {
            headers: {
                Accept: 'application/xml',
                'User-Agent': 'SolucionesCatastrales/1.0',
            },
            next: { revalidate: 86_400 },
        }, {
            attempts: 2,
            requestId,
            service: 'catastro_wcf',
            timeoutMs: 8_000,
        })

        if (!response.ok) {
            return apiError(
                'El servicio del Catastro ha respondido con un error',
                'catastro_upstream_error',
                502,
                requestId,
            )
        }

        const xmlText = await response.text()
        if (xmlText.length > 2_000_000) {
            return apiError(
                'La respuesta del Catastro supera el límite admitido',
                'catastro_response_too_large',
                502,
                requestId,
            )
        }

        // 2. Parsear XML de Forma Segura usando fast-xml-parser
        const parser = new XMLParser({
            ignoreAttributes: false,
            parseAttributeValue: true,
            trimValues: true,
            processEntities: false,
            isArray: (name) => {
                // Forzar que estas etiquetas siempre sean Array para evitar lógica condicional
                return ['ssp', 'cons', 'rcdnp'].includes(name);
            }
        });

        let jsonObj;
        try {
            jsonObj = parser.parse(xmlText);
        } catch {
            return apiError(
                'La respuesta del Catastro no tiene un formato válido',
                'catastro_invalid_response',
                502,
                requestId,
            )
        }

        const root = jsonObj?.consulta_dnp || jsonObj?.['rcdnp'];

        if (!root) {
            return apiError(
                'Formato de respuesta desconocido de Catastro',
                'catastro_invalid_response',
                502,
                requestId,
            )
        }

        // 3. Comprobar errores del Catastro
        const control = root.control;
        if (control?.cuerr && control.cuerr !== 0) {
            const errName = root.lerr?.err?.des || 'Error en Catastro';
            return apiError(
                `Catastro: ${errName}`,
                'cadastral_property_not_found',
                404,
                requestId,
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
        const lsuelo = root.bico?.finca?.dff || birc.lsuelo || root.lsuelo || {};
        let superficieParcela = 0;
        if (typeof lsuelo === 'number' || typeof lsuelo === 'string') {
            superficieParcela = parseFloat(lsuelo.toString().replace(',', '.'));
        } else {
            superficieParcela = parseFloat(
                lsuelo.ss?.toString().replace(',', '.')
                || lsuelo.spt?.toString().replace(',', '.')
                || lsuelo.supf?.toString().replace(',', '.')
                || '0'
            );
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
            planta: string;
        }[] = [];

        const lcons = birc.lcons?.cons || root.bico?.lcons?.cons || root.lcons?.cons || [];
        for (const cons of lcons) {
            const lcd = cons.lcd || (typeof cons.dfcons === 'string' ? cons.dfcons : '');
            const uso = cons.uso || cons.tuso || lcd || '';

            const dfcons = cons.dfcons || {};
            const rawSup = cons.stl || cons.sup || dfcons.stl || dfcons.sup;
            const supM2 = parseFloat(rawSup?.toString().replace(',', '.') || '0');
            const anio = parseInt(cons.aco?.toString() || dfcons.aco?.toString() || '0') || 0;
            const planta = cons.dt?.lourb?.loint?.pt?.toString() || cons.dt?.lourb?.loint?.es?.toString() || '';

            if (supM2 > 0 || lcd) {
                construcciones.push({ uso, tipologia: lcd, superficieM2: supM2, anioConstruccion: anio, planta });
            }
        }

        // 7. Devolver datos con CACHE (revalidar cada 7 días)
        const headers = new Headers();
        headers.set('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');

        return apiJson({
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
        }, requestId, {
            status: 200,
            headers: headers
        })

    } catch (err: unknown) {
        logApiError('catastro_proxy_failed', requestId, err)
        return apiError(
            'El servicio del Catastro no está disponible temporalmente',
            'catastro_unavailable',
            502,
            requestId,
        )
    }
}
