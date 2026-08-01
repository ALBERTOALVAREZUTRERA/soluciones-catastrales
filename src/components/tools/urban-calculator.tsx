"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalculatorIcon, FileText, Sparkles, ShieldCheck, Upload, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { analyzeWithBackend } from "@/lib/backend-api";
import { dbTipologiasUrbanas, coeficientesConservacionUrbana } from "@/data/cadastral-urban-data";
import { calculateUrbanValuation } from "@/lib/cadastral-valuation";

export interface UrbanCalculatorProps {
    formData: any;
    setFormData: (fn: (prev: any) => any) => void;
    onCalculate: (result: any) => void;
    loading: boolean;
}

export function UrbanCalculator({ formData, setFormData, onCalculate, loading }: UrbanCalculatorProps) {
    const [kmzLoading, setKmzLoading] = useState(false);

    const handleKmzImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setKmzLoading(true);

        try {
            const data = await analyzeWithBackend(file, "25830", "CP");
            if (data.parcelas && data.parcelas.length > 0) {
                const parcela = data.parcelas[0];
                setFormData(prev => ({
                    ...prev,
                    sup_parcela: parcela.area || prev.sup_parcela,
                    rc: parcela.referencia_catastral || prev.rc,
                    // Si es un edificio, también actualizamos sup_const
                    sup_const: parcela.capa_origen?.includes("BU") ? (parcela.area || prev.sup_const) : prev.sup_const
                }));

                toast({
                    title: "Datos importados",
                    description: `Superficie: ${parcela.area.toFixed(2)} m². ${parcela.referencia_catastral ? `RC: ${parcela.referencia_catastral}` : ""}`,
                });
            }
        } catch (error) {
            toast({
                title: "Error al importar KMZ",
                description: error instanceof Error ? error.message : "Error desconocido",
                variant: "destructive"
            });
        } finally {
            setKmzLoading(false);
            e.target.value = "";
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (value === '') {
            setFormData(prev => ({ ...prev, [name]: '' }));
            return;
        }

        if (value.endsWith('.') || value.endsWith(',')) {
            setFormData(prev => ({ ...prev, [name]: value.replace(',', '.') }));
            return;
        }

        let cleanedValue = value.replace(/^0+/, '');
        if (cleanedValue === '' || cleanedValue.startsWith('.')) cleanedValue = '0' + cleanedValue;

        const parsed = Number(cleanedValue);
        setFormData(prev => ({ ...prev, [name]: isNaN(parsed) ? cleanedValue : parsed }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const calculateUrbanValue = () => {
        const requiredParameters = [
            formData.valor_rep,
            formData.custom_gb,
            formData.custom_rm,
            formData.custom_mbc,
            formData.custom_anio_ponencia,
        ].map(Number);
        if (!formData.parameters_confirmed || requiredParameters.some(value => !Number.isFinite(value) || value <= 0)) {
            toast({
                title: "Confirma los parámetros municipales",
                description: "Introduce valores positivos para repercusión, G+B, RM, MBC y año de ponencia, y confirma que los has contrastado.",
                variant: "destructive",
            });
            return;
        }

        const tipologia = dbTipologiasUrbanas.find(t => t.id === formData.uso_const);
        const categoria = Number(formData.categoria);
        const coefU = tipologia?.categorias[categoria] ?? 1;
        const coefI = coeficientesConservacionUrbana.find(c => c.value === formData.estado)?.coef ?? 1;
        const calculation = calculateUrbanValuation({
            soilArea: formData.sup_parcela,
            constructionArea: formData.sup_const,
            repercussionValue: formData.valor_rep,
            expensesCoefficient: formData.custom_gb,
            marketCoefficient: formData.custom_rm,
            basicConstructionModule: formData.custom_mbc,
            constructionTypeCoefficient: coefU,
            conservationCoefficient: coefI,
            referenceYear: formData.custom_anio_ponencia,
            constructionYear: formData.anio_const,
            typeId: formData.uso_const,
            category: categoria,
            ibiRate: formData.custom_tipo_urbano,
        });

        if (calculation.effectiveSoilArea <= 0 && Number(formData.sup_const) <= 0) {
            toast({
                title: "Faltan superficies",
                description: "Introduce una superficie de parcela o de construcción mayor que cero.",
                variant: "destructive",
            });
            return;
        }

        onCalculate({
            suelo_urbano: calculation.soilValue,
            construccion: calculation.constructionValue,
            valor_catastral_total: calculation.totalValue,
            cuota_ibi_anual: calculation.annualIbi,
            tipo_aplicado: calculation.ibiRate,
            detalles: {
                suelo: {
                    sup: calculation.effectiveSoilArea,
                    vr: Number(formData.valor_rep),
                    coefG: Number(formData.custom_gb),
                    rm: Number(formData.custom_rm),
                },
                construccion: {
                    sup: Number(formData.sup_const),
                    tipologia: tipologia?.nombre || "Genérico",
                    coefU,
                    age: calculation.valuationAge,
                    coefH: calculation.ageCoefficient,
                    estado: formData.estado,
                    coefI,
                    mbc: Number(formData.custom_mbc),
                },
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* ── INSTRUCCIONES RÁPIDAS (BANNERS MODERNOS) ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 rounded-xl p-4 flex gap-3 text-left shadow-sm">
                    <div className="bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg shrink-0 h-fit">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-emerald-900 dark:text-emerald-300 text-sm mb-1">1. Datos del Recibo</h4>
                        <p className="text-emerald-700 dark:text-emerald-400/80 text-xs leading-relaxed">
                            Copia directamente de tu recibo del IBI o ponencia de valores los datos principales: Año de construcción y Superficies medidas en m².
                        </p>
                    </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl p-4 flex gap-3 text-left shadow-sm">
                    <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 p-2 rounded-lg shrink-0 h-fit">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-1">2. Tipología y Calidad</h4>
                        <p className="text-blue-700 dark:text-blue-400/80 text-xs leading-relaxed">
                            Ajusta el uso (ej. Vivienda) y el nivel de calidad (Categoría 1-9). La herramienta buscará los coeficientes oficiales para esa gama.
                        </p>
                    </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900 rounded-xl p-4 flex gap-3 text-left shadow-sm">
                    <div className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 p-2 rounded-lg shrink-0 h-fit">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-purple-900 dark:text-purple-300 text-sm mb-1">3. Valor Matemático</h4>
                        <p className="text-purple-700 dark:text-purple-400/80 text-xs leading-relaxed">
                            Al calcular, el sistema sumará el suelo y la construcción aplicando la depreciación por antigüedad (CoefH) para obtener una estimación orientativa.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <Label htmlFor="urban-use" className="text-slate-600 font-medium">Uso / Tipología Urbana</Label>
                    <Select value={formData.uso_const} onValueChange={(v: string) => handleSelectChange("uso_const", v)}>
                        <SelectTrigger id="urban-use" className="h-11 bg-slate-50 border-slate-200">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {dbTipologiasUrbanas.map(t => (
                                <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="urban-category" className="text-slate-600 font-medium">Calidad Constructiva</Label>
                    <Select value={formData.categoria.toString()} onValueChange={(v: string) => handleSelectChange("categoria", v)}>
                        <SelectTrigger id="urban-category" className="h-11 bg-slate-50 border-slate-200">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Categoría 1 (Lujo Max)</SelectItem>
                            <SelectItem value="2">Categoría 2 (Lujo)</SelectItem>
                            <SelectItem value="3">Categoría 3 (Muy Buena)</SelectItem>
                            <SelectItem value="4">Categoría 4 (Buena)</SelectItem>
                            <SelectItem value="5">Categoría 5 (Normal)</SelectItem>
                            <SelectItem value="6">Categoría 6 (Sencilla)</SelectItem>
                            <SelectItem value="7">Categoría 7 (Económica)</SelectItem>
                            <SelectItem value="8">Categoría 8 (Ínfima)</SelectItem>
                            <SelectItem value="9">Categoría 9 (Ruina)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="urban-built-area" className="text-slate-600 font-medium">Superficie Construida (m²)</Label>
                    <Input id="urban-built-area" type="number" min="0" step="0.01" name="sup_const" value={formData.sup_const} onChange={handleInputChange} className="h-11 bg-slate-50 border-slate-200 text-lg font-medium" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="urban-construction-year" className="text-slate-600 font-medium">Año de Construcción</Label>
                    <Input id="urban-construction-year" type="number" min="1000" max={new Date().getFullYear() + 1} name="anio_const" value={formData.anio_const} onChange={handleInputChange} className="h-11 bg-slate-50 border-slate-200 text-lg font-medium" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="urban-condition" className="text-slate-600 font-medium">Estado de Conservación</Label>
                    <Select value={formData.estado} onValueChange={(v: string) => handleSelectChange("estado", v)}>
                        <SelectTrigger id="urban-condition" className="h-11 bg-slate-50 border-slate-200">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {coeficientesConservacionUrbana.map(c => (
                                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="urban-land-value" className="text-slate-600 font-medium">Valor Repercusión Suelo (€/m²)</Label>
                    <Input id="urban-land-value" type="number" min="0" step="0.01" name="valor_rep" value={formData.valor_rep} onChange={handleInputChange} className="h-11 bg-slate-50 border-slate-200 text-lg font-medium" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="urban-land-area" className="text-slate-600 font-medium">Superficie Suelo / Parcela (m²)</Label>
                    <div className="flex gap-2">
                        <Input id="urban-land-area" type="number" min="0" step="0.01" name="sup_parcela" value={formData.sup_parcela} onChange={handleInputChange} className="h-11 bg-slate-50 border-slate-200 text-lg font-medium" />
                        <div className="relative">
                            <input
                                type="file"
                                accept=".kmz,.kml"
                                aria-label="Importar superficie desde KMZ o KML"
                                onChange={handleKmzImport}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                disabled={kmzLoading}
                            />
                            <Button
                                variant="outline"
                                type="button"
                                className="h-11 px-3 border-slate-200 bg-white hover:bg-slate-50"
                                title="Importar superficie desde KMZ/KML"
                            >
                                {kmzLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5 text-slate-400" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <label className="flex cursor-pointer items-start gap-3" htmlFor="valuation-parameters-confirmed">
                    <input
                        id="valuation-parameters-confirmed"
                        type="checkbox"
                        checked={formData.parameters_confirmed === true}
                        onChange={(event) => setFormData(prev => ({
                            ...prev,
                            parameters_confirmed: event.target.checked,
                        }))}
                        className="mt-0.5 h-4 w-4 rounded border-amber-400"
                    />
                    <span>
                        He contrastado el valor de repercusión, MBC, RM, G+B, año de ponencia y tipo de IBI con la documentación aplicable al inmueble.
                    </span>
                </label>
            </div>

            <Button size="lg" className="w-full mt-6 h-14 text-lg font-bold bg-primary hover:bg-slate-800 text-white shadow-xl transition-all hover:scale-105" onClick={calculateUrbanValue} disabled={loading}>
                {loading ? "Calculando..." : "Calcular Valor Urbano Ahora"}
                <CalculatorIcon className="ml-2 h-5 w-5" />
            </Button>
        </div>
    );
}
