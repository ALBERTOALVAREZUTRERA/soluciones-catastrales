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
        for i, p1 in enumerate(parcelas):
            # Los huecos no generan conflictos
            if p1.is_hole:
                continue
            
            try:
                poly1 = Polygon(p1.coordenadas)
                
                # Validar geometría
                if not poly1.is_valid:
                    from shapely import make_valid
                    poly1 = make_valid(poly1)
                
            except Exception as e:
                print(f"Error creando polígono para parcela {i}: {e}")
                continue
            
            for j, p2 in enumerate(parcelas):
                if i == j or p2.is_hole:
                    continue
                
                try:
                    poly2 = Polygon(p2.coordenadas)
                    
                    if not poly2.is_valid:
                        from shapely import make_valid
                        poly2 = make_valid(poly2)
                    
                    # Calcular intersección
                    intersection = poly1.intersection(poly2)
                    
                    # Si área > 0.1m² y NO es contenido totalmente -> Conflicto
                    if intersection.area > 0.1:
                        # Verificar si p2 está totalmente dentro de p1 (hueco válido)
                        # Si poly1.contains(poly2) es True, entonces p2 es un hueco de p1 (válido)
                        if not poly1.contains(poly2) and not poly2.contains(poly1):
                            # Solape parcial: CONFLICTO
                            p1.has_conflict = True
                            p2.has_conflict = True
                            print(f"CONFLICTO detectado entre parcelas {i} y {j}: {intersection.area:.2f}m²")
                
                except Exception as e:
                    print(f"Error detectando conflicto entre {i} y {j}: {e}")
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
                    print(f"Marcada parcela {hijo_idx} como hueco interior de {padre_idx}")
        
        return parcelas
