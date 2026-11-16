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
  - `feat(M4): implementar grilla de disponibilidad de canchas y sincronizacion realtime`
  - `docs(log): registrar avance de e5 tarea 1 en bitacora`

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
  - `feat(M4): implementar confirmacion de reserva de canchas con slots de horarios reales`
  - `docs(log): actualizar bitacora con tareas de calendario, horario y reservas`

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
- `feat(M4): reserva de canchas funcionando y arreglos varios en modulo de canchas, adaptado a cambios backend`
- `chore: comando format`
- `docs(log): actualizacion de bitacora`

----

#### 03/11/2026
#### Marcos Caraballo | Rol: Desarrollador Frontend
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
- `feat(M4): fix de reserva y optimizacion de requests`
- `feat(pinia): evitar requests redundantes en store`

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
- `refactor(M4): cambios en cancha tipos y nombres de atributos`
- `feat(M4): crud canchas del gerente funcionando`
- `feat(M4): baja logica y disponibilidad de canchas`
- `docs(log): actualizacion de bitacora`
#### 21/10/2026
#### Joaquín Ribarola | Rol: Desarrollador Frontend

- **Actividades:**
  - Creación del módulo utilitario `date-formatter.ts` en `src/common/utils` estandarizando el formateo a `dd/mm/aaaa`, nombres de días y meses en español, y helpers para generación de días de agenda y comparación cronológica de horarios.
  - Integración en `clases.service.ts` de la interfaz y método para consultar el horario operativo de la sede (`GET /sedes/:id/horario-operativo?fecha=YYYY-MM-DD`).
  - Incorporación en `clases.service.ts` del método para baja y eliminación de clases grupales (`DELETE /clases/:id`).
  - Implementación en `ClasesView.vue` de una agenda interactiva: reemplazo de los botones estáticos por una barra de navegación con tira semanal de 7 días, controles de navegación rápida (día y semana) y botón "Hoy".
  - Limpieza de interfaz: eliminación de la alerta estática de RF-07 y remoción del botón no funcional de calendario para maximizar el área de trabajo y la visualización directa de la grilla de clases.
  - Conexión de la agenda con el horario operativo del gimnasio/sede, mostrando badge de apertura/cierre y estado visual informativo cuando la sede se encuentra cerrada.
  - Aplicación de ordenamiento cronológico por horario de inicio para las clases agendadas.
  - Integración del modelo de periodicidad de clases grupales: soporte de campos `dias_semana` (0=Dom..6=Sáb) y `fecha` puntual en interfaces de servicio, componentes y vistas.
  - Creación de helpers `formatearDiasSemana` y `coincideFechaClase` en `date-formatter.ts`, con normalización segura ante cadenas ISO para evitar desfases de zona horaria local.
  - Incorporación en `ClaseCard.vue` de badges contextuales que exhiben los días recurrentes de la clase o su fecha especial de dictado.
  - Filtrado reactivo en `ClasesView.vue` garantizando que la grilla diaria únicamente muestre las clases que aplican para el día de la semana seleccionado.
  - Implementación de control reactivo de la ventana de reserva de 48 hs (`obtenerEstadoVentanaReserva`): bloqueo y deshabilitación de la opción de reservar si la clase dista más de 48 horas ("Abre 48 hs antes") o si ya transcurrió ("Clase finalizada"), evitando errores 400 y optimizando la experiencia de usuario.
  - Implementación del flujo de gestión y administración de clases grupales (CRUD completo) para roles `admin` y `gerente`.
  - Creación de métodos de servicio `crearClase(data)` y `actualizarClase(id, data)` en `clases.service.ts` con tipados estrictos `CreateClaseRequest` y `UpdateClaseRequest`.
  - Desarrollo del componente modal `ModalClaseForm.vue` para alta y edición de clases con validaciones completas, capacidad, horarios y selector de periodicidad (días recurrentes o fecha puntual con accesos rápidos).
  - Incorporación de botón "Nueva Clase" en el encabezado de `ClasesView.vue` y acciones de edición y eliminación en `ClaseCard.vue` condicionadas al rol administrativo.
  - Implementación de diálogo modal de confirmación de baja lógica (`DELETE /clases/:id`) con feedback mediante notificaciones Toast.
  - Creación de suite integral de pruebas unitarias (`src/__tests__/date-formatter.spec.ts`, Épica 12 Tarea 2) cubriendo normalización de fechas ISO, prevención de desfase de zona horaria local, formateo en español, periodicidad (`coincideFechaClase`), ordenamiento cronológico y la regla de ventana de reserva de 48 hs.
