"use client";

import dynamic from "next/dynamic";

const CatastroTimeViewer = dynamic(() => import("@/components/catastro-time-viewer"), {
    ssr: false,
    loading: () => (
        <section id="mapa" className="py-24 bg-white">
            <div className="container mx-auto px-4 md:px-8 text-center">
                <div className="h-[600px] bg-slate-100 rounded-xl flex items-center justify-center text-muted-foreground animate-pulse">
                    Cargando Visor de Localización Técnica...
                </div>
            </div>
        </section>
    )
});

export function CatastroTimeWrapper() {
    return <CatastroTimeViewer />;
}
