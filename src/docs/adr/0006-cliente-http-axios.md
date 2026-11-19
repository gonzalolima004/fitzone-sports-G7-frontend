# ADR-006: Selección de Axios como cliente HTTP para el Frontend

- **Estado:** Aceptado
- **Fecha:** 2026-08-31
- **Autor:** Gonzalo Lima
- **Sprint:** 1

## Contexto
Necesitamos conectar nuestro frontend con la API del backend. Podríamos usar la herramienta nativa `fetch`, pero a medida que el proyecto crezca, vamos a necesitar interceptar las peticiones para adjuntar automáticamente el token JWT de los usuarios logueados o manejar errores globales. Hacer esto con `fetch` requiere escribir bastante código repetitivo.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **API Nativa del navegador (`fetch`)** | Viene integrada de fábrica, no añade peso al bundle final de la aplicación. | Requiere escribir código repetitivo para transformar respuestas a JSON e implementar interceptores. | Demasiado rudimentaria para las necesidades de seguridad y control centralizado del sistema. |
| **Bibliotecas ligeras alternativas (ej. `ky` u otras basadas en `fetch`)** | API moderna basada en promesas con soporte nativo para `fetch`. | Menor comunidad y ecosistema en comparación con los estándares corporativos tradicionales. | Se prefiere una herramienta con soporte robusto y maduro para interceptores complejos. |
| **Axios** | Interceptores potentes, transformación automática a JSON y manejo integrado de errores. | Es una dependencia externa que incrementa ligeramente el peso total del paquete. | **Seleccionada** por su facilidad para configurar la seguridad y la limpieza de los servicios de cada módulo. |

## Decisión
Vamos a instalar y usar Axios para manejar todas las peticiones HTTP. 
Configuraremos una instancia global de Axios en la carpeta `common/api` donde aplicaremos los interceptores necesarios para la autenticación y el manejo de errores.

## Consecuencias
- **Positivas:** Configurar interceptores para los tokens es muy directo. Transforma automáticamente las respuestas a JSON. El código queda más limpio en los servicios de cada módulo.
- **Negativa:** Es una librería externa que suma un poco de peso al paquete final de la aplicación en comparación con usar la solución nativa del navegador.
- **Deuda asumida:** Mantener actualizada la librería ante posibles vulnerabilidades de dependencias.  
