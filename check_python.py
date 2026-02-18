import sys
with open("d:/WEB_CATASTRO_ALBERTO/python_check.txt", "w") as f:
    f.write(f"Python: {sys.executable}\n")
    f.write(f"Version: {sys.version}\n")
    f.write(f"Path:\n")
    for p in sys.path:
        f.write(f"  {p}\n")
    
    try:
        import fastapi
        f.write(f"\nfastapi: OK ({fastapi.__version__})\n")
    except ImportError as e:
        f.write(f"\nfastapi: MISSING ({e})\n")
    
    try:
        import uvicorn
        f.write(f"uvicorn: OK\n")
    except ImportError as e:
        f.write(f"uvicorn: MISSING ({e})\n")
    
    try:
        import ezdxf
        f.write(f"ezdxf: OK ({ezdxf.__version__})\n")
    except ImportError as e:
        f.write(f"ezdxf: MISSING ({e})\n")
    
    try:
        import shapely
        f.write(f"shapely: OK ({shapely.__version__})\n")
    except ImportError as e:
        f.write(f"shapely: MISSING ({e})\n")

    f.write("\nDone!\n")
