"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Home, Download, Loader2, FileCode, CheckCircle2, Map as MapIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { analyzeWithBackend, generateBuildingGMLWithBackend } from "@/lib/backend-api";

const GmlViewer = dynamic(() => import("./gml-viewer"), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-muted flex items-center justify-center text-muted-foreground">Cargando mapa...</div>
});

import { CoordinatesTable } from "./coordinates-table";

export function BuildingConverter() {
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [crs, setCrs] = useState("EPSG:25830");
    const [processing, setProcessing] = useState(false);
    const [features, setFeatures] = useState<any[]>([]);
    const [gmlResult, setGmlResult] = useState<Blob | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setFeatures([]);
            setGmlResult(null);
        }
    };

    const handleProcess = async () => {
        if (!file) {
            toast({ title: "Error", description: "Selecciona un archivo DXF o SHP (zip).", variant: "destructive" });
            return;
        }

        setProcessing(true);
        try {
            const response = await analyzeWithBackend(file, crs, 'BU');

            // MAPEO: El backend devuelve 'coordenadas_utm' e 'interiores_utm'
            // GmlViewer espera 'geometry' de tipo number[][][]
            const mappedFeatures = response.parcelas.map(p => ({
                id: p.id,
                geometry: [p.coordenadas_utm, ...(p.interiores_utm || [])],
                // Para el generador del backend
                coordenadas_utm: p.coordenadas_utm,
                interiores_utm: p.interiores_utm,
                referencia_catastral: p.referencia_catastral,
                capa_origen: p.capa_origen,
                has_conflict: p.has_conflict,
                is_hole: p.is_hole,
                nombre_archivo: p.nombre_archivo,
                // Para el componente GmlViewer (camelCase)
                area: p.area,
                hasConflict: p.has_conflict,
                isHole: p.is_hole,
                cadastralReference: p.referencia_catastral,
                capaOrigen: p.capa_origen
            }));

            setFeatures(mappedFeatures);
            toast({ title: "Análisis completo", description: `Se han detectado ${response.num_parcelas} geometrías de edificio.` });
        } catch (error) {
            toast({ title: "Error", description: error instanceof Error ? error.message : "Error al procesar", variant: "destructive" });
        } finally {
            setProcessing(false);
        }
    };

    const handleDownloadGML = async () => {
        if (features.length === 0) return;

        try {
            // Para edificios solemos generar uno por uno o el primero
            const blob = await generateBuildingGMLWithBackend(features, crs);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const downloadName = (features[0].nombre_archivo || features[0].id || 'edificio').replace(/\.gml$/i, '');
            a.download = `${downloadName}.gml`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast({ title: "GML Generado", description: "El archivo GML de edificio ha sido descargado." });
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "No se pudo generar el GML de edificio.",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-5xl font-bold font-headline text-primary mb-4">
                    Conversor <span className="text-accent">GML Edificios</span>
                </h1>
                <p className="text-lg text-muted-foreground">
                    Genera archivos GML INSPIRE para construcciones a partir de DXF o Shapefiles.
                </p>
            </div>

            {/* Instrucciones Específicas */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm flex gap-4">
                    <div className="bg-blue-100 p-3 rounded-lg h-fit">
                        <FileCode className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 mb-1">Detección Inteligente</h3>
                        <p className="text-sm text-muted-foreground">
                            El sistema detecta automáticamente capas de edificios como <code>EDIFICIO</code>, <code>CONSTRU</code> o <code>MASA</code>.
                        </p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm flex gap-4">
                    <div className="bg-green-100 p-3 rounded-lg h-fit">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 mb-1">Formato Validado</h3>
                        <p className="text-sm text-muted-foreground">
                            GML resultante alineado estrictamente con la normativa <strong>INSPIRE</strong> y admitido por la SEC.
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-8 flex gap-3 shadow-sm">
                <Loader2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                    <p className="font-bold mb-1">Nota Técnica:</p>
                    <p>Subir el archivo ZIP completo si usas Shapefiles terrestres o el archivo DXF directo si trabajas en AutoCAD.</p>
                </div>
            </div>

            <Card className="border-t-4 border-blue-600 shadow-xl bg-white mb-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Home className="h-6 w-6 text-blue-600" />
                        Carga de Geometría de Edificio
                    </CardTitle>
                    <CardDescription>
                        Sube el archivo DXF o ZIP (con SHP) que contiene la huella del edificio.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Sistema de Coordenadas (EPSG)</Label>
                            <Select value={crs} onValueChange={setCrs}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EPSG:25829">ETRS89 UTM 29N</SelectItem>
                                    <SelectItem value="EPSG:25830">ETRS89 UTM 30N</SelectItem>
                                    <SelectItem value="EPSG:25831">ETRS89 UTM 31N</SelectItem>
                                    <SelectItem value="EPSG:32628">WGS84 UTM 28N</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Archivo (DXF o ZIP)</Label>
                            <div className="relative">
                                <Input
                                    type="file"
                                    accept=".dxf,.zip"
                                    onChange={handleFileChange}
                                    className="cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleProcess}
                        disabled={!file || processing}
                        className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700"
                    >
                        {processing ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" />}
                        Analizar Geometría
                    </Button>
                </CardContent>
            </Card>

            {features.length > 0 && (
                <div className="space-y-8 animate-fade-in">
                    <Card className="shadow-lg border-2 border-green-500/20">
                        <CardHeader className="bg-green-50">
                            <CardTitle className="text-xl flex items-center gap-2 text-green-700">
                                <CheckCircle2 className="h-6 w-6" />
                                Validación y Visualización
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <GmlViewer features={features} crs={crs} />
                            <div className="p-4 space-y-4">
                                <CoordinatesTable features={features} coordinateSystem={crs} />

                                {/* Soporte Técnico Persistente */}
                                <div className="mt-4 bg-blue-50/50 border border-blue-100 rounded-lg p-4 text-center">
                                    <p className="text-sm font-medium text-slate-700 mb-3">¿Necesitas un informe pericial o ayuda con la validación?</p>
                                    <Link href="#tramites">
                                        <Button size="sm" variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-bold uppercase text-[10px]">
                                            Consultar con Alberto Álvarez
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="p-6 bg-slate-50 flex justify-center">
                            <Button
                                size="lg"
                                onClick={handleDownloadGML}
                                className="gap-2 px-8 h-12 text-lg font-bold shadow-lg shadow-green-200"
                            >
                                <Download className="h-5 w-5" />
                                Descargar GML
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white gap-2 font-bold px-8 h-12 text-lg"
                                onClick={async () => {
                                    try {
                                        const { generateTechnicalReport } = await import('@/lib/report-generator');
                                        await generateTechnicalReport(features, crs);
                                        toast({ title: "Informe Generado", description: "PDF listo para Notaría/Registro." });
                                    } catch (error) {
                                        toast({ title: "Error", description: "No se pudo generar el PDF", variant: "destructive" });
                                    }
                                }}
                            >
                                <FileCode className="h-5 w-5" />
                                Descargar Informe PDF
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}
