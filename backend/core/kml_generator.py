"""
Generador de archivos KML para visualización en Google Earth.
Convierte parcelas procesadas a formato KML con estilos y descripciones.
"""

import simplekml
from typing import List, Optional
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


def generate_kml(
    parcels_data: List[dict],
    output_path: str,
    coordinate_system: str = "EPSG:25830"
) -> str:
    """
    Genera archivo KML desde datos de parcelas.
    
    Args:
        parcels_data: Lista de diccionarios con datos de parcelas
        output_path: Ruta donde guardar el archivo KML
        coordinate_system: Sistema de coordenadas de entrada (por defecto UTM 30N)
        
    Returns:
        Ruta al archivo KML generado
    """
    try:
        kml = simplekml.Kml()
        kml.document.name = "Parcelas Catastrales"
        kml.document.description = "Exportación de parcelas DXF a KML"
        
        # Estilos predefinidos
        style_correct = simplekml.Style()
        style_correct.linestyle.color = simplekml.Color.green
        style_correct.linestyle.width = 2
        style_correct.polystyle.color = simplekml.Color.changealphaint(100, simplekml.Color.green)
        
        style_conflict = simplekml.Style()
        style_conflict.linestyle.color = simplekml.Color.red
        style_conflict.linestyle.width = 3
        style_conflict.polystyle.color = simplekml.Color.changealphaint(100, simplekml.Color.red)
        
        style_hole = simplekml.Style()
        style_hole.linestyle.color = simplekml.Color.blue
        style_hole.linestyle.width = 2
        style_hole.polystyle.color = simplekml.Color.changealphaint(80, simplekml.Color.blue)
        
        for parcel in parcels_data:
            try:
                parcel_id = parcel.get('id', 'Sin ID')
                coords_latlon = parcel.get('coords_latlon', [])
                area = parcel.get('area', 0)
                ref_catastral = parcel.get('cadastral_reference', '')
                has_conflict = parcel.get('has_conflict', False)
                is_hole = parcel.get('is_hole', False)
                geometry_fixed = parcel.get('geometry_fixed', False)
                
                if not coords_latlon or len(coords_latlon) < 1:
                    logger.warning(f"Parcela {parcel_id} sin coordenadas, omitiendo")
                    continue
                
                # Crear polígono
                pol = kml.newpolygon(name=parcel_id)
                
                # Coordenadas exteriores (anillo principal)
                exterior_coords = coords_latlon[0]
                # KML espera formato (lon, lat, alt)
                pol.outerboundaryis = [(lon, lat, 0) for lon, lat in exterior_coords]
                
                # Huecos interiores si existen
                if len(coords_latlon) > 1:
                    inner_boundaries = []
                    for hole in coords_latlon[1:]:
                        inner_boundaries.append([(lon, lat, 0) for lon, lat in hole])
                    pol.innerboundaryis = inner_boundaries
                
                # Descripción HTML
                description_parts = [
                    f"<b>ID:</b> {parcel_id}<br/>",
                    f"<b>Área:</b> {area:.2f} m²<br/>"
                ]
                
                if ref_catastral:
                    description_parts.append(f"<b>Ref. Catastral:</b> {ref_catastral}<br/>")
                
                if geometry_fixed:
                    description_parts.append("<b>⚠ Geometría corregida automáticamente</b><br/>")
                
                if has_conflict:
                    description_parts.append("<b style='color:red'>⚠ CONFLICTO DETECTADO</b><br/>")
                
                if is_hole:
                    description_parts.append("<b style='color:blue'>Hueco interior</b><br/>")
                
                pol.description = ''.join(description_parts)
                
                # Aplicar estilo según tipo
                if has_conflict:
                    pol.style = style_conflict
                elif is_hole:
                    pol.style = style_hole
                else:
                    pol.style = style_correct
                    
            except Exception as e:
                logger.error(f"Error procesando parcela {parcel.get('id', 'unknown')}: {e}")
                continue
        
        # Guardar archivo
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        kml.save(str(output_path))
        
        logger.info(f"KML generado exitosamente: {output_path}")
        return str(output_path)
        
    except Exception as e:
        logger.error(f"Error generando KML: {e}")
        raise


def generate_kml_from_gml_features(
    features: List[dict],
    output_path: str,
    epsg: str = "25830"
) -> str:
    """
    Versión simplificada que recibe features del formato GmlFeature.
    
    Args:
        features: Lista de features con estructura GmlFeature
        output_path: Ruta de salida
        epsg: Sistema de coordenadas de origen
        
    Returns:
        Ruta al archivo generado
    """
    try:
        # Importar transformador de coordenadas
        from core.coordinate_transformer import CoordinateTransformer
        
        # Convertir features a formato parcels_data
        parcels_data = []
        
        for feature in features:
            geometry = feature.get('geometry', [])
            
            if not geometry or len(geometry) < 1:
                continue
            
            # Transformar coordenadas de UTM a WGS84 (Lat/Lon)
            coords_latlon = []
            
            for ring in geometry:
                # CoordinateTransformer.utm_to_latlon espera lista de tuplas [(x,y), ...]
                coords_utm = [(coord[0], coord[1]) for coord in ring]
                # Devuelve lista de tuplas (lon, lat) porque always_xy=True
                coords_wgs84 = CoordinateTransformer.utm_to_latlon(coords_utm, epsg)
                # coords_wgs84 ya está en formato (lon, lat), convertir a lista [lon, lat]
                coords_latlon.append([[lon, lat] for lon, lat in coords_wgs84])
            
            parcel_data = {
                'id': feature.get('id', 'Sin ID'),
                'coords_latlon': coords_latlon,
                'area': feature.get('area', 0),
                'cadastral_reference': feature.get('cadastralReference', ''),
                'has_conflict': feature.get('hasConflict', False),
                'is_hole': feature.get('isHole', False),
                'geometry_fixed': feature.get('geometryFixed', False)
            }
            
            parcels_data.append(parcel_data)
        
        return generate_kml(parcels_data, output_path)
        
    except Exception as e:
        logger.error(f"Error en generate_kml_from_gml_features: {e}")
        raise
