"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, BookOpen, CheckCircle2, ArrowRight } from "lucide-react";
import Image from "next/link"; // Not used currently, using standard img

export function LeadMagnet() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simular envío a backend o CRM (Brevo, Mailchimp, WhatsApp API)
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSuccess(true);
        }, 1200);
    };

    return (
        <section className="py-24 relative overflow-hidden bg-slate-50">
            {/* Background Decorators */}
            <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl point-events-none" />
            <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl point-events-none" />

            <div className="container mx-auto px-4 md:px-8 relative z-10">
                <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border flex flex-col lg:flex-row max-w-6xl mx-auto">

                    {/* Columna Izquierda: Texto y Beneficios */}
                    <div className="lg:w-3/5 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-bold w-fit mb-6">
                            <BookOpen className="h-4 w-4" /> Guía Gratuita 2026
                        </div>

                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-headline text-primary mb-6 leading-tight">
                            Los 5 errores catastrales que te hacen perder dinero <span className="text-accent underline decoration-4 underline-offset-4">(y cómo evitarlos)</span>
                        </h2>

                        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                            El 85% de los recibos de IBI tienen errores a favor de la Administración y miles de compraventas se bloquean en el Notario por problemas de lindes. Descubre cómo proteger tu propiedad.
                        </p>

                        <ul className="space-y-4 mb-10">
                            {[
                                "Cómo detectar sobreprecios en el recibo del IBI.",
                                "Los requisitos del Notario para vender o heredar.",
                                "Qué hacer si tu vecino ha movido la linde.",
                                "Cuándo es obligatorio el archivo GML y el IVGA."
                            ].map((benefit, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <CheckCircle2 className="h-6 w-6 text-accent shrink-0" />
                                    <span className="text-slate-700 font-medium">{benefit}</span>
                                </li>
                            ))}
                        </ul>

                        {/* Testimonio pequeño integrado */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 italic text-slate-600 text-sm border-l-4 border-l-primary">
                            "Gracias a esta guía descubrí que el Catastro catalogaba mi porche como vivienda cerrada. Reclamé y recuperé 1.200€ de IBI cobrado de más."
                            <div className="font-bold text-slate-900 mt-2 not-italic text-xs">— María L. (Málaga)</div>
                        </div>
                    </div>

                    {/* Columna Derecha: Formulario */}
                    <div className="lg:w-2/5 bg-primary p-8 md:p-12 text-white flex flex-col justify-center relative">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                        <div className="relative z-10">
                            {!isSuccess ? (
                                <>
                                    <div className="text-center mb-8">
                                        <h3 className="text-2xl font-bold mb-2">Descarga Inmediata</h3>
                                        <p className="text-blue-200 text-sm">Rellena el formulario para recibir el PDF en tu correo o WhatsApp al instante.</p>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-blue-100 mb-1.5" htmlFor="name">Nombre completo</label>
                                            <input
                                                type="text"
                                                id="name"
                                                required
                                                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                                                placeholder="Ej: Laura García"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-blue-100 mb-1.5" htmlFor="contact">Teléfono o Email</label>
                                            <input
                                                type="text"
                                                id="contact"
                                                required
                                                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                                                placeholder="600 000 000 o email@ejemplo.com"
                                            />
                                        </div>

                                        <p className="text-[10px] text-blue-200/60 mt-2 mb-6">
                                            Tus datos están seguros. No enviamos spam, solo soluciones.
                                        </p>

                                        <Button
                                            disabled={isSubmitting}
                                            className="w-full bg-accent hover:bg-emerald-400 text-primary font-bold shadow-lg shadow-accent/20 h-14 text-base transition-all group"
                                        >
                                            {isSubmitting ? (
                                                <span className="flex items-center gap-2">
                                                    <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                                                    Procesando...
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-2">
                                                    Recibir mi Guía Gratis <Download className="h-5 w-5 group-hover:translate-y-1 transition-transform" />
                                                </span>
                                            )}
                                        </Button>
                                    </form>
                                </>
                            ) : (
                                <div className="text-center py-10 animate-fade-in-up">
                                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
                                        <CheckCircle2 className="h-10 w-10 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3">¡Petición Recibida!</h3>
                                    <p className="text-blue-100 mb-8 leading-relaxed">
                                        Hemos procesado tu solicitud. Un analista técnico revisará tu contacto y te enviaremos el enlace de descarga segura de inmediato.
                                    </p>
                                    <Button
                                        variant="outline"
                                        className="border-white/20 text-white hover:bg-white inline-flex items-center font-bold px-8 pt-6 pb-6"
                                        onClick={() => setIsSuccess(false)}
                                    >
                                        ⬅ Hacer otra consulta
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
