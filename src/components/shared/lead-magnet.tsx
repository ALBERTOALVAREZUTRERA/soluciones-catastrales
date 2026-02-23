import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function LeadMagnet() {
    return (
        <div className="lg:col-span-12 mt-4 animate-in fade-in duration-700">
            <Card className="border-l-4 border-l-red-500 bg-red-50/50 shadow-md">
                <CardContent className="p-8 md:p-10 text-center space-y-6">
                    <h2 className="text-2xl font-bold text-slate-800">
                        ¿El resultado es muy alto? ¿Crees que pagas demasiado IBI?
                    </h2>
                    <p className="text-slate-600 text-lg max-w-3xl mx-auto">
                        El Catastro no siempre tiene la razón. Es muy común que existan errores en la superficie construida, la antigüedad o la calidad de los materiales que hacen que el valor catastral se dispare injustamente.
                    </p>
                    <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm max-w-2xl mx-auto flex flex-col md:flex-row items-center gap-4 text-left">
                        <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-2xl">⚠️</span>
                        </div>
                        <p className="text-slate-700">
                            <strong>¿Necesitas ayuda profesional?</strong> Realizamos expedientes de Subsanación de Discrepancias para corregir errores catastrales y ayudarte a ahorrar miles de euros en tus impuestos a lo largo de los años.
                        </p>
                    </div>
                    <div className="pt-2">
                        <Link href="/servicios" passHref>
                            <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white text-lg h-14 px-8 shadow-lg">
                                Solicitar Estudio Gratuito de mi Caso
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
