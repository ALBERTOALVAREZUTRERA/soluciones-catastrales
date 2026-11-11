
"use client";

import { ServiceCard } from "./service-card";
import { PlaceHolderImages } from "@/app/lib/placeholder-images";

const services = [
  {
    title: "Levantamiento Topográfico",
    description: "Medición precisa del terreno con instrumental topográfico avanzado (GPS/Estación Total). Base fundamental para cualquier proyecto de ingeniería o delimitación de propiedad.",
    imgId: "levantamiento-topografico",
    detailedContent: {
      subtitle: "Topografía de precisión para proyectos de ingeniería y delimitación de propiedad.",
      points: [
        "Levantamiento planimétrico y altimétrico.",
        "Generación de Modelos Digitales del Terreno (MDT).",
        "Replanteo de linderos sobre el terreno.",
        "Georreferenciación con GPS de alta precisión."
      ],
      technicalNote: "La base geométrica precisa es el primer paso para evitar conflictos futuros con colindantes o administraciones."
    }
  },
  {
    title: "Representación Gráfica Alternativa (RGA)",
    description: "Cuando la cartografía catastral no refleja la realidad de la finca, elaboramos la representación gráfica alternativa georreferenciada que exigen notarías y registros.",
    imgId: "ivga",
    detailedContent: {
      subtitle: "Delimitación georreferenciada de la finca para su inscripción cuando Catastro no coincide con la realidad.",
      points: [
        "Medición de los linderos reales sobre el terreno.",
        "Archivo GML de parcela en sistema ETRS89.",
        "Informe de Validación Gráfica Alternativa (IVGA).",
        "Informe técnico para notaría y Registro de la Propiedad."
      ],
      technicalNote: "Es la vía prevista en la Ley 13/2015 para rectificaciones de superficie, segregaciones, agrupaciones e inmatriculaciones cuando la certificación catastral no es válida."
    }
  },
  {
    title: "Reclamación de Ingresos Indebidos (IBI)",
    description: "Revisamos la descripción y valoración catastral para detectar posibles errores. Si existen, preparamos la documentación técnica para solicitar su corrección y estudiar ingresos indebidos.",
    imgId: "revision-ibi", // Reusing the IBI image
    detailedContent: {
      subtitle: "Comprueba si la descripción y los parámetros de valoración de tu inmueble son correctos.",
      points: [
        "Estudio técnico completo de la ponencia de valores.",
        "Diferenciación precisa entre superficie útil y construida.",
        "Análisis de coeficientes de depreciación (Antigüedad y Estado).",
        "Preparación de la documentación técnica para fundamentar la solicitud."
      ],
      technicalNote: "La procedencia y el alcance de cualquier devolución dependen del error detectado, las liquidaciones afectadas y los plazos aplicables."
    }
  },
  {
    title: "GML de Parcela Catastral",
    description: "Generación técnica de archivos GML de parcelas bajo la Ley 13/2015. Definimos con precisión geométrica los linderos para segregaciones o rectificaciones de cabida.",
    imgId: "gml-parcela",
    detailedContent: {
      subtitle: "Certificación de georreferenciación de parcelas para coordinación Registro-Catastro.",
      points: [
        "Fichero GML de parcela conforme a estándares de la SEC.",
        "Informe de Validación Gráfica Alternativa (IVGA).",
        "Representación gráfica georreferenciada en sistema ETRS89.",
        "Apto para escrituras públicas ante Notario."
      ],
      technicalNote: "Fundamental para subsanar discrepancias de superficie entre la realidad física y la descripción registral."
    }
  },
  {
    title: "Informe Catastral de Ubicación de las Construcciones (ICUC)",
    description: "Certificación técnica de la huella georreferenciada de las construcciones sobre la parcela. Indispensable para inscripciones de Obra Nueva y cumplimiento legal.",
    imgId: "gml-edificio",
    detailedContent: {
      subtitle: "Documentación técnica de ubicación para determinados expedientes de obra nueva.",
      points: [
        "Georreferenciación de la huella de todos los edificios.",
        "Verificación de no invasión de linderos colindantes.",
        "Fichero GML de edificio integrado en el sistema del Catastro.",
        "Cumplimiento estricto de la Ley 13/2015 y RD 1/2004."
      ],
      technicalNote: "La medición permite comprobar la posición de la construcción; la aceptación final corresponde al organismo que tramita el expediente."
    }
  },
  {
    title: "Revisión de Valor e IBI",
    description: "Auditoría técnica de recibos de IBI para detectar errores en valoración catastral. Gestionamos reclamaciones para reducir impuestos injustificados.",
    imgId: "revision-ibi",
    detailedContent: {
      subtitle: "Optimización del Impuesto sobre Bienes Inmuebles mediante auditoría técnica del Valor Catastral.",
      points: [
        "Estudio de coeficientes de valoración y tipologías constructivas.",
        "Detección de errores en superficies de suelo y vuelo.",
        "Impugnación de valores catastrales excesivos.",
        "Recuperación de ingresos indebidos por errores de la administración."
      ],
      technicalNote: "Si se confirma un error con incidencia económica, la corrección puede modificar recibos futuros y permitir estudiar liquidaciones anteriores."
    }
  },
  {
    title: "Visor Catastral Interactivo",
    description: "Navega sobre la cartografía oficial (WMS) y obtén al instante Referencias Catastrales mediante geolocalización inversa haciendo clic en cualquier parcela de España.",
    imgId: "visor-catastral",
    detailedContent: {
      subtitle: "Mapas interactivos sincronizados con la Base de Datos Oficial.",
      points: [
        "Cartografía en tiempo real (WMS de Catastro).",
        "Ortofotografía aérea de alta resolución (PNOA).",
        "Detección instantánea de Referencias Catastrales por coordenadas.",
        "Sincronización directa con calculadoras de Valor e IBI."
      ],
      technicalNote: "Ideal para realizar prospecciones inmobiliarias rápidas y obtener datos precisos sin salir de la misma pantalla."
    }
  },
  {
    title: "Cambio de Titularidad",
    description: "Tramitación completa para actualizar el titular catastral tras herencias o compraventas. Aseguramos que la base de datos de Hacienda sea correcta.",
    imgId: "titularidad",
  },
  {
    title: "Informe de Validación (IVGA)",
    description: "Preparación del GML y comprobación previa para solicitar el Informe de Validación Gráfica Alternativa. El resultado lo emite la Sede Electrónica del Catastro.",
    imgId: "ivga",
  },
  {
    title: "Segregación y Agregación",
    description: "Proyectos técnicos para la división o unión de parcelas. Incluye levantamiento topográfico de precisión y archivos GML de fincas resultantes.",
    imgId: "segregacion",
  },
  {
    title: "Informes Periciales",
    description: "Dictámenes periciales visados para uso judicial. Especialistas en deslindes, linderos y comprobaciones de valores frente a la administración.",
    imgId: "pericial",
  },
  {
    title: "Subsanación de Discrepancias Catastrales",
    description: "Corregimos los datos erróneos de Catastro: superficie, linderos, uso, antigüedad o construcciones que no corresponden con la realidad del inmueble.",
    imgId: "titularidad",
    detailedContent: {
      subtitle: "Expediente técnico para que Catastro describa el inmueble como es en realidad.",
      points: [
        "Revisión de la descripción catastral de suelo y construcciones.",
        "Medición y documentación gráfica de la realidad física.",
        "Presentación y seguimiento del expediente ante la Gerencia del Catastro.",
        "Estudio posterior de ingresos indebidos de IBI, si procede."
      ],
      technicalNote: "La resolución corresponde a Catastro y su plazo depende de cada Gerencia y de la complejidad del caso."
    }
  },
  {
    title: "Nota Simple del Registro de la Propiedad",
    description: "Solicitamos por usted la nota simple de su finca: titularidad, descripción, superficie y cargas. Es el punto de partida para cualquier trámite.",
    imgId: "pericial",
    detailedContent: {
      subtitle: "Información registral actualizada de la finca, sin desplazamientos.",
      points: [
        "Solicitud al Registro de la Propiedad competente.",
        "Localización de la finca por datos registrales, titular o referencia catastral.",
        "Entrega de la nota por correo electrónico.",
        "Comparación con Catastro para detectar discrepancias, si lo necesita."
      ],
      technicalNote: "La nota simple la emite el Registro de la Propiedad y tiene valor informativo."
    }
  },
  {
    title: "Proyectos de Casetas y Naves Agrarias",
    description: "Redactamos el proyecto técnico de casetas de aperos, almacenes y naves agrarias para solicitar la licencia y ejecutar la obra en suelo rústico.",
    imgId: "segregacion",
    detailedContent: {
      subtitle: "Documentación técnica para construir en la explotación agraria.",
      points: [
        "Estudio previo de viabilidad urbanística de la parcela.",
        "Levantamiento topográfico y plano de situación y emplazamiento.",
        "Memoria, planos, mediciones y presupuesto.",
        "Alta de la construcción en Catastro al terminar la obra."
      ],
      technicalNote: "La autorización depende del planeamiento municipal y de la normativa urbanística y sectorial aplicable a cada parcela."
    }
  }
];

export function ServicesSection() {
  return (
    <section id="servicios" className="py-24 bg-background">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary mb-4 uppercase tracking-tight">
            Topografía, Catastro, Registro y Proyectos Agrarios
          </h2>
          <div className="h-1 w-20 bg-accent mx-auto mb-6"></div>
          <p className="text-muted-foreground text-lg">
            Levantamientos topográficos, representaciones gráficas alternativas, GML, ICUC, subsanación de discrepancias catastrales, notas simples y proyectos de casetas y naves agrarias.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, idx) => {
            const imgData = PlaceHolderImages.find(img => img.id === service.imgId);
            return (
              <ServiceCard
                key={idx}
                title={service.title}
                description={service.description}
                imageUrl={imgData?.imageUrl || `https://picsum.photos/seed/${service.imgId}/600/400`}
                imageHint={imgData?.imageHint || "land surveying"}
                detailedContent={service.detailedContent}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
