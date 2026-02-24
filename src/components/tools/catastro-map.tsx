"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, WMSTileLayer, useMapEvents, Marker, Popup, LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Loader2, ExternalLink, MapPin } from "lucide-react";
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
    lat: number;
    lng: number;
}

// Component to handle map clicks
function ClickHandler({ setPlotInfo, setLoading }: { setPlotInfo: (info: PlotInfo | null) => void, setLoading: (b: boolean) => void }) {
    useMapEvents({
        click: async (e) => {
            setPlotInfo(null);
            setLoading(true);

            try {
                const response = await fetch(`${API_BASE_URL}/catastro/buscar-por-coordenadas`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        lat: e.latlng.lat,
                        lon: e.latlng.lng,
                    }),
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
            } catch (error) {
                console.error("Error querying Catastro:", error);
                toast({
                    title: "Error de conexión",
                    description: "No se ha podido contactar con el Servicio de Catastro.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        },
    });
    return null;
}

export function CatastroMap({ className = "h-[600px] w-full rounded-xl overflow-hidden shadow-lg border relative" }: CatastroMapProps) {
    // Center of Spain by default
    const [center] = useState<[number, number]>([40.4168, -3.7038]);
    const [plotInfo, setPlotInfo] = useState<PlotInfo | null>(null);
    const [loading, setLoading] = useState(false);

    if (typeof window === "undefined") {
        return <div className={`${className} bg-slate-100 animate-pulse flex items-center justify-center`}><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>;
    }

    return (
        <div className={className}>
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
                <ClickHandler setPlotInfo={setPlotInfo} setLoading={setLoading} />

                <LayersControl position="topright">
                    {/* Capas Base */}
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
                            attribution='OrtoPNOA &copy; IGN'
                            maxZoom={20}
                        />
                    </LayersControl.BaseLayer>

                    {/* Capas Superpuestas */}
                    <LayersControl.Overlay name="Cartografía Catastral" checked>
                        <WMSTileLayer
                            url="https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?"
                            layers="catastro"
                            format="image/png"
                            transparent={true}
                            attribution='&copy; D.G. del Catastro'
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
                                        <p className="text-sm font-mono text-slate-600 font-medium mb-1">
                                            Ref: {plotInfo.rc}
                                        </p>
                                        <p className="text-xs text-slate-500 line-clamp-2" title={plotInfo.direccion}>
                                            {plotInfo.direccion}
                                        </p>
                                    </div>
                                </div>

                                <div className="h-px w-full bg-slate-200 my-3"></div>

                                <div className="space-y-2">
                                    <Link href={`/herramientas/calculadora?rc=${plotInfo.rc}`} className="block w-full">
                                        <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-white font-semibold text-xs h-8">
                                            Calcular IBI Urbano
                                            <ExternalLink className="ml-1.5 h-3 w-3" />
                                        </Button>
                                    </Link>
                                    <Link href={`/herramientas/calculadora-rustica?rc=${plotInfo.rc}`} className="block w-full">
                                        <Button size="sm" variant="outline" className="w-full border-accent text-accent hover:bg-accent hover:text-white font-semibold text-xs h-8">
                                            Calcular Valor Rústico
                                            <ExternalLink className="ml-1.5 h-3 w-3" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
}
