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
          "text": "El Catastro es un registro administrativo (fiscal) que depende de Hacienda para el cobro de impuestos (IBI), mientras que el Registro de la Propiedad da seguridad jurídica sobre quién es el dueño. Es muy común que los metros no coincidan, lo que genera problemas al vender o heredar. Para igualarlos, la Ley 13/2015 exige un archivo GML topográfico."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cómo puedo reclamar si creo que pago un IBI excesivo?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Muchos recibos de IBI tienen errores porque el Catastro calcula mal la superficie, el año de construcción o no aplica los coeficientes de depreciación (estado de conservación). Se puede realizar una auditoría técnica del Valor Catastral y, si hay error, presentar un recurso para solicitar la devolución de ingresos indebidos con carácter retroactivo (hasta 4 años)."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué debo hacer si hay un conflicto de lindes con un vecino?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Si un vecino ha invadido su propiedad o hay dudas sobre dónde está el límite real de la finca, la solución legal es realizar un Levantamiento Topográfico de Precisión (georreferenciado en ETRS89). Este informe técnico pericial tiene plena validez ante un juez o notario para establecer el Deslinde definitivo."
        }
      },
      {
        "@type": "Question",
        "name": "¿Para qué sirve exactamente un archivo GML y el IVGA?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Un GML de Parcela Catastral o de Edificio (ICUC) es un archivo informático que contiene las coordenadas GPS exactas de su propiedad. Es un requisito legal obligatorio desde 2015 para que Notarios y Registradores autoricen segregaciones, agrupaciones, declaraciones de obra nueva o rectificaciones de cabida."
        }
      }
    ]
  };

  return (
    <section className="py-24 bg-white relative">
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
                  Es extremadamente común (y problemático) que los metros cuadrados de la escritura (Registro) no coincidan con los del recibo del IBI (Catastro). Para solucionar esta <strong>discrepancia</strong> antes de vender o heredar, la Ley 13/2015 exige realizar una medición topográfica y generar un archivo GML de validación.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="ibi-excesivo" className="border-b border-slate-200">
              <AccordionTrigger className="text-left font-bold text-primary text-xl hover:text-accent transition-colors py-6">
                ¿Cómo puedo reclamar si creo que pago un IBI excesivo?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2 pb-6 space-y-4 text-base">
                <p>
                  Miles de propietarios pagan impuestos de más cada año por errores en la base de datos del Catastro. Los fallos más comunes incluyen:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Superficies construidas computadas por encima de la realidad.</li>
                  <li>Errores en el año de antigüedad de la vivienda.</li>
                  <li>No aplicación de coeficientes reductores (por mal estado de conservación o ruina).</li>
                </ul>
                <p>
                  Mediante una <strong>auditoría técnica del Valor Catastral</strong>, podemos demostrar el error ante la Administración, logrando no solo que baje el recibo futuro, sino solicitando la <strong>devolución de ingresos indebidos</strong> de los últimos 4 años con carácter retroactivo.
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
                  Nuestros ingenieros miden la realidad física con GPS milimétrico/estación total en el sistema de referencia oficial (ETRS89). Este dictamen pericial tiene plena validez ante el Catastro, Notarías o Juzgados para establecer el <strong>Deslinde</strong> definitivo de la propiedad.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="para-que-gml" className="border-b border-slate-200">
              <AccordionTrigger className="text-left font-bold text-primary text-xl hover:text-accent transition-colors py-6">
                ¿Para qué sirve exactamente un archivo GML y el Informe IVGA?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2 pb-6 space-y-4 text-base">
                <p>
                  Un <strong>GML</strong> (Geography Markup Language) es un archivo informático que contiene el perímetro exacto de una parcela o la huella de un edificio mediante coordenadas inalterables.
                </p>
                <p>
                  El <strong>IVGA</strong> (Informe de Validación Gráfica Alternativa) es el comprobante que da el Catastro de que ese GML es correcto. Ambos documentos técnicos son <strong>requisitos obligatorios por ley</strong> para que un Notario o Registrador le autorice a segregar, agrupar, legalizar una obra nueva (ICUC) o arreglar los metros de su escritura.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-12 bg-slate-50 border-2 border-slate-200 rounded-2xl p-8 text-center flex flex-col items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <h4 className="font-bold text-secondary text-2xl font-headline">¿Se encuentra en alguna de estas situaciones?</h4>
            <p className="text-base text-muted-foreground max-w-2xl">
              Realizamos un <strong>estudio previo de su expediente catastral y registral</strong> sin compromiso para darle la viabilidad técnica y un presupuesto cerrado.
            </p>
            <Button className="mt-4 bg-accent hover:bg-accent/90 hover:scale-105 transition-all duration-300 text-white font-bold rounded-full px-8 py-6 text-lg shadow-lg flex items-center gap-3">
              <PhoneCall className="h-5 w-5" /> Consultar mi caso gratis
            </Button>
          </div>

        </div>
      </div>
    </section>
  );
}
