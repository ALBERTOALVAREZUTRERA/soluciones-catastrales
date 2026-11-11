import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { GUIAS } from "@/data/guias";
import { createPageMetadata } from "@/lib/site-config";

export const metadata = createPageMetadata({
  title: "Guías de Catastro, Registro y topografía",
  description:
    "Guías prácticas para resolver los problemas más habituales de una finca: rectificación de cabida, IVGA, discrepancias entre Catastro y Registro, lindes, segregaciones, obra nueva antigua y errores de valor catastral.",
  path: "/guias",
});

export default function GuiasIndexPage() {
  return (
    <main id="contenido-principal" tabIndex={-1} className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto max-w-5xl px-4 pb-20 pt-32 md:px-8">
        <h1 className="font-headline text-3xl font-bold text-primary md:text-5xl">
          Guías de Catastro, Registro y topografía
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-slate-700">
          Explicamos, paso a paso y sin tecnicismos innecesarios, cómo se resuelven
          los problemas más frecuentes de una finca ante Catastro, el Registro de la
          Propiedad y la notaría.
        </p>
        <ul className="mt-10 grid gap-6 md:grid-cols-2">
          {GUIAS.map((guia) => (
            <li key={guia.slug} className="rounded-xl border bg-slate-50 p-6">
              <h2 className="font-headline text-xl font-bold text-primary">
                <Link href={`/guias/${guia.slug}`} className="underline-offset-4 hover:underline">
                  {guia.title}
                </Link>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">{guia.description}</p>
              <Link href={`/guias/${guia.slug}`} className="mt-4 inline-block text-sm font-bold text-primary underline underline-offset-4">
                Leer la guía
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <Footer />
      <WhatsAppButton />
    </main>
  );
}
