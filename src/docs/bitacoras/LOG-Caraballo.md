#### 4/10/2026 - 12/10/2026
#### Marcos Caraballo | Rol: Desarrollador Frontend

- **Actividades:**
  - Desarrollo de la vista principal de canchas (`CanchasView.vue`) integrando filtros dinámicos por disciplina deportiva (Pádel y Fútbol 5) y fecha de juego (`BaseInput` tipo date con valor mínimo fijado en el día de hoy).
  - Creación del componente `GrillaTurnos.vue` estructurando la matriz horaria (08:00 a 22:00 hs en filas y canchas en columnas), representando los estados libre, ocupado y mantenimiento, y resaltando la franja de horario pico (19:00 a 21:00 hs) con valores numéricos tabulares.
  - Implementación de la capa de servicio `canchas.service.ts` con cliente Axios tipado para consultar el catálogo de canchas por sede y el endpoint `GET /canchas/:id/disponibilidad`.
  - Integración de suscripción en tiempo real con Supabase Realtime a la tabla `cancha_reserva` para refrescar los casilleros tomados al instante y mitigar colisiones por concurrencia.
  - Implementación de barra resumen inferior para el turno seleccionado y modal de confirmación con `BaseModal` para preparar la continuidad hacia la Tarea 2.
  - Corrección de tipados utilizando `RealtimePostgresChangesPayload` para cumplir con la configuración de linter.
- **Decisiones:**
  - Utilizar temporalmente slots de horarios fijos calculados según una hora hardcodeada, al no estar decidido todavía la implementación final de horarios.
  - Segmentar las columnas de la grilla por disciplina seleccionada en lugar de mostrar todas las canchas juntas, evitando saturación de información y mejorando la legibilidad.
  - Consumir la sede activa desde el store global de Pinia (`useSedeStore`) para que cualquier cambio de sede en el encabezado actualice de forma reactiva el catálogo y la grilla.
- **Dificultades:**
  - Curva de aprendizaje inicial con Vue 3, lo que demandó considerable tiempo inicial de investigación y estudio del framework.
  - Discrepancias con los modelos iniciales de arquitectura,tanto diagramas como los adr y falta de endpoints en el backend para obtener información relevante, así que se tuvo que implementar temporalmente con información hardcodeada u omitirse temporalmente.
- **Commits:**
  - `41a6c8c` `feat(M4): implementar grilla de disponibilidad de canchas y sincronizacion realtime`
  - `225e112` `docs(log): registrar avance de e5 tarea 1 en bitacora`

----

#### 13/10/2026
#### Marcos Caraballo | Rol: Desarrollador Backend y Frontend

- **Actividades:**
  - Construcción del módulo `M4-canchas`.
  - Desarrollo de la matriz horaria estructurada con eje horizontal de canchas activas y eje vertical de horas, obtenidos consumiendo la api correctamente.
  - Integración de filtros reactivos por disciplina deportiva y sede activa consumiendo `useSedeStore`.
  - Desarrollo del componente modal de confirmación con resumen previo del turno (sede, cancha, deporte, fecha y horario), consulta asíncrona de cotización desglosada y botón transaccional con estado de carga.
  - Corrección del cálculo de costos estimativos por slot en la grilla: vinculación directa con el `costo_base` real de cada cancha y aplicación del recargo del 20% en franja pico (19 a 21 hs), eliminando importes planos.
  - Validación y control de fechas:
    - Bloqueo de fechas pasadas.
    - Deshabilitación de turnos del día actual cuya hora ya transcurrió, mostrándolos con estado inactivo "Pasado / No disp.".
  - Rediseño de casilleros de slots horarios para diferenciarlos más fácilmente y que sea visualmente más agradable.
  - Preparación para futuras integraciones con Supabase Realtime sobre la tabla `cancha_reserva` para refresco automático ante reservas concurrentes de otros usuarios.
- **Decisiones:**
  -
