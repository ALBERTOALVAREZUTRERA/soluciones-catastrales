import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Calculadora IBI Rústico Gratis Jaén | Fincas, Olivos y Viñedos',
    description: 'Descubre si pagas de más en el IBI de tus fincas rústicas, olivos o viñedos en Jaén. Calculadora oficial gratuita basada en valores catastrales del Ministerio de Hacienda. Reclamación retroactiva hasta 4 años.',
    alternates: {
        canonical: 'https://www.solucionescatastrales.app/herramientas/calculadora-rustica',
    },
    openGraph: {
        title: 'Calculadora IBI Rústico Gratis — Fincas y Olivos Jaén',
        description: 'Comprueba si el IBI de tu finca rústica es correcto. Herramienta gratuita para propietarios de Jaén y Andalucía.',
        url: 'https://www.solucionescatastrales.app/herramientas/calculadora-rustica',
    },
};

export default function CalculadoraRusticaLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
