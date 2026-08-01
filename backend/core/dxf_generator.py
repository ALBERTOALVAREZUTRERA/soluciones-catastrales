
import ezdxf
from shapely.geometry import Polygon

class DXFGenerator:
    """ Exportador de parcelas GML a formato DXF (AutoCAD). """

    @staticmethod
    def exportar_a_dxf(features: list, output_path: str, epsg: str = "25830"):
        """ Crea un archivo DXF a partir de una lista de features. """
        
        doc = ezdxf.new('R2010')
        msp = doc.modelspace()
        
        # Crear capas
        doc.layers.add(name='PG-LP', color=3) # Límite de parcela
        doc.layers.add(name='PG-LI', color=5) # Límite interior
        doc.layers.add(name='PG-LT', color=7) # Referencia/etiqueta
        
        for feature in features:
            identificador = str(feature.get('id', 'S/N') or 'S/N')
            geometry = feature.get('geometry', []) # [[exterior], [hueco1], ...]
            
            if not geometry:
                raise ValueError(f"La parcela {identificador} no contiene geometría")
                
            # Exterior
            exterior = geometry[0]
            if exterior:
                # Asegurar cierre para la polilínea
                points = [(p[0], p[1]) for p in exterior]
                msp.add_lwpolyline(points, close=True, dxfattribs={'layer': 'PG-LP'})
                
                reference_point = Polygon(points, geometry[1:]).representative_point()
                msp.add_text(identificador, dxfattribs={
                    'layer': 'PG-LT',
                    'height': 2.0
                }).set_placement((reference_point.x, reference_point.y))

            # Interiores
            for hole in geometry[1:]:
                if hole:
                    h_points = [(p[0], p[1]) for p in hole]
                    msp.add_lwpolyline(h_points, close=True, dxfattribs={'layer': 'PG-LI'})
        
        doc.saveas(output_path)
        return output_path