- **Dificultades:**
  - Adaptación del frontend ante la falta de endpoints específicos o contratos incompletos en el backend preexistente, requiriendo normalizar respuestas y pausar el flujo visual hasta implementar y sincronizar los endpoints en el backend.
  - Sincronización de zonas horarias, la hora local argentina y las marcas de tiempo ISO que esperaba el backend, para evitar que turnos de la tarde o noche se desfasaran o se computaran en días posteriores.
  - Sobrecarga y división del tiempo de desarrollo al tener que asumir tanto el diseño y programación de la arquitectura del backend como la implementación y refinamiento de la interfaz de usuario en el frontend de manera simultánea en una ventana de tiempo acotada.
- **Commits:**
  - `13bd608` `feat(M4): implementar confirmacion de reserva de canchas con slots de horarios reales`
  - `50872e8` `docs(log): actualizar bitacora con tareas de calendario, horario y reservas`

----

#### 20/10/2026
#### Marcos Caraballo | Rol: Desarrollador Frontend
- **Actividades**:
  - Reestructuración del módulo de visualización y reserva de canchas (CanchasView, DetalleReservaView, canchasService).
  - Implementación de arquitectura resiliente de disponibilidad con fallback automático: el frontend intenta consultar la grilla agrupada de la sede (GET /canchas/disponibilidad) y, ante respuestas no implementadas o versiones previas del backend, conmuta automáticamente a consultas unitarias concurrentes (GET /canchas/:id/disponibilidad).
  - Normalización del flujo de selección de turnos, confirmación de reserva y redirección a la pantalla de detalle/pago (/reservas/:id/detalle).
- **Decisiones**:
  - Optar por hacer una petición a la API de disponibilidad para una sede, en una fecha, para evitar hacer demasiadas peticiones al backend.
- **Dificultades**:
  - Múltiples intentos fallidos e implementaciones descartadas debido a la falta de endpoints en el backend, generando errores y obligando a replantear el servicio varias veces.
  - Consultar la disponibilidad cancha por cancha generaba demoras notables y condiciones de carrera si el usuario cambiaba rápidamente de fecha o sede antes de que terminaran de resolver las promesas.
  - Gestión de estado y reactividad en Vue 3 con Pinia para garantizar que el rol de socio, la fecha seleccionada y los precios calculados se trasladen de forma transparente y sin desfases horarios hacia el modal y la vista final de pago.
  - Gran inversión de tiempo y pruebas para lograr que la grilla fuera fluida, no realizara peticiones redundantes y muestre precios y disponibilidad de las canchas de forma correcta.
- **Commits:**
- `df5bb64` `feat(M4): reserva de canchas funcionando y arreglos varios en modulo de canchas, adaptado a cambios backend`
- `0e5f748` `chore: comando format`
- `bf82fb3` `docs(log): actualizacion de bitacora`

----

#### 22/10/2026
#### Marcos Caraballo | Rol: Desarrollador Frontend
- **Actividades**:
  - Implementación y ajuste del CRUD administrativo de canchas (alta, edición, baja lógica y listado).
  - Actualización de `canchasService` y tipos (`Cancha`, `CrearCanchaDto`, `ActualizarCanchaDto`), soporte para creación de una cancha que todavía no esté disponible para reservas y filtro de disponibilidad
  - Integración de control de disponibilidad inmediata y selector en los formularios de creación y edición de canchas.
- **Decisiones**: Ninguna
- **Dificultades**: Ninguna
- **Commits:**
- `6352c9a` `refactor(M4): cambios en cancha tipos y nombres de atributos`
- `be37f3e` `feat(M4): crud canchas del gerente funcionando`
- `271611f` `feat(M4): baja logica y disponibilidad de canchas`
- `aded083` `docs(log): actualizacion de bitacora`

----

#### 23/10/2026
#### Marcos Caraballo | Rol: Desarrollador Frontend
- **Actividades**:
  - Implementación y puesta en funcionamiento del CRUD administrativo para tipos de canchas (`cancha-tipo`).
  - Corrección de desfases y manejo de zona horaria local en los componentes y servicios del módulo de canchas.
  - Optimización de llamadas a la API reduciendo peticiones HTTP duplicadas al cambiar sedes y filtros.
  - Desactivación y limpieza temporal de la sincronización con Supabase Realtime para priorizar la estabilidad de las consultas.
- **Decisiones**:
  - Pausar temporalmente las suscripciones de Supabase Realtime en el módulo hasta estabilizar el flujo de consultas directas a la API y prevenir sobrecarga de sockets o inconsistencias.
  - Centralizar y condicionar las consultas reactivas para evitar disparos simultáneos y redundantes al modificar filtros.
