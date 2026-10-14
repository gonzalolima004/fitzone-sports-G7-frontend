## Unidad I: Arquitectura

### Matías Sillen Ríos - Frontend Developer
- **Actividades:** Definición de la estructura de directorios del Frontend (Vue.js) aplicando un enfoque "Feature-Driven", creacion del archivo LOG.md y estandarización del flujo de trabajo colaborativo en Git (Git Flow simplificado y reglas para Pull Requests).
- **Decisiones:** Se decidió alinear los nombres de los módulos del Frontend (ej. `M1-usuarios`) de forma idéntica al Backend (NestJS) para mantener un Lenguaje Ubicuo. Además, se estableció mantener la lógica transversal (interceptores, utilidades, composables) estrictamente dentro de `src/common`.
- **Commits vinculados:** `bf9c804` (Organice la estructura del pryecto por modulos, tal como se solicitó en la catedra).

----

#### 02/10/2026
#### Gonzalo Lima | Rol: Desarrollador Frontend

- **Actividades:**
  - Configuración e integración inicial de Vue Router con definición de rutas para cada módulo y manejo de ruta no encontrada (404).
  - Creación del cliente HTTP con Axios, interceptores para adjuntar token Bearer y redirección automática al login en respuestas 401.
  - Configuración del pipeline de calidad: ESLint Flat Config para Vue 3 + TypeScript, Prettier, Vitest y scripts de validación.
- **Decisiones:**
  - Integrar ESLint Flat Config y excluir archivos .md para evitar formateos no deseados en la documentación compartida.
- **Dificultades:** Ninguna.
- **Commits:**
  - `feat(router): vue router y rutas iniciales`
  - `feat(api): axios para conexión http`
  - `feat(api): comprobación de conexión al backend e instalación de pinia`
  - `feat: configuración de prettier y formateador + fixes de ambos`

----

#### 02/10/2026
#### Gonzalo Lima | Rol: Desarrollador Frontend

- **Actividades:**
  - Creación del layout principal  dividiendo en header, sidebar y área de contenido.
  - Integración de Pinia y consumo del endpoint GET /sedes para la selección de sede.
  - Filtrado y presentación de rutas de navegación dinámicas según el rol del usuario obtenido desde la sesión.
- **Decisiones:**
  - Persistir el ID de sede seleccionada en localStorage para preservar el contexto de navegación ante recargas de página.
  - El rol proviene exclusivamente de la autenticación del backend.
- **Dificultades:** Ninguna.
- **Commits:**
  - `feat: layout principal y sidebar`
  - `feat: navegación según rol y selector de sede`

----

#### 02/10/2026
#### Gonzalo Lima | Rol: Desarrollador Frontend

- **Actividades:**
  - Creación de componentes compartidos atómicos reutilizables.
  - Reemplazo de alertas estáticas por notificaciones Toast mediante la integración de vue3-toastify.
  - Documentación  en src/common/components/README.md detallando como se usan estos componentes.
- **Decisiones:**
  - Adoptar vue3-toastify para ofrecer una experiencia idéntica a React-Toastify en Vue 3 con tema claro, evitando alertas fijas intrusivas y centralizando el feedback al usuario en 3 segundos.
- **Dificultades:** Ninguna.
- **Commits:**
  - `feat(components): base para botones e inputs compartidos`
  - `feat(components): base para modal compartido e implementación de vue3 toastify`
  - `feat(components): aplicación de los estilos del maquetado + configs varias`

----

#### XX/XX/2026
#### Gonzalo Lima | Rol: Desarrollador Frontend

- **Actividades:**
  - 
  - 
  - 
- **Decisiones:**
  - 
  - 
- **Dificultades:** Ninguna.
- **Commits:**
  - ``
  - ``
  - ``

----

#### XX/XX/2026
#### Gonzalo Lima | Rol: Desarrollador Frontend

- **Actividades:**
  - 
  - 
  - 
- **Decisiones:**
  - 
  - 
- **Dificultades:** Ninguna.
- **Commits:**
  - ``
  - ``
  - ``

----

#### XX/XX/2026
#### Gonzalo Lima | Rol: Desarrollador Frontend

- **Actividades:**
  - 
  - 
  - 
- **Decisiones:**
  - 
  - 
- **Dificultades:** Ninguna.
- **Commits:**
  - ``
  - ``
  - ``

----

#### 03/10/2026 - 05/10/2026
#### Matías Sillen | Rol: Desarrollador Frontend

* **Actividades:**
* Maquetado e implementación de la pantalla de inicio de sesión (`LoginView.vue`) con validaciones visuales.
* Configuración del estado global de la sesión utilizando Pinia y protección de rutas privadas mediante Navigation Guards en Vue Router.
* Implementación de la conexión HTTP configurando Axios con interceptores para adjuntar automáticamente el token JWT.


