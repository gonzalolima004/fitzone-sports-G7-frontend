#### 05/10/2026
#### Joaquín Ribarola | Rol: Desarrollador Frontend

- **Actividades:**
  - Desarrollo de la vista principal de Clases Grupales (`ClasesView.vue`) estructurando la UI base.
  - Implementación del indicador dinámico de Sede usando Pinia (`useSedeStore`).
  - Creación de un filtro dinámico de fechas, calculando automáticamente los próximos 5 días con formateo legible y de datos.
- **Decisiones:**
  - Generar el listado de los próximos días en el frontend en lugar de consultarlos, para agilizar la interacción.
  - Utilizar un diseño premium con micro-animaciones en TailwindCSS respetando estrictamente la estética de la maqueta (RF-07).
- **Dificultades:** Ninguna.
- **Commits:**
  - `feat(clases): crea interfaz y filtros de agenda (US-04-01)`

----

#### 05/10/2026
#### Joaquín Ribarola | Rol: Desarrollador Frontend

- **Actividades:**
  - Desarrollo del servicio `clases.service.ts` conectando el endpoint `GET /clases` (Tipado con interfaces `ClaseResponse`).
  - Creación del componente reutilizable `ClaseCard.vue` con diseño estético premium y cálculo dinámico de porcentajes de ocupación.
  - Integración de `ClaseCard` en `ClasesView` generando un mapeo dinámico reactivo (`computed`) para simular los horarios e instructores faltantes en la API actual.
  - Refinamiento de la Experiencia de Usuario (UI/UX) implementando Skeleton Loaders para tiempos de carga y Empty States estéticos para errores de conexión o falta de clases en agenda.
- **Decisiones:**
  - Simular datos de agenda en el frontend (horarios, profesores, sala) para avanzar con el maquetado sin bloquearnos por la falta de implementación de esos campos en el backend.
  - Centralizar y reutilizar estilos globales de estado (DISPONIBLE/COMPLETO) para dar coherencia visual.
  - Utilizar un enfoque optimista y enriquecido para los estados visuales (esqueletos de carga) en lugar de spinners genéricos, para cumplir con los requerimientos de diseño premium.
- **Dificultades:** Ninguna (Se resolvió un problema menor del compilador TS actualizando el `tsconfig.app.json` con `target: ES2022`).
- **Commits:**
  - `feat(clases): conecta api y define tipados para consultar catálogo (E4 Tarea 1.2)`
  - `feat(clases): implementa componente ClaseCard con UI responsiva (E4 Tarea 1.3 y 1.4)`

----

#### 07/10/2026
#### Joaquín Ribarola | Rol: Desarrollador Frontend

- **Actividades:**
  - Desarrollo del flujo completo de reservas (Tarea 2.1) implementando `POST /reservas-clases` en el frontend, incluyendo modals de confirmación.
  - Implementación del flujo de cancelación de reservas (Tarea 2.2) y consumo de `DELETE /reservas-clases/:id`, adaptando la UI con botones contextuales cuando la clase ya fue reservada por el usuario (estado local).
  - Manejo integral de excepciones del backend (restricciones de horario, mora, ventana de reservas) reflejando los errores de la API visualmente dentro de los modals (Tarea 2.3).
  - Integración de recarga automática de clases en bloque `finally` para asegurar actualización de cupos concurrentes tras cualquier intento exitoso o fallido (Tarea 2.4).
- **Decisiones:**
  - Administrar el rastreo de reservas de la sesión activa en un diccionario local en memoria (`misReservasLocal`) a falta de endpoint que exponga las reservas actuales del socio.
  - Exponer los mensajes de error del backend en el modal y no solo en notificaciones globales para proveer mayor contexto (UX).
  - Ejecutar la recarga de clases luego de intentar una reserva (incluso si falla) para garantizar que, si dos usuarios compiten por el último cupo, el que pierda vea inmediatamente que la clase pasó a estado "COMPLETO".
- **Dificultades:** Ninguna.
- **Commits:**
  - `feat(clases): implementa reservar clases`
  - `feat(clases): implementa cancelacion de clases`
  - `feat(clases): UI errores backend y refresh de cupos (Tareas 2.3 y 2.4)`

----

#### 07/10/2026
#### Joaquín Ribarola | Rol: Desarrollador Frontend

