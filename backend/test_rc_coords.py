import urllib.request
import ssl
import json
import asyncio
from main import BuscarCoordsRequest, buscar_por_coordenadas

async def test():
    # Coordenadas de la Puerta del Sol (Madrid) -> Debería sacar una RC del ayuntamiento o similar
    # Lon=-3.703790 Lat=40.416775
    req = BuscarCoordsRequest(lat=40.416824, lon=-3.703440)
    res = await buscar_por_coordenadas(req)
    print("Resultado Puerta del Sol:")
    print(json.dumps(res, indent=2, ensure_ascii=False))

    # Coordenadas en Andújar (p.ej. Ayuntamiento)
    # Lon=-4.0208 Lat=38.0392
    req2 = BuscarCoordsRequest(lat=38.0392, lon=-4.0208)
    res2 = await buscar_por_coordenadas(req2)
    print("\nResultado Andújar:")
    print(json.dumps(res2, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    asyncio.run(test())
