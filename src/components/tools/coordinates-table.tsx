"use client";
import React from 'react';

import { GmlFeature } from '@/lib/gml-utils';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CoordinatesTableProps {
    features: GmlFeature[];
    coordinateSystem?: string;
}

export function CoordinatesTable({ features, coordinateSystem = "UTM 30N (EPSG:25830)" }: CoordinatesTableProps) {

    // Exportar a CSV
    const exportToCSV = () => {
        if (features.length === 0) return;

        const headers = ['ID Parcela', 'Punto', 'X (m)', 'Y (m)', 'Tipo'];
        const rows: string[][] = [headers];

        features.forEach((feature) => {
            // Exteriores
            if (feature.geometry && feature.geometry[0]) {
                feature.geometry[0].forEach((coord, idx) => {
                    rows.push([
                        feature.id || feature.cadastralReference || 'Sin ID',
                        `${idx + 1}`,
                        coord[0].toFixed(3),
                        coord[1].toFixed(3),
                        'Exterior'
                    ]);
                });
            }

            // Interiores (huecos)
            if (feature.geometry && feature.geometry.length > 1) {
                feature.geometry.slice(1).forEach((hole, holeIdx) => {
                    hole.forEach((coord, idx) => {
                        rows.push([
                            feature.id || feature.cadastralReference || 'Sin ID',
                            `H${holeIdx + 1}-${idx + 1}`,
                            coord[0].toFixed(3),
                            coord[1].toFixed(3),
                            'Hueco'
                        ]);
                    });
                });
            }
        });

        const csvContent = rows.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `coordenadas_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Exportar a Excel (formato TSV que Excel puede abrir)
    const exportToExcel = () => {
        if (features.length === 0) return;

        const headers = ['ID Parcela', 'Punto', 'X (m)', 'Y (m)', 'Tipo', 'Área (m²)', 'Referencia Catastral'];
        const rows: string[][] = [headers];

        features.forEach((feature) => {
            const area = feature.area?.toFixed(2) || 'N/A';
            const ref = feature.cadastralReference || 'Sin referencia';

            // Exteriores
            if (feature.geometry && feature.geometry[0]) {
                feature.geometry[0].forEach((coord, idx) => {
                    rows.push([
                        feature.id || 'Sin ID',
                        `${idx + 1}`,
                        coord[0].toFixed(3),
                        coord[1].toFixed(3),
                        'Exterior',
                        idx === 0 ? area : '',
                        idx === 0 ? ref : ''
                    ]);
                });
            }

            // Interiores (huecos)
            if (feature.geometry && feature.geometry.length > 1) {
                feature.geometry.slice(1).forEach((hole, holeIdx) => {
                    hole.forEach((coord, idx) => {
                        rows.push([
                            feature.id || 'Sin ID',
                            `Hueco${holeIdx + 1}-${idx + 1}`,
                            coord[0].toFixed(3),
                            coord[1].toFixed(3),
                            'Hueco Interior',
                            '',
                            ''
                        ]);
                    });
                });
            }
        });

        const tsvContent = rows.map(row => row.join('\t')).join('\n');
        const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `coordenadas_${new Date().toISOString().split('T')[0]}.xls`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (features.length === 0) {
        return null;
    }

    // Calcular total de puntos
    const totalPoints = features.reduce((sum, feature) => {
        let count = 0;
        if (feature.geometry) {
            feature.geometry.forEach(ring => {
                count += ring.length;
            });
        }
        return sum + count;
    }, 0);

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
                            {features.map((feature) => {
                                const rows: any[] = [];

                                // Exteriores
                                if (feature.geometry && feature.geometry[0]) {
                                    feature.geometry[0].forEach((coord: number[], idx: number) => {
                                        rows.push(
                                            <TableRow key={`${feature.id}-ext-${idx}`}>
                                                <TableCell className="font-medium">
                                                    {idx === 0 ? (feature.id || feature.cadastralReference || 'Sin ID') : ''}
                                                </TableCell>
                                                <TableCell>{idx + 1}</TableCell>
                                                <TableCell className="text-right font-mono text-sm">
                                                    {coord[0].toFixed(3)}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-sm">
                                                    {coord[1].toFixed(3)}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20">
                                                        Exterior
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {idx === 0 && feature.area ? feature.area.toFixed(2) : ''}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    });
                                }

                                // Interiores (huecos)
                                if (feature.geometry && feature.geometry.length > 1) {
                                    feature.geometry.slice(1).forEach((hole: number[][], holeIdx: number) => {
                                        hole.forEach((coord: number[], idx: number) => {
                                            rows.push(
                                                <TableRow key={`${feature.id}-hole-${holeIdx}-${idx}`}>
                                                    <TableCell className="font-medium"></TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        H{holeIdx + 1}-{idx + 1}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-sm">
                                                        {coord[0].toFixed(3)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-sm">
                                                        {coord[1].toFixed(3)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20">
                                                            Hueco
                                                        </span>
                                                    </TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                            );
                                        });
                                    });
                                }

                                return <React.Fragment key={feature.id}>{rows}</React.Fragment>;
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
