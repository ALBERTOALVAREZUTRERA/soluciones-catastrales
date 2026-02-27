import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";
import {
    BookOpen,
    Scale,
    Layers,
    Building2,
    FileSearch,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "Trámites Registrales | Soluciones Catastrales",
    description:
        "Especialistas en rectificación de cabida (Art. 199.2 LH), expedientes de dominio, segregaciones, declaración de obra nueva e inmatriculación. Asesoramiento técnico integral.",
};

const tramites = [
    {
        id: "art-199",
        icon: Scale,
        articulo: "Art. 199.2 LH",
        titulo: "Rectificación de Cabida",
        subtitulo: "La vía más habitual para corregir superficies en el Registro",
        descripcion:
            "Cuando la superficie real de tu finca difiere de la inscrita en el Registro de la Propiedad, el artículo 199.2 de la Ley Hipotecaria permite acreditar esa diferencia mediante un informe técnico de georreferenciación y la validación catastral. Es el procedimiento preferente para diferencias de hasta el 10% de la superficie inscrita.",
        pasos: [
            "Levantamiento topográfico GNSS de la finca.",
            "Elaboración del Informe de Validación Gráfica (IVG) Alternativa.",
            "Generación del fichero GML v4 de la representación gráfica.",
            "Tramitación ante Notaría y Registro de la Propiedad.",
            "Coordinación Catastro-Registro una vez inscrito.",
        ],
        nota: "Para diferencias superiores al 10%, puede ser necesario acudir al expediente notarial del Art. 201 LH.",
        color: "blue",
    },
    {
        id: "art-201",
        icon: BookOpen,
        articulo: "Art. 201 LH",
        titulo: "Expediente Notarial de Dominio",
        subtitulo: "Para grandes discrepancias y fincas sin inmatricular",
        descripcion:
            "El expediente notarial regulado en el artículo 201 de la Ley Hipotecaria es el cauce legal para rectificar la descripción de una finca cuando la diferencia de superficie es superior al 10%, o cuando existen dudas sobre la identidad de la finca. También se utiliza para completar la descripción de construcciones y elementos en régimen de propiedad horizontal.",
        pasos: [
            "Estudio previo de la situación registral y catastral.",
            "Levantamiento topográfico y elaboración de la documentación técnica.",
            "Obtención del Certificado del Catastro.",
            "Acta notarial de rectificación con notificación a colindantes.",
            "Calificación e inscripción registral.",
        ],
        nota: "El notario notifica a los propietarios colindantes y al Catastro durante la tramitación.",
        color: "purple",
    },
    {
        id: "segregaciones",
        icon: Layers,
        articulo: "Arts. 9 y 10 LH",
        titulo: "Segregaciones y Agrupaciones",
        subtitulo: "División o unión de fincas con plena validez registral",
        descripcion:
            "Segregar una finca implica separar una porción de la finca matriz para constituirla como entidad independiente, mientras que la agrupación une dos o más fincas colindantes en una sola. Ambas operaciones requieren el cumplimiento de la normativa urbanística y la elaboración de la representación gráfica georreferenciada.",
        pasos: [
            "Estudio de viabilidad urbanística (parcela mínima, frente mínimo...).",
            "Levantamiento topográfico de la/s finca/s.",
            "Elaboración de los planos de segregación/agrupación.",
            "Generación de las representaciones gráficas GML v4.",
            "Tramitación notarial y registral, y actualización catastral.",
        ],
        nota: "Es imprescindible la licencia municipal de parcelación antes de la escritura notarial.",
        color: "green",
    },
    {
        id: "obra-nueva",
        icon: Building2,
        articulo: "Art. 202 LH",
        titulo: "Declaración de Obra Nueva",
        subtitulo: "Inscripción de construcciones en el Registro de la Propiedad",
        descripcion:
            "La Declaración de Obra Nueva (DON) es el acto jurídico por el que se incorpora al Registro de la Propiedad una construcción existente. Desde la reforma de la Ley Hipotecaria, las obras nuevas deben incorporar la representación gráfica georreferenciada del edificio (GML de Edificio INSPIRE), lo que requiere un levantamiento técnico preciso.",
        pasos: [
            "Levantamiento topográfico del edificio (fachadas y planta).",
            "Elaboración del GML de Edificio en formato INSPIRE bu-ext2d.",
            "Certificado de técnico competente (Final de Obra).",
            "Escritura notarial de Declaración de Obra Nueva.",
            "Presentación telemática en el Registro y Catastro.",
        ],
        nota: "Para obras antiguas (más de 6 años), es posible acreditar la antigüedad mediante certificado técnico sin necesidad de licencia.",
        color: "amber",
    },
    {
        id: "inmatriculacion",
        icon: FileSearch,
        articulo: "Art. 203 LH",
        titulo: "Inmatriculación de Fincas",
        subtitulo: "Primera inscripción de una finca no registrada",
        descripcion:
            "La inmatriculación es el proceso por el que una finca accede al Registro de la Propiedad por primera vez. El artículo 203 LH regula el expediente notarial de dominio para la inmatriculación, requiriendo que la finca esté perfectamente identificada y que quede acreditada la titularidad y la representación gráfica georreferenciada.",
        pasos: [
            "Estudio de documentación previa (títulos de propiedad).",
            "Levantamiento topográfico y georreferenciación de la finca.",
            "Elaboración del GML v4 y obtención del Certificado Catastral.",
            "Acta notarial de inmatriculación con notificación a colindantes y Catastro.",
            "Inscripción en el Registro de la Propiedad.",
        ],
        nota: "El Registrador puede suspender la inscripción si detecta dudas sobre la identidad de la finca o posibles dobles inmatriculaciones.",
        color: "rose",
    },
];

