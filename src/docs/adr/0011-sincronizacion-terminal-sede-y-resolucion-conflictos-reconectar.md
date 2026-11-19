# ADR-011: Sincronización del terminal de sede y resolución de conflictos al reconectar

- **Estado:** Aceptado
- **Fecha:** 2026-11-10
- **Autor:** Angelina María Vialle
- **Sprint:** 8

## Contexto
Durante los periodos de operación offline por caída de la red principal, los terminales de acceso acumulan registros locales de ingresos y egresos de socios en el almacenamiento del navegador (localStorage). Una vez que se restablece la conectividad, es obligatorio sincronizar esta información con el servidor central asegurando que no se violen reglas críticas del negocio, como la restricción de que un socio no puede encontrarse activo en dos sedes de manera simultánea (RN-01).

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **Sobrescritura ciega de registros locales al reconectar** | Implementación extremadamente rápida y sin lógica de control de conflictos. | Puede corromper el estado global del servidor central y vulnerar reglas de negocio estrictas (como la doble presencia RN-01). | Inviable debido al riesgo crítico de integridad de datos transaccionales. |
| **Sincronización manual supervisada por un operador** | Control humano absoluto de cada registro acumulado offline. | Lento, ineficiente, propenso a errores operativos y genera cuellos de botella en la administración de las sedes. | Incompatible con la agilidad que requiere un sistema automatizado de control de accesos. |
| **Sincronización diferida mediante cola secuencial (FIFO) con marcas de tiempo** | Reutiliza el endpoint unitario existente (/accesos/sincronizar-offline), ofrece tolerancia granular a desconexiones intermitentes (los procesados se eliminan y solo se reintentan los pendientes) y automatiza el volcado sin intervención humana. | Requiere 𝑁 peticiones HTTP si la cola es extensa y una bandera de bloqueo para prevenir condiciones de carrera. | **Seleccionada** por su viabilidad inmediata con el backend actual y su robustez ante conexiones inestables. |

## Decisión
Se implementará un mecanismo de sincronización diferida basada en cola local de reintentos (FIFO). Durante el aislamiento de red, el terminal persiste los ingresos y egresos en localStorage (fitzone_offline_queue) con su tipo, identificadores y marca de tiempo ISO original (timestamp).

Al detectar la reconexión mediante el evento online del navegador, el frontend activa una rutina con control de concurrencia (sincronizandoCola) que procesa la cola de forma iterativa y secuencial, enviando cada evento al endpoint /accesos/sincronizar-offline. El servidor valida cada registro individualmente en base a su marca de tiempo para reconciliar el estado y asegurar el cumplimiento de la regla de no simultaneidad (RN-01). Los eventos confirmados con éxito son purgados de la memoria local, mientras que aquellos interrumpidos por una nueva caída de red permanecen retenidos para el siguiente reintento.

## Consecuencias
- **Positivas:** Recuperación automática y transparente del sistema al volver la conexión, sin requerir intervención del recepcionista. Tolerancia a fallos parciales: si la red se corta a mitad de la sincronización, los eventos ya enviados no se duplican y solo se reintentan los pendientes. Reutilización directa del endpoint unitario existente en el backend sin requerir cambios de infraestructura.
- **Negativas:** Mayor sobrecarga de peticiones HTTP en la red en comparación con un payload empaquetado único si la cola acumulada es muy grande. Si el servidor rechaza un registro por conflicto de regla de negocio (ej. código HTTP de conflicto), el mecanismo actual de reintentos puede mantenerlo retenido a menos que se capture explícitamente el rechazo definitivo.
- **Deuda asumida:** Evolucionar en futuros sprints hacia un endpoint de ingesta masiva por lote (POST /accesos/sincronizar-offline/batch) si el volumen de accesos acumulados por corte satura la red. Implementar en el frontend el descarte y registro en log de auditoría de los accesos rechazados definitivamente por reglas de negocio (RN-01), evitando reintentos infinitos.

## Requisitos relacionados
RNF-01, RN-01