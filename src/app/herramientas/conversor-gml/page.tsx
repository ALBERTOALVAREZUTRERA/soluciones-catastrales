"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { GmlConverter } from "@/components/tools/gml-converter";
import { Toaster } from "@/components/ui/toaster";
import { ToolHeader } from "@/components/shared/tool-header";
import { LeadMagnet } from "@/components/shared/lead-magnet";
import { CrossSelling } from "@/components/shared/cross-selling";
import { Map as MapIcon } from "lucide-react";

export default function GmlConverterPage() {
    return (
        <main className="min-h-screen bg-slate-50 font-body">
            <Navbar />

            <div className="container mx-auto py-12 px-4">
                <div className="max-w-5xl mx-auto space-y-8">
                    <ToolHeader
                        title="Generador GML de Parcela"
                        description="Transforma planos topográficos DXF, SHP o coordenadas a formato GML oficial validado por la Sede Electrónica del Catastro."
                        Icon={MapIcon}
                    />

                    <div className="w-full">
                        <GmlConverter />
                    </div>

                    <LeadMagnet />
                    <CrossSelling currentTool="gml-parcela" />
                </div>
            </div>

            <Footer />
            <Toaster />
        </main>
    );
}
