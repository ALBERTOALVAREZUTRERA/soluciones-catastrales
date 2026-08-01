# Soluciones Catastrales y Registrales

Aplicación web para servicios de topografía, GML, Catastro y Registro de la
Propiedad. Incluye un frontend Next.js, formularios de contacto por correo y
una API FastAPI para procesar DXF, KML/KMZ, Shapefile y GML.

## Requisitos

- Node.js 20
- npm
- Python 3.11

## Puesta en marcha local

1. Instala el frontend:

   ```bash
   npm ci
   ```

2. Copia `.env.example` a `.env.local` y sustituye los valores de ejemplo.
   Nunca subas ese archivo al repositorio.

3. Arranca el frontend:

   ```bash
   npm run dev
   ```

   La web estará disponible en `http://localhost:9002`.

4. En otra terminal, prepara y arranca la API:

   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate
   python -m pip install -r requirements.txt
   python main.py
   ```

   La API estará disponible en `http://localhost:8000`.

## Comprobaciones

```bash
npm test
npm run typecheck
npm run build
npm run verify:build
python -m pip install -r backend/requirements-dev.txt
python -m pip_audit -r backend/requirements-dev.txt
python -m unittest discover -s backend/tests -t backend -v
```

Antes de publicar, carga las variables reales del entorno y ejecuta:

```bash
npm run validate:env
```

Este comando solo informa de nombres ausentes o valores de ejemplo; nunca
imprime contraseñas.

## Despliegue

El frontend necesita un entorno compatible con Next.js y funciones de servidor,
ya que `/api/contact` y `/api/lead-magnet` envían correo. La API FastAPI se
despliega como servicio independiente y su URL pública se configura mediante
`NEXT_PUBLIC_BACKEND_URL`.

`apphosting.yaml` conserva la configuración mínima para Firebase App Hosting.
También es posible utilizar otra plataforma compatible, manteniendo las mismas
variables de entorno.

Consulta [la lista de preparación](docs/PRODUCTION_CHECKLIST.md) antes de
publicar una versión.

## Estructura principal

```text
src/app/              Rutas y API del frontend
src/components/       Interfaz y herramientas
src/lib/              Configuración y lógica compartida
backend/              API GIS en FastAPI
tests/frontend/       Pruebas automáticas del frontend
.github/workflows/    Integración continua
```
