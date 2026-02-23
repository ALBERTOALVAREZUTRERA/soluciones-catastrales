import urllib.request
import urllib.parse
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

rc = "7110106VH0171S0001HY"
rc_trunc = rc[:14]

print(f"Buscando RC: {rc} (truncado a {rc_trunc} para coord)")

url_datos = f"https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?Provincia=&Municipio=&RC={rc}"
print(url_datos)

req = urllib.request.Request(url_datos, headers={"User-Agent": "Mozilla/5.0"})
try:
    resp = urllib.request.urlopen(req, context=ctx, timeout=15)
    xml_datos = resp.read().decode("utf-8")
    print(xml_datos)
except Exception as e:
    print(e)
