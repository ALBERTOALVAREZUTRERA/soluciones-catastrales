"use client";
import React from 'react';

import type { GmlFeature } from '@/lib/gml-utils';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
    buildCoordinateExport,
    createCoordinatesCsv,
    createCoordinatesXlsx,
} from '@/lib/coordinate-export';

interface CoordinatesTableProps {
    features: GmlFeature[];
    coordinateSystem?: string;
}

export function CoordinatesTable({ features, coordinateSystem = "UTM 30N (EPSG:25830)" }: CoordinatesTableProps) {
    const { toast } = useToast();
    const exportData = React.useMemo(() => buildCoordinateExport(features), [features]);

    const downloadBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        globalThis.setTimeout(() => URL.revokeObjectURL(url), 0);
    };

    const exportToCSV = () => {
        try {
            const csv = createCoordinatesCsv(features, coordinateSystem);
            downloadBlob(
                new Blob([csv], { type: 'text/csv;charset=utf-8' }),
                `coordenadas_${new Date().toISOString().slice(0, 10)}.csv`,
            );
        } catch (error) {
            toast({
                title: 'No se pudo exportar el CSV',
                description: error instanceof Error ? error.message : 'La geometría no es válida.',
                variant: 'destructive',
            });
        }
    };

    const exportToExcel = async () => {
        try {
            const workbook = await createCoordinatesXlsx(features, coordinateSystem);
            downloadBlob(
                workbook,
                `coordenadas_${new Date().toISOString().slice(0, 10)}.xlsx`,
            );
        } catch (error) {
            toast({
                title: 'No se pudo exportar el Excel',
                description: error instanceof Error ? error.message : 'La geometría no es válida.',
                variant: 'destructive',
            });
        }
    };

    if (features.length === 0) {
        return null;
    }

    // Calcular total de puntos
    const totalPoints = exportData.rows.length;

    return (
        <Card className="mt-6">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Tabla de Coordenadas</CardTitle>
                        <CardDescription>
                            {features.length} parcela(s) · {totalPoints} puntos · Sistema: {coordinateSystem}
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={exportToCSV} variant="outline" size="sm">
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            CSV
                        </Button>
                        <Button onClick={exportToExcel} variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Excel
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border max-h-[400px] overflow-auto">
                    <Table>
                        <TableHeader className="sticky top-0 bg-background">
                            <TableRow>
                                <TableHead className="w-[200px]">ID Parcela</TableHead>
                                <TableHead className="w-[100px]">Punto</TableHead>
                                <TableHead className="text-right">X (m)</TableHead>
                                <TableHead className="text-right">Y (m)</TableHead>
                                <TableHead className="w-[120px]">Tipo</TableHead>
                                <TableHead className="text-right">Área (m²)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {exportData.rows.map((row, index) => (
                                <TableRow key={`${row.parcelId}-${row.ring}-${row.vertex}-${index}`}>
                                    <TableCell className="font-medium">
                                        {row.area !== null ? row.parcelId : ''}
                                    </TableCell>
                                    <TableCell className={row.type === 'Hueco' ? 'text-muted-foreground' : ''}>
                                        {row.type === 'Exterior' ? row.vertex : `H${row.ring.replace('Hueco ', '')}-${row.vertex}`}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">{row.x.toFixed(3)}</TableCell>
                                    <TableCell className="text-right font-mono text-sm">{row.y.toFixed(3)}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${row.type === 'Exterior' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-blue-50 text-blue-700 ring-blue-600/20'}`}>
                                            {row.type}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {row.area === null ? '' : row.area.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
