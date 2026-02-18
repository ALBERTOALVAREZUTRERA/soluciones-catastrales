"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Calculator, Search, Home, Building2, Map as MapIcon, Landmark, Info, ChevronRight, CalculatorIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { API_BASE_URL } from "@/lib/backend-api";

export default function CalculadoraPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [municipios, setMunicipios] = useState(["Andújar", "Fuencaliente", "Personalizado"]);
    const [result, setResult] = useState<any>(null);

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
        categoria: 3,
        sup_const: 0,
        anio_const: 2000,
        estado: "normal",
        ha: 0,
        tipo_eval: 0,
        uso_suelo_rust: "residencial",
        sup_ocupada: 0,
        // Parámetros expertos (Ponencia)
        custom_mbc: 550,
        custom_mbr: 450,
        custom_rm: 0.50,
        custom_tipo_urbano: 0.006,
        custom_tipo_rustico: 0.010,
        custom_anio_ponencia: 2010
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: isNaN(Number(value)) ? value : Number(value) }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
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
            toast({
                variant: "destructive",
                title: "Referencia incompleta",
                description: "Introduce al menos 14 caracteres de la RC.",
            });
            return;
        }

        setLoading(true);
        try {
            // Intentar buscar datos de la parcela
            const response = await fetch(`${API_BASE_URL}/catastro/buscar-rc`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ referencia_catastral: formData.rc })
            });
            const data = await response.json();

            if (data.encontrado) {
                setFormData(prev => ({
                    ...prev,
                    municipio: data.municipio || prev.municipio,
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
                toast({
                    title: "Inmueble encontrado y cargado",
                    description: `Ubicada en ${data.direccion}. Se han auto-completado los datos técnicos.`,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "No encontrado",
                    description: data.error || "No se encontró la parcela en el Catastro.",
                });
            }
        } catch (error) {
            // Fallback or error
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-body">
            <Navbar />

            <div className="container mx-auto py-12 px-4">
                <div className="max-w-5xl mx-auto space-y-8">

                    <div className="text-center space-y-2">
                        <h1 className="text-4xl font-bold text-primary font-headline flex items-center justify-center gap-3">
                            <Calculator className="h-10 w-10 text-accent" />
                            Valor Catastral e Impacto en IBI
                        </h1>
                        <p className="text-slate-600 max-w-2xl mx-auto">
                            Herramienta técnica para el análisis del Valor Catastral y su repercusión directa en la cuota tributaria (IBI).
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* Formulario */}
                        <div className="lg:col-span-12">
                            <Card className="shadow-lg border-primary/10 overflow-hidden">
                                <CardHeader className="bg-primary text-white">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <CardTitle className="text-xl">Configuración del Inmueble</CardTitle>
                                            <CardDescription className="text-slate-300">Completa los datos para obtener el cálculo exacto</CardDescription>
                                        </div>
                                        <Badge variant="outline" className="border-accent text-accent animate-pulse hover:animate-none hover:bg-accent hover:text-white transition-colors">
                                            {formData.municipio === "Personalizado" ? "Parámetros Manuales" : `${formData.municipio} Ponencia ${formData.municipio === "Andújar" ? "2010" : "1990"}`}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                                        {/* Búsqueda RC */}
                                        <div className="space-y-2 lg:col-span-3 pb-4 border-b">
                                            <Label htmlFor="rc" className="text-primary font-bold">1. Referencia Catastral (Auto-completar)</Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id="rc"
                                                    name="rc"
                                                    placeholder="Ej: 8409103VH0180N..."
                                                    value={formData.rc}
                                                    onChange={e => setFormData(prev => ({ ...prev, rc: e.target.value }))}
                                                    className="font-mono"
                                                />
                                                <Button onClick={buscarRC} disabled={loading} variant="secondary">
                                                    <Search className="h-4 w-4 mr-2" />
                                                    Buscar
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Municipio y Clase */}
                                        <div className="space-y-2">
                                            <Label>Municipio</Label>
                                            <Select value={formData.municipio} onValueChange={v => handleSelectChange("municipio", v)}>
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
                                            <Select value={formData.clase} onValueChange={v => handleSelectChange("clase", v)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Urbano / Rústico" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="urbano">Urbano</SelectItem>
                                                    <SelectItem value="rustico">Rústico</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* CONFIGURACIÓN EXPERTA (Solo si es Personalizado) */}
                                        {formData.municipio === "Personalizado" && (
                                            <div className="lg:col-span-3 p-4 bg-accent/5 border border-accent/20 rounded-xl space-y-4 animate-in fade-in duration-300">
                                                <h4 className="font-bold text-primary flex items-center gap-2 text-sm uppercase">
                                                    <Landmark className="h-4 w-4" />
                                                    Parámetros Técnicos de la Ponencia
                                                </h4>
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px]">MBC (€/m²)</Label>
                                                        <Input type="number" name="custom_mbc" value={formData.custom_mbc} onChange={handleInputChange} className="h-8 text-xs" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px]">MBR (€/m²)</Label>
                                                        <Input type="number" name="custom_mbr" value={formData.custom_mbr} onChange={handleInputChange} className="h-8 text-xs" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px]">Coef. RM</Label>
                                                        <Input type="number" name="custom_rm" step="0.1" value={formData.custom_rm} onChange={handleInputChange} className="h-8 text-xs" />
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
                                                <p className="text-[9px] text-slate-500 italic">Nota: Los módulos MBC (Construcción) y MBR (Repercusión Suelo) se obtienen de la Ponencia de Valores local.</p>
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
                                            </>
                                        )}

                                        {/* CONSTRUCCIÓN */}
                                        <div className="lg:col-span-3">
                                            <Separator className="my-4" />
                                            <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                                                <Building2 className="h-4 w-4" />
                                                Datos de la Edificación
                                            </h3>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Uso Principal</Label>
                                            <Select value={formData.uso_const} onValueChange={v => handleSelectChange("uso_const", v)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="vivienda">Residencial / Vivienda</SelectItem>
                                                    <SelectItem value="industrial">Industrial / Almacén</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Superficie Construida (m²)</Label>
                                            <Input type="number" name="sup_const" value={formData.sup_const} onChange={handleInputChange} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Categoría (1-9)</Label>
                                            <Input type="number" name="categoria" min="1" max="9" value={formData.categoria} onChange={handleInputChange} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Año de Construcción</Label>
                                            <Input type="number" name="anio_const" value={formData.anio_const} onChange={handleInputChange} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Estado de Conservación</Label>
                                            <Select value={formData.estado} onValueChange={v => handleSelectChange("estado", v)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="bueno">Bueno</SelectItem>
                                                    <SelectItem value="normal">Normal</SelectItem>
                                                    <SelectItem value="deficiente">Deficiente</SelectItem>
                                                    <SelectItem value="ruinoso">Ruinoso</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-slate-50 p-6 flex justify-end">
                                    <Button size="lg" className="bg-accent hover:bg-accent/90 text-white px-8" onClick={calculate} disabled={loading}>
                                        {loading ? "Calculando..." : "REALIZAR CÁLCULO"}
                                        <CalculatorIcon className="ml-2 h-5 w-5" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>

                        {/* Resultados - Si existen */}
                        {result && (
                            <div className="lg:col-span-12 animate-in fade-in slide-in-from-bottom duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                                    <Card className="border-accent/30 bg-accent/5">
                                        <CardHeader className="p-4 pb-0">
                                            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Suelo</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-2">
                                            <p className="text-2xl font-bold text-primary">
                                                {result.suelo_urbano || result.suelo_rustico_no_ocupado + result.suelo_rustico_ocupado} €
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-accent/30 bg-accent/5">
                                        <CardHeader className="p-4 pb-0">
                                            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Construcción</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-2">
                                            <p className="text-2xl font-bold text-primary">{result.construccion} €</p>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-primary text-white border-none shadow-xl scale-105 z-10 hover:scale-110 transition-transform duration-300">
                                        <CardHeader className="p-4 pb-0">
                                            <CardTitle className="text-sm font-medium text-slate-200 uppercase">Valor Catastral (Resultado Técnico)</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-2">
                                            <p className="text-3xl font-bold text-accent">{result.valor_catastral_total} €</p>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-accent/30 bg-accent/5">
                                        <CardHeader className="p-4 pb-0">
                                            <CardTitle className="text-sm font-medium text-slate-500 uppercase">Cuota Anual IBI</CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4 pt-2">
                                            <p className="text-2xl font-bold text-primary">{result.cuota_ibi_anual} €</p>
                                            <p className="text-xs text-slate-400">Tipo: {(result.tipo_aplicado * 100).toFixed(3)}%</p>
                                        </CardContent>
                                    </Card>

                                </div>

                                <div className="mt-8 bg-blue-50 border border-blue-100 p-6 rounded-lg flex gap-4 items-start">
                                    <Info className="h-6 w-6 text-blue-500 shrink-0 mt-1" />
                                    <div className="space-y-1">
                                        <p className="font-bold text-blue-900">Nota sobre el cálculo:</p>
                                        <p className="text-blue-800/80 text-sm">
                                            Estos valores son estimativos basados en la Ponencia de Valores vigente para {result.municipio}.
                                            Para una certificación oficial, debe solicitarse a la Sede Electrónica del Catastro o contactar con nuestra oficina.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

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

                </div>
            </div>

            <Footer />
        </div>
    );
}

