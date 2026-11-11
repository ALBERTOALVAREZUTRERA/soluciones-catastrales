import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { JsonLd } from "@/components/json-ld";
import { whatsappUrl } from "@/components/shared/whatsapp-fallback";
import { GUIAS, GUIAS_UPDATED_ON, getGuia } from "@/data/guias";
import { absoluteUrl, createPageMetadata, SITE_URL } from "@/lib/site-config";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIAS.map((guia) => ({ slug: guia.slug }));
}

export async function generateMetadata({ params }: Props) {
  const guia = getGuia((await params).slug);
  if (!guia) return {};
  return createPageMetadata({
    title: guia.title,
    description: guia.description,
    path: `/guias/${guia.slug}`,
  });
}

const h2 = "mt-12 font-headline text-2xl font-bold text-primary";

export default async function GuiaPage({ params }: Props) {
  const guia = getGuia((await params).slug);
  if (!guia) notFound();
  const url = absoluteUrl(`/guias/${guia.slug}`);
  const otras = GUIAS.filter((other) => other.slug !== guia.slug);

  return (
    <main id="contenido-principal" tabIndex={-1} className="min-h-screen bg-white">
      <Navbar />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Article",
              headline: guia.title,
              description: guia.description,
              url,
              inLanguage: "es-ES",
              dateModified: GUIAS_UPDATED_ON,
              author: { "@type": "Person", name: "Alberto Álvarez Utrera", jobTitle: "Ingeniero técnico" },
              publisher: { "@id": `${SITE_URL}/#business` },
            },
            {
              "@type": "FAQPage",
              mainEntity: guia.faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: { "@type": "Answer", text: faq.answer },
              })),
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Inicio", item: absoluteUrl("/") },
                { "@type": "ListItem", position: 2, name: "Guías", item: absoluteUrl("/guias") },
                { "@type": "ListItem", position: 3, name: guia.title, item: url },
              ],
            },
          ],
        }}
      />
      <article className="container mx-auto max-w-4xl px-4 pb-20 pt-32 md:px-8">
        <nav aria-label="Ruta de navegación" className="text-sm text-slate-600">
          <Link href="/" className="underline">Inicio</Link> ·{" "}
          <Link href="/guias" className="underline">Guías</Link>
        </nav>

        <h1 className="mt-4 font-headline text-3xl font-bold text-primary md:text-5xl">{guia.title}</h1>
        <p className="mt-6 text-lg leading-relaxed text-slate-700">{guia.intro}</p>

        <h2 className={h2}>Cuándo se presenta</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
          {guia.cuando.map((item) => <li key={item}>{item}</li>)}
        </ul>

        <h2 className={h2}>Cómo se resuelve, paso a paso</h2>
        <ol className="mt-4 space-y-5">
          {guia.pasos.map((paso, index) => (
            <li key={paso.titulo} className="rounded-xl border bg-slate-50 p-5">
              <h3 className="font-bold text-slate-900">{index + 1}. {paso.titulo}</h3>
              <p className="mt-2 leading-relaxed text-slate-700">{paso.texto}</p>
            </li>
          ))}
        </ol>

        <h2 className={h2}>Documentación necesaria</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
          {guia.documentacion.map((item) => <li key={item}>{item}</li>)}
        </ul>

        <div className="mt-10 rounded-2xl bg-primary p-8 text-white">
          <h2 className="font-headline text-2xl font-bold">Estudiamos su caso sin compromiso</h2>
          <p className="mt-3 text-blue-100">
            Cada finca es distinta. Envíenos la referencia catastral y una breve
            descripción y le indicamos el procedimiento adecuado, la documentación
            y el presupuesto antes de empezar. Trabajamos en Jaén y Andalucía.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappUrl(`Hola, he leído la guía «${guia.title}» y quiero consultar mi caso.`)}
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

        <h2 className={h2}>Preguntas frecuentes</h2>
        <div className="mt-4 space-y-6">
          {guia.faqs.map((faq) => (
            <div key={faq.question}>
              <h3 className="font-bold text-slate-900">{faq.question}</h3>
              <p className="mt-2 leading-relaxed text-slate-700">{faq.answer}</p>
            </div>
          ))}
        </div>

        <h2 className={h2}>Recursos relacionados</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700">
          {guia.relacionados.map((link) => (
            <li key={link.href}><Link href={link.href} className="underline">{link.label}</Link>.</li>
          ))}
          {otras.slice(0, 3).map((other) => (
            <li key={other.slug}><Link href={`/guias/${other.slug}`} className="underline">{other.title}</Link>.</li>
          ))}
        </ul>

        <p className="mt-10 text-sm text-slate-600">
          Contenido informativo de carácter general, revisado el{" "}
          {new Date(GUIAS_UPDATED_ON).toLocaleDateString("es-ES")}. No sustituye
          al asesoramiento sobre un caso concreto: el procedimiento aplicable depende
          de la finca, de sus títulos y del criterio del notario, del registrador y de
          la Gerencia del Catastro.
        </p>
      </article>
      <Footer />
      <WhatsAppButton />
    </main>
  );
}
