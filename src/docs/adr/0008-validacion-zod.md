# 8. Uso de Zod para la validación de datos

Fecha: 2026-08-31
Estado: Aceptado

## Contexto
Vamos a tener muchos formularios y necesitamos una forma estándar de validar los datos antes de enviarlos al backend, si lo hacemos cada a mano, el código se volverá largo y difícil de leer, sumado a que se integra perfectamente con nuestro tipado estricto.

## Decisión
Vamos a usar Zod para definir los esquemas de validación. Declararemos cómo debe ser exactamente la estructura de un dato (por ejemplo, que el email sea válido o que el horario de cierre sea mayor al horario de apertura) y Zod se encargará de comprobarlo automáticamente.

## Consecuencias
* **Positivas:**
  * Nos asegura que la información del formulario coincide exactamente con los tipos de TypeScript que manejamos.
  * La sintaxis es muy intuitiva y nos ahorra escribir cientos de líneas de condicionales.
* **Negativa:**
  * El equipo deberá familiarizarse con los métodos específicos de la librería para encadenar las reglas de validación.
