import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Generador GML Catastro | Convertir DXF a GML Parcela Online',
    description: 'Herramienta profesional para convertir planos topográficos DXF a formato GML oficial para la Validación Gráfica Alternativa (VGA) de la Sede Electrónica del Catastro.',
};

export default function GmlConverterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