* **Decisiones:**
* Mantener la sintaxis de Composition API (Setup Store) en Pinia para conservar la lógica previa de roles y persistencia en `localStorage`.
* Formatear e interceptar los errores de validación devueltos por NestJS (en formato array) para mostrarlos como cadenas de texto limpias en la interfaz del usuario.
* Redirigir al usuario autenticado directamente a la ruta raíz (`home`) tras un login exitoso, adaptándose a la estructura del `MainLayout` existente.


* **Dificultades:**
* Problemas iniciales de conexión (errores 404) debido a variables de entorno no configuradas (`VITE_API_URL`) y a que la ruta de login no existía inicialmente en el servidor.
* Advertencias del compilador de TypeScript por el uso de promesas nativas y Vite, solucionadas actualizando el `tsconfig.json` a `ES2022`.


* **Commits:**
* `feat(usuarios): crear servicio http para inicio de sesión`
* `feat(auth): integrar login con api manteniendo estructura de pinia setup`
* `feat(usuarios): maquetar pantalla de inicio de sesión con validaciones`
* `feat(router): proteger rutas del MainLayout con guard de autenticación`
* `fix(login): corregir redireccion a ruta home tras inicio de sesion`
* `fix(login): formatear correctamente los mensajes de error de validacion del array de nestjs`

----

#### 05/10/2026
#### Matías Sillen | Rol: Desarrollador Frontend

* **Actividades:**
* Maquetado e implementación de las pantallas de `RegistroView.vue` y `PerfilView.vue` siguiendo la identidad visual (azul noche y coral).
* Integración del servicio de API (Axios) para registrar nuevos usuarios, subir fotos de perfil en formato `FormData` y editar datos personales.
* Refactorización de las vistas para utilizar los componentes UI compartidos del equipo (`BaseInput`, `BaseButton`, `BaseModal`) y notificaciones mediante `Toastify`.
* Configuración del Vue Router para exponer la ruta pública de registro y la ruta privada de edición de perfil.


* **Decisiones:**
* Asignar automáticamente el rol `[1]` (Socio) o `[]` (Cliente Externo) según la selección visual del usuario en el formulario.
* Enviar el valor `"pendiente"` de forma temporal en el campo `foto_url` al crear el usuario para cumplir con las exigencias de validación del backend, para luego reemplazarlo al subir la imagen con el ID generado.


* **Dificultades:**
* El guard de navegación de Vue Router generaba un bloqueo de renderizado al intentar cargar el registro público dentro del `MainLayout` (que exige autenticación); se resolvió extrayendo la ruta `/registro` al nivel raíz.
* El DTO del backend rechazaba el registro por tipado estricto, obligando a mapear el `id_sede` como `string` y dividir el nombre completo en el frontend antes de enviar la petición.


* **Commits:**
* `feat(usuarios): crear servicio para registro, edicion y carga de fotos de perfil`
* `feat(usuarios): maquetar e implementar pantalla de registro aplicando identidad visual`
* `feat(usuarios): crear pantalla de edicion de perfil de usuario`
* `feat(router): registrar rutas publica de registro y privada de perfil`
* `fix(router): extraer ruta de registro del mainlayout para evitar bloqueo del guard y errores de renderizado`
* `fix(usuarios): agregar foto_url temporal y tipar id_sede como string para cumplir con validacion del DTO`
* `refactor(usuarios): migrar PerfilView a componentes BaseInput, BaseButton y Toastify`
* `refactor(usuarios): aplicar shared components e integrar toastify en RegistroView`

----

#### 07/10/2026
#### Matías Sillen | Rol: Desarrollador Frontend

* **Actividades:**
* Creación de la rama `refactor/login-ui-tailwind` para aislar los cambios de la interfaz.
* Refactorización completa de la vista de inicio de sesión (`LoginView.vue`), eliminando el bloque de estilos CSS puro (`scoped`) y migrando la estructura a Tailwind CSS.
* Implementación de los componentes reutilizables de la UI base (`BaseInput` y `BaseButton`) en el formulario de login para estandarizar el diseño con el resto de la plataforma.
* Sustitución de los mensajes de error en línea por el sistema de notificaciones globales utilizando `vue3-toastify`.


* **Decisiones:**
* Aislar esta refactorización en una rama nueva para mantener un historial de control de versiones limpio y estructurado, separando el desarrollo funcional original de las mejoras visuales.
* Aplicar directamente los colores hexadecimales de la identidad visual oficial (`#202759` y `#F96167`) mediante clases utilitarias de Tailwind para asegurar la consistencia total con las pantallas de Registro y Perfil.


* **Dificultades:**
* Ninguna significativa. La adaptación de la estructura HTML que dependía de clases locales al uso de los nuevos componentes atómicos y utilidades de Tailwind se realizó de forma fluida.


* **Commits:**
* `refactor(login): migrar UI a tailwind, implementar BaseInput/BaseButton e integrar toastify`

---
#### XX/XX/2026
#### Matías Sillen | Rol: Desarrollador Frontend

- **Actividades:**
  - 
  - 
  - 
- **Decisiones:**
  - 
  - 
