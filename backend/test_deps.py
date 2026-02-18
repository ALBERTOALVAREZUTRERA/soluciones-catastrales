import sys
print("Starting backend test...", flush=True)
try:
    import fastapi
    print(f"FastAPI: {fastapi.__version__}", flush=True)
except ImportError as e:
    print(f"ERROR fastapi: {e}", flush=True)
    sys.exit(1)

try:
    import uvicorn
    print("Uvicorn: OK", flush=True)
except ImportError as e:
    print(f"ERROR uvicorn: {e}", flush=True)
    sys.exit(1)

# Try starting the actual server
print("Starting server on port 8000...", flush=True)
import main
