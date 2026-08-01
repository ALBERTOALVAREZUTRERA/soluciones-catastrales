import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/site-config';

export const metadata: Metadata = createPageMetadata({
    title: 'Visor catastral interactivo de parcelas',
    description: 'Consulta cualquier parcela catastral de España en el mapa oficial del Catastro. Introduce una referencia catastral o dirección y visualiza linderos, superficie e histórico de la parcela.',
    path: '/herramientas/visor-catastral',
});

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
