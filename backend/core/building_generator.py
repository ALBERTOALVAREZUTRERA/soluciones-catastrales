
import os
from datetime import datetime
from .parcel_model import ParcelaInfo, sanitizar_nombre_catastral
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
        
        # Sanitizar identificador - Usar nombre original si existe para mayor precisión
        base_name = parcela.nombre_original if parcela.nombre_original else parcela.nombre_archivo
        local_id = sanitizar_nombre_catastral(base_name)
        
        # Root element - ID FIJO según referencia validada
        attr_qname = ET.QName(BuildingGenerator.NS_MAP['gml'], "id")
        root = ET.Element(f"{{{BuildingGenerator.NS_MAP['gml']}}}FeatureCollection", {
            attr_qname: "ES.SDGC.BU", # ID Fijo validado
            f"{{{BuildingGenerator.NS_MAP['xsi']}}}schemaLocation": "http://inspire.jrc.ec.europa.eu/schemas/bu-ext2d/2.0 http://inspire.ec.europa.eu/draft-schemas/bu-ext2d/2.0/BuildingExtended2D.xsd"
        }, nsmap=BuildingGenerator.NS_MAP)
        
        # featureMember
        fm = ET.SubElement(root, f"{{{BuildingGenerator.NS_MAP['gml']}}}featureMember")
        
        # Building - ID PREFIJO LOCAL.BU siempre según referencia
        bu = ET.SubElement(fm, f"{{{BuildingGenerator.NS_MAP['bu-ext2d']}}}Building")
        bu.set(f"{{{BuildingGenerator.NS_MAP['gml']}}}id", f"ES.LOCAL.BU.{local_id}")
        
        # boundedBy
        xs = [c[0] for c in parcela.coordenadas]
        ys = [c[1] for c in parcela.coordenadas]
        if not xs: xs, ys = [0], [0]
        
        bb = ET.SubElement(bu, f"{{{BuildingGenerator.NS_MAP['gml']}}}boundedBy")
        env = ET.SubElement(bb, f"{{{BuildingGenerator.NS_MAP['gml']}}}Envelope", srsName="urn:ogc:def:crs:EPSG::25830")
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
        nasp.text = "ES.LOCAL.BU" # Fijo según referencia
        
        # geometry
        geo = ET.SubElement(bu, f"{{{BuildingGenerator.NS_MAP['bu-ext2d']}}}geometry")
        bugeo = ET.SubElement(geo, f"{{{BuildingGenerator.NS_MAP['bu-core2d']}}}BuildingGeometry")
        geo2d = ET.SubElement(bugeo, f"{{{BuildingGenerator.NS_MAP['bu-core2d']}}}geometry")
        
        surf = ET.SubElement(geo2d, f"{{{BuildingGenerator.NS_MAP['gml']}}}Surface")
        surf.set(f"{{{BuildingGenerator.NS_MAP['gml']}}}id", f"Surface_ES.LOCAL.BU.{local_id}")
        surf.set("srsName", "urn:ogc:def:crs:EPSG::25830")
        
        patches = ET.SubElement(surf, f"{{{BuildingGenerator.NS_MAP['gml']}}}patches")
        ppatch = ET.SubElement(patches, f"{{{BuildingGenerator.NS_MAP['gml']}}}PolygonPatch")
        
        # Exterior
        ext = ET.SubElement(ppatch, f"{{{BuildingGenerator.NS_MAP['gml']}}}exterior")
        lr = ET.SubElement(ext, f"{{{BuildingGenerator.NS_MAP['gml']}}}LinearRing")
        pl = ET.SubElement(lr, f"{{{BuildingGenerator.NS_MAP['gml']}}}posList", srsDimension="2")
        
        # Asegurar cierre y formato
        coords = parcela.coordenadas
        if coords and coords[0] != coords[-1]:
            coords.append(coords[0])
        pl.text = " ".join([f"{x:.2f} {y:.2f}" for x, y in coords])
        
        # Interiores (huecos)
        for h in parcela.interiores:
            if h and h[0] != h[-1]:
                h.append(h[0])
            inter = ET.SubElement(ppatch, f"{{{BuildingGenerator.NS_MAP['gml']}}}interior")
            lr_h = ET.SubElement(inter, f"{{{BuildingGenerator.NS_MAP['gml']}}}LinearRing")
            pl_h = ET.SubElement(lr_h, f"{{{BuildingGenerator.NS_MAP['gml']}}}posList", srsDimension="2")
            pl_h.text = " ".join([f"{x:.2f} {y:.2f}" for x, y in h])
            
        # Metadata de geometría
        acc = ET.SubElement(bugeo, f"{{{BuildingGenerator.NS_MAP['bu-core2d']}}}horizontalGeometryEstimatedAccuracy", uom="m")
        acc.text = "0.1"
        ref = ET.SubElement(bugeo, f"{{{BuildingGenerator.NS_MAP['bu-core2d']}}}horizontalGeometryReference")
        ref.text = "footPrint"
        isref = ET.SubElement(bugeo, f"{{{BuildingGenerator.NS_MAP['bu-core2d']}}}referenceGeometry")
        isref.text = "true"
        
        # floors - REFERENCIA USA 0
        plts = ET.SubElement(bu, f"{{{BuildingGenerator.NS_MAP['bu-ext2d']}}}numberOfFloorsAboveGround")
        plts.text = "0"
        
        # Guardar - Usar el identificador sanitizado (sin espacios) para el nombre del archivo
        filepath = os.path.join(carpeta_destino, f"{local_id}.gml")
        
        # Formato de escritura compatible con referencia (con comentario)
        xml_str = ET.tostring(root, pretty_print=True, xml_declaration=True, encoding="UTF-8")
        xml_comment = f"<!--GML Catastro válido - Generado {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}-->".encode('utf-8')
        
        # Re-insertar comentario después de la declaración XML si es posible, o simplemente escribir
        with open(filepath, 'wb') as f:
            f.write(xml_str.replace(b'?>', b'?>\n' + xml_comment))
        
        return filepath