- **Dificultades**:
  - Tuve problemas con el navegador, no funcionaban correctamente las herramientas de desarrollador, tuve que descargar otro para poder probar el código.
  - Ajustes en el parseo y la forma de obtener de horarios locales frente a fechas en formato UTC.
- **Commits:**
- `04bd383` `feat(M4): CRUD de cancha tipos funcionando y arreglos de hora local`
- `9b1ec6e` `refactor(M4): optimizacion de consultas a la API`
- `9324ab7` `fix(M4): eliminacion temporal de supabase realtime`
- `bc9d32b` `chore(M4): formato con prettier fix por lint`
- `4c7fc9c` `docs(log): actualizacion de bitacora`

----

#### 24/10/2026
#### Marcos Caraballo | Rol: Desarrollador Frontend
- **Actividades**:
  - Implementación completa de la vista y componentes para el CRUD de mantenimientos y bloqueos de canchas (`GestionMantenimientos.vue` y `MantenimientoModal.vue`).
  - Integración en `GerenciaCanchasView.vue` de navegación por pestañas para alternar entre el catálogo de canchas y la gestión de mantenimientos.
  - Mejora de UX en `MantenimientoModal.vue`: inclusión de selector previo de sede que filtra dinámicamente las canchas disponibles de dicha sede.
  - Corrección en `canchas.service.ts` y `GestionMantenimientos.vue` para propagar y notificar adecuadamente con `toast.error` los errores HTTP del backend (ej. validación cuando fechaInicio es posterior a fechaFin).
  - Incorporación de la ruta de acceso a Gestión de Canchas (`/gerencia/canchas`) en el menú de navegación lateral (`Sidebar.vue`) protegida para el rol gerente.
- **Decisiones**:
  - Centralizar en una única vista gerencial (`GerenciaCanchasView`) la administración de canchas y bloqueos de mantenimiento mediante un sistema de pestañas.
  - Implementar selección de sede opcional dentro del modal de mantenimiento para agilizar la búsqueda de canchas en clubes multi-sede, mejorando la experiencia de usuario.
- **Dificultades**:
  - El método de consulta de mantenimientos silenciaba excepciones capturándolas y devolviendo un array vacío, impidiendo la activación del bloque `catch` y la visualización de los toasts de error.
  - Sincronización del estado del formulario en el modal para limpiar la cancha seleccionada si el usuario cambia a una sede incompatible.
- **Commits:**
- `5877047` `feat(M4): CRUD de mantenimiento dentro de canchas`
- `7839eb1` `chore: agregar gestion de canchas a sidebar`
- `e1ad49f` `chore: formato con prettier`
- `ba62cec` `docs(log): actualizacion de bitacora`

----

#### 03/11/2026
#### Marcos Caraballo | Rol: TL - Desarrollador Frontend
- **Actividades**:
  - Centralización del horario operativo de sedes en `useSedeStore` mediante `obtenerHorarioOperativo` y caché reactiva en memoria (`horariosCache`), evitando estados locales duplicados en vistas.
  - Optimización de carga inicial y eliminación de peticiones redundantes en `CanchasView.vue` controlando la ejecución de los `watch()` mediante un flag de inicialización (`inicializado`).
  - Implementación de deduplicación de promesas en vuelo en `sede.ts` para llamadas concurrentes a `cargarSedes()` y `obtenerHorarioOperativo()`.
  - Refactorización de `canchas.service.ts` para delegar consultas de horarios operativos a `sedeStore` y sincronizar respuestas por lote (`getDisponibilidadPorSede`) directamente en la caché del store.
  - Adaptación tipográfica estricta en `canchas.types.ts` extendiendo `HorarioOperativo` de la tienda sin recurrir a `any`.
- **Decisiones**:
  - Manejar el horario operativo como propiedad computada en `CanchasView.vue` vinculada a `sedeStore.horariosCache`, garantizando una única fuente de verdad reactiva y evitando peticiones de red al revisitar fechas o sedes.
  - Controlar las suscripciones reactivas en `CanchasView.vue` para que los observadores de filtros y sede no disparen llamadas en cascada durante el montaje inicial (`onMounted`).
  - Utilizar un mapa de promesas activas en `useSedeStore` para deduplicar peticiones simultáneas idénticas antes de su resolución.
