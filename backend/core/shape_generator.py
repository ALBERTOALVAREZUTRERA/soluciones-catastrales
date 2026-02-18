
import shapefile
import os

class ShapeGenerator:
    """ Exportador de parcelas GML a formato ESRI Shapefile. """

    @staticmethod
    def exportar_a_shape(features: list, output_base_path: str, epsg: str = "25830"):
        """ Crea un set de archivos Shapefile (.shp, .shx, .dbf) """
        
        # Usamos pyshp (shapefile) que es ligero y ya está disponible o instalándose
        w = shapefile.Writer(output_base_path, shapeType=shapefile.POLYGON)
        
        # Definir campos DBF
        w.field('ID', 'C', 50)
        w.field('REF_CAT', 'C', 20)
        w.field('AREA', 'N', 18, 2)
        
        for feature in features:
            identificador = feature.get('id', 'S/N')
            ref_cat = feature.get('cadastralReference', '')
            area = feature.get('area', 0.0)
            geometry = feature.get('geometry', [])
            
            if not geometry:
                continue
            
            # shapefile espera [ [ [x,y], [x,y] ], [ [x,y] ] ] para polígonos con huecos
            # El exterior debe ser horario (CW) y los huecos antihorarios (CCW) en SHP tradicional
            # Sin embargo, pyshp suele manejar bien las listas de puntos directas.
            
            # Convertir a formato pyshp
            # NOTA: pyshp requiere que el anillo exterior esté cerrado
            processed_geometry = []
            for ring in geometry:
                if ring and ring[0] != ring[-1]:
                    ring.append(ring[0])
                processed_geometry.append(ring)
            
            w.poly(processed_geometry)
            w.record(identificador, ref_cat, area)
            
        w.close()
        
        # Crear archivo .prj (proyección)
        prj_path = output_base_path + ".prj"
        # PRJ simplificado para ETRS89 UTM 30N (EPSG:25830)
        # Se puede ampliar según el epsg pasado
        if epsg == "25830":
            prj_content = 'PROJCS["ETRS89 / UTM zone 30N",GEOGCS["ETRS89",DATUM["European_Terrestrial_Reference_System_1989",SPHEROID["GRS 1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",-3],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["meter",1]]'
            with open(prj_path, "w") as f:
                f.write(prj_content)
                
        return output_base_path + ".shp"
