<?xml version='1.0' encoding='utf-8'?>
<!--COPYRIGHT ATNL-COIGT v2024_1-->
<!--Generado por www.atnl.es FECHA: 2025-12-30T18:30:48.079Z-->
<gml:FeatureCollection gml:id='ES.SDGC.CP' xmlns:gml='http://www.opengis.net/gml/3.2' xmlns:gmd='http://www.isotc211.org/2005/gmd' xmlns:ogc='http://www.opengis.net/ogc' xmlns:xlink='http://www.w3.org/1999/xlink' xmlns:cp='http://inspire.ec.europa.eu/schemas/cp/4.0' xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' xsi:schemaLocation='http://inspire.ec.europa.eu/schemas/cp/4.0 http://inspire.ec.europa.eu/schemas/cp/4.0/CadastralParcels.xsd'>
<gml:featureMember>
      <cp:CadastralParcel gml:id='ES.LOCAL.CP.FR_15850'>
<!-- Superficie de la parcela en metros cuadrados. Tiene que coincidir con la calculada con las coordenadas.-->
        <cp:areaValue uom='m2'>2288</cp:areaValue>
         <cp:beginLifespanVersion xsi:nil='true' nilReason='other:unpopulated'></cp:beginLifespanVersion>
<!-- Geometria en formato GML       -->
        <cp:geometry>
<!-- srs Name código del sistema de referencia en el que se dan las coordenadas, que debe coincidir con el de la cartografía catastral -->
<!-- El sistema de referencia de la cartografía catastral varia según provincia, siendo accesible desde la consulta de cartografía en Sede -->
          <gml:MultiSurface gml:id='MultiSurface_ES.LOCAL.CP.FR_15850' srsName='urn:ogc:def:crs:EPSG::25830'>
            <gml:surfaceMember>
               <gml:Surface gml:id='Surface_ES.LOCAL.CP.FR_15850' srsName='urn:ogc:def:crs:EPSG::25830'>
                  <gml:patches>
                   <gml:PolygonPatch>
                    <gml:exterior>
                      <gml:LinearRing>
<!-- Lista de coordenadas separadas por espacios o en líneas diferentes. El recinto debe cerrarse, el primer par de coordenadas debe ser igual al último    -->
                        <gml:posList srsDimension='2'>409854.81 4210550.66 409828.81 4210553.62 409834.29 4210631.43 409865.07 4210614.45 409863.18 4210598.80 409862.19 4210590.57 409863.08 4210549.43 409860.02 4210550.07 409854.81 4210550.66</gml:posList>
                      </gml:LinearRing>
                    </gml:exterior>
                  </gml:PolygonPatch>
                </gml:patches>
              </gml:Surface>
            </gml:surfaceMember>
          </gml:MultiSurface>
       </cp:geometry>
       <cp:inspireId xmlns:base='http://inspire.ec.europa.eu/schemas/base/3.3'>
         <base:Identifier >
<!-- Identificativo local de la parcela. Solo puede tener letras y numeros. -->
           <base:localId>FR_15850</base:localId>
           <base:namespace>ES.LOCAL.CP</base:namespace>
         </base:Identifier>
       </cp:inspireId>
       <cp:label/>
       <cp:nationalCadastralReference/>
    </cp:CadastralParcel>
</gml:featureMember>
</gml:FeatureCollection>
