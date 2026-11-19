# ADR-009: Selección de Cypress como herramienta de pruebas End-to-End (E2E)

- **Estado:** Aceptado
- **Fecha:** 2026-08-31
- **Autor:** Gonzalo Lima
- **Sprint:** 1

## Contexto
Para garantizar que el sistema es confiable, necesitamos probar los flujos críticos simulando el comportamiento de un usuario real en el navegador. Es vital asegurarnos de que el proceso principal no se rompa accidentalmente al subir nuevas actualizaciones.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **Pruebas manuales exclusivamente** | No requiere inversión de tiempo en codificar scripts de testing. | Altamente subjetivo, propenso a omisiones humanas y imposible de integrar de forma continua en un pipeline. | Inaceptable frente a los estándares de calidad y automatización exigidos por el proyecto. |
| **Selenium WebDriver** | Estándar clásico de la industria con soporte multiplataforma masivo. | Configuración compleja, pruebas lentas y problemas frecuentes de sincronización. | Demasiado pesado y difícil de configurar en comparación con alternativas modernas para SPA. |
| **Cypress** | Interfaz visual interactiva excelente para depuración paso a paso y ejecución directa en el navegador del flujo real del usuario. | Requiere refactorizar los scripts de prueba si se modifica de forma radical la estructura visual de un módulo. | **Seleccionada** por su excelente DX (Developer Experience), rapidez y robustez en pruebas de interfaz. |

## Decisión
Usaremos Cypress como nuestra herramienta de pruebas de integración y end-to-end. Escribiremos scripts que abran automáticamente el navegador, completen formularios y hagan clic en la interfaz tal como lo haría un usuario de la aplicación.

## Consecuencias
- **Positivas:** Cuenta con una interfaz visual que nos permite visualizar la prueba paso a paso para ver exactamente dónde y por qué falló un test.
- **Negativas:** Hay que reescribir los test si cambiamos la estructura de un módulo.
- **Deuda asumida:** Asegurar el mantenimiento continuo de los scripts de prueba ante cada evolución significativa de las vistas del frontend.

## Requisitos relacionados
Unidad V, RNF-01 a RNF-04.