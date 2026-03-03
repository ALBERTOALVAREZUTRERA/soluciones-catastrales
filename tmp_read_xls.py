import os, sys, glob

output_file = r'D:\WEB_CATASTRO_ALBERTO\tmp_xls_output.txt'
with open(output_file, 'w', encoding='utf-8') as f:
    pattern = r'D:\WEB_CATASTRO_ALBERTO\HOJAS VALORACION EJEMPLO\*.xls'
    files = glob.glob(pattern)
    f.write(f'Found files: {files}\n')
    
    if files:
        path = files[0]
        f.write(f'Using: {path}\n')
        f.write(f'Size: {os.path.getsize(path)} bytes\n')
        
        with open(path, 'rb') as fh:
            header = fh.read(8)
            f.write(f'Header: {header.hex()}\n')
        
        try:
            import xlrd
            f.write(f'xlrd version: {xlrd.__VERSION__}\n')
            wb = xlrd.open_workbook(path)
            f.write(f'Sheets: {wb.sheet_names()}\n')
            for i in range(min(5, wb.nsheets)):
                ws = wb.sheet_by_index(i)
                f.write(f'\n=== SHEET: {ws.name} (rows={ws.nrows}, cols={ws.ncols}) ===\n')
                for r in range(min(80, ws.nrows)):
                    row_data = []
                    for c in range(ws.ncols):
                        v = ws.cell_value(r, c)
                        if v not in ('', None):
                            row_data.append(f'[{c}]={v}')
                    if row_data:
                        sep = '  |  '
                        line = sep.join(row_data)
                        f.write(f'R{r}: {line}\n')
        except Exception as e:
            f.write(f'xlrd error: {e}\n')
            import traceback
            traceback.print_exc(file=f)
    
    f.write('\nDONE\n')
