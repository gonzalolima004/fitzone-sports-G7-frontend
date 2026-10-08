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
#### Joaquín Ribarola | Rol: Desarrollador Frontend

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
#### Joaquín Ribarola | Rol: Desarrollador Frontend

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
#### Joaquín Ribarola | Rol: Desarrollador Frontend

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
  - Seguimiento de la planificación frontend para los seis integrantes, organizada en Trello con estimaciones en horas y subtareas.
  - Revisión inicial de los siete PR abiertos y de su destino a dev.
  - Identificación de cambios compartidos entre los PR de usuarios y entre los de clases, para ordenar su revisión e integración.
  - Revisión de los bloqueos de la prueba de reportes y de los avisos de dependencias detectados por npm audit.
- **Decisiones:**
  - Priorizar la corrección y revisión del login antes de integrar los cambios de registro y perfil.
  - Integrar los PR de forma gradual y volver a revisar las ramas que modifican archivos comunes después de cada merge.
  - Mantener la actualización de dependencias separada de la tarea de reportes.
  - Coordinar los datos de prueba antes de modificar la base compartida.
- **Dificultades:**
  - El PR #5 guarda el token con una clave y lo busca con otra en el cliente HTTP; requiere corrección y comprobación de sesión.
  - El PR #4 presentó una comprobación fallida de GitGuardian en la revisión inicial; falta resolver o explicar su resultado.
  - El PR #6 utiliza datos simulados de agenda; queda pendiente su integración con datos reales.
  - La revisión inicial no equivale a una aprobación ni a pruebas de ejecución de las ramas. No se realizaron nuevos merges en esta sesión.
- **Commits:** No corresponde para la revisión y coordinación. Los cambios de documentación se registrarán en su propio commit.

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

