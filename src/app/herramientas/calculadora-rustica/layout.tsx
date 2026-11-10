import { Metadata } from 'next';
import { JsonLd } from '@/components/json-ld';
import { createPageMetadata, toolJsonLd } from '@/lib/site-config';

const tool = {
    title: 'Calculadora de valor catastral e IBI rústico en Jaén',
    description: 'Obtén una estimación orientativa del valor catastral y el IBI de fincas rústicas en Jaén a partir de tipos evaluatorios y parámetros técnicos.',
    path: '/herramientas/calculadora-rustica',
};

export const metadata: Metadata = createPageMetadata(tool);

export default function CalculadoraRusticaLayout({ children }: { children: React.ReactNode }) {
    return <><JsonLd data={toolJsonLd(tool)} />{children}</>;
}
