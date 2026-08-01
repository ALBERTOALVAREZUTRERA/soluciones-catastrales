
"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, FileCode, Loader2, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import {
  HoneypotField,
  PrivacyConsent,
} from "@/components/shared/privacy-consent";

export function Hero() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [website, setWebsite] = useState("");
  const [submitError, setSubmitError] = useState("");

  const handleConsultationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError("");

    const formData = new FormData(e.currentTarget as HTMLFormElement);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: "",
          phone: formData.get("phone"),
          type: "Consulta rápida desde la portada",
          ref: "",
          message: formData.get("issue"),
          privacyAccepted,
          website,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "No se pudo enviar la consulta.");
      }

      setOpen(false);
      setPrivacyAccepted(false);
      setWebsite("");
      toast({
        title: "Solicitud de consultoría enviada",
        description: "Alberto Álvarez analizará su caso y le contactará en breve.",
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "No se pudo enviar la consulta. Inténtelo de nuevo.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative h-[85vh] min-h-[600px] w-full overflow-hidden flex items-center">
      <div className="hero-visual absolute inset-0 z-0" aria-hidden="true" />

      <div className="container relative z-10 mx-auto px-4 md:px-8">
        <div className="max-w-4xl animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-accent/20 backdrop-blur-md border border-accent/30 text-accent-foreground px-4 py-2 rounded-full mb-8">
            <FileCode className="h-4 w-4" />
            <span className="text-sm font-semibold tracking-wide uppercase">Ingenieros Técnicos Topógrafos</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-white font-headline leading-tight mb-6 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
            Especialistas en Topografía y Soluciones Catastrales en <span className="text-accent underline decoration-accent/50 underline-offset-8">Jaén y Andalucía</span>
          </h1>
          <p className="text-lg md:text-2xl text-gray-200 mb-10 max-w-2xl leading-relaxed">
            Medimos la realidad física y preparamos la documentación técnica necesaria para corregir discrepancias entre Catastro, Registro y escritura.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="bg-accent text-white hover:bg-accent/90 text-lg h-14 px-10" asChild>
              <a href="#servicios">Ver soluciones técnicas</a>
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-white text-primary hover:bg-gray-100 hover:text-accent hover:scale-105 transition-all duration-300 text-lg h-14 px-10 border-none shadow-lg rounded-full">
                  Consultar mi caso <MessageCircle className="ml-2 h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-primary font-headline text-2xl">Consultoría Técnica</DialogTitle>
                  <DialogDescription>
                    Cuéntenos qué no coincide. Alberto Álvarez revisará la información y le indicará los siguientes pasos y el alcance del trabajo.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleConsultationSubmit} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" name="name" autoComplete="name" placeholder="Su nombre" required maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="665 890 608" required maxLength={30} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issue">Descripción del caso (GML, Linderos, etc.)</Label>
                    <Textarea id="issue" name="issue" aria-describedby="hero-issue-help" placeholder="Ej: Necesito GML de parcela para una segregación..." required minLength={5} maxLength={4000} />
                    <p id="hero-issue-help" className="text-xs text-muted-foreground">No incluya documentos de identidad ni información especialmente sensible.</p>
                  </div>
                  <HoneypotField
                    id="hero-website"
                    value={website}
                    onChange={setWebsite}
                  />
                  <PrivacyConsent
                    id="hero-privacy"
                    checked={privacyAccepted}
                    onCheckedChange={setPrivacyAccepted}
                  />
                  {submitError && (
                    <p role="alert" className="text-sm text-red-600">
                      {submitError}
                    </p>
                  )}
                  <Button type="submit" className="w-full bg-accent text-lg h-12" disabled={loading} aria-busy={loading}>
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Enviar Consulta"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <ul className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm text-gray-200">
            {["Primera orientación sin compromiso", "Presupuesto antes de iniciar", "Contacto directo con el técnico"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-1 h-12 bg-gradient-to-b from-accent to-transparent rounded-full opacity-50"></div>
      </div>
    </section>
  );
}