- **Dificultades:** Ninguna.
- **Commits:**
  - ``
  - ``
  - ``

----

#### 09/10/2026
#### Angelina Viale | Rol: Desarrollador Frontend

- **Actividades:**
  - Desarrollo de la vista de credencial del socio para la generación y visualización dinámica del código QR de acceso.
  - Creación del servicio accesos.service.ts para consumir el endpoint de generación de codigo qr, adjuntando la sesión activa del usuario.
  - Implementación del composable useQr.ts para gestionar la lógica de cuenta regresiva, expiración del token y renovación automática de la credencial.
  - Manejo de estados de carga, fallos de red y expiración de sesión para evitar mostrar códigos no válidos o desactualizados 
- **Decisiones:**
  -Centralizar la lógica del temporizador y temporización de renovación dentro de un composable (useQr) para limpiar correctamente los intervalos al desmontar el componente y evitar fuga de memoria o llamadas innecesarias a la API. 
  - 
- **Dificultades:** Ninguna.
- **Commits:**
  - `feat(M2): interfases de qrResponse y appiError`
  - `feat(M2): crear componente de QR`
  - `feat(M2): implementar servicio y composable para QR`
  - `feat(M2): bitacora y arreglos`

----

#### XX/XX/2026
#### Angelina Viale | Rol: Desarrollador Frontend

- **Actividades:**
  - 
  - 
  - 
- **Decisiones:**
  - 
  - 
- **Dificultades:** Ninguna.
- **Commits:**
  - ``
  - ``
  - ``

----

#### XX/XX/2026
#### Angelina Viale | Rol: Desarrollador Frontend

- **Actividades:**
  - 
  - 
  - 
- **Decisiones:**
  - 
  - 
- **Dificultades:** Ninguna.
- **Commits:**
  - ``
  - ``
  - ``

----

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

01/10/2026
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
  - `defd2e2` — feat(reportes): agregar filtros de fechas y validar rango.
  - `1db2b64` — feat(reportes): agregar filtros de sede y concepto.
  - `6fd52a7` — feat(reportes): consultar ingresos y mostrar resultados.

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



---

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
- **Commits:** `58042e7` — feat(reportes): consultar ocupacion y reservas por sede.
- **Referencia:** https://trello.com/c/mmqjjDHt

---

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
- **Commits:** `72c3ee2` — feat(reportes): integrar panel de gerencia y navegacion.
- **Referencia:** https://trello.com/c/K0iI9k4e

---

#### 14/10/2026
#### Facundo Agüero | Rol: Team Leader

- **Actividades:**
  - Revisión del tablero de Trello, tareas propias y dependencias entre frontend y backend.
  - Preparación y publicación de las ramas de ocupación, panel de gerencia, corrección SQL y documentación de traspaso.
  - Normalización de las cuatro ramas propias a `feature/`, verificando el destino remoto antes de retirar los nombres anteriores.
  - Actualización de las bitácoras con tareas de desarrollo, decisiones, dificultades, verificaciones y commits.
  - Revisión de los PR abiertos de ambos repositorios y resolución de conflictos de los PR frontend #16, #17, #18 y #20, conservando el trabajo de sus autores.
  - Comprobación de la dependencia #16 → #17 → #18 para propagar las resoluciones en orden.
  - Unificación en #20 del servicio de pagos completo y del contrato vigente de lista de espera, con pruebas de regresión.
  - Comprobación de #18 y #20 contra `dev` en `5294b0d` después de que #16 y #17 se integraran en GitHub durante el trabajo; Git confirmó combinaciones sin conflictos.
  - Preparación del documento [Cierre y traspaso](./cierre-tl-2026-10-14.md) para la reunión del 14/10 a las 15:00 y el inicio del nuevo TL el 15/10.
- **Decisiones:**
  - Actualizar las ramas de los PR mediante merges, sin reescribir historial ni fusionar los PR en `dev`.
  - Mantener la compatibilidad de las claves de sesión existentes en ambos lados del conflicto.
  - Corregir configuración duplicada y sincronizar el lockfile para poder verificar las ramas.
  - Mantener la apertura de los PR propios a cargo de Facundo, según lo acordado.
- **Dificultades:**
  - Los PR #16/#17/#18 presentaban diferencias en los archivos compartidos de sesión; sus funciones coincidían y se conservaron.
  - La documentación previa mezclaba ramas publicadas con tareas todavía no aceptadas; se distinguen implementación, revisión e integración.
- **Verificación:** Consultar el documento de cierre para los commits de resolución y los resultados de cada rama. El estado sin conflictos de Git no reemplaza la aceptación funcional con una cuenta y datos reales.
- **Commits de resolución:** `f7e9073` (#16), `9f0197f` (#17), `b1afc69` (#18), `714e0e7` y `e44c72e` (#20).
- **Pendientes:** Revisión entre compañeros, aprobación/merge de los PR, aceptación visual e integrada y registro del sorteo y acuerdos de la reunión.
