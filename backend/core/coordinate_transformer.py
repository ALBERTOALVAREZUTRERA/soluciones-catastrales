"""
Transformador de coordenadas entre sistemas de referencia
Convierte UTM a Lat/Lon para visualización en mapas web
"""

from pyproj import Transformer
from typing import List, Tuple


class CoordinateTransformer:
    """Transforma coordenadas entre sistemas de referencia"""
    
    @staticmethod
    def utm_to_latlon(coords: List[Tuple[float, float]], epsg_utm: str = "25830") -> List[Tuple[float, float]]:
        """
        Convierte coordenadas UTM a Lat/Lon (EPSG:4326)
        
        Args:
            coords: Lista de tuplas (x, y) en UTM
            epsg_utm: Código EPSG fuente (25829, 25830, 25831, 32628)
        
        Returns:
            Lista de tuplas (lon, lat) en WGS84
        """
        # Sanitizar EPSG para evitar duplicados (ej: EPSG:EPSG:25830)
        clean_epsg = str(epsg_utm).upper().replace("EPSG:", "")
        
        # Crear transformador
        transformer = Transformer.from_crs(
            f"EPSG:{clean_epsg}",
            "EPSG:4326",
            always_xy=True
        )
        
        transformed = []
        for x, y in coords:
            lon, lat = transformer.transform(x, y)
            transformed.append((lon, lat))
        
        return transformed
    
    @staticmethod
    def latlon_to_utm(coords: List[Tuple[float, float]], epsg_utm: str = "25830") -> List[Tuple[float, float]]:
        """
        Convierte coordenadas Lat/Lon (EPSG:4326) a UTM
        
        Args:
            coords: Lista de tuplas (lon, lat) en WGS84
            epsg_utm: Código EPSG destino (25829, 25830, 25831, 32628)
        
        Returns:
            Lista de tuplas (x, y) en UTM
        """
        # Sanitizar EPSG para evitar duplicados
        clean_epsg = str(epsg_utm).upper().replace("EPSG:", "")
        
        transformer = Transformer.from_crs(
            "EPSG:4326",
            f"EPSG:{clean_epsg}",
            always_xy=True
        )
        
        transformed = []
        for lon, lat in coords:
            x, y = transformer.transform(lon, lat)
            transformed.append((x, y))
        
        return transformed
