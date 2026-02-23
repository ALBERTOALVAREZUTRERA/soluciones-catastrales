import urllib.request
import re

url = 'https://boe.es/buscar/doc.php?id=BOE-A-2021-18753'
search_url = 'https://boe.es/buscar/boe.php?campo%5B0%5D=ORI&dato%5B0%5D=7240&campo%5B1%5D=TIT&dato%5B1%5D=elementos+precisos+para+la+determinaci%C3%B3n+de+los+valores+de+referencia&accion=Buscar'

try:
    req = urllib.request.Request(search_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        links = re.findall(r'href="(/diario_boe/txt\.php\?id=BOE-A-2021-[0-9]+)"', html)
        if links:
            # First match might be the resolution for urban properties
            boe_link = 'https://boe.es' + links[0]
            print(f'Found Urban BOE Link: {boe_link}')
            req2 = urllib.request.Request(boe_link, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req2) as res2:
                txt = res2.read().decode('utf-8')
                cities = ['Andújar', 'Jaén', 'Madrid', 'Bailén', 'Marmolejo', 'Lopera', 'Arjona', 'Villanueva_Reina', 'Baños', 'Lahiguera']
                
                # The table might contain rows like: 23 005 Andújar | 370 | 600
                # We can just look for the city name and grab the numbers around it
                for city in cities:
                    # Let's clean the search for Villanueva de la Reina
                    search_city = city.replace('_', ' ')
                    p = r'.{0,40}' + search_city + r'.{0,40}'
                    m = re.findall(p, txt, re.IGNORECASE)
                    if m:
                        print(f'--- {city} ---')
                        for line in m[:3]:
                            print(line.strip().replace('\n', ' '))
                        
            
            # Second link might be rural properties? The search usually returns multiple
            if len(links) > 1:
                boe_link = 'https://boe.es' + links[1]
                print(f'\nFound Second BOE Link: {boe_link}')
                req2 = urllib.request.Request(boe_link, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req2) as res2:
                    txt = res2.read().decode('utf-8')
                    m = re.findall(r'.{0,40}Andújar.{0,40}', txt, re.IGNORECASE)
                    if m:
                        print('Second link mentions Andújar too:')
                        print(m[:1])
                        
        else:
            print('No links found')
except Exception as e:
    print(f'Error: {e}')
