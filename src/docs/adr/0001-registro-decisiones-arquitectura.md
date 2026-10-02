# 1. Registro de Decisiones de Arquitectura

Fecha: 2026-08-31
Estado: Aceptado

## Contexto
A medida que el proyecto crece, tomaremos decisiones técnicas importantes. Si no registramos el por qué de estas decisiones, corremos el riesgo de repetir discusiones en el futuro u olvidar el contexto original.

## Decisión
Usaremos documentación ADR basándonos en la estructura propuesta por Michael Nygard. Crearemos un nuevo archivo Markdown en el directorio `docs/adr/` cada vez que se requiera documentar una decisión arquitectónica importante.
Los ADR serán inmutables. Si una decisión se revierte o cambia en el futuro, crearemos un nuevo ADR que explique el cambio y marcaremos el ADR antiguo como "Obsoleto" o "Reemplazado por el ADR-XXXX".

## Consecuencias
* **Positivas:** Tendremos un historial claro y documentado junto al código.
* **Negativas:** Requerirá disciplina por parte de los desarrolladores para  escribir el documento al realizar la implementación de un cambio arquitectónico grande.