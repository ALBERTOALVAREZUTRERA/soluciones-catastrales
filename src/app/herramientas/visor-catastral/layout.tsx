import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Visor Cartográfico Catastral Gratuito | Buscar Referencia en Mapa',
    description: 'Navega por la cartografía oficial del Catastro Español. Haz clic en cualquier parcela para detectar automáticamente su Referencia Catastral y calcular su Valor, IBI o exportar a GML.',
    openGraph: {
        title: 'Visor Catastral Interactivo',
        description: 'Navega, haz clic y obtén Referencias Catastrales al instante.',
    }
};

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
