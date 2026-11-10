import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { JsonLd } from "@/components/json-ld";
import { whatsappUrl } from "@/components/shared/whatsapp-fallback";
import {
  JAEN_MUNICIPAL_IBI_TAX_YEAR,
  JAEN_MUNICIPAL_IBI_VERIFIED_ON,
  getOfficialJaenIbiSourceUrl,
} from "@/data/cadastral-municipal-ibi";
import {
  IBI_MUNICIPIOS,
  IBI_PROVINCE_AVERAGE,
  formatEuros,
  formatRate,
  getIbiMunicipio,
} from "@/lib/ibi-municipios";
import { absoluteUrl, createPageMetadata } from "@/lib/site-config";

const YEAR = JAEN_MUNICIPAL_IBI_TAX_YEAR;
const EXAMPLE_URBAN_VALUE = 60_000;
const EXAMPLE_RUSTIC_VALUE = 10_000;

type Props = { params: Promise<{ municipio: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return IBI_MUNICIPIOS.map((item) => ({ municipio: item.slug }));
}

export async function generateMetadata({ params }: Props) {
  const item = getIbiMunicipio((await params).municipio);
  if (!item) return {};
  return createPageMetadata({
    title: `IBI en ${item.name} ${YEAR}: tipo de gravamen y revisión catastral`,
    description: `Tipo de IBI ${YEAR} en ${item.name} (Jaén): ${formatRate(item.generalUrbanRate)} urbano y ${formatRate(item.rusticRate)} rústico. Ejemplo de cuota, última valoración catastral (${item.lastValuationYear}) y cómo revisar su recibo con un técnico.`,
    path: `/ibi/${item.slug}`,
  });
}

export default async function IbiMunicipioPage({ params }: Props) {
  const item = getIbiMunicipio((await params).municipio);
  if (!item) notFound();

  const total = IBI_MUNICIPIOS.length;
  const urbanFee = EXAMPLE_URBAN_VALUE * item.generalUrbanRate;
  const rusticFee = EXAMPLE_RUSTIC_VALUE * item.rusticRate;
  const comparison =
    item.generalUrbanRate > IBI_PROVINCE_AVERAGE.urban ? "por encima" : "por debajo";
  const yearsSinceValuation = YEAR - item.lastValuationYear;
  const index = IBI_MUNICIPIOS.findIndex((other) => other.id === item.id);
  const nearby = [1, 2, 3, 4, 5, 6].map(
    (offset) => IBI_MUNICIPIOS[(index + offset) % total],
  );

  const faqs = [
    {
      question: `¿Cuál es el tipo de IBI urbano en ${item.name} en ${YEAR}?`,
      answer: `El tipo de gravamen general del IBI urbano en ${item.name} es del ${formatRate(item.generalUrbanRate)} sobre la base liquidable. Con un valor catastral de ${formatEuros(EXAMPLE_URBAN_VALUE)}, la cuota íntegra sería de ${formatEuros(urbanFee)}, antes de bonificaciones.`,
    },
    {
      question: `¿Cuánto se paga de IBI rústico en ${item.name}?`,
      answer: `El tipo del IBI rústico en ${item.name} es del ${formatRate(item.rusticRate)}. Una finca con ${formatEuros(EXAMPLE_RUSTIC_VALUE)} de valor catastral tendría una cuota íntegra de ${formatEuros(rusticFee)}.`,
    },
    {
      question: `¿Cuándo se revisaron los valores catastrales de ${item.name}?`,
      answer: `La última valoración colectiva de carácter general de ${item.name} es de ${item.lastValuationYear}. Desde entonces los valores solo se han actualizado por coeficientes o por alteraciones individuales de cada inmueble.`,
    },
    {
      question: `¿Cómo puedo reclamar si pago IBI de más en ${item.name}?`,
      answer: `El IBI se calcula sobre el valor catastral. Si los datos del inmueble en Catastro (superficie, uso, antigüedad, tipología o cultivo) no coinciden con la realidad, puede solicitarse su corrección y, en su caso, la devolución de ingresos indebidos de los ejercicios no prescritos. Requiere documentación técnica que acredite el error.`,
    },
  ];

  return (
    <main id="contenido-principal" tabIndex={-1} className="min-h-screen bg-white">
      <Navbar />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "FAQPage",
              mainEntity: faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: { "@type": "Answer", text: faq.answer },
              })),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Inicio", item: absoluteUrl("/") },
                { "@type": "ListItem", position: 2, name: "IBI en Jaén", item: absoluteUrl("/ibi") },
                { "@type": "ListItem", position: 3, name: item.name, item: absoluteUrl(`/ibi/${item.slug}`) },
              ],
            },
          ],
        }}
      />
      <article className="container mx-auto max-w-4xl px-4 pb-20 pt-32 md:px-8">
        <nav aria-label="Ruta de navegación" className="text-sm text-slate-600">
          <Link href="/" className="underline">Inicio</Link> ·{" "}
          <Link href="/ibi" className="underline">IBI en Jaén</Link> · {item.name}
        </nav>

        <h1 className="mt-4 font-headline text-3xl font-bold text-primary md:text-5xl">
          IBI en {item.name} {YEAR}: tipo de gravamen y revisión catastral
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-slate-700">
          En {YEAR} el Ayuntamiento de {item.name} aplica un tipo general del{" "}
          <strong>{formatRate(item.generalUrbanRate)}</strong> a los inmuebles urbanos
          y del <strong>{formatRate(item.rusticRate)}</strong> a los rústicos. El
          tipo urbano está {comparison} de la media provincial (
          {formatRate(IBI_PROVINCE_AVERAGE.urban)}) y ocupa el puesto{" "}
          {item.urbanRank} de {total} municipios de Jaén, ordenados de mayor a menor.
        </p>

        <dl className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            ["IBI urbano", formatRate(item.generalUrbanRate)],
            ["IBI rústico", formatRate(item.rusticRate)],
            ["Última valoración colectiva", String(item.lastValuationYear)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border bg-slate-50 p-6">
              <dt className="text-sm font-semibold text-slate-600">{label}</dt>
              <dd className="mt-2 text-3xl font-bold text-primary">{value}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-12 font-headline text-2xl font-bold text-primary">
          Ejemplo de cuota en {item.name}
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
          <li>
            Vivienda con valor catastral de {formatEuros(EXAMPLE_URBAN_VALUE)}: cuota
            íntegra de <strong>{formatEuros(urbanFee)}</strong> al año.
          </li>
          <li>
            Finca rústica con valor catastral de {formatEuros(EXAMPLE_RUSTIC_VALUE)}:
            cuota íntegra de <strong>{formatEuros(rusticFee)}</strong> al año.
          </li>
        </ul>
        <p className="mt-4 text-sm text-slate-600">
          Cálculo orientativo: cuota = base liquidable × tipo de gravamen, sin
          reducciones, recargos ni bonificaciones de la ordenanza municipal.
        </p>

        <h2 className="mt-12 font-headline text-2xl font-bold text-primary">
          Cuándo conviene revisar el valor catastral
        </h2>
        <p className="mt-4 leading-relaxed text-slate-700">
          Los valores catastrales de {item.name} proceden de una valoración colectiva
          de {item.lastValuationYear}, hace {yearsSinceValuation} años. El tipo de
          gravamen lo fija el Ayuntamiento y no es reclamable, pero la base sobre la
          que se aplica sí puede corregirse cuando Catastro describe mal el inmueble.
          Los errores más frecuentes son los siguientes.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
          <li>Superficie construida o de parcela superior a la real.</li>
          <li>Uso, tipología o categoría constructiva que no corresponden.</li>
          <li>Antigüedad o estado de conservación mal asignados.</li>
          <li>Construcciones demolidas o cultivos que ya no existen.</li>
          <li>Linderos desplazados respecto de la finca real o registral.</li>
        </ul>

        <div className="mt-10 rounded-2xl bg-primary p-8 text-white">
          <h2 className="font-headline text-2xl font-bold">
            Revisión técnica de su inmueble en {item.name}
          </h2>
          <p className="mt-3 text-blue-100">
            Comparamos la realidad física con la descripción catastral y el recibo.
            Si hay error, preparamos la documentación técnica para corregirlo y
            estudiar la devolución de ingresos indebidos. Presupuesto previo y sin
            compromiso.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappUrl(`Hola, quiero revisar el IBI o el Catastro de un inmueble en ${item.name}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#25D366] px-6 py-3 font-bold text-white"
            >
              Consultar por WhatsApp
            </a>
            <Link href="/#tramites" className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-6 py-3 font-bold text-primary">
              Enviar mi caso
            </Link>
            <a href="tel:+34665890608" className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/40 px-6 py-3 font-bold">
              665 890 608
            </a>
          </div>
        </div>

        <h2 className="mt-12 font-headline text-2xl font-bold text-primary">
          Topografía y Catastro en {item.name}
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
          <li>
            <Link href="/herramientas/calculadora" className="underline">Calculadora de valor catastral urbano</Link> y{" "}
            <Link href="/herramientas/calculadora-rustica" className="underline">calculadora rústica</Link> para estimar su caso.
          </li>
          <li>
            <Link href="/servicios" className="underline">Levantamientos topográficos y archivos GML</Link> para segregaciones, obra nueva y rectificación de cabida.
          </li>
          <li>
            <Link href="/tramites-catastrales" className="underline">Trámites catastrales</Link>: subsanación de discrepancias, cambio de titularidad y declaración de alteraciones.
          </li>
          <li>
            <Link href="/tramites-registrales" className="underline">Coordinación con el Registro de la Propiedad</Link> conforme a la Ley 13/2015.
          </li>
        </ul>

        <h2 className="mt-12 font-headline text-2xl font-bold text-primary">
          Preguntas frecuentes sobre el IBI de {item.name}
        </h2>
        <div className="mt-4 space-y-6">
          {faqs.map((faq) => (
            <div key={faq.question}>
              <h3 className="font-bold text-slate-900">{faq.question}</h3>
              <p className="mt-2 leading-relaxed text-slate-700">{faq.answer}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-12 font-headline text-xl font-bold text-primary">
          IBI en otros municipios de Jaén
        </h2>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {nearby.map((other) => (
            <li key={other.id}>
              <Link href={`/ibi/${other.slug}`} className="underline">{other.name}</Link>
            </li>
          ))}
          <li>
            <Link href="/ibi" className="font-semibold underline">Ver todos los municipios</Link>
          </li>
        </ul>

        <p className="mt-10 text-sm text-slate-600">
          Fuente:{" "}
          <a href={getOfficialJaenIbiSourceUrl()} target="_blank" rel="noopener noreferrer" className="underline">
            Dirección General del Catastro, estadísticas de ordenanzas fiscales
          </a>
          . Datos comprobados el{" "}
          {new Date(JAEN_MUNICIPAL_IBI_VERIFIED_ON).toLocaleDateString("es-ES")}.
          Se muestra el tipo general; la ordenanza fiscal municipal prevalece en caso
          de diferencia.
        </p>
      </article>
      <Footer />
      <WhatsAppButton />
    </main>
  );
}
