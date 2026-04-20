import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Trámites Catastrales en Andalucía | Declaraciones e Ingeniería Catastral',
    description: 'Tramitamos expedientes ante la Dirección General del Catastro: Modelo 902, cambio de titularidad, modificación de linderos y superficie, segregación, agrupación, división y declaración de obra nueva. Servicio en Jaén y Andalucía.',
    alternates: {
        canonical: 'https://www.solucionescatastrales.app/tramites-catastrales',
    },
    openGraph: {
        title: 'Trámites Catastrales — Declaraciones e Ingeniería Catastral en Andalucía',
        description: 'Modelo 902, cambio de titularidad, modificación de linderos, segregación y obra nueva ante Catastro. Ingeniería técnica en Jaén.',
        url: 'https://www.solucionescatastrales.app/tramites-catastrales',
    },
};

export default function TramitesCatralesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
