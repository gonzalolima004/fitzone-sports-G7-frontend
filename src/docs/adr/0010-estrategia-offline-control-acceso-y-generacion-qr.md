# ADR-010: Estrategia offline del control de acceso y generación de QR

- **Estado:** Aceptado
- **Fecha:** 2026-11-10
- **Autor:** Angelina María Vialle
- **Sprint:** 8

## Contexto
Ante una posible caída de la conexión con el servidor central, los terminales de las sedes de *FitZone Sports* deben ser capaces de validar el ingreso de los socios de forma autónoma (RNF-01). Asimismo, es necesario controlar la generación del código QR en el portal del socio para evitar que se intente un acceso offline en una sede que no corresponda geográficamente a su ciudad de validez.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **Bloqueo total de accesos ante caída de red** | Simplicidad técnica al no requerir lógica descentralizada en el terminal de sede. | Incumple de manera directa el requisito no funcional de operación degradada (RNF-01), paralizando el gimnasio. | Inaceptable para la continuidad operativa de la cadena de gimnasios. |
| **Validación centralizada mediante caché volátil sin persistencia** | Menor uso de almacenamiento local en el dispositivo de acceso. | Altamente vulnerable ante reinicios del terminal o cortes prolongados de energía y red. | Carece de la robustez necesaria para garantizar la seguridad de acceso local. |
| **Replicación de métodos y validaciones en ambos extremos (Frontend y Backend)** | Permite validar de forma autónoma la pertenencia de la sede y generar/verificar el QR offline de manera segura. | Requiere duplicar ciertas reglas de negocio y sincronizar esquemas de validación entre cliente y servidor. | **Seleccionada** porque garantiza que el socio no pueda generar accesos no autorizados fuera de su ciudad y asegura la operación local autónoma. |

## Decisión
Se implementará una estrategia de replicación de métodos de validación en ambos extremos (frontend y backend). Para evitar que un socio ingrese offline en una sede de otra ciudad, el sistema valida localmente que la sede pertenezca a la misma demarcación geográfica antes de permitir la generación o validación del QR. Una vez restablecida la conexión, los registros de acceso se envían y consolidan en la base de datos central.

## Consecuencias
- **Positivas:** Garantiza la continuidad operativa ante cortes de red (RNF-01) y evita accesos fraudulentos cruzados entre distintas ciudades.
- **Negativas:** Incrementa la complejidad de desarrollo al tener que mantener la consistencia de las reglas de validación tanto en el cliente como en el servidor.
- **Deuda asumida:** Asegurar pruebas exhaustivas de los casos límites de sincronización de relojes y zonas geográficas en los terminales.

## Requisitos relacionados
RNF-01, RN-01