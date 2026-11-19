# ADR-008: Uso de Zod para validación de esquemas y tipos

- **Estado:** Aceptado
- **Fecha:** 2026-08-31
- **Autor:** Gonzalo Lima
- **Sprint:** 1

## Contexto
Vamos a tener muchos formularios y necesitamos una forma estándar de validar los datos antes de enviarlos al backend, si lo hacemos cada a mano, el código se volverá largo y difícil de leer, sumado a que se integra perfectamente con nuestro tipado estricto.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **Validación manual mediante condicionales imperativos** | Control absoluto sin agregar dependencias externas al proyecto. | Código altamente propenso a errores, difícil de mantener y redundante a lo largo de los formularios. | Ineficiente y contrario a las buenas prácticas de tipado estricto del equipo. |
| **Yup** | Librería madura y muy conocida en el ecosistema de JavaScript para esquemas. | Su inferencia de tipos con TypeScript es menos natural y robusta en comparación con alternativas modernas. | Se prefiere una integración nativa y de primera clase con el tipado estricto de TypeScript. |
| **Zod** | Declarativo, inferencia automática de tipos de TypeScript y sintaxis intuitiva. | Requiere que el equipo aprenda los métodos de encadenamiento específicos de la librería. | **Seleccionada** por su robustez, seguridad de tipos y diseño orientado a TypeScript. |

## Decisión
Vamos a usar Zod para definir los esquemas de validación. Declararemos cómo debe ser exactamente la estructura de un dato (por ejemplo, que el email sea válido o que el horario de cierre sea mayor al horario de apertura) y Zod se encargará de comprobarlo automáticamente.

## Consecuencias
- **Positivas:**
  * Nos asegura que la información del formulario coincide exactamente con los tipos de TypeScript que manejamos.
  * La sintaxis es muy intuitiva y nos ahorra escribir cientos de líneas de condicionales.
- **Negativa:**
  * El equipo deberá familiarizarse con los métodos específicos de la librería para encadenar las reglas de validación.
- **Deuda asumida:** Sincronizar los esquemas de validación con los DTOs del backend cuando existan cambios en las estructuras de datos.
