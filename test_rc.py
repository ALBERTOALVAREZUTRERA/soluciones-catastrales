from backend.main import buscar_por_referencia_catastral
from pydantic import BaseModel

class Req(BaseModel):
    referencia_catastral: str

import asyncio

async def test_rc():
    try:
        req = Req(referencia_catastral="7110106VH0171S0001HY")
        res = await buscar_por_referencia_catastral(req)
        print("RESULT:")
        print(res)
    except Exception as e:
        print("EXCEPTION:")
        print(e)
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    asyncio.run(test_rc())