- **Actividades:**
  - Desarrollo de la inscripción a Lista de Espera (Tarea 3.1) mediante el endpoint `POST /lista-espera/inscribir` integrando su respectivo modal de confirmación en la UI.
  - Implementación visual del estado de inscripción (Tarea 3.2) almacenando temporalmente la inscripción en la sesión activa y deshabilitando el botón de acción en las tarjetas (`ClaseCard.vue`).
  - Integración de Supabase Realtime (Tarea 3.3) configurando `.env` e inicializando el cliente JS. Suscripción a la tabla `lista_espera` para detectar vacantes en vivo (filtro: `estado=NOTIFICADO`) y alertar al socio mediante una notificación Toast permanente y un auto-refresco del catálogo.
- **Decisiones:**
  - Utilizar el ecosistema nativo de Supabase Realtime directamente desde el Frontend en vez de depender de WebSockets puros, simplificando la arquitectura y garantizando entrega inmediata sin polling.
  - El modal de reserva ahora cambia su botón por un estado visual inactivo "En Lista de Espera" evitando llamadas duplicadas al backend de forma robusta en la UI.
- **Dificultades:** Ninguna.
- **Commits:**
  - `feat(clases): inscripcion a lista de espera`
  - `feat(clases): integracion notificaciones vacantes supabase realtime`

----

#### 11/10/2026
#### Joaquín Ribarola | Rol: Desarrollador Frontend

- **Actividades:**
  - Relevamiento de contratos y dependencias del backend para la agenda de clases grupales y reservas.
  - Actualización del servicio `clases.service.ts` integrando los nuevos DTOs del backend (`ClaseAgendaResponse`, `MiReservaClaseResponse`, `MiInscripcionListaEsperaResponse`).
  - Incorporación de los métodos `obtenerMisReservas` y `obtenerMisInscripciones`, y soporte para el filtro opcional de `fecha` en `obtenerClasesPorSede`.
  - Estandarización de los payloads de `reservarClase` e `inscribirListaEspera` para soportar horarios en formato ISO (`fecha_inicio` y `fecha_fin`).
  - Adaptación del componente `ClaseCard.vue` para renderizar cupos y aforo reales sin depender de simulaciones, manejando fallbacks para instructor ('Sin profesor asignado') y sala ('Sala no especificada'), e indicando la posición en cola de lista de espera.
  - Conexión de `ClasesView.vue` con la agenda por fecha y sede, reactivando la consulta al backend al cambiar el selector de fecha. Eliminación del estado local en memoria en favor de la recuperación directa de reservas e inscripciones en espera del usuario autenticado.
  - Actualización de las operaciones de reserva, lista de espera y cancelación para utilizar las instancias horarias ISO reales, reflejando el estado consistente en pantalla tras cada operación.
  - Corrección de la discrepancia de almacenamiento del token JWT entre el store global de autenticación (`useAuthStore`) y el cliente Axios (`http.ts`), garantizando el envío del header `Authorization: Bearer <token>` para llamadas autenticadas de reservas.
- **Decisiones:**
  - Mantener compatibilidad hacia atrás en los DTOs de peticiones y respuestas para evitar roturas de compilación mientras se refactorizan las vistas y componentes.
  - Manejar valores no disponibles de forma explícita en la UI en lugar de generar valores ficticios, y extender `ClaseCardProps` de forma flexible para integrarse con la agenda por fecha.
  - Consultar en paralelo la agenda y el estado del usuario mediante `Promise.all` para optimizar el tiempo de respuesta, distinguiendo las reservas por fecha para evitar solapamientos visuales entre días.
  - Sincronizar bidireccionalmente las claves `'token'` y `'fitzone_token'` tanto en el cliente Axios (`http.ts`) como en `useAuthStore` para evitar errores 401 y rebotes de redirección cuando la sesión del usuario está activa.
- **Dificultades:** Ninguna.
- **Commits:**
  - `feat(clases): actualizar clases.service con contratos reales de agenda y reservas`
  - `feat(clases): adaptar ClaseCard para datos reales de agenda y lista de espera`
  - `feat(clases): conectar agenda y estado de reservas del usuario por fecha`
  - `fix(auth): sincronizar lectura y guardado de token jwt entre http y auth store`

----

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

#### 29/10/2026
#### Joaquín Ribarola | Rol: Desarrollador Frontend

