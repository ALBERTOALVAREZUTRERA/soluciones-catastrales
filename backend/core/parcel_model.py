
import re
from datetime import datetime
from typing import Optional, List, Tuple, Dict
from dataclasses import dataclass, field

def sanitizar_nombre_catastral(nombre: str) -> str:
    """
    Sanitiza un nombre para que sea válido como identificador catastral.
    Reemplaza espacios y caracteres especiales por guiones bajos.
    
    Args:
        nombre: Nombre original a sanitizar
        
    Returns:
        Nombre sanitizado sin espacios ni caracteres especiales
    """
    if not nombre or not isinstance(nombre, str):
        return "parcela_desconocida"
    
    # Eliminar espacios al inicio y final
    nombre = nombre.strip()
    
    # Si después de trim queda vacío
    if not nombre:
        return "parcela_desconocida"
    
    # Reemplazar múltiples espacios por un solo guión bajo
    nombre = re.sub(r'\s+', '_', nombre)
    
    # Normalizar unicode (eliminar tildes)
    import unicodedata
    nombre = unicodedata.normalize('NFKD', nombre).encode('ascii', 'ignore').decode('ascii')
    
    # Reemplazar caracteres no alfanuméricos (excepto guión bajo) por nada
    # Ahora solo permitimos A-Z, 0-9 y _
    nombre = re.sub(r'[^a-zA-Z0-9_]', '', nombre)
    
    # Eliminar múltiples guiones bajos consecutivos
    nombre = re.sub(r'_+', '_', nombre)
    
    # Eliminar guiones bajos al inicio o final
    nombre = nombre.strip('_')
    
    # Convertir a mayúsculas (convención Catastro)
    nombre = nombre.upper()
    
    # Si el nombre queda vacío, usar uno por defecto
    if not nombre:
        nombre = "PARCELA_DESCONOCIDA"
    
    return nombre

@dataclass
class ParcelaInfo:
    """Clase para almacenar información de una parcela o edificio"""
    referencia_catastral: str = ""
    nombre_archivo: str = "" # Nombre del archivo origen o texto encontrado
    area: float = 0.0
    coordenadas: List[Tuple[float, float]] = field(default_factory=list)
    centroide: Tuple[float, float] = (0.0, 0.0)
    punto_referencia: Tuple[float, float] = (0.0, 0.0)  # Añadido para compatibilidad con dxf_reader
    errores: List[str] = field(default_factory=list)
    
    # Nuevo campo para distinguir tipo
    tipo_entidad: str = "CP" # CP = CadastralParcel, BU = Building
    
    # Soporte para huecos (lista de listas de coordenadas)
    interiores: List[List[Tuple[float, float]]] = field(default_factory=list)
    
    # Soporte para Geometrías Disjuntas (Multi-Patch)
    # Lista de diccionarios: [{'exterior': [...], 'huecos': [[...], ...]}, ...]
    partes: List[Dict] = field(default_factory=list)
    
    # Campos auxiliares
    nombre_original: str = ""
    capa_origen: str = "" # Nombre de la capa (PG-LP vs PG-LI)
    
    # NUEVOS CAMPOS PARA WEB API (MEJORAS)
    has_conflict: bool = False  # MEJORA 2: Flag de conflicto/solape
    is_hole: bool = False  # Identifica si es un hueco interior
    coords_latlon: List[Tuple[float, float]] = field(default_factory=list)  # Coordenadas en Lat/Lon para frontend
    
    def __post_init__(self):
        # Guardar nombre original antes de sanitizar
        if self.nombre_archivo and not self.nombre_original:
            self.nombre_original = self.nombre_archivo
    
    @property
    def identificador(self) -> str:
        """Obtiene el identificador sanitizado para el GML"""
        if self.referencia_catastral:
            # Las referencias catastrales ya deben venir sin espacios
            return sanitizar_nombre_catastral(self.referencia_catastral)
        
        # Para nombres sin referencia, sanitizar
        if self.nombre_archivo:
            return sanitizar_nombre_catastral(self.nombre_archivo)
        
        return f"PARCELA_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    @property
    def tiene_referencia(self) -> bool:
        """Verifica si tiene referencia catastral"""
        return bool(self.referencia_catastral)
    
    @property
    def nombre_archivo_sanitizado(self) -> str:
        """Devuelve el nombre de archivo sanitizado"""
        if self.nombre_archivo:
            return sanitizar_nombre_catastral(self.nombre_archivo)
        return "parcela"
