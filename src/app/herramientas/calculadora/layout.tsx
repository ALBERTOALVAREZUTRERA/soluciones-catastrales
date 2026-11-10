import { Metadata } from 'next';
import { JsonLd } from '@/components/json-ld';
import { createPageMetadata, toolJsonLd } from '@/lib/site-config';

const tool = {
    title: 'Calculadora de valor catastral e IBI urbano gratis',
    description: 'Estima el valor catastral de tu inmueble (suelo y construcción) en segundos. Descubre si estás pagando más IBI del que te corresponde e infórmate sobre cómo reclamar.',
    path: '/herramientas/calculadora',
};

export const metadata: Metadata = createPageMetadata(tool);

export default function CalculadoraLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <><JsonLd data={toolJsonLd(tool)} />{children}</>;
}
