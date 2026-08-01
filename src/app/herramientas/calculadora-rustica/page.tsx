import React from 'react'
import { RusticCalculator } from '@/components/tools/rustic-calculator'
import { Toaster } from '@/components/ui/toaster'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

export default function CalculadoraRusticaPage() {
    return (
        <>
            <Navbar />
            <main id="contenido-principal" tabIndex={-1} className="min-h-screen bg-slate-50 dark:bg-slate-950/50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto space-y-8">
                <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl text-center">
                        Valoración Catastral Rústica
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 text-center max-w-3xl mx-auto">
                        Estimación técnica configurable para revisar parcelas, cultivos y construcciones rústicas.
                    </p>
                </div>

                <RusticCalculator />
                <Toaster />
                </div>
            </main>
            <Footer />
        </>
    )
}
