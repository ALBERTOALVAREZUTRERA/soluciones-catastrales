import { NextResponse } from 'next/server'

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

        // 2. Comprobar errores del Catastro
        const errorMatch = xmlText.match(/<des[^>]*>(.*?)<\/[^>]*des>/i)
        const codMatch = xmlText.match(/<cod[^>]*>(.*?)<\/[^>]*cod>/i)
        if (codMatch && errorMatch && codMatch[1].trim() !== '0') {
            return NextResponse.json(
                { error: `Catastro: ${errorMatch[1].trim()}` },
                { status: 404 }
            )
        }

        // 3. Detectar si es rústica
        const claseMatch = xmlText.match(/<cn[^>]*>(.*?)<\/[^>]*cn>/i)
        const clase = claseMatch?.[1]?.trim() || ''
        const esRustica = clase.toUpperCase() === 'RU' ||
            xmlText.toLowerCase().includes('rústico') ||
            xmlText.toLowerCase().includes('rustico') ||
            /\d{5}[A-Z]\d{3}/.test(rc14)

        // Helper: extract ALL matches of a tag
        function extractAll(tag: string, text: string): string[] {
            const regex = new RegExp(`<${tag}[^>]*>(.*?)<\\/[^>]*?${tag}>`, 'gis')
            const results: string[] = []
            let m
            while ((m = regex.exec(text)) !== null) {
                results.push(m[1].trim())
            }
            return results
        }

        // Helper: extract first match of a tag
        function extractFirst(tag: string, text: string): string {
            const regex = new RegExp(`<${tag}[^>]*>(.*?)<\\/[^>]*?${tag}>`, 'is')
            const m = text.match(regex)
            return m?.[1]?.trim() || ''
        }

        // 4. Extraer info básica
        const municipio = extractFirst('nm', xmlText)
        const provincia = extractFirst('np', xmlText)
        const direccion = extractFirst('ldt', xmlText)
        const uso = extractFirst('luso', xmlText) || extractFirst('tuso', xmlText)
        const sptStr = extractFirst('spt', xmlText) || extractFirst('supf', xmlText)
        const superficieParcela = parseFloat(sptStr.replace(',', '.')) || 0

        // 5. Extraer SUBPARCELAS (cultivos) — tags <ssp> dentro de <lssp>
        const subparcelas: {
            clave: string;         // ej: "O-", "C-", "CR"
            descripcion: string;   // ej: "OLIVAR / Secano"
            intensidad: string;    // ej: "01", "16"
            superficieHa: number;  // ej: 1.0588
        }[] = []

        // Los bloques de subparcela vienen como <ssp>...</ssp>
        const sspBlocks = extractAll('ssp', xmlText)
        for (const block of sspBlocks) {
            const cspr = extractFirst('cspr', block)  // código cultivo: "O-", "C-", etc.
            const dspr = extractFirst('dspr', block)  // descripción: "OLIVAR / Secano"
            const ip = extractFirst('ip', block)      // intensidad productiva
            const ssp_sup = extractFirst('ssp', block) // superficie en Ha (puede venir aquí)
            const ccc = extractFirst('ccc', block)    // clase cultivo

            // Superficie: puede venir como atributo o como tag separado
            let supHa = 0
            const supMatch = block.match(/(\d+[.,]\d+)/g)
            if (supMatch) {
                // La superficie en Ha suele ser el número más grande
                const nums = supMatch.map(s => parseFloat(s.replace(',', '.')))
                supHa = Math.max(...nums.filter(n => n < 1000)) // filtrar números que no son superficies
            }

            if (cspr || dspr) {
                subparcelas.push({
                    clave: cspr || ccc || '',
                    descripcion: dspr || '',
                    intensidad: ip || '0',
                    superficieHa: supHa || 0
                })
            }
        }

        // 6. Alternativa: buscar subparcelas en formato rcdnp con cultivos
        // El XML del Catastro para rústica a veces usa <rcdnp> con <dt><locs><lors>
        // y cada subparcela viene como un bloque separado
        if (subparcelas.length === 0) {
            // Intentar extraer de bloques rcdnp
            const rcdnpBlocks = extractAll('rcdnp', xmlText)
            for (const block of rcdnpBlocks) {
                const cult = extractFirst('ccc', block)  // código cultivo
                const desc = extractFirst('dcc', block)  // descripción cultivo
                const intens = extractFirst('ip', block)  // intensidad

                // Buscar superficie
                let sup = 0
                const supTag = extractFirst('ssp', block) || extractFirst('sup', block)
                if (supTag) {
                    sup = parseFloat(supTag.replace(',', '.')) || 0
                }

                if (cult || desc) {
                    subparcelas.push({
                        clave: cult || '',
                        descripcion: desc || '',
                        intensidad: intens || '0',
                        superficieHa: sup
                    })
                }
            }
        }

        // 7. Extraer construcciones — tags <cons> o <lcons>
        const construcciones: {
            uso: string;
            tipologia: string;
            superficieM2: number;
            anioConstruccion: number;
        }[] = []

        const consBlocks = extractAll('cons', xmlText)
        for (const block of consBlocks) {
            const lcd = extractFirst('lcd', block)   // descripción local
            const dt_uso = extractFirst('uso', block) || extractFirst('tuso', block)
            const stl = extractFirst('stl', block)   // superficie total local
            const aco = extractFirst('aco', block)   // año construcción
            const dfcons = extractFirst('dfcons', block) // descripción

            const supM2 = parseFloat((stl || '0').replace(',', '.')) || 0
            const anio = parseInt(aco || '0') || 0

            if (supM2 > 0 || lcd || dfcons) {
                construcciones.push({
                    uso: dt_uso || lcd || dfcons || '',
                    tipologia: lcd || dfcons || '',
                    superficieM2: supM2,
                    anioConstruccion: anio
                })
            }
        }

        // 8. Devolver datos estructurados
        return NextResponse.json({
            encontrado: true,
            rc: rc14,
            esRustica,
            municipio,
            provincia,
            direccion,
            uso,
            superficieParcela,
            subparcelas,
            construcciones,
            xmlRaw: xmlText  // para debug — quitar en producción
        })

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        return NextResponse.json(
            { error: `Error conectando con el Catastro: ${message}` },
            { status: 502 }
        )
    }
}
