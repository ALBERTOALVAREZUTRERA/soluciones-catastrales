import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/site-config';

export const metadata: Metadata = createPageMetadata({
    title: 'Trámites registrales y rectificación de cabida',
    description: 'Gestionamos expedientes ante el Registro de la Propiedad: rectificación de cabida (Art. 199 LH), expediente de dominio (Art. 201 LH), inmatriculación (Art. 203 LH), segregaciones, agrupaciones y declaraciones de obra nueva en Jaén y Andalucía.',
    path: '/tramites-registrales',
});

export default function TramitesRegistralesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
