# Bitácora — Agüero, Facundo Luis — Rol: desarrollador backend y frontend; líder técnico del 01/10 al 14/10

Esta bitácora cubre mi trabajo en el repositorio frontend y la planificación y el seguimiento que hice como líder técnico del 01/10 al 14/10. Lo que hice en el backend está en `docs/bitacoras/LOG-Aguero.md` del repositorio backend.

## Sprint 4 — Unidad IV — Semana del 2026-09-28

### 2026-10-01 · <horas> h
<!-- PARA COMPLETAR: «TL Tarea 1 - Organización y Seguimiento del Frontend» estimaba 4 h y «TL Tarea 2 - Revisión e Integración de los Módulos Frontend», 3 h, para todas las sesiones de TL (01/10, 08/10 y 14/10). Borrar este comentario. -->

**Actividad**
Como líder técnico organicé el comienzo del desarrollo en Vue:
- Revisé el trabajo integrador, el backlog del backend, el repositorio del frontend y el maquetado.
- Planifiqué dos semanas de trabajo y armé el backlog del frontend en PDF.
- Cargué y asigné en Trello 21 tareas de frontend y 2 de coordinación, con descripción, estimación en horas y subtareas.
- Repartí las responsabilidades: Gonzalo Lima, base compartida y pagos (16 horas); Matías Sillen, usuarios y membresías (18 horas); Angelina Vialle, QR, recepción y aforo (17 horas); Joaquín Ribarola, clases y lista de espera (17 horas); Marcos Caraballo, canchas y reservas (18 horas); yo, reportes (11 horas) y coordinación como líder técnico (7 horas).
- Identifiqué las dependencias entre módulos y preparé las consultas y el resumen de avance para presentarle al profesor.

**Decisión**
- Mantuve el formato de tarjetas que usaba el equipo: tareas concretas, checklist de subtareas y estimaciones en horas.
- Repartí la carga teniendo en cuenta también el tiempo de coordinación del líder técnico y organicé la revisión entre compañeros.
- Prioricé la base común y la sesión, para facilitar la integración de los demás módulos.
- Propuse una rama por tarea con PR hacia `dev` y reservar `main` para la versión estable.

**Problema o bloqueo**
- Las estimaciones son iniciales y hay que ajustarlas según la disponibilidad y el aprendizaje de Vue de cada integrante.
- Encontré dependencias del backend pendientes de verificar, sobre todo la validación de ingreso, los permisos y las notificaciones.
- La tarea previa del diagrama relacional, compartida por Gonzalo y Joaquín, no está incluida en las 104 horas estimadas para el frontend y la coordinación.

**Commits**
Sin commits: la planificación quedó en el tablero de Trello (las 23 tarjetas se crearon ese día) y en el backlog del frontend en PDF.

---

## Sprint 5 — Unidad IV — Semana del 2026-10-05

### 2026-10-08 · <horas> h
<!-- PARA COMPLETAR: la tarjeta «Frontend E1 Tarea 4 - Pantalla de Reporte de Ingresos por Sede» estimaba 4 h. Borrar este comentario. -->

**Actividad**
- Empecé la pantalla del reporte de ingresos, con filtros de fechas, sede y concepto.
- Validé el rango de fechas y reutilicé el store de sedes del equipo.
- Creé el servicio que consulta `GET /reportes/ingresos` y muestra el total, el detalle por sede y la respuesta sin resultados.
- Comprobé los errores de conexión y que la consulta se recupere al reiniciar el backend local.

Verificación: typecheck, lint y build aprobados.

**Decisión**
- Trabajé en `feature/e1-tarea-4-reporte-ingresos` y mantuve el filtro de sede del reporte separado de la selección del encabezado.
- Reutilicé el cliente HTTP compartido (ver [ADR-0006](../adr/0006-cliente-http-axios.md)) y omití los filtros opcionales cuando se eligen todas las sedes o todos los conceptos.

