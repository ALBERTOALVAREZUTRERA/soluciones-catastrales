"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ToolHeader } from "@/components/shared/tool-header";
import { LeadMagnet } from "@/components/shared/lead-magnet";
import { CrossSelling } from "@/components/shared/cross-selling";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calculator, Search, Home, Building2, Map as MapIcon, Landmark, Info, ChevronRight, CalculatorIcon, FileText, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/lib/backend-api";
import { generatePDFReport, generateWordReport, ReportData } from "@/lib/report-generator";

export default function CalculadoraPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Base de Datos Simulada (JSON) de Municipios y Años de Ponencia
    const mockPonencias: Record<string, number> = {
        "Andújar (Jaén)": 2010,
        "Madrid": 2012,
        "Barcelona": 2017,
        "Valencia": 2015,
        "Sevilla": 2001,
        "Zaragoza": 2013,
        "Málaga": 2016,
        "Murcia": 2015,
        "Palma de Mallorca": 2012,
        "Bilbao": 2016,
        "Valladolid": 2017,
        "Fuencaliente": 1990
    };

    // CT/GB (Coeficiente de Gastos y Beneficio) por municipio
    // Verificado en Hojas Informativas reales: Andújar CT=1.30
    const mockGB: Record<string, number> = {
        "Andújar (Jaén)": 1.30,
    };

    const [municipios, setMunicipios] = useState(Object.keys(mockPonencias));
    const [result, setResult] = useState<any>(null);
    const [searchStatus, setSearchStatus] = useState<{ type: 'success' | 'error' | 'info' | null, message: string }>({ type: null, message: "" });
    const [advancedOpen, setAdvancedOpen] = useState(false);

    const [formData, setFormData] = useState({
        municipio: "Andújar",
        clase: "urbano",
        rc: "",
        sup_parcela: 0,
        edif_max: 0,
        edif_real: 0,
        valor_rep: 0,
        zona_valor: "",
        uso_const: "vivienda",
        categoria: 5,
        sup_const: 0,
        anio_const: 2000,
        estado: "normal",
        ha: 0,
        tipo_eval: 0,
        uso_suelo_rust: "residencial",
        sup_ocupada: 0,
        // Parámetros expertos (Ponencia)
        custom_mbc: 550,
        custom_mbr: 200,
        custom_mbr_rustico: 37.8,
        custom_rm: 0.50,
        custom_gb: 1.30,   // CT/GB Andújar verificado = 1.30
        custom_tipo_urbano: 0.006,
        custom_tipo_rustico: 0.010,
        custom_anio_ponencia: 2010
    });

    // Leer Referencia Catastral de la URL si venimos del Visor Catastral
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const rcParam = params.get('rc');
        if (rcParam) {
            setFormData(prev => ({ ...prev, rc: rcParam }));
        }
    }, []);

    // Actualizar ponencia Y CT/GB cuando el usuario elige un municipio conocido
    useEffect(() => {
        const updates: Record<string, number> = {};
        if (formData.municipio && mockPonencias[formData.municipio]) {
            updates.custom_anio_ponencia = mockPonencias[formData.municipio];
        }
        if (formData.municipio && mockGB[formData.municipio]) {
            updates.custom_gb = mockGB[formData.municipio];
        }
        if (Object.keys(updates).length > 0) {
            setFormData(prev => ({ ...prev, ...updates }));
        }
    }, [formData.municipio]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: isNaN(Number(value)) ? value : Number(value) }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const getReportData = (): ReportData | null => {
        if (!result) return null;
        return {
            referenciaCatastral: formData.rc,
            municipio: formData.municipio,
            clase: formData.clase,
            uso: formData.uso_const,
            superficie: formData.sup_const,
            anioConstruccion: formData.anio_const,
            mbc: formData.custom_mbc,
            mbr: formData.custom_mbr,
            rm: formData.custom_rm,
            gb: formData.custom_gb,
            valorSuelo: Number(result.suelo_urbano || result.suelo_rustico_no_ocupado + result.suelo_rustico_ocupado),
            valorConstruccion: Number(result.construccion),
            valorTotal: Number(result.valor_catastral_total)
        };
    };

    const handleExportPDF = () => {
        const data = getReportData();
        if (data) generatePDFReport(data);
    };

    const handleExportWord = async () => {
        const data = getReportData();
        if (data) {
            try {
                await generateWordReport(data);
            } catch (error) {
                toast({
                    variant: "destructive",
                    title: "Error de Exportación",
                    description: "No se pudo generar el documento Word.",
                });
            }
        }
    };

    const calculate = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/catastro/calcular-ibi`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (!response.ok) throw new Error("Error en el cálculo");
            const data = await response.json();
            setResult(data);
            toast({
                title: "Cálculo completado",
                description: "Se han actualizado los valores catastrales e IBI.",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo conectar con el servidor de cálculo.",
            });
        } finally {
            setLoading(false);
        }
    };

    const buscarRC = async () => {
        if (!formData.rc || formData.rc.length < 14) {
            setSearchStatus({ type: 'error', message: 'Referencia incompleta. Introduce al menos 14 caracteres.' });
            toast({
                variant: "destructive",
                title: "Referencia incompleta",
                description: "Introduce al menos 14 caracteres de la RC.",
            });
            return;
        }

        setLoading(true);
        setSearchStatus({ type: 'info', message: 'Conectando con el Catastro... Buscando parcela.' });
        try {
            // Intentar buscar datos de la parcela
            const response = await fetch(`${API_BASE_URL}/catastro/buscar-rc`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ referencia_catastral: formData.rc })
            });
            const data = await response.json();

            if (data.encontrado) {
                // Capitalize and clean municipality name
                let muniName = "Personalizado";
                if (data.municipio) {
                    muniName = data.municipio.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                    // Add to dropdown if it doesn't exist
                    setMunicipios(prev => prev.includes(muniName) ? prev : [...prev, muniName]);
                }

                setFormData(prev => ({
                    ...prev,
                    municipio: muniName,
                    clase: data.uso?.toLowerCase().includes("rústico") ? "rustico" : "urbano",
                    sup_parcela: data.superficie_parcela || prev.sup_parcela,
                    ha: data.uso?.toLowerCase().includes("rústico") ? (data.superficie_parcela / 10000 || prev.ha) : prev.ha,
                    anio_const: data.anio_const || prev.anio_const,
                    uso_const: data.uso?.toLowerCase().includes("industrial") ? "industrial" : "vivienda",
                    sup_const: data.superficie_construida || prev.sup_const,
                    zona_valor: data.zona_valor || prev.zona_valor,
                    valor_rep: data.valor_rep || prev.valor_rep,
                    edif_real: data.superficie_construida || prev.edif_real,
                    edif_max: prev.edif_max === 0 ? data.superficie_construida : prev.edif_max // Como inicializacion razonable
                }));
                setSearchStatus({ type: 'success', message: `¡Parcela Localizada! Ubicada en ${data.direccion}. Datos técnicos auto-completados.` });
                toast({
                    title: "Inmueble encontrado y cargado",
                    description: `Ubicada en ${data.direccion}. Se han auto-completado los datos técnicos.`,
                });
            } else {
                setSearchStatus({ type: 'error', message: `Parcela NO Localizada: ${data.error || "No encontrada."}` });
                toast({
                    variant: "destructive",
                    title: "No encontrado",
                    description: data.error || "No se encontró la parcela en el Catastro.",
                });
            }
        } catch (error) {
            setSearchStatus({ type: 'error', message: 'Error de red al intentar conectar con el Catastro.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-body">
            <Navbar />

            <div className="container mx-auto py-12 px-4">
                <div className="max-w-5xl mx-auto space-y-8">

                    <ToolHeader
                        title="Calculadora de Valor Catastral Online"
                        description="Descubre al instante una estimación del valor de tu piso, casa o local comercial basándote en las normativas oficiales del Catastro. Rápido, gratis y sin registros."
                        Icon={Calculator}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Formulario */}
                        <div className="lg:col-span-12 max-w-3xl mx-auto w-full">
                            <Card className="shadow-2xl border-0 overflow-hidden rounded-2xl">
                                <CardHeader className="bg-slate-900 text-white p-8 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <CardTitle className="text-2xl font-bold tracking-tight">Calculadora de Valor Catastral</CardTitle>
                                        <CardDescription className="text-slate-400 font-medium">Estimación aproximada (Urbana / Rústica)</CardDescription>
                                        <Badge variant="outline" className="mt-4 border-accent text-accent bg-accent/10 px-3 py-1 text-xs">
                                            {mockPonencias[formData.municipio] ? `${formData.municipio} (Ponencia ${mockPonencias[formData.municipio]})` : "Municipio Personalizado / Sin Datos"}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8 bg-white">

                                    {/* Búsqueda RC (Destacada) */}
                                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-3">
                                        <Label htmlFor="rc" className="text-slate-700 font-semibold flex items-center gap-2 text-base">
                                            <Search className="h-5 w-5 text-primary" />
                                            Buscar Inmueble por Referencia Catastral
                                        </Label>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <Input
                                                id="rc"
                                                name="rc"
                                                placeholder="Ej: 8409103VH0180N0001HY"
                                                value={formData.rc}
                                                onChange={e => setFormData(prev => ({ ...prev, rc: e.target.value.toUpperCase() }))}
                                                className="font-mono text-lg h-12 shadow-sm border-slate-300 focus-visible:ring-primary"
                                            />
                                            <Button onClick={buscarRC} disabled={loading} size="lg" className="h-12 px-8 bg-slate-800 hover:bg-slate-700 text-white shadow-md">
                                                {loading ? "Buscando..." : "Autocompletar"}
                                            </Button>
                                        </div>
                                        <p className="text-xs text-slate-500 ml-1">Para mayor precisión, utiliza siempre el buscador Catastral.</p>
                                        {searchStatus.type && (
                                            <div className={`mt-3 p-3 rounded-md text-sm font-medium border animate-in slide-in-from-top-2 ${searchStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                searchStatus.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-blue-50 text-blue-700 border-blue-200'
                                                }`}>
                                                <div className="flex items-center gap-2">
                                                    {searchStatus.type === 'success' && <Info className="h-4 w-4 text-emerald-600" />}
                                                    {searchStatus.type === 'info' && <Search className="h-4 w-4 text-blue-600 animate-pulse" />}
                                                    {searchStatus.message}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <Separator className="bg-slate-100" />

                                    {/* DATOS PRINCIPALES (Obligatorios y Simples) */}
                                    <div className="space-y-6">
                                        <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                            <Building2 className="h-5 w-5 text-primary" />
                                            Datos Principales
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <Label className="text-slate-600 font-medium">Uso Principal</Label>
                                                <Select value={formData.uso_const} onValueChange={(v: string) => handleSelectChange("uso_const", v)}>
                                                    <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="vivienda">Piso / Vivienda en Bloque</SelectItem>
                                                        <SelectItem value="vivienda">Casa Adosada</SelectItem>
                                                        <SelectItem value="vivienda">Chalet Aislado</SelectItem>
                                                        <SelectItem value="industrial">Nave Industrial / Almacén</SelectItem>
                                                        <SelectItem value="oficinas">Oficina</SelectItem>
                                                        <SelectItem value="comercial">Local Comercial</SelectItem>
                                                        <SelectItem value="deportes">Deportes</SelectItem>
                                                        <SelectItem value="hosteleria">Ocio y Hostelería</SelectItem>
                                                        <SelectItem value="turismo">Turismo / Hoteles</SelectItem>
                                                        <SelectItem value="sanidad">Sanidad y Beneficencia</SelectItem>
                                                        <SelectItem value="espectaculos">Espectáculos</SelectItem>
                                                        <SelectItem value="cultural">Cultural y Religioso</SelectItem>
                                                        <SelectItem value="singular">Edificios Singulares</SelectItem>
                                                        <SelectItem value="garajes">Garaje / Trastero</SelectItem>
                                                        <SelectItem value="agricola">Agrícola y Ganadero</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-slate-600 font-medium">Calidad Constructiva</Label>
                                                <Select value={formData.categoria.toString()} onValueChange={(v: string) => handleSelectChange("categoria", v)}>
                                                    <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="2">Categoría 2 (Max. Lujo)</SelectItem>
                                                        <SelectItem value="3">Categoría 3 (Alta / Lujo)</SelectItem>
                                                        <SelectItem value="4">Categoría 4 (Media)</SelectItem>
                                                        <SelectItem value="5">Categoría 5 (Sencilla - Común)</SelectItem>
                                                        <SelectItem value="6">Categoría 6 (Económica)</SelectItem>
                                                        <SelectItem value="7">Categoría 7 (Baja)</SelectItem>
                                                        <SelectItem value="8">Categoría 8 (Ínfima)</SelectItem>
                                                        <SelectItem value="9">Categoría 9 (Ruina)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-slate-600 font-medium">Superficie Construida (m²)</Label>
                                                <Input type="number" name="sup_const" value={formData.sup_const} onChange={handleInputChange} className="h-11 bg-slate-50 border-slate-200 text-lg font-medium" />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-slate-600 font-medium">Año de Construcción</Label>
                                                <Input type="number" name="anio_const" value={formData.anio_const} onChange={handleInputChange} className="h-11 bg-slate-50 border-slate-200 text-lg font-medium" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* OPCIONES AVANZADAS (Ocultas por defecto) */}
                                    <Accordion type="single" collapsible className="w-full border rounded-lg bg-slate-50 px-4">
                                        <AccordionItem value="advanced" className="border-none">
                                            <AccordionTrigger className="text-sm font-medium text-slate-500 hover:text-primary py-4 hover:no-underline">
                                                <div className="flex items-center gap-2">
                                                    <Landmark className="h-4 w-4" />
                                                    Ver Parámetros Avanzados y de Suelo
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pb-4 pt-2 border-t space-y-6">

                                                {/* Municipio y Clase */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">

                                                        <Label>Municipio</Label>
                                                        <Select value={formData.municipio} onValueChange={(v: string) => handleSelectChange("municipio", v)}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecciona municipio" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {municipios.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label>Clase de Inmueble</Label>
                                                        <Select value={formData.clase} onValueChange={(v: string) => handleSelectChange("clase", v)}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Urbano / Rústico" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="urbano">Urbano</SelectItem>
                                                                <SelectItem value="rustico">Rústico</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {/* CT/GB — visible siempre, pre-cargado del municipio */}
                                                    <div className="space-y-2 lg:col-span-2">
                                                        <Label className="flex items-center gap-1">
                                                            Coef. CT / G+B
                                                            <span className="text-[10px] text-slate-400 font-normal ml-1">(opcional — de la Ponencia)</span>
                                                        </Label>
                                                        <Input
                                                            type="number"
                                                            name="custom_gb"
                                                            step="0.01"
                                                            value={formData.custom_gb}
                                                            onChange={handleInputChange}
                                                            className="h-10 bg-slate-50 border-slate-200"
                                                            placeholder="Ej: 1.30"
                                                        />
                                                        <p className="text-[10px] text-slate-400">
                                                            {mockGB[formData.municipio]
                                                                ? `✓ Verificado ${formData.municipio}: ${mockGB[formData.municipio]}`
                                                                : "Déjalo en 1.00 si no lo conoces"}
                                                        </p>
                                                    </div>

                                                    {/* CONFIGURACIÓN EXPERTA (Solo si es Personalizado) */}
                                                    {formData.municipio === "Personalizado" && (
                                                        <div className="lg:col-span-3 p-4 bg-accent/5 border border-accent/20 rounded-xl space-y-4 animate-in fade-in duration-300">
                                                            <h4 className="font-bold text-primary flex items-center gap-2 text-sm uppercase">
                                                                <Landmark className="h-4 w-4" />
                                                                Parámetros Técnicos de la Ponencia
                                                            </h4>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                                                                <div className="space-y-1">
                                                                    <Label className="text-[10px]">MBC (€/m²)</Label>
                                                                    <Input type="number" name="custom_mbc" value={formData.custom_mbc} onChange={handleInputChange} className="h-8 text-xs" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[10px]">MBR Urbano</Label>
                                                                    <Input type="number" name="custom_mbr" value={formData.custom_mbr} onChange={handleInputChange} className="h-8 text-xs" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[10px]">MBR Rústico</Label>
                                                                    <Input type="number" name="custom_mbr_rustico" value={formData.custom_mbr_rustico} onChange={handleInputChange} className="h-8 text-xs" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[10px]">Coef. RM</Label>
                                                                    <Input type="number" name="custom_rm" step="0.1" value={formData.custom_rm} onChange={handleInputChange} className="h-8 text-xs" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[10px]">Coef. G+B</Label>
                                                                    <Input type="number" name="custom_gb" step="0.1" value={formData.custom_gb} onChange={handleInputChange} className="h-8 text-xs" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[10px]">Tipo Urbano</Label>
                                                                    <Input type="number" name="custom_tipo_urbano" step="0.001" value={formData.custom_tipo_urbano} onChange={handleInputChange} className="h-8 text-xs" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[10px]">Tipo Rústico</Label>
                                                                    <Input type="number" name="custom_tipo_rustico" step="0.001" value={formData.custom_tipo_rustico} onChange={handleInputChange} className="h-8 text-xs" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[10px]">Año Ponencia</Label>
                                                                    <Input type="number" name="custom_anio_ponencia" value={formData.custom_anio_ponencia} onChange={handleInputChange} className="h-8 text-xs" />
                                                                </div>
                                                            </div>
                                                            <p className="text-[9px] text-slate-500 italic">Nota: Los módulos MBC (Construcción) y MBR (Repercusión Suelo) se obtienen de la Ponencia de Valores. G+B suele ser 1.00 hasta revisar la ponencia exacta.</p>
                                                        </div>
                                                    )}

                                                    {/* URBANO */}
                                                    {formData.clase === "urbano" && (
                                                        <>
                                                            <div className="space-y-2">
                                                                <Label>Superficie de Parcela (m²)</Label>
                                                                <Input type="number" name="sup_parcela" value={formData.sup_parcela} onChange={handleInputChange} />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Valor Repercusión Suelo (€/m²)</Label>
                                                                <Input type="number" name="valor_rep" value={formData.valor_rep} onChange={handleInputChange} />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Edificabilidad Max (m²)</Label>
                                                                <Input type="number" name="edif_max" value={formData.edif_max} onChange={handleInputChange} />
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* RUSTICO */}
                                                    {formData.clase === "rustico" && (
                                                        <>
                                                            <div className="space-y-2">
                                                                <Label>Superficie (ha)</Label>
                                                                <Input type="number" name="ha" value={formData.ha} onChange={handleInputChange} />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Tipo Evaluatorio (€/ha)</Label>
                                                                <Input type="number" name="tipo_eval" value={formData.tipo_eval} onChange={handleInputChange} />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Superficie Ocupada por Const. (m²)</Label>
                                                                <Input type="number" name="sup_ocupada" value={formData.sup_ocupada} onChange={handleInputChange} />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Uso Bajo Const.</Label>
                                                                <Select value={formData.uso_suelo_rust} onValueChange={(v: string) => handleSelectChange("uso_suelo_rust", v)}>
                                                                    <SelectTrigger>
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="residencial">Residencial</SelectItem>
                                                                        <SelectItem value="agricola">Agrícola</SelectItem>
                                                                        <SelectItem value="industrial">Industrial</SelectItem>
                                                                        <SelectItem value="varios">Varios</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>

                                </CardContent>
                                <CardFooter className="bg-slate-50 p-8 border-t border-slate-100 flex flex-col items-center">
                                    <Button size="lg" className="w-full max-w-sm h-14 text-lg font-bold bg-primary hover:bg-slate-800 text-white shadow-xl transition-all hover:scale-105" onClick={calculate} disabled={loading}>
                                        {loading ? "Calculando..." : "Calcular Valor Ahora"}

                                        <CalculatorIcon className="ml-2 h-5 w-5" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>

                        {/* Resultados - Si existen */}
                        {result && (
                            <div className="lg:col-span-12 animate-in fade-in slide-in-from-bottom duration-500 space-y-6">
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="text-xl font-bold text-primary mb-3">📄 Resumen de Datos Analizados</h3>
                                    <p className="text-slate-600">
                                        Se ha calculado el valor para una <strong>Superficie de {formData.sup_const} m²</strong>, con un uso <strong>{formData.uso_const === 'vivienda' ? 'Residencial' : 'Industrial'}</strong> y una <strong>Antigüedad estimada de {new Date().getFullYear() - formData.anio_const} años</strong>.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                                    <Card className="border-accent/30 bg-accent/5">
                                        <CardHeader className="p-4 pb-0">
                                            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Valor del Suelo (Vs)</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-2">
                                            <p className="text-2xl font-bold text-primary">
                                                {Number(result.suelo_urbano || result.suelo_rustico_no_ocupado + result.suelo_rustico_ocupado).toLocaleString("es-ES")} €
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-accent/30 bg-accent/5">
                                        <CardHeader className="p-4 pb-0">
                                            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Valor de Construcción (Vc)</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-2">
                                            <p className="text-2xl font-bold text-primary">{Number(result.construccion).toLocaleString("es-ES")} €</p>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-primary text-white border-none shadow-xl scale-105 z-10 hover:scale-110 transition-transform duration-300 md:col-span-2 lg:col-span-1">
                                        <CardHeader className="p-4 pb-0">
                                            <CardTitle className="text-sm font-medium text-slate-200 uppercase">Valor Catastral Total (Vcat)</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-2">
                                            <p className="text-3xl font-bold text-accent">{Number(result.valor_catastral_total).toLocaleString("es-ES")} €</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                                    <Card className="border-accent/30 bg-accent/5">
                                        <CardHeader className="p-4 pb-0">
                                            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Cuota Anual IBI</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-2">
                                            <p className="text-2xl font-bold text-primary">{Number(result.cuota_ibi_anual).toLocaleString("es-ES")} €</p>
                                            <p className="text-xs text-slate-400">Tipo: {(result.tipo_aplicado * 100).toFixed(3)}%</p>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="mt-8 bg-slate-50 border border-slate-200 p-6 rounded-lg flex gap-4 items-start">
                                    <Info className="h-6 w-6 text-slate-400 shrink-0 mt-1" />
                                    <div className="space-y-1">
                                        <p className="text-slate-600 text-sm">
                                            <strong>⚠️ Aviso:</strong> Este cálculo es una estimación matemática automatizada basada en parámetros medios y normativas generales (RD 1020/1993). No tiene validez legal ni sustituye a la Certificación Oficial emitida por la Dirección General del Catastro.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-end border-t pt-6 border-slate-200">
                                    <Button onClick={handleExportPDF} variant="outline" className="flex items-center gap-2 border-primary text-primary hover:bg-primary/5">
                                        <FileText className="h-4 w-4" />
                                        Exportar Informe (PDF)
                                    </Button>
                                    <Button onClick={handleExportWord} variant="outline" className="flex items-center gap-2 border-blue-600 text-blue-600 hover:bg-blue-50">
                                        <FileDown className="h-4 w-4" />
                                        Exportar Informe (Word)
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* LEAD MAGNET - Subsanación de Discrepancias */}
                        <LeadMagnet />

                    </div>

                    {/* Información Adicional */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
                        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
                            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                <MapIcon className="h-6 w-6 text-primary" />
                            </div>
                            <h4 className="font-bold text-lg mb-2">Zonificación Automática</h4>
                            <p className="text-slate-500 text-sm">Detectamos el Polígono de Valoración y aplicamos los módulos de repercusión de suelo de forma automática.</p>
                        </div>
                        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
                            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                <Landmark className="h-6 w-6 text-primary" />
                            </div>
                            <h4 className="font-bold text-lg mb-2">IBI Actualizado</h4>
                            <p className="text-slate-500 text-sm">Cálculo basado en las cuotas y tipos impositivos municipales vigentes para el presente ejercicio fiscal.</p>
                        </div>
                        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
                            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                <Calculator className="h-6 w-6 text-primary" />
                            </div>
                            <h4 className="font-bold text-lg mb-2">Garantía Técnica</h4>
                            <p className="text-slate-500 text-sm">Cumplimos estrictamente con la normativa de valoración catastral (RD 1020/1993) y las ponencias locales.</p>
                        </div>
                    </div>
                    {/* CROSS-SELLING / ENLACES TÉCNICOS */}
                    <CrossSelling currentTool="calculadora" />

                </div>
            </div >

            <Footer />
        </div >
    );
}
