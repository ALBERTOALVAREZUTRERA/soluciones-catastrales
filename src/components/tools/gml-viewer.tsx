import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';
import proj4 from 'proj4';
import { GmlFeature } from '@/lib/gml-utils';

// Fix Leaflet icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Define CRS for reprojection
proj4.defs("EPSG:25829", "+proj=utm +zone=29 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
proj4.defs("EPSG:25830", "+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
proj4.defs("EPSG:25831", "+proj=utm +zone=31 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
proj4.defs("EPSG:32628", "+proj=utm +zone=28 +datum=WGS84 +units=m +no_defs");

interface GmlViewerProps {
    features: GmlFeature[];
    crs: string;
}

// MEJORA 4: Función para determinar el estilo según el estado de la parcela
function getParcelStyle(properties: any): L.PathOptions {
    if (properties.hasConflict) {
        return {
            color: '#8B0000', // Rojo oscuro
            fillColor: '#ff0000',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.5,
            className: 'blink-border' // Animación CSS
        };
    }

    if (properties.isHole) {
        return {
            color: '#000080', // Azul marino
            fillColor: '#0064ff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.4
        };
    }

    // Parcela correcta (por defecto)
    return {
        color: '#006400', // Verde oscuro
        fillColor: '#00c800',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.35
    };
}

export default function GmlViewer({ features, crs }: GmlViewerProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
    const verticesLayerRef = useRef<L.LayerGroup | null>(null); // NUEVA CAPA PARA VÉRTICES
    const legendRef = useRef<L.Control | null>(null);
    const [showVertices, setShowVertices] = useState(false); // ESTADO PARA MOSTRAR/OCULTAR

    useEffect(() => {
        if (!mapContainerRef.current) return;

        // 1. Initialize Map if not exists
        if (!mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, {
                maxZoom: 22  // Permitir zoom hasta ~1 metro
            }).setView([40.4168, -3.7038], 6);

            // Base Layers
            const pnoa = L.tileLayer.wms("https://www.ign.es/wms-inspire/pnoa-ma", {
                layers: 'OI.OrthoimageCoverage',
                format: 'image/png',
                transparent: false,
                attribution: 'PNOA © IGN',
                maxZoom: 22,
                maxNativeZoom: 20  // Zoom nativo del servicio
            }).addTo(map);

            const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '© OpenStreetMap',
                maxZoom: 22,
                maxNativeZoom: 19  // Zoom nativo de OSM
            });

            // Overlay
            const catastro = L.tileLayer.wms("http://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx", {
                layers: 'Catastro',
                format: 'image/png',
                transparent: true,
                attribution: 'DG Catastro',
                maxZoom: 22,
                maxNativeZoom: 20  // Zoom nativo del WMS Catastro
            }).addTo(map);

            // Layers Control
            L.control.layers(
                { "PNOA (Imagen)": pnoa, "Callejero (OSM)": osm },
                { "Catastro": catastro }
            ).addTo(map);

            L.control.scale().addTo(map);

            // MEJORA 4: Añadir leyenda de mapa
            const legend = (L as any).control({ position: 'bottomright' });
            legend.onAdd = function () {
                const div = L.DomUtil.create('div', 'map-legend');
                div.innerHTML = `
                    <h4>Leyenda</h4>
                    <div class="map-legend-item">
                        <span class="legend-color green"></span>
                        Parcelas correctas
                    </div>
                    <div class="map-legend-item">
                        <span class="legend-color blue"></span>
                        Huecos interiores
                    </div>
                    <div class="map-legend-item">
                        <span class="legend-color red blink"></span>
                        Conflictos/Solapes
                    </div>
                    <div class="map-legend-divider"></div>
                    <button 
                        id="toggle-vertices-btn" 
                        class="map-legend-button"
                        style="margin-top: 8px; padding: 6px 12px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; width: 100%;"
                    >
                        🔘 Mostrar Vértices
                    </button>
                `;
                return div;
            };
            legend.addTo(map);
            legendRef.current = legend;

            mapInstanceRef.current = map;
        }

        // Cleanup on unmount
        return () => {
            if (mapInstanceRef.current) {
                if (legendRef.current) {
                    mapInstanceRef.current.removeControl(legendRef.current);
                }
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                geoJsonLayerRef.current = null;
                legendRef.current = null;
            }
        };
    }, []);

    // 2. Update Features/GeoJSON with Reprojection
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !features || features.length === 0) return;

        // Clear previous layer
        if (geoJsonLayerRef.current) {
            map.removeLayer(geoJsonLayerRef.current);
        }

        try {
            // Reproject coordinates from CRS (UTM) to WGS84 (Lat/Lng)
            const reprojectFeatures = features.map(f => {
                if (!f.geometry || !Array.isArray(f.geometry)) {
                    console.warn(`Feature ${f.id} has no valid geometry:`, f);
                    return null;
                }

                const reprojectedGeometry = f.geometry.map(ring => {
                    return ring.map(coord => {
                        // proj4(source, dest, point) -> returns [lon, lat]
                        // Leaflet GeoJSON expects [lon, lat] (GeoJSON standard)
                        const wgs84 = proj4(crs, "EPSG:4326", [coord[0], coord[1]]);
                        return wgs84;
                    });
                });

                return {
                    type: "Feature",
                    properties: {
                        id: f.id,
                        area: f.area,
                        // NUEVOS CAMPOS para visualización diferenciada
                        hasConflict: f.hasConflict || false,
                        isHole: f.isHole || false,
                        cadastralReference: f.cadastralReference,
                        capaOrigen: f.capaOrigen
                    },
                    geometry: {
                        type: "Polygon",
                        coordinates: reprojectedGeometry
                    }
                };
            });

            const geoJsonData = {
                type: "FeatureCollection",
                features: reprojectFeatures
            };

            // Add new layer with dynamic styling
            const geoLayer = L.geoJSON(geoJsonData as any, {
                style: (feature) => {
                    return getParcelStyle(feature?.properties || {});
                },
                onEachFeature: (feature, layer) => {
                    if (feature.properties) {
                        const props = feature.properties;
                        let statusText = '';

                        if (props.hasConflict) {
                            statusText = '<span style="color: red; font-weight: bold;">⚠ CONFLICTO DETECTADO</span><br/>';
                        } else if (props.isHole) {
                            statusText = '<span style="color: blue;">🔵 Hueco interior</span><br/>';
                        } else {
                            statusText = '<span style="color: green;">✓ Parcela correcta</span><br/>';
                        }

                        layer.bindPopup(`
                            ${statusText}
                            <strong>ID:</strong> ${props.id}<br/>
                            ${props.cadastralReference ? `<strong>Ref. Catastral:</strong> ${props.cadastralReference}<br/>` : ''}
                            <strong>Área:</strong> ${Math.round(props.area)} m²<br/>
                            ${props.capaOrigen ? `<strong>Capa:</strong> ${props.capaOrigen}` : ''}
                        `);
                    }
                }
            }).addTo(map);

            geoJsonLayerRef.current = geoLayer;

            // Fit bounds
            const bounds = geoLayer.getBounds();
            if (bounds.isValid()) {
                map.fitBounds(bounds);
            }

            // RENDERIZAR VÉRTICES NUMERADOS
            renderVertices(map, reprojectFeatures, showVertices);

        } catch (error) {
            console.error("Error updating map features:", error);
        }
    }, [features, crs, showVertices]); // Añadir showVertices a dependencias

    // Función para renderizar vértices numerados
    const renderVertices = (map: L.Map, reprojectFeatures: any[], show: boolean) => {
        // Limpiar capa anterior
        if (verticesLayerRef.current) {
            map.removeLayer(verticesLayerRef.current);
            verticesLayerRef.current = null;
        }

        if (!show) return;

        const verticesLayer = L.layerGroup();

        reprojectFeatures.forEach((feature, featureIdx) => {
            if (feature.geometry && feature.geometry.coordinates) {
                // Procesar anillo exterior (índice 0)
                const exteriorRing = feature.geometry.coordinates[0];
                exteriorRing.forEach((coord: number[], vertexIdx: number) => {
                    // Saltar último punto (duplicado del primero en polígonos cerrados)
                    if (vertexIdx === exteriorRing.length - 1) return;

                    const marker = L.circleMarker([coord[1], coord[0]], {
                        radius: 2,
                        fillColor: '#ff0000',
                        color: '#ff0000',
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 1
                    });

                    // Tooltip permanente con el número al lado
                    marker.bindTooltip(`${vertexIdx + 1}`, {
                        permanent: true,
                        direction: 'right',
                        className: 'vertex-label',
                        offset: [8, 0]  // 8px a la derecha del punto
                    });

                    // Popup con coordenadas
                    marker.bindPopup(`
                        <strong>Vértice ${vertexIdx + 1}</strong><br/>
                        <strong>Parcela:</strong> ${feature.properties.id}<br/>
                        <strong>Lon:</strong> ${coord[0].toFixed(6)}<br/>
                        <strong>Lat:</strong> ${coord[1].toFixed(6)}
                    `);

                    marker.addTo(verticesLayer);
                });

                // Procesar huecos interiores (índices 1+)
                if (feature.geometry.coordinates.length > 1) {
                    feature.geometry.coordinates.slice(1).forEach((hole: number[][], holeIdx: number) => {
                        hole.forEach((coord: number[], vertexIdx: number) => {
                            if (vertexIdx === hole.length - 1) return;

                            const marker = L.circleMarker([coord[1], coord[0]], {
                                radius: 2,
                                fillColor: '#ff0000',
                                color: '#ff0000',
                                weight: 1,
                                opacity: 1,
                                fillOpacity: 1
                            });

                            marker.bindTooltip(`H${holeIdx + 1}-${vertexIdx + 1}`, {
                                permanent: true,
                                direction: 'right',
                                className: 'vertex-label',
                                offset: [8, 0]  // 8px a la derecha del punto
                            });

                            marker.bindPopup(`
                                <strong>Hueco ${holeIdx + 1} - Vértice ${vertexIdx + 1}</strong><br/>
                                <strong>Parcela:</strong> ${feature.properties.id}<br/>
                                <strong>Lon:</strong> ${coord[0].toFixed(6)}<br/>
                                <strong>Lat:</strong> ${coord[1].toFixed(6)}
                            `);

                            marker.addTo(verticesLayer);
                        });
                    });
                }
            }
        });

        verticesLayer.addTo(map);
        verticesLayerRef.current = verticesLayer;
    };

    // Manejar click en botón de vértices
    useEffect(() => {
        const handleToggleVertices = () => {
            setShowVertices(prev => !prev);
            const btn = document.getElementById('toggle-vertices-btn');
            if (btn) {
                btn.textContent = !showVertices ? '🔘 Ocultar Vértices' : '🔘 Mostrar Vértices';
            }
        };

        const btn = document.getElementById('toggle-vertices-btn');
        if (btn) {
            btn.addEventListener('click', handleToggleVertices);
        }

        return () => {
            if (btn) {
                btn.removeEventListener('click', handleToggleVertices);
            }
        };
    }, [showVertices]);

    return (
        <div ref={mapContainerRef} className="h-[500px] w-full border rounded-lg overflow-hidden relative z-0" />
    );
}
