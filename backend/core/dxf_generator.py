
import ezdxf
import os

class DXFGenerator:
    """ Exportador de parcelas GML a formato DXF (AutoCAD). """

    @staticmethod
    def exportar_a_dxf(features: list, output_path: str, epsg: str = "25830"):
        """ Crea un archivo DXF a partir de una lista de features. """
        
        doc = ezdxf.new('R2010')
        msp = doc.modelspace()
        
        # Crear capas
        doc.layers.add(name='PARCELA', color=3) # Verde
        doc.layers.add(name='HUECOS', color=5)  # Azul
        doc.layers.add(name='TEXTO', color=7)   # Blanco
        
        for feature in features:
            identificador = feature.get('id', 'S/N')
            geometry = feature.get('geometry', []) # [[exterior], [hueco1], ...]
            
            if not geometry:
                continue
                
            # Exterior
            exterior = geometry[0]
            if exterior:
                # Asegurar cierre para la polilínea
                points = [(p[0], p[1]) for p in exterior]
                msp.add_lwpolyline(points, close=True, dxfattribs={'layer': 'PARCELA'})
                
                # Añadir texto identificador en el centroide (aproximado)
                cx = sum(p[0] for p in points) / len(points)
                cy = sum(p[1] for p in points) / len(points)
                msp.add_text(identificador, dxfattribs={
                    'layer': 'TEXTO',
                    'height': 2.0
                }).set_placement((cx, cy))

            # Interiores
            for hole in geometry[1:]:
                if hole:
                    h_points = [(p[0], p[1]) for p in hole]
                    msp.add_lwpolyline(h_points, close=True, dxfattribs={'layer': 'HUECOS'})
        
        doc.saveas(output_path)
        return output_path
