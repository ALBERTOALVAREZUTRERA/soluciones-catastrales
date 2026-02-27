"use client";

import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, WMSTileLayer, useMapEvents, Marker, Popup, LayersControl, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, MapPin, Search, X } from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/backend-api";

// Fix for default Leaflet icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface CatastroMapProps {
    onLocationSelected?: (lat: number, lng: number) => void;
    className?: string;
}

interface PlotInfo {
    rc: string;
    direccion: string;
    municipio?: string;
    provincia?: string;
    lat: number;
    lng: number;
}

// Componente interno para mover el mapa hacia el target
function MapController({ target }: { target: [number, number] | null }) {
    const map = useMap();
    useEffect(() => {
        if (target) {
            map.flyTo(target, 18, { duration: 1.5 });
        }
    }, [target, map]);
    return null;
}

// Componente para manejar clics en el mapa
function ClickHandler({ setPlotInfo, setLoading, setFlyTarget }: {
    setPlotInfo: (info: PlotInfo | null) => void;
    setLoading: (b: boolean) => void;
    setFlyTarget: (t: [number, number] | null) => void;
}) {
    useMapEvents({
        click: async (e) => {
            setPlotInfo(null);
            setLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/catastro/buscar-por-coordenadas`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ lat: e.latlng.lat, lon: e.latlng.lng }),
                });
                const data = await response.json();
                if (data.encontrado && data.rc) {
                    setPlotInfo({
                        rc: data.rc,
                        direccion: data.direccion || "Dirección no disponible",
                        lat: e.latlng.lat,
                        lng: e.latlng.lng,
                    });
                } else {
                    toast({
                        title: "Sin resultados",
                        description: data.error || "No se ha encontrado ninguna parcela catastral en esta ubicación.",
                        variant: "destructive",
                    });
                }
            } catch {
                toast({ title: "Error de conexión", description: "No se ha podido contactar con el Servicio de Catastro.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        },
    });
    return null;
}

export function CatastroMap({ className = "" }: CatastroMapProps) {
    const [center] = useState<[number, number]>([40.4168, -3.7038]);
    const [plotInfo, setPlotInfo] = useState<PlotInfo | null>(null);
    const [loading, setLoading] = useState(false);

    // Búsqueda por RC
    const [rcInput, setRcInput] = useState("");
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

    const searchByRC = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault();
        const rc = rcInput.trim().toUpperCase();
        if (rc.length < 14) {
            setSearchError("Introduce una referencia catastral válida (mínimo 14 caracteres)");
            return;
        }
        setSearching(true);
        setSearchError(null);
        setPlotInfo(null);
        try {
            const resp = await fetch(`${API_BASE_URL}/catastro/buscar-rc`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ referencia_catastral: rc }),
            });
            const data = await resp.json();
            if (data.encontrado) {
                const info: PlotInfo = {
                    rc: data.rc,
                    direccion: data.direccion || "",
                    municipio: data.municipio,
                    provincia: data.provincia,
                    lat: data.lat,
                    lng: data.lon,
                };
                setPlotInfo(info);
                setFlyTarget([data.lat, data.lon]);
            } else {
                setSearchError(data.error || "Referencia catastral no encontrada");
            }
        } catch {
            setSearchError("Error de conexión con el servicio catastral");
        } finally {
            setSearching(false);
        }
    }, [rcInput]);

    if (typeof window === "undefined") {
        return (
            <div className="h-[650px] w-full bg-slate-100 animate-pulse flex items-center justify-center rounded-xl">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="flex flex-col rounded-xl overflow-hidden shadow-xl border border-primary/10">

            {/* ── Panel de búsqueda por RC ── */}
            <div className="bg-slate-900 px-5 py-4 space-y-2">
                <form onSubmit={searchByRC} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="flex items-center gap-2 shrink-0">
                        <Search className="h-5 w-5 text-accent" />
                        <span className="text-white font-bold text-sm uppercase tracking-wide whitespace-nowrap">
                            Ref. Catastral
                        </span>
                    </div>
                    <div className="relative flex-1 w-full">
                        <input
                            type="text"
                            id="rc-search-input"
                            value={rcInput}
                            onChange={(e) => { setRcInput(e.target.value.toUpperCase()); setSearchError(null); }}
                            placeholder="Ej: 7110106VH0171S0001HY  (14-20 caracteres)"
                            maxLength={20}
                            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent pr-10"
                        />
                        {rcInput && (
                            <button
                                type="button"
                                onClick={() => { setRcInput(""); setSearchError(null); setPlotInfo(null); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={searching || rcInput.trim().length < 14}
                        className="bg-accent hover:bg-accent/90 disabled:opacity-40 text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2 shrink-0"
                    >
                        {searching
                            ? <><Loader2 className="h-4 w-4 animate-spin" /> Buscando...</>
                            : <><Search className="h-4 w-4" /> Localizar</>
                        }
                    </button>
                </form>

                {/* Error */}
                {searchError && (
                    <div className="flex items-center gap-2 text-red-400 text-xs">
                        <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                        {searchError}
                    </div>
                )}

                {/* Resultado encontrado */}
                {plotInfo && !searchError && (
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Localizado:
                        </div>
                        <span className="font-mono text-white bg-slate-700 px-2 py-0.5 rounded">{plotInfo.rc}</span>
                        {plotInfo.municipio && (
                            <span className="text-slate-300">{plotInfo.municipio}{plotInfo.provincia ? ` (${plotInfo.provincia})` : ""}</span>
                        )}
                        {plotInfo.direccion && (
                            <span className="text-slate-400 truncate max-w-xs">{plotInfo.direccion}</span>
                        )}
                    </div>
                )}

                <p className="text-slate-500 text-xs">
                    También puedes{" "}
                    <span className="text-accent">hacer clic directamente sobre cualquier parcela</span>{" "}
                    en el mapa para identificarla.
                </p>
            </div>

            {/* ── Mapa ── */}
            <div className="relative" style={{ height: 600 }}>
                {loading && (
                    <div className="absolute inset-0 z-[1000] bg-white/50 backdrop-blur-sm flex items-center justify-center">
                        <div className="bg-white p-4 rounded-lg shadow-xl flex items-center gap-3">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <span className="font-medium text-primary">Consultando Sede del Catastro...</span>
                        </div>
                    </div>
                )}

                <MapContainer
                    key="catastro-map-instance"
                    center={center}
                    zoom={6}
                    style={{ height: "100%", width: "100%", zIndex: 1 }}
                    attributionControl={false}
                >
                    <MapController target={flyTarget} />
                    <ClickHandler setPlotInfo={setPlotInfo} setLoading={setLoading} setFlyTarget={setFlyTarget} />

                    <LayersControl position="topright">
                        <LayersControl.BaseLayer name="Mapa Base (OSM)" checked>
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.BaseLayer name="Ortofoto (PNOA)">
                            <WMSTileLayer
                                url="https://www.ign.es/wms-inspire/pnoa-ma"
                                layers="OI.OrthoimageCoverage"
                                format="image/png"
                                transparent={true}
                                attribution="OrtoPNOA &copy; IGN"
                                maxZoom={20}
                            />
                        </LayersControl.BaseLayer>
                        <LayersControl.Overlay name="Cartografía Catastral" checked>
                            <WMSTileLayer
                                url="https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?"
                                layers="catastro"
                                format="image/png"
                                transparent={true}
                                attribution="&copy; D.G. del Catastro"
                                maxZoom={20}
                                opacity={0.7}
                            />
                        </LayersControl.Overlay>
                    </LayersControl>

                    {plotInfo && (
                        <Marker position={[plotInfo.lat, plotInfo.lng]}>
                            <Popup className="catastro-popup">
                                <div className="p-2 w-64">
                                    <div className="flex items-start gap-2 mb-3">
                                        <MapPin className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-bold text-primary font-headline text-lg mb-1">Parcela Localizada</h4>
                                            <p className="text-sm font-mono text-slate-600 font-medium mb-1">Ref: {plotInfo.rc}</p>
                                            {plotInfo.municipio && <p className="text-xs text-slate-500">{plotInfo.municipio} ({plotInfo.provincia})</p>}
                                            {plotInfo.direccion && <p className="text-xs text-slate-500 line-clamp-2">{plotInfo.direccion}</p>}
                                        </div>
                                    </div>
                                    <div className="h-px w-full bg-slate-200 my-3" />
                                    <div className="space-y-2">
                                        <Link href={`/herramientas/calculadora?rc=${plotInfo.rc}`} className="block w-full">
                                            <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-white font-semibold text-xs h-8">
                                                Calcular IBI Urbano <ExternalLink className="ml-1.5 h-3 w-3" />
                                            </Button>
                                        </Link>
                                        <Link href={`/herramientas/calculadora-rustica?rc=${plotInfo.rc}`} className="block w-full">
                                            <Button size="sm" variant="outline" className="w-full border-accent text-accent hover:bg-accent hover:text-white font-semibold text-xs h-8">
                                                Calcular Valor Rústico <ExternalLink className="ml-1.5 h-3 w-3" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>
        </div>
    );
}
