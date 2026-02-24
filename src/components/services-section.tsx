
"use client";

import { ServiceCard } from "./service-card";
import { PlaceHolderImages } from "@/app/lib/placeholder-images";

const services = [
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
      subtitle: "Documento oficial necesario para la declaración de Obra Nueva y División Horizontal.",
      points: [
        "Georreferenciación de la huella de todos los edificios.",
        "Verificación de no invasión de linderos colindantes.",
        "Fichero GML de edificio integrado en el sistema del Catastro.",
        "Cumplimiento estricto de la Ley 13/2015 y RD 1/2004."
      ],
      technicalNote: "Este informe garantiza que su construcción está correctamente ubicada y no presenta problemas legales de invasión de fincas vecinas o suelo público."
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
      technicalNote: "Una correcta descripción técnica de su inmueble puede suponer un ahorro de hasta el 40% en su recibo anual de IBI."
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
    description: "Obtención del Informe de Validación Gráfica Alternativa 'Positivo'. Garantía técnica para que Notarios y Registradores autoricen su escritura.",
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
  }
];

export function ServicesSection() {
  return (
    <section id="servicios" className="py-24 bg-background">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary mb-4 uppercase tracking-tight">
            Ingeniería Técnica y Especialización GML
          </h2>
          <div className="h-1 w-20 bg-accent mx-auto mb-6"></div>
          <p className="text-muted-foreground text-lg">
            Soluciones avanzadas en cartografía catastral y coordinación técnica con el Registro de la Propiedad para proteger su patrimonio inmobiliario.
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