- **Decisiones:**
  - Centralizar el formateo y parseo de fechas en `common/utils/date-formatter.ts` para evitar duplicidad de lógica y prevenir desfases de zona horaria local.
  - Tipar la respuesta de horario operativo de la sede en `clases.service.ts` para mantener el aislamiento del módulo M3 y desacoplar de `M0-sedes`.
  - Diseñar un empty state específico y amigable para "Sede Cerrada", evitando confusión en el socio cuando no hay clases por feriado o cierre dominical.
  - Alinear los índices numéricos de `dias_semana` (0..6) con el estándar de JavaScript `Date.getDay()` y el DTO del backend, formateando su visualización con orden de semana laboral (Lunes a Domingo).
  - Bloquear en la UI el botón de reserva tanto para clases fuera de la ventana de 48 hs como para clases pasadas, proporcionando feedback contextual claro y defensivo al socio.
  - Encapsular el formulario de creación/edición en `ModalClaseForm.vue` para mantener la vista principal `ClasesView.vue` concisa y enfocada en la renderización del cronograma.
  - Restringir la visibilidad de las herramientas mutadoras mediante evaluación reactiva de roles (`admin`/`gerente`) desde `useAuthStore`.
  - Emplear `vi.useFakeTimers()` y `vi.setSystemTime()` en Vitest para testear de forma determinista y reproducible la ventana de reservas de 48 hs y el bloqueo de clases pasadas sin depender de la hora del entorno de CI.
- **Dificultades:** Ninguna. Se resolvió la falta de dependencias (`html5-qrcode`) heredadas del último pull de `dev` mediante `npm install`.
- **Commits:**
  - `feat(clases): crear date-formatter e integrar servicio de horario operativo de sede`
  - `feat(clases): implementar selector de calendario interactivo y horario operativo en agenda`
  - `feat(clases): incorporar periodicidad por dias de la semana y fecha puntual en agenda`
  - `feat(clases): bloquear reservas fuera de la ventana de 48 hs y clases pasadas`
  - `feat(clases): implementar gestion CRUD de clases grupales para admin y gerente`
  - `test(clases): anadir pruebas unitarias para date-formatter, periodicidad y ventana de reserva`

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
- `feat(M4): CRUD de cancha tipos funcionando y arreglos de hora local`
- `refactor(M4): optimizacion de consultas a la API`
- `fix(M4): eliminacion temporal de supabase realtime`
- `chore(M4): formato con prettier fix por lint`
- `docs(log): actualizacion de bitacora`

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
- `feat(M4): CRUD de mantenimiento dentro de canchas`
- `chore: agregar gestion de canchas a sidebar`
- `chore: formato con prettier`
- `docs(log): actualizacion de bitacora`

----

#### 03/11/2026
#### Marcos Caraballo | Rol: TL - Desarrollador Frontend
- **Actividades**:
  - Centralización del horario operativo de sedes en `useSedeStore` mediante `obtenerHorarioOperativo` y caché reactiva en memoria (`horariosCache`), evitando estados locales duplicados en vistas.
  - Optimización de carga inicial y eliminación de peticiones redundantes en `CanchasView.vue` controlando la ejecución de los `watch()` mediante un flag de inicialización (`inicializado`).
  - Implementación de deduplicación de promesas en vuelo en `sede.ts` para llamadas concurrentes a `cargarSedes()` y `obtenerHorarioOperativo()`.
  - Refactorización de `canchas.service.ts` para delegar consultas de horarios operativos a `sedeStore` y sincronizar respuestas por lote (`getDisponibilidadPorSede`) directamente en la caché del store.
- **Decisiones**:
  - Manejar el horario operativo como propiedad computada en `CanchasView.vue` vinculada a `sedeStore.horariosCache`, garantizando una única fuente de verdad reactiva y evitando peticiones de red al revisitar fechas o sedes.
  - Controlar las suscripciones reactivas en `CanchasView.vue` para que los observadores de filtros y sede no disparen llamadas en cascada durante el montaje inicial (`onMounted`).
  - Utilizar un mapa de promesas activas en `useSedeStore` para deduplicar peticiones simultáneas idénticas antes de su resolución.
- **Dificultades**:
  - Disparo de múltiples solicitudes HTTP duplicadas al recargar la página en `/canchas` debido a la ejecución simultánea de `onMounted` (en `MainLayout` y `CanchasView`) y la activación anticipada de watchers al resolverse la sede por defecto.
- **Commits:**
- `feat(M4): fix de reserva y optimizacion de requests`
- `feat(pinia): evitar requests redundantes en store`
- `docs(log): actualizacion de bitacora`

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
- `feat(M4): interfaz y tipo para endpoint cotizar`
- `docs(log): actualizacion de bitacora`

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
- `feat(M4): nuevo tipo para el canal realtime`
- `feat(M4): implementar supabase realtime en canchas`
- `feat(M4): test de canchas realtime para concurrencia`
- `docs(log): actualizacion de bitacora`

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
- `feat(M4): Eliminacion de fallabacks viejos de prueba`
- `feat(M4): obtencion correcta del horario en cache`
- `feat(M4): test de disponibilidad horario`
- `docs(log): actualizacion de bitacora`
- `style: uso de prettier para el formato`

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
- `fix(M4): simplificar desglose de tarifas en detalle de reserva`
- `docs(log): actualizacion de bitacora`

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
- `fix(M4): corregir calculo en detalle de reserva`
- `feat(M4): utils de validacion y schemas Zod en M4`
- `feat(M4): integrar validacion zod y alertas`
- `feat(M4): tests unitarios para esquemas Zod`
- `docs(log): actualizacion de bitacora`

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
  - `refactor(canchas): remover fallback`
  - `refactor(canchas): utils de horarios y formato`
  - `refactor(canchas): patron adapter para normalizar slots del backend`
  - `refactor(canchas): patron fachada para dividir canchas service`
  - `style: formato con prettier`
  - `docs(log): actualizacion de bitacora`

----
