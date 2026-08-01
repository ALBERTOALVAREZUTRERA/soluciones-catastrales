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
import { queryCatastro } from "@/lib/backend-api";
import {
    isValidCadastralReference,
    normalizeCadastralReference,
} from "@/lib/catastro-reference";
import type { ReportData } from "@/lib/valuation-report";
import { UrbanCalculator } from "@/components/tools/urban-calculator";
import { Toaster } from "@/components/ui/toaster";

const ANDUJAR_VALUATION_PROFILE = {
    mbc: 550,
    mbr: 450,
    mbrRustico: 37.8,
    rm: 0.5,
    gb: 1.3,
    tipoUrbano: 0.00593,
    tipoRustico: 0.01068,
    anioPonencia: 2010,
} as const;

function getDocumentedUrbanProfile(municipio: string) {
    const normalized = municipio.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return normalized.startsWith("andujar") ? ANDUJAR_VALUATION_PROFILE : null;
}

export default function CalculadoraPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [municipios, setMunicipios] = useState(["Andújar (Jaén)"]);
    const [result, setResult] = useState<any>(null);
    const [searchStatus, setSearchStatus] = useState<{ type: 'success' | 'error' | 'info' | null, message: string }>({ type: null, message: "" });
    const [advancedOpen, setAdvancedOpen] = useState(false);

    const [formData, setFormData] = useState({
        municipio: "Andújar (Jaén)",
        clase: "urbano",
        rc: "",
        sup_parcela: 0,
        edif_max: 0,
        edif_real: 0,
        valor_rep: 0,
        zona_valor: "",
        uso_const: "AAP",
        categoria: 5,
        sup_const: 0,
        anio_const: 2000,
        estado: "N",
        ha: 0,
        tipo_eval: 0,
        uso_suelo_rust: "residencial",
        sup_ocupada: 0,
        // Parámetros expertos (Ponencia)
        custom_mbc: 550,
        custom_mbr: 200,
        custom_mbr_rustico: 37.8,
        custom_rm: 0.50,
        custom_gb: 1.30,
        custom_tipo_urbano: 0.006,
        custom_tipo_rustico: 0.010,
        custom_anio_ponencia: 2010,
        parameters_confirmed: false,
    });

    // Leer Referencia Catastral de la URL si venimos del Visor Catastral
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const rcParam = params.get('rc');
        if (rcParam) {
            setFormData(prev => ({ ...prev, rc: rcParam }));
        }
    }, []);

    // No se reutilizan parámetros de un municipio para otro. Solo existe un
    // perfil documentado; el resto exige introducir y confirmar la ponencia.
    useEffect(() => {
        const profile = getDocumentedUrbanProfile(formData.municipio);
        setFormData(prev => ({
            ...prev,
            custom_mbc: profile?.mbc ?? 0,
            custom_mbr: profile?.mbr ?? 0,
            custom_mbr_rustico: profile?.mbrRustico ?? 0,
            custom_rm: profile?.rm ?? 0,
            custom_gb: profile?.gb ?? 0,
            custom_tipo_urbano: profile?.tipoUrbano ?? 0,
            custom_tipo_rustico: profile?.tipoRustico ?? 0,
            custom_anio_ponencia: profile?.anioPonencia ?? 0,
            parameters_confirmed: false,
        }));
    }, [formData.municipio]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // Allow empty string to clear the field
        if (value === '') {
            setFormData(prev => ({ ...prev, [name]: '' }));
            return;
        }

        // Allow entering decimals (e.g. "1.")
        if (value.endsWith('.') || value.endsWith(',')) {
            setFormData(prev => ({ ...prev, [name]: value.replace(',', '.') }));
            return;
        }

        // Prevent leading zeros unless it's a decimal "0."
        let cleanedValue = value;
        if (cleanedValue.length > 1 && cleanedValue.startsWith('0') && !cleanedValue.startsWith('0.')) {
            // Strip leading zeros
            cleanedValue = cleanedValue.replace(/^0+/, '');
            // If it became empty, make it "0"
            if (cleanedValue === '') cleanedValue = '0';
        }

        // Try to parse to number if possible
        const parsed = Number(cleanedValue);
        setFormData(prev => ({ ...prev, [name]: isNaN(parsed) ? cleanedValue : parsed }));
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

    const handleExportPDF = async () => {
        const data = getReportData();
        if (!data) return;

        try {
            const { generatePDFReport } = await import("@/lib/report-generator");
            generatePDFReport(data);
        } catch {
            toast({
                variant: "destructive",
                title: "Error de Exportación",
                description: "No se pudo generar el documento PDF.",
            });
        }
    };

    const handleExportWord = async () => {
        const data = getReportData();
        if (data) {
            try {
                const { generateWordReport } = await import("@/lib/word-report-generator");
                await generateWordReport(data);
            } catch {
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
        // We now rely on client side calculation
        setLoading(false);
    };

    const buscarRC = async () => {
        const reference = normalizeCadastralReference(formData.rc);
        if (!isValidCadastralReference(reference)) {
            setSearchStatus({ type: 'error', message: 'La referencia debe tener 14, 18 o 20 caracteres alfanuméricos.' });
            toast({
                variant: "destructive",
                title: "Referencia no válida",
                description: "Introduce una referencia catastral de 14, 18 o 20 caracteres.",
            });
            return;
        }

        setLoading(true);
        setSearchStatus({ type: 'info', message: 'Conectando con el Catastro... Buscando parcela.' });
        try {
            // Intentar buscar datos de la parcela
            const data = await queryCatastro<any>("/catastro/buscar-rc", {
                referencia_catastral: reference,
            });

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
                    // Para pisos en bloque valorados por repercusión (VRC):
                    // Si sup_parcela es 0 (divisiones horizontales) o muy grande (>1.5× sup_const), usar sup_const
                    sup_parcela: (!data.superficie_parcela || data.superficie_parcela > (data.superficie_construida * 1.5))
                        ? (data.superficie_construida || prev.sup_parcela)
                        : (data.superficie_parcela || prev.sup_parcela),
                    ha: data.uso?.toLowerCase().includes("rústico") ? (data.superficie_parcela / 10000 || prev.ha) : prev.ha,
                    anio_const: data.anio_const || prev.anio_const,
                    uso_const: data.uso?.toLowerCase().includes("industrial") ? "IAL" : "AAP",
                    sup_const: data.superficie_construida || prev.sup_const,
                    zona_valor: data.zona_valor || prev.zona_valor,
                    valor_rep: data.valor_rep || prev.valor_rep,
                    edif_real: data.superficie_construida || prev.edif_real,
                    edif_max: data.superficie_construida || prev.edif_max
                }));
                const selectionMessage = data.seleccion_aproximada
                    ? ` La referencia de finca agrupa ${data.num_inmuebles} inmuebles; introduce la referencia completa de 20 caracteres para cargar datos constructivos.`
                    : "";
                const vrcMsg = data.valor_rep > 0 && data.zona_info
                    ? ` Valor repercusión auto-detectado: ${data.zona_info}.`
                    : " Valor de repercusión de suelo no detectado automáticamente — introdúcelo manualmente.";
                setSearchStatus({ type: 'success', message: `¡Parcela localizada! ${data.direccion}.${selectionMessage}${vrcMsg}` });
                toast({
                    title: data.seleccion_aproximada
                        ? "Finca con varios inmuebles"
                        : data.valor_rep > 0
                            ? "✅ Inmueble encontrado — Zona detectada"
                            : "Inmueble encontrado",
                    description: data.seleccion_aproximada
                        ? `Introduce la referencia completa. Catastro devuelve ${data.num_inmuebles} inmuebles para esta finca.`
                        : data.valor_rep > 0
                        ? `${data.direccion} | ${data.zona_info}`
                        : `${data.direccion}. Introduce el valor de repercusión de suelo manualmente.`,
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
        <main id="contenido-principal" tabIndex={-1} className="min-h-screen bg-slate-50 font-body">
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
                                            {getDocumentedUrbanProfile(formData.municipio)
                                                ? `${formData.municipio} · perfil de referencia documentado`
                                                : "Sin perfil municipal · introduce la ponencia aplicable"}
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

                                    {/* URBANO / RUSTICO SWITCH */}
                                    {formData.clase === "urbano" ? (
                                        <UrbanCalculator
                                            formData={formData}
                                            setFormData={setFormData}
                                            onCalculate={setResult}
                                            loading={loading}
                                        />
                                    ) : (
                                        // A draft placeholder for rustic which already has its standalone page (/herramientas/calculadora-rustica)
                                        // or could be migrated here too. For now we just tell them to use the other page.
                                        <div className="p-8 text-center bg-green-50 rounded-lg border border-green-200">
                                            <h3 className="text-green-800 font-bold text-lg mb-2">Calculadora Rústica Integrada</h3>
                                            <p className="text-green-700 mb-4">La calculadora rústica ha sido optimizada en su propia página especializada.</p>
                                            <Button className="bg-green-600 hover:bg-green-700 text-white" asChild>
                                                <Link href="/herramientas/calculadora-rustica">Ir a Calculadora Rústica</Link>
                                            </Button>
                                        </div>
                                    )}

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

                                                        <Label htmlFor="valuation-municipality">Municipio</Label>
                                                        <Select value={formData.municipio} onValueChange={(v: string) => handleSelectChange("municipio", v)}>
                                                            <SelectTrigger id="valuation-municipality">
                                                                <SelectValue placeholder="Selecciona municipio" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {municipios.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="valuation-property-class">Clase de Inmueble</Label>
                                                        <Select value={formData.clase} onValueChange={(v: string) => handleSelectChange("clase", v)}>
                                                            <SelectTrigger id="valuation-property-class">
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
                                                        <Label htmlFor="valuation-gb" className="flex items-center gap-1">
                                                            Coef. CT / G+B
                                                            <span className="text-[10px] text-slate-400 font-normal ml-1">(obligatorio — de la Ponencia)</span>
                                                        </Label>
                                                        <Input
                                                            id="valuation-gb"
                                                            type="number"
                                                            name="custom_gb"
                                                            step="0.01"
                                                            value={formData.custom_gb}
                                                            onChange={handleInputChange}
                                                            className="h-10 bg-slate-50 border-slate-200"
                                                            placeholder="Ej: 1.30"
                                                        />
                                                        <p className="text-[10px] text-slate-400">
                                                            {getDocumentedUrbanProfile(formData.municipio)
                                                                ? `Perfil de referencia: ${getDocumentedUrbanProfile(formData.municipio)?.gb}. Debes contrastarlo.`
                                                                : "Sin valor municipal precargado: introdúcelo desde la ponencia."}
                                                        </p>
                                                    </div>

                                                    {/* CONFIGURACIÓN EXPERTA (Solo si es Personalizado) */}
                                                    {!getDocumentedUrbanProfile(formData.municipio) && (
                                                        <div className="lg:col-span-3 p-4 bg-accent/5 border border-accent/20 rounded-xl space-y-4 animate-in fade-in duration-300">
                                                            <h4 className="font-bold text-primary flex items-center gap-2 text-sm uppercase">
                                                                <Landmark className="h-4 w-4" />
                                                                Parámetros Técnicos de la Ponencia
                                                            </h4>
                                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                                                                <div className="space-y-1">
                                                                    <Label htmlFor="valuation-mbc" className="text-[10px]">MBC (€/m²)</Label>
                                                                    <Input id="valuation-mbc" type="number" name="custom_mbc" value={formData.custom_mbc} onChange={handleInputChange} className="h-8 text-xs" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label htmlFor="valuation-mbr-urban" className="text-[10px]">MBR Urbano</Label>
                                                                    <Input id="valuation-mbr-urban" type="number" name="custom_mbr" value={formData.custom_mbr} onChange={handleInputChange} className="h-8 text-xs" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label htmlFor="valuation-mbr-rustic" className="text-[10px]">MBR Rústico</Label>
                                                                    <Input id="valuation-mbr-rustic" type="number" name="custom_mbr_rustico" value={formData.custom_mbr_rustico} onChange={handleInputChange} className="h-8 text-xs" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label htmlFor="valuation-rm" className="text-[10px]">Coef. RM</Label>
                                                                    <Input id="valuation-rm" type="number" name="custom_rm" step="0.1" value={formData.custom_rm} onChange={handleInputChange} className="h-8 text-xs" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label htmlFor="valuation-gb-custom" className="text-[10px]">Coef. G+B</Label>
                                                                    <Input id="valuation-gb-custom" type="number" name="custom_gb" step="0.1" value={formData.custom_gb} onChange={handleInputChange} className="h-8 text-xs" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label htmlFor="valuation-tax-urban" className="text-[10px]">Tipo Urbano</Label>
                                                                    <Input id="valuation-tax-urban" type="number" name="custom_tipo_urbano" step="0.001" value={formData.custom_tipo_urbano} onChange={handleInputChange} className="h-8 text-xs" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label htmlFor="valuation-tax-rustic" className="text-[10px]">Tipo Rústico</Label>
                                                                    <Input id="valuation-tax-rustic" type="number" name="custom_tipo_rustico" step="0.001" value={formData.custom_tipo_rustico} onChange={handleInputChange} className="h-8 text-xs" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label htmlFor="valuation-assessment-year" className="text-[10px]">Año Ponencia</Label>
                                                                    <Input id="valuation-assessment-year" type="number" name="custom_anio_ponencia" value={formData.custom_anio_ponencia} onChange={handleInputChange} className="h-8 text-xs" />
                                                                </div>
                                                            </div>
                                                            <p className="text-[9px] text-slate-500 italic">Los módulos MBC/MBR, RM, G+B, el año de ponencia y el tipo de IBI deben copiarse de la ponencia o recibo aplicable. La búsqueda catastral no acredita esos parámetros.</p>
                                                        </div>
                                                    )}

                                                    {/* URBANO */}
                                                    {formData.clase === "urbano" && (
                                                        <>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="valuation-land-area">Superficie de Parcela (m²)</Label>
                                                                <Input id="valuation-land-area" type="number" name="sup_parcela" value={formData.sup_parcela} onChange={handleInputChange} />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="valuation-land-value">Valor Repercusión Suelo (€/m²)</Label>
                                                                <Input id="valuation-land-value" type="number" name="valor_rep" value={formData.valor_rep} onChange={handleInputChange} />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="valuation-max-buildability">Edificabilidad Max (m²)</Label>
                                                                <Input id="valuation-max-buildability" type="number" name="edif_max" value={formData.edif_max} onChange={handleInputChange} />
                                                            </div>
                                                        </>
                                                    )}

                                                    {/* RUSTICO */}
                                                    {formData.clase === "rustico" && (
                                                        <>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="valuation-rustic-area">Superficie (ha)</Label>
                                                                <Input id="valuation-rustic-area" type="number" name="ha" value={formData.ha} onChange={handleInputChange} />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="valuation-assessment-rate">Tipo Evaluatorio (€/ha)</Label>
                                                                <Input id="valuation-assessment-rate" type="number" name="tipo_eval" value={formData.tipo_eval} onChange={handleInputChange} />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="valuation-occupied-area">Superficie Ocupada por Const. (m²)</Label>
                                                                <Input id="valuation-occupied-area" type="number" name="sup_ocupada" value={formData.sup_ocupada} onChange={handleInputChange} />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label htmlFor="valuation-rustic-use">Uso Bajo Const.</Label>
                                                                <Select value={formData.uso_suelo_rust} onValueChange={(v: string) => handleSelectChange("uso_suelo_rust", v)}>
                                                                    <SelectTrigger id="valuation-rustic-use">
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
                                {/* Footer se quita pues Calculate se llama desde el hijo UrbanCalculator */}
                            </Card>
                        </div>

                        {/* Resultados - Si existen */}
                        {result && (
                            <div className="lg:col-span-12 animate-in fade-in slide-in-from-bottom duration-500 space-y-6">
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                    <h3 className="text-xl font-bold text-primary mb-3">📄 Resumen de Datos Analizados</h3>
                                    <p className="text-slate-600">
                                        Se ha calculado el valor para una <strong>superficie de {formData.sup_const} m²</strong>, con la tipología <strong>{result.detalles?.construccion?.tipologia ?? formData.uso_const}</strong> y una <strong>antigüedad de valoración de {result.detalles?.construccion?.age ?? 0} años</strong>.
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
                            <h4 className="font-bold text-lg mb-2">Datos de parcela</h4>
                            <p className="text-slate-500 text-sm">El buscador intenta recuperar datos descriptivos y, cuando el servicio los facilita, una referencia de zona. Los parámetros no detectados quedan para revisión manual.</p>
                        </div>
                        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
                            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                <Landmark className="h-6 w-6 text-primary" />
                            </div>
                            <h4 className="font-bold text-lg mb-2">IBI configurable</h4>
                            <p className="text-slate-500 text-sm">La cuota se calcula con el tipo introducido. Debes contrastarlo con la ordenanza fiscal municipal del ejercicio correspondiente.</p>
                        </div>
                        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
                            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                                <Calculator className="h-6 w-6 text-primary" />
                            </div>
                            <h4 className="font-bold text-lg mb-2">Garantía Técnica</h4>
                            <p className="text-slate-500 text-sm">La estimación aplica criterios del RD 1020/1993 con los parámetros que introduzcas; confirma los módulos y coeficientes en la ponencia de valores aplicable.</p>
                        </div>
                    </div>
                    {/* CROSS-SELLING / ENLACES TÉCNICOS */}
                    <CrossSelling currentTool="calculadora" />
                </div>
            </div>

            <Footer />
            <Toaster />
        </main>
    );
}