- **Actividades:**
  - Corrección en `ClasesView.vue` del mapeo de reservas activas del socio: filtrado estricto por reservas confirmadas (`id_clase_reserva_estado: 1` o `estado === 'CONFIRMADA'`) y descarte de reservas canceladas devueltas por el endpoint `GET /reservas-clases/mis-reservas`.
  - Validación de concordancia de fecha para reservas e inscripciones en lista de espera (`obtenerFechaLocalISO(r.fecha_inicio) === fechaSeleccionada`), evitando que reservas de otras fechas o clases recurrentes bloqueen incorrectamente la vista actual.
  - Corrección de errores críticos en `src/router/index.ts`: eliminación de redeclaración de variable `requiresAuth` en guard global y restauración de la jerarquía de rutas del módulo de gerencia y reportes (`/gerencia` y sus hijos) resolviendo colisiones de nombres de propiedades duplicadas (`TS1117`).
  - Limpieza de import no usado de `SelectorSede` en `CompletarPerfilView.vue`.
  - Mejora de UX ante carreras de reserva concurrentes (HTTP 409): integración en el modal de confirmación de reserva de un enlace directo para inscribirse a la lista de espera si la clase se completa simultáneamente, con recarga automática de disponibilidad en segundo plano.
  - Ajuste de notificación Realtime (Supabase) al liberarse vacantes para socios en espera, informando con precisión que la reserva fue confirmada automáticamente por la transacción atómica del backend.
- **Decisiones:**
  - Descartar del cálculo del estado de la tarjeta de clase cualquier reserva con estado cancelado, asegurando que ante una cancelación y posterior recarga de página el botón vuelva al estado "Reservar clase" (`DISPONIBLE`).
  - Mantener redirecciones de retrocompatibilidad para `/reportes` y `/reportes/ocupacion` hacia `/gerencia/reportes`.
  - Ofrecer transición inmediata hacia la lista de espera desde el modal de error de cupo lleno para evitar frustración al usuario que compite concurrentemente por el último turno.
- **Dificultades:**
  - El backend devolvía el historial completo de reservas del socio sin discriminar las canceladas (`where: { id_usuario }`), lo que provocaba que el frontend interpretara erróneamente cualquier reserva histórica como una reserva activa concurrente.
- **Commits:**
  - `fix(clases): corregir estado de reservas canceladas en agenda y resolver errores de router`
  - `feat(clases): optimizar flujo de concurrencia de reservas y notificacion de lista de espera`
  
----

#### 08/11/2026
#### Joaquín Ribarola | Rol: Desarrollador Frontend

- **Tarea:** E16-T1: Visualización de agenda para cualquier tipo de usuario, mensajes claros de membresía y restricción de reservas por jurisdicción de ciudad.
- **Actividades:**
  - **Enrutamiento y RBAC:** Incorporación del rol `'externo'` en `meta.roles` para la ruta `/clases` en `src/router/index.ts`, permitiendo el acceso directo a la agenda de clases para cualquier tipo de usuario (socio, externo, recepcionista, gerente) sin bloqueos ni rebotes de guardias.
  - **Navegación lateral en `Sidebar.vue`:** Habilitación del acceso a "Clases Grupales" en la sección de Operaciones para usuarios con rol `externo`.
  - **Integración con servicio de membresías:** Invocación de `membresiasService.verificarEstado` en `ClasesView.vue` para auditar reactivamente el estado del socio (`esSocioActivo`, `enMora`, `estado`), determinando si se encuentra habilitado para reservar.
  - **Banner informativo contextual de estado:** Implementación en `ClasesView.vue` de avisos superiores adaptativos para clientes externos, socios en mora, con membresía suspendida o sin membresía activa, explicando claramente la inhabilitación y proveyendo un botón de redirección directa a la vista de Membresías (`/membresia`).
  - **Restricción de reservas por ciudad (`socio.sede.id_ciudad === clase.sede.id_ciudad`):** Verificación reactiva de concordancia de ciudad entre la sede a la que pertenece el socio y la sede seleccionada de la clase. Si la sede pertenece a otra ciudad, se muestra banner informativo con botón directo "Volver a mi Sede", y se bloquea la reserva tanto a nivel de componente (`ClaseCard` deshabilitado con etiqueta "Sede en otra ciudad") como defensivamente en `handleReservar` y `handleListaEspera`.
  - **Blindaje de acciones en `ClaseCard.vue`:** Incorporación de la propiedad `motivoInhabilitacion` (`'EXTERNO'`, `'MORA'`, `'SUSPENDIDA'`, `'SIN_MEMBRESIA'`, `'CIUDAD_DIFERENTE'`) para reemplazar los botones de reserva y lista de espera por accesos contextuales hacia `/membresia` o badges de bloqueo geográfico.
  - **Guardias defensivas en reservas y lista de espera:** Restricción en `handleReservar` y `handleListaEspera` que bloquea la apertura de modales a usuarios no autorizados, con mora, suspensión o de otra ciudad, informando mediante `toast.warning` y redirigiendo según corresponda. Soporte ante respuestas HTTP 403 y 400 del backend mostrando mensajes informativos.
  - **Optimización de consultas:** Condicionamiento de las peticiones a `obtenerMisReservas` y `obtenerMisInscripciones` exclusivamente para socios autenticados, evitando llamadas fallidas (403) para externos.
  - **Cobertura de pruebas:** Creación y extensión de la suite `src/__tests__/clases-restricciones-membresia.spec.ts` con 11 pruebas unitarias certificando navegación, banners de membresía, reemplazo de botones en tarjetas, reservas de socios activos al día y bloqueo por discrepancia de ciudad.
