
import os
import zipfile
import tempfile
import geopandas as gpd
from typing import List
from core.parcel_model import ParcelaInfo

class SHPReader:
    """Lector de archivos Shapefile para catastro"""

    @staticmethod
    def leer_desde_zip(ruta_zip: str) -> List[ParcelaInfo]:
        """
        Descomprime un ZIP y lee los shapefiles que contenga.
        """
        temp_dir = tempfile.mkdtemp()
        try:
            with zipfile.ZipFile(ruta_zip, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
            
            # Buscar archivos .shp
            shp_files = []
            for root, _, files in os.walk(temp_dir):
                for file in files:
                    if file.lower().endswith('.shp'):
                        shp_files.append(os.path.join(root, file))
            
            if not shp_files:
                raise Exception("No se encontró ningún archivo .shp dentro del ZIP")
            
            all_parcelas = []
            for shp_path in shp_files:
                all_parcelas.extend(SHPReader.leer_shp(shp_path))
            
            return all_parcelas
        finally:
            # La limpieza del temp_dir se suele hacer después de procesar
            # En este caso, como leer_shp carga en memoria, podemos borrar ya
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)

    @staticmethod
    def leer_shp(ruta_shp: str) -> List[ParcelaInfo]:
        """
        Lee un archivo .shp y lo convierte a ParcelaInfo.
        """
        try:
            gdf = gpd.read_file(ruta_shp)
            
            # Asegurar que sea geometría de polígono
            gdf = gdf[gdf.geometry.type.isin(['Polygon', 'MultiPolygon'])]
            
            parcelas = []
            for idx, row in gdf.iterrows():
                # Extraer geometría
                geom = row.geometry
                
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
                        if matched_col and row[matched_col]:
                            referencia = str(row[matched_col])
                            break
                    
                    if referencia:
                        # Si es multi-polígono, añadir sufijo
                        if len(polys) > 1:
                            referencia = f"{referencia}.{p_idx + 1}"
                        
                        # Si parece una RC válida (14 o 20)
                        ref_limpia = referencia.replace(" ", "").upper()
                        if len(ref_limpia) in [14, 20] and ref_limpia.isalnum():
                            parcela.referencia_catastral = ref_limpia
                            parcela.nombre_archivo = ref_limpia
                        else:
                            parcela.nombre_archivo = referencia
                    else:
                        parcela.nombre_archivo = f"SHP_FEATURE_{idx + 1}"
                    
                    # Área y centroide
                    parcela.area = poly.area
                    parcela.punto_referencia = (poly.centroid.x, poly.centroid.y)
                    parcela.capa_origen = os.path.basename(ruta_shp)
                    
                    parcelas.append(parcela)
            
            return parcelas
        except Exception as e:
            print(f"Error leyendo SHP {ruta_shp}: {e}")
            return []
