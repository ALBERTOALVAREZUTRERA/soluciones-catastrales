"use client"

import React, { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calculator, Sprout, Home, Euro, Info, Plus, Trash2, Building2, Search, Loader2, Zap, Sparkles, ShieldCheck } from "lucide-react"

import {
    dbMunicipiosRustica,
    dbTiposEvaluatorios,
    dbTipologiasRusticas,
    dbCoefUsoSueloOcupado,
    coeficientesAntiguedad,
    coeficientesConservacion,
    COEF_ACTUALIZACION_DEFAULT,
    COEFS_ACTUALIZACION_ANUALES,
    type CultivoTipo,
} from "@/data/mock-db-rustica"

// ── Subparcela de cultivo ──
interface SubparcelaCultivo {
    id: number;
    cultivoClave: string;
    intensidad: number;
    superficieHa: number;
}

// ── Unidad constructiva ──
interface UnidadConstructiva {
    id: number;
    tipologiaId: string;
    categoria: number;    // 1=lujo → 9=básico
    superficieM2: number;
    anioConstruccion: number;
    conservacion: string;
}

// ── Suelo ocupado por construcción ──
interface SueloOcupado {
    id: number;
    superficieM2: number;
    usoId: string;
}

let subparcelaCounter = 1;
let unidadCounter = 1;
let sueloOcupadoCounter = 1;

