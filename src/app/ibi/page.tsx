import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { JsonLd } from "@/components/json-ld";
import {
  JAEN_MUNICIPAL_IBI_TAX_YEAR,
  JAEN_MUNICIPAL_IBI_VERIFIED_ON,
  getOfficialJaenIbiSourceUrl,
} from "@/data/cadastral-municipal-ibi";
import {
  IBI_MUNICIPIOS,
  IBI_PROVINCE_AVERAGE,
  formatRate,
} from "@/lib/ibi-municipios";
import { absoluteUrl, createPageMetadata } from "@/lib/site-config";

const YEAR = JAEN_MUNICIPAL_IBI_TAX_YEAR;

export const metadata = createPageMetadata({
  title: `Tipos de IBI ${YEAR} en la provincia de Jaén, municipio a municipio`,
  description: `Tabla con el tipo de gravamen del IBI urbano y rústico ${YEAR} de los ${IBI_MUNICIPIOS.length} municipios de Jaén y el año de su última valoración catastral colectiva. Datos oficiales del Catastro.`,
  path: "/ibi",
});

export default function IbiIndexPage() {
  const sorted = [...IBI_MUNICIPIOS].sort((a, b) =>
    a.name.localeCompare(b.name, "es"),
  );

  return (
    <main id="contenido-principal" tabIndex={-1} className="min-h-screen bg-white">
      <Navbar />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: `Tipos de gravamen del IBI ${YEAR} en la provincia de Jaén`,
          description: `Tipo de gravamen urbano y rústico del IBI ${YEAR} y año de la última valoración colectiva de cada municipio de la provincia de Jaén.`,
          url: absoluteUrl("/ibi"),
          spatialCoverage: "Provincia de Jaén, España",
          temporalCoverage: String(YEAR),
          isBasedOn: getOfficialJaenIbiSourceUrl(),
          creator: { "@id": absoluteUrl("/#business") },
        }}
      />
      <div className="container mx-auto max-w-5xl px-4 pb-20 pt-32 md:px-8">
        <h1 className="font-headline text-3xl font-bold text-primary md:text-5xl">
          Tipos de IBI {YEAR} en la provincia de Jaén
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-slate-700">
          Consulte el tipo de gravamen del Impuesto sobre Bienes Inmuebles de cada
          municipio de Jaén. El tipo urbano medio de la provincia es del{" "}
          <strong>{formatRate(IBI_PROVINCE_AVERAGE.urban)}</strong> y el rústico
          medio del <strong>{formatRate(IBI_PROVINCE_AVERAGE.rustic)}</strong>.
          Pulse sobre un municipio para ver un ejemplo de cuota y cómo revisar su
          recibo.
        </p>

        <div className="mt-10 overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-primary text-white">
              <tr>
                <th scope="col" className="px-4 py-3">Municipio</th>
                <th scope="col" className="px-4 py-3">IBI urbano</th>
                <th scope="col" className="px-4 py-3">IBI rústico</th>
                <th scope="col" className="px-4 py-3">Última valoración colectiva</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item) => (
                <tr key={item.id} className="border-t odd:bg-slate-50">
                  <th scope="row" className="px-4 py-3 font-semibold">
                    <Link href={`/ibi/${item.slug}`} className="text-primary underline underline-offset-4 hover:text-accent">
                      {item.name}
                    </Link>
                  </th>
                  <td className="px-4 py-3">{formatRate(item.generalUrbanRate)}</td>
                  <td className="px-4 py-3">{formatRate(item.rusticRate)}</td>
                  <td className="px-4 py-3">{item.lastValuationYear}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-sm text-slate-600">
          Fuente:{" "}
          <a href={getOfficialJaenIbiSourceUrl()} target="_blank" rel="noopener noreferrer" className="underline">
            estadísticas de ordenanzas fiscales de la Dirección General del Catastro
          </a>
          . Datos comprobados el{" "}
          {new Date(JAEN_MUNICIPAL_IBI_VERIFIED_ON).toLocaleDateString("es-ES")}.
          Se muestra el tipo general; cada ordenanza puede fijar tipos diferenciados,
          recargos o bonificaciones.
        </p>

        <div className="mt-12 rounded-2xl bg-primary p-8 text-white">
          <h2 className="font-headline text-2xl font-bold">¿Cree que paga IBI de más?</h2>
          <p className="mt-3 text-blue-100">
            El recibo depende del valor catastral. Si la superficie, el uso, la
            antigüedad o la tipología que constan en Catastro son erróneos, la cuota
            también lo es. Revisamos su caso y le indicamos si procede reclamar.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/herramientas/calculadora" className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-6 py-3 font-bold text-primary">
              Calcular mi valor catastral
            </Link>
            <Link href="/#tramites" className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/40 px-6 py-3 font-bold">
              Solicitar revisión técnica
            </Link>
          </div>
        </div>
      </div>
      <Footer />
      <WhatsAppButton />
    </main>
  );
}
