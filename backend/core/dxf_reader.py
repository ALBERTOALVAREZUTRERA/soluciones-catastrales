
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
            
            print(f"DEBUG: Candidatos Textos -> {len(todos_textos)} ent.")

            # Iterar sobre las capas de geometría
            count_total_polys = 0
            
            for capa in capas_parcelas:
                # CORRECCIÓN CRÍTICA: PG-LI son divisiones interiores VÁLIDAS
                # NO ignorar, son parte importante de la parcela
                capa_upper = capa.upper()
                tipo_capa = "LP" if "LP" in capa_upper else ("LI" if "LI" in capa_upper else "OTRA")
                
                print(f"DEBUG: Procesando capa '{capa}' [Tipo: {tipo_capa}]")

                # Extraer Polilíneas de esta capa
                lw_polys = msp.query(f'LWPOLYLINE[layer=="{capa}"]')
                legacy_polys = msp.query(f'POLYLINE[layer=="{capa}"]')
                polilineas = list(lw_polys) + list(legacy_polys)
                
                print(f"DEBUG: Capa '{capa}' -> {len(polilineas)} geometrías")
                count_total_polys += len(polilineas)
            
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
                    
                    # Intento de cerrar manualmente si coincide start/end
                    if len(coordenadas) > 2:
                        start = coordenadas[0]
                        end = coordenadas[-1]
                        if start != end:
                            coordenadas.append(start)
                        is_closed = True
                    
                    if not is_closed or len(coordenadas) < 3:
                        if i < 5: print(f"DEBUG: Polilínea {i} ignorada en {capa}. Puntos: {len(coordenadas)}")
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
                        if len(referencia_limpia) in [14, 20] and referencia_limpia.isalnum():
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
                        es_rc_valida = (len(nombre_limpio) == 14 and nombre_limpio.isalnum())
                        
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
    def calcular_area(coordenadas: List[Tuple[float, float]]) -> float:
        """Calcula el área usando la fórmula de Gauss (Shoelace format)"""
        x = [c[0] for c in coordenadas]
        y = [c[1] for c in coordenadas]
        return 0.5 * abs(sum(x[i]*y[i+1] - x[i+1]*y[i] for i in range(len(coordenadas)-1)))

    @staticmethod
    def calcular_centroide(coordenadas: List[Tuple[float, float]]) -> Tuple[float, float]:
        """Calcula un centroide aproximado (promedio de coordenadas)"""
        if not coordenadas:
            return (0.0, 0.0)
        x = [c[0] for c in coordenadas]
        y = [c[1] for c in coordenadas]
        return (sum(x) / len(x), sum(y) / len(y))

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
        anidamientos = {}
        
        # Ordenar por área descendente (los contenedores son más grandes)
        # Esto cumple la lógica del usuario: El más grande es la finca (Exterior), los menores dentro son huecos.
        indices_ordenados = sorted(range(len(parcelas)), key=lambda i: parcelas[i].area, reverse=True)
        
        for i in range(len(indices_ordenados)):
            idx_padre = indices_ordenados[i]
            padre = parcelas[idx_padre]
            
            # Nota: Al ser el más grande de los restantes, asumimos que es Exterior candidata
            # Si tuviera padres, ya habría sido procesada en el bucle interior de una iteración anterior
            # (siempre que los padres sean más grandes, que es geometría básica).
            
            # Bounding box del padre
            if not padre.coordenadas: continue
            px = [c[0] for c in padre.coordenadas]
            py = [c[1] for c in padre.coordenadas]
            min_xp, max_xp = min(px), max(px)
            min_yp, max_yp = min(py), max(py)

            for j in range(i + 1, len(indices_ordenados)):
                idx_hijo = indices_ordenados[j]
                hijo = parcelas[idx_hijo]
                
                # REGLA: Un PG-LP no suele estar dentro de otro PG-LP (salvo error topológico o islas)
                # PERO un PG-LI SIEMPRE debe estar dentro de un PG-LP.
                # Si tenemos source layer, podemos priorizar.
                
                # Si ya ha sido asignado como hijo de otro, saltar
                es_hijo_de_alguien = False
                for hijos in anidamientos.values():
                    if idx_hijo in hijos:
                        es_hijo_de_alguien = True
                        break
                if es_hijo_de_alguien:
                    continue

                if not hijo.coordenadas: continue
                
                # Check rápido de Bounding Box: El hijo debe estar DENTRO del padre
                hx = [c[0] for c in hijo.coordenadas]
                hy = [c[1] for c in hijo.coordenadas]
                min_xh, max_xh = min(hx), max(hx)
                min_yh, max_yh = min(hy), max(hy)
                
                if (min_xh >= min_xp and max_xh <= max_xp and 
                    min_yh >= min_yp and max_yh <= max_yp):
                    
                    # Check preciso usando CENTROIDE (más robusto que el primer vértice)
                    cx, cy = hijo.punto_referencia
                    if DXFReader.punto_en_poligono(cx, cy, padre.coordenadas):
                        if idx_padre not in anidamientos:
                            anidamientos[idx_padre] = []
                        anidamientos[idx_padre].append(idx_hijo)
                        
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
        from shapely import make_valid, simplify
        
        for parcela in parcelas:
            if not parcela.coordenadas or len(parcela.coordenadas) < 3:
                continue
            
            try:
                # Crear polígono shapely
                poly = Polygon(parcela.coordenadas)
                
                # Cerrar si está abierto (snap último punto al primero si dist < 0.05m)
                if not poly.is_closed:
                    coords_list = list(parcela.coordenadas)
                    if len(coords_list) >= 3:
                        start = coords_list[0]
                        end = coords_list[-1]
                        dist = ((end[0]-start[0])**2 + (end[1]-start[1])**2)**0.5
                        
                        if dist < 0.05:
                            # Cerrar el polígono
                            coords_list.append(start)
                            poly = Polygon(coords_list)
                            print(f"DEBUG: Polígono cerrado automáticamente (dist={dist:.3f}m)")
                
                # Simplificar (elimina duplicados con tolerancia 0.001m)
                poly_simplified = simplify(poly, tolerance=0.001, preserve_topology=True)
                
                # Validar y reparar si es necesario
                if not poly_simplified.is_valid:
                    print(f"DEBUG: Geometría inválida detectada, reparando...")
                    poly_simplified = make_valid(poly_simplified)
                
                # Actualizar coordenadas limpias
                if poly_simplified.geom_type == 'Polygon':
                    parcela.coordenadas = list(poly_simplified.exterior.coords)
                    
                    # Actualizar huecos si existen
                    if len(poly_simplified.interiors) > 0:
                        parcela.interiores = [list(interior.coords) for interior in poly_simplified.interiors]
                    
                    # Recalcular área
                    parcela.area = DXFReader.calcular_area(parcela.coordenadas)
                else:
                    print(f"WARN: Geometría compleja después de validación: {poly_simplified.geom_type}")
                
            except Exception as e:
                print(f"ERROR limpiando topología de parcela: {e}")
                # Mantener coordenadas originales en caso de error
                continue
        
        return parcelas
