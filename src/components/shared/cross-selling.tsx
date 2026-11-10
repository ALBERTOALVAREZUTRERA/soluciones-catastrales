import Link from "next/link";
import { Button } from "@/components/ui/button";
import { whatsappUrl } from "@/components/shared/whatsapp-fallback";
import { Calculator, Map as MapIcon, Building2 } from "lucide-react";

interface CrossSellingProps {
    currentTool: "calculadora" | "gml-parcela" | "gml-edificio" | "visor";
}

export function CrossSelling({ currentTool }: CrossSellingProps) {
    return (
        <div className="pt-16 pb-8 border-t border-slate-200 mt-12 text-center space-y-8">
            <div className="rounded-2xl bg-primary p-8 text-white space-y-4">
                <h2 className="text-2xl font-bold">¿Necesita el trabajo firmado por un técnico?</h2>
                <p className="text-blue-100 max-w-2xl mx-auto">
                    Esta herramienta es gratuita y orientativa. Si Catastro, la Notaría o el Registro le exigen un GML validado, un informe o un levantamiento topográfico, lo preparamos con presupuesto previo.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <a href={whatsappUrl("Hola, he usado las herramientas de la web y necesito un trabajo técnico firmado.")} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#25D366] px-6 py-3 font-bold text-white">
                        Pedir presupuesto por WhatsApp
                    </a>
                    <Link href="/#tramites" className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-6 py-3 font-bold text-primary">
                        Enviar mi caso
                    </Link>
                </div>
            </div>
            <div className="space-y-3">
                <h2 className="text-3xl font-bold text-primary">Descubre nuestras Herramientas Técnicas Avanzadas</h2>
                <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                    Si eres un profesional del sector, arquitecto o necesitas validar inmuebles, utiliza nuestras otras utilidades especializadas:
                </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">

                {currentTool !== "calculadora" && (
                    <Button variant="outline" size="lg" className="h-14 px-8 border-primary text-primary hover:bg-primary/5 text-lg w-full sm:w-auto" asChild>
                        <Link href="/herramientas/calculadora">
                            <Calculator className="mr-2 h-5 w-5" />
                            Calculadora Catastral
                        </Link>
                    </Button>
                )}

                {currentTool !== "gml-parcela" && (
                    <Button variant="outline" size="lg" className="h-14 px-8 border-accent text-accent hover:bg-accent/5 text-lg w-full sm:w-auto" asChild>
                        <Link href="/herramientas/conversor-gml">
                            <MapIcon className="mr-2 h-5 w-5" />
                            Generador GML de Parcela
                        </Link>
                    </Button>
                )}

                {currentTool !== "gml-edificio" && (
                    <Button variant="outline" size="lg" className="h-14 px-8 border-slate-800 text-slate-800 hover:bg-slate-50 text-lg w-full sm:w-auto" asChild>
                        <Link href="/herramientas/conversor-edificio">
                            <Building2 className="mr-2 h-5 w-5" />
                            Conversor GML de Edificio
                        </Link>
                    </Button>
                )}

            </div>
        </div>
    );
}
