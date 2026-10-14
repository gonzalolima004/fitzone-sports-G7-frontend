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

#### XX/XX/2026
#### Marcos Caravallo | Rol: Desarrollador Frontend

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
#### Marcos Caravallo | Rol: Desarrollador Frontend

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

#### XX/XX/2026
#### Facundo Agüero | Rol: Team Leader

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
#### Facundo Agüero | Rol: Team Leader

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

