# 6. Uso de Axios como cliente HTTP

Fecha: 2026-08-31
Estado: Aceptado

## Contexto
Necesitamos conectar nuestro frontend con la API del backend. Podríamos usar la herramienta nativa `fetch`, pero a medida que el proyecto crezca, vamos a necesitar interceptar las peticiones para adjuntar automáticamente el token JWT de los usuarios logueados o manejar errores globales. Hacer esto con `fetch` requiere escribir bastante código repetitivo.

## Decisión
Vamos a instalar y usar Axios para manejar todas las peticiones HTTP. 
Configuraremos una instancia global de Axios en la carpeta `common/api` donde aplicaremos los interceptores necesarios para la autenticación y el manejo de errores.

## Consecuencias
* **Positivas:**
  * Configurar interceptores para los tokens es muy directo.
  * Transforma automáticamente las respuestas a JSON.
  * El código queda más limpio en los servicios de cada módulo.
* **Negativa:**
  * Es una librería externa que suma un poco de peso al paquete final de la aplicación en comparación con usar la solución nativa del navegador.