- **Decisiones:**
  - Mantener la agenda pública y visible para cualquier tipo de usuario en el sistema pero inhabilitar la inscripción a nivel visual (tarjeta) y de lógica (handlers), canalizando a los usuarios hacia la adquisición de membresías o hacia sedes de su propia ciudad.
  - No consultar los endpoints de reservas personales si el rol no es socio para no generar peticiones innecesarias que son rechazadas por los guards del backend.
  - Sincronizar los datos de sede (`id_sede`, `sede`) en `Usuario` y `authStore` para validar en tiempo real la concordancia de ciudad sin peticiones adicionales.
- **Dificultades:** Ninguna.
- **Verificación:** 14 suites y 92 pruebas aprobadas al 100%. Typecheck (`vue-tsc -b`), linter (`eslint .`), formateo (`prettier`) y build de producción (`vite build`) exitosos sin errores ni advertencias.
- **Commits:**
  - `feat(clases): permitir visualizacion a clientes externos y restringir reservas por estado de membresia`
  - `feat(clases): restringir reservas e inscripciones a sedes de la misma ciudad del socio`

----

#### 10/11/2026
#### Joaquín Ribarola | Rol: Desarrollador Frontend

- **Tarea:** E16-T2: Cupos en Tiempo Real, Notificación de Vacantes y Ajustes de Vista Gerente.
- **Actividades:**
  - **Realtime cupos en la agenda (`ClasesView.vue`):** Incorporación de un segundo canal Supabase Realtime (`cupos-agenda-realtime`) suscripto a `postgres_changes` sobre la tabla `clase_reserva` (`event: '*'`). Cada INSERT, UPDATE o DELETE en reservas dispara `cargarClases(true)` debounceado a 150ms en segundo plano, actualizando los cupos disponibles en vivo en la agenda sin parpadeos de skeleton.
  - **Limpieza de canales en `onUnmounted`:** Ambos canales (`vacantesSubscription` y `cuposSubscription`) junto al timer de debounce (`timerCupos`) se limpian y desregistran al desmontar la vista, previniendo memory leaks y suscripciones huérfanas.
  - **Mensaje de vacante con ventana de 4 horas:** El toast de notificación cuando se libera un lugar en lista de espera fue actualizado para informar explícitamente al socio que tiene 4 horas para aprovechar la vacante confirmada, alineándolo con la regla de negocio establecida por el backend.
  - **Corrección del campo `descripcion` en el formulario del gerente:** Se identificó que `ClaseCardProps` no incluía el campo `descripcion`, por lo que el modal de edición siempre recibía `undefined`. Se agregó `descripcion?: string | null` a la interfaz en `ClaseCard.vue` y se incluyó `descripcion: clase.descripcion || null` en el mapeo de `clasesAgendadas` en `ClasesView.vue`, reparando la carga y el guardado correcto de la descripción al editar una clase sin pérdida de datos.
  - **Validación del horario operativo de la sede (`ModalClaseForm.vue`):** Se importó `HorarioOperativoSedeResponse` y se agregó lógica para consultar `obtenerHorarioOperativoSede` al abrir el modal (tanto en modo creación como edición) y cada vez que cambia la fecha puntual. En `guardarClase()`, antes de enviar, se valida que `horario_inicio >= hora_apertura` y `horario_fin <= hora_cierre`; si no se cumple, se bloquea el guardado con un mensaje claro. Además, se muestra un banner informativo verde con el rango horario permitido por la sede.
  - **Clarificación del tipo de clase (`ModalClaseForm.vue`):** Se incorporaron botones interactivos con íconos para disciplinas principales (Spinning, Yoga Vinyasa, CrossFit) que sincronizan automáticamente el nombre de la clase y seleccionan la disciplina adecuada.
  - **Unificación estética del botón "Reservar Clase" (`ClaseCard.vue`):** Se estandarizó el botón de reserva para que mantenga un color uniforme institucional (`bg-[#202759] hover:bg-[#161b3d] text-white`) en todas las disciplinas, eliminando la discrepancia donde unas aparecían en rojo y otras en gris oscuro.
  - **Optimización de carga y reservas (`ClasesView.vue`):**
    - Descarte de respuestas desfasadas por condiciones de carrera (`idCargaActual`) al conmutar rápidamente entre fechas del calendario o sedes.
    - Actualización optimista inmediata en memoria de cupos (`cupos_disponibles`, `cupos_ocupados`), estado de reservas e inscripciones en lista de espera al reservar o cancelar, permitiendo un feedback instantáneo en la UI antes de la reconciliación silenciosa con el servidor.
    - Carga de clases silenciosa (`cargarClases(silencioso = true)`) tras operaciones y eventos en tiempo real, evitando mostrar esqueletos de carga si la grilla ya cuenta con datos.
    - Reutilización de cache y deduplicación de llamadas para horarios operativos a través del store de sedes.
  - **`cursor-pointer` en todos los botones:** Configuración global en `src/style.css` asegurando `cursor: pointer` para todos los elementos `<button>` y `[role="button"]`, y `cursor: not-allowed` en botones deshabilitados, complementado con clases explícitas en componentes clave.
  - **Suite de pruebas unitarias (`src/__tests__/clases-criterios-e16-t2.spec.ts`):** Creación de 9 pruebas unitarias automatizadas certificando el cumplimiento riguroso de cada uno de los 5 criterios de aceptación de la tarea y la homogeneidad cromática de los botones.
  - **Actualización de test de regresión (`conflictos-clases.spec.ts`):** Adaptado para certificar los 2 canales activos de Supabase Realtime y la limpieza controlada de suscripciones al desmontar.