**Problema o bloqueo**
- Faltaba el archivo `.env` del frontend; configuré la URL del backend y verifiqué la carga de sedes.
- Mientras aprendía Vue tuve que corregir errores de sintaxis y agregar la función de formato de moneda, que faltaba.
- Las tablas `pago` y `pago_estado` aparecían vacías. Quedó pendiente comprobar filas, filtros e importes con los pagos de prueba que acordara el equipo.

**Commits**
- `defd2e2` feat(reportes): agregar filtros de fechas y validar rango
- `1db2b64` feat(reportes): agregar filtros de sede y concepto
- `6fd52a7` feat(reportes): consultar ingresos y mostrar resultados
- `c2479ab` docs(log): registrar avances de reportes y seguimiento TL

---

### 2026-10-08 · <horas> h
<!-- PARA COMPLETAR: sesión de líder técnico (ver la estimación de TL en la entrada del 01/10). Borrar este comentario. -->

**Actividad**
Como líder técnico:
- Revisé e integré en `dev` los PR de usuarios (#5 y #9), clases (#6 y #11) y reporte de ingresos (#12).
- Actualicé mi repositorio local y comprobé el código integrado: carga de clases por sede, pantalla sin resultados y recuperación ante errores de conexión.
- Revisé `npm audit` y el check de GitGuardian del PR de la credencial QR (#4).
- Creé y asigné en Trello cinco tarjetas de corrección, con estimaciones y subtareas:
  - Gonzalo Lima: [configuración de TypeScript](https://trello.com/c/uhzPNA93) (0,5 horas) y [actualización de dependencias](https://trello.com/c/rxq6hcEG) (1,5 horas).
  - Matías Sillen: [token y cierre de sesión](https://trello.com/c/vOFfK1Cs) (2 horas).
  - Joaquín Ribarola: [agenda y estado de reservas de clases](https://trello.com/c/A6FQAuR8) (5 horas).
  - Angelina Vialle: [revisión de la alerta de GitGuardian del QR](https://trello.com/c/LyyrNbDx) (2 horas).

**Decisión**
- Repartí las correcciones entre los responsables de cada módulo, para que las resuelvan con ramas y PR hacia `dev`.
- Dejé en espera el merge del PR #4 hasta resolver o justificar los hallazgos de GitGuardian y verificar la credencial QR.
- Decidí repetir las verificaciones después de cada integración, porque que Git no marque conflictos no garantiza que la aplicación funcione.
- Guardé en un stash las correcciones locales de integración hasta revisar si seguían siendo necesarias.

**Problema o bloqueo**
- ESLint pasaba en el `dev` actualizado, pero el build fallaba por propiedades duplicadas en `tsconfig.app.json`.
- El store guarda el token y el usuario con claves distintas de las que usa el cliente HTTP.
- La agenda todavía tenía datos simulados: el selector de fecha no filtraba las clases y el estado de las reservas quedaba solo en memoria.
- `npm audit` informó tres paquetes afectados por dos avisos de severidad alta.
- GitGuardian seguía marcando dos posibles secretos en el PR #4; quedó pendiente determinar si eran credenciales reales o falsos positivos.
- Las correcciones quedaron organizadas y asignadas, pero todavía sin resolver.

**Commits**
- `2a02b64` merge del PR #5 (login y sesión) en `dev`
- `391ed87` merge del PR #6 (agenda de clases) en `dev`
- `f35cf74` merge del PR #11 (lista de espera de clases) en `dev`
- `5a659c9` merge del PR #9 (interfaz de login con Tailwind) en `dev`
- `fccee6e` merge del PR #12 (reporte de ingresos) en `dev`
- `b98e3b4` docs(log): registrar integracion y correcciones asignadas
- `23cdae1` merge del PR #13 (bitácora de TL del 08/10) en `dev`

---

## Sprint 5 — Unidad IV — Semana del 2026-10-12

### 2026-10-14 · <horas> h
<!-- PARA COMPLETAR: la tarjeta «Frontend E1 Tarea 5 - Pantalla de Ocupación y Reservas por Sede» estimaba 4 h. Borrar este comentario. -->

**Actividad**
Tarea: pantalla de ocupación y reservas por sede.
- Implementé `/reportes/ocupacion`, conectada a `GET /reportes/ocupacion` con el cliente HTTP compartido.
- Agregué los filtros de fechas y sede, la consulta consolidada, los totales y el detalle de asistencias, reservas de canchas y clases.
- Manejé la carga, los resultados vacíos, los errores y los reintentos; evité los envíos simultáneos y validé las fechas.
- Agregué pruebas de la pantalla con respuestas simuladas.

Verificación: build y lint aprobados y 5 pruebas aprobadas.

**Decisión**
- Mantuve el filtro de sede del reporte independiente del selector general.
- Muestro las cantidades históricas del período, sin presentarlas como aforo instantáneo.
- Publiqué la entrega en `feature/e1-tarea-5-ocupacion` para revisión hacia `dev`.

**Problema o bloqueo**
- Eliminé las propiedades `target` y `lib` duplicadas que impedían compilar.
- Sincronicé `package-lock.json` con las dependencias ya declaradas, porque `npm ci` fallaba.
- Encontré una consulta incompleta en el backend; entregué su corrección en una rama separada (está en la bitácora del backend).
- Quedaron pendientes la aceptación visual y la prueba con una cuenta del entorno compartido.

**Commits**
- `58042e7` feat(reportes): consultar ocupacion y reservas por sede
- `64414ee` docs(log): registrar tarea frontend de ocupacion

---

### 2026-10-14 · <horas> h
<!-- PARA COMPLETAR: la tarjeta «Frontend E1 Tarea 6 - Integración del Panel de Gerencia» estimaba 3 h. Borrar este comentario. -->

**Actividad**
Tarea: integración del panel de gerencia.
- Integré ingresos y ocupación en un panel con navegación por rutas y enlaces directos.
- Agregué accesos a los reportes desde el inicio para gerente y admin, y mantuve el menú activo en las rutas hijas.
- Adapté el formulario de ingresos a distintos anchos de pantalla, conservando los filtros y el formato de los importes.
- Escribí pruebas de navegación y de regresión del reporte de ingresos.

Verificación: build y lint aprobados y 8 pruebas aprobadas, incluidas las de la tarea anterior.

**Decisión**
- Conservé `/reportes` para ingresos y `/reportes/ocupacion` para la actividad.
- Publiqué `feature/e1-tarea-6-panel-gerencia` con dependencia de `feature/e1-tarea-5-ocupacion`.

**Problema o bloqueo**
La aceptación integrada necesita la corrección del backend y una sesión real; no la doy por hecha con pruebas simuladas.

**Commits**
- `72c3ee2` feat(reportes): integrar panel de gerencia y navegacion
- `df6e664` merge de `feature/e1-tarea-5-ocupacion` en `feature/e1-tarea-6-panel-gerencia`
- `7cd481a` docs(log): registrar integracion del panel de gerencia

---

### 2026-10-14 · <horas> h
<!-- PARA COMPLETAR: sesión de líder técnico (ver la estimación de TL en la entrada del 01/10). Borrar este comentario. -->

**Actividad**
Como líder técnico cerré mis dos semanas:
- Revisé el tablero y las dependencias, publiqué mis cuatro ramas con el prefijo `feature/` y actualicé las bitácoras de desarrollo y de líder técnico.
- Integré en `dev` los PR #4, #14, #15, #16, #17, #18, #19 y #20 de mis compañeros. En #16, #17, #18 y #20 resolví los conflictos conservando los cambios de sus autores.
- Integré en `dev` mis PR #21 y #22 del frontend y el #56 del backend. Resolví conflictos en rutas y bitácoras conservando los registros completos y las pantallas de pagos.
- Preparé el [documento de traspaso](https://github.com/gonzalolima004/fitzone-sports-G7-frontend/blob/d286196f58fa20b7a2f800757b2f2e90cb7ed196/src/docs/cierre-tl-2026-10-14.md) para el siguiente líder técnico y lo entregué con el PR #23.
- En Trello di por terminadas las tareas 5 y 6 del frontend como desarrollo integrado y actualicé la de ocupación del backend; la tarea 2 de líder técnico quedó con la revisión entre compañeros y la aceptación integrada pendientes.

Verificación final: en el frontend, build, lint y 11 pruebas aprobados; en el backend, build, typecheck y 9 pruebas aprobados, más la verificación de la consulta con PGlite. No modifiqué la base compartida.

**Decisión**
- Preservé el historial con merges y dejé ocupación como única ruta hija del panel.
- No di por hechas la aceptación visual ni la prueba con una sesión real a partir de pruebas simuladas.

**Problema o bloqueo**
- Tuve que regenerar Prisma Client en mi máquina porque había cambiado el esquema de clases.
- Hubo conflictos en las entradas de la bitácora: conservé las de todos los autores y reemplacé la plantilla vacía de líder técnico.
- Al traer `dev`, la ruta de ocupación quedó duplicada; la dejé como única ruta hija del panel.
- Quedaron abiertos la revisión de los compañeros, la aceptación visual y con datos reales, el contrato del checkout de membresías y los acuerdos de la reunión del 14/10 a las 15:00, donde se sorteaba el nuevo líder técnico, que asumió el 15/10.

**Commits**
- Merges de PR en `dev`: `75a70e4` #4 · `9ee918d` #14 · `5073dc6` #15 · `8cca49c` #19 · `731a296` #16 · `5294b0d` #17 · `75423b5` #18 · `022878a` #20 · `4cc529b` #21 · `73760ed` #22 · `93b88e5` #23
- `31cb9d4` docs(tl): preparar cierre y traspaso del 14 de octubre
- `f7e9073` merge(dev): resolver compatibilidad de sesion y configuracion en pagos
- `9f0197f` merge(dev): actualizar resultado de pagos y conservar bitacora
- `b1afc69` merge(dev): actualizar historial de pagos y preservar registro de tareas
- `714e0e7` merge(dev): conservar contrato actual de lista de espera en membresias
- `e44c72e` merge(pagos): integrar membresias con historial y conservar contratos
- `1ac0a84` docs(log): completar tareas dev y TL y registrar resolucion de conflictos
- `b55a9a1` merge de `dev` en `feature/historial-pagos`
- `d01ab33` merge de `feature/historial-pagos` en `feat/e2-t3-consulta-planes-membresia`
- `d286196` docs(log): completar tareas dev y TL y registrar resolucion de conflictos
- `c354c59` merge de `dev` en `feature/e1-tarea-5-ocupacion`
- `1a3c1e1` merge de `dev` en `feature/e1-tarea-6-panel-gerencia`
- `1263214` docs(tl): registrar integracion de PR y estado de tareas

---

## Sprint 6 — Unidad V — Semana del 2026-10-19

### 2026-10-23 · <horas> h
<!-- PARA COMPLETAR: la tarjeta «E11-T1: Panel de Gerente, CRUD Sedes/Membresías y Sede Dinámica» estimaba 10 h para backend y frontend (sesiones del 23 y 27/10 en los dos repositorios). Borrar este comentario. -->

**Actividad**
Tarea: panel de gerente, CRUD de sedes y membresías y sede dinámica (parte frontend).
- Sede dinámica en el registro: componente común `SelectorSede` conectado al store de sedes (`GET /sedes`), que usan `RegistroView` y `CompletarPerfilView` (registro con Google). Muestra «Cargando sedes...», un error con reintento y un aviso cuando no hay sedes, y deshabilita el selector y el botón de registro mientras no haya sedes para elegir. El reemplazo de la sede fija por la lista de la API lo había hecho Matías; yo completé los estados de carga y de error y unifiqué los dos flujos.
- CRUD de sedes: pantalla `/gerencia/sedes` con el listado de sedes activas (ciudad y aforo), resumen, skeleton y estados vacío y de error; alta y edición en `SedeFormModal`, validado con Zod según `CreateSedeDto`; alta de ciudad en línea; baja lógica con confirmación previa y toast posterior.
- CRUD de planes: pantalla `/gerencia/planes` con el listado ordenado por duración y el precio en pesos; alta y edición en `PlanFormModal` (Zod según `CrearPlanDto`, duración entera, precio con hasta 2 decimales y atajos Mensual, Trimestral y Anual); eliminación con confirmación.
- Dashboard del gerente: `/gerencia` pasó a ser la portada del rol gerente (`rutaPorRol` y menú lateral), con cuatro indicadores calculados con endpoints existentes (sedes activas, planes, ingresos del mes y reservas de hoy) y accesos a sedes, planes, canchas y reportes. La pantalla de reportes pasó a llamarse «Reportes de gerencia», con un enlace para volver al panel.
- Pruebas con Vitest: selector de sede, CRUD de sedes y planes (listado, validación, alta, edición, errores del servidor y baja), dashboard (indicadores, fechas consultadas, accesos y falla parcial) e ítem activo del menú lateral.

Verificación: 12 archivos y 54 pruebas aprobadas (26 nuevas); typecheck, lint y build aprobados; cada commit compila y pasa sus pruebas. Recorrí las pantallas en el navegador con la API simulada, en escritorio y en celular.

**Decisión**
- Agrupé en `src/modules/gerencia` (la ruta que indica el backlog) el dashboard y las pantallas de parametrización del gerente central, sin modificar módulos de otros responsables más allá del selector de sede del registro y de la navegación (`ruta-por-rol.ts` y `Sidebar.vue`).
- Reutilicé `BaseModal`, `BaseInput`, `BaseButton`, `BaseSkeleton`, el toast y el store de sedes (ver [ADR-0004](../adr/0004-gestor-de-estado-pinia.md)), y seguí el patrón del equipo: modal antes de una acción destructiva y toast después.
- Recargo el store global de sedes después de cada alta, edición o baja, para que el registro y el selector del encabezado muestren los cambios sin recargar la página.
- La sede del registro arranca vacía y es obligatorio elegirla: preseleccionar la primera podía asignar socios a una sede equivocada.
- No creé endpoints nuevos para el dashboard: cada indicador usa una consulta existente y carga por separado, así que si una falla, las demás se muestran igual.

**Problema o bloqueo**
- Eliminar un plan con membresías asociadas devuelve 500 en el backend (clave foránea). La pantalla explica el caso y sugiere editar el plan; el 409 queda pendiente para el responsable de M1.
- En pantallas angostas las tablas obligaban a desplazarse en horizontal; pasé la información secundaria debajo del nombre y dejé los botones solo con ícono.
- Al integrar los últimos cambios de `dev`, el menú lateral ya tenía «Directorio de Usuarios» y «Gestión de Canchas», que también viven bajo `/gerencia`; con «Panel de gerencia» apuntando a `/gerencia` se resaltaban dos ítems a la vez. Ajusté `Sidebar.vue` para marcar solo el ítem de la ruta más específica.
- Quedó pendiente el recorrido con la cuenta compartida de gerente contra el backend con los guards de escritura.

**Commits**
- `57f97ef` feat(registro): selector de sede dinamico
- `6f45e94` feat(gerencia): agregar CRUD de sedes
- `da32e9e` feat(gerencia): agregar CRUD de planes de membresia
- `e81f5ee` feat(gerencia): agregar dashboard del gerente
- `1768d88` docs(log): registrar parte frontend de E11-T1

---

## Sprint 6 — Unidad V — Semana del 2026-10-26

### 2026-10-27 · <horas> h
<!-- PARA COMPLETAR: correcciones de la revisión, sin tarjeta propia en Trello. Borrar este comentario. -->

**Actividad**
Tarea: correcciones de la revisión del panel de gerencia.
- Quité de las pantallas de sedes, planes y del panel los códigos de requisitos y de actor que aparecían en títulos y ayudas; quedaron solo los textos descriptivos.
- Ajusté mis entradas anteriores de la bitácora al formato que usaba el equipo en ese momento: commits sin hash, sin enlace a Trello y sin códigos de tarea.

Verificación: 12 archivos y 54 pruebas aprobadas; typecheck, lint y build aprobados.

**Decisión**
Ninguna.

**Problema o bloqueo**
Ninguno.

**Commits**
- `523bda8` fix(gerencia): quitar codigos de requisitos de las pantallas
- `6305d2e` docs(log): corregir formato y registrar correcciones

---

### 2026-10-27 · <horas> h
<!-- PARA COMPLETAR: parte de «E11-T1» (10 h estimadas para toda la tarea). Borrar este comentario. -->

**Actividad**
Tarea: CRUD de membresías de cada socio y ajuste de las pantallas de gerencia a la maqueta (parte frontend).
- Pantalla `/gerencia/membresias` con una fila por socio, como en la maqueta del directorio de usuarios: iniciales, nombre y email, DNI, sede, plan y vencimiento, y estado. Muestra la membresía activa más reciente o, si no tiene, la última que tuvo; los socios sin membresía también aparecen.
- Tarjetas con la cantidad de socios en cada estado de la tabla `membresia_estado` y sin membresía, que filtran el listado al tocarlas. Filtros por estado y por sede, y búsqueda por nombre, DNI o email sin distinguir tildes.
- Acciones por socio: Asociar (sin membresía), Renovar (vencida), Reactivar (suspendida: vuelve a Activa con `PATCH /membresias/:id/estado`) y Gestionar.
- Alta en `MembresiaAltaModal`, que también usan Asociar y Renovar con el socio y el plan ya elegidos: socio con buscador, plan con su precio, fecha de inicio y renovación automática, validados con Zod. Muestra el vencimiento que calcula el backend y avisa si el socio ya tiene una membresía activa, que pasa a Suspendida.
- Edición en `MembresiaEdicionModal`: estado, vencimiento y renovación automática. Desde ahí se puede eliminar, con confirmación, una membresía cargada por error; si tiene pagos, se muestra el motivo que devuelve el backend (409).
- Sedes: buscador por nombre o ciudad y columna «Instalaciones» con las canchas de cada sede agrupadas por tipo (`GET /canchas`).
- Panel del gerente según la maqueta del dashboard ejecutivo: indicadores de socios activos, facturación del mes, reservas de hoy y aforo simultáneo, y la tabla «Rendimiento por sede» con socios activos, aforo actual y máximo, reservas y recaudación del mes. Se mantienen los accesos de administración.
- Quité las menciones al rol admin en los comentarios de los servicios de sedes y planes y en una prueba.
- Pruebas con Vitest: listado por socio, resumen y filtros, acciones de cada fila, alta y validaciones, edición con cada endpoint, eliminación con 409 y cálculo del vencimiento; buscador e instalaciones de sedes; indicadores, tabla por sede y fallas parciales del panel.

Verificación: 13 archivos y 81 pruebas aprobadas (27 nuevas); typecheck, lint y build aprobados; cada commit compila y pasa sus pruebas. Recorrí las pantallas en el navegador con la API simulada, en escritorio, tablet y celular.

**Decisión**
- Uso solo endpoints existentes: los socios y su sede salen de `GET /usuarios` y se cruzan en el navegador con `GET /membresias`; el aforo de cada sede, de `GET /accesos/aforo/:id`; la facturación y las reservas, de los reportes de ingresos y ocupación.
- Un socio cuenta como activo si su membresía está Activa y no venció (fecha de fin igual o posterior a hoy).
- Los estados salen de `GET /membresias/estados` y no están escritos en el frontend.
- De la maqueta dejé afuera el porcentaje de ocupación de canchas y el estado de cada sede, porque ningún endpoint los calcula; en su lugar se muestran las reservas.
- Cada dato del panel se carga por separado: si uno falla, ese indicador muestra «No disponible» o un guion y el resto se ve igual.
- Las fechas llegan como `2026-10-01T00:00:00.000Z` y se muestran tomando solo la fecha, para que la zona horaria no las corra un día.
- En celular, las columnas secundarias se ocultan o pasan debajo del nombre, sin desplazamiento horizontal.

**Problema o bloqueo**
Ninguno.

**Commits**
- `44cfbad` fix(gerencia): quitar el rol admin de comentarios y pruebas
- `04c7a88` feat(gerencia): agregar CRUD de membresias de socios
- `4252a1c` feat(gerencia): agregar buscador e instalaciones en sedes
- `5bd3176` feat(gerencia): alinear el dashboard con la maqueta
- `2286e24` docs(log): registrar CRUD de membresias y ajustes a la maqueta

---

## Sprint 7 — Unidad VI — Semana del 2026-11-09

### 2026-11-10 · <horas> h
<!-- PARA COMPLETAR: la tarjeta «E14-T1: CRUD de Calendario, Excepciones por Sede y Vista de Gestión» estimaba 10 h para backend y frontend (sesiones del 06/11 en el backend y del 10/11 en el frontend). Borrar este comentario. -->

**Actividad**
Tarea: calendario de feriados y excepciones de cada sede para el gerente (parte frontend).
- Pantalla `/gerencia/calendario`, con acceso desde el panel del gerente: grilla del mes de lunes a domingo con los feriados y fechas de toda la cadena y con los cierres u horarios especiales de la sede elegida. Al tocar un día se ve su detalle con las acciones y, debajo de la grilla, la lista de fechas del mes.
- La sede del calendario es la del selector del encabezado (store de sedes): si cambia en cualquiera de los dos lugares, se recargan las excepciones.
- Alta y edición de feriados en `FeriadoFormModal` (fecha, descripción, feriado y día hábil) y de excepciones en `ExcepcionSedeFormModal` (cierre de todo el día u horario especial con apertura y cierre, y motivo), validados con Zod según los DTO del backend. Las bajas usan `ConfirmarEliminacionModal` y toast; reutilicé `BaseModal`, `BaseInput`, `BaseButton` y `BaseSkeleton`.
- Servicio `calendario.service.ts` para `/calendario` y `/sedes/:id/calendario`, y los tipos de las respuestas.
- Pruebas con Vitest: carga del mes y marcas de la grilla, cambio de mes y de sede, altas, edición, bajas, validaciones, errores del servidor y acceso a la ruta solo con el rol gerente (guard del router).

Verificación: 16 archivos y 110 pruebas aprobadas (18 nuevas); typecheck, lint y build aprobados; cada commit compila y pasa sus pruebas. Recorrí la pantalla en el navegador con la API simulada, en escritorio, tablet y celular.

**Decisión**
- Cada mes se carga con dos consultas en paralelo (fechas del calendario y excepciones de la sede), porque cada viaje al backend suma tiempo. Si llega tarde la respuesta de un mes o de una sede anteriores, se descarta.
- Si se carga un feriado en una fecha que ya existe como día común (el backend la crea al cargar una excepción), se actualiza esa fecha en lugar de crear otra; si ya es un feriado, se pide editarlo.
- Si al quitar un feriado alguna sede tiene una excepción ese día, el backend responde 409: la fecha queda como día común, las excepciones se mantienen y el toast lo informa.
- Al editar una excepción, la fecha se envía solo si cambió, para ahorrar una consulta.
- Después de cada cambio se borran del store los horarios operativos en caché de las fechas tocadas (de todas las sedes si es un feriado, de una sede si es una excepción), para que canchas y clases los vuelvan a pedir.
- El acceso por rol se resuelve con la ruta hija de `/gerencia`, que ya exige el rol gerente; además, el backend responde 403 a cualquier otro rol.

**Problema o bloqueo**
- Un feriado de toda la cadena no cambia por sí solo el horario operativo que consultan canchas y clases: `GET /sedes/:id/horario-operativo` tiene en cuenta las excepciones de cada sede y el horario semanal. El formulario del feriado lo aclara y sugiere cargar una excepción para cerrar la sede; cómo tratar los feriados en ese endpoint queda a definir con su responsable.
- En tablet, el selector de sede quedaba cortado a la derecha de la barra del mes; ahora la barra pasa a dos líneas cuando no hay lugar.
- Quedó pendiente el recorrido con la cuenta de gerente contra el backend.

**Commits**
- `daa25a0` feat(gerencia): agregar vista de calendario con feriados y excepciones por sede
- `9de179a` feat(gerencia): agregar formularios de feriados y excepciones de sede
- `da1d95f` test(gerencia): agregar pruebas de la vista de calendario
- `9d377f5` docs(log): registrar vista y formularios de calendario

---

### 2026-11-12 · <horas> h
<!-- PARA COMPLETAR: la tarjeta «E14-T2: Configuración de Horarios Semanales, Seguridad y Rutas de Gerencia» estimaba 7 h para backend y frontend (sesiones del 12/11 en los dos repositorios). Borrar este comentario. -->

**Actividad**
Tarea: horarios semanales de cada sede y orden de las rutas y accesos de gerencia, sedes y reportes (parte frontend).
- Pantalla `/gerencia/sedes/horarios`: el gerente elige la sede (la misma del selector del encabezado) y ve la semana de lunes a domingo. Cada día puede abrir (con hora de apertura y de cierre), estar cerrado o quedar sin horario cargado, que se marca con un aviso. Los cambios se guardan juntos con «Guardar cambios», con un pedido por día modificado (alta, modificación o baja en `/sedes/:idSede/horarios`), y se pueden deshacer por día o descartar.
- Validación con Zod de las horas de cada día que abre, compartida con las excepciones del calendario, que tenían la misma regla.
- Rutas de gerencia ordenadas y agrupadas como el panel: sedes (listado, horarios y calendario, ahora bajo `/gerencia/sedes`), socios y membresías, canchas y reportes. `/gerencia/calendario` redirige a `/gerencia/sedes/calendario`. Las rutas del directorio de usuarios y de gestión de canchas solo cambiaron de lugar en la lista.
- Panel del gerente: los accesos de «Administración» quedaron agrupados por área (Sedes, Socios y membresías, Canchas y Reportes) y se sumaron Horarios semanales y el directorio de usuarios.
- Pestañas para moverse entre las pantallas de cada área (`PestanasGerencia`): Sedes, Horarios y Calendario, e Ingresos y Ocupación en reportes, que además pasó a usar el mismo encabezado que el resto de gerencia.
- Pruebas con Vitest: carga de la semana, días sin horario, guardado de cada caso (alta, modificación y baja), validaciones, deshacer y descartar, falla parcial, cambio de sede con cambios sin guardar y error de carga; accesos agrupados del panel, ítem activo del menú y redirección del calendario.

Verificación: 22 archivos y 172 pruebas aprobadas (12 nuevas); typecheck, lint y build aprobados; cada commit compila y pasa sus pruebas. Recorrí las pantallas en el navegador con la API simulada, en escritorio, tablet y celular.

**Decisión**
- Guardo solo los días que cambiaron, en paralelo: cada pedido hace una o dos consultas en el backend y no hace falta una transacción. Si un día falla, los demás quedan guardados y ese día conserva lo editado con el mensaje del backend.
- Con cambios sin guardar no se puede elegir otra sede en la pantalla; si cambia desde el encabezado, se descartan y se avisa.
- Al pasar un día a «Abre», se propone el horario de otro día que abre, para no cargarlo de cero.
- Después de guardar se borran del store los horarios operativos en caché de esa sede, para que canchas y clases los vuelvan a pedir.
- Las pestañas usan nombres cortos para que entren en el celular; el título de cada pantalla da el detalle.

**Problema o bloqueo**
- En `dev`, la prueba de acceso por rol al calendario fallaba: la ruta de inicio de la recepcionista (`/aforo`, según `rutaPorRol`) ahora es solo para el gerente, así que el guard entra en una redirección infinita cuando la recepcionista abre una ruta sin permiso. Cambié la prueba para que verifique que ningún otro rol entre a gerencia, sin depender de adónde lo manda el guard. No toqué la ruta de inicio de cada rol.
- En tablet la tabla de la semana no entraba al lado del menú; las filas pasan a formato de tarjeta hasta las pantallas anchas.
- Quedó pendiente el recorrido con la cuenta de gerente contra el backend.

**Commits**
- `8403754` refactor(gerencia): agrupar rutas y accesos de sedes y reportes
- `9d770bc` feat(gerencia): agregar horarios semanales de cada sede
- `e98f872` test(gerencia): agregar pruebas de horarios semanales
- `2acfa97` docs(log): registrar horarios semanales y orden de rutas de gerencia

---
