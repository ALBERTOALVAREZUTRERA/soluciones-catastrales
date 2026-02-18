
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { BuildingConverter } from "@/components/tools/building-converter";
import { Toaster } from "@/components/ui/toaster";

export const metadata = {
    title: "Conversor GML Edificio | CatastralPro",
    description: "Herramienta profesional para la generación de archivos GML de edificios siguiendo la normativa INSPIRE y Catastro.",
};

export default function ConversorEdificioPage() {
    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />
            <div className="py-12">
                <BuildingConverter />
            </div>
            <Footer />
            <Toaster />
        </main>
    );
}
