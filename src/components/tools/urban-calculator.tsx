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
import {
    getMunicipalUrbanZoneRegistry,
    getOfficialZoneLandValue,
} from "@/data/cadastral-urban-zones";

export interface UrbanCalculatorProps {
    formData: any;
    setFormData: (fn: (prev: any) => any) => void;
    onCalculate: (result: any) => void;
    loading: boolean;
}

export function UrbanCalculator({ formData, setFormData, onCalculate, loading }: UrbanCalculatorProps) {
    const [kmzLoading, setKmzLoading] = useState(false);
    const [professionalMode, setProfessionalMode] = useState(false);
    const zoneRegistry = getMunicipalUrbanZoneRegistry(formData.municipio);
    const selectedZone = zoneRegistry?.zones.find(({ code }) => code === formData.zona_valor) ?? null;

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
        setFormData(prev => {
            if (name === "uso_const" && selectedZone) {
                return {
                    ...prev,
                    [name]: value,
                    valor_rep: getOfficialZoneLandValue(selectedZone, value) ?? 0,
                    parameters_confirmed: false,
                };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleZoneChange = (code: string) => {
        const zone = zoneRegistry?.zones.find(candidate => candidate.code === code);
        if (!zone) return;
        setFormData(prev => ({
            ...prev,
            zona_valor: zone.code,
            metodo_suelo: zone.method,
            valor_rep: getOfficialZoneLandValue(zone, prev.uso_const) ?? 0,
            parameters_confirmed: false,
        }));
    };

    const calculateUrbanValue = () => {
        const requiredParameters = [
            formData.valor_rep,
            formData.custom_gb,
            formData.custom_rm,
            formData.custom_mbc,
            formData.custom_anio_ponencia,
        ].map(Number);
        if (!formData.parameters_confirmed) {
            toast({
                title: "Falta confirmar los datos",
                description: "Revisa los datos mostrados y marca la casilla de confirmación antes de calcular.",
                variant: "destructive",
            });
            return;
        }
        if (requiredParameters.some(value => !Number.isFinite(value) || value <= 0)) {
            setProfessionalMode(true);
            toast({
                title: "Falta un dato para calcular",
                description: "No hemos podido completar automáticamente todos los datos técnicos. Revisa los campos señalados en la configuración profesional.",
                variant: "destructive",
            });
            return;
        }

        const tipologia = dbTipologiasUrbanas.find(t => t.id === formData.uso_const);
        const categoria = Number(formData.categoria);
        const coefU = tipologia?.categorias[categoria] ?? 1;
        const coefI = coeficientesConservacionUrbana.find(c => c.value === formData.estado)?.coef ?? 1;
        try {
            const calculation = calculateUrbanValuation({
                soilArea: formData.sup_parcela,
                constructionArea: formData.sup_const,
                potentialConstructionArea: formData.edif_max,
                landValuationMethod: formData.metodo_suelo,
                landValue: formData.valor_rep,
                landCorrector: formData.coef_suelo,
                promotionCoefficient: formData.custom_gb,
                jointCorrector: formData.coef_conjunto,
                marketCoefficient: formData.custom_rm,
                basicConstructionModule: formData.custom_mbc,
                constructionTypeCoefficient: coefU,
                conservationCoefficient: coefI,
                assessmentApprovalYear: formData.custom_anio_ponencia,
                constructionYear: formData.anio_const,
                typeId: formData.uso_const,
                category: categoria,
                ibiRate: formData.custom_tipo_urbano,
            });

            onCalculate({
                suelo_urbano: calculation.soilValue,
                construccion: calculation.constructionValue,
                valor_catastral_total: calculation.totalValue,
                cuota_ibi_anual: calculation.estimatedGrossIbi,
                tipo_aplicado: calculation.ibiRate,
                detalles: {
                    suelo: {
                        sup: calculation.landValuationArea,
                        metodo: calculation.landValuationMethod,
                        valor: Number(formData.valor_rep),
                        corrector: Number(formData.coef_suelo),
                        promocion: Number(formData.custom_gb),
                        rm: Number(formData.custom_rm),
                    },
                    construccion: {
                        sup: Number(formData.sup_const),
                        tipologia: tipologia?.nombre || "Genérico",
                        coefU,
                        age: calculation.valuationAge,
                        approvalYear: calculation.assessmentApprovalYear,
                        coefH: calculation.ageCoefficient,
                        estado: formData.estado,
                        coefI,
                        mbc: Number(formData.custom_mbc),
                    },
                }
            });
        } catch (error) {
            toast({
                title: "No se puede calcular",
                description: error instanceof Error ? error.message : "Revisa los parámetros de valoración.",
                variant: "destructive",
            });
        }
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
                        <h4 className="font-semibold text-emerald-900 dark:text-emerald-300 text-sm mb-1">1. Localizamos tu inmueble</h4>
                        <p className="text-emerald-700 dark:text-emerald-400/80 text-xs leading-relaxed">
                            Con la referencia catastral intentamos rellenar municipio, superficie, antigüedad y zona.
                        </p>
                    </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl p-4 flex gap-3 text-left shadow-sm">
                    <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 p-2 rounded-lg shrink-0 h-fit">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-1">2. Comprueba tres datos</h4>
                        <p className="text-blue-700 dark:text-blue-400/80 text-xs leading-relaxed">
                            Revisa el tipo de inmueble, los metros construidos y el año. Corrígelos solo si no coinciden.
                        </p>
                    </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900 rounded-xl p-4 flex gap-3 text-left shadow-sm">
                    <div className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 p-2 rounded-lg shrink-0 h-fit">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-purple-900 dark:text-purple-300 text-sm mb-1">3. Pulsa calcular</h4>
                        <p className="text-purple-700 dark:text-purple-400/80 text-xs leading-relaxed">
                            Te mostraremos por separado el suelo, la construcción, el total y una orientación del IBI.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {zoneRegistry && (
                    <div className="space-y-2 md:col-span-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                        <Label htmlFor="urban-value-zone" className="text-emerald-900 font-semibold">Zona del inmueble</Label>
                        <Select value={formData.zona_valor || undefined} onValueChange={handleZoneChange}>
                            <SelectTrigger id="urban-value-zone" className="h-11 bg-white border-emerald-300">
                                <SelectValue placeholder="No detectada: selecciónala si la conoces" />
                            </SelectTrigger>
                            <SelectContent>
                                {zoneRegistry.zones.map(zone => (
                                    <SelectItem key={zone.code} value={zone.code}>
                                        {zone.code} · {zone.method === "unit" ? `unitario ${zone.value} €/m² suelo` : "repercusión por uso"}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-emerald-800">
                            {selectedZone
                                ? `Zona ${selectedZone.code} localizada. Hemos cargado el valor publicado que corresponde al tipo de inmueble seleccionado. `
                                : "Si la búsqueda no consigue identificar la zona, no haremos una aproximación: tendrás que revisarla. "}
                            No se aplican automáticamente reducciones o circunstancias particulares de la finca.{' '}
                            <a href={zoneRegistry.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">Tabla pública del Catastro</a>.
                        </p>
                        {selectedZone && getOfficialZoneLandValue(selectedZone, formData.uso_const) === null && (
                            <p className="text-xs font-semibold text-amber-800">La tabla no define una correspondencia automática para esta tipología. Introduce y contrasta el valor manualmente.</p>
                        )}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="urban-use" className="text-slate-600 font-medium">¿Qué tipo de inmueble es?</Label>
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
                    <Label htmlFor="urban-category" className="text-slate-600 font-medium">Calidad de construcción</Label>
                    <Select value={formData.categoria.toString()} onValueChange={(v: string) => handleSelectChange("categoria", v)}>
                        <SelectTrigger id="urban-category" className="h-11 bg-slate-50 border-slate-200">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 9 }, (_, index) => index + 1).map(category => (
                                <SelectItem key={category} value={String(category)}>Categoría constructiva {category}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">Si no la conoces, deja la categoría 5.</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="urban-built-area" className="text-slate-600 font-medium">Metros construidos</Label>
                    <Input id="urban-built-area" type="number" min="0" step="0.01" name="sup_const" value={formData.sup_const} onChange={handleInputChange} className="h-11 bg-slate-50 border-slate-200 text-lg font-medium" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="urban-construction-year" className="text-slate-600 font-medium">Año de construcción</Label>
                    <Input id="urban-construction-year" type="number" min="1000" max={new Date().getFullYear() + 1} name="anio_const" value={formData.anio_const} onChange={handleInputChange} className="h-11 bg-slate-50 border-slate-200 text-lg font-medium" />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="urban-condition" className="text-slate-600 font-medium">¿Cómo está conservado?</Label>
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

                <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-between text-slate-600"
                        onClick={() => setProfessionalMode(current => !current)}
                        aria-expanded={professionalMode}
                    >
                        <span>{professionalMode ? "Ocultar datos técnicos" : "Configuración profesional (opcional)"}</span>
                        <span aria-hidden="true">{professionalMode ? "−" : "+"}</span>
                    </Button>
                    {!professionalMode && selectedZone && (
                        <p className="mt-1 text-center text-xs text-slate-500">
                            Método y valor del suelo ya cargados desde la zona {selectedZone.code}.
                        </p>
                    )}
                </div>

                {professionalMode && (<>
                <div className="space-y-2">
                    <Label htmlFor="urban-land-method" className="text-slate-600 font-medium">Método de valoración del suelo</Label>
                    <Select value={formData.metodo_suelo} onValueChange={(v: string) => handleSelectChange("metodo_suelo", v)}>
                        <SelectTrigger id="urban-land-method" className="h-11 bg-slate-50 border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="repercussion">Repercusión (€/m² construido real o potencial)</SelectItem>
                            <SelectItem value="unit">Unitario (€/m² de suelo)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="urban-land-value" className="text-slate-600 font-medium">
                        {formData.metodo_suelo === "repercussion" ? "Valor de repercusión (€/m² construido)" : "Valor unitario (€/m² de suelo)"}
                    </Label>
                    <Input id="urban-land-value" type="number" min="0" step="0.01" name="valor_rep" value={formData.valor_rep} onChange={handleInputChange} className="h-11 bg-slate-50 border-slate-200 text-lg font-medium" />
                </div>

                {formData.metodo_suelo === "repercussion" && (
                    <div className="space-y-2">
                        <Label htmlFor="urban-potential-area" className="text-slate-600 font-medium">Superficie construible potencial (m², opcional)</Label>
                        <Input id="urban-potential-area" type="number" min="0" step="0.01" name="edif_max" value={formData.edif_max} onChange={handleInputChange} className="h-11 bg-slate-50 border-slate-200 text-lg font-medium" />
                        <p className="text-xs text-slate-500">Si queda a cero se utilizará la superficie realmente construida.</p>
                    </div>
                )}

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
                </>)}
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
                        He revisado los datos mostrados arriba y son correctos.
                    </span>
                </label>
                <p className="mt-2 pl-7 text-xs text-amber-800">
                    Es una estimación orientativa. Si algún dato no se ha podido localizar, la aplicación no lo sustituye por una aproximación.
                </p>
            </div>

            <Button size="lg" className="w-full mt-6 h-14 text-lg font-bold bg-primary hover:bg-slate-800 text-white shadow-xl transition-all hover:scale-105" onClick={calculateUrbanValue} disabled={loading}>
                {loading ? "Calculando..." : "Calcular mi valor catastral"}
                <CalculatorIcon className="ml-2 h-5 w-5" />
            </Button>
        </div>
    );
}
