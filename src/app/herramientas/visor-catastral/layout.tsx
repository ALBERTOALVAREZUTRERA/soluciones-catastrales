import type { Metadata } from 'next';
import { JsonLd } from '@/components/json-ld';
import { createPageMetadata, toolJsonLd } from '@/lib/site-config';

const tool = {
    title: 'Visor catastral: mapa de parcelas y referencia catastral',
    description: 'Consulta cualquier parcela catastral de España en el mapa oficial del Catastro. Introduce una referencia catastral o dirección y visualiza linderos, superficie e histórico de la parcela.',
    path: '/herramientas/visor-catastral',
};

export const metadata: Metadata = createPageMetadata(tool);

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <><JsonLd data={toolJsonLd(tool)} />{children}</>;
}
