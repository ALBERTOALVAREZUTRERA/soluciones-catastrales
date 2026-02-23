import docx

def read_prompt():
    try:
        doc = docx.Document('PROMPT.docx')
        lines = [p.text for p in doc.paragraphs if p.text.strip()]
        for line in lines:
            ll = line.lower()
            if 'railway' in ll or 'vercel' in ll or 'http' in ll:
                print(line)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    read_prompt()
