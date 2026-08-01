import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/site-config';

export const metadata: Metadata = createPageMetadata({
    title: 'Calculadora de valor catastral urbano',
    description: 'Estima el valor catastral de tu inmueble (suelo y construcción) en segundos. Descubre si estás pagando más IBI del que te corresponde e infórmate sobre cómo reclamar.',
    path: '/herramientas/calculadora',
});

export default function CalculadoraLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
