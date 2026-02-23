import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calculator, Map as MapIcon, Building2 } from "lucide-react";

interface CrossSellingProps {
    currentTool: "calculadora" | "gml-parcela" | "gml-edificio";
}

export function CrossSelling({ currentTool }: CrossSellingProps) {
    return (
        <div className="pt-16 pb-8 border-t border-slate-200 mt-12 text-center space-y-8">
            <div className="space-y-3">
                <h2 className="text-3xl font-bold text-primary">Descubre nuestras Herramientas Técnicas Avanzadas</h2>
                <p className="text-slate-600 max-w-2xl mx-auto text-lg">
                    Si eres un profesional del sector, arquitecto o necesitas validar inmuebles, utiliza nuestras otras utilidades especializadas:
                </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">

                {currentTool !== "calculadora" && (
                    <Link href="/herramientas/calculadora" passHref>
                        <Button variant="outline" size="lg" className="h-14 px-8 border-primary text-primary hover:bg-primary/5 text-lg w-full sm:w-auto">
                            <Calculator className="mr-2 h-5 w-5" />
                            Calculadora Catastral
                        </Button>
                    </Link>
                )}

                {currentTool !== "gml-parcela" && (
                    <Link href="/herramientas/conversor-gml" passHref>
                        <Button variant="outline" size="lg" className="h-14 px-8 border-accent text-accent hover:bg-accent/5 text-lg w-full sm:w-auto">
                            <MapIcon className="mr-2 h-5 w-5" />
                            Generador GML de Parcela
                        </Button>
                    </Link>
                )}

                {currentTool !== "gml-edificio" && (
                    <Link href="/herramientas/conversor-edificio" passHref>
                        <Button variant="outline" size="lg" className="h-14 px-8 border-slate-800 text-slate-800 hover:bg-slate-50 text-lg w-full sm:w-auto">
                            <Building2 className="mr-2 h-5 w-5" />
                            Conversor GML de Edificio
                        </Button>
                    </Link>
                )}

            </div>
        </div>
    );
}
