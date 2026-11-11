import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { JsonLd } from "@/components/json-ld";
import { whatsappUrl } from "@/components/shared/whatsapp-fallback";
import { SERVICIOS, getServicio } from "@/data/servicios";
import { absoluteUrl, createPageMetadata, SITE_URL } from "@/lib/site-config";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return SERVICIOS.map((servicio) => ({ slug: servicio.slug }));
}

export async function generateMetadata({ params }: Props) {
  const servicio = getServicio((await params).slug);
  if (!servicio) return {};
  return createPageMetadata({
    title: servicio.title,
    description: servicio.description,
    path: `/servicios/${servicio.slug}`,
  });
}

const h2 = "mt-12 font-headline text-2xl font-bold text-primary";

export default async function ServicioPage({ params }: Props) {
  const servicio = getServicio((await params).slug);
  if (!servicio) notFound();
  const url = absoluteUrl(`/servicios/${servicio.slug}`);
  const relacionados = servicio.relacionados
    .map((slug) => getServicio(slug))
    .filter((item) => item !== null);

  return (
    <main id="contenido-principal" tabIndex={-1} className="min-h-screen bg-white">
      <Navbar />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Service",
              name: servicio.nombre,
              description: servicio.description,
              url,
              serviceType: servicio.nombre,
              provider: { "@id": `${SITE_URL}/#business` },
              areaServed: [
                { "@type": "AdministrativeArea", name: "Jaén" },
                { "@type": "AdministrativeArea", name: "Andalucía" },
              ],
            },
            {
              "@type": "FAQPage",
              mainEntity: servicio.faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: { "@type": "Answer", text: faq.answer },
              })),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Inicio", item: absoluteUrl("/") },
                { "@type": "ListItem", position: 2, name: "Servicios", item: absoluteUrl("/servicios") },
                { "@type": "ListItem", position: 3, name: servicio.nombre, item: url },
              ],
            },
          ],
        }}
      />
      <article className="container mx-auto max-w-4xl px-4 pb-20 pt-32 md:px-8">
        <nav aria-label="Ruta de navegación" className="text-sm text-slate-600">
          <Link href="/" className="underline">Inicio</Link> ·{" "}
          <Link href="/servicios" className="underline">Servicios</Link> · {servicio.nombre}
        </nav>

        <h1 className="mt-4 font-headline text-3xl font-bold text-primary md:text-5xl">{servicio.title}</h1>
        <p className="mt-6 text-lg leading-relaxed text-slate-700">{servicio.intro}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={whatsappUrl(`Hola, quiero presupuesto de: ${servicio.nombre}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#25D366] px-6 py-3 font-bold text-white"
          >
            Pedir presupuesto por WhatsApp
          </a>
          <Link href="/#tramites" className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-6 py-3 font-bold text-primary">
            Enviar mi caso
          </Link>
        </div>

        <h2 className={h2}>Cuándo se necesita</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
          {servicio.cuando.map((item) => <li key={item}>{item}</li>)}
        </ul>

        <h2 className={h2}>Qué incluye el trabajo</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {servicio.incluye.map((item) => (
            <li key={item} className="rounded-xl border bg-slate-50 p-4 text-slate-700">{item}</li>
          ))}
        </ul>

        <div className="mt-10 rounded-2xl bg-primary p-8 text-white">
          <h2 className="font-headline text-2xl font-bold">Presupuesto previo y sin compromiso</h2>
          <p className="mt-3 text-blue-100">
            Indíquenos la referencia catastral o la localización y qué necesita. Le
            decimos alcance, plazo y precio antes de empezar. Atención directa del
            técnico, en Jaén y Andalucía.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a href="tel:+34665890608" className="inline-flex min-h-11 items-center justify-center rounded-md bg-accent px-6 py-3 font-bold text-primary">
              Llamar al 665 890 608
            </a>
            <Link href="/#tramites" className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/40 px-6 py-3 font-bold">
              Formulario de contacto
            </Link>
          </div>
        </div>

        <h2 className={h2}>Preguntas frecuentes</h2>
        <div className="mt-4 space-y-6">
          {servicio.faqs.map((faq) => (
            <div key={faq.question}>
              <h3 className="font-bold text-slate-900">{faq.question}</h3>
              <p className="mt-2 leading-relaxed text-slate-700">{faq.answer}</p>
            </div>
          ))}
        </div>

        <h2 className={h2}>Servicios relacionados</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
          {relacionados.map((item) => (
            <li key={item.slug}>
              <Link href={`/servicios/${item.slug}`} className="underline">{item.nombre}</Link>.
            </li>
          ))}
          <li><Link href="/servicios" className="font-semibold underline">Ver todos los servicios</Link>.</li>
        </ul>

        <p className="mt-10 text-sm text-slate-600">
          Información de carácter general. El alcance, el procedimiento y la viabilidad
          de cada trabajo dependen del inmueble y de la normativa aplicable, y se
          concretan en el presupuesto.
        </p>
      </article>
      <Footer />
      <WhatsAppButton />
    </main>
  );
}
