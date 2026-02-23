import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Calculadora de Valor Catastral Online Gratis | Simulador Urbano',
    description: 'Estima el valor catastral de tu inmueble (suelo y construcción) en segundos. Descubre si estás pagando más IBI del que te corresponde e infórmate sobre cómo reclamar.',
};

export default function CalculadoraLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
