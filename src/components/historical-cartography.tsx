
"use client";

import { History, Globe, FileText, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HistoricalCartography() {
    return (
        <section className="py-24 bg-slate-50 overflow-hidden">
            <div className="container mx-auto px-4 md:px-8">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    <div className="w-full lg:w-1/2 space-y-8 animate-in fade-in slide-in-from-left duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-wider">
                            <History className="h-4 w-4" />
                            Patrimonio Cartográfico Histórico
                        </div>

                        <h2 className="text-3xl md:text-5xl font-extrabold text-primary font-headline leading-tight">
                            La Memoria Visual de <br />
                            <span className="text-accent underline decoration-primary/10 transition-all hover:decoration-accent/30">Nuestro Territorio</span>
                        </h2>

                        <div className="space-y-6 text-slate-600 leading-relaxed">
                            <p className="text-lg">
                                A finales de los años 80, el <strong>Centro de Gestión Catastral</strong> elaboró ortofotografías a escala 1:5.000 para casi todo el territorio nacional, creando un registro gráfico sin precedentes.
                            </p>

                            <div className="grid sm:grid-cols-2 gap-6 pt-4">
                                <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
                                    <Globe className="h-6 w-6 text-accent mb-3" />
                                    <h4 className="font-bold text-primary mb-1">Mosaico COG</h4>
                                    <p className="text-xs">Digitalización y georreferenciación optimizada de 60.000 ortofotografías analógicas.</p>
                                </div>
                                <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200">
                                    <FileText className="h-6 w-6 text-accent mb-3" />
                                    <h4 className="font-bold text-primary mb-1">Valor Pericial</h4>
                                    <p className="text-xs">Información territorial inédita útil para análisis históricos y estudios periciales.</p>
                                </div>
                            </div>

                            <p className="text-sm italic border-l-4 border-accent/30 pl-4 py-2 bg-accent/5 rounded-r-lg">
                                "Este patrimonio permite conservar información territorial que no existía en formato digital, proporcionando una memoria visual de España entre los 80 y los 90."
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-4">
                            <Button className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-6 shadow-lg shadow-primary/20" asChild>
                                <a href="https://www1.sedecatastro.gob.es/Cartografia/mapa.aspx?historica=SI" target="_blank" rel="noopener noreferrer">
                                    Acceder al Visor Histórico <ArrowRight className="ml-2 h-4 w-4" />
                                </a>
                            </Button>
                            <Button variant="outline" className="border-slate-200 text-slate-600 font-bold h-12 px-6 hover:bg-slate-100" asChild>
                                <a href="https://www.catastro.meh.es/ayuda/manual_visor/manual_visor_tematico.pdf" target="_blank" rel="noopener noreferrer">
                                    Ver Resolución DGC
                                </a>
                            </Button>
                        </div>
                    </div>

                    <div className="w-full lg:w-1/2 relative">
                        <div className="relative z-10 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-8 border-white group">
                            <img
                                src="/servicios/hero_servicios.png"
                                alt="Cartografía Histórica Catastro"
                                className="w-full h-auto transition-transform duration-1000 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute bottom-6 left-6 right-6 text-white translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                                <p className="text-xs font-bold uppercase tracking-wider mb-1 text-accent">Vuelo Histórico 80s-90s</p>
                                <p className="text-lg font-bold leading-tight">Análisis evolutivo del parcelario nacional</p>
                            </div>
                        </div>

                        {/* Elementos decorativos estilo CAD */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent/5 rounded-full blur-3xl" />
                        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-primary/5 rounded-full blur-3xl" />
                    </div>
                </div>
            </div>
        </section>
    );
}
