"""Quick test of Catastro API"""
import ssl
import urllib.request
import sys

# Test just the connection
rc = "9872023VH5765A"
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = f"https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_CPMRC?Provincia=&Municipio=&SRS=EPSG:4326&RC={rc}"
print(f"Connecting to: {url[:80]}...")
sys.stdout.flush()

try:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    resp = urllib.request.urlopen(req, context=ctx, timeout=10)
    data = resp.read().decode("utf-8")
    print(f"SUCCESS - Got {len(data)} bytes")
    print(data[:500])
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")

sys.stdout.flush()
