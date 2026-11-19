# ADR-001: Uso de documentación basada en ADRs (Michael Nygard)

- **Estado:** Aceptado
- **Fecha:** 2026-08-31
- **Autor:** Gonzalo Lima
- **Sprint:** 1

## Contexto
A medida que el proyecto crece, tomaremos decisiones técnicas importantes. Si no registramos el por qué de estas decisiones, corremos el riesgo de repetir discusiones en el futuro u olvidar el contexto original.

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **Documentación en Wiki de GitHub / Confluence** | Espacio centralizado y formato visual amigable. | Queda desacoplada del código fuente y es propensa a quedar desactualizada. | Se prefiere mantener la documentación técnica versionada junto al código. |
| **Comentarios extensos en el código o README general** | Todo está en un solo lugar al alcance de la mano. | No permite estructurar alternativas, contexto histórico ni matriz de consecuencias de forma limpia. | Resulta insuficiente para registrar decisiones arquitectónicas formales y trazables. |
| **Formato ADR de Michael Nygard en Markdown (`docs/adr/`)** | Versionado en Git, inmutable, estructurado y directamente vinculado al repositorio. | Requiere disciplina estricta del equipo para redactar cada registro. | **Seleccionada** por su trazabilidad y alineación con los requerimientos del proyecto. |

## Decisión
Usaremos documentación ADR basándonos en la estructura propuesta por Michael Nygard. Crearemos un nuevo archivo Markdown en el directorio `docs/adr/` cada vez que se requiera documentar una decisión arquitectónica importante.
Los ADR serán inmutables. Si una decisión se revierte o cambia en el futuro, crearemos un nuevo ADR que explique el cambio y marcaremos el ADR antiguo como "Obsoleto" o "Reemplazado por el ADR-XXXX".

## Consecuencias
- **Positivas:** Tendremos un historial claro y documentado junto al código.
- **Negativas:** Requerirá disciplina por parte de los desarrolladores para  escribir el documento al realizar la implementación de un cambio arquitectónico grande.
- **Deuda asumida:** Ninguna.

## Requisitos relacionados
Ninguno (Transversal al proyecto).