
"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, AlertCircle, Phone, Mail, MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  HoneypotField,
  PrivacyConsent,
} from "@/components/shared/privacy-consent";

export function ProcessPortal() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [website, setWebsite] = useState("");
  const [formData, setFormData] = useState({
    type: "",
    name: "",
    email: "",
    ref: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const emailData = {
      name: formData.name,
      email: formData.email,
      phone: "",
      type: formData.type,
      ref: formData.ref,
      message: formData.message,
      privacyAccepted,
      website,
    };

    try {
      // 1. Enviar Email vía API de Next.js
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!res.ok) {
        const result = await res.json().catch(() => ({}));
        throw new Error(result.error || 'No se pudo enviar el formulario');
      }

      setSubmitted(true);
      setPrivacyAccepted(false);
      setWebsite("");
      toast({
        title: "Solicitud enviada",
        description: "Alberto ha recibido la información para revisar su caso.",
      });

    } catch {
      toast({
        title: "Error de Envío",
        description: "Ocurrió un error al enviar su solicitud. Por favor, contáctenos directamente al 665 890 608.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <section id="tramites" className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4 max-w-xl text-center">
          <div className="p-12 bg-white rounded-2xl shadow-xl border-2 border-accent/20 space-y-6 animate-fade-in-up">
            <div className="bg-accent/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-12 w-12 text-accent" />
            </div>
            <h2 className="text-3xl font-bold font-headline text-primary">¡Solicitud Recibida!</h2>
            <p className="text-muted-foreground text-lg">
              Gracias por confiar en nosotros. <strong>Alberto Álvarez</strong> revisará personalmente la información y contactará con usted para concretar los siguientes pasos.
            </p>
            <Button onClick={() => setSubmitted(false)} variant="outline" className="border-accent text-accent hover:bg-accent hover:text-white transition-all">
              Realizar otra Consulta Técnica
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="tramites" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary uppercase mb-6 leading-tight">
                Gestión de <span className="text-accent">Trámites</span> y Contacto Directo
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Envíe los datos básicos de su caso para una primera orientación sin compromiso. Antes de iniciar cualquier trabajo confirmaremos el alcance, la documentación necesaria y el presupuesto.
              </p>
            </div>

            <div className="grid gap-6">
              <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-accent/10">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <Phone className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-primary">Atención Telefónica</h3>
                  <p className="text-lg font-semibold text-accent">665 890 608</p>
                  <p className="text-xs text-muted-foreground">Horario: L-V 9:00 - 14:00 y 17:00 - 20:00</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-accent/10">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <Mail className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-primary">Email Profesional</h3>
                  <p className="text-muted-foreground break-all">alberto.alvarez.utrera@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-accent/10">
                <div className="bg-accent/10 p-3 rounded-lg">
                  <MapPin className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-primary">Oficina de Ingeniería</h3>
                  <p className="text-muted-foreground">Calle Nueva nº 5, Andújar (Jaén)</p>
                </div>
              </div>
            </div>
          </div>

          <Card className="border-none shadow-2xl overflow-hidden ring-1 ring-black/5">
            <CardHeader className="bg-primary text-white p-8">
              <CardTitle className="text-2xl font-headline uppercase tracking-wide">Cuéntenos su caso</CardTitle>
              <CardDescription className="text-gray-300 text-base">
                Facilite la información de su caso para recibir una evaluación técnica sin compromiso.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="p-8 space-y-6 bg-white">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-primary font-semibold">Tipo de Trámite Necesario</Label>
                  <Select
                    onValueChange={(value: string) => setFormData({ ...formData, type: value })}
                    required
                  >
                    <SelectTrigger id="type" className="h-12 border-muted-foreground/20 focus:ring-accent">
                      <SelectValue placeholder="Seleccione una opción" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gml-parcela">Archivo GML de Parcela (Linderos)</SelectItem>
                      <SelectItem value="icuc">Informe de Ubicación de Construcciones (ICUC)</SelectItem>
                      <SelectItem value="titularidad">Cambio de Titularidad Catastral</SelectItem>
                      <SelectItem value="ibi">Revisión de Valor / Impuesto IBI</SelectItem>
                      <SelectItem value="segregacion">Segregación / Agregación de Fincas</SelectItem>
                      <SelectItem value="otros">Otros Informes Técnicos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-primary font-semibold">Nombre Completo</Label>
                    <Input
                      id="name"
                      autoComplete="name"
                      placeholder="Ej: Juan Pérez"
                      className="h-12"
                      required
                      maxLength={100}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-primary font-semibold">Email de Contacto</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="suemail@ejemplo.com"
                      className="h-12"
                      required
                      maxLength={254}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ref" className="text-primary font-semibold">Referencia Catastral (si dispone de ella)</Label>
                  <Input
                    id="ref"
                    placeholder="14 o 20 caracteres alfanuméricos"
                    className="h-12"
                    maxLength={20}
                    value={formData.ref}
                    onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-primary font-semibold">Descripción del Caso</Label>
                  <Textarea
                    id="message"
                    placeholder="Explique brevemente su necesidad técnica..."
                    className="min-h-[120px] resize-none"
                    required
                    minLength={5}
                    maxLength={4000}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>
                <HoneypotField
                  id="portal-website"
                  value={website}
                  onChange={setWebsite}
                />
              </CardContent>
              <CardFooter className="bg-muted/30 p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border-t">
                <div className="space-y-3">
                  <PrivacyConsent
                    id="portal-privacy"
                    checked={privacyAccepted}
                    onCheckedChange={setPrivacyAccepted}
                  />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground leading-snug">
                    <AlertCircle className="h-5 w-5 text-accent shrink-0" />
                    <p>Los datos se utilizarán exclusivamente para estudiar y responder su solicitud.</p>
                  </div>
                </div>
                <Button type="submit" className="bg-accent hover:bg-accent/90 px-10 h-14 text-lg font-bold w-full sm:w-auto shadow-lg shadow-accent/20" disabled={loading} aria-busy={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Procesando...
                    </>
                  ) : "Solicitar evaluación"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </section>
  );
}
