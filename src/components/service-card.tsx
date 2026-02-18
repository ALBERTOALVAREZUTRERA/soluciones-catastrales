
"use client";

import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileCheck, Map as MapIcon, ShieldCheck, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ServiceCardProps {
  title: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  detailedContent?: {
    subtitle: string;
    points: string[];
    technicalNote: string;
  };
}

export function ServiceCard({ title, description, imageUrl, imageHint, detailedContent }: ServiceCardProps) {
  return (
    <Card className="group overflow-hidden border-none shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl bg-white">
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          data-ai-hint={imageHint}
        />
        <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/10 transition-colors" />
      </div>
      <CardHeader className="pt-6">
        <CardTitle className="text-xl font-bold font-headline text-primary group-hover:text-accent transition-colors">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {description}
        </p>
        
        {detailedContent ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="link" className="p-0 text-accent font-semibold group-hover:translate-x-1 transition-transform">
                Ver detalle del Informe <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center gap-2 text-accent mb-2">
                  <FileCheck className="h-6 w-6" />
                  <span className="text-xs font-bold uppercase tracking-widest">Documentación Técnica Oficial</span>
                </div>
                <DialogTitle className="text-2xl md:text-3xl font-headline text-primary uppercase">
                  {title}
                </DialogTitle>
                <DialogDescription className="text-base text-muted-foreground pt-2">
                  {detailedContent.subtitle}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid md:grid-cols-2 gap-8 mt-6">
                <div className="relative aspect-[3/4] md:aspect-auto h-full min-h-[400px] rounded-lg overflow-hidden border-2 border-muted shadow-2xl bg-slate-50">
                  <Image
                    src={imageUrl}
                    alt="Vista previa del informe técnico"
                    fill
                    className="object-contain p-4"
                  />
                  <div className="absolute top-4 right-4 bg-accent text-white text-[10px] px-3 py-1.5 rounded-full font-bold shadow-lg">
                    VISTA PREVIA TÉCNICA
                  </div>
                </div>
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="font-bold text-primary flex items-center gap-2 text-lg">
                      <ShieldCheck className="h-6 w-6 text-accent" /> Aspectos Clave del Trámite
                    </h4>
                    <ul className="space-y-4">
                      {detailedContent.points.map((point, i) => (
                        <li key={i} className="text-sm flex gap-3 text-muted-foreground leading-relaxed">
                          <span className="h-2 w-2 rounded-full bg-accent mt-1.5 shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="p-5 bg-muted/50 rounded-xl border-l-4 border-accent shadow-sm">
                    <p className="text-xs italic text-primary font-medium leading-relaxed">
                      "{detailedContent.technicalNote}"
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button className="w-full bg-primary hover:bg-primary/90 h-12 text-lg font-bold" asChild>
                      <a href="#tramites">Solicitar mi Informe ICUC</a>
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground">
                      * El documento final se entrega visado y en formato PDF/GML oficial.
                    </p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <Button variant="link" className="p-0 text-accent font-semibold group-hover:translate-x-1 transition-transform" asChild>
            <a href="#tramites">Más información <ArrowRight className="ml-2 h-4 w-4" /></a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
