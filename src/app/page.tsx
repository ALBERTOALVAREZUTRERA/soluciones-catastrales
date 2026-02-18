
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

export default function Home() {
  return (
    <main className="min-h-screen font-body selection:bg-accent selection:text-white">
      <Navbar />
      <Hero />
      <ServicesSection />
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
