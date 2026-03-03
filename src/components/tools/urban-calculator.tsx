"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalculatorIcon } from "lucide-react";
import { dbTipologiasUrbanas, coeficientesAntiguedadUrbana, coeficientesConservacionUrbana } from "@/data/mock-db-urbana";

export interface UrbanCalculatorProps {
    formData: any;
    setFormData: (fn: (prev: any) => any) => void;
    onCalculate: (result: any) => void;
    loading: boolean;
}

export function UrbanCalculator({ formData, setFormData, onCalculate, loading }: UrbanCalculatorProps) {

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
        // --- 1. SOIL CALCULATION (SUELO) ---
        // Formula: Superficie × Valor Repercusión(VR) × Coef_Gastos(C) × RM
        const supSuelo = Number(formData.sup_parcela) || 0;
        const vr = Number(formData.valor_rep) || 0;
        const coefG = Number(formData.custom_gb) || 1.0;
        const rm = Number(formData.custom_rm) || 0.5;

        // Si es división horizontal (piso), catastro muchas veces usa la sup construida como base de reparto
        const baseSuelo = (supSuelo === 0) ? Number(formData.sup_const) : supSuelo;
        const valorSueloTotal = baseSuelo * vr * coefG * rm;

        // --- 2. CONSTRUCTION CALCULATION (CONSTRUCCIÓN) ---
        // Formula: Superficie × Tipología(coef) × Antigüedad(H) × Conservación(I) × Coef_Gastos(C) × RM × MBC
        const supConst = Number(formData.sup_const) || 0;
        const mbc = Number(formData.custom_mbc) || 550;

        // Find tipology coef (U)
        const tipologia = dbTipologiasUrbanas.find(t => t.id === formData.uso_const);
        const cat = Number(formData.categoria) || 5;
        const coefU = tipologia ? (tipologia.categorias[cat] || 1.0) : 1.0;

        // Find age coef (H)
        const currentYear = new Date().getFullYear();
        const age = Math.max(0, currentYear - (Number(formData.anio_const) || currentYear));
        const coefH = coeficientesAntiguedadUrbana.find(c => age <= c.maxAge)?.coef || 0.39;

        // Find conservation coef (I)
        const coefI = coeficientesConservacionUrbana.find(c => c.value === formData.estado)?.coef || 1.0;

        const valorConstTotal = supConst * coefU * coefH * coefI * coefG * rm * mbc;

        // --- 3. TOTALS ---
        const valorCatastralTotal = valorSueloTotal + valorConstTotal;

        // IBI
        const tipoIbi = 0.006; // 0.6% por defecto urbano
        const cuotaIbi = valorCatastralTotal * tipoIbi;

        onCalculate({
            suelo_urbano: valorSueloTotal,
            construccion: valorConstTotal,
            valor_catastral_total: valorCatastralTotal,
            cuota_ibi_anual: cuotaIbi,
            tipo_aplicado: tipoIbi,
            detalles: {
                suelo: { sup: baseSuelo, vr, coefG, rm },
                construccion: { sup: supConst, tipologia: tipologia?.nombre || 'Generico', coefU, age, coefH, estado: formData.estado, coefI, mbc }
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                    <Label className="text-slate-600 font-medium">Uso / Tipología Urbana</Label>
                    <Select value={formData.uso_const} onValueChange={(v: string) => handleSelectChange("uso_const", v)}>
                        <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
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
                    <Label className="text-slate-600 font-medium">Calidad Constructiva</Label>
                    <Select value={formData.categoria.toString()} onValueChange={(v: string) => handleSelectChange("categoria", v)}>
                        <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
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
                    <Label className="text-slate-600 font-medium">Superficie Construida (m²)</Label>
                    <Input type="number" name="sup_const" value={formData.sup_const} onChange={handleInputChange} className="h-11 bg-slate-50 border-slate-200 text-lg font-medium" />
                </div>

                <div className="space-y-2">
                    <Label className="text-slate-600 font-medium">Año de Construcción</Label>
                    <Input type="number" name="anio_const" value={formData.anio_const} onChange={handleInputChange} className="h-11 bg-slate-50 border-slate-200 text-lg font-medium" />
                </div>

                <div className="space-y-2">
                    <Label className="text-slate-600 font-medium">Estado de Conservación</Label>
                    <Select value={formData.estado} onValueChange={(v: string) => handleSelectChange("estado", v)}>
                        <SelectTrigger className="h-11 bg-slate-50 border-slate-200">
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
                    <Label className="text-slate-600 font-medium">Valor Repercusión Suelo (€/m²)</Label>
                    <Input type="number" name="valor_rep" value={formData.valor_rep} onChange={handleInputChange} className="h-11 bg-slate-50 border-slate-200 text-lg font-medium" />
                </div>

                <div className="space-y-2">
                    <Label className="text-slate-600 font-medium">Superficie Suelo / Parcela (m²)</Label>
                    <Input type="number" name="sup_parcela" value={formData.sup_parcela} onChange={handleInputChange} className="h-11 bg-slate-50 border-slate-200 text-lg font-medium" />
                </div>
            </div>

            <Button size="lg" className="w-full mt-6 h-14 text-lg font-bold bg-primary hover:bg-slate-800 text-white shadow-xl transition-all hover:scale-105" onClick={calculateUrbanValue} disabled={loading}>
                {loading ? "Calculando..." : "Calcular Valor Urbano Ahora"}
                <CalculatorIcon className="ml-2 h-5 w-5" />
            </Button>
        </div>
    );
}
