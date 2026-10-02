# 9. Uso de Cypress para tests end-to-end
Fecha: 2026-08-31
Estado: Aceptado

## Contexto
Para garantizar que el sistema es confiable, necesitamos probar los flujos críticos simulando el comportamiento de un usuario real en el navegador. Es vital asegurarnos de que el proceso principal no se rompa accidentalmente al subir nuevas actualizaciones.

## Decisión
Usaremos Cypress como nuestra herramienta de pruebas de integración y end-to-end. Escribiremos scripts que abran automáticamente el navegador, completen formularios y hagan clic en la interfaz tal como lo haría un usuario de la aplicación.

## Consecuencias
* **Positivas:**
  * Cuenta con una interfaz visual que nos permite visualizar la prueba paso a paso para ver exactamente dónde y por qué falló un test.
* **Negativas:**
  * Hay que reescribir los test si cambiamos la estructura de un módulo.