#### 01/10/2026
#### Facundo Agüero | Rol: Team Leader

- **Actividades:**
  - Revisión del trabajo integrador, el backlog backend, el repositorio frontend y el maquetado para organizar el comienzo del desarrollo en Vue.
  - Planificación de dos semanas de trabajo y creación del backlog frontend en PDF.
  - Organización y asignación en Trello de 21 tareas de frontend y 2 tareas de coordinación, con descripción, estimación en horas y subtareas.
  - Distribución de responsabilidades: Gonzalo Lima, base compartida y pagos (16 horas); Matías Sillen, usuarios y membresías (18 horas); Angelina Viale, QR, recepción y aforo (17 horas); Joaquín Ribarola, clases y lista de espera (17 horas); Marcos Caravallo, canchas y reservas (18 horas); Facundo Agüero, reportes (11 horas) y coordinación TL (7 horas).
  - Identificación de dependencias entre módulos y preparación de las consultas y del resumen de avance para presentar al profesor.
- **Decisiones:**
  - Mantener el formato de tarjetas utilizado por el equipo: tareas concretas, checklist de subtareas y estimaciones en horas.
  - Repartir la carga considerando también el tiempo de coordinación del TL y organizar la revisión entre compañeros.
  - Priorizar la base común y la sesión para facilitar la integración de los demás módulos.
  - Proponer ramas por tarea con PR hacia dev y reservar main para la versión estable.
- **Dificultades:**
  - Las estimaciones son iniciales y deben ajustarse según la disponibilidad y el aprendizaje de Vue de cada integrante.
  - Se detectaron dependencias del backend pendientes de verificar, especialmente validación de ingreso, permisos y notificaciones.
  - La tarea previa del diagrama relacional, compartida por Gonzalo y Joaquín, no está incluida en las 104 horas estimadas para frontend y coordinación.
- **Commits:** No corresponde. La planificación se registró en Trello y en el documento de backlog frontend.

----

#### 08/10/2026
#### Facundo Agüero | Rol: Desarrollador Frontend

- **Actividades:**
  - Desarrollo inicial de la pantalla de reporte de ingresos, con filtros de fechas, sede y concepto.
  - Validación del rango de fechas y reutilización del store de sedes del equipo.
  - Creación del servicio para consultar GET /reportes/ingresos y mostrar total, detalle por sede y respuesta sin resultados.
  - Comprobación de errores de conexión y recuperación de la consulta al reiniciar el backend local.
  - Ejecución satisfactoria de typecheck, lint y build.
- **Decisiones:**
  - Trabajar en feature/e1-tarea-4-reporte-ingresos, manteniendo el filtro de sede del reporte separado de la selección del encabezado.
  - Reutilizar el cliente HTTP compartido y omitir los filtros opcionales cuando se seleccionan todas las sedes o conceptos.
- **Dificultades:**
  - Faltaba el archivo .env del frontend; se configuró la URL del backend y se verificó la carga de sedes.
  - Se corrigieron errores de sintaxis y la ausencia de la función de formato de moneda durante el aprendizaje de Vue.
  - Las tablas pago y pago_estado consultadas aparecen vacías. Queda pendiente comprobar filas, filtros e importes con pagos de prueba acordados por el equipo.
- **Commits:**
  - `feat(reportes): agregar filtros de fechas y validar rango`
  - `feat(reportes): agregar filtros de sede y concepto`
  - `feat(reportes): consultar ingresos y mostrar resultados`

----

#### 08/10/2026
#### Facundo Agüero | Rol: Team Leader

- **Actividades:**
  - Revisión e integración en dev de los PR de usuarios, clases y reporte de ingresos.
  - Actualización del repositorio local y comprobación del código integrado.
  - Prueba de carga de clases por sede, pantalla sin resultados y recuperación ante errores de conexión.
  - Revisión de npm audit y del check GitGuardian del PR de credencial QR.
  - Creación y asignación de cinco tarjetas de corrección en Trello, con estimaciones y subtareas:
    - Gonzalo Lima: configuración de TypeScript (0,5 horas) y actualización de dependencias (1,5 horas).
    - Matías Sillen: token y cierre de sesión (2 horas).
    - Joaquín Ribarola: agenda y estado de reservas de clases (5 horas).
    - Angelina Viale: revisión de alerta GitGuardian del QR (2 horas).

