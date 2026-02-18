"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { API_BASE_URL } from '@/lib/backend-api';

/**
 * Visor de Localización Técnica con búsqueda de parcelas y Máquina del Tiempo
 * 
 * WMS oficial: https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx
 * 
 * NOTA: El parámetro WMS TIME solo funciona con determinadas capas y zooms.
 * Fechas anteriores a 2004 pueden devolver vacíos en municipios no digitalizados.
 */

const WMS_URL = 'https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx';
const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 2002;

export default function CatastroTimeViewer() {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const catastroLayerRef = useRef<L.TileLayer.WMS | null>(null);
    const historicLayerRef = useRef<L.TileLayer.WMS | null>(null);

    // Búsqueda
    const [searchMode, setSearchMode] = useState<'ref' | 'rustica'>('ref');
    const [refCatastral, setRefCatastral] = useState('');
    const [rusticData, setRusticData] = useState({ provincia: '', municipio: '', poligono: '', parcela: '' });
    const [isSearching, setIsSearching] = useState(false);
    const [parcelInfo, setParcelInfo] = useState<string | null>(null);
    const [searchError, setSearchError] = useState<string | null>(null);

    // Capas
    const [showCatastro, setShowCatastro] = useState(true);
    const [catastroOpacity, setCatastroOpacity] = useState(0.7);

    // Máquina del Tiempo
    const [timeEnabled, setTimeEnabled] = useState(false);
    const [selectedYear, setSelectedYear] = useState(2010);
    const [historicOpacity, setHistoricOpacity] = useState(0.5);
    const [isPlaying, setIsPlaying] = useState(false);
    const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // ─── Inicializar mapa ───
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: [37.79, -3.79],
            zoom: 17,
            maxZoom: 22,
            minZoom: 6,
            zoomControl: false,
        });

        L.control.zoom({ position: 'topright' }).addTo(map);

        // Base: IGN
        L.tileLayer('https://tms-ign-base.idee.es/1.0.0/IGNBaseTodo/{z}/{x}/{y}.jpeg', {
            maxZoom: 20,
            attribution: '© IGN España'
        }).addTo(map);

        // Capa Catastro actual
        const catastro = L.tileLayer.wms(WMS_URL, {
            layers: 'Catastro',
            format: 'image/png',
            transparent: true,
            version: '1.1.1',
            crs: L.CRS.EPSG3857,
            attribution: '© DG Catastro',
            maxZoom: 22,
            opacity: 0.7,
        } as any);
        catastro.addTo(map);
        catastroLayerRef.current = catastro;

        L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);
        mapRef.current = map;

        return () => { map.remove(); mapRef.current = null; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Opacidad catastro ───
    useEffect(() => {
        catastroLayerRef.current?.setOpacity(catastroOpacity);
    }, [catastroOpacity]);

    // ─── Toggle catastro ───
    useEffect(() => {
        if (!catastroLayerRef.current || !mapRef.current) return;
        if (showCatastro) catastroLayerRef.current.addTo(mapRef.current);
        else mapRef.current.removeLayer(catastroLayerRef.current);
    }, [showCatastro]);

    // ─── Máquina del Tiempo: activar/desactivar ───
    useEffect(() => {
        if (!mapRef.current) return;

        if (timeEnabled) {
            // Crear capa histórica
            const historic = L.tileLayer.wms(WMS_URL, {
                layers: 'PARCELA',
                format: 'image/png',
                transparent: true,
                version: '1.1.1',
                crs: L.CRS.EPSG3857,
                maxZoom: 22,
                opacity: historicOpacity,
                TIME: `${selectedYear}-01-01`,
            } as any);
            historic.addTo(mapRef.current);
            historicLayerRef.current = historic;
        } else {
            // Eliminar capa histórica
            if (historicLayerRef.current) {
                mapRef.current.removeLayer(historicLayerRef.current);
                historicLayerRef.current = null;
            }
            setIsPlaying(false);
        }

        return () => {
            if (historicLayerRef.current && mapRef.current) {
                mapRef.current.removeLayer(historicLayerRef.current);
                historicLayerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeEnabled]);

    // ─── Actualizar año ───
    useEffect(() => {
        if (historicLayerRef.current && timeEnabled) {
            (historicLayerRef.current as any).setParams({ TIME: `${selectedYear}-01-01` });
        }
    }, [selectedYear, timeEnabled]);

    // ─── Opacidad histórica ───
    useEffect(() => {
        historicLayerRef.current?.setOpacity(historicOpacity);
    }, [historicOpacity]);

    // ─── Reproducción automática ───
    useEffect(() => {
        if (isPlaying && timeEnabled) {
            playIntervalRef.current = setInterval(() => {
                setSelectedYear(prev => {
                    if (prev >= CURRENT_YEAR) { setIsPlaying(false); return MIN_YEAR; }
                    return prev + 1;
                });
            }, 1200);
        } else {
            if (playIntervalRef.current) { clearInterval(playIntervalRef.current); playIntervalRef.current = null; }
        }
        return () => { if (playIntervalRef.current) clearInterval(playIntervalRef.current); };
    }, [isPlaying, timeEnabled]);

    // ─── Navegar a parcela ───
    const flyToAndHighlight = useCallback((lat: number, lon: number, label: string) => {
        if (!mapRef.current) return;
        if (markerRef.current) mapRef.current.removeLayer(markerRef.current);

        mapRef.current.flyTo([lat, lon], 18, { duration: 1.5 });

        const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background:#dc2626;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
            iconSize: [14, 14],
            iconAnchor: [7, 7],
        });

        markerRef.current = L.marker([lat, lon], { icon })
            .addTo(mapRef.current)
            .bindPopup(`<div style="font-size:12px;font-weight:600;text-align:center;">${label}</div>`)
            .openPopup();
        setParcelInfo(label);
    }, []);

    // ─── Buscar por referencia catastral (via proxy backend) ───
    const searchByRef = useCallback(async () => {
        if (!refCatastral.trim() || refCatastral.trim().length < 14) {
            setSearchError('Introduzca una referencia catastral válida (mínimo 14 caracteres)');
            return;
        }
        setIsSearching(true);
        setParcelInfo(null);
        setSearchError(null);
        try {
            const resp = await fetch(`${API_BASE_URL}/catastro/buscar-rc`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ referencia_catastral: refCatastral.trim() }),
            });
            const data = await resp.json();
            if (data.encontrado) {
                setSearchError(null);
                const parts = [`📍 RC: ${data.rc}`];
                if (data.direccion) parts.push(`🏠 ${data.direccion}`);
                if (data.municipio) parts.push(`📍 ${data.municipio} (${data.provincia})`);
                parts.push(`📐 Lat: ${data.lat.toFixed(6)}, Lon: ${data.lon.toFixed(6)}`);
                flyToAndHighlight(data.lat, data.lon, parts.join('<br/>'));
            } else {
                setSearchError(data.error || 'Referencia catastral no encontrada.');
            }
        } catch (err) {
            console.error(err);
            setSearchError('Error de conexión con el servicio catastral.');
        }
        finally { setIsSearching(false); }
    }, [refCatastral, flyToAndHighlight]);

    // ─── Buscar rústica (via proxy backend) ───
    const searchRustica = useCallback(async () => {
        const { provincia, municipio, poligono, parcela } = rusticData;
        if (!provincia || !municipio || !poligono || !parcela) {
            setSearchError('Complete todos los campos.'); return;
        }
        setIsSearching(true);
        setParcelInfo(null);
        setSearchError(null);
        try {
            const resp = await fetch(`${API_BASE_URL}/catastro/buscar-rustica`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provincia, municipio, poligono, parcela }),
            });
            const data = await resp.json();
            if (data.encontrado) {
                setSearchError(null);
                flyToAndHighlight(data.lat, data.lon, `📍 Pol. ${poligono}, Par. ${parcela}<br/>🏷️ RC: ${data.rc}<br/>📐 ${municipio} (${provincia})`);
            } else {
                setSearchError(data.error || 'Parcela rústica no encontrada.');
            }
        } catch (err) {
            console.error(err);
            setSearchError('Error de conexión con el servicio catastral.');
        }
        finally { setIsSearching(false); }
    }, [rusticData, flyToAndHighlight]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        searchMode === 'ref' ? searchByRef() : searchRustica();
    };

    // ───────── RENDER ─────────
    return (
        <section id="mapa" className="py-20 bg-white">
            <div className="container mx-auto px-4 md:px-8">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold font-headline text-primary mb-3 uppercase tracking-tight">
                        Visor de Localización Técnica
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
                        Localice cualquier parcela catastral de España. Active la <strong>Máquina del Tiempo</strong> para comparar el parcelario histórico.
                    </p>
                </div>

                <div className="max-w-6xl mx-auto overflow-hidden rounded-xl border shadow-2xl bg-white">
                    {/* ── Barra de búsqueda ── */}
                    <div className="bg-slate-800 text-white px-4 py-3">
                        <form onSubmit={handleSearch} className="flex flex-col lg:flex-row items-end gap-3">
                            {/* Toggle ref/rústica */}
                            <div className="flex bg-slate-700 rounded-lg p-0.5 shrink-0">
                                <button type="button" onClick={() => setSearchMode('ref')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${searchMode === 'ref' ? 'bg-amber-500 text-black' : 'text-slate-300 hover:text-white'}`}>
                                    Ref. Catastral
                                </button>
                                <button type="button" onClick={() => setSearchMode('rustica')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${searchMode === 'rustica' ? 'bg-amber-500 text-black' : 'text-slate-300 hover:text-white'}`}>
                                    Rústica
                                </button>
                            </div>

                            {/* Campos */}
                            {searchMode === 'ref' ? (
                                <input type="text" value={refCatastral} onChange={(e) => setRefCatastral(e.target.value.toUpperCase())}
                                    placeholder="Referencia catastral (14-20 caracteres)..."
                                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 w-full"
                                    maxLength={20} />
                            ) : (
                                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
                                    {(['provincia', 'municipio', 'poligono', 'parcela'] as const).map(field => (
                                        <input key={field} type="text"
                                            value={rusticData[field]}
                                            onChange={(e) => setRusticData({ ...rusticData, [field]: e.target.value })}
                                            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                                            className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400" />
                                    ))}
                                </div>
                            )}

                            {/* Buscar */}
                            <button type="submit" disabled={isSearching}
                                className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 shrink-0 flex items-center gap-2">
                                {isSearching ? (
                                    <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Buscando...</>
                                ) : 'Localizar'}
                            </button>

                            <div className="hidden lg:block w-px h-8 bg-slate-600"></div>

                            {/* Controles capa */}
                            <div className="flex items-center gap-3 shrink-0">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input type="checkbox" checked={showCatastro} onChange={(e) => setShowCatastro(e.target.checked)} className="w-3.5 h-3.5 accent-amber-400" />
                                    <span className="text-xs text-slate-300">Catastro</span>
                                </label>
                                <input type="range" min={0} max={100} value={catastroOpacity * 100}
                                    onChange={(e) => setCatastroOpacity(parseInt(e.target.value) / 100)}
                                    className="w-14 h-1.5 rounded-full appearance-none cursor-pointer accent-amber-400"
                                    title={`Opacidad: ${Math.round(catastroOpacity * 100)}%`}
                                    style={{ background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${catastroOpacity * 100}%, #475569 ${catastroOpacity * 100}%, #475569 100%)` }} />
                            </div>
                        </form>
                    </div>

                    {/* ── Panel Máquina del Tiempo ── */}
                    <div className="bg-slate-700 text-white px-4 py-2 flex flex-col sm:flex-row items-center gap-3 border-t border-slate-600">
                        {/* Toggle activar/desactivar */}
                        <button
                            type="button"
                            onClick={() => setTimeEnabled(!timeEnabled)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${timeEnabled
                                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                                : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                                }`}
                        >
                            <span className="text-base">{timeEnabled ? '⏳' : '🕐'}</span>
                            Máquina del Tiempo
                        </button>

                        {/* Controles (solo visibles si está activada) */}
                        {timeEnabled && (
                            <div className="flex flex-1 items-center gap-3 w-full">
                                {/* Año badge */}
                                <span className="bg-amber-500/20 border border-amber-500/40 text-amber-400 px-2 py-0.5 rounded text-sm font-bold tabular-nums min-w-[50px] text-center">
                                    {selectedYear}
                                </span>

                                {/* Play/Pause */}
                                <button type="button" onClick={() => setIsPlaying(p => !p)}
                                    className="bg-slate-600 hover:bg-slate-500 rounded-full w-7 h-7 flex items-center justify-center text-xs transition-colors"
                                    title={isPlaying ? 'Pausar' : 'Reproducir'}>
                                    {isPlaying ? '⏸' : '▶'}
                                </button>

                                {/* Slider de año */}
                                <div className="flex items-center gap-2 flex-1">
                                    <span className="text-[10px] text-slate-400">{MIN_YEAR}</span>
                                    <input type="range" min={MIN_YEAR} max={CURRENT_YEAR} value={selectedYear}
                                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                        className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-amber-400"
                                        style={{ background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${((selectedYear - MIN_YEAR) / (CURRENT_YEAR - MIN_YEAR)) * 100}%, #475569 ${((selectedYear - MIN_YEAR) / (CURRENT_YEAR - MIN_YEAR)) * 100}%, #475569 100%)` }} />
                                    <span className="text-[10px] text-slate-400">{CURRENT_YEAR}</span>
                                </div>

                                {/* Opacidad histórica */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[10px] text-slate-400">Opac.</span>
                                    <input type="range" min={0} max={100} value={historicOpacity * 100}
                                        onChange={(e) => setHistoricOpacity(parseInt(e.target.value) / 100)}
                                        className="w-14 h-1.5 rounded-full appearance-none cursor-pointer accent-sky-400"
                                        style={{ background: `linear-gradient(to right, #38bdf8 0%, #38bdf8 ${historicOpacity * 100}%, #475569 ${historicOpacity * 100}%, #475569 100%)` }} />
                                </div>
                            </div>
                        )}

                        {!timeEnabled && (
                            <span className="text-[11px] text-slate-400 italic">
                                Active para comparar el parcelario catastral entre {MIN_YEAR} y {CURRENT_YEAR}
                            </span>
                        )}
                    </div>

                    {/* ── Error de búsqueda ── */}
                    {searchError && (
                        <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                                <span className="text-xs font-medium text-red-800">⚠️ {searchError}</span>
                            </div>
                            <button onClick={() => setSearchError(null)} className="text-xs text-red-500 hover:text-red-700 font-bold">✕</button>
                        </div>
                    )}

                    {/* ── Info parcela encontrada ── */}
                    {parcelInfo && (
                        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-medium text-emerald-800" dangerouslySetInnerHTML={{ __html: parcelInfo.replace(/<br\/>/g, ' · ') }} />
                            </div>
                            <a href={`https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCConCiwordsue.aspx?RefC=${refCatastral.trim().substring(0, 14)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="text-xs text-emerald-700 hover:text-emerald-900 underline">
                                Sede Catastro →
                            </a>
                        </div>
                    )}

                    {/* ── Mapa ── */}
                    <div ref={mapContainerRef} className="w-full" style={{ height: '550px' }} />

                    {/* ── Pie ── */}
                    <div className="bg-slate-50 px-4 py-2 flex flex-wrap items-center justify-between text-[11px] text-slate-400 border-t gap-2">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-2 border border-slate-400 bg-slate-200 rounded-sm"></div>
                                <span>Catastro Actual</span>
                            </div>
                            {timeEnabled && (
                                <div className="flex items-center gap-1.5">
                                    <div className="w-3 h-2 border border-amber-400 bg-amber-100 rounded-sm"></div>
                                    <span>Histórico ({selectedYear})</span>
                                </div>
                            )}
                        </div>
                        <span>© DG Catastro · IGN España · EPSG:3857</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
