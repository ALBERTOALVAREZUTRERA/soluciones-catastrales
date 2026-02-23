import React from 'react'
import { RusticCalculator } from '@/components/tools/rustic-calculator'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Calculadora de Valor Catastral Rústico | Catastro Toolkit',
    description: 'Calculadora especializada para estimar el valor catastral de bienes inmuebles rústicos en España (terreno e instalaciones).',
}

export default function CalculadoraRusticaPage() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950/50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl text-center">
                        Valoración Catastral Rústica
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 text-center max-w-3xl mx-auto">
                        Herramienta MVP de estimación de valor catastral rústico según normativa técnica de España.
                    </p>
                </div>

                <RusticCalculator />
            </div>
        </div>
    )
}
