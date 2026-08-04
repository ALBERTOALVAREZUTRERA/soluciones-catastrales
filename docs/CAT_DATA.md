# Datos constructivos oficiales CAT

La calculadora puede enriquecerse con los ficheros CAT de la Dirección General
del Catastro. Estos ficheros contienen descripción física no protegida, pero no
titularidad ni valores catastrales.

## Descarga

1. Acceder a la Sede Electrónica del Catastro, apartado **Difusión de datos
   catastrales**.
2. Identificarse con certificado o Cl@ve y aceptar la licencia de descarga.
3. Descargar el fichero CAT que incluya el municipio requerido.

La descarga la realiza una sola vez el responsable de la plataforma. Los
clientes finales solo introducen su referencia catastral.

## Creación del índice

```powershell
cd backend
.\venv\Scripts\python.exe scripts\import_cat.py `
  C:\ruta\fichero.CAT `
  C:\ruta\catastro.sqlite3
```

Configurar la ruta de lectura en el backend:

```text
CATASTRO_CAT_DB_PATH=C:\ruta\catastro.sqlite3
```

El fichero CAT y la base SQLite no se incorporan al repositorio. En producción
deben almacenarse en un volumen privado de Railway y actualizarse cuando se
descargue una nueva edición oficial.

## Datos utilizados

- registro 14: destino, reforma, antigüedad efectiva, superficie, tipología y
  categoría constructiva;
- registro 15: referencia completa, antigüedad y superficie del inmueble.

Si el índice no está disponible o no contiene una referencia, el servicio vuelve
automáticamente a los datos públicos en línea y mantiene el resultado como
estimación.
