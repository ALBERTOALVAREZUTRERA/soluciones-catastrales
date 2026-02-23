import os
import PyPDF2

pdf_dir = r"D:\WEB_CATASTRO_ALBERTO\HOJAS VALORACION EJEMPLO"
output_dir = r"D:\WEB_CATASTRO_ALBERTO\tmp_pdf_texts"

os.makedirs(output_dir, exist_ok=True)

for filename in os.listdir(pdf_dir):
    if filename.endswith('.pdf'):
        pdf_path = os.path.join(pdf_dir, filename)
        txt_path = os.path.join(output_dir, filename + '.txt')
        
        try:
            with open(pdf_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                text = ""
                for page in reader.pages:
                    text += page.extract_text() + "\n"
            
            with open(txt_path, 'w', encoding='utf-8') as f:
                f.write(text)
            print(f"Extracted {filename}")
        except Exception as e:
            print(f"Error extracting {filename}: {e}")
