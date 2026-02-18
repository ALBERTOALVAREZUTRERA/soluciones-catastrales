
"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function TechnicalFaq() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold font-headline text-primary mb-8 text-center uppercase tracking-tight">
            Guía Técnica: Archivos GML y Validación
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left font-bold text-primary">
                ¿Qué es exactamente un GML de Parcela Catastral?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Es un formato de archivo digital que contiene la geometría exacta de su propiedad en coordenadas geográficas oficiales (ETRS89). Según la Ley 13/2015, este archivo es obligatorio para cualquier modificación parcelaria (segregación, agrupación o rectificación) que deba inscribirse en el Registro de la Propiedad, garantizando que el Registro y el Catastro "hablen" el mismo lenguaje geográfico.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left font-bold text-primary">
                ¿Qué es el Informe Catastral de Ubicación de las Construcciones (ICUC)?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Es el documento técnico que acredita la ubicación exacta de las edificaciones dentro de una parcela. Incluye los archivos GML de la huella de los edificios y es obligatorio para declarar **Obras Nuevas** o **Divisiones Horizontales**. Permite verificar fehacientemente que la construcción no invade parcelas colindantes ni zonas públicas, cumpliendo con los requisitos de Notarios y Registradores.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left font-bold text-primary">
                ¿Por qué necesito un Informe de Validación Gráfica (IVGA)?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                El IVGA es el certificado que emite la Sede Electrónica del Catastro tras procesar nuestro archivo GML. Si el informe es "Positivo", significa que la nueva geometría es compatible con la base de datos catastral y puede ser utilizada por el Notario para autorizar la escritura. Nosotros nos encargamos de todo el proceso hasta obtener la validación positiva.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left font-bold text-primary">
                ¿Qué ocurre si hay una discrepancia en la superficie?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Es muy común que la superficie de la escritura no coincida con la del Catastro. Realizamos un levantamiento topográfico de precisión para determinar la realidad física. Con esos datos, generamos el GML de subsanación que permite corregir el error tanto en Catastro como en el Registro, protegiendo su patrimonio frente a terceros.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
}