- **Decisiones:**
  - Unificar el botón "Reservar Clase" en el color primario de marca (`#202759`) en lugar de colores variantes por disciplina, brindando consistencia visual y evitando confusiones con estados de alerta o peligro (rojo).
  - Adoptar actualizaciones optimistas en memoria para reservas y cancelaciones junto a recarga silenciosa en segundo plano, mejorando drásticamente la percepción de velocidad en la experiencia del usuario.
  - Consultar y cachear el horario operativo mediante `sedeStore` para evitar peticiones HTTP redundantes.
- **Dificultades:** Ninguna.
- **Verificación:** 15 suites y 101 pruebas aprobadas al 100%. Pipeline de validación completo exitoso: formateo (`npm run format`), linter (`npm run lint`), tipado (`npm run typecheck`), compilación de producción (`npm run build`) y tests (`npm run test`) con 0 errores y 0 advertencias.

----

#### 15/11/2026
#### Joaquín Ribarola | Rol: Desarrollador Frontend

- **Tarea:** RF-07 — Reserva de clases: Reserva hasta 48 hs antes; el sistema decrementa el cupo. Cancelación sin penalidad hasta 2 hs antes.
- **Actividades:**
  - **Función utilitaria de control de cancelación (`date-formatter.ts`):** Creación de `obtenerEstadoCancelacionReserva(fecha, horario)` evaluando la diferencia temporal entre el momento actual y el inicio de la clase. Si faltan 2 horas o menos (o si la clase ya inició/pasó), bloquea la cancelación devolviendo `puedeCancelar: false`, `motivoBloqueo: 'LIMITE_2_HORAS'` y un mensaje claro para el socio.
  - **Bloqueo interactivo en la tarjeta de clase (`ClaseCard.vue`):** Para clases reservadas (`clase.estado === 'MISMA_RESERVA'`), si faltan más de 2 horas se mantiene el botón habilitado "Cancelar mi Reserva". Si faltan 2 horas o menos, el botón pasa a estado deshabilitado (`disabled`, `cursor-not-allowed`) con la etiqueta "No cancelable (≤ 2 hs)" y tooltip explicativo de la política de cancelación.
  - **Guardias defensivas en la vista de agenda (`ClasesView.vue`):** En `handleCancelar(idClase)` y en `confirmarCancelacion()`, se verifica defensivamente el cumplimiento de la ventana de cancelación antes de abrir el modal o invocar el endpoint `cancelarReserva(idReserva)`. En caso de intento inválido, se notifica con `toast.warning`.
  - **Aviso informativo en modal de cancelación (`ClasesView.vue`):** Incorporación de una nota explicativa dentro del modal recordando al socio la regla RF-07.
  - **Cobertura de pruebas unitarias (`date-formatter.spec.ts` y `clases-rf-07-cancelacion.spec.ts`):** Validación exhaustiva con `vi.useFakeTimers()` para clases con más de 2 hs, exactamente 2 hs, menos de 2 hs y clases ya pasadas, certificando el bloqueo tanto en tarjeta como en vista y llamadas a servicio.
