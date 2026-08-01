# Lista de preparación para producción

## Bloqueantes antes de publicar

- [ ] Sustituir `LEGAL_TAX_ID` por el NIF real del titular.
- [ ] Completar `LEGAL_PROFESSIONAL_BODY` y `LEGAL_REGISTRATION_NUMBER`.
- [ ] Configurar `NEXT_PUBLIC_SITE_URL` con el dominio definitivo.
- [ ] Configurar `NEXT_PUBLIC_BACKEND_URL` con la API HTTPS definitiva.
- [ ] Configurar SMTP y comprobar la recepción de ambos formularios.
- [ ] Revisar los timeouts SMTP; los envíos no se reintentan para evitar duplicados.
- [ ] Definir `APP_ENV=production` y `ADMITTED_ORIGINS` en la API.
- [ ] Ejecutar `npm run validate:env`.

## Comprobaciones técnicas

- [ ] Ejecutar `npm run check`.
- [ ] Ejecutar las pruebas del backend.
- [ ] Comprobar `/health` en la API pública.
- [ ] Probar una conversión con un archivo no sensible.
- [ ] Revisar los límites de subida según la memoria del servidor.
- [ ] Limitar el cuerpo en el proxy y permitir 1 MB adicional para multipart.
- [ ] Ajustar workers × `MAX_CONCURRENT_GIS_JOBS` a la CPU y memoria disponibles.
- [ ] Confirmar HTTPS y redirección del dominio sin `www` o con `www`.

## Comprobaciones funcionales

- [ ] Enviar una consulta desde la portada.
- [ ] Enviar el formulario de la guía y descargar el PDF.
- [ ] Verificar navegación móvil y teclado.
- [ ] Confirmar que Analytics y Meta no cargan antes del consentimiento.
- [ ] Revisar aviso legal, privacidad, cookies y términos con los datos reales.

## Operación

- [ ] Configurar monitorización del endpoint `/health`.
- [ ] Conservar `X-Request-ID` en el proxy y buscar incidencias por esa referencia.
- [ ] Alertar ante respuestas 502 repetidas de Catastro/WMS.
- [ ] Aplicar rate limiting compartido en CDN/proxy si hay más de una instancia.
- [ ] Establecer un procedimiento de actualización de dependencias.
- [ ] Documentar dónde se guardan las variables y quién puede modificarlas.
- [ ] Definir copias de seguridad si se añade persistencia en el futuro.
