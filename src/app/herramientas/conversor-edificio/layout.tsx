import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Conversor GML Edificio | Validar Huella de Edificación Catastro',
    description: 'Convierte tus planos DXF de edificación a formato GML oficial para cumplir con los requisitos de la Validación Gráfica Alternativa Catastral para nuevas obras.',
};

export default function BuildingConverterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
