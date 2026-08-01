import { Metadata } from 'next';
import { createPageMetadata } from '@/lib/site-config';

export const metadata: Metadata = createPageMetadata({
    title: 'Calculadora de IBI rústico en Jaén',
    description: 'Obtén una estimación orientativa del valor catastral y el IBI de fincas rústicas en Jaén a partir de tipos evaluatorios y parámetros técnicos.',
    path: '/herramientas/calculadora-rustica',
});

export default function CalculadoraRusticaLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
