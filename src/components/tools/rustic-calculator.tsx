"use client"

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calculator, Sprout, Home, Euro, Info } from "lucide-react"

import {
    dbMunicipiosRustica,
    dbCultivos,
    dbTipologiasRusticas,
    coeficientesAntiguedad,
    coeficientesConservacion
} from "@/data/mock-db-rustica"

export function RusticCalculator() {
    const [municipioId, setMunicipioId] = useState(dbMunicipiosRustica[0].id_municipio)
    const [cultivoId, setCultivoId] = useState(dbCultivos[0].id)
    const [superficieTierra, setSuperficieTierra] = useState<number>(1)

    const [hasConstruccion, setHasConstruccion] = useState(false)
    const [superficieConstruccion, setSuperficieConstruccion] = useState<number>(100)
    const [antiguedadAnios, setAntiguedadAnios] = useState<number>(20)
    const [tipologiaId, setTipologiaId] = useState(dbTipologiasRusticas[0].id)
    const [conservacionId, setConservacionId] = useState(coeficientesConservacion[0].value)

    // Motor de Cálculo JS
    const calc = useMemo(() => {
        // 1. TIERRA (Capitalización)
        const municipio = dbMunicipiosRustica.find(m => m.id_municipio === municipioId) || dbMunicipiosRustica[0]
        const cultivo = dbCultivos.find(c => c.id === cultivoId) || dbCultivos[0]

        // FÓRMULA VS_Rustico: (Superficie_Hectareas * Renta_Hectarea) / Tasa_Capitalizacion
        const valorTierra = (superficieTierra * cultivo.Renta_Hectarea) / municipio.Tasa_Capitalizacion

        // 2. CONSTRUCCIÓN (Coste de Reposición Depreciado)
        let valorConstruccion = 0
        let valorSueloOcupado = 0
        let detallesConstruccion = null

        if (hasConstruccion) {
            const tipologia = dbTipologiasRusticas.find(t => t.id === tipologiaId) || dbTipologiasRusticas[0]
            const conservacion = coeficientesConservacion.find(c => c.value === conservacionId) || coeficientesConservacion[0]
            const coefAntiguedad = coeficientesAntiguedad.find(c => antiguedadAnios <= c.maxAge)?.coef || 0.4

            // Parametros Catastrales fijos (simplificados para el MVP)
            const rm = 0.50
            const gb = 1.00

            // Suelo Ocupado por Construcción (Asumimos uso Residencial -> MBR Urbano)
            const coefSueloResidencial = 0.070
            const mbrUrbano = 450
            valorSueloOcupado = superficieConstruccion * mbrUrbano * coefSueloResidencial * rm * gb

            // FÓRMULA VC_Rustico: Superficie_m2 * MBC * Coef_Tipologia * Coef_Antiguedad * Coef_Conservacion * RM * GB
            valorConstruccion = superficieConstruccion * municipio.MBC * tipologia.Coeficiente * coefAntiguedad * conservacion.coef * rm * gb

            detallesConstruccion = {
                mbc: municipio.MBC,
                coefTipologia: tipologia.Coeficiente,
                coefAntiguedad,
                coefConservacion: conservacion.coef,
                rm,
                gb
            }
        }

        return {
            valorTierra,
            valorSueloOcupado,
            valorConstruccion,
            valorTotal: valorTierra + valorSueloOcupado + valorConstruccion,
            renta: cultivo.Renta_Hectarea,
            tasa: municipio.Tasa_Capitalizacion,
            detallesConstruccion
        }
    }, [
        municipioId, cultivoId, superficieTierra,
        hasConstruccion, superficieConstruccion, antiguedadAnios, tipologiaId, conservacionId
    ])

    // Helpers de formato
    const formatEuros = (value: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">

            <div className="text-center space-y-2 mb-8">
                <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center justify-center gap-3">
                    <Calculator className="w-8 h-8 text-primary" />
                    Calculadora de Valor Catastral Rústico <span className="text-sm font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">MVP</span>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Estima el valor catastral de tu parcela rústica sumando el valor agronómico de la tierra y el valor por coste de reposición de las edificaciones según la normativa vigente (RD 1020/1993).
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* COLUMNA IZQUIERDA: FORMULARIOS */}
                <div className="lg:col-span-8 space-y-6">

                    {/* BLOQUE TIERRA */}
                    <Card className="border-emerald-100 dark:border-emerald-900 shadow-sm overflow-hidden">
                        <div className="h-2 w-full bg-emerald-500" />
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Sprout className="w-5 h-5 text-emerald-600" />
                                Datos de la Parcela (La Tierra)
                            </CardTitle>
                            <CardDescription>Cálculo por Capitalización de Rentas Agronómicas</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Municipio de Referencia</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                        value={municipioId}
                                        onChange={(e) => setMunicipioId(e.target.value)}
                                    >
                                        {dbMunicipiosRustica.map(m => (
                                            <option key={m.id_municipio} value={m.id_municipio}>{m.Nombre}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">Tipo de Cultivo</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        value={cultivoId}
                                        onChange={(e) => setCultivoId(e.target.value)}
                                    >
                                        {dbCultivos.map(c => (
                                            <option key={c.id} value={c.id}>{c.Nombre} ({c.Renta_Hectarea} €/ha)</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium leading-none flex justify-between">
                                        <span>Superficie de la parcela</span>
                                        <span className="text-muted-foreground text-xs">En Hectáreas (ha)</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0" step="0.01"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        value={superficieTierra}
                                        onChange={(e) => setSuperficieTierra(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* BLOQUE CONSTRUCCIÓN */}
                    <Card className={`border-amber-100 dark:border-amber-900 shadow-sm overflow-hidden transition-all duration-300 ${!hasConstruccion ? 'opacity-80' : ''}`}>
                        <div className={`h-2 w-full ${hasConstruccion ? 'bg-amber-500' : 'bg-slate-300'}`} />
                        <CardHeader className="pb-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="hasConstruccion"
                                    className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                    checked={hasConstruccion}
                                    onChange={(e) => setHasConstruccion(e.target.checked)}
                                />
                                <label htmlFor="hasConstruccion" className="text-xl font-semibold flex items-center gap-2 cursor-pointer select-none">
                                    <Home className={`w-5 h-5 ${hasConstruccion ? 'text-amber-600' : 'text-slate-400'}`} />
                                    Construcciones Rústicas
                                </label>
                            </div>
                            <CardDescription className="pl-7">Opcional. Cálculo por Coste de Reposición Depreciado.</CardDescription>
                        </CardHeader>

                        {hasConstruccion && (
                            <CardContent className="space-y-4 animate-in slide-in-from-top-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Tipo de Edificación</label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                            value={tipologiaId}
                                            onChange={(e) => setTipologiaId(e.target.value)}
                                        >
                                            {dbTipologiasRusticas.map(t => (
                                                <option key={t.id} value={t.id}>{t.Nombre}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none flex justify-between">
                                            <span>Superficie Construida</span>
                                            <span className="text-muted-foreground text-xs">En Metros Cuadrados (m²)</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="0" step="1"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                            value={superficieConstruccion}
                                            onChange={(e) => setSuperficieConstruccion(Number(e.target.value))}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Antigüedad (Años)</label>
                                        <input
                                            type="number"
                                            min="0" step="1"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                            value={antiguedadAnios}
                                            onChange={(e) => setAntiguedadAnios(Number(e.target.value))}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none">Estado de Conservación</label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                            value={conservacionId}
                                            onChange={(e) => setConservacionId(e.target.value)}
                                        >
                                            {coeficientesConservacion.map(c => (
                                                <option key={c.value} value={c.value}>{c.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                </div>

                {/* COLUMNA DERECHA: RESULTADOS */}
                <div className="lg:col-span-4">
                    <div className="sticky top-6">
                        <Card className="border-indigo-100 dark:border-indigo-900 shadow-md bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 overflow-hidden">
                            <div className="h-2 w-full bg-indigo-500" />
                            <CardHeader className="pb-2 border-b">
                                <CardTitle className="flex items-center gap-2">
                                    <Euro className="w-5 h-5 text-indigo-600" />
                                    Valor Catastral
                                </CardTitle>
                                <CardDescription>Desglose de la valoración</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">

                                {/* Desglose Tierra */}
                                <div>
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Valor de la Tierra (VS)</span>
                                        <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{formatEuros(calc.valorTierra)}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Info className="w-3 h-3" />
                                        {calc.renta} €/ha ÷ {calc.tasa * 100}% cap.
                                    </p>
                                </div>

                                {/* Desglose Construcción */}
                                {hasConstruccion && (
                                    <>
                                        <div className="pt-4 border-t border-dashed">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Suelo Ocupado por Const.</span>
                                                <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{formatEuros(calc.valorSueloOcupado)}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-tight">
                                                MBR (450€) × Sup ({superficieConstruccion}m²) × Coef (0.07) × RM (0.50)
                                            </p>
                                        </div>

                                        <div className="pt-4 border-t border-dashed">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Valor Construcción (VC)</span>
                                                <span className="text-lg font-semibold text-amber-600 dark:text-amber-400">{formatEuros(calc.valorConstruccion)}</span>
                                            </div>
                                            {calc.detallesConstruccion && (
                                                <p className="text-xs text-muted-foreground leading-tight">
                                                    MBC ({calc.detallesConstruccion.mbc}€) × Tipo ({calc.detallesConstruccion.coefTipologia}) × Antig. ({calc.detallesConstruccion.coefAntiguedad}) × Cons. ({calc.detallesConstruccion.coefConservacion}) × RM ({calc.detallesConstruccion.rm})
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* Total */}
                                <div className="pt-6 border-t">
                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Valor Total Rústico</span>
                                    <div className="text-4xl font-black text-indigo-700 dark:text-indigo-400 mt-2 truncate" title={formatEuros(calc.valorTotal)}>
                                        {formatEuros(calc.valorTotal)}
                                    </div>
                                </div>

                            </CardContent>
                        </Card>
                    </div>
                </div>

            </div>
        </div>
    )
}
