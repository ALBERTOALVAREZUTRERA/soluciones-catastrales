import os
import zipfile
import tempfile
import xml.etree.ElementTree as ET
import re
from typing import List, Tuple
from shapely.geometry import Polygon
from core.parcel_model import ParcelaInfo
from core.coordinate_transformer import CoordinateTransformer

class KMLReader:
    """Lector de archivos KML y KMZ para catastro"""

    @staticmethod
    def _limpiar_namespaces(xml_string: str) -> str:
        """
        Limpia los namespaces para que sea más fácil de parsear
        """
        # Elimina xmlns="..."
        return re.sub(r'\s+xmlns="[^"]+"', '', xml_string)

    @staticmethod
    def _parse_coordinates(coord_text: str) -> List[Tuple[float, float]]:
        """
        Parsea un string de coordenadas "lon,lat,alt lon,lat,alt" en KML
        Devuelve una lista de tuplas (lon, lat)
        """
        coords = []
        if not coord_text:
            return coords
        
        # Eliminar saltos de línea y obtener pares/tríos por espacio
        parts = coord_text.strip().split()
        for p in parts:
            components = p.split(',')
            if len(components) >= 2:
                try:
                    lon = float(components[0].strip())
                    lat = float(components[1].strip())
                    coords.append((lon, lat))
                except ValueError:
                    continue
        return coords

    @staticmethod
    def leer_desde_kmz(ruta_kmz: str, epsg: str = "25830") -> List[ParcelaInfo]:
        """
        Descomprime un KMZ y lee el archivo KML que contenga.
        Si la ruta ya es de un KML, lo lee directamente.
        """
        temp_dir = ""
        is_kmz = ruta_kmz.lower().endswith('.kmz') or zipfile.is_zipfile(ruta_kmz)
        ruta_kml_procesar = ruta_kmz
        
        try:
            if is_kmz:
                temp_dir = tempfile.mkdtemp()
                with zipfile.ZipFile(ruta_kmz, 'r') as zip_ref:
                    zip_ref.extractall(temp_dir)
                
                # Buscar un .kml (generalmente doc.kml)
                for root, _, files in os.walk(temp_dir):
                    for file in files:
                        if file.lower().endswith('.kml'):
                            ruta_kml_procesar = os.path.join(root, file)
                            break
                    if ruta_kml_procesar != ruta_kmz:
                        break
                
                if ruta_kml_procesar == ruta_kmz:
                    raise Exception("No se encontró ningún archivo .kml dentro del KMZ")

            return KMLReader.leer_kml(ruta_kml_procesar, epsg)

        finally:
            if temp_dir and os.path.exists(temp_dir):
                import shutil
                shutil.rmtree(temp_dir, ignore_errors=True)

    @staticmethod
    def leer_kml(ruta_kml: str, epsg: str = "25830") -> List[ParcelaInfo]:
        """
        Lee un archivo .kml y lo convierte a modelos ParcelaInfo proyectados al epsg indicado.
        """
        try:
            with open(ruta_kml, 'r', encoding='utf-8') as f:
                content = f.read()
        except UnicodeDecodeError:
            with open(ruta_kml, 'r', encoding='latin-1') as f:
                content = f.read()

        # Limpiar namespace por simplicidad
        clean_xml = KMLReader._limpiar_namespaces(content)
        
        try:
            root = ET.fromstring(clean_xml)
        except ET.ParseError as e:
            print(f"Error parseando XML del KML: {e}")
            return []

        parcelas = []
        
        # Buscar Placemarks
        for idx, placemark in enumerate(root.findall(".//Placemark")):
            # Extraer nombre
            name_node = placemark.find("name")
            placemark_name = name_node.text.strip() if name_node is not None and name_node.text else f"KML_FEATURE_{idx + 1}"
            
            # Buscar Polígonos (pueden venir directos o dentro de MultiGeometry)
            polygons = placemark.findall(".//Polygon")
            
            for p_idx, poly_node in enumerate(polygons):
                parcela = ParcelaInfo()
                
                # Nombre base usando el nombre de Placemark
                if len(polygons) > 1:
                    parcela.nombre_archivo = f"{placemark_name}_{p_idx + 1}"
                else:
                    parcela.nombre_archivo = placemark_name
                    
                # Buscar potencial Referencia Catastral (14 o 20 chars limpios) en el nombre
                ref_limpia = parcela.nombre_archivo.replace(" ", "").upper()
                if len(ref_limpia) in [14, 20] and ref_limpia.isalnum():
                    parcela.referencia_catastral = ref_limpia
                
                # Exterior
                outer_coords_node = poly_node.find(".//outerBoundaryIs//coordinates")
                if outer_coords_node is not None and outer_coords_node.text:
                    latlon_exterior = KMLReader._parse_coordinates(outer_coords_node.text)
                    if not latlon_exterior:
                        continue
                    
                    # Convertir a UTM
                    parcela.coordenadas = CoordinateTransformer.latlon_to_utm(latlon_exterior, epsg)
                else:
                    continue # Sin exterior, ignoramos
                
                # Huecos interiores
                inner_boundaries = poly_node.findall(".//innerBoundaryIs//coordinates")
                for inner_node in inner_boundaries:
                    if inner_node.text:
                        latlon_interior = KMLReader._parse_coordinates(inner_node.text)
                        if latlon_interior:
                            utm_interior = CoordinateTransformer.latlon_to_utm(latlon_interior, epsg)
                            parcela.interiores.append(utm_interior)
                
                # Calcular área usando Shapely (sobre las UTM proyectadas)
                try:
                    shapely_poly = Polygon(parcela.coordenadas, parcela.interiores)
                    parcela.area = shapely_poly.area
                    parcela.punto_referencia = (shapely_poly.centroid.x, shapely_poly.centroid.y)
                except BaseException as e:
                    print(f"Error calculando geometría Shapely: {e}")
                    parcela.area = 0.0
                
                parcela.capa_origen = os.path.basename(ruta_kml)
                parcelas.append(parcela)
                
        return parcelas
