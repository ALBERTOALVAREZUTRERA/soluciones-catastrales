"""Test script to diagnose Catastro API proxy issues"""
import urllib.request
import urllib.error
import ssl
import json
import xml.etree.ElementTree as ET
import re

def test_catastro_search(rc="9872023VH5765A"):
    print(f"\n{'='*60}")
    print(f"Testing Catastro search for RC: {rc}")
    print(f"{'='*60}")
    
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    # Test 1: Direct API call to Catastro (coordinates)
    print("\n--- Test 1: Direct API - Coordenadas ---")
    url_coord = f"https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCoordenadas.asmx/Consulta_CPMRC?Provincia=&Municipio=&SRS=EPSG:4326&RC={rc}"
    print(f"URL: {url_coord}")
    
    try:
        req = urllib.request.Request(url_coord, headers={"User-Agent": "Mozilla/5.0"})
        resp = urllib.request.urlopen(req, context=ctx, timeout=15)
        xml_coord = resp.read().decode("utf-8")
        print(f"Response length: {len(xml_coord)} bytes")
        print(f"Response (first 1000 chars):\n{xml_coord[:1000]}")
        
        # Try to parse
        xml_coord_clean = xml_coord.replace(' xmlns=', ' xmlns_disabled=')
        root = ET.fromstring(xml_coord_clean)
        
        lat = None
        lon = None
        print("\n--- Iterating XML elements ---")
        for elem in root.iter():
            tag = elem.tag.split('}')[-1] if '}' in elem.tag else elem.tag
            if elem.text and elem.text.strip():
                print(f"  Tag: {tag:30s} Text: {elem.text.strip()[:50]}")
            if elem.tag and 'xcen' in elem.tag.lower():
                try: 
                    lon = float(elem.text)
                    print(f"  >>> Found lon (xcen): {lon}")
                except: 
                    print(f"  >>> Found xcen but can't parse: '{elem.text}'")
            if elem.tag and 'ycen' in elem.tag.lower():
                try: 
                    lat = float(elem.text)
                    print(f"  >>> Found lat (ycen): {lat}")
                except: 
                    print(f"  >>> Found ycen but can't parse: '{elem.text}'")
        
        if lat and lon:
            print(f"\n SUCCESS: lat={lat}, lon={lon}")
        else:
            print(f"\n FAIL: lat={lat}, lon={lon}")
            
            # Regex fallback
            xcen_match = re.search(r'<[^>]*xcen[^>]*>([0-9.\-]+)</[^>]*>', xml_coord, re.IGNORECASE)
            ycen_match = re.search(r'<[^>]*ycen[^>]*>([0-9.\-]+)</[^>]*>', xml_coord, re.IGNORECASE)
            if xcen_match and ycen_match:
                print(f"  Regex fallback found: lon={xcen_match.group(1)}, lat={ycen_match.group(1)}")
            else:
                print(f"  Regex fallback also failed")
                
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code}")
        print(f"Response: {e.read().decode('utf-8')[:500]}")
    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")
    
    # Test 2: Direct API call to Catastro (datos inmueble)
    print("\n--- Test 2: Direct API - Datos Inmueble ---")
    url_datos = f"https://ovc.catastro.meh.es/ovcservweb/OVCSWLocalizacionRC/OVCCallejero.asmx/Consulta_DNPRC?Provincia=&Municipio=&RC={rc}"
    print(f"URL: {url_datos}")
    
    try:
        req = urllib.request.Request(url_datos, headers={"User-Agent": "Mozilla/5.0"})
        resp = urllib.request.urlopen(req, context=ctx, timeout=15)
        xml_datos = resp.read().decode("utf-8")
        print(f"Response length: {len(xml_datos)} bytes")
        print(f"Response (first 1000 chars):\n{xml_datos[:1000]}")
        
        # Check for error messages in the XML
        if 'error' in xml_datos.lower() or 'no existe' in xml_datos.lower():
            print("\n WARNING: XML contains error/not found message")
            
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code}")
    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")
    
    # Test 3: Backend proxy
    print("\n--- Test 3: Backend Proxy (/catastro/buscar-rc) ---")
    try:
        data = json.dumps({"referencia_catastral": rc}).encode()
        req = urllib.request.Request(
            "http://localhost:8000/catastro/buscar-rc",
            data=data,
            headers={"Content-Type": "application/json"}
        )
        resp = urllib.request.urlopen(req, timeout=20)
        result = json.loads(resp.read().decode("utf-8"))
        print(f"Result: {json.dumps(result, indent=2, ensure_ascii=False)}")
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        print(f"HTTP Error {e.code}: {body[:500]}")
    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")


if __name__ == "__main__":
    # Test with a known cadastral reference
    test_catastro_search("9872023VH5765A")
    
    # Test with another reference (if you have one)
    # test_catastro_search("YOUR_REF_HERE")
