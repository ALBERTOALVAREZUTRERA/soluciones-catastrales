"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PhoneCall } from "lucide-react";

export function TechnicalFaq() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "¿Cuál es la diferencia entre el Catastro y el Registro de la Propiedad?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "El Catastro es un registro administrativo con finalidad fiscal, mientras que el Registro de la Propiedad publica la situación jurídica de las fincas. Cuando la representación gráfica debe incorporarse o modificarse, el expediente puede requerir una representación georreferenciada en formato GML."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cómo puedo reclamar si creo que pago un IBI excesivo?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Una revisión técnica permite contrastar superficies, uso, antigüedad y otros parámetros de valoración. Si se acredita un error, se puede solicitar su corrección y estudiar si procede reclamar ingresos indebidos dentro de los plazos aplicables."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué debo hacer si hay un conflicto de lindes con un vecino?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Un levantamiento topográfico georreferenciado ayuda a documentar la realidad física y comparar títulos, Catastro y signos de posesión. La delimitación definitiva puede requerir acuerdo entre colindantes o el procedimiento jurídico correspondiente."
        }
      },
      {
        "@type": "Question",
        "name": "¿Para qué sirve exactamente un archivo GML y el IVGA?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Un GML representa mediante coordenadas el perímetro de una parcela o la huella de una construcción. Se utiliza en determinados expedientes de coordinación, segregación, agrupación, rectificación u obra nueva; la documentación concreta depende de cada operación."
        }
      }
    ]
  };

  return (
    <section id="preguntas-frecuentes" className="py-24 bg-white relative scroll-mt-24">
      {/* Schema Markup for Google SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="container mx-auto px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary mb-4 uppercase tracking-tight">
              Resolución de Problemas Frecuentes
            </h2>
            <div className="h-1 w-20 bg-accent mx-auto mb-6" />
            <p className="text-muted-foreground text-lg">
              Respuestas claras a los conflictos técnicos y legales más habituales con Catastro, Ayuntamiento y Registro de la Propiedad.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="catastro-registro" className="border-b border-slate-200">
              <AccordionTrigger className="text-left font-bold text-primary text-xl hover:text-accent transition-colors py-6">
                ¿Cuál es la diferencia entre el Catastro y el Registro de la Propiedad?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2 pb-6 space-y-4 text-base">
                <p>
                  El <strong>Catastro</strong> es un registro administrativo (y fiscal) que depende del Ministerio de Hacienda y sirve fundamentalmente para cobrar impuestos como el IBI. El <strong>Registro de la Propiedad</strong>, por su parte, es el organismo que otorga la seguridad jurídica sobre quién es el dueño real y si existen cargas o hipotecas.
                </p>
                <p>
                  Cuando la superficie o la geometría no coinciden, conviene revisar la escritura, la cartografía catastral y la realidad física. Si el procedimiento requiere incorporar o modificar la representación gráfica, puede ser necesaria una medición y un archivo GML.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="ibi-excesivo" className="border-b border-slate-200">
              <AccordionTrigger className="text-left font-bold text-primary text-xl hover:text-accent transition-colors py-6">
                ¿Cómo puedo reclamar si creo que pago un IBI excesivo?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2 pb-6 space-y-4 text-base">
                <p>
                  Algunos inmuebles presentan discrepancias que pueden afectar a su valoración. Entre los puntos que conviene comprobar están:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Superficies construidas computadas por encima de la realidad.</li>
                  <li>Errores en el año de antigüedad de la vivienda.</li>
                  <li>No aplicación de coeficientes reductores (por mal estado de conservación o ruina).</li>
                </ul>
                <p>
                  Mediante una <strong>revisión técnica del valor catastral</strong> se puede documentar el posible error. Si se confirma, se solicita su corrección y se analiza si procede reclamar <strong>ingresos indebidos</strong> conforme a los plazos y circunstancias del caso.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="lindes-vecino" className="border-b border-slate-200">
              <AccordionTrigger className="text-left font-bold text-primary text-xl hover:text-accent transition-colors py-6">
                ¿Qué debo hacer si hay un conflicto de lindes con un colindante?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2 pb-6 space-y-4 text-base">
                <p>
                  Si un vecino ha movido la valla, ha construido en su terreno o hay dudas históricas sobre dónde termina una parcela rural o urbana, la solución técnica y legal exige un <strong>levantamiento topográfico de precisión</strong>.
                </p>
                <p>
                  El levantamiento topográfico georreferenciado documenta la realidad física y permite compararla con títulos, Catastro y signos existentes. La delimitación definitiva puede requerir el acuerdo de los colindantes o el procedimiento notarial, registral o judicial que corresponda.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="para-que-gml" className="border-b border-slate-200">
              <AccordionTrigger className="text-left font-bold text-primary text-xl hover:text-accent transition-colors py-6">
                ¿Para qué sirve exactamente un archivo GML y el Informe IVGA?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2 pb-6 space-y-4 text-base">
                <p>
                  Un <strong>GML</strong> (Geography Markup Language) representa mediante coordenadas el perímetro de una parcela o la huella de una construcción.
                </p>
                <p>
                  El <strong>IVGA</strong> (Informe de Validación Gráfica Alternativa) comprueba la representación frente a la cartografía catastral. Se utiliza en determinados expedientes de segregación, agrupación, rectificación u obra nueva; el notario, registrador o la Administración determinan la documentación exigible en cada caso.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-12 bg-slate-50 border-2 border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <h4 className="font-bold text-secondary text-2xl font-headline">¿Se encuentra en alguna de estas situaciones?</h4>
            <p className="text-base text-muted-foreground max-w-2xl">
              Realizamos un <strong>estudio previo de su expediente catastral y registral</strong> sin compromiso para darle la viabilidad técnica y un presupuesto cerrado.
            </p>
            <Button className="mt-4 bg-accent hover:bg-accent/90 hover:scale-105 transition-all duration-300 text-white font-bold rounded-full px-8 py-6 text-lg shadow-lg flex items-center gap-3" asChild>
              <a href="/#tramites">
                <PhoneCall className="h-5 w-5" /> Solicitar orientación inicial
              </a>
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
}
