"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileCode, Download, Loader2, AlertCircle, CheckCircle2, Map as MapIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Placeholder for conversion logic (to be implemented)
import { processFile, GmlFeature, generateGml } from "@/lib/gml-utils";

const GmlViewer = dynamic(() => import("./gml-viewer"), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-muted flex items-center justify-center text-muted-foreground">Cargando mapa...</div>
});

import { CoordinatesTable } from "./coordinates-table";

import { validateTopology, TopologyIssue } from "@/lib/gml-utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, FileText, AlertTriangle } from "lucide-react";

export function GmlConverter() {
    const { toast } = useToast();
    const [files, setFiles] = useState<File[]>([]);
    const [crs, setCrs] = useState("EPSG:25830");
    const [converting, setConverting] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [features, setFeatures] = useState<GmlFeature[]>([]);
    const [topologyIssues, setTopologyIssues] = useState<TopologyIssue[]>([]);
    const [format, setFormat] = useState("dxf");

    const [fileResults, setFileResults] = useState<(string | null)[]>([]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => {
                const combined = [...prev, ...newFiles];
                // Filter duplicates
                const unique = combined.filter((file, index, self) =>
                    index === self.findIndex((t) => (
                        t.name === file.name && t.size === file.size
                    ))
                );
                return unique;
            });
            // Reset results (or adjust array size) - for simplicity reset to force re-process
            setResult(null);
            setFeatures([]);
            setTopologyIssues([]);
            setFileResults([]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        setFileResults(prev => prev.filter((_, i) => i !== index));
        // Also clear global results if we remove files
        setResult(null);
        setFeatures([]);
        setTopologyIssues([]);
    };

    const handleConvert = async () => {
        if (files.length === 0) {
            toast({ title: "Error", description: "Por favor, añade al menos un archivo.", variant: "destructive" });
            return;
        }

        setConverting(true);
        setResult(null);
        setFeatures([]);
        setTopologyIssues([]);
        setFileResults(new Array(files.length).fill(null));

        try {
            const allFeatures: GmlFeature[] = [];
            const newFileResults: (string | null)[] = [];
            const processedLayers: { name: string, features: GmlFeature[] }[] = [];

            for (const file of files) {
                const { gml, features: fileFeatures } = await processFile(file, format, crs);
                allFeatures.push(...fileFeatures);
                processedLayers.push({ name: file.name, features: fileFeatures });
                newFileResults.push(gml);
            }

            setFileResults(newFileResults);

            // Topology Validation
            const issues = validateTopology(processedLayers);
            setTopologyIssues(issues);

            if (issues.length > 0) {
                toast({
                    title: "Atención: Problemas Detectados",
                    description: `Se han encontrado ${issues.length} conflictos de topología.`,
                    variant: "destructive"
                });
            } else {
                toast({ title: "Procesamiento correcto", description: "Archivos procesados sin errores de topología." });
            }

            setFeatures(allFeatures);
            // Combined GML (keep for "Download All" option if needed, but user wants independent)
            const finalGml = generateGml(allFeatures, crs);
            setResult(finalGml);

        } catch (error) {
            console.error(error);
            toast({
                title: "Error en el procesamiento",
                description: error instanceof Error ? error.message : "Error desconocido",
                variant: "destructive"
            });
        } finally {
            setConverting(false);
        }
    };

    const downloadGml = (content: string, fileName: string) => {
        const blob = new Blob([content], { type: 'text/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Preserve original name, replace extension
        const baseName = fileName.replace(/\.[^/.]+$/, "");
        a.download = `${baseName}.gml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-5xl font-bold font-headline text-primary mb-4">
                    Conversor <span className="text-accent">GML</span> Catastro
                </h1>
                <p className="text-lg text-muted-foreground">
                    Transforma DXF, SHP o coordenadas a GML. <strong>Soporta múltiples archivos con descarga individual.</strong>
                </p>
            </div>

            {/* Guía de Uso Rápida */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl border-l-4 border-accent shadow-sm">
                    <h3 className="font-bold text-primary mb-1 flex items-center gap-2">
                        <span className="bg-accent text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
                        Carga de Datos
                    </h3>
                    <p className="text-sm text-muted-foreground">Sube tus archivos DXF, Shapefiles (en ZIP) o CSV de coordenadas.</p>
                </div>
                <div className="bg-white p-4 rounded-xl border-l-4 border-accent shadow-sm">
                    <h3 className="font-bold text-primary mb-1 flex items-center gap-2">
                        <span className="bg-accent text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span>
                        Huso y Sistema
                    </h3>
                    <p className="text-sm text-muted-foreground">Asegúrate de elegir el Huso correcto (ej: 30N para Jaén/Península).</p>
                </div>
                <div className="bg-white p-4 rounded-xl border-l-4 border-accent shadow-sm">
                    <h3 className="font-bold text-primary mb-1 flex items-center gap-2">
                        <span className="bg-accent text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">3</span>
                        Generar y Descargar
                    </h3>
                    <p className="text-sm text-muted-foreground">Valida en el mapa y descarga tu GML validado para Catastro/Registro.</p>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-8 flex gap-3 items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                    <p className="font-bold mb-1">Requisitos para DXF:</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>Las parcelas deben ser <strong>Polilíneas Cerradas</strong> (Cerrada = Sí en Propiedades).</li>
                        <li>Las capas recomendadas son: <code>RECINTO</code>, <code>PARCELA</code> o similares.</li>
                        <li>No mezclar metros con otras unidades; usa siempre coordenadas <strong>UTM</strong>.</li>
                    </ul>
                </div>
            </div>

            <Card className="border-t-4 border-accent shadow-xl bg-white mb-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileCode className="h-6 w-6 text-accent" />
                        Carga de Archivos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="dxf" onValueChange={setFormat} className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-8">
                            <TabsTrigger value="dxf">DXF (CAD)</TabsTrigger>
                            <TabsTrigger value="shp">Shapefile (GIS)</TabsTrigger>
                            <TabsTrigger value="gml">GML / XML</TabsTrigger>
                            <TabsTrigger value="csv">Coordenadas</TabsTrigger>
                        </TabsList>

                        <div className="grid gap-6">
                            {/* ... Help Content omitted for brevity ... */}
                            <TabsContent value="gml" className="mt-0">
                                <FileUploader
                                    format="gml"
                                    onFileChange={handleFileChange}
                                    crs={crs}
                                    setCrs={setCrs}
                                    accept=".gml,.xml"
                                    desc="Visualiza y valida archivos GML existentes."
                                />
                            </TabsContent>
                            <TabsContent value="dxf" className="mt-0">
                                <FileUploader
                                    format="dxf"
                                    onFileChange={handleFileChange}
                                    crs={crs}
                                    setCrs={setCrs}
                                    accept=".dxf"
                                    desc="Añade uno o varios archivos DXF. Puedes navegar y añadir más."
                                />
                            </TabsContent>
                            <TabsContent value="shp" className="mt-0">
                                <FileUploader
                                    format="shp"
                                    onFileChange={handleFileChange}
                                    crs={crs}
                                    setCrs={setCrs}
                                    accept=".zip"
                                    desc="Añade archivos ZIP con SHP. Puedes añadir varios."
                                />
                            </TabsContent>
                            <TabsContent value="csv" className="mt-0">
                                <FileUploader
                                    format="csv"
                                    onFileChange={handleFileChange}
                                    crs={crs}
                                    setCrs={setCrs}
                                    accept=".csv,.txt"
                                    desc="Añade archivos CSV de coordenadas."
                                />
                            </TabsContent>
                        </div>
                    </Tabs>

                    {/* File List with Individual Actions */}
                    {files.length > 0 && (
                        <div className="mt-6 border rounded-lg p-4 bg-slate-50">
                            <h3 className="font-semibold text-sm text-slate-700 mb-3 flex justify-between">
                                <span>Archivos Seleccionados ({files.length})</span>
                                <Button variant="ghost" size="sm" className="h-6 text-red-500 hover:text-red-700" onClick={() => {
                                    setFiles([]);
                                    setFileResults([]);
                                    setResult(null);
                                }}>
                                    Borrar Todo
                                </Button>
                            </h3>
                            <ScrollArea className="h-[200px]">
                                <div className="space-y-2">
                                    {files.map((f, i) => (
                                        <div key={i} className="flex items-center justify-between bg-white p-2 rounded border text-sm">
                                            <span className="flex items-center gap-2 truncate max-w-[40%]">
                                                <FileText className="h-4 w-4 text-slate-400" />
                                                {f.name} <span className="text-xs text-muted-foreground">({(f.size / 1024).toFixed(1)} KB)</span>
                                            </span>

                                            <div className="flex items-center gap-2">
                                                {fileResults[i] && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-xs border-green-600 text-green-700 hover:bg-green-50"
                                                        onClick={() => downloadGml(fileResults[i]!, f.name)}
                                                    >
                                                        <Download className="h-3 w-3 mr-1" />
                                                        GML
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-500" onClick={() => removeFile(i)}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    <div className="mt-6">
                        <Button size="lg" className="w-full font-bold text-lg h-12" onClick={handleConvert} disabled={files.length === 0 || converting}>
                            {converting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Procesando {files.length} archivo(s)...
                                </>
                            ) : (
                                `Procesar y Generar ${files.length > 0 ? files.length : ''} GML(s)`
                            )}
                        </Button>
                    </div>

                    {/* Download Section */}
                    {result && (
                        <div className="mt-6 flex flex-wrap justify-center gap-4 animate-fade-in">
                            {files.length > 1 && (
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white gap-2 font-bold"
                                    onClick={() => {
                                        fileResults.forEach((content, i) => {
                                            if (content) {
                                                // Retraso muy breve para que el navegador no bloquee descargas múltiples
                                                setTimeout(() => {
                                                    const cleanName = files[i].name.replace(/\.[^/.]+$/, "");
                                                    const blob = new Blob([content], { type: 'text/xml' });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `${cleanName}.gml`;
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    document.body.removeChild(a);
                                                    URL.revokeObjectURL(url);
                                                }, i * 300); // 300ms entre cada archivo
                                            }
                                        });
                                        toast({
                                            title: "Descargas de archivos individuales iniciadas",
                                            description: "Es posible que el navegador te pida permiso para descargar varios archivos."
                                        });
                                    }}
                                >
                                    <Download className="h-5 w-5" />
                                    Descargar Todos Separadamente
                                </Button>
                            )}
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-2 border-primary text-primary hover:bg-primary hover:text-white gap-2 font-bold"
                                onClick={() => {
                                    const blob = new Blob([result], { type: 'text/xml' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    // Use first filename if only one file, otherwise generic
                                    if (files.length === 1) {
                                        const cleanName = files[0].name.replace(/\.[^/.]+$/, "");
                                        a.download = `${cleanName}.gml`;
                                    } else {
                                        a.download = `parcelas_catastro_${new Date().getTime()}.gml`;
                                    }
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                    toast({ title: "Descarga iniciada", description: "El archivo GML se ha guardado en tu equipo." });
                                }}
                            >
                                <Download className="h-5 w-5" />
                                Descargar GML
                            </Button>

                            <Button
                                size="lg"
                                variant="outline"
                                className="border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white gap-2 font-bold"
                                onClick={async () => {
                                    try {
                                        // Importar función KML
                                        const { generateKMLWithBackend } = await import('@/lib/backend-api');

                                        // Preparar datos de parcelas
                                        const parcelasData = features.map(f => ({
                                            id: f.id || f.cadastralReference || 'Sin ID',
                                            referencia_catastral: f.cadastralReference || '',
                                            area: f.area || 0,
                                            coordenadas_utm: f.geometry[0],  // Exterior
                                            interiores_utm: f.geometry.slice(1),  // Huecos
                                            has_conflict: f.hasConflict || false,
                                            is_hole: f.isHole || false,
                                            geometry_fixed: false
                                        }));

                                        // Llamar al backend
                                        const kmlBlob = await generateKMLWithBackend(parcelasData, crs);

                                        // Descargar archivo
                                        const url = URL.createObjectURL(kmlBlob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `parcelas_catastro_${new Date().getTime()}.kml`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);

                                        toast({
                                            title: "KML Generado",
                                            description: "Archivo guardado. Ábrelo en Google Earth."
                                        });
                                    } catch (error) {
                                        toast({
                                            title: "Error al generar KML",
                                            description: error instanceof Error ? error.message : "Error desconocido",
                                            variant: "destructive"
                                        });
                                    }
                                }}
                            >
                                <Download className="h-5 w-5" />
                                Descargar KML
                            </Button>

                            <Button
                                size="lg"
                                variant="outline"
                                className="border-2 border-slate-700 text-slate-700 hover:bg-slate-700 hover:text-white gap-2 font-bold"
                                onClick={async () => {
                                    try {
                                        const { generateDXFWithBackend } = await import('@/lib/backend-api');
                                        const parcelasData = features.map(f => ({
                                            id: f.id || f.cadastralReference || 'Sin ID',
                                            referencia_catastral: f.cadastralReference || '',
                                            area: f.area || 0,
                                            coordenadas_utm: f.geometry[0],
                                            interiores_utm: f.geometry.slice(1)
                                        }));

                                        const blob = await generateDXFWithBackend(parcelasData, crs);
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `parcelas_catastro_${new Date().getTime()}.dxf`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                        toast({ title: "DXF Generado", description: "Archivo listo para AutoCAD." });
                                    } catch (error) {
                                        toast({ title: "Error", description: "No se pudo generar el DXF", variant: "destructive" });
                                    }
                                }}
                            >
                                <Download className="h-5 w-5" />
                                Descargar DXF
                            </Button>

                            <Button
                                size="lg"
                                variant="outline"
                                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white gap-2 font-bold"
                                onClick={async () => {
                                    try {
                                        const { generateSHAPEWithBackend } = await import('@/lib/backend-api');
                                        const parcelasData = features.map(f => ({
                                            id: f.id || f.cadastralReference || 'Sin ID',
                                            referencia_catastral: f.cadastralReference || '',
                                            area: f.area || 0,
                                            coordenadas_utm: f.geometry[0],
                                            interiores_utm: f.geometry.slice(1)
                                        }));

                                        const blob = await generateSHAPEWithBackend(parcelasData, crs);
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `parcelas_catastro_${new Date().getTime()}.zip`; // Viene comprimido
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                        toast({ title: "Shapefile Generado", description: "Archivo ZIP listo para QGIS/GIS." });
                                    } catch (error) {
                                        toast({ title: "Error", description: "No se pudo generar el Shapefile", variant: "destructive" });
                                    }
                                }}
                            >
                                <Download className="h-5 w-5" />
                                Descargar SHAPE
                            </Button>
                        </div>
                    )}

                    {/* Results Section */}
                    {(features.length > 0 || topologyIssues.length > 0) && (
                        <div className="mt-8 space-y-6 animate-fade-in-up">

                            {/* Topology Alerts */}
                            {topologyIssues.length > 0 && (
                                <Alert variant="destructive" className="border-red-500 bg-red-50">
                                    <AlertTriangle className="h-5 w-5" />
                                    <AlertTitle>Conflictos de Topología Detectados</AlertTitle>
                                    <AlertDescription>
                                        <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                                            {topologyIssues.map((issue, idx) => (
                                                <li key={idx}>
                                                    {issue.message}
                                                </li>
                                            ))}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="border rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-slate-100 p-3 border-b flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <MapIcon className="h-5 w-5 text-slate-500" />
                                        <h3 className="font-bold text-slate-700">Verificación Visual</h3>
                                    </div>
                                    <span className="text-xs font-mono bg-slate-200 px-2 py-1 rounded">
                                        {crs}
                                    </span>
                                </div>
                                <GmlViewer features={features} crs={crs} />

                                {/* Tabla de Coordenadas */}
                                <CoordinatesTable features={features} coordinateSystem={crs} />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Subcomponente modificado para múltiple
function FileUploader({ format, onFileChange, crs, setCrs, accept, desc }: any) {
    return (
        <div className="grid gap-6">
            <div className="grid gap-2">
                <Label htmlFor={`crs-${format}`}>EPSG (Sistema Coordenadas)</Label>
                <Select value={crs} onValueChange={setCrs}>
                    <SelectTrigger id={`crs-${format}`}>
                        <SelectValue placeholder="Zona UTM" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="EPSG:25829">ETRS89 UTM 29N</SelectItem>
                        <SelectItem value="EPSG:25830">ETRS89 UTM 30N</SelectItem>
                        <SelectItem value="EPSG:25831">ETRS89 UTM 31N</SelectItem>
                        <SelectItem value="EPSG:32628">WGS84 UTM 28N (Canarias)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-2">
                <Label>Añadir Archivos ({format.toUpperCase()})</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:bg-accent/5 transition-colors cursor-pointer relative">
                    <Input
                        type="file"
                        multiple // ENABLE MULTIPLE
                        accept={accept}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={onFileChange}
                    />
                    <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <p className="font-medium">Haz clic para añadir archivos</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
