
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { ServicesSection } from "@/components/services-section";
import { ProcessPortal } from "@/components/process-portal";
import { CatastroTimeWrapper } from "@/components/catastro-time-wrapper";
import { TechnicalFaq } from "@/components/technical-faq";
import { HistoricalCartography } from "@/components/historical-cartography";
import { LeadMagnet } from "@/components/lead-magnet";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";
import { Scale, Landmark, ArrowRight, CheckCircle2, Calculator, Map, TrendingDown } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen font-body selection:bg-accent selection:text-white">
      <Navbar />
      <Hero />
      <ServicesSection />

      {/* ── Sección Calculadoras y GML (Destacados) ── */}
      <section className="py-16 bg-white relative z-20 -mt-10">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Calculadora Rústica */}
            <Link href="/herramientas/calculadora-rustica" className="group">
              <div className="bg-emerald-50 border-2 border-emerald-100 hover:border-emerald-500 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all h-full flex flex-col items-center text-center">
                <div className="bg-emerald-500 text-white p-4 rounded-full mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <TrendingDown className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-emerald-950 mb-2">Calculadora Rústica</h3>
                <p className="text-emerald-800/80 text-sm mb-4">Descubre si estás pagando de más en el IBI de tus fincas u olivos en la provincia de Jaén.</p>
                <div className="mt-auto text-emerald-600 font-bold text-sm flex items-center gap-2">
                  Calcular Ahorro <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>

            {/* Calculadora Urbana */}
            <Link href="/herramientas/calculadora" className="group">
              <div className="bg-blue-50 border-2 border-blue-100 hover:border-blue-500 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all h-full flex flex-col items-center text-center">
                <div className="bg-blue-500 text-white p-4 rounded-full mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <Calculator className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-blue-950 mb-2">Calculadora Urbana</h3>
                <p className="text-blue-800/80 text-sm mb-4">Simulador oficial del RD 1020/1993 para calcular el valor exacto de pisos, solares y naves.</p>
                <div className="mt-auto text-blue-600 font-bold text-sm flex items-center gap-2">
                  Simular Valor <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>

            {/* Conversor GML */}
            <Link href="/herramientas/conversor-gml" className="group">
              <div className="bg-purple-50 border-2 border-purple-100 hover:border-purple-500 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all h-full flex flex-col items-center text-center">
                <div className="bg-purple-500 text-white p-4 rounded-full mb-4 group-hover:scale-110 transition-transform shadow-md">
                  <Map className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-purple-950 mb-2">GML Catastral Gratis</h3>
                <p className="text-purple-800/80 text-sm mb-4">Motor de conversión instantánea. Transforma KML, DXF y SHP al formato oficial del Catastro.</p>
                <div className="mt-auto text-purple-600 font-bold text-sm flex items-center gap-2">
                  Crear GML <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Sección Trámites ── */}
      <section id="tramites" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary mb-4 uppercase tracking-tight">
              Trámites Administrativos
            </h2>
            <div className="h-1 w-20 bg-accent mx-auto mb-6" />
            <p className="text-muted-foreground text-lg">
              Gestión integral de expedientes ante el Catastro y el Registro de la Propiedad.
              Nos encargamos de toda la documentación técnica y jurídica.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Trámites Registrales */}
            <Link href="/tramites-registrales" className="group">
              <div className="bg-white rounded-2xl border-2 border-slate-200 group-hover:border-primary shadow-lg group-hover:shadow-2xl transition-all duration-300 overflow-hidden h-full">
                <div className="bg-primary p-8">
                  <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                    <Scale className="h-8 w-8 text-accent" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Trámites Registrales</h3>
                  <p className="text-blue-200/80 text-sm">Ley Hipotecaria · Registro de la Propiedad</p>
                </div>
                <div className="p-8 space-y-3">
                  {[
                    "Rectificación de Cabida (Art. 199.2 LH)",
                    "Expediente de Dominio (Art. 201 LH)",
                    "Segregaciones y Agrupaciones",
                    "Declaración de Obra Nueva Registral",
                    "Inmatriculación de Fincas (Art. 203 LH)",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                      {item}
                    </div>
                  ))}
                  <div className="pt-4 flex items-center gap-2 text-primary font-bold text-sm group-hover:gap-3 transition-all">
                    Ver todos los trámites <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Trámites Catastrales */}
            <Link href="/tramites-catastrales" className="group">
              <div className="bg-white rounded-2xl border-2 border-slate-200 group-hover:border-accent shadow-lg group-hover:shadow-2xl transition-all duration-300 overflow-hidden h-full">
                <div className="bg-accent p-8">
                  <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                    <Landmark className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Trámites Catastrales</h3>
                  <p className="text-white/70 text-sm">Dirección General del Catastro · DGC</p>
                </div>
                <div className="p-8 space-y-3">
                  {[
                    "Declaración de Alteración (Modelo 902)",
                    "Cambio de Titularidad Catastral",
                    "Modificación de Linderos y Superficie",
                    "Obra Nueva ante Catastro",
                    "Segregación, Agrupación y División",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                      {item}
                    </div>
                  ))}
                  <div className="pt-4 flex items-center gap-2 text-accent font-bold text-sm group-hover:gap-3 transition-all">
                    Ver todos los trámites <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <CatastroTimeWrapper />
      <HistoricalCartography />

      {/* Sección de Estadísticas y Confianza */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <p className="text-4xl md:text-5xl font-bold text-accent mb-2">15+</p>
              <p className="text-sm uppercase tracking-wider font-semibold">Años de Experiencia</p>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <p className="text-4xl md:text-5xl font-bold text-accent mb-2">5.000+</p>
              <p className="text-sm uppercase tracking-wider font-semibold">Parcelas Regularizadas</p>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <p className="text-4xl md:text-5xl font-bold text-accent mb-2">98%</p>
              <p className="text-sm uppercase tracking-wider font-semibold">Casos de Éxito</p>
            </div>
            <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <p className="text-4xl md:text-5xl font-bold text-accent mb-2">24h</p>
              <p className="text-sm uppercase tracking-wider font-semibold">Respuesta Técnica</p>
            </div>
          </div>
        </div>
      </section>

      <LeadMagnet />
      <TechnicalFaq />
      <ProcessPortal />
      <Footer />
      <WhatsAppButton />
      <Toaster />
    </main>
  );
}
