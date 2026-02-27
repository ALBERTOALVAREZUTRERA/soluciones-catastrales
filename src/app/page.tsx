
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { ServicesSection } from "@/components/services-section";
import { ProcessPortal } from "@/components/process-portal";
import { CatastroTimeWrapper } from "@/components/catastro-time-wrapper";
import { TechnicalFaq } from "@/components/technical-faq";
import { HistoricalCartography } from "@/components/historical-cartography";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";
import { Scale, Landmark, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen font-body selection:bg-accent selection:text-white">
      <Navbar />
      <Hero />
      <ServicesSection />

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

      <TechnicalFaq />
      <ProcessPortal />
      <Footer />
      <WhatsAppButton />
      <Toaster />
    </main>
  );
}
