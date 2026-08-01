import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/site-config';

export const metadata: Metadata = createPageMetadata({
    title: 'Conversor GML de edificios',
    description: 'Convierte tus planos DXF de edificación a formato GML oficial para cumplir con los requisitos de la Validación Gráfica Alternativa Catastral para nuevas obras.',
    path: '/herramientas/conversor-edificio',
});

export default function BuildingConverterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
