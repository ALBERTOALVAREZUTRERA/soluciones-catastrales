
import ezdxf
from typing import List, Tuple, Optional, Dict
from core.parcel_model import ParcelaInfo, sanitizar_nombre_catastral

class DXFReader:
    """Lector de archivos DXF para catastro"""
    
    @staticmethod
    def obtener_capas_con_detalle(ruta_dxf: str) -> List[Tuple[str, int, int]]:
        """
        Devuelve lista de (nombre_capa, num_geometrias, num_textos).
        Geometrías incluye: LWPOLYLINE, POLYLINE, LINE (cerradas o no, para dar pistas)
        Textos incluye: TEXT, MTEXT
        """
        try:
            doc = ezdxf.readfile(ruta_dxf)
            msp = doc.modelspace()
            
            # Contadores por capa
            layer_stats = {} # nombre -> {'geom': 0, 'text': 0}
            
            for layer in doc.layers:
                name = layer.dxf.name
                layer_stats[name] = {'geom': 0, 'text': 0}
                
            # Iterar entidades (optimizado via query es mejor si hay muchas, pero iterar todo asegura cubrir todo)
            # Para velocidad en archivos grandes, usaremos queries agrupadas por tipo si es posible,
            # pero ezdxf itera bien. Probemos iterar msp que es un generador.
            
            for e in msp:
                layer = e.dxf.layer
                dxftype = e.dxftype()
                
                if layer not in layer_stats:
                    layer_stats[layer] = {'geom': 0, 'text': 0}
                
                if dxftype in ['LWPOLYLINE', 'POLYLINE', 'LINE']:
                    layer_stats[layer]['geom'] += 1
                elif dxftype in ['TEXT', 'MTEXT']:
                    layer_stats[layer]['text'] += 1
            
            # Convertir a lista ordenada
            result = []
            for name, stats in layer_stats.items():
                # Eliminada la exclusión estricta de "LI" para permitir capas de edificios
                result.append((name, stats['geom'], stats['text']))
                
            return sorted(result)
            
        except Exception as e:
            raise Exception(f"Error analizando capas: {e}")

    @staticmethod
    def obtener_capas(ruta_dxf: str) -> List[str]:
        # Deprecated/Simple wrapper
        return [l[0] for l in DXFReader.obtener_capas_con_detalle(ruta_dxf)]

    @staticmethod
    def leer_borde_parcelas(ruta_dxf: str, capas_parcelas: List[str], capa_textos: str) -> List[ParcelaInfo]:
        """
        Lee el DXF y extrae las parcelas cruzando geometrías con textos.
        capas_parcelas: Lista de nombres de capas de geometría (e.g. ['PG-LP', 'PG-LI'])
        """
        import os
        nombre_base_dxf = os.path.splitext(os.path.basename(ruta_dxf))[0]
        
        # Compatibilidad hacia atrás si pasan un string
        if isinstance(capas_parcelas, str):
            capas_parcelas = [capas_parcelas]
            
        try:
            doc = ezdxf.readfile(ruta_dxf)
            msp = doc.modelspace()
            
            parcelas = []
            todos_textos = []

            # 3. Extraer Textos (Una sola vez para todas las geometrías)
            if capa_textos:
                textos = msp.query(f'TEXT[layer=="{capa_textos}"]')
                textos_m = msp.query(f'MTEXT[layer=="{capa_textos}"]')
                todos_textos = list(textos) + list(textos_m)
            
            # Iterar sobre las capas de geometría
            for capa in capas_parcelas:
                # CORRECCIÓN CRÍTICA: PG-LI son divisiones interiores VÁLIDAS
                # NO ignorar, son parte importante de la parcela
                # Extraer Polilíneas de esta capa
                lw_polys = msp.query(f'LWPOLYLINE[layer=="{capa}"]')
                legacy_polys = msp.query(f'POLYLINE[layer=="{capa}"]')
                polilineas = list(lw_polys) + list(legacy_polys)
                
                # Procesar cada polilínea
                for i, poly in enumerate(polilineas):
                    # Verificar si está cerrada
                    is_closed = poly.is_closed
                    
                    # Obtener puntos según el tipo
                    if poly.dxftype() == 'LWPOLYLINE':
                       puntos_raw = poly.get_points()
                       coordenadas = [(p[0], p[1]) for p in puntos_raw]
                    else:
                       coordenadas = [(v.dxf.location.x, v.dxf.location.y) for v in poly.vertices]
                    
                    # Solo admitir anillos declarados como cerrados o cuyos
                    # extremos coincidan dentro de una tolerancia topográfica.
                    if len(coordenadas) > 2:
                        start = coordenadas[0]
                        end = coordenadas[-1]
                        endpoint_distance = (
                            (end[0] - start[0]) ** 2
                            + (end[1] - start[1]) ** 2
                        ) ** 0.5
                        if is_closed or endpoint_distance <= 0.05:
                            if start != end:
                                coordenadas.append(start)
                            is_closed = True

                    if not is_closed or len(set(coordenadas[:-1])) < 3:
                        continue
                    
                    # Crear parcela preliminar
                    parcela = ParcelaInfo()
                    parcela.coordenadas = coordenadas
                    parcela.area = DXFReader.calcular_area(coordenadas)
                    parcela.punto_referencia = DXFReader.calcular_centroide(coordenadas)
                    parcela.capa_origen = capa # GUARDAR CAPA ORIGEN
                    
                    # Buscar texto dentro del polígono
                    referencia = DXFReader.buscar_texto_dentro(parcela, todos_textos)
                    
                    if referencia:
                        referencia_limpia = referencia.replace(" ", "").upper()
                        if len(referencia_limpia) in [14, 18, 20] and referencia_limpia.isalnum():
                            parcela.referencia_catastral = referencia_limpia
                            parcela.nombre_archivo = referencia_limpia
                        else:
                            parcela.referencia_catastral = None
                            parcela.nombre_archivo = referencia
                    else:
                        # Naming fallback
                        # 1. Intentar usar el nombre del archivo si parece una RC (14 caracteres)
                        nombre_limpio = nombre_base_dxf.strip().upper()
                        # Validación simple de RC: 14 caracteres alfanuméricos (o 20)
                        es_rc_valida = (
                            len(nombre_limpio) in (14, 18, 20)
                            and nombre_limpio.isalnum()
                        )
                        
                        if es_rc_valida:
                             parcela.referencia_catastral = nombre_limpio
                             parcela.nombre_archivo = nombre_limpio
                        else:
                             # Caso Local / Nombre de archivo genérico
                             parcela.referencia_catastral = None
                             
                             # Si es un solo objeto, el nombre es el archivo
                             if len(polilineas) == 1 and len(capas_parcelas) == 1:
                                 nombre = nombre_base_dxf
                             else:
                                 # Multiples objetos: Nombre + Indice para diferenciar (si no se agrupan luego)
                                 # El usuario pide: ES.LOCAL.CP.NOMBRE_ARCHIVO
                                 # Si hay VARIAS, deberían ser Partes del mismo...
                                 # Vamos a asumir que si no es RC, también queremos agrupar por nombre de archivo
                                 # pero cuidado con IDs duplicados si no se agrupan.
                                 # La agrupación se hace en main_window por identificador.
                                 # ASÍ QUE USAMOS EL MISMO NOMBRE BASE
                                 nombre = nombre_base_dxf
                                 
                             parcela.nombre_archivo = nombre
                    
                    parcelas.append(parcela)
                
            return parcelas
            
        except Exception as e:
            raise Exception(f"Error al leer DXF: {str(e)}")

    @staticmethod
    def calcular_area(
        coordenadas: List[Tuple[float, float]],
        interiores: Optional[List[List[Tuple[float, float]]]] = None,
    ) -> float:
        """Calcula el área usando la fórmula de Gauss (Shoelace format)"""
        from shapely.geometry import Polygon

        try:
            return float(Polygon(coordenadas, interiores or []).area)
        except Exception:
            return 0.0

    @staticmethod
    def calcular_centroide(coordenadas: List[Tuple[float, float]]) -> Tuple[float, float]:
        """Calcula un punto representativo situado dentro del polígono."""
        if not coordenadas:
            return (0.0, 0.0)
        try:
            from shapely.geometry import Polygon
            point = Polygon(coordenadas).representative_point()
            return (point.x, point.y)
        except Exception:
            return (0.0, 0.0)

    @staticmethod
    def buscar_texto_dentro(parcela: ParcelaInfo, textos_dxf) -> Optional[str]:
        """
        Busca si algún texto del DXF cae dentro de la parcela.
        Usa un algoritmo simple de 'punto en polígono' (Ray Casting).
        """
        # Optimización: primero comprobar Bounding Box
        min_x = min(c[0] for c in parcela.coordenadas)
        max_x = max(c[0] for c in parcela.coordenadas)
        min_y = min(c[1] for c in parcela.coordenadas)
        max_y = max(c[1] for c in parcela.coordenadas)
        
        for texto in textos_dxf:
            # Obtener punto de inserción del texto
            p = texto.dxf.insert
            tx, ty = p[0], p[1]
            
            # Check rápido de Bounding Box
            if not (min_x <= tx <= max_x and min_y <= ty <= max_y):
                continue
                
            # Check preciso: Ray Casting
            if DXFReader.punto_en_poligono(tx, ty, parcela.coordenadas):
                # Devolver el contenido del texto limpio
                contenido = texto.dxf.text if texto.dxftype() == 'TEXT' else texto.text
                return contenido.strip()
                
        return None

    @staticmethod
    def detect_nesting(parcelas: List[ParcelaInfo]) -> Dict[int, List[int]]:
        """
        Detecta qué parcelas están contenidas dentro de otras.
        Devuelve un diccionario: {indice_padre: [indices_hijos]}
        Las parcelas hijas se consideran agujeros potenciales.
        """
        from shapely.geometry import Polygon

        polygons = []
        for parcela in parcelas:
            try:
                polygon = Polygon(parcela.coordenadas, parcela.interiores)
                polygons.append(polygon if polygon.is_valid else None)
            except Exception:
                polygons.append(None)

        has_explicit_interior_layers = any(
            "LI" in (parcela.capa_origen or "").upper()
            for parcela in parcelas
        )
        immediate_parent: Dict[int, int] = {}

        for child_index, child_polygon in enumerate(polygons):
            if child_polygon is None or child_polygon.is_empty:
                continue
            child_layer = (parcelas[child_index].capa_origen or "").upper()
            if has_explicit_interior_layers and "LI" not in child_layer:
                continue

            possible_parents = []
            for parent_index, parent_polygon in enumerate(polygons):
                if parent_index == child_index or parent_polygon is None:
                    continue
                parent_layer = (parcelas[parent_index].capa_origen or "").upper()
                if has_explicit_interior_layers and "LI" in parent_layer:
                    continue
                if (
                    parent_polygon.area > child_polygon.area
                    and parent_polygon.contains(child_polygon)
                ):
                    possible_parents.append(parent_index)

            if possible_parents:
                parent_index = min(
                    possible_parents,
                    key=lambda index: polygons[index].area,
                )
                immediate_parent[child_index] = parent_index

        # Sin capas LI explícitas, los anillos concéntricos alternan superficie:
        # profundidad impar = hueco; profundidad par = isla/exterior independiente.
        if not has_explicit_interior_layers:
            depth_cache: Dict[int, int] = {}

            def nesting_depth(index: int) -> int:
                if index not in immediate_parent:
                    return 0
                if index not in depth_cache:
                    depth_cache[index] = 1 + nesting_depth(immediate_parent[index])
                return depth_cache[index]

            immediate_parent = {
                child: parent
                for child, parent in immediate_parent.items()
                if nesting_depth(child) % 2 == 1
            }

        anidamientos: Dict[int, List[int]] = {}
        for child_index, parent_index in immediate_parent.items():
            anidamientos.setdefault(parent_index, []).append(child_index)

        return anidamientos

    @staticmethod
    def punto_en_poligono(x: float, y: float, poligono: List[Tuple[float, float]]) -> bool:
        """Algoritmo Ray Casting para ver si un punto está dentro de un polígono"""
        num_vertices = len(poligono)
        inside = False
        p1x, p1y = poligono[0]
        for i in range(num_vertices + 1):
            p2x, p2y = poligono[i % num_vertices]
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y
        return inside

    @staticmethod
    def limpiar_topologia(parcelas: List[ParcelaInfo]) -> List[ParcelaInfo]:
        """
        MEJORA 1: Limpia geometrías con shapely:
        - Cierra polígonos abiertos si distancia < 0.05m
        - Elimina vértices duplicados (tolerancia 0.001m)
        - Valida y repara con make_valid()
        
        Args:
            parcelas: Lista de ParcelaInfo a limpiar
            
        Returns:
            Lista de ParcelaInfo con geometrías limpias
        """
        from shapely.geometry import Polygon
        from shapely import make_valid
        from shapely.validation import explain_validity
        
        for parcela in parcelas:
            if not parcela.coordenadas or len(parcela.coordenadas) < 3:
                raise ValueError("Se encontró una geometría con menos de tres vértices")
            
            try:
                poly = Polygon(parcela.coordenadas, parcela.interiores)
                if not poly.is_valid:
                    invalid_reason = explain_validity(poly)
                    repaired = make_valid(poly)
                    if repaired.geom_type != "Polygon" or repaired.is_empty:
                        raise ValueError(
                            "La geometría no puede repararse sin dividirse o perder partes: "
                            + invalid_reason
                        )
                    poly = repaired
                if poly.is_empty or poly.area <= 0:
                    raise ValueError("Se encontró una geometría sin superficie")

                parcela.coordenadas = list(poly.exterior.coords)
                parcela.interiores = [
                    list(interior.coords) for interior in poly.interiors
                ]
                parcela.area = float(poly.area)
                point = poly.representative_point()
                parcela.punto_referencia = (point.x, point.y)
            except ValueError:
                raise
            except Exception as e:
                raise ValueError("No se pudo normalizar una geometría importada") from e
        
        return parcelas
