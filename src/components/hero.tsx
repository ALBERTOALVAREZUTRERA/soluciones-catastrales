
"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronRight, FileCode, Loader2 } from "lucide-react";
import { PlaceHolderImages } from "@/app/lib/placeholder-images";
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
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function Hero() {
  const heroImage = PlaceHolderImages?.find((img) => img.id === "hero-bg");
  const { toast } = useToast();
  const db = useFirestore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConsultationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setLoading(true);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const docData = {
      name: formData.get('name'),
      email: formData.get('email') || '', // Si no hay campo email en este mini-form
      type: 'Consulta Rápida Hero',
      refCatastral: formData.get('issue')?.toString().substring(0, 50) || '',
      message: `Teléfono: ${formData.get('phone')} - Mensaje: ${formData.get('issue')}`,
      status: 'pendiente',
      createdAt: serverTimestamp(),
    };

    addDoc(collection(db, 'expedients'), docData)
      .then(() => {
        setLoading(false);
        setOpen(false);
        toast({
          title: "Solicitud de consultoría enviada",
          description: "Alberto Álvarez analizará su caso y le contactará en breve.",
        });
      })
      .catch(async (error) => {
        setLoading(false);
        const permissionError = new FirestorePermissionError({
          path: 'expedients',
          operation: 'create',
          requestResourceData: docData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  return (
    <section className="relative h-[85vh] min-h-[600px] w-full overflow-hidden flex items-center">
      <div className="absolute inset-0 z-0">
        <Image
          src={heroImage?.imageUrl || "https://picsum.photos/seed/catastral-hero/1920/1080"}
          alt="Catastral Hero"
          fill
          className="object-cover brightness-[0.25]"
          priority
          data-ai-hint="aerial landscape"
        />
      </div>

      <div className="container relative z-10 mx-auto px-4 md:px-8">
        <div className="max-w-4xl animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-accent/20 backdrop-blur-md border border-accent/30 text-accent-foreground px-4 py-2 rounded-full mb-8">
            <FileCode className="h-4 w-4" />
            <span className="text-sm font-semibold tracking-wide uppercase">Especialistas en Archivos GML</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-bold text-white font-headline leading-tight mb-6 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
            Soluciones <span className="text-accent">Catastrales</span> a Nivel Nacional
          </h1>
          <p className="text-lg md:text-2xl text-gray-200 mb-10 max-w-2xl leading-relaxed">
            Generación profesional de archivos **GML GRATUITOS** para parcelas y edificios. Ingeniería avanzada para técnicos y propietarios en toda España.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="bg-accent text-white hover:bg-accent/90 text-lg h-14 px-10" asChild>
              <a href="#servicios">Ver Servicios GML</a>
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-white text-black hover:bg-gray-200 text-lg h-14 px-10 border-none">
                  Consulta Gratuita <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="text-primary font-headline text-2xl">Consultoría Técnica</DialogTitle>
                  <DialogDescription>
                    Envíenos su referencia catastral y Alberto Álvarez le asesorará sobre la mejor solución para su propiedad.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleConsultationSubmit} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" name="name" placeholder="Su nombre" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" name="phone" placeholder="665 890 608" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issue">Descripción del caso (GML, Linderos, etc.)</Label>
                    <Textarea id="issue" name="issue" placeholder="Ej: Necesito GML de parcela para una segregación..." required />
                  </div>
                  <Button type="submit" className="w-full bg-accent text-lg h-12" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Enviar Consulta"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-1 h-12 bg-gradient-to-b from-accent to-transparent rounded-full opacity-50"></div>
      </div>
    </section>
  );
}
