import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Trámites Registrales en Andalucía | Subsanación y Rectificación de Cabida',
    description: 'Gestionamos expedientes ante el Registro de la Propiedad: rectificación de cabida (Art. 199 LH), expediente de dominio (Art. 201 LH), inmatriculación (Art. 203 LH), segregaciones, agrupaciones y declaraciones de obra nueva en Jaén y Andalucía.',
    alternates: {
        canonical: 'https://www.solucionescatastrales.app/tramites-registrales',
    },
    openGraph: {
        title: 'Trámites Registrales — Subsanación y Rectificación de Cabida en Andalucía',
        description: 'Expedientes registrales: rectificación de cabida, dominio, inmatriculación, segregación y obra nueva. Ingeniería técnica en Jaén.',
        url: 'https://www.solucionescatastrales.app/tramites-registrales',
    },
};

export default function TramitesRegistralesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
