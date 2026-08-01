import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/site-config';

export const metadata: Metadata = createPageMetadata({
    title: 'Conversor DXF a GML para Catastro',
    description: 'Herramienta profesional para convertir planos topográficos DXF a formato GML oficial para la Validación Gráfica Alternativa (VGA) de la Sede Electrónica del Catastro.',
    path: '/herramientas/conversor-gml',
});

export default function GmlConverterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
