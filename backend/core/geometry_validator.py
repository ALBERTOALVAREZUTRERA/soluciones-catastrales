"""
Módulo de validación y corrección automática de geometrías.
Detecta y corrige self-intersections, bowties y otras invalideces geométricas.
"""

from shapely.geometry import Polygon, MultiPolygon, Point
from shapely.validation import make_valid
from typing import List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


def fix_geometry(coords: List[List[float]], polygon_id: str = "unknown") -> Tuple[List[List[float]], bool, Optional[str]]:
    """
    Detecta y corrige geometrías inválidas usando Shapely.
    
    Args:
        coords: Lista de coordenadas [[x1,y1], [x2,y2], ...]
        polygon_id: Identificador del polígono para logging
    
    Returns:
        (coords_corregidas, fue_reparado, mensaje_error)
    """
    try:
        if not coords or len(coords) < 3:
            return coords, False, "Insuficientes coordenadas para formar un polígono"
        
        # Crear polígono de Shapely
        poly = Polygon(coords)
        
        # Verificar validez
        if poly.is_valid:
            logger.debug(f"Geometría {polygon_id} es válida")
            return coords, False, None
        
        # Geometría inválida - registrar razón
        reason = poly.is_valid_reason if hasattr(poly, 'is_valid_reason') else "Unknown"
        logger.warning(f"Geometría {polygon_id} inválida: {reason}")
        
        # Aplicar corrección automática
        fixed = make_valid(poly)
        
        if fixed is None or fixed.is_empty:
            logger.error(f"No se pudo reparar geometría {polygon_id}")
            return coords, False, "Geometría irreparable"
        
        # Manejar diferentes tipos de resultado
        if isinstance(fixed, Polygon):
            # Polígono simple corregido
            fixed_coords = list(fixed.exterior.coords)
            logger.info(f"✓ Geometría {polygon_id} reparada (Polygon)")
            return fixed_coords, True, None
            
        elif isinstance(fixed, MultiPolygon):
            # Se dividió en múltiples polígonos - tomar el más grande
            largest = max(fixed.geoms, key=lambda p: p.area)
            fixed_coords = list(largest.exterior.coords)
            logger.warning(f"⚠ Geometría {polygon_id} generó MultiPolygon, tomando el mayor")
            return fixed_coords, True, "Se generó MultiPolygon, se tomó el polígono más grande"
            
        else:
            # Tipo inesperado
            logger.error(f"Tipo inesperado después de make_valid: {type(fixed)}")
            return coords, False, f"Tipo inesperado: {type(fixed).__name__}"
            
    except Exception as e:
        logger.error(f"Error corrigiendo geometría {polygon_id}: {e}")
        return coords, False, str(e)


def validate_polygon_simple(coords: List[List[float]]) -> bool:
    """
    Validación rápida de polígono sin corrección.
    
    Args:
        coords: Lista de coordenadas
        
    Returns:
        True si es válido, False en caso contrario
    """
    try:
        if not coords or len(coords) < 3:
            return False
        
        poly = Polygon(coords)
        return poly.is_valid
        
    except Exception:
        return False


def get_polygon_area(coords: List[List[float]]) -> float:
    """
    Calcula el área de un polígono.
    
    Args:
        coords: Lista de coordenadas
        
    Returns:
        Área en unidades² del sistema de coordenadas
    """
    try:
        poly = Polygon(coords)
        return poly.area
    except Exception:
        return 0.0


def fix_geometry_with_holes(
    exterior: List[List[float]], 
    holes: List[List[List[float]]] = None,
    polygon_id: str = "unknown"
) -> Tuple[List[List[float]], List[List[List[float]]], bool, Optional[str]]:
    """
    Corrige geometría que puede tener huecos interiores.
    
    Args:
        exterior: Coordenadas del anillo exterior
        holes: Lista de coordenadas de huecos interiores
        polygon_id: Identificador para logging
        
    Returns:
        (exterior_corregido, holes_corregidos, fue_reparado, mensaje_error)
    """
    try:
        # Corregir exterior
        fixed_exterior, exterior_repaired, error = fix_geometry(exterior, f"{polygon_id}_exterior")
        
        if error and not exterior_repaired:
            return exterior, holes or [], False, error
        
        # Corregir huecos si existen
        fixed_holes = []
        holes_repaired = False
        
        if holes:
            for i, hole in enumerate(holes):
                fixed_hole, hole_repaired, hole_error = fix_geometry(hole, f"{polygon_id}_hole_{i}")
                
                if hole_repaired:
                    holes_repaired = True
                    
                if not hole_error:
                    fixed_holes.append(fixed_hole)
                else:
                    logger.warning(f"Descartando hueco {i} de {polygon_id}: {hole_error}")
        
        was_repaired = exterior_repaired or holes_repaired
        
        return fixed_exterior, fixed_holes, was_repaired, None
        
    except Exception as e:
        logger.error(f"Error corrigiendo geometría con huecos {polygon_id}: {e}")
        return exterior, holes or [], False, str(e)
