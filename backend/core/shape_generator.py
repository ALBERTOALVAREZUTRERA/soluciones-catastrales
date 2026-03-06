
import shapefile
import os

# WKT de proyección por EPSG para los más usados en España
PRJ_DEFINITIONS = {
    "25829": 'PROJCS["ETRS89 / UTM zone 29N",GEOGCS["ETRS89",DATUM["European_Terrestrial_Reference_System_1989",SPHEROID["GRS 1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",-9],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["meter",1]]',
    "25830": 'PROJCS["ETRS89 / UTM zone 30N",GEOGCS["ETRS89",DATUM["European_Terrestrial_Reference_System_1989",SPHEROID["GRS 1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",-3],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["meter",1]]',
    "25831": 'PROJCS["ETRS89 / UTM zone 31N",GEOGCS["ETRS89",DATUM["European_Terrestrial_Reference_System_1989",SPHEROID["GRS 1980",6378137,298.257222101]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",3],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["meter",1]]',
    "32628": 'PROJCS["WGS 84 / UTM zone 28N",GEOGCS["WGS 84",DATUM["World_Geodetic_System_1984",SPHEROID["WGS 84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",-15],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["meter",1]]',
}

class ShapeGenerator:
    """ Exportador de parcelas catastrales a formato ESRI Shapefile. """

    @staticmethod
    def exportar_a_shape(features: list, output_base_path: str, epsg: str = "25830"):
        """ Crea un set de archivos Shapefile (.shp, .shx, .dbf, .prj) """

        # Normalizar EPSG: aceptar "EPSG:25830", "25830", etc.
        epsg_code = str(epsg).upper().replace("EPSG:", "").strip()
        # Por defecto ETRS89 UTM 30N si no se reconoce
        if epsg_code not in PRJ_DEFINITIONS:
            epsg_code = "25830"

        w = shapefile.Writer(output_base_path, shapeType=shapefile.POLYGON)

        # Definir campos DBF
        w.field('ID', 'C', 50)
        w.field('REF_CAT', 'C', 20)
        w.field('AREA', 'N', 18, 2)

        written = 0
        for feature in features:
            identificador = str(feature.get('id', 'S/N') or 'S/N')[:50]
            ref_cat = str(feature.get('cadastralReference', '') or '')[:20]
            area = float(feature.get('area', 0.0) or 0.0)
            geometry = feature.get('geometry', [])

            if not geometry:
                continue

            # Convertir a formato pyshp y cerrar cada anillo si hace falta
            processed_geometry = []
            valid = True
            for ring in geometry:
                if not ring or len(ring) < 3:
                    continue  # anillo inválido, ignorar
                # Asegurar que los puntos son listas/tuplas de 2 números
                try:
                    ring_pts = [[float(p[0]), float(p[1])] for p in ring]
                except (TypeError, IndexError, ValueError):
                    valid = False
                    break
                # Cerrar el anillo si no lo está
                if ring_pts[0] != ring_pts[-1]:
                    ring_pts.append(ring_pts[0])
                if len(ring_pts) >= 4:  # Al menos 3 vértices + cierre
                    processed_geometry.append(ring_pts)

            if not valid or not processed_geometry:
                continue

            try:
                w.poly(processed_geometry)
                w.record(identificador, ref_cat, area)
                written += 1
            except Exception as e:
                print(f"[ShapeGenerator] Geometría ignorada para '{identificador}': {e}")
                continue

        w.close()

        if written == 0:
            raise ValueError("No se pudo exportar ninguna geometría válida al Shapefile.")

        # Crear archivo .prj (proyección)
        prj_path = output_base_path + ".prj"
        prj_content = PRJ_DEFINITIONS.get(epsg_code, PRJ_DEFINITIONS["25830"])
        with open(prj_path, "w") as f:
            f.write(prj_content)

        print(f"[ShapeGenerator] {written} parcelas exportadas a {output_base_path}.shp (EPSG:{epsg_code})")
        return output_base_path + ".shp"