- **Dificultades**:
  - Disparo de múltiples solicitudes HTTP duplicadas al recargar la página en `/canchas` debido a la ejecución simultánea de `onMounted` (en `MainLayout` y `CanchasView`) y la activación anticipada de watchers al resolverse la sede por defecto.
  - Las peticiones concurrentes a `obtenerHorarioOperativo` antes de que se completara el primer GET causaban fallos en la verificación de caché (`horariosCache.value[key] === undefined`), solucionado mediante caché de promesas en vuelo.
- **Commits:**
- `7c52735` `feat(M4): fix de reserva y optimizacion de requests`
- `568b3a7` `feat(pinia): evitar requests redundantes en store`
- `aefb23e` `docs(log): actualizacion de bitacora`

----

#### 04/11/2026
#### Marcos Caraballo | Rol: TL - Desarrollador Frontend
- **Actividades**:
  - Conexión del cálculo y desglose de tarifas de reservas con el endpoint `GET /canchas/cotizar` del backend en `reservas.service.ts`.
  - Extensión de la interfaz de respuesta `CotizacionTurnoResponse` en `canchas.types.ts` para soportar las validaciones de descuento (`aplica_descuento_socio` y `motivo_sin_descuento`).
  - Actualización de `ConfirmarReserva.vue` integrando un loader de tipo Skeleton mientras se espera la cotización oficial del servidor.
  - Implementación de feedback visual en el modal de reserva notificando al socio cuando no aplica el descuento (por membresía inactiva o por pertenecer la sede a una ciudad distinta a la de su afiliación).
  - Ajuste en `ConfirmarReserva.vue` para persistir correctamente descuentos en 0% mediante coalescencia nula (`?? 0`), evitando sobrescrituras involuntarias al guardar en caché local.
  - Ajuste del indicador de socio en `CanchasView.vue` para reflejar la cotización dinámica sin fijar un porcentaje previo de descuento.
- **Decisiones**:
  - Delegar la lógica de negocio completa del descuento (rol, membresía activa y validación de misma ciudad entre sede de usuario y sede de cancha) en el backend a través de `GET /canchas/cotizar`, manteniendo al cliente libre de cálculos redundantes o peticiones adicionales.
  - Implementar un estado Skeleton en `ConfirmarReserva.vue` para mejorar la experiencia de usuario y evitar saltos visuales durante la verificación de cotización.
  - Proporcionar mensajes informativos claros y contextuales en el modal de confirmación en lugar de ocultar silenciosamente el descuento de socio.
- **Dificultades**:
  - Manejo de casos de borde en los que el usuario posee rol de socio pero su sede de afiliación es de otra ciudad o su membresía está inactiva, requiriendo adaptar los estados y textos explicativos sin alterar el flujo habitual de reserva.
- **Commits:**
- `6a1c4c7` `feat(M4): interfaz y tipo para endpoint cotizar`
- `17f51f2` `docs(log): actualizacion de bitacora`

----

#### 06/11/2026
#### Marcos Caraballo | Rol: TL - Desarrollador Frontend
- **Actividades**:
  - Eliminación definitiva de cálculos estáticos y funciones de mock de feriados (`calcularHorarioOperativo` y `generarSlotsParaCancha`) en `canchas.service.ts`.
  - Integración de `getDisponibilidadPorSede` con la respuesta unificada del backend, sincronizando el horario operativo en la caché de `useSedeStore` sin peticiones redundantes.
  - Incorporación de indicadores visuales en `CanchasView.vue` y `GrillaTurnos.vue` para reflejar el estado de horario especial (`es_horario_especial`) y el motivo de cierre oficial (`motivo_cierre`).
  - Creación de tests unitarios en `canchas-disponibilidad-horario.spec.ts` validando el renderizado de estados cerrados/especiales y la ausencia de slots inventados ante fallos.
- **Decisiones**:
  - Establecer el backend (`CalendarioSede`, `Calendario`, `SedeHorario`) como la única fuente de verdad para determinar feriados y horarios de sedes.
  - Centralizar y reutilizar la caché de horarios en Pinia aprovechando el payload unificado de disponibilidad para optimizar el consumo de red.
