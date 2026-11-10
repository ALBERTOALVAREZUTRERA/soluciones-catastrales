import { Metadata } from 'next';
import { JsonLd } from '@/components/json-ld';
import { createPageMetadata, toolJsonLd } from '@/lib/site-config';

const tool = {
    title: 'Conversor DXF, KML y SHP a GML de Catastro gratis',
    description: 'Herramienta profesional para convertir planos topográficos DXF a formato GML oficial para la Validación Gráfica Alternativa (VGA) de la Sede Electrónica del Catastro.',
    path: '/herramientas/conversor-gml',
};

export const metadata: Metadata = createPageMetadata(tool);

export default function GmlConverterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <><JsonLd data={toolJsonLd(tool)} />{children}</>;
}
