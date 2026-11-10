import { Metadata } from 'next';
import { JsonLd } from '@/components/json-ld';
import { createPageMetadata, toolJsonLd } from '@/lib/site-config';

const tool = {
    title: 'Conversor DXF a GML de edificio para Catastro gratis',
    description: 'Convierte tus planos DXF de edificación a formato GML oficial para cumplir con los requisitos de la Validación Gráfica Alternativa Catastral para nuevas obras.',
    path: '/herramientas/conversor-edificio',
};

export const metadata: Metadata = createPageMetadata(tool);

export default function BuildingConverterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <><JsonLd data={toolJsonLd(tool)} />{children}</>;
}
