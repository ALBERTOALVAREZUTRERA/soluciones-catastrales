import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";
import {
    Home,
    Users,
    PenLine,
    Hammer,
    Scissors,
    Leaf,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "Trámites Catastrales | Soluciones Catastrales",
    description:
        "Especialistas en trámites ante el Catastro: declaraciones de alteración, cambio de titularidad, modificación de linderos y superficie, declaración de obra nueva, segregaciones y cambios de uso.",
};

const tramites = [
    {
        id: "declaracion-alteracion",
        icon: Home,
        modelo: "Modelo 902",
        titulo: "Declaración de Alteración de Bienes Inmuebles",
        subtitulo: "Altas, bajas y modificaciones ante el Catastro",
        descripcion:
            "Cuando se produce cualquier cambio en un bien inmueble que afecte a sus características físicas, económicas o jurídicas, el titular tiene la obligación de declararlo al Catastro en un plazo máximo de 2 meses. Las alteraciones más habituales son: nuevas construcciones, demoliciones, ampliaciones, reformas que cambian el valor y segregaciones.",
        pasos: [
            "Identificación de la alteración producida (alta, baja o modificación).",
            "Recogida de documentación técnica y jurídica soporte.",
            "Cumplimentación del Modelo 902 de declaración catastral.",
            "Aportación de documentación gráfica (planos, GML) si procede.",
            "Presentación telemática en la Sede Electrónica del Catastro.",
            "Seguimiento y resolución del expediente catastral.",
        ],
        nota: "La falta de declaración puede implicar sanciones económicas y la imputación retroactiva de tributos.",
        color: "blue",
    },
    {
        id: "titularidad",
        icon: Users,
        modelo: "Modelo 901 / Notaría",
        titulo: "Cambio de Titularidad Catastral",
        subtitulo: "Herencias, compraventas y donaciones",
        descripcion:
            "Cuando se transmite la propiedad de un inmueble (compraventa, herencia, donación, permuta), el nuevo propietario debe comunicarlo al Catastro para que figure como titular a efectos del IBI y otros tributos. En muchos casos, las notarías y registros comunican automáticamente el cambio, pero en herencias o situaciones complejas es necesaria una declaración expresa.",
        pasos: [
            "Obtención de escritura pública o documento privado de transmisión.",
            "Verificación del estado catastral actual (titular inscrito, descripción).",
            "Cumplimentación del Modelo 901 o comunicación notarial.",
            "Aportación de certificado de defunción y testamento en herencias.",
            "Presentación ante la Gerencia del Catastro correspondiente.",
            "Comprobación de la actualización en la base de datos catastral.",
        ],
        nota: "El IBI se devengará a nombre del nuevo titular a partir del año siguiente a la transmisión.",
        color: "indigo",
    },
    {
        id: "linderos",
        icon: PenLine,
        modelo: "Modelo 902 N",
        titulo: "Modificación de Linderos y Superficie",
        subtitulo: "Corrección de errores de cabida y descripción gráfica",
        descripcion:
            "Cuando la superficie o los linderos que figuran en el Catastro no se corresponden con la realidad física de la finca, es posible solicitar su corrección mediante una declaración de alteración con documentación técnica acreditativa. Esta corrección es imprescindible para coordinar el Catastro con el Registro de la Propiedad y evitar discrepancias en escrituras.",
        pasos: [
            "Levantamiento topográfico de precisión con GPS/GNSS.",
            "Elaboración del informe técnico de discrepancia superficial.",
            "Generación del fichero GML v4 con la representación gráfica correcta.",
            "Cumplimentación del Modelo 902 con la nueva descripción.",
            "Presentación de la documentación ante la Gerencia Catastral.",
            "Resolución por parte del Catastro (puede incluir inspección de campo).",
        ],
        nota: "El Catastro puede requerir un Informe de Validación Gráfica (IVG) si la diferencia supera ciertos umbrales.",
        color: "violet",
    },
    {
        id: "obra-nueva",
        icon: Hammer,
        modelo: "Modelo 902 N",
        titulo: "Declaración de Obra Nueva ante Catastro",
        subtitulo: "Alta de construcciones y ampliaciones",
        descripcion:
            "Toda construcción nueva, ampliación o reforma sustancial que cambie el valor de un inmueble debe declararse al Catastro. Esta declaración es independiente de la Declaración de Obra Nueva notarial y tiene efectos en el Impuesto de Bienes Inmuebles (IBI) y en la descripción catastral. Incluye viviendas, naves industriales, piscinas, garajes y cualquier elemento constructivo.",
        pasos: [
            "Obtención de la licencia de obras o certificado de antigüedad.",
            "Levantamiento de la superficie construida por planta y uso.",
            "Elaboración de planos de distribución y fachadas.",
            "Generación del GML de Edificio (INSPIRE bu-ext2d) si se georreferencia.",
            "Cumplimentación del Modelo 902 N con los datos constructivos.",
            "Presentación y seguimiento hasta la actualización del Catastro.",
        ],
        nota: "Las obras terminadas hace más de 4 años prescriben para posibles infracciones, pero deben declararse igualmente.",
        color: "amber",
    },
    {
        id: "segregacion",
        icon: Scissors,
        modelo: "Modelo 902 / 904",
        titulo: "Segregación, Agrupación y División",
        subtitulo: "Alta de nuevas parcelas y unificación de fincas",
        descripcion:
            "Cuando una parcela se divide en dos o más partes, o cuando varias parcelas colindantes se unen en una sola, el Catastro debe reflejar esta nueva realidad. Estas operaciones tienen implicaciones directas en el IBI y en la descripción registral, por lo que requieren documentación técnica y jurídica precisa.",
        pasos: [
            "Comprobación de la viabilidad urbanística (parcela mínima, etc.).",
            "Levantamiento topográfico de las nuevas parcelas resultantes.",
            "Elaboración de los planos de segregación, agrupación o división.",
            "Generación de los ficheros GML v4 para cada parcela resultante.",
            "Cumplimentación de los Modelos 902/904 según el caso.",
            "Coordinación con el expediente notarial y registral.",
        ],
        nota: "La segregación catastral debe coincidir con la registral; cualquier discrepancia puede bloquear futuras transmisiones.",
        color: "rose",
    },
    {
        id: "uso-cultivo",
        icon: Leaf,
        modelo: "Modelo 902 N",
        titulo: "Cambio de Uso y Cultivo",
        subtitulo: "Rústico a urbano, cambio de aprovechamiento agrícola",
        descripcion:
            "El cambio de uso de un inmueble (de residencial a comercial, de rústico a urbano, de secano a regadío) afecta directamente al valor catastral y al IBI. Debe comunicarse al Catastro para que la descripción y valoración reflejen el uso real del bien inmueble. También aplica cuando se cambia el tipo de cultivo o aprovechamiento de una parcela rústica.",
        pasos: [
            "Verificación del planeamiento urbanístico vigente (urbano/urbanizable).",
            "Obtención de la licencia de actividad o cambio de uso.",
            "Documentación del nuevo uso o cultivo (contratos, fotografías, informes).",
            "Cumplimentación del Modelo 902 N con el nuevo destino.",
            "Presentación ante la Gerencia del Catastro.",
            "Actualización de la ponencia de valores si el municipio la tiene vigente.",
        ],
        nota: "El cambio de rústico a urbano puede triplicar el valor catastral y, por tanto, la cuota del IBI.",
        color: "emerald",
    },
];

