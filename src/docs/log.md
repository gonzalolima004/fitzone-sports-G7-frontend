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

#### XX/XX/2026
#### Facundo Agüero | Rol: Desarrollador Frontend

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
#### Facundo Agüero | Rol: Desarrollador Frontend

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
#### Facundo Agüero | Rol: Desarrollador Frontend

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

