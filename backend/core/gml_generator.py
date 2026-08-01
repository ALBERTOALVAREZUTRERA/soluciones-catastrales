
import os
import logging
from datetime import datetime
from .parcel_model import ParcelaInfo
import math


logger = logging.getLogger(__name__)

# Importaciones condicionales
try:
    from lxml import etree as ET
    LXML_AVAILABLE = True
except ImportError:
    import xml.etree.ElementTree as ET
    LXML_AVAILABLE = False

try:
    from shapely.geometry import Polygon, LinearRing
    from shapely.ops import orient
    from shapely.validation import explain_validity
    SHAPELY_AVAILABLE = True
except ImportError:
    SHAPELY_AVAILABLE = False


class GMLGenerator:
    """Generador de archivos GML en formato catastral (Inspire) validado"""
    
    # Namespaces Oficiales INSPIRE/Catastro (LISTA COMPLETA VALIDADA)
    NS_MAP = {
        'gml': 'http://www.opengis.net/gml/3.2',
        'ad': 'urn:x-inspire:specification:gmlas:Addresses:3.0',
        'base': 'urn:x-inspire:specification:gmlas:BaseTypes:3.2',
        'bu-base': 'http://inspire.jrc.ec.europa.eu/schemas/bu-base/3.0',
        'bu-core2d': 'http://inspire.jrc.ec.europa.eu/schemas/bu-core2d/2.0',
        'bu-ext2d': 'http://inspire.jrc.ec.europa.eu/schemas/bu-ext2d/2.0',
        'cp': 'urn:x-inspire:specification:gmlas:CadastralParcels:3.0',
        'el-bas': 'http://inspire.jrc.ec.europa.eu/schemas/el-bas/2.0',
        'el-cov': 'http://inspire.jrc.ec.europa.eu/schemas/el-cov/2.0',
        'el-tin': 'http://inspire.jrc.ec.europa.eu/schemas/el-tin/2.0',
        'el-vec': 'http://inspire.jrc.ec.europa.eu/schemas/el-vec/2.0',
        'gco': 'http://www.isotc211.org/2005/gco',
        'gmd': 'http://www.isotc211.org/2005/gmd',
        'gmlcov': 'http://www.opengis.net/gmlcov/1.0',
        'gn': 'urn:x-inspire:specification:gmlas:GeographicalNames:3.0',
        'gsr': 'http://www.isotc211.org/2005/gsr',
        'gss': 'http://www.isotc211.org/2005/gss',
        'gts': 'http://www.isotc211.org/2005/gts',
        'swe': 'http://www.opengis.net/swe/2.0',
        'xlink': 'http://www.w3.org/1999/xlink',
        'xsi': 'http://www.w3.org/2001/XMLSchema-instance'
    }

    @staticmethod
    def prepare_polygon(exterior, holes=None, exterior_clockwise=False):
        """Normaliza y valida un polígono sin descartar ninguna de sus partes."""
        if not SHAPELY_AVAILABLE:
            raise RuntimeError("Shapely es necesario para validar la geometría GML.")

        def clean_ring(ring, label):
            cleaned = []
            for coordinate in ring or []:
                if (
                    not isinstance(coordinate, (list, tuple))
                    or len(coordinate) < 2
                    or not math.isfinite(float(coordinate[0]))
                    or not math.isfinite(float(coordinate[1]))
                ):
                    raise ValueError(f"{label} contiene una coordenada no válida.")
                point = (round(float(coordinate[0]), 2), round(float(coordinate[1]), 2))
                if not cleaned or point != cleaned[-1]:
                    cleaned.append(point)
            if len(cleaned) > 1 and cleaned[0] == cleaned[-1]:
                cleaned.pop()
            if len(cleaned) < 3:
                raise ValueError(f"{label} debe tener al menos tres vértices distintos.")
            cleaned.append(cleaned[0])
            return cleaned

        clean_exterior = clean_ring(exterior, "El anillo exterior")
        clean_holes = [
            clean_ring(hole, f"El hueco {index + 1}")
            for index, hole in enumerate(holes or [])
        ]
        polygon = Polygon(clean_exterior, clean_holes)
        if polygon.is_empty or polygon.area <= 0:
            raise ValueError("La geometría tiene superficie nula.")
        if not polygon.is_valid:
            raise ValueError(f"La geometría no es válida: {explain_validity(polygon)}")

        polygon = orient(polygon, sign=-1.0 if exterior_clockwise else 1.0)
        normalized_exterior = [
            (round(x, 2), round(y, 2))
            for x, y in polygon.exterior.coords
        ]
        normalized_holes = [
            [(round(x, 2), round(y, 2)) for x, y in ring.coords]
            for ring in polygon.interiors
        ]
        return normalized_exterior, normalized_holes, round(polygon.area, 2)

    @staticmethod
    def fix_geometry(coords):
        """
        Corrige la geometría para cumplir requisitos de Catastro:
        1. Cierra el polígono.
        2. Ordena vértices en sentido Antihorario (CCW).
        3. Redondea a 2 decimales.
        4. Elimina puntos duplicados consecutivos.
        """
        if not coords:
            return []
            
        # 1. Redondear y limpiar duplicados consecutivos
        cleaned = []
        last_pt = None
        for x, y in coords:
            pt = (round(x, 2), round(y, 2))
            if pt != last_pt:
                cleaned.append(pt)
                last_pt = pt
                
        # 2. Cerrar polígono
        if cleaned and cleaned[0] != cleaned[-1]:
            cleaned.append(cleaned[0])
            
        if len(cleaned) < 4: # Mínimo 3 ptos + cierre
            logger.warning("Polígono con menos de tres puntos tras normalizarlo")
            return cleaned 
            
        # 3. Orientación CCW (Anti-Horario) para EXTERIOR - ISO 19107 / Catastro
        if SHAPELY_AVAILABLE:
            try:
                poly = Polygon(cleaned)
                if not poly.is_valid:
                    poly = poly.buffer(0) 
                
                # sign=1.0 -> CCW (Counter-Clockwise)
                oriented_poly = orient(poly, sign=1.0) 
                
                if isinstance(oriented_poly, Polygon): 
                    final_coords = list(oriented_poly.exterior.coords)
                    # Re-redondear
                    final_coords = [(round(x, 2), round(y, 2)) for x, y in final_coords]
                    return final_coords
                else:
                   # Si buffer(0) devuelve Multipolygon, tomamos el más grande
                   logger.warning(
                       "Geometría compleja convertida a MultiPolygon; se usará el polígono de mayor área"
                   )
                   best_poly = max(oriented_poly.geoms, key=lambda p: p.area)
                   final_coords = list(best_poly.exterior.coords)
                   final_coords = [(round(x, 2), round(y, 2)) for x, y in final_coords]
                   return final_coords

            except Exception:
                logger.exception("No se pudo normalizar la geometría con Shapely")
                return cleaned
        else:
            # Fallback simple (sin garantía de orden)
            return cleaned

    @staticmethod
    def fix_hole_geometry(coords):
        """
        Corrige huecos: Cierra y ordena en sentido Horario (CW).
        """
        if not coords: return []
        
        # Limpieza
        cleaned = []
        last_pt = None
        for x, y in coords:
            pt = (round(x, 2), round(y, 2))
            if pt != last_pt:
                cleaned.append(pt)
                last_pt = pt
        if cleaned and cleaned[0] != cleaned[-1]:
            cleaned.append(cleaned[0])
            
        if len(cleaned) < 4: return cleaned
        
        if SHAPELY_AVAILABLE:
            try:
                poly = Polygon(cleaned)
                if not poly.is_valid: poly = poly.buffer(0)
                
                # Orientación CW (Horario) para INTERIOR - ISO 19107 / Catastro
                # sign=-1.0 -> CW (Clockwise)
                oriented_poly = orient(poly, sign=-1.0)
                
                if isinstance(oriented_poly, Polygon):
                    final_coords = list(oriented_poly.exterior.coords)
                    final_coords = [(round(x, 2), round(y, 2)) for x, y in final_coords]
                    return final_coords
            except:
                pass
        return cleaned

    @staticmethod
    def generar_gml(parcela: ParcelaInfo, carpeta_destino: str, usar_epsg_urn: bool = False, epsg_code: str = "25830") -> str:
        
        # Lógica de Naming (SDGC vs LOCAL)
        if parcela.referencia_catastral:
            # Caso A: Tiene RC -> ES.SDGC
            namespace_prefix = "ES.SDGC"
            # Usamos el identificador ya sanitizado (que será la RC limpia)
            local_id = parcela.identificador
        else:
            # Caso B: No tiene RC -> ES.LOCAL
            namespace_prefix = "ES.LOCAL"
            local_id = parcela.identificador # Nombre interno sanitizado
            
        nombre_archivo = local_id

        # Siempre usar URN si lo pide Catastro
        srs_name = f"urn:ogc:def:crs:EPSG::{epsg_code}"
        
        raw_parts = parcela.partes or [{
            'exterior': parcela.coordenadas,
            'huecos': parcela.interiores,
        }]
        normalized_parts = []
        total_area = 0.0
        for part in raw_parts:
            exterior, holes, part_area = GMLGenerator.prepare_polygon(
                part.get('exterior', []),
                part.get('huecos', []),
                exterior_clockwise=parcela.tipo_entidad == "BU",
            )
            normalized_parts.append({'exterior': exterior, 'huecos': holes})
            total_area += part_area

        parcela.partes = normalized_parts
        parcela.area = round(total_area, 2)
        coords_fixed = normalized_parts[0]['exterior']
        huecos_fixed = normalized_parts[0]['huecos']
        
        ruta_absoluta = os.path.join(carpeta_destino, f"{nombre_archivo}.gml")
        
        if parcela.tipo_entidad == "BU":
            GMLGenerator._generate_building_xml(parcela, coords_fixed, huecos_fixed, namespace_prefix, local_id, srs_name, ruta_absoluta)
        else:
            GMLGenerator._generate_parcel_xml(parcela, coords_fixed, huecos_fixed, namespace_prefix, local_id, srs_name, ruta_absoluta)
            
        return ruta_absoluta

    @staticmethod
    def _generate_building_xml(parcela, coords, huecos, namespace_prefix, local_id, srs_name, filepath):
        """
        Genera XML para Edificios (Building) siguiendo ESTRICTAMENTE la plantilla validada (ICUC).
        """
        if not LXML_AVAILABLE:
            raise ImportError("lxml es necesario para generar GMLs válidos.")

        # Namespaces
        ns = GMLGenerator.NS_MAP
        
        # Construct full ID prefixes
        ns_bu = f"{namespace_prefix}.BU"
        full_id = f"{ns_bu}.{local_id}"
        
        # Root: FeatureCollection
        attr_qname = ET.QName(ns['gml'], "id")
        root = ET.Element(f"{{{ns['gml']}}}FeatureCollection", {
             attr_qname: f"{namespace_prefix}.BU",
             f"{{{ns['xsi']}}}schemaLocation": "http://inspire.jrc.ec.europa.eu/schemas/bu-ext2d/2.0 http://inspire.ec.europa.eu/draft-schemas/bu-ext2d/2.0/BuildingExtended2D.xsd"
        }, nsmap=ns)
        
        # featureMember
        fm = ET.SubElement(root, f"{{{ns['gml']}}}featureMember")
        
        # Building
        bu = ET.SubElement(fm, f"{{{ns['bu-ext2d']}}}Building")
        bu.set(f"{{{ns['gml']}}}id", full_id)
        
        # boundedBy (Envelope)
        xs = [c[0] for c in coords]
        ys = [c[1] for c in coords]
        if not xs: xs, ys = [0], [0]
        
        bb = ET.SubElement(bu, f"{{{ns['gml']}}}boundedBy")
        env = ET.SubElement(bb, f"{{{ns['gml']}}}Envelope", srsName=srs_name)
        lc = ET.SubElement(env, f"{{{ns['gml']}}}lowerCorner")
        lc.text = f"{min(xs):.2f} {min(ys):.2f}"
        uc = ET.SubElement(env, f"{{{ns['gml']}}}upperCorner")
        uc.text = f"{max(xs):.2f} {max(ys):.2f}"
        
        # beginLifespanVersion
        bl = ET.SubElement(bu, f"{{{ns['bu-core2d']}}}beginLifespanVersion")
        bl.text = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ") # Added Z as per example, though optional
        
        # condition
        cond = ET.SubElement(bu, f"{{{ns['bu-core2d']}}}conditionOfConstruction")
        cond.text = "functional"
        
        # inspireId
        iid = ET.SubElement(bu, f"{{{ns['bu-core2d']}}}inspireId")
        ident = ET.SubElement(iid, f"{{{ns['base']}}}Identifier")
        lid = ET.SubElement(ident, f"{{{ns['base']}}}localId")
        lid.text = local_id
        nasp = ET.SubElement(ident, f"{{{ns['base']}}}namespace")
        nasp.text = ns_bu
        
        # geometry
        geo = ET.SubElement(bu, f"{{{ns['bu-ext2d']}}}geometry")
        bugeo = ET.SubElement(geo, f"{{{ns['bu-core2d']}}}BuildingGeometry")
        geo2d = ET.SubElement(bugeo, f"{{{ns['bu-core2d']}}}geometry")
        
        # Surface with PolygonPatch (Validated Structure)
        surf = ET.SubElement(geo2d, f"{{{ns['gml']}}}Surface")
        surf.set(f"{{{ns['gml']}}}id", f"Surface_{local_id}")
        surf.set("srsName", srs_name)
        
        patches = ET.SubElement(surf, f"{{{ns['gml']}}}patches")
        
        # Determine parts to process (Multi-Patch vs Single)
        parts_to_process = parcela.partes if hasattr(parcela, 'partes') and parcela.partes else [{'exterior': coords, 'huecos': huecos}]
        
        for part in parts_to_process:
            ppatch = ET.SubElement(patches, f"{{{ns['gml']}}}PolygonPatch")
            
            # Exterior
            ext = ET.SubElement(ppatch, f"{{{ns['gml']}}}exterior")
            lr = ET.SubElement(ext, f"{{{ns['gml']}}}LinearRing")
            pl = ET.SubElement(
                lr,
                f"{{{ns['gml']}}}posList",
                srsDimension="2",
                count=str(len(part['exterior'])),
            )
            pl.text = " ".join([f"{x:.2f} {y:.2f}" for x, y in part['exterior']])
            
            # Interiors
            for h in part.get('huecos', []):
                inter = ET.SubElement(ppatch, f"{{{ns['gml']}}}interior")
                lr_h = ET.SubElement(inter, f"{{{ns['gml']}}}LinearRing")
                pl_h = ET.SubElement(
                    lr_h,
                    f"{{{ns['gml']}}}posList",
                    srsDimension="2",
                    count=str(len(h)),
                )
                pl_h.text = " ".join([f"{x:.2f} {y:.2f}" for x, y in h])
            
        # Estimated Accuracy (0.1m standard)
        acc = ET.SubElement(bugeo, f"{{{ns['bu-core2d']}}}horizontalGeometryEstimatedAccuracy", uom="m")
        acc.text = "0.1"
        
        ref = ET.SubElement(bugeo, f"{{{ns['bu-core2d']}}}horizontalGeometryReference")
        ref.text = "footPrint"
        
        isref = ET.SubElement(bugeo, f"{{{ns['bu-core2d']}}}referenceGeometry")
        isref.text = "true"
        
        # floors (ICUC requires minimum 1)
        floors = ET.SubElement(bu, f"{{{ns['bu-ext2d']}}}numberOfFloorsAboveGround")
        floors.text = str(max(1, int(parcela.numero_plantas)))
        
        # Write
        ET.ElementTree(root).write(filepath, pretty_print=True, xml_declaration=True, encoding="UTF-8")

    @staticmethod
    def _generate_parcel_xml(parcela, coords, huecos, namespace_prefix, local_id, srs_name, filepath):
        if not LXML_AVAILABLE:
             raise ImportError("lxml es necesario para generar GMLs válidos.")
             
        # ... (setup namespaces same as before)
        # 1. Namespaces & Constants
        ns_cp_val = 'http://inspire.ec.europa.eu/schemas/cp/4.0'
        ns_base_val = 'http://inspire.ec.europa.eu/schemas/base/3.3'
        
        ns = {
            'gml': 'http://www.opengis.net/gml/3.2',
            'xlink': 'http://www.w3.org/1999/xlink',
            'cp': ns_cp_val,
            'gmd': 'http://www.isotc211.org/2005/gmd',
            'xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            'base': ns_base_val
        }
        
        xsi_loc = "http://www.opengis.net/wfs/2.0 http://schemas.opengis.net/wfs/2.0/wfs.xsd http://inspire.ec.europa.eu/schemas/cp/4.0 http://inspire.ec.europa.eu/schemas/cp/4.0/CadastralParcels.xsd"
        
        # 2. Root: FeatureCollection (WFS 2.0)
        wfs_uri = 'http://www.opengis.net/wfs/2.0'
        
        # Para LXML, None key = default namespace
        ns_map_final = ns.copy()
        if LXML_AVAILABLE:
            ns_map_final[None] = wfs_uri
            # Eliminar prefijo explícito 'wfs' para evitar duplicidad o conflictos
            if 'wfs' in ns_map_final: del ns_map_final['wfs'] 
        
        root_attribs = {
             f"{{{ns['xsi']}}}schemaLocation": xsi_loc,
             "timeStamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
             "numberMatched": "1",
             "numberReturned": "1"
        }
        
        # Use simple QName with URI. LXML with nsmap[None] should hide prefix.
        root = ET.Element(f"{{{wfs_uri}}}FeatureCollection", root_attribs, nsmap=ns_map_final)
        
        # 3. Member: member
        member = ET.SubElement(root, f"{{{wfs_uri}}}member")
        
        # 4. Parcela ID Logic
        is_local = "ES.LOCAL" in namespace_prefix
        
        if is_local:
             safe_id = local_id.replace(" ", "_").replace(".", "_") # Sanitize
             parcel_gml_id = f"ES.LOCAL.CP.{safe_id}"
             inspire_ns = "ES.LOCAL.CP"
        else:
             parcel_gml_id = f"ES.SDGC.CP.{local_id}"
             inspire_ns = "ES.SDGC.CP"

        cp = ET.SubElement(member, f"{{{ns['cp']}}}CadastralParcel")
        cp.set(f"{{{ns['gml']}}}id", parcel_gml_id)
        
        # 5. Mandatory Attributes
        area = ET.SubElement(cp, f"{{{ns['cp']}}}areaValue", uom="m2")
        area.text = str(int(round(parcela.area)))
        
        # Fechas (nilReason por defecto si no hay datos reales, pero mantenemos estructura)
        bl = ET.SubElement(cp, f"{{{ns['cp']}}}beginLifespanVersion")
        # Si quisiéramos poner fecha real: bl.text = "2025-09-12T00:00:00"
        bl.text = datetime.now().strftime("%Y-%m-%dT00:00:00") # Poner fecha actual como inicio versión
        
        el = ET.SubElement(cp, f"{{{ns['cp']}}}endLifespanVersion")
        el.set(f"{{{ns['xsi']}}}nil", "true")
        el.set("nilReason", "http://inspire.ec.europa.eu/codelist/VoidReasonValue/Unpopulated")

        # 6. Geometry
        geo = ET.SubElement(cp, f"{{{ns['cp']}}}geometry")
        ms = ET.SubElement(geo, f"{{{ns['gml']}}}MultiSurface")
        ms.set(f"{{{ns['gml']}}}id", f"MultiSurface_{parcel_gml_id.replace('ES.SDGC.CP.', '').replace('ES.LOCAL.CP.', '')}")
        ms.set("srsName", srs_name)
        
        sm = ET.SubElement(ms, f"{{{ns['gml']}}}surfaceMember")
        surf = ET.SubElement(sm, f"{{{ns['gml']}}}Surface")
        # Suffix .1 as per Cadastre example
        surf.set(f"{{{ns['gml']}}}id", f"Surface_{parcel_gml_id.replace('ES.SDGC.CP.', '').replace('ES.LOCAL.CP.', '')}.1")
        surf.set("srsName", srs_name)
        
        patches = ET.SubElement(surf, f"{{{ns['gml']}}}patches")
        
        parts_to_process = parcela.partes if hasattr(parcela, 'partes') and parcela.partes else [{'exterior': coords, 'huecos': huecos}]
        
        # Formatting helper
        def format_coords(c_list):
            rounded = [(round(x, 2), round(y, 2)) for x, y in c_list]
            if rounded and rounded[0] != rounded[-1]:
                rounded.append(rounded[0])
            return " ".join([f"{x:.2f} {y:.2f}" for x, y in rounded]), len(rounded)

        for i, part in enumerate(parts_to_process):
            ppatch = ET.SubElement(patches, f"{{{ns['gml']}}}PolygonPatch")
            
            # Exterior
            ext = ET.SubElement(ppatch, f"{{{ns['gml']}}}exterior")
            lr = ET.SubElement(ext, f"{{{ns['gml']}}}LinearRing")
            
            txt_coords, num_pts = format_coords(part['exterior'])
            
            pl = ET.SubElement(lr, f"{{{ns['gml']}}}posList", srsDimension="2", count=str(num_pts))
            pl.text = txt_coords
            
            # Interior
            for h in part.get('huecos', []):
                inter = ET.SubElement(ppatch, f"{{{ns['gml']}}}interior")
                lr_h = ET.SubElement(inter, f"{{{ns['gml']}}}LinearRing")
                
                txt_h, num_h = format_coords(h)
                pl_h = ET.SubElement(lr_h, f"{{{ns['gml']}}}posList", srsDimension="2", count=str(num_h))
                pl_h.text = txt_h

        # 7. InspireId
        iid = ET.SubElement(cp, f"{{{ns['cp']}}}inspireId")
        
        try:
            ident = ET.SubElement(iid, f"{{{ns['base']}}}Identifier")
            
            lid = ET.SubElement(ident, f"{{{ns['base']}}}localId")
            lid.text = str(local_id)
            
            nasp = ET.SubElement(ident, f"{{{ns['base']}}}namespace")
            nasp.text = str(inspire_ns)
        except Exception:
            raise

        # 8. Label & Ref
        lbl = ET.SubElement(cp, f"{{{ns['cp']}}}label")
        # Logic: Extract Parcel Number (digits 6-7 of RC)
        # RC Example: 40679 26 VH2137S
        label_txt = ""
        clean_id = str(local_id).strip().upper()
        if len(clean_id) == 14 and clean_id[0:5].isdigit() and clean_id[5:7].isdigit():
             label_txt = clean_id[5:7] # Characters at index 5 and 6
        elif len(clean_id) == 20:
             # Full RC 20 chars: 4067926VH2137S0001TT
             if clean_id[0:5].isdigit() and clean_id[5:7].isdigit():
                 label_txt = clean_id[5:7]
        
        lbl.text = label_txt
        
        ref = ET.SubElement(cp, f"{{{ns['cp']}}}nationalCadastralReference")
        ref.text = str(local_id)
        
        # 9. Reference Point
        if coords:
            try:
                reference_polygons = [
                    Polygon(part['exterior'], part.get('huecos', []))
                    for part in parts_to_process
                ]
                reference_polygon = max(reference_polygons, key=lambda polygon: polygon.area)
                reference_point = reference_polygon.representative_point()
                cx, cy = reference_point.x, reference_point.y
                rp = ET.SubElement(cp, f"{{{ns['cp']}}}referencePoint")
                pt = ET.SubElement(rp, f"{{{ns['gml']}}}Point")
                pt.set(f"{{{ns['gml']}}}id", f"ReferencePoint_{local_id}")
                pt.set("srsName", srs_name)
                pos = ET.SubElement(pt, f"{{{ns['gml']}}}pos")
                pos.text = f"{cx:.2f} {cy:.2f}"
            except Exception:
                logger.exception("No se pudo calcular el punto de referencia del edificio")

        # Write
        try:
            ET.ElementTree(root).write(filepath, pretty_print=True, xml_declaration=True, encoding="UTF-8")
        except Exception:
            raise
