import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Visor Catastral Interactivo | Mapa de Parcelas y Referencias Catastrales',
    description: 'Consulta cualquier parcela catastral de España en el mapa oficial del Catastro. Introduce una referencia catastral o dirección y visualiza linderos, superficie e histórico de la parcela.',
    alternates: {
        canonical: 'https://www.solucionescatastrales.app/herramientas/visor-catastral',
    },
    openGraph: {
        title: 'Visor Catastral Interactivo — Mapa de Parcelas España',
        description: 'Consulta referencias catastrales, superficies y linderos en el mapa oficial. Herramienta gratuita.',
        url: 'https://www.solucionescatastrales.app/herramientas/visor-catastral',
    }
};

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