- **Decisiones:**
  - Deshabilitar el botón y bloquear la acción en frontend cuando falten 2 horas o menos para el inicio de la clase, cumpliendo estrictamente con la regla RF-07 sin requerir por el momento un sistema de penalizaciones punitivas.
  - Proteger tanto la interfaz de usuario como la ejecución del servicio mediante validaciones preventivas multinivel.
- **Dificultades:** Ninguna.
- **Verificación:** Pipeline de validación completo exitoso: formateo (`npm run format`), linter (`npm run lint`), tipado (`npm run typecheck`), compilación de producción (`npm run build`) y tests (`npm run test`) con 16 suites y 117 pruebas aprobadas al 100%.

----
  
#### 15/11/2026
#### Joaquín Ribarola | Rol: Desarrollador Frontend

- **Tarea:** RF-07 — Reserva de clases: Reserva hasta 48 hs antes; el sistema decrementa el cupo. Cancelación sin penalidad hasta 2 hs antes.
- **Actividades:**
  - **Función utilitaria de control de cancelación (`date-formatter.ts`):** Creación de `obtenerEstadoCancelacionReserva(fecha, horario)` evaluando la diferencia temporal entre el momento actual y el inicio de la clase. Si faltan 2 horas o menos (o si la clase ya inició/pasó), bloquea la cancelación devolviendo `puedeCancelar: false`, `motivoBloqueo: 'LIMITE_2_HORAS'` y un mensaje claro para el socio.
  - **Bloqueo interactivo en la tarjeta de clase (`ClaseCard.vue`):** Para clases reservadas (`clase.estado === 'MISMA_RESERVA'`), si faltan más de 2 horas se mantiene el botón habilitado "Cancelar mi Reserva". Si faltan 2 horas o menos, el botón pasa a estado deshabilitado (`disabled`, `cursor-not-allowed`) con la etiqueta "No cancelable (≤ 2 hs)" y tooltip explicativo de la política de cancelación.
  - **Guardias defensivas en la vista de agenda (`ClasesView.vue`):** En `handleCancelar(idClase)` y en `confirmarCancelacion()`, se verifica defensivamente el cumplimiento de la ventana de cancelación antes de abrir el modal o invocar el endpoint `cancelarReserva(idReserva)`. En caso de intento inválido, se notifica con `toast.warning`.
  - **Aviso informativo en modal de cancelación (`ClasesView.vue`):** Incorporación de una nota explicativa dentro del modal recordando al socio la regla RF-07.
  - **Cobertura de pruebas unitarias (`date-formatter.spec.ts` y `clases-rf-07-cancelacion.spec.ts`):** Validación exhaustiva con `vi.useFakeTimers()` para clases con más de 2 hs, exactamente 2 hs, menos de 2 hs y clases ya pasadas, certificando el bloqueo tanto en tarjeta como en vista y llamadas a servicio.
- **Decisiones:**
  - Deshabilitar el botón y bloquear la acción en frontend cuando falten 2 horas o menos para el inicio de la clase, cumpliendo estrictamente con la regla RF-07 sin requerir por el momento un sistema de penalizaciones punitivas.
  - Proteger tanto la interfaz de usuario como la ejecución del servicio mediante validaciones preventivas multinivel.
- **Dificultades:** Ninguna.
- **Verificación:** Pipeline de validación completo exitoso: formateo (`npm run format`), linter (`npm run lint`), tipado (`npm run typecheck`), compilación de producción (`npm run build`) y tests (`npm run test`) con 16 suites y 117 pruebas aprobadas al 100%.

----
