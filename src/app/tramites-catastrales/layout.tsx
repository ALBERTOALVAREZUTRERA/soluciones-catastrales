import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/site-config';

export const metadata: Metadata = createPageMetadata({
    title: 'Trámites catastrales en Jaén y Andalucía',
    description: 'Tramitamos expedientes ante la Dirección General del Catastro: Modelo 902, cambio de titularidad, modificación de linderos y superficie, segregación, agrupación, división y declaración de obra nueva. Servicio en Jaén y Andalucía.',
    path: '/tramites-catastrales',
});

export default function TramitesCatralesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
