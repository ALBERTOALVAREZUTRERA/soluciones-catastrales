"""
Detector de conflictos topológicos entre parcelas
MEJORA 2: Detecta solapes no válidos (que no sean huecos contenidos)
"""

from shapely.geometry import Polygon
from typing import List
from .parcel_model import ParcelaInfo


class ConflictDetector:
    """Detecta solapes no válidos entre parcelas"""
    
    @staticmethod
    def detectar_conflictos(parcelas: List[ParcelaInfo]) -> List[ParcelaInfo]:
        """
        Marca parcelas con has_conflict=True si:
        - Se solapan con otra parcela
        - NO es un hueco contenido totalmente (esos son válidos)
        
        Args:
            parcelas: Lista de ParcelaInfo a analizar
            
        Returns:
            Lista de ParcelaInfo con flags has_conflict actualizados
        """
        for parcela in parcelas:
            parcela.has_conflict = False

        for i, p1 in enumerate(parcelas):
            # Los huecos no generan conflictos
            if p1.is_hole:
                continue
            
            try:
                poly1 = Polygon(p1.coordenadas, p1.interiores)
                if not poly1.is_valid or poly1.is_empty:
                    p1.has_conflict = True
                    continue
            except Exception:
                p1.has_conflict = True
                continue

            for j in range(i + 1, len(parcelas)):
                p2 = parcelas[j]
                if p2.is_hole:
                    continue

                try:
                    poly2 = Polygon(p2.coordenadas, p2.interiores)
                    if not poly2.is_valid or poly2.is_empty:
                        p2.has_conflict = True
                        continue
                    intersection = poly1.intersection(poly2)

                    if intersection.area > 0.1:
                        p1.has_conflict = True
                        p2.has_conflict = True
                except Exception:
                    p1.has_conflict = True
                    p2.has_conflict = True
                    continue
        
        return parcelas
    
    @staticmethod
    def marcar_huecos(parcelas: List[ParcelaInfo], anidamientos: dict) -> List[ParcelaInfo]:
        """
        Marca las parcelas que son huecos interiores basándose en el diccionario de anidamientos
        
        Args:
            parcelas: Lista de ParcelaInfo
            anidamientos: Dict {indice_padre: [indices_hijos]} del DXFReader.detect_nesting()
            
        Returns:
            Lista de ParcelaInfo con flags is_hole actualizados
        """
        for padre_idx, hijos_idx in anidamientos.items():
            for hijo_idx in hijos_idx:
                if hijo_idx < len(parcelas):
                    parcelas[hijo_idx].is_hole = True

        return parcelas