export function RusticCalculator() {
    const [municipioId, setMunicipioId] = useState(dbMunicipiosRustica[0].id_municipio)
    const [rc, setRc] = useState<string>("")
    const [coefActualizacion, setCoefActualizacion] = useState<number>(COEF_ACTUALIZACION_DEFAULT)
    const [buscando, setBuscando] = useState(false)
    const [msgBusqueda, setMsgBusqueda] = useState<string>("")

    // Referencia catastral desde URL
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const rcParam = params.get('rc');
        if (rcParam) {
            setRc(rcParam);
            // Auto-consultar si viene de URL
            setTimeout(() => buscarRC(rcParam), 500);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── AUTO-RELLENO DESDE CATASTRO API ──
    const buscarRC = useCallback(async (refCatastral?: string) => {
        const rcToSearch = (refCatastral || rc).trim().toUpperCase()
        if (rcToSearch.length < 14) {
            setMsgBusqueda("La RC debe tener al menos 14 caracteres")
            return
        }
        setBuscando(true)
        setMsgBusqueda("")
        try {
            const res = await fetch(`/api/catastro-rustica?rc=${rcToSearch}`)
            const data = await res.json()
            if (!res.ok || data.error) {
                setMsgBusqueda(data.error || 'Error al consultar')
                return
            }

            // Auto-rellenar subparcelas si hay datos
            if (data.subparcelas && data.subparcelas.length > 0) {
                const nuevasSubparcelas: SubparcelaCultivo[] = data.subparcelas.map((sp: { clave: string; intensidad: string; superficieHa: number }) => {
                    // Mapear clave del API a nuestros cultivos
                    const cultivoMatch = dbTiposEvaluatorios.find(c => c.clave === sp.clave)
                    let clave = cultivoMatch?.clave || 'O-'
                    // Casos especiales frecuentes
                    if (!cultivoMatch && sp.clave === 'C') clave = 'C-' // Labor secano
                    if (!cultivoMatch && sp.clave === 'E') clave = 'E-' // Pastos
                    if (!cultivoMatch && sp.clave === 'V') clave = 'V-' // Viña secano
                    if (!cultivoMatch && sp.clave === 'I') clave = 'I-' // Improductivo

                    // Mapear intensidad
                    const intNum = parseInt(sp.intensidad) || 1
                    const cultivoData = dbTiposEvaluatorios.find(c => c.clave === clave)
                    const intMatch = cultivoData?.intensidades.find(i => i.intensidad === intNum)
                    const intensidad = intMatch ? intNum : (cultivoData?.intensidades[0]?.intensidad || 1)
                    return {
                        id: subparcelaCounter++,
                        cultivoClave: clave,
                        intensidad,
                        superficieHa: sp.superficieHa || 0.5
                    }
                })
                setSubparcelas(nuevasSubparcelas)
            } else {
                setSubparcelas([])
            }

            // Auto-rellenar construcciones y suelo ocupado si hay datos
            if (data.construcciones && data.construcciones.length > 0) {
                const nuevasConstrucciones: UnidadConstructiva[] = []
                const nuevosSuelos: SueloOcupado[] = []

                data.construcciones.forEach((c: { tipologia: string; uso: string; superficieM2: number; anioConstruccion: number; planta?: string }) => {
                    // Intentar mapear tipología del API a nuestras tipologías
                    const tipoStr = (c.tipologia || '').toUpperCase() + " " + (c.uso || '').toUpperCase()

                    let tipologiaId = 'AAL' // default: Almacén
                    let usoIdSuelo = 'agricola' // default: Agrícola

                    if (tipoStr.includes('VIVIENDA') || tipoStr.includes('RESID')) {
                        tipologiaId = 'V'
                        usoIdSuelo = 'residencial'
                    } else if (tipoStr.includes('NAVE') || tipoStr.includes('COBERTIZO')) {
                        tipologiaId = 'BIG'
                        usoIdSuelo = 'agricola'
                    } else if (tipoStr.includes('GARAJE') || tipoStr.includes('APARCAMIENTO')) {
                        tipologiaId = 'GAR'
                        usoIdSuelo = 'residencial' // Los garajes suelen ir con residencial
                    } else if (tipoStr.includes('PISCINA') || tipoStr.includes('DEPORT') || tipoStr.includes('DESCUBIERTO')) {
                        tipologiaId = 'KPS'
                        usoIdSuelo = 'deportivo'
                    } else if (tipoStr.includes('CORRAL') || tipoStr.includes('ESTABLO') || tipoStr.includes('AGRARIO') || tipoStr.includes('AGR')) {
                        tipologiaId = 'COR'
                        usoIdSuelo = 'agricola'
                    } else if (tipoStr.includes('BALSA') || tipoStr.includes('OBRA')) {
                        tipologiaId = 'BAL'
                        usoIdSuelo = 'agricola'
                    } else if (tipoStr.includes('INDUS')) {
                        tipologiaId = 'AAL' // Almacén industrial
                        usoIdSuelo = 'industrial'
                    }

                    const sup = c.superficieM2 || 100

                    nuevasConstrucciones.push({
                        id: unidadCounter++,
                        tipologiaId,
                        categoria: 5, // Categoría más habitual según la experiencia del usuario
                        superficieM2: sup,
                        anioConstruccion: c.anioConstruccion || new Date().getFullYear(),
                        conservacion: 'N' // Normal por defecto
                    })

                    // Filtrar Plantas Altas para el Suelo Ocupado
                    // Si la planta es > 0 (ej. 1, 2, 3), es una planta superior y no ocupa nuevo suelo.
                    const isUpperFloor = c.planta ? parseInt(c.planta) > 0 : false;

                    if (!isUpperFloor) {
                        nuevosSuelos.push({
                            id: sueloOcupadoCounter++,
                            superficieM2: sup,
                            usoId: usoIdSuelo
                        })
                    }
                })

                setConstrucciones(nuevasConstrucciones)
                setSuelosOcupados(nuevosSuelos)
            } else {
                setConstrucciones([])
                setSuelosOcupados([])
            }

            const numSp = data.subparcelas?.length || 0
            const numConst = data.construcciones?.length || 0
            setMsgBusqueda(`✅ ${data.municipio || 'Encontrado'}: ${numSp} subparcela(s)${numConst > 0 ? `, ${numConst} construcción(es)` : ''}`)

            // Auto-seleccionar el municipio si existe en nuestra BD (usando los primeros 5 dígitos de la RC)
            const idMunicipioRC = rcToSearch.substring(0, 5)
            if (dbMunicipiosRustica.some(m => m.id_municipio === idMunicipioRC)) {
                setMunicipioId(idMunicipioRC)
            }

        } catch (err) {
            setMsgBusqueda('Error de conexión con el Catastro')
        } finally {
            setBuscando(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rc])

    // ── SUBPARCELAS DE CULTIVO ──
    const [subparcelas, setSubparcelas] = useState<SubparcelaCultivo[]>([
        { id: subparcelaCounter++, cultivoClave: "O-", intensidad: 5, superficieHa: 1.0 }
    ])

    const addSubparcela = () => {
        setSubparcelas(prev => [...prev, {
            id: subparcelaCounter++,
            cultivoClave: "O-",
            intensidad: 5,
            superficieHa: 0.5
        }])
    }

    const removeSubparcela = (id: number) => {
        if (subparcelas.length > 1) setSubparcelas(prev => prev.filter(s => s.id !== id))
    }

    const updateSubparcela = (id: number, field: keyof SubparcelaCultivo, value: string | number) => {
        setSubparcelas(prev => prev.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        ))
    }

    // ── SUELO OCUPADO POR CONSTRUCCIÓN ──
    const [suelosOcupados, setSuelosOcupados] = useState<SueloOcupado[]>([])

    const addSueloOcupado = () => {
        setSuelosOcupados(prev => [...prev, {
            id: sueloOcupadoCounter++,
            superficieM2: 100,
            usoId: "residencial"
        }])
    }
    const removeSueloOcupado = (id: number) => setSuelosOcupados(prev => prev.filter(s => s.id !== id))

    // ── CONSTRUCCIONES ──
    const [construcciones, setConstrucciones] = useState<UnidadConstructiva[]>([])

    const addConstruccion = () => {
        setConstrucciones(prev => [...prev, {
            id: unidadCounter++,
            tipologiaId: "V",
            categoria: 4,
            superficieM2: 100,
            anioConstruccion: 2000,
            conservacion: "N"
        }])
    }
    const removeConstruccion = (id: number) => setConstrucciones(prev => prev.filter(c => c.id !== id))
    const updateConstruccion = (id: number, field: keyof UnidadConstructiva, value: string | number) => {
        setConstrucciones(prev => prev.map(c =>
            c.id === id ? { ...c, [field]: value } : c
        ))
    }

    // ── MOTOR DE CÁLCULO ──
    const municipio = dbMunicipiosRustica.find(m => m.id_municipio === municipioId) || dbMunicipiosRustica[0]

    const calc = useMemo(() => {
        // 1. SUELO RÚSTICO NO OCUPADO (cultivos)
        let valorSueloBase = 0
        const detallesCultivos = subparcelas.map(sp => {
            const cultivo = dbTiposEvaluatorios.find(c => c.clave === sp.cultivoClave)
            const intensidadData = cultivo?.intensidades.find(i => i.intensidad === sp.intensidad)
            const tipoEurHa = intensidadData?.eur_ha ?? 0
            const valor = sp.superficieHa * tipoEurHa
            valorSueloBase += valor
            return {
                ...sp,
                cultivoNombre: cultivo?.nombre ?? "",
                tipoEurHa,
                valor
            }
        })
        const valorSueloActualizado = valorSueloBase * coefActualizacion

        // 2. SUELO RÚSTICO OCUPADO POR CONSTRUCCIÓN
        let valorSueloOcupado = 0
        const detallesSueloOcupado = suelosOcupados.map(so => {
            const usoData = dbCoefUsoSueloOcupado.find(u => u.id === so.usoId)
            const mbr = usoData?.mbr_tipo === "urbano" ? municipio.MBR_urbano : municipio.MBR_rustico
            const coef = usoData?.coeficiente ?? 0
            const importeMBR = mbr * coef
            const valor = so.superficieM2 * importeMBR * municipio.RM
            valorSueloOcupado += valor
            return {
                ...so,
                usoNombre: usoData?.nombre ?? "",
                mbr,
                coef,
                importeMBR,
                valor
            }
        })

        // 3. CONSTRUCCIÓN
        let valorConstruccion = 0
        const detallesConstrucciones = construcciones.map(uc => {
            const tipologia = dbTipologiasRusticas.find(t => t.id === uc.tipologiaId)
            const coefTipo = tipologia?.categorias[uc.categoria] ?? 1.0
            const aniosDesdeConst = (municipio.id_municipio === "23005" ? 2010 : 2010) + 1 - uc.anioConstruccion
            const coefH = coeficientesAntiguedad.find(c => aniosDesdeConst <= c.maxAge)?.coef ?? 0.39
            const coefI = coeficientesConservacion.find(c => c.value === uc.conservacion)?.coef ?? 1.0
            const valor = uc.superficieM2 * municipio.MBC * coefTipo * coefH * coefI * municipio.RM
            valorConstruccion += valor
            return {
                ...uc,
                tipologiaNombre: tipologia?.nombre ?? "",
                coefTipo,
                coefH,
                coefI,
                valor: Math.round(valor * 100) / 100
            }
        })

        const valorTotal = valorSueloActualizado + valorSueloOcupado + valorConstruccion

        return {
            valorSueloBase: Math.round(valorSueloBase * 100) / 100,
            valorSueloActualizado: Math.round(valorSueloActualizado * 100) / 100,
            valorSueloOcupado: Math.round(valorSueloOcupado * 100) / 100,
            valorConstruccion: Math.round(valorConstruccion * 100) / 100,
            valorTotal: Math.round(valorTotal * 100) / 100,
            detallesCultivos,
            detallesSueloOcupado,
            detallesConstrucciones
        }
    }, [subparcelas, suelosOcupados, construcciones, municipioId, coefActualizacion, municipio])

    const formatEuros = (value: number) =>
        new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)

    // Obtener intensidades disponibles para un cultivo
    const getIntensidades = (clave: string) =>
        dbTiposEvaluatorios.find(c => c.clave === clave)?.intensidades ?? []

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center justify-center gap-3">
                    <Calculator className="w-8 h-8 text-primary" />
                    Calculadora de Valor Catastral Rústico
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Estima el valor catastral de tu parcela rústica con los tipos evaluatorios oficiales (BOE — Jaén) y las fórmulas del Catastro (RD 1020/1993).
                </p>
            </div>

            {/* ── INSTRUCCIONES RÁPIDAS (BANNERS MODERNOS) ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-xl p-4 flex gap-3 text-left shadow-sm">
                    <div className="bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg shrink-0 h-fit">
                        <Zap className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-emerald-900 dark:text-emerald-300 text-sm mb-1">1. Magia Catastral</h4>
                        <p className="text-emerald-700 dark:text-emerald-400/80 text-xs leading-relaxed">
                            Escribe o pega tu referencia y dale a la lupa. Conectaremos con los servidores públicos en milisegundos y nos traeremos el mapa completo de tus cultivos y de la huella de los edificios al instante.
                        </p>
                    </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl p-4 flex gap-3 text-left shadow-sm">
                    <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 p-2 rounded-lg shrink-0 h-fit">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-1">2. El Ajuste Preciso</h4>
                        <p className="text-blue-700 dark:text-blue-400/80 text-xs leading-relaxed">
                            Por protección de datos, Catastro protege cosas como el Año exacto o la Categoría constructiva (1-9). Revisa estas casillas y ajústalas tú mismo usando los datos reales de la ponencia del IBI.
                        </p>
                    </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900 rounded-xl p-4 flex gap-3 text-left shadow-sm">
                    <div className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 p-2 rounded-lg shrink-0 h-fit">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-purple-900 dark:text-purple-300 text-sm mb-1">3. Valor Oficial Rápido</h4>
                        <p className="text-purple-700 dark:text-purple-400/80 text-xs leading-relaxed">
                            El panel derecho actúa como un simulador financiero. Usando los métodos del RD 1020/1993, verás cómo cada ajuste recalcula tu valor base, tu valor de las construcciones y tu Valor Catastral Total.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* ═══ COLUMNA IZQUIERDA: FORMULARIO ═══ */}
                <div className="lg:col-span-8 space-y-6">

                    {/* ── Datos generales ── */}
                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <div className="h-1.5 w-full bg-slate-400" />
                        <CardContent className="pt-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Referencia Catastral</label>
                                    <div className="flex gap-2">
                                        <input type="text" maxLength={20} placeholder="Ej: 23005A010090120000WF"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono uppercase"
                                            value={rc}
                                            onChange={(e) => setRc(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && buscarRC()} />
                                        <button
                                            onClick={() => buscarRC()}
                                            disabled={buscando || rc.length < 14}
                                            className="flex items-center justify-center h-10 w-10 rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                                            title="Consultar Catastro">
                                            {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {msgBusqueda && (
                                        <p className={`text-xs ${msgBusqueda.startsWith('✅') ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {msgBusqueda}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Municipio</label>
                                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={municipioId} onChange={(e) => setMunicipioId(e.target.value)}>
                                        {dbMunicipiosRustica.map(m => (
                                            <option key={m.id_municipio} value={m.id_municipio}>{m.Nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-1">
                                        Coef. Actualización
                                        <span className="text-xs text-muted-foreground">(Ej.1989→hoy)</span>
                                    </label>
                                    <input type="number" step="0.001" min="1"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={coefActualizacion}
                                        onChange={(e) => setCoefActualizacion(Number(e.target.value) || 1)} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ═══ BLOQUE 1: CULTIVOS ═══ */}
                    <Card className="border-emerald-100 shadow-sm overflow-hidden">
                        <div className="h-2 w-full bg-emerald-500" />
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Sprout className="w-5 h-5 text-emerald-600" />
                                1. Suelo Rústico — Cultivos
                            </CardTitle>
                            <CardDescription>Tipos evaluatorios oficiales del BOE (Jaén, quinquenio 1983-1987)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {subparcelas.map((sp, idx) => {
                                const intensidades = getIntensidades(sp.cultivoClave)
                                const currentTipo = intensidades.find(i => i.intensidad === sp.intensidad)
                                return (
                                    <div key={sp.id} className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                                        <div className="col-span-12 md:col-span-4 space-y-1">
                                            <label className="text-xs font-medium text-emerald-800">Cultivo</label>
                                            <select className="flex h-9 w-full rounded-md border border-emerald-200 bg-white px-2 py-1 text-sm"
                                                value={sp.cultivoClave}
                                                onChange={(e) => {
                                                    updateSubparcela(sp.id, 'cultivoClave', e.target.value)
                                                    const firstInt = dbTiposEvaluatorios.find(c => c.clave === e.target.value)?.intensidades[0]?.intensidad ?? 1
                                                    updateSubparcela(sp.id, 'intensidad', firstInt)
                                                }}>
                                                {dbTiposEvaluatorios.map(c => (
                                                    <option key={c.clave} value={c.clave}>{c.nombre} ({c.clave})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-4 md:col-span-2 space-y-1">
                                            <label className="text-xs font-medium text-emerald-800">Intensidad</label>
                                            <select className="flex h-9 w-full rounded-md border border-emerald-200 bg-white px-2 py-1 text-sm"
                                                value={sp.intensidad}
                                                onChange={(e) => updateSubparcela(sp.id, 'intensidad', Number(e.target.value))}>
                                                {intensidades.map(i => (
                                                    <option key={i.intensidad} value={i.intensidad}>
                                                        {i.intensidad === 0 ? "Única" : `${i.intensidad}ª`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-4 md:col-span-2 space-y-1">
                                            <label className="text-xs font-medium text-emerald-800">Sup. (Ha)</label>
                                            <input type="number" step="0.0001" min="0"
                                                className="flex h-9 w-full rounded-md border border-emerald-200 bg-white px-2 py-1 text-sm"
                                                value={sp.superficieHa}
                                                onChange={(e) => updateSubparcela(sp.id, 'superficieHa', Number(e.target.value))} />
                                        </div>
                                        <div className="col-span-3 md:col-span-3 space-y-1">
                                            <label className="text-xs font-medium text-emerald-800">Tipo (€/Ha)</label>
                                            <div className="h-9 flex items-center px-2 text-sm font-semibold text-emerald-700 bg-emerald-100 rounded-md">
                                                {currentTipo ? currentTipo.eur_ha.toFixed(2) : "—"}
                                            </div>
                                        </div>
                                        <div className="col-span-1 flex items-end justify-center">
                                            {subparcelas.length > 1 && (
                                                <button onClick={() => removeSubparcela(sp.id)}
                                                    className="h-9 w-9 flex items-center justify-center rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                            <button onClick={addSubparcela}
                                className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-800 transition-colors px-3 py-2 rounded-lg hover:bg-emerald-50">
                                <Plus className="w-4 h-4" /> Añadir subparcela
                            </button>
                        </CardContent>
                    </Card>

                    {/* ═══ BLOQUE 2: SUELO OCUPADO POR CONSTRUCCIÓN ═══ */}
                    <Card className="border-sky-100 shadow-sm overflow-hidden">
                        <div className={`h-2 w-full ${suelosOcupados.length > 0 ? 'bg-sky-500' : 'bg-slate-300'}`} />
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Building2 className="w-5 h-5 text-sky-600" />
                                    2. Suelo Ocupado por Construcción
                                </CardTitle>
                                {suelosOcupados.length === 0 && (
                                    <button onClick={addSueloOcupado}
                                        className="flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:text-sky-800 px-3 py-1.5 rounded-lg hover:bg-sky-50 transition-colors">
                                        <Plus className="w-4 h-4" /> Añadir
                                    </button>
                                )}
                            </div>
                            <CardDescription>Fórmula: Sup(m²) × MBR × Coef.Uso × RM</CardDescription>
                        </CardHeader>
                        {suelosOcupados.length > 0 && (
                            <CardContent className="space-y-3">
                                {suelosOcupados.map(so => (
                                    <div key={so.id} className="grid grid-cols-12 gap-2 items-end p-3 rounded-lg bg-sky-50/50 border border-sky-100">
                                        <div className="col-span-5 space-y-1">
                                            <label className="text-xs font-medium text-sky-800">Uso</label>
                                            <select className="flex h-9 w-full rounded-md border border-sky-200 bg-white px-2 py-1 text-sm"
                                                value={so.usoId}
                                                onChange={(e) => setSuelosOcupados(prev =>
                                                    prev.map(s => s.id === so.id ? { ...s, usoId: e.target.value } : s))}>
                                                {dbCoefUsoSueloOcupado.map(u => (
                                                    <option key={u.id} value={u.id}>{u.nombre} (coef. {u.coeficiente})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-3 space-y-1">
                                            <label className="text-xs font-medium text-sky-800">Sup. (m²)</label>
                                            <input type="number" min="0" step="1"
                                                className="flex h-9 w-full rounded-md border border-sky-200 bg-white px-2 py-1 text-sm"
                                                value={so.superficieM2}
                                                onChange={(e) => setSuelosOcupados(prev =>
                                                    prev.map(s => s.id === so.id ? { ...s, superficieM2: Number(e.target.value) } : s))} />
                                        </div>
                                        <div className="col-span-3 space-y-1">
                                            <label className="text-xs font-medium text-sky-800">Valor</label>
                                            <div className="h-9 flex items-center px-2 text-sm font-semibold text-sky-700 bg-sky-100 rounded-md">
                                                {formatEuros(calc.detallesSueloOcupado.find(d => d.id === so.id)?.valor ?? 0)}
                                            </div>
                                        </div>
                                        <div className="col-span-1 flex items-end justify-center">
                                            <button onClick={() => removeSueloOcupado(so.id)}
                                                className="h-9 w-9 flex items-center justify-center rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={addSueloOcupado}
                                    className="flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-800 transition-colors px-3 py-2 rounded-lg hover:bg-sky-50">
                                    <Plus className="w-4 h-4" /> Añadir suelo ocupado
                                </button>
                            </CardContent>
                        )}
                    </Card>

                    {/* ═══ BLOQUE 3: CONSTRUCCIONES ═══ */}
                    <Card className="border-amber-100 shadow-sm overflow-hidden">
                        <div className={`h-2 w-full ${construcciones.length > 0 ? 'bg-amber-500' : 'bg-slate-300'}`} />
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Home className="w-5 h-5 text-amber-600" />
                                    3. Construcciones Rústicas
                                </CardTitle>
                                {construcciones.length === 0 && (
                                    <button onClick={addConstruccion}
                                        className="flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-800 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors">
                                        <Plus className="w-4 h-4" /> Añadir
                                    </button>
                                )}
                            </div>
                            <CardDescription>Fórmula: Sup(m²) × MBC × Tipo × Coef.H × Coef.I × RM</CardDescription>
                        </CardHeader>
                        {construcciones.length > 0 && (
                            <CardContent className="space-y-3">
                                {construcciones.map(uc => (
                                    <div key={uc.id} className="p-3 rounded-lg bg-amber-50/50 border border-amber-100 space-y-2">
                                        <div className="grid grid-cols-12 gap-2 items-end">
                                            <div className="col-span-4 space-y-1">
                                                <label className="text-xs font-medium text-amber-800">Tipología</label>
                                                <select className="flex h-9 w-full rounded-md border border-amber-200 bg-white px-2 py-1 text-sm"
                                                    value={uc.tipologiaId}
                                                    onChange={(e) => updateConstruccion(uc.id, 'tipologiaId', e.target.value)}>
                                                    {dbTipologiasRusticas.map(t => (
                                                        <option key={t.id} value={t.id}>{t.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-span-1 space-y-1">
                                                <label className="text-xs font-medium text-amber-800">Cat.</label>
                                                <select className="flex h-9 w-full rounded-md border border-amber-200 bg-white px-2 py-1 text-sm"
                                                    value={uc.categoria}
                                                    onChange={(e) => updateConstruccion(uc.id, 'categoria', Number(e.target.value))}>
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(c => (
                                                        <option key={c} value={c}>{c}ª</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-span-2 space-y-1">
                                                <label className="text-xs font-medium text-amber-800">Sup. (m²)</label>
                                                <input type="number" min="0" step="1"
                                                    className="flex h-9 w-full rounded-md border border-amber-200 bg-white px-2 py-1 text-sm"
                                                    value={uc.superficieM2}
                                                    onChange={(e) => updateConstruccion(uc.id, 'superficieM2', Number(e.target.value))} />
                                            </div>
                                            <div className="col-span-2 space-y-1">
                                                <label className="text-xs font-medium text-amber-800">Año const.</label>
                                                <input type="number" min="1900" max="2026" step="1"
                                                    className="flex h-9 w-full rounded-md border border-amber-200 bg-white px-2 py-1 text-sm"
                                                    value={uc.anioConstruccion}
                                                    onChange={(e) => updateConstruccion(uc.id, 'anioConstruccion', Number(e.target.value))} />
                                            </div>
                                            <div className="col-span-2 space-y-1">
                                                <label className="text-xs font-medium text-amber-800">Conserv.</label>
                                                <select className="flex h-9 w-full rounded-md border border-amber-200 bg-white px-2 py-1 text-sm"
                                                    value={uc.conservacion}
                                                    onChange={(e) => updateConstruccion(uc.id, 'conservacion', e.target.value)}>
                                                    {coeficientesConservacion.map(c => (
                                                        <option key={c.value} value={c.value}>{c.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-span-1 flex items-end justify-center">
                                                <button onClick={() => removeConstruccion(uc.id)}
                                                    className="h-9 w-9 flex items-center justify-center rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center px-1">
                                            <span className="text-xs text-amber-600">
                                                {municipio.MBC}€/m² × Tipo({calc.detallesConstrucciones.find(d => d.id === uc.id)?.coefTipo ?? "?"}) × H({calc.detallesConstrucciones.find(d => d.id === uc.id)?.coefH ?? "?"}) × I({calc.detallesConstrucciones.find(d => d.id === uc.id)?.coefI ?? "?"}) × RM({municipio.RM})
                                            </span>
                                            <span className="text-sm font-bold text-amber-700">
                                                {formatEuros(calc.detallesConstrucciones.find(d => d.id === uc.id)?.valor ?? 0)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={addConstruccion}
                                    className="flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-800 transition-colors px-3 py-2 rounded-lg hover:bg-amber-50">
                                    <Plus className="w-4 h-4" /> Añadir construcción
                                </button>
                            </CardContent>
                        )}
                    </Card>
                </div>

                {/* ═══ COLUMNA DERECHA: RESULTADOS ═══ */}
                <div className="lg:col-span-4">
                    <div className="sticky top-6 space-y-4">
                        <Card className="border-indigo-100 shadow-lg bg-gradient-to-b from-white to-slate-50 overflow-hidden">
                            <div className="h-2 w-full bg-indigo-500" />
                            <CardHeader className="pb-2 border-b">
                                <CardTitle className="flex items-center gap-2">
                                    <Euro className="w-5 h-5 text-indigo-600" />
                                    Valor Catastral Rústico
                                </CardTitle>
                                <CardDescription>Desglose oficial de la valoración</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-5 space-y-5">

                                {/* ── 1. Suelo no ocupado ── */}
                                <div>
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-sm font-medium text-slate-600">Suelo no ocupado (cultivos)</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-muted-foreground">Base: {formatEuros(calc.valorSueloBase)}</span>
                                        <span className="text-lg font-semibold text-emerald-600">{formatEuros(calc.valorSueloActualizado)}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                        <Info className="w-3 h-3" />
                                        Base × {coefActualizacion} (coef. actualización)
                                    </p>
                                </div>

                                {/* ── 2. Suelo ocupado ── */}
                                {suelosOcupados.length > 0 && (
                                    <div className="pt-4 border-t border-dashed">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-sm font-medium text-slate-600">Suelo ocupado por const.</span>
                                            <span className="text-lg font-semibold text-sky-600">{formatEuros(calc.valorSueloOcupado)}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            MBR × Coef.Uso × RM({municipio.RM})
                                        </p>
                                    </div>
                                )}

                                {/* ── 3. Construcción ── */}
                                {construcciones.length > 0 && (
                                    <div className="pt-4 border-t border-dashed">
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-sm font-medium text-slate-600">Construcción</span>
                                            <span className="text-lg font-semibold text-amber-600">{formatEuros(calc.valorConstruccion)}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            MBC({municipio.MBC}€) × Tipo × H × I × RM({municipio.RM})
                                        </p>
                                    </div>
                                )}

                                {/* ── TOTAL ── */}
                                <div className="pt-5 border-t-2 border-indigo-200">
                                    <span className="text-sm font-bold text-slate-900 uppercase tracking-wide">Valor Catastral Total</span>
                                    <div className="text-4xl font-black text-indigo-700 mt-2 truncate" title={formatEuros(calc.valorTotal)}>
                                        {formatEuros(calc.valorTotal)}
                                    </div>
                                </div>

                                {/* ── Info módulos ── */}
                                <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
                                    <p><strong>Municipio:</strong> {municipio.Nombre}</p>
                                    <p><strong>MBC:</strong> {municipio.MBC} €/m² | <strong>MBR urb:</strong> {municipio.MBR_urbano} | <strong>MBR rúst:</strong> {municipio.MBR_rustico}</p>
                                    <p><strong>RM:</strong> {municipio.RM} | <strong>Coef. act.:</strong> ×{coefActualizacion}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* ── Aviso legal ── */}
            <div className="text-center text-xs text-muted-foreground mt-8 pb-8">
                <p className="flex items-center justify-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    <strong>Aviso:</strong> Esta calculadora es una estimación basada en los tipos evaluatorios oficiales del BOE y la normativa catastral vigente.
                    No sustituye a la valoración oficial del Catastro.
                </p>
            </div>
        </div>
    )
}
