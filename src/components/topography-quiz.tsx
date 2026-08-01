"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trees, Building2, MapPin, Calculator, FileWarning, LandPlot, AlertTriangle, Scale, ArrowRight, CheckCircle2 } from "lucide-react";
import {
    HoneypotField,
    PrivacyConsent,
} from "@/components/shared/privacy-consent";

type QuizState = {
    propertyType: string;
    problem: string;
    cadastralRef: string;
    contact: string;
    name: string;
};

export function TopographyQuiz() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [website, setWebsite] = useState("");
    const [submitError, setSubmitError] = useState("");
    const [data, setData] = useState<QuizState>({
        propertyType: "",
        problem: "",
        cadastralRef: "",
        contact: "",
        name: ""
    });

    const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
    const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

    const selectPropertyType = (type: string) => {
        setData({ ...data, propertyType: type });
        nextStep();
    };

    const selectProblem = (prob: string) => {
        setData({ ...data, problem: prob });
        nextStep();
    };

    const submitQuiz = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSubmitError("");

        try {
            const contact = data.contact.trim();
            const payload = {
                name: data.name || "Cliente del Quiz",
                email: contact.includes("@") ? contact : "",
                phone: contact.includes("@") ? "" : contact,
                type: "Presupuesto desde el Quiz Interactivo",
                ref: data.cadastralRef,
                message: `¡NUEVO LEAD CUALIFICADO!
        
Tipo de Propiedad: ${data.propertyType}
Problema o Necesidad: ${data.problem}
Contacto (Tel/Email): ${data.contact}`,
                privacyAccepted,
                website,
            };

            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(result.error || "No se pudo enviar la solicitud.");
            }
            setSuccess(true);
        } catch (error) {
            setSubmitError(
                error instanceof Error
                    ? error.message
                    : "No se pudo enviar la solicitud. Inténtelo de nuevo.",
            );
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <section className="py-20 bg-blue-50/50">
                <div className="container mx-auto px-4 max-w-2xl text-center">
                    <div className="bg-white rounded-3xl p-10 shadow-xl border border-blue-100 animate-fade-in-up">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                        </div>
                        <h3 className="text-3xl font-bold text-primary mb-4 font-headline">¡Súper! Caso Recibido</h3>
                        <p className="text-lg text-slate-600 mb-8">
                            Hemos recibido los detalles de tu finca <strong>{data.propertyType.toLowerCase()}</strong>. Revisaremos la información y contactaremos contigo para concretar la posible solución y su alcance: <strong>{data.contact}</strong>
                        </p>
                        <Button onClick={() => { setSuccess(false); setStep(1); setPrivacyAccepted(false); setWebsite(""); setData({ propertyType: "", problem: "", cadastralRef: "", contact: "", name: "" }); }} variant="outline" className="border-accent text-accent hover:bg-accent hover:text-white">
                            Hacer otra simulación
                        </Button>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-24 bg-gradient-to-br from-slate-50 to-blue-50/30">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-10">
                    <div className="inline-block bg-accent/10 px-4 py-1.5 rounded-full text-accent font-bold text-sm tracking-wide uppercase mb-4">
                        Triaje Catastral Online
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold font-headline text-primary mb-4">
                        Calcula el Presupuesto de tu Proyecto
                    </h2>
                    <p className="text-lg text-slate-600">Responde a 3 preguntas para que podamos preparar una primera orientación sobre tu caso.</p>
                </div>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-slate-100">
                        <div className="h-full bg-accent transition-all duration-500 ease-in-out" style={{ width: `${(step / 4) * 100}%` }} />
                    </div>

                    <div className="p-8 md:p-12">
                        {step === 1 && (
                            <div className="animate-fade-in-up">
                                <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">Paso 1: ¿Qué tipo de propiedad tienes?</h3>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <button type="button" onClick={() => selectPropertyType("Rústica / Finca Agraria")} className="group flex flex-col items-center p-8 bg-slate-50 hover:bg-blue-50 border-2 border-transparent hover:border-accent rounded-2xl transition-all h-full">
                                        <div className="bg-white p-4 rounded-full shadow-sm group-hover:shadow-md mb-4 group-hover:scale-110 transition-transform">
                                            <Trees className="h-8 w-8 text-emerald-600" />
                                        </div>
                                        <span className="font-bold text-slate-800 text-lg">Rústica / Finca Agraria</span>
                                        <span className="text-sm text-slate-500 mt-2 text-center">Olivos, secano, parcelas de cultivo</span>
                                    </button>
                                    <button type="button" onClick={() => selectPropertyType("Urbana / Vivienda / Solar")} className="group flex flex-col items-center p-8 bg-slate-50 hover:bg-blue-50 border-2 border-transparent hover:border-accent rounded-2xl transition-all h-full">
                                        <div className="bg-white p-4 rounded-full shadow-sm group-hover:shadow-md mb-4 group-hover:scale-110 transition-transform">
                                            <Building2 className="h-8 w-8 text-blue-600" />
                                        </div>
                                        <span className="font-bold text-slate-800 text-lg">Urbana / Vivienda</span>
                                        <span className="text-sm text-slate-500 mt-2 text-center">Pisos, casas, solares urbanos</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-fade-in-up">
                                <button type="button" onClick={prevStep} className="min-h-11 text-sm text-slate-500 hover:text-accent mb-4 block">← Volver al paso anterior</button>
                                <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">Paso 2: ¿Cuál es el problema u objetivo principal?</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        { icon: Scale, text: "Vender/Heredar (El Notario pide GML)" },
                                        { icon: AlertTriangle, text: "Discrepancia de linderos con un vecino o Catastro" },
                                        { icon: Calculator, text: "Me cobran un IBI excesivo" },
                                        { icon: LandPlot, text: "Quiero Segregar o Dividir la parcela" },
                                        { icon: FileWarning, text: "He recibido una notificación/requerimiento" },
                                        { icon: MapPin, text: "Necesito medirla o saber dónde están los hitos (Topografía)" },
                                    ].map((item, idx) => (
                                        <button
                                            type="button"
                                            key={idx}
                                            onClick={() => selectProblem(item.text)}
                                            className="flex items-center gap-4 p-4 text-left border rounded-xl hover:border-accent hover:bg-accent/5 transition-all w-full group"
                                        >
                                            <item.icon className="h-5 w-5 text-slate-400 group-hover:text-accent shrink-0" />
                                            <span className="font-medium text-slate-700 group-hover:text-primary">{item.text}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="animate-fade-in-up max-w-lg mx-auto">
                                <button type="button" onClick={prevStep} className="min-h-11 text-sm text-slate-500 hover:text-accent mb-4 block">← Volver al paso anterior</button>
                                <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">Paso 3: ¿Tienes la Referencia Catastral a mano?</h3>
                                <p className="text-center text-slate-500 mb-6 text-sm">Nos ayuda a preparar el presupuesto más rápido, pero no es obligatoria ahora mismo.</p>
                                <div className="space-y-4">
                                    <label htmlFor="quiz-cadastral-ref" className="sr-only">Referencia catastral opcional</label>
                                    <input
                                        id="quiz-cadastral-ref"
                                        type="text"
                                        placeholder="Ej: 14 o 20 caracteres (Opcional)"
                                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-4 text-lg focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all text-center uppercase"
                                        value={data.cadastralRef}
                                        maxLength={20}
                                        onChange={(e) => setData({
                                            ...data,
                                            cadastralRef: e.target.value
                                                .toUpperCase()
                                                .replace(/[^A-Z0-9]/g, ""),
                                        })}
                                    />
                                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                        <Button onClick={nextStep} variant="outline" className="flex-1 h-14 text-base border-slate-200 hover:bg-slate-50">
                                            No la sé
                                        </Button>
                                        <Button onClick={nextStep} className="flex-1 h-14 bg-primary hover:bg-primary/90 text-white font-bold text-base">
                                            Siguiente <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="animate-fade-in-up max-w-lg mx-auto">
                                <button type="button" onClick={prevStep} className="min-h-11 text-sm text-slate-500 hover:text-accent mb-4 block">← Volver al paso anterior</button>
                                <div className="text-center mb-8">
                                    <h3 className="text-2xl font-bold text-slate-800 mb-2">¡Todo listo para el estudio!</h3>
                                    <p className="text-slate-500">¿A dónde te enviamos el presupuesto y la viabilidad sin compromiso?</p>
                                </div>

                                <form onSubmit={submitQuiz} className="space-y-4">
                                    <div>
                                        <label htmlFor="quiz-name" className="block text-sm font-semibold text-slate-700 mb-1">Nombre (o empresa)</label>
                                        <input
                                            id="quiz-name"
                                            type="text"
                                            autoComplete="name"
                                            required
                                            maxLength={100}
                                            placeholder="Ej: Manuel García"
                                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-accent"
                                            value={data.name}
                                            onChange={(e) => setData({ ...data, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="quiz-contact" className="block text-sm font-semibold text-slate-700 mb-1">Teléfono móvil (o Email)</label>
                                        <input
                                            id="quiz-contact"
                                            type="text"
                                            autoComplete="email"
                                            required
                                            maxLength={254}
                                            placeholder="Ej: 600 000 000"
                                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-accent"
                                            value={data.contact}
                                            onChange={(e) => setData({ ...data, contact: e.target.value })}
                                        />
                                    </div>
                                    <HoneypotField
                                        id="quiz-website"
                                        value={website}
                                        onChange={setWebsite}
                                    />
                                    <PrivacyConsent
                                        id="quiz-privacy"
                                        checked={privacyAccepted}
                                        onCheckedChange={setPrivacyAccepted}
                                    />
                                    {submitError && (
                                        <p role="alert" className="text-sm text-red-600">
                                            {submitError}
                                        </p>
                                    )}

                                    <div className="pt-4">
                                        <Button type="submit" disabled={loading} aria-busy={loading} className="w-full h-14 bg-accent hover:bg-emerald-500 text-primary text-lg font-bold shadow-xl shadow-accent/20">
                                            {loading ? "Enviando al ingeniero..." : "Solicitar Presupuesto Gratuito"}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
