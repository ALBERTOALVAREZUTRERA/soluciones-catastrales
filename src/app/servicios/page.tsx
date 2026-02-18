
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { Toaster } from "@/components/ui/toaster";
import Image from "next/image";

export const metadata = {
    title: "Servicios GML v4 y Catastro | CatastralPro",
    description: "Especialistas en conversión GML v4, georreferenciación de fincas y subsanación de discrepancias catastrales. Cumple con la normativa de Diciembre 2024.",
};

export default function ServiciosPage() {
    return (
        <main className="min-h-screen font-body selection:bg-accent selection:text-white">
            <Navbar />

            {/* Hero Sección */}
            <section className="relative py-24 bg-primary overflow-hidden">
                <Image
                    src="/servicios/hero_servicios.png"
                    alt="Servicios Hero Background"
                    fill
                    className="object-cover opacity-20 pointer-events-none"
                    priority
                />
                <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px]" />
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                        Servicios Técnicos <span className="text-accent underline decoration-2 underline-offset-8">Catastrales</span>
                    </h1>
                    <p className="text-xl text-blue-100/80 max-w-3xl mx-auto mb-10 leading-relaxed italic">
                        "Ingeniería de precisión para la seguridad jurídica de tus propiedades."
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <span className="px-4 py-2 bg-accent/20 border border-accent/40 rounded-full text-accent font-bold text-sm uppercase tracking-widest">
                            GML v4 (Dec. 2024 OK)
                        </span>
                        <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/80 font-bold text-sm uppercase tracking-widest">
                            INSPIRE compliant
                        </span>
                    </div>
                </div>
            </section>

            {/* Servicio 1: GML v4 */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="w-full md:w-1/2 space-y-6">
                            <h2 className="text-3xl md:text-4xl font-bold text-primary">
                                Conversión GML v4 y <br />
                                <span className="text-accent">Georreferenciación</span>
                            </h2>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                Desde el 12 de diciembre de 2024, el Catastro exige exclusivamente el formato **GML v4** para parcelas. Convertimos tus planos DXF y nubes de puntos en archivos interoperables que cumplen con la normativa INSPIRE al 100%.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "Migración profesional de GML v3 a v4.",
                                    "Compatibilidad total con Notarías y Registros.",
                                    "Soporte para Husos 28, 29, 30 y 31 (ETRS89).",
                                    "Inscripción directa en la Sede Electrónica."
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                        <div className="w-2 h-2 rounded-full bg-accent" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="w-full md:w-1/2 relative h-[400px] rounded-3xl overflow-hidden shadow-2xl group bg-slate-900 border border-white/5">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/5 group-hover:opacity-60 transition-opacity duration-500 z-10" />
                            <Image
                                src="/servicios/gml_v4_real.png"
                                alt="Conversión GML v4 Catastro"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Servicio 2: Subsanación */}
            <section className="py-24 bg-slate-50">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row-reverse items-center gap-16">
                        <div className="w-full md:w-1/2 space-y-6">
                            <h2 className="text-3xl md:text-4xl font-bold text-primary">
                                Subsanación de <br />
                                <span className="text-accent">Discrepancias</span>
                            </h2>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                ¿Tu parcela miden más (o menos) de lo que dice el Catastro? Realizamos el **Informe de Validación Gráfica (IVG)** necesario para corregir errores de superficie, linderos o ubicación.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "Corrección de errores en superficie y linderos.",
                                    "Informes periciales para Catastro.",
                                    "Segregaciones, agregaciones y agrupaciones.",
                                    "Cambios de uso (rústico a urbano)."
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                        <div className="w-2 h-2 rounded-full bg-accent" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="w-full md:w-1/2 relative h-[400px] rounded-3xl overflow-hidden shadow-2xl group bg-white border border-slate-200">
                            <div className="absolute inset-0 bg-primary/5 group-hover:opacity-40 transition-opacity duration-500 z-10" />
                            <Image
                                src="/servicios/ivga_real.png"
                                alt="Informes de Validación Gráfica (IVG)"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Servicio 3: Topografía */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center gap-16">
                        <div className="w-full md:w-1/2 space-y-6">
                            <h2 className="text-3xl md:text-4xl font-bold text-primary">
                                Georreferenciación y <br />
                                <span className="text-accent">Topografía de Campo</span>
                            </h2>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                Utilizamos equipos **GNSS de alta precisión** para definir los límites exactos de tu propiedad sobre el terreno. Evita futuros pleitos con vecinos gracias a un levantamiento profesional.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "Levantamientos topográficos con GPS/GNSS.",
                                    "Replanteo de linderos y mojones.",
                                    "Certificados de obra nueva terminada.",
                                    "Coordinación Catastro-Registro de la Propiedad."
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                        <div className="w-2 h-2 rounded-full bg-accent" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="w-full md:w-1/2 relative h-[400px] rounded-3xl overflow-hidden shadow-2xl group bg-slate-900 border border-white/5">
                            <div className="absolute inset-0 bg-primary/20 group-hover:opacity-60 transition-opacity duration-500 z-10" />
                            <Image
                                src="/servicios/topografia_real.png"
                                alt="Topografía Profesional"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Servicio 4: GML de Edificios (NUEVO) */}
            <section className="py-24 bg-slate-50">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row-reverse items-center gap-16">
                        <div className="w-full md:w-1/2 space-y-6">
                            <h2 className="text-3xl md:text-4xl font-bold text-primary">
                                GML de <br />
                                <span className="text-accent">Edificios e Ingeniería</span>
                            </h2>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                Generamos archivos GML específicos para construcciones, cumpliendo rigurosamente con los requisitos de la Sede Electrónica del Catastro para su validación inmediata.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "GML de Edificios (INSPIRE bu-ext2d).",
                                    "Validación técnica según normativa vigente.",
                                    "Precisión centimétrica en coordenadas UTM.",
                                    "Soporte para segregaciones y divisiones horizontales."
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                        <div className="w-2 h-2 rounded-full bg-accent" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="w-full md:w-1/2 relative h-[400px] rounded-3xl overflow-hidden shadow-2xl group bg-white border border-slate-200">
                            <div className="absolute inset-0 bg-primary/5 group-hover:opacity-40 transition-opacity duration-500 z-10" />
                            <Image
                                src="/servicios/gml_edificio_real.png"
                                alt="GML de Edificios y Construcciones"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
            <WhatsAppButton />
            <Toaster />
        </main>
    );
}
