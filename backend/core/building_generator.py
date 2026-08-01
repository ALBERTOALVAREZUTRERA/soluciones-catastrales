
import os
from datetime import datetime
from .parcel_model import ParcelaInfo
from lxml import etree as ET

class BuildingGenerator:
    """ Generador de GML de Edificios (Building) siguiendo la normativa INSPIRE y Catastro. """
    
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
    def generar_gml_edificio(parcela: ParcelaInfo, carpeta_destino: str, epsg: str = "25830") -> str:
        """ Genera un archivo GML de edificio (.gml) en formato VÁLIDO CATASTRO """
        from .gml_generator import GMLGenerator

        epsg_code = str(epsg).upper().replace("EPSG:", "")
        srs_name = f"urn:ogc:def:crs:EPSG::{epsg_code}"
        raw_parts = parcela.partes or [{
            "exterior": parcela.coordenadas,
            "huecos": parcela.interiores,
        }]
        normalized_parts = []
        for part in raw_parts:
            exterior, holes, _ = GMLGenerator.prepare_polygon(
                part.get("exterior", []),
                part.get("huecos", []),
                exterior_clockwise=True,
            )
            normalized_parts.append({"exterior": exterior, "huecos": holes})
        local_id = parcela.identificador
        # El GML generado por el usuario es un objeto local, no producido por la
        # Dirección General del Catastro, aunque incluya una referencia conocida.
        namespace = "ES.LOCAL.BU"
        full_id = f"{namespace}.{local_id}"
        
        # Root element - ID FIJO según referencia validada
        attr_qname = ET.QName(BuildingGenerator.NS_MAP['gml'], "id")
        root = ET.Element(f"{{{BuildingGenerator.NS_MAP['gml']}}}FeatureCollection", {
            attr_qname: namespace,
            f"{{{BuildingGenerator.NS_MAP['xsi']}}}schemaLocation": "http://inspire.jrc.ec.europa.eu/schemas/bu-ext2d/2.0 http://inspire.ec.europa.eu/draft-schemas/bu-ext2d/2.0/BuildingExtended2D.xsd"
        }, nsmap=BuildingGenerator.NS_MAP)
        
        # featureMember
        fm = ET.SubElement(root, f"{{{BuildingGenerator.NS_MAP['gml']}}}featureMember")
        
        # Building
        bu = ET.SubElement(fm, f"{{{BuildingGenerator.NS_MAP['bu-ext2d']}}}Building")
        bu.set(f"{{{BuildingGenerator.NS_MAP['gml']}}}id", full_id)
        
        # boundedBy
        all_exterior_points = [
            point
            for part in normalized_parts
            for point in part["exterior"]
        ]
        xs = [c[0] for c in all_exterior_points]
        ys = [c[1] for c in all_exterior_points]
        
        bb = ET.SubElement(bu, f"{{{BuildingGenerator.NS_MAP['gml']}}}boundedBy")
        env = ET.SubElement(bb, f"{{{BuildingGenerator.NS_MAP['gml']}}}Envelope", srsName=srs_name)
        lc = ET.SubElement(env, f"{{{BuildingGenerator.NS_MAP['gml']}}}lowerCorner")
        lc.text = f"{min(xs):.2f} {min(ys):.2f}"
        uc = ET.SubElement(env, f"{{{BuildingGenerator.NS_MAP['gml']}}}upperCorner")
        uc.text = f"{max(xs):.2f} {max(ys):.2f}"
        
        # beginLifespanVersion - Formato exacto sin Z
        bl = ET.SubElement(bu, f"{{{BuildingGenerator.NS_MAP['bu-core2d']}}}beginLifespanVersion")
        bl.text = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
        
        # condition
        cond = ET.SubElement(bu, f"{{{BuildingGenerator.NS_MAP['bu-core2d']}}}conditionOfConstruction")
        cond.text = "functional"
        
        # inspireId
        iid = ET.SubElement(bu, f"{{{BuildingGenerator.NS_MAP['bu-core2d']}}}inspireId")
        ident = ET.SubElement(iid, f"{{{BuildingGenerator.NS_MAP['base']}}}Identifier")
        lid = ET.SubElement(ident, f"{{{BuildingGenerator.NS_MAP['base']}}}localId")
        lid.text = local_id
        nasp = ET.SubElement(ident, f"{{{BuildingGenerator.NS_MAP['base']}}}namespace")
        nasp.text = namespace
        
        # geometry
        geo = ET.SubElement(bu, f"{{{BuildingGenerator.NS_MAP['bu-ext2d']}}}geometry")
        bugeo = ET.SubElement(geo, f"{{{BuildingGenerator.NS_MAP['bu-core2d']}}}BuildingGeometry")
        geo2d = ET.SubElement(bugeo, f"{{{BuildingGenerator.NS_MAP['bu-core2d']}}}geometry")
        
        surf = ET.SubElement(geo2d, f"{{{BuildingGenerator.NS_MAP['gml']}}}Surface")
        surf.set(f"{{{BuildingGenerator.NS_MAP['gml']}}}id", f"Surface_{full_id}")
        surf.set("srsName", srs_name)
        
        patches = ET.SubElement(surf, f"{{{BuildingGenerator.NS_MAP['gml']}}}patches")
        for part in normalized_parts:
            ppatch = ET.SubElement(patches, f"{{{BuildingGenerator.NS_MAP['gml']}}}PolygonPatch")

            ext = ET.SubElement(ppatch, f"{{{BuildingGenerator.NS_MAP['gml']}}}exterior")
            lr = ET.SubElement(ext, f"{{{BuildingGenerator.NS_MAP['gml']}}}LinearRing")
            pl = ET.SubElement(
                lr,
                f"{{{BuildingGenerator.NS_MAP['gml']}}}posList",
                srsDimension="2",
                count=str(len(part["exterior"])),
            )
            pl.text = " ".join([f"{x:.2f} {y:.2f}" for x, y in part["exterior"]])

            for h in part["huecos"]:
                inter = ET.SubElement(ppatch, f"{{{BuildingGenerator.NS_MAP['gml']}}}interior")
                lr_h = ET.SubElement(inter, f"{{{BuildingGenerator.NS_MAP['gml']}}}LinearRing")
                pl_h = ET.SubElement(
                    lr_h,
                    f"{{{BuildingGenerator.NS_MAP['gml']}}}posList",
                    srsDimension="2",
                    count=str(len(h)),
                )
                pl_h.text = " ".join([f"{x:.2f} {y:.2f}" for x, y in h])
            
        # Metadata de geometría
        acc = ET.SubElement(bugeo, f"{{{BuildingGenerator.NS_MAP['bu-core2d']}}}horizontalGeometryEstimatedAccuracy", uom="m")
        acc.text = "0.1"
        ref = ET.SubElement(bugeo, f"{{{BuildingGenerator.NS_MAP['bu-core2d']}}}horizontalGeometryReference")
        ref.text = "footPrint"
        isref = ET.SubElement(bugeo, f"{{{BuildingGenerator.NS_MAP['bu-core2d']}}}referenceGeometry")
        isref.text = "true"
        
        # Máximo de plantas sobre rasante declarado por el usuario.
        plts = ET.SubElement(bu, f"{{{BuildingGenerator.NS_MAP['bu-ext2d']}}}numberOfFloorsAboveGround")
        plts.text = str(max(1, int(parcela.numero_plantas)))
        
        # Guardar - Usar el identificador sanitizado (sin espacios) para el nombre del archivo
        filepath = os.path.join(carpeta_destino, f"{local_id}.gml")
        
        # Formato de escritura compatible con referencia (con comentario)
        xml_str = ET.tostring(root, pretty_print=True, xml_declaration=True, encoding="UTF-8")
        xml_comment = f"<!--GML Catastro válido - Generado {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}-->".encode('utf-8')
        
        # Re-insertar comentario después de la declaración XML si es posible, o simplemente escribir
        with open(filepath, 'wb') as f:
            f.write(xml_str.replace(b'?>', b'?>\n' + xml_comment))
        
        return filepath
