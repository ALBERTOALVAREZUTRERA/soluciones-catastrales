import urllib.request, ssl, re, json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Query with 20 chars
rc = "8409103VH0180N0001AI"
url = f"https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?Provincia=&Municipio=&RC={rc}"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})

try:
    with urllib.request.urlopen(req, context=ctx) as r:
        xml = r.read().decode("utf-8")
        print("--- FULL XML ANALYSIS (20 characters) ---")
        with open("full_catastro_20_response.xml", "w", encoding="utf-8") as f:
            f.write(xml)
        print("XML saved.")

except Exception as e:
    print(f"Error: {e}")