- **Dificultades**: Ninguna
- **Commits:**
- `8104ed4` `feat(M4): Eliminacion de fallbacks viejos de prueba`
- `9045ec8` `feat(M4): obtencion correcta del horario en cache`
- `736b5e0` `feat(M4): test de disponibilidad horario`
- `37f9bf2` `docs(log): actualizacion de bitacora`
- `3b25375` `style: uso de prettier para el formato`

----

#### 06/11/2026
#### Marcos Caraballo | Rol: TL - Desarrollador Frontend
- **Actividades**:
  - Suscripción en tiempo real vía Supabase Broadcast (`canchas:sede:${idSede}`) para escuchar eventos `turno_reservado`.
  - Creación del composable `useCanchasRealtime` con gestión reactiva ante cambio de sedes y desuscripción automática al desmontar.
  - Procesamiento reactivo en `CanchasView`: actualización de slots en la grilla, deselección y cierre forzado del modal ante reservas concurrentes con Toasts de advertencia.
  - Manejo de colisión HTTP 409 en `ConfirmarReserva` para forzar cierre, marcar slot reservado y notificar conflicto.
  - Suite de tests unitarios en `canchas-realtime-concurrencia.spec.ts`.
- **Decisiones**:
  - Encapsular el ciclo de vida de los canales realtime en un composable desacoplado de la vista.
- **Dificultades**: Ninguna
- **Commits:**
- `c4e739f` `feat(M4): nuevo tipo para el canal realtime`
- `872aac0` `feat(M4): implementar supabase realtime en canchas`
- `167af7a` `feat(M4): test de canchas realtime para concurrencia`
- `1250726` `docs(log): actualizar bitacora`

----

#### 07/11/2026
#### Marcos Caraballo | Rol: TL - Desarrollador Full Stack
- **Actividades**:
  - Ajuste en `DetalleReservaView.vue` para tomar el costo base y calcular el recargo por horario pico directamente desde el objeto `cancha` de la reserva.
  - Simplificación y limpieza de etiquetas y textos visuales en el desglose de tarifas.
- **Decisiones**:
  - Utilizar temporalmente los datos directos de `reserva.cancha` para mostrar tarifas más precisas en la interfaz a la espera de la actualización definitiva del backend.
- **Dificultades**: Ninguna
- **Commits:**
- `215abab` `fix(M4): simplificar desglose de tarifas en detalle de reserva`
- `24c8c04` `fix(M4): obtener precio correcto en detalle reserva view`
- `721c717` `docs(log): actualizacion de bitacora`

----

#### 07/11/2026
#### Marcos Caraballo | Rol: TL - Desarrollador Full Stack
- **Actividades**:
  - Implementación de utilería genérica `validarConEsquema` y definición de esquemas Zod (`cancha.schema.ts`, `cancha-tipo.schema.ts`, `mantenimiento.schema.ts`) con sanitización alfanumérica contra caracteres especiales, límites decimales y validación cruzada de fechas.
  - Integración de esquemas en `CanchaModal.vue`, `GestionTiposModal.vue`, `MantenimientoModal.vue` y `GerenciaCanchasView.vue`, bloqueando peticiones HTTP inválidas y mostrando feedback visual junto a toasts de advertencia (`toast.warning`).
  - Creación de tests unitarios en `canchas-schemas-validation.spec.ts` verificando el bloqueo de strings inseguros, límites de longitud y reglas de negocio.
- **Decisiones**:
  - Proveer retroalimentación clara mediante avisos en amarillo (`toast.warning`) y marcado de inputs con error.
- **Dificultades**: Ninguna
- **Commits:**
- `83dc0ad` `fix(M4): corregir calculo en detalle de reserva`
- `9a347c0` `feat(M4): utils de validacion y schemas Zod en M4`
- `a7fab85` `feat(M4): integrar validacion zod y alertas`
- `79951f9` `feat(M4): tests unitarios para esquemas Zod`
- `823092b` `docs(log): actualizacion de bitacora`

----

