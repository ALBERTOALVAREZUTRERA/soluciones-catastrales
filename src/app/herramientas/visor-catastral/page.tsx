"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ToolHeader } from "@/components/shared/tool-header";
import { LeadMagnet } from "@/components/shared/lead-magnet";
import { CrossSelling } from "@/components/shared/cross-selling";
import { Toaster } from "@/components/ui/toaster";
import dynamic from 'next/dynamic';
import { MapPin } from "lucide-react";

// Import Leaflet Map dynamically to prevent SSR issues related to the window object
const CatastroMap = dynamic(
    () => import('@/components/tools/catastro-map').then(module => ({ default: module.CatastroMap })),
    { ssr: false, loading: () => <div className="h-[600px] w-full rounded-xl bg-slate-100 animate-pulse border flex items-center justify-center text-slate-400">Cargando Cartografía Oficial...</div> }
);

export default function VisorCatastralPage() {
    return (
        <div className="min-h-screen bg-slate-50 font-body">
            <Navbar />

            <main className="container mx-auto py-12 px-4 md:px-8">
                <div className="max-w-6xl mx-auto space-y-12">

                    <ToolHeader
                        title="Visor Cartográfico Catastral"
                        description="Navega por el mapa de España, haz clic sobre cualquier parcela o inmueble, e identifica al instante su Referencia Catastral oficial para realizar cálculos de valor o expedientes analíticos."
                        Icon={MapPin}
                    />

                    <section className="bg-white rounded-2xl shadow-xl border border-primary/10 overflow-hidden">
                        {/* Note we render the map fully filling its container and add Z-index boundaries */}
                        <div className="relative z-10">
                            <CatastroMap className="h-[650px] w-full" />
                        </div>
                        <div className="p-4 bg-slate-50 border-t text-sm text-slate-600 flex justify-between items-center text-center sm:text-left">
                            <p>Cartografía Oficial mediante conexión WMS directa a la D.G. del Catastro y OrtoPNOA.</p>
                            <div className="hidden sm:flex gap-4">
                                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-accent"></div> Interactivo</span>
                                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> Sincronizado</span>
                            </div>
                        </div>
                    </section>

                    <LeadMagnet />
                    <CrossSelling currentTool="visor" />

                </div>
            </main>

            <Footer />
            <Toaster />
        </div>
    );
}