- **Decisiones:**
  - Distribuir las correcciones entre los responsables de los módulos.
  - Realizar los arreglos mediante ramas y PR hacia dev.
  - Mantener pendiente el merge del PR #4 hasta resolver o justificar los hallazgos de GitGuardian y verificar la credencial QR.
  - Repetir las verificaciones después de integrar cambios, porque la ausencia de conflictos de Git no garantiza que la aplicación funcione.
  - Conservar en stash las correcciones locales de integración hasta revisar si siguen siendo necesarias.

- **Dificultades:**
  - ESLint pasó en el dev actualizado, pero el build falló por propiedades duplicadas en tsconfig.app.json.
  - El store guarda token y usuario con claves diferentes de las utilizadas por el cliente HTTP.
  - La agenda conserva datos simulados; el selector de fecha no filtra las clases y el estado de reservas se mantiene solo en memoria.
  - npm audit reportó tres paquetes afectados por dos avisos de severidad alta.
  - GitGuardian continúa reportando dos posibles secretos en el PR #4; queda pendiente determinar si son credenciales reales o falsos positivos.
  - Las correcciones quedaron organizadas y asignadas, pero todavía no están resueltas.

- **Referencias:**
  - [Configuración de TypeScript](https://trello.com/c/uhzPNA93)
  - [Token y cierre de sesión](https://trello.com/c/vOFfK1Cs)
  - [Agenda y reservas de clases](https://trello.com/c/A6FQAuR8)
  - [Actualización de dependencias](https://trello.com/c/rxq6hcEG)
  - [Alerta GitGuardian del QR](https://trello.com/c/LyyrNbDx)

----

#### 14/10/2026
#### Facundo Agüero | Rol: Desarrollador Frontend

- **Tarea:** E1 Tarea 5 — Pantalla de ocupación y reservas por sede.
- **Actividades:**
  - Implementación de `/reportes/ocupacion`, conectada a `GET /reportes/ocupacion` mediante el cliente HTTP compartido.
  - Incorporación de filtros de fechas y sede, consulta consolidada, totales y detalle de asistencias, reservas de canchas y clases.
  - Manejo de carga, resultados vacíos, errores y reintentos; prevención de envíos simultáneos y validación de fechas.
  - Incorporación de pruebas de pantalla con respuestas simuladas.
- **Decisiones:**
  - Mantener el filtro de sede del reporte independiente del selector general.
  - Mostrar cantidades históricas del período, sin presentarlas como aforo instantáneo.
  - Publicar la entrega en `feature/e1-tarea-5-ocupacion` para revisión hacia `dev`.
- **Dificultades y resolución:**
  - Se eliminaron las propiedades `target` y `lib` duplicadas que impedían compilar.
  - Se sincronizó `package-lock.json` con las dependencias ya declaradas porque `npm ci` fallaba.
  - Se detectó una consulta incompleta en el backend; su corrección se entregó en una rama separada.
- **Verificación:** Build y lint aprobados; 5 pruebas aprobadas. Pendiente aceptación visual y prueba con una cuenta del entorno compartido.
- **Commits:** `feat(reportes): consultar ocupacion y reservas por sede`

----

#### 14/10/2026
#### Facundo Agüero | Rol: Desarrollador Frontend

- **Tarea:** E1 Tarea 6 — Integración del panel de gerencia.
- **Actividades:**
  - Integración de ingresos y ocupación en un panel con navegación por rutas y enlaces directos.
  - Accesos a reportes desde el inicio para gerente/admin y mantenimiento del menú activo en rutas hijas.
  - Adaptación del formulario de ingresos a distintos anchos, conservando filtros y formato de importes.
  - Pruebas de navegación y regresión del reporte de ingresos.
- **Decisiones:**
  - Conservar `/reportes` para ingresos y `/reportes/ocupacion` para actividad.
  - Publicar `feature/e1-tarea-6-panel-gerencia` con dependencia de `feature/e1-tarea-5-ocupacion`.
- **Dificultades:** La aceptación integrada requiere la corrección del backend y una sesión real; no se da por realizada con pruebas simuladas.
- **Verificación:** Build y lint aprobados; 8 pruebas aprobadas incluyendo tarea 5.
- **Commits:** `feat(reportes): integrar panel de gerencia y navegacion`

----

#### 14/10/2026
#### Facundo Agüero | Rol: Team Leader

- **Actividades:** Revisión del tablero y dependencias; publicación y normalización de las cuatro ramas propias a `feature/`; actualización de bitácoras dev/TL; resolución de conflictos frontend #16, #17, #18 y #20 conservando los cambios de sus autores; preparación del [traspaso](./cierre-tl-2026-10-14.md).
- **Integración propia:** A solicitud de Facundo, creación y merge hacia dev de frontend [#21](https://github.com/gonzalolima004/fitzone-sports-G7-frontend/pull/21), [#22](https://github.com/gonzalolima004/fitzone-sports-G7-frontend/pull/22) y backend [#56](https://github.com/gonzalolima004/fitzone-sports-G7-backend/pull/56). Se resolvieron conflictos en rutas y bitácoras conservando los registros completos y las pantallas de pagos. El PR de esta rama entrega la documentación de cierre.
- **Decisiones:** Preservar el historial mediante merges y conservar ocupación como ruta hija única del panel. La solicitud de crear y fusionar los PR reemplazó el acuerdo previo de apertura manual. Las integraciones previas de #16/#17/#18/#20 fueron externas a esta asistencia.
- **Dificultades y resolución:** Regeneración local de Prisma Client por el esquema de clases actualizado; conflicto de entradas de log; ruta de ocupación duplicada al incorporar dev. Se conservaron las entradas de todos los autores y se reemplazó la plantilla vacía de TL.
- **Verificación final de código:** Frontend build/lint y 11 pruebas aprobados; backend build/typecheck y 9 pruebas aprobados más verificación SQL con PGlite. No se modificó la base compartida ni se acredita aceptación visual o sesión real con tests simulados.
- **Trello:** Tareas frontend 5 y 6 documentadas y finalizadas como desarrollo integrado; backend ocupación actualizado conservando Finalizado. TL tarea 2 mantiene pendientes de revisión entre compañeros y aceptación integrada.
- **Commits de resolución:** `f7e9073`, `9f0197f`, `b1afc69`, `714e0e7`, `e44c72e`; integraciones propias `c354c59`, `1a3c1e1`, `0f0f93a`.
- **Pendientes:** Revisión humana, aceptación visual y con datos reales, contrato de checkout de membresías, sorteo y acuerdos de la reunión del 14/10 a las 15:00; nuevo TL asume el 15/10.

----

#### Facundo Agüero | Rol: Desarrollador Frontend

- **Tarea:** Panel de Gerente, CRUD Sedes/Membresías y Sede Dinámica (parte frontend).
- **Actividades:**
  - **Sede dinámica en el registro:** componente común `SelectorSede` conectado al store de sedes (`GET /sedes`), usado en `RegistroView` y en `CompletarPerfilView` (registro con Google). Muestra "Cargando sedes...", un error con reintento y un aviso cuando no hay sedes, y deshabilita el selector y el botón de registro mientras no haya sedes para elegir. El reemplazo de la sede fija por la lista de la API lo había incorporado Matías; esta tarea completó los estados de carga y error y unificó ambos flujos.
  - **CRUD de sedes:** pantalla `/gerencia/sedes` con listado de sedes activas (ciudad y aforo), resumen, skeleton, estados vacío y de error; alta y edición en `SedeFormModal` validado con Zod según `CreateSedeDto`; alta de ciudad en línea; baja lógica con confirmación previa y toast posterior.
  - **CRUD de planes:** pantalla `/gerencia/planes` con listado ordenado por duración y precio en pesos; alta y edición en `PlanFormModal` (Zod según `CrearPlanDto`, duración entera, precio con hasta 2 decimales y atajos Mensual/Trimestral/Anual); eliminación con confirmación.
  - **Dashboard del gerente:** `/gerencia` pasa a ser la portada del rol gerente (`rutaPorRol` y menú lateral), con cuatro indicadores calculados con endpoints existentes (sedes activas, planes, ingresos del mes y reservas de hoy) y accesos a sedes, planes, canchas y reportes. La pantalla de reportes pasa a titularse "Reportes de gerencia" con enlace para volver al panel.
  - Pruebas con Vitest: selector de sede, CRUD de sedes y planes (listado, validación, alta, edición, errores del servidor, baja), dashboard (indicadores, fechas consultadas, accesos y falla parcial) e ítem activo del menú lateral.
- **Decisiones:**
  - Agrupar en `src/modules/gerencia` (ruta indicada en el backlog) el dashboard y las pantallas de parametrización del Gerente Central, sin modificar módulos de otros responsables más allá del selector de sede del registro y de la navegación (`ruta-por-rol.ts` y `Sidebar.vue`).
  - Reutilizar `BaseModal`, `BaseInput`, `BaseButton`, `BaseSkeleton`, el toast y el store de sedes; seguir el patrón del equipo: modal antes de una acción destructiva y toast después.
  - Recargar el store global de sedes después de cada alta, edición o baja para que el registro y el selector del encabezado muestren los cambios sin recargar la página.
  - La sede del registro arranca vacía y se exige elegirla: preseleccionar la primera podía asignar socios a una sede equivocada.
  - No crear endpoints nuevos para el dashboard: cada indicador usa una consulta existente y carga por separado, de modo que si una falla las demás se muestran.
- **Dificultades y resolución:**
  - Eliminar un plan con membresías asociadas devuelve 500 en el backend (clave foránea). La pantalla explica el caso y sugiere editar el plan; el 409 queda pendiente para el responsable de M1.
  - En pantallas angostas las tablas obligaban a desplazarse en horizontal; se reubicó la información secundaria debajo del nombre y los botones quedan solo con ícono.
  - Al integrar con los últimos cambios de `dev`, el menú lateral ya tenía "Directorio de Usuarios" y "Gestión de Canchas", que también viven bajo `/gerencia`; con "Panel de gerencia" apuntando a `/gerencia` se resaltaban dos ítems a la vez. Se ajustó `Sidebar.vue` para marcar solo el ítem de ruta más específica.
- **Verificación:** 12 archivos y 54 pruebas aprobadas (26 nuevas); typecheck, lint y build aprobados; cada commit compila y pasa sus pruebas. Recorrido visual en navegador con API simulada (escritorio y móvil). Pendiente: recorrido con la cuenta compartida de gerente contra el backend con los guards de escritura.
- **Commits:**
  - `feat(registro): selector de sede dinamico`
  - `feat(gerencia): agregar CRUD de sedes`
  - `feat(gerencia): agregar CRUD de planes de membresia`
  - `feat(gerencia): agregar dashboard del gerente`

----

#### 27/10/2026
#### Facundo Agüero | Rol: Desarrollador Frontend

- **Tarea:** Correcciones de la revisión del panel de gerencia.
- **Actividades:**
  - Se quitaron de las pantallas de sedes, planes y del panel los códigos de requisitos y de actor que aparecían en títulos y ayudas; quedan solo los textos descriptivos.
  - Se ajustó el formato de mis entradas de esta bitácora: commits sin hash, sin enlace a Trello y sin códigos de tarea, como en el resto del equipo.
- **Decisiones:** Ninguna.
- **Dificultades:** Ninguna.
- **Verificación:** 12 archivos y 54 pruebas aprobadas; typecheck, lint y build aprobados.
- **Commits:**
  - `fix(gerencia): quitar codigos de requisitos de las pantallas`
  - `docs(log): corregir formato y registrar correcciones`

----

#### 27/10/2026
#### Facundo Agüero | Rol: Desarrollador Frontend

- **Tarea:** CRUD de membresías de cada socio y ajuste de las pantallas de gerencia a la maqueta (parte frontend).
- **Actividades:**
  - Pantalla `/gerencia/membresias` con una fila por socio, como en la maqueta del directorio de usuarios: iniciales, nombre y email, DNI, sede, plan y vencimiento, y estado. Muestra la membresía activa más reciente o, si no tiene, la última que tuvo; los socios sin membresía también aparecen.
  - Tarjetas con la cantidad de socios en cada estado de la tabla `membresia_estado` y sin membresía; al tocarlas filtran el listado. Filtros por estado y por sede, y búsqueda por nombre, DNI o email sin distinguir tildes.
  - Acciones por socio: Asociar (sin membresía), Renovar (vencida), Reactivar (suspendida: vuelve a Activa con `PATCH /membresias/:id/estado`) y Gestionar.
  - Alta en `MembresiaAltaModal`, que también usan Asociar y Renovar con el socio y el plan ya elegidos: socio con buscador, plan con su precio, fecha de inicio y renovación automática, validados con Zod. Muestra el vencimiento que calcula el backend y avisa si el socio ya tiene una membresía activa, que pasa a Suspendida.
  - Edición en `MembresiaEdicionModal`: estado, vencimiento y renovación automática. Desde ahí se puede eliminar una membresía cargada por error, con confirmación; si tiene pagos, se muestra el motivo que devuelve el backend (409).
  - Sedes: buscador por nombre o ciudad y columna "Instalaciones" con las canchas de cada sede agrupadas por tipo (`GET /canchas`).
  - Panel del gerente según la maqueta del dashboard ejecutivo: indicadores de socios activos, facturación del mes, reservas de hoy y aforo simultáneo, y tabla "Rendimiento por sede" con socios activos, aforo actual y máximo, reservas y recaudación del mes. Se mantienen los accesos de administración.
  - Se quitaron las menciones al rol admin en los comentarios de los servicios de sedes y planes y en una prueba.
  - Pruebas con Vitest: listado por socio, resumen y filtros, acciones de cada fila, alta y validaciones, edición con cada endpoint, eliminación con 409 y cálculo del vencimiento; buscador e instalaciones de sedes; indicadores, tabla por sede y fallas parciales del panel.
- **Decisiones:**
  - Solo se usan endpoints existentes: los socios y su sede salen de `GET /usuarios` y se cruzan en el navegador con `GET /membresias`; el aforo de cada sede, de `GET /accesos/aforo/:id`; la facturación y las reservas, de los reportes de ingresos y ocupación.
  - Un socio cuenta como activo si su membresía está Activa y no venció (fecha de fin igual o posterior a hoy).
  - Los estados salen de `GET /membresias/estados` y no están escritos en el frontend.
  - De la maqueta quedaron afuera el porcentaje de ocupación de canchas y el estado de cada sede, porque ningún endpoint los calcula; en su lugar se muestran las reservas.
  - Cada dato del panel se carga por separado: si uno falla, ese indicador muestra "No disponible" o un guion y el resto se ve igual.
  - Las fechas llegan como `2026-10-01T00:00:00.000Z` y se muestran tomando solo la fecha, para que la zona horaria no las corra un día.
  - En celular las columnas secundarias se ocultan o pasan debajo del nombre, sin desplazamiento horizontal.
- **Dificultades:** Ninguna.
- **Verificación:** 13 archivos y 81 pruebas aprobadas (27 nuevas); typecheck, lint y build aprobados; cada commit compila y pasa sus pruebas. Recorrido visual en navegador con API simulada (escritorio, tablet y celular).
- **Commits:**
  - `fix(gerencia): quitar el rol admin de comentarios y pruebas`
  - `feat(gerencia): agregar CRUD de membresias de socios`
  - `feat(gerencia): agregar buscador e instalaciones en sedes`
  - `feat(gerencia): alinear el dashboard con la maqueta`
  - `docs(log): registrar CRUD de membresias y ajustes a la maqueta`

----

#### 10/11/2026
#### Facundo Agüero | Rol: Desarrollador Frontend

- **Tarea:** Calendario de feriados y excepciones de cada sede para el gerente (parte frontend).
- **Actividades:**
  - Pantalla `/gerencia/calendario`, con acceso desde el panel del gerente: grilla del mes de lunes a domingo con los feriados y fechas de toda la cadena y con los cierres u horarios especiales de la sede elegida. Al tocar un día se ve su detalle con las acciones, y debajo de la grilla, la lista de fechas del mes.
  - La sede del calendario es la del selector del encabezado (store de sedes): si cambia en cualquiera de los dos lugares, se recargan las excepciones.
  - Alta y edición de feriados en `FeriadoFormModal` (fecha, descripción, feriado y día hábil) y de excepciones en `ExcepcionSedeFormModal` (cierre de todo el día u horario especial con apertura y cierre, y motivo), validados con Zod según los DTO del backend. Las bajas usan `ConfirmarEliminacionModal` y toast; se reutilizan `BaseModal`, `BaseInput`, `BaseButton` y `BaseSkeleton`.
  - Servicio `calendario.service.ts` para `/calendario` y `/sedes/:id/calendario`, y tipos de las respuestas.
  - Pruebas con Vitest: carga del mes y marcas de la grilla, cambio de mes y de sede, altas, edición, bajas, validaciones, errores del servidor y acceso a la ruta solo con el rol gerente (guard del router).
- **Decisiones:**
  - Cada mes se carga con dos consultas en paralelo (fechas del calendario y excepciones de la sede), porque cada viaje al backend suma tiempo. Si llega tarde la respuesta de un mes o de una sede anteriores, se descarta.
  - Si se carga un feriado en una fecha que ya existe como día común (el backend la crea al cargar una excepción), se actualiza esa fecha en lugar de crear otra; si ya es un feriado, se pide editarlo.
  - Si al quitar un feriado alguna sede tiene una excepción ese día, el backend responde 409: la fecha queda como día común, las excepciones se mantienen y el toast lo informa.
  - Al editar una excepción, la fecha se envía solo si cambió, para ahorrar una consulta.
  - Después de cada cambio se borran del store los horarios operativos en caché de las fechas tocadas (de todas las sedes si es un feriado, de una sede si es una excepción), para que canchas y clases los vuelvan a pedir.
  - El acceso por rol se resuelve con la ruta hija de `/gerencia`, que ya exige el rol gerente; además, el backend responde 403 a cualquier otro rol.
- **Dificultades:**
  - Un feriado de toda la cadena no cambia por sí solo el horario operativo que consultan canchas y clases: `GET /sedes/:id/horario-operativo` tiene en cuenta las excepciones de cada sede y el horario semanal. El formulario del feriado lo aclara y sugiere cargar una excepción para cerrar la sede; cómo tratar los feriados en ese endpoint queda a definir con su responsable.
  - En tablet, el selector de sede quedaba cortado a la derecha de la barra del mes; ahora la barra pasa a dos líneas cuando no hay lugar.
- **Verificación:** 16 archivos y 110 pruebas aprobadas (18 nuevas); typecheck, lint y build aprobados; cada commit compila y pasa sus pruebas. Recorrido visual en navegador con API simulada (escritorio, tablet y celular). Pendiente: recorrido con la cuenta de gerente contra el backend.
- **Commits:**
  - `feat(gerencia): agregar vista de calendario con feriados y excepciones por sede`
  - `feat(gerencia): agregar formularios de feriados y excepciones de sede`
  - `test(gerencia): agregar pruebas de la vista de calendario`
  - `docs(log): registrar vista y formularios de calendario`

----

#### 12/11/2026
#### Facundo Agüero | Rol: Desarrollador Frontend

- **Tarea:** Horarios semanales de cada sede y orden de las rutas y accesos de gerencia, sedes y reportes (parte frontend).
- **Actividades:**
  - Pantalla `/gerencia/sedes/horarios`: el gerente elige la sede (la misma del selector del encabezado) y ve la semana de lunes a domingo. Cada día puede abrir (con hora de apertura y de cierre), estar cerrado o quedar sin horario cargado, que se marca con un aviso. Los cambios se guardan juntos con "Guardar cambios", con un pedido por día modificado (alta, modificación o baja de `/sedes/:idSede/horarios`), y se pueden deshacer por día o descartar.
  - Validación con Zod de las horas de cada día que abre, compartida con las excepciones del calendario, que tenían la misma regla.
  - Rutas de gerencia ordenadas y agrupadas como el panel: sedes (listado, horarios y calendario, ahora bajo `/gerencia/sedes`), socios y membresías, canchas y reportes. `/gerencia/calendario` redirige a `/gerencia/sedes/calendario`. Las rutas del directorio de usuarios y de gestión de canchas solo cambiaron de lugar en la lista.
  - Panel del gerente: los accesos de "Administración" quedan agrupados por área (Sedes, Socios y membresías, Canchas y Reportes) y se suman Horarios semanales y el directorio de usuarios.
  - Pestañas para moverse entre las pantallas de cada área (`PestanasGerencia`): Sedes, Horarios y Calendario, e Ingresos y Ocupación en reportes, que además pasa a usar el mismo encabezado que el resto de gerencia.
  - Pruebas con Vitest: carga de la semana, días sin horario, guardado de cada caso (alta, modificación y baja), validaciones, deshacer y descartar, falla parcial, cambio de sede con cambios sin guardar y error de carga; accesos agrupados del panel, ítem activo del menú y redirección del calendario.
- **Decisiones:**
  - Guardar solo los días que cambiaron, en paralelo: cada pedido hace una o dos consultas en el backend y no hace falta una transacción. Si un día falla, los demás quedan guardados y ese día conserva lo editado con el mensaje del backend.
  - Con cambios sin guardar no se puede elegir otra sede en la pantalla; si cambia desde el encabezado, se descartan y se avisa.
  - Al pasar un día a "Abre", se propone el horario de otro día que abre, para no cargarlo de cero.
  - Después de guardar se borran del store los horarios operativos en caché de esa sede, para que canchas y clases los vuelvan a pedir.
  - Las pestañas usan nombres cortos para que entren en el celular; el título de cada pantalla da el detalle.
- **Dificultades:**
  - En `dev`, la prueba de acceso por rol al calendario fallaba: la ruta de inicio de la recepcionista (`/aforo`, según `rutaPorRol`) ahora es solo para el gerente, así que el guard entra en una redirección infinita cuando la recepcionista abre una ruta sin permiso. La prueba ahora verifica que ningún otro rol entre a gerencia, sin depender de adónde lo manda el guard. La ruta de inicio de cada rol no se tocó.
  - En tablet la tabla de la semana no entraba al lado del menú; las filas pasan a formato de tarjeta hasta pantallas anchas.
- **Verificación:** 22 archivos y 172 pruebas aprobadas (12 nuevas); typecheck, lint y build aprobados; cada commit compila y pasa sus pruebas. Recorrido visual en navegador con API simulada (escritorio, tablet y celular). Pendiente: recorrido con la cuenta de gerente contra el backend.
- **Commits:**
  - `refactor(gerencia): agrupar rutas y accesos de sedes y reportes`
  - `feat(gerencia): agregar horarios semanales de cada sede`
  - `test(gerencia): agregar pruebas de horarios semanales`
  - `docs(log): registrar horarios semanales y orden de rutas de gerencia`

----