
import os
import tempfile
import geopandas as gpd
import math
from typing import List
from core.parcel_model import ParcelaInfo
from core.file_security import safe_extract_zip

class SHPReader:
    """Lector de archivos Shapefile para catastro"""

    @staticmethod
    def leer_desde_zip(ruta_zip: str, epsg_destino: str = "25830") -> List[ParcelaInfo]:
        """
        Descomprime un ZIP y lee los shapefiles que contenga.
        """
        temp_dir = tempfile.mkdtemp()
        try:
            safe_extract_zip(ruta_zip, temp_dir)
            
            # Buscar archivos .shp
            shp_files = []
            for root, _, files in os.walk(temp_dir):
                for file in files:
                    if file.lower().endswith('.shp'):
                        shp_files.append(os.path.join(root, file))
            
            if not shp_files:
                raise ValueError("No se encontró ningún archivo .shp dentro del ZIP")
            
            all_parcelas = []
            for shp_path in shp_files:
                base_path = os.path.splitext(shp_path)[0]
                sibling_files = {
                    os.path.splitext(name)[1].lower(): os.path.join(os.path.dirname(shp_path), name)
                    for name in os.listdir(os.path.dirname(shp_path))
                    if os.path.splitext(name)[0].lower() == os.path.basename(base_path).lower()
                }
                missing = [
                    extension
                    for extension in (".shx", ".dbf")
                    if extension not in sibling_files
                ]
                if missing:
                    raise ValueError(
                        "El Shapefile está incompleto; faltan: " + ", ".join(missing)
                    )
                all_parcelas.extend(
                    SHPReader.leer_shp(shp_path, epsg_destino)
                )
            
            return all_parcelas
        finally:
            # La limpieza del temp_dir se suele hacer después de procesar
            # En este caso, como leer_shp carga en memoria, podemos borrar ya
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)

    @staticmethod
    def leer_shp(ruta_shp: str, epsg_destino: str = "25830") -> List[ParcelaInfo]:
        """
        Lee un archivo .shp y lo convierte a ParcelaInfo.
        """
        try:
            gdf = gpd.read_file(ruta_shp)
            target_crs = f"EPSG:{str(epsg_destino).upper().replace('EPSG:', '')}"
            if gdf.crs is None:
                # Sin .prj se aplica el CRS que el usuario declaró al subirlo.
                gdf = gdf.set_crs(target_crs, allow_override=True)
            elif gdf.crs.to_string().upper() != target_crs:
                gdf = gdf.to_crs(target_crs)
            
            # Asegurar que sea geometría de polígono
            gdf = gdf[gdf.geometry.type.isin(['Polygon', 'MultiPolygon'])]
            
            parcelas = []
            for idx, row in gdf.iterrows():
                # Extraer geometría
                geom = row.geometry
                if geom is None or geom.is_empty:
                    continue
                
                # Manejar Polygons y MultiPolygons
                if geom.geom_type == 'Polygon':
                    polys = [geom]
                else: # MultiPolygon
                    polys = list(geom.geoms)
                
                for p_idx, poly in enumerate(polys):
                    parcela = ParcelaInfo()
                    
                    # Coordenadas exterior
                    parcela.coordenadas = list(poly.exterior.coords)
                    
                    # Interiores (huecos)
                    parcela.interiores = [list(interior.coords) for interior in poly.interiors]
                    
                    # Atributos (intentar buscar referencia o id)
                    # Prioridad: 'REF_CAT', 'REFCAT', 'ID', 'LABEL'
                    referencia = ""
                    for col in ['REF_CAT', 'REFCAT', 'ID', 'LABEL', 'identifica', 'referencia']:
                        matched_col = next((c for c in gdf.columns if c.upper() == col.upper()), None)
                        if matched_col:
                            raw_reference = row[matched_col]
                            if raw_reference is None:
                                continue
                            reference_text = str(raw_reference).strip()
                            if not reference_text or reference_text.lower() == "nan":
                                continue
                            referencia = reference_text
                            break
                    
                    if referencia:
                        # Si es multi-polígono, añadir sufijo
                        if len(polys) > 1:
                            referencia = f"{referencia}.{p_idx + 1}"
                        
                        # Si parece una RC válida (14 o 20)
                        ref_limpia = referencia.replace(" ", "").upper()
                        if len(ref_limpia) in [14, 18, 20] and ref_limpia.isalnum():
                            parcela.referencia_catastral = ref_limpia
                            parcela.nombre_archivo = ref_limpia
                        else:
                            parcela.nombre_archivo = referencia
                    else:
                        parcela.nombre_archivo = f"SHP_FEATURE_{idx + 1}"
                    
                    # Área y centroide
                    parcela.area = poly.area
                    if not math.isfinite(parcela.area) or parcela.area <= 0:
                        raise ValueError("El Shapefile contiene una geometría sin superficie")
                    reference_point = poly.representative_point()
                    parcela.punto_referencia = (reference_point.x, reference_point.y)
                    parcela.capa_origen = os.path.basename(ruta_shp)
                    
                    parcelas.append(parcela)
            
            return parcelas
        except ValueError:
            raise
        except Exception as e:
            raise ValueError("No se pudo interpretar el Shapefile") from e