const colorMap: Record<string, { border: string; bg: string; text: string; badge: string; badgeText: string }> = {
    blue: {
        border: "border-blue-500",
        bg: "bg-blue-50",
        text: "text-blue-700",
        badge: "bg-blue-100",
        badgeText: "text-blue-800",
    },
    purple: {
        border: "border-purple-500",
        bg: "bg-purple-50",
        text: "text-purple-700",
        badge: "bg-purple-100",
        badgeText: "text-purple-800",
    },
    green: {
        border: "border-green-500",
        bg: "bg-green-50",
        text: "text-green-700",
        badge: "bg-green-100",
        badgeText: "text-green-800",
    },
    amber: {
        border: "border-amber-500",
        bg: "bg-amber-50",
        text: "text-amber-700",
        badge: "bg-amber-100",
        badgeText: "text-amber-800",
    },
    rose: {
        border: "border-rose-500",
        bg: "bg-rose-50",
        text: "text-rose-700",
        badge: "bg-rose-100",
        badgeText: "text-rose-800",
    },
};

export default function TramitesRegistralesPage() {
    return (
        <main className="min-h-screen font-body selection:bg-accent selection:text-white">
            <Navbar />

            {/* Hero */}
            <section className="relative py-24 bg-primary overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px]" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/80" />
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 border border-accent/40 rounded-full text-accent font-bold text-sm uppercase tracking-widest mb-6">
                        <Scale className="h-4 w-4" />
                        Ley Hipotecaria · Registro de la Propiedad
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                        Trámites{" "}
                        <span className="text-accent underline decoration-2 underline-offset-8">
                            Registrales
                        </span>
                    </h1>
                    <p className="text-xl text-blue-100/80 max-w-3xl mx-auto mb-10 leading-relaxed">
                        Asesoramiento técnico integral para rectificaciones de cabida, expedientes de dominio,
                        segregaciones, declaraciones de obra nueva e inmatriculaciones. Toda la documentación
                        técnica exigida por la Ley Hipotecaria.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        {tramites.map((t) => (
                            <a
                                key={t.id}
                                href={`#${t.id}`}
                                className="px-4 py-2 bg-white/5 border border-white/15 rounded-full text-white/80 font-semibold text-sm hover:bg-accent/20 hover:border-accent/40 hover:text-accent transition-all duration-200"
                            >
                                {t.articulo}
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* Introducción */}
            <section className="py-16 bg-white border-b border-slate-100">
                <div className="container mx-auto px-4 max-w-4xl text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
                        ¿Qué es un Trámite Registral y cuándo lo necesitas?
                    </h2>
                    <p className="text-lg text-slate-600 leading-relaxed mb-6">
                        Los trámites registrales son procedimientos jurídicos-técnicos que permiten poner en orden
                        la situación de una finca en el <strong>Registro de la Propiedad</strong> y en el{" "}
                        <strong>Catastro</strong>. Son imprescindibles cuando vas a{" "}
                        <strong>vender, hipotecar, heredar o dividir</strong> una propiedad y la documentación
                        no coincide con la realidad.
                    </p>
                    <div className="grid md:grid-cols-3 gap-6 text-left">
                        {[
                            {
                                title: "La superficie no coincide",
                                desc: "El Registro dice 500 m² pero la finca mide 600 m². Sin corregirlo, el notario no puede escriturar.",
                            },
                            {
                                title: "La finca no está inscrita",
                                desc: "Tierras heredadas o antiguas compraventas privadas que nunca se llevaron al Registro de la Propiedad.",
                            },
                            {
                                title: "Necesitas dividir o unir fincas",
                                desc: "Para vender solo una parte de tu terreno o unificar varias parcelas colindantes en una sola.",
                            },
                        ].map((item, i) => (
                            <div key={i} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                                <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center mb-3">
                                    <AlertCircle className="h-4 w-4 text-accent" />
                                </div>
                                <h3 className="font-bold text-primary mb-2">{item.title}</h3>
                                <p className="text-sm text-slate-600">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trámites individuales */}
            {tramites.map((tramite, idx) => {
                const colors = colorMap[tramite.color];
                const Icon = tramite.icon;
                const isEven = idx % 2 === 0;

                return (
                    <section
                        key={tramite.id}
                        id={tramite.id}
                        className={`py-20 ${isEven ? "bg-white" : "bg-slate-50"} scroll-mt-24`}
                    >
                        <div className="container mx-auto px-4 max-w-5xl">
                            <div className={`flex flex-col ${isEven ? "md:flex-row" : "md:flex-row-reverse"} gap-12 items-start`}>

                                {/* Icono + Badge */}
                                <div className="w-full md:w-2/5 flex flex-col items-center md:items-start gap-6">
                                    <div className={`w-20 h-20 rounded-2xl ${colors.bg} ${colors.border} border-2 flex items-center justify-center shadow-lg`}>
                                        <Icon className={`h-10 w-10 ${colors.text}`} />
                                    </div>
                                    <div>
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${colors.badge} ${colors.badgeText} mb-2`}>
                                            {tramite.articulo}
                                        </span>
                                        <h2 className="text-3xl md:text-4xl font-bold text-primary leading-tight">
                                            {tramite.titulo}
                                        </h2>
                                        <p className={`mt-2 text-lg font-medium ${colors.text}`}>
                                            {tramite.subtitulo}
                                        </p>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed text-base">
                                        {tramite.descripcion}
                                    </p>
                                    {tramite.nota && (
                                        <div className="flex gap-2 items-start p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                                            <span>{tramite.nota}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Pasos */}
                                <div className="w-full md:w-3/5">
                                    <div className={`rounded-2xl border-2 ${colors.border} bg-white shadow-xl p-8`}>
                                        <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2">
                                            <span className={`w-2 h-6 rounded-full ${colors.bg.replace("bg-", "bg-").replace("-50", "-500")}`} />
                                            Proceso paso a paso
                                        </h3>
                                        <ol className="space-y-4">
                                            {tramite.pasos.map((paso, i) => (
                                                <li key={i} className="flex items-start gap-4">
                                                    <span className={`w-7 h-7 rounded-full ${colors.badge} ${colors.text} flex items-center justify-center text-sm font-bold shrink-0 mt-0.5`}>
                                                        {i + 1}
                                                    </span>
                                                    <span className="text-slate-700 leading-relaxed">{paso}</span>
                                                </li>
                                            ))}
                                        </ol>
                                        <div className="mt-8 pt-6 border-t border-slate-100">
                                            <Link href="#contacto">
                                                <Button className={`w-full gap-2 font-bold`}>
                                                    Solicitar información sobre {tramite.titulo}
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                );
            })}

            {/* CTA Final */}
            <section id="contacto" className="py-24 bg-primary scroll-mt-24">
                <div className="container mx-auto px-4 text-center max-w-3xl">
                    <div className="inline-flex items-center gap-2 mb-6">
                        <CheckCircle2 className="h-6 w-6 text-accent" />
                        <span className="text-accent font-bold uppercase tracking-widest text-sm">Consulta gratuita inicial</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                        ¿No sabes qué trámite <br />
                        <span className="text-accent">necesitas?</span>
                    </h2>
                    <p className="text-xl text-blue-100/80 mb-10 leading-relaxed">
                        Cuéntanos tu caso y te indicamos el procedimiento más adecuado, los plazos estimados
                        y los honorarios sin compromiso.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="https://wa.me/34XXXXXXXXX?text=Hola,%20necesito%20información%20sobre%20un%20trámite%20registral"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button size="lg" className="bg-accent hover:bg-accent/90 text-white font-bold px-8 gap-2">
                                Consultar por WhatsApp
                                <ArrowRight className="h-5 w-5" />
                            </Button>
                        </a>
                        <Link href="/servicios">
                            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold px-8">
                                Ver todos los Servicios
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
            <WhatsAppButton />
            <Toaster />
        </main>
    );
}