#### 08/11/2026
#### Marcos Caraballo | Rol: TL - Desarrollador Frontend
- **Actividades**:
  - Implementación de pruebas unitarias y de componentes para el módulo de canchas (`GrillaTurnos.spec.ts` y `CanchasView.spec.ts`) utilizando Vitest, `@vue/test-utils` y Pinia.
  - Verificación de interacción con slots disponibles, bloqueo en estados reservados/mantenimiento, horarios pasados (`vi.useFakeTimers()`), sede cerrada, manejo de colisión HTTP 409 Conflict y actualización en tiempo real vía Realtime.
- **Decisiones**:
  - Priorizar tests deterministas de comportamiento de usuario y manejo de colisiones concurrentes sobre la grilla sin depender del entorno real de red.
- **Dificultades**: Ninguna
- **Commits:**
  - `4abe2a8` `feat(M4): tests de disponibilidad y reservas`

----

#### 10/11/2026
#### Marcos Caraballo | Rol: TL - Desarrollador Full Stack
- **Actividades**:
  - Limpieza de código muerto legacy y eliminación del fallback de `localStorage` en lectura de reservas para no enmascarar errores de red.
  - Creación de `canchas-horarios.utils.ts` para cálculos temporales (`calcularEsSlotPasado`, `generarFranjasHorarias`) y formato monetario, reemplazando duplicaciones en `GrillaTurnos.vue` y `ConfirmarReserva.vue`.
  - Implementación del patrón Adapter (`canchas.adapter.ts`) para normalizar slots crudos del backend (`camelCase`/`snake_case`) a `TurnoSlot`.
  - Modularización de `canchas.service.ts` separando en `mantenimientos.service.ts` y `canchas-tipos.service.ts` bajo una fachada retrocompatible.
- **Decisiones**:
  - Mantener retrocompatibilidad mediante el patrón Facade en `canchasService` para no alterar imports en componentes existentes.
- **Dificultades**: Ninguna
- **Commits:**
  - `f346f91` `refactor(canchas): remover fallback`
  - `32a7115` `refactor(canchas): utils de horarios y formato`
  - `14e0a1d` `refactor(canchas): patron adapter para normalizar slots del backend`
  - `4a7f95d` `refactor(canchas): patron fachada para dividir canchas service`
  - `2a55b27` `style: formato con prettier`
  - `f7e2999` `docs(log): actualizacion de bitacora`

----

#### 11/11/2026
#### Marcos Caraballo | Rol: TL - Desarrollador Frontend
- **Actividades**:
  - Ajuste de tipado en `MembresiaView.vue` y `ResultadoPagoView.vue` validando la existencia del usuario actual antes de invocar `authStore.setPerfilInterno` tras la incorporación del soporte offline en `Usuario`.
- **Decisiones**:
  - Aplicar verificación previa sobre `authStore.usuario` para garantizar compatibilidad estricta de TypeScript (`id: number` obligatorio) sin alterar la lógica del store.
- **Dificultades**: Ninguna
- **Commits:**
  - `cc814e3` `fix(auth): asegurar tipado de usuario en setPerfilInterno para membresias y pagos`

----

#### 17/11/2026
#### Marcos Caraballo | Rol: TL - Desarrollador Full Stack
- **Actividades**:
  - Actualización y carga de diagramas fuente en Mermaid (`.mmd`) y sus versiones exportadas en `.svg` dentro de `src/docs/diagramas/` (`c4-1-contexto`, `c4-2-contenedores`, `c4-3-componentes-acceso`, `c4-3-componentes-canchas`, `der-fisico`, `uml-clases-dominio`), alineando roles, servicios externos, flujo offline M2 y canales WebSocket en tiempo real.
  - Limpieza, ordenamiento cronológico e incorporación de hashes cortos en la bitácora personal (`LOG-Caraballo.md`), sumando commits omitidos y eliminando entradas duplicadas o de otros integrantes.
- **Decisiones**:
  - Mantener versionados tanto los fuentes editables `.mmd` como los `.svg` renderizados para asegurar legibilidad inmediata y trazabilidad en la entrega final.
- **Dificultades**: Ninguna
- **Commits:**
  - `432e495` `docs(diagramas): carga de archivos fuente editables de diagramas`
  - `aae02e3` `docs(diagramas): carga de svg legible de diagramas`
  - `de79287` `docs(log): inclusion de hash cortos y limpieza de bitacora`

----
