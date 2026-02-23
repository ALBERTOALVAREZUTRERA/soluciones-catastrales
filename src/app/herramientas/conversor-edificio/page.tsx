"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { BuildingConverter } from "@/components/tools/building-converter";
import { Toaster } from "@/components/ui/toaster";
import { ToolHeader } from "@/components/shared/tool-header";
import { LeadMagnet } from "@/components/shared/lead-magnet";
import { CrossSelling } from "@/components/shared/cross-selling";
import { Building2 } from "lucide-react";

export default function ConversorEdificioPage() {
    return (
        <main className="min-h-screen bg-slate-50 font-body">
            <Navbar />

            <div className="container mx-auto py-12 px-4">
                <div className="max-w-5xl mx-auto space-y-8">
                    <ToolHeader
                        title="Conversor GML de Edificio"
                        description="Genera archivos GML INSPIRE para construcciones y huellas de edificación a partir de tus planos DXF o proyectos en CAD/GIS."
                        Icon={Building2}
                    />

                    <div className="w-full">
                        <BuildingConverter />
                    </div>

                    <LeadMagnet />
                    <CrossSelling currentTool="gml-edificio" />
                </div>
            </div>

            <Footer />
            <Toaster />
        </main>
    );
}