const colorMap: Record<string, { border: string; bg: string; text: string; badge: string; badgeText: string; dot: string }> = {
    blue: { border: "border-blue-500", bg: "bg-blue-50", text: "text-blue-700", badge: "bg-blue-100", badgeText: "text-blue-800", dot: "bg-blue-500" },
    indigo: { border: "border-indigo-500", bg: "bg-indigo-50", text: "text-indigo-700", badge: "bg-indigo-100", badgeText: "text-indigo-800", dot: "bg-indigo-500" },
    violet: { border: "border-violet-500", bg: "bg-violet-50", text: "text-violet-700", badge: "bg-violet-100", badgeText: "text-violet-800", dot: "bg-violet-500" },
    amber: { border: "border-amber-500", bg: "bg-amber-50", text: "text-amber-700", badge: "bg-amber-100", badgeText: "text-amber-800", dot: "bg-amber-500" },
    rose: { border: "border-rose-500", bg: "bg-rose-50", text: "text-rose-700", badge: "bg-rose-100", badgeText: "text-rose-800", dot: "bg-rose-500" },
    emerald: { border: "border-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", badge: "bg-emerald-100", badgeText: "text-emerald-800", dot: "bg-emerald-500" },
};

export default function TramitesCatastralesPage() {
    return (
        <main className="min-h-screen font-body selection:bg-accent selection:text-white">
            <Navbar />

            {/* Hero */}
            <section className="relative py-24 bg-primary overflow-hidden">
                <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:20px_20px]" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/80" />
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 border border-accent/40 rounded-full text-accent font-bold text-sm uppercase tracking-widest mb-6">
                        <Landmark className="h-4 w-4" />
                        Dirección General del Catastro
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                        Trámites{" "}
                        <span className="text-accent underline decoration-2 underline-offset-8">
                            Catastrales
                        </span>
                    </h1>
                    <p className="text-xl text-blue-100/80 max-w-3xl mx-auto mb-10 leading-relaxed">
                        Gestionamos todos los trámites ante la Dirección General del Catastro: declaraciones de
                        alteración, cambios de titularidad, modificaciones de linderos, obras nuevas, segregaciones
                        y cambios de uso. Cumplimiento de plazos garantizado.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {tramites.map((t) => (
                            <a
                                key={t.id}
                                href={`#${t.id}`}
                                className="px-4 py-2 bg-white/5 border border-white/15 rounded-full text-white/80 font-semibold text-sm hover:bg-accent/20 hover:border-accent/40 hover:text-accent transition-all duration-200"
                            >
                                {t.titulo.split(" ").slice(0, 3).join(" ")}...
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contexto */}
            <section className="py-16 bg-white border-b border-slate-100">
                <div className="container mx-auto px-4 max-w-4xl text-center">
                    <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
                        ¿Cuándo estás obligado a declarar al Catastro?
                    </h2>
                    <p className="text-lg text-slate-600 leading-relaxed mb-8">
                        La <strong>Ley del Catastro Inmobiliario</strong> (RDL 1/2004) obliga a declarar
                        cualquier alteración que afecte a un inmueble en el plazo de{" "}
                        <strong>2 meses</strong> desde que se produce. El incumplimiento puede acarrear
                        sanciones de hasta <strong>6.000 €</strong> y la regularización de IBI con carácter retroactivo.
                    </p>
                    <div className="grid md:grid-cols-4 gap-4 text-left">
                        {[
                            { icon: "🏗️", title: "Construyes o amplías", desc: "Cualquier nueva edificación o ampliación de la existente." },
                            { icon: "🔄", title: "Transmites la propiedad", desc: "Venta, herencia, donación o cualquier transmisión." },
                            { icon: "✂️", title: "Divides o unes fincas", desc: "Segregación, agrupación o división de parcelas." },
                            { icon: "🌾", title: "Cambias el uso o cultivo", desc: "De rústico a urbano, o cambio de aprovechamiento." },
                        ].map((item, i) => (
                            <div key={i} className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                                <div className="text-2xl mb-3">{item.icon}</div>
                                <h3 className="font-bold text-primary mb-1 text-sm">{item.title}</h3>
                                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Trámites */}
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

                                {/* Info */}
                                <div className="w-full md:w-2/5 flex flex-col items-center md:items-start gap-5">
                                    <div className={`w-20 h-20 rounded-2xl ${colors.bg} ${colors.border} border-2 flex items-center justify-center shadow-lg`}>
                                        <Icon className={`h-10 w-10 ${colors.text}`} />
                                    </div>
                                    <div>
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${colors.badge} ${colors.badgeText} mb-2`}>
                                            {tramite.modelo}
                                        </span>
                                        <h2 className="text-3xl md:text-4xl font-bold text-primary leading-tight">
                                            {tramite.titulo}
                                        </h2>
                                        <p className={`mt-2 text-lg font-medium ${colors.text}`}>
                                            {tramite.subtitulo}
                                        </p>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed">{tramite.descripcion}</p>
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
                                            <span className={`w-2 h-6 rounded-full ${colors.dot}`} />
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
                                                <Button className="w-full gap-2 font-bold">
                                                    Solicitar este trámite
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

            {/* Plazos */}
            <section className="py-16 bg-slate-900 text-white">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
                        Plazos de presentación ante el Catastro
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { plazo: "2 meses", desc: "Plazo general para declarar cualquier alteración desde que se produce el hecho.", color: "border-accent text-accent" },
                            { plazo: "3 meses", desc: "Plazo para herencias: desde la fecha de aceptación de la herencia.", color: "border-blue-400 text-blue-400" },
                            { plazo: "Inmediato", desc: "Notarías y registros comunican automáticamente compraventas y segregaciones.", color: "border-emerald-400 text-emerald-400" },
                        ].map((item, i) => (
                            <div key={i} className={`border-l-4 ${item.color} pl-5 py-2`}>
                                <p className={`text-3xl font-black mb-2 ${item.color.split(" ")[1]}`}>{item.plazo}</p>
                                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section id="contacto" className="py-24 bg-primary scroll-mt-24">
                <div className="container mx-auto px-4 text-center max-w-3xl">
                    <div className="inline-flex items-center gap-2 mb-6">
                        <CheckCircle2 className="h-6 w-6 text-accent" />
                        <span className="text-accent font-bold uppercase tracking-widest text-sm">Gestión integral garantizada</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                        ¿Tienes una alteración <br />
                        <span className="text-accent">pendiente de declarar?</span>
                    </h2>
                    <p className="text-xl text-blue-100/80 mb-10 leading-relaxed">
                        Nos encargamos de toda la documentación técnica y jurídica necesaria,
                        desde el levantamiento topográfico hasta la resolución del expediente catastral.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                            href="https://wa.me/34XXXXXXXXX?text=Hola,%20necesito%20información%20sobre%20un%20tr%C3%A1mite%20catastral"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button size="lg" className="bg-accent hover:bg-accent/90 text-white font-bold px-8 gap-2">
                                Consultar por WhatsApp
                                <ArrowRight className="h-5 w-5" />
                            </Button>
                        </a>
                        <Link href="/tramites-registrales">
                            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold px-8">
                                Ver Trámites Registrales
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
