### 24/08/2026
### Matías Sillen Ríos - Frontend Developer
- **Actividades:** Definición de la estructura de directorios del Frontend (Vue.js) aplicando un enfoque "Feature-Driven", creacion del archivo LOG.md y estandarización del flujo de trabajo colaborativo en Git (Git Flow simplificado y reglas para Pull Requests).
- **Decisiones:** Se decidió alinear los nombres de los módulos del Frontend (ej. `M1-usuarios`) de forma idéntica al Backend (NestJS) para mantener un Lenguaje Ubicuo. Además, se estableció mantener la lógica transversal (interceptores, utilidades, composables) estrictamente dentro de `src/common`.
- **Commits**
`6222a25` Organice la estructura del pryecto por modulos, tal como se solicitó en la catedra.

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


* **Commits**
`11332cf` feat(usuarios): crear servicio http para inicio de sesión
`e5a3c7e` feat(auth): integrar Pinia con onAuthStateChange de Supabase
`49cb956` feat(usuarios): maquetar pantalla de inicio de sesión con validaciones
`b5e5dae` feat(router): proteger rutas del MainLayout con guard de autenticación
`62db854` fix(login): corregir redireccion a ruta home tras inicio de sesion
`48ad7a3` fix(login): formatear correctamente los mensajes de error de validacion del array de nestjs

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


* **Commits**
`bf092e3` feat(usuarios): crear servicio para registro, edicion y carga de fotos de perfil
`fa4fb22` feat(usuarios): maquetar e implementar pantalla de registro aplicando identidad visual
`a4ccb7b` feat(usuarios): crear pantalla de edicion de perfil de usuario
`3fa7051` feat(router): registrar rutas publica de registro y privada de perfil
`2e708c9` fix(router): extraer ruta de registro del mainlayout para evitar bloqueo del guard y errores de renderizado
`a25f954` fix(usuarios): corregir field name del formData a foto para compatibilidad con multer
`f283586` refactor(usuarios): migrar PerfilView a componentes BaseInput, BaseButton y Toastify
`65bcfe2` refactor(usuarios): aplicar shared components e integrar toastify en RegistroView

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


* **Commits**
`28549f8` refactor(login): migrar UI a tailwind, implementar BaseInput/BaseButton e integrar toastify

----

#### 07/10/2026 - 13/10/2026
#### Matías Sillen | Rol: Desarrollador Frontend

- **Actividades:**
  - Refactorización completa de MembresiaView.vue para asegurar un uso estricto de Tailwind CSS, eliminando etiquetas <style scoped> y animaciones @keyframes.
  - Reemplazo de la animación custom por el componente <Transition> nativo de Vue combinado con utilidades de Tailwind para el efecto fade-in.
  - Corrección del paso de propiedades en PlanCard.vue hacia CheckoutModal.vue, emitiendo el objeto completo del plan para asegurar la visualización del precio correcto.
  - Inyección manual del token JWT desde Pinia (authStore) hacia el pagosService para resolver errores de autorización 401 en endpoints protegidos.
  - Modificación del layout principal (Layout.vue) ajustando el contenedor general a h-screen overflow-hidden para mantener la barra lateral fija y habilitar el scroll independiente del área de contenido.
- **Decisiones:**
  - Pasar el objeto completo del plan desde la tarjeta al modal (en lugar de emitir únicamente el ID) para hacer el componente más robusto frente a posibles cambios o filtrados de claves del lado del backend.
  - Mantener la responsabilidad del inicio de pago enviando el payload correcto, pero delegar el manejo del webhook y la confirmación final a la Épica 6 correspondiente al módulo de pagos.
- **Dificultades:**
  - Problemas de renderizado de precios debido a que el ID del plan llegaba como undefined, causando que el frontend siempre seleccionara el primer plan por defecto. Se resolvió enviando la entidad completa.
  - El componente de layout inicial generaba un scroll a nivel de página entera que arrastraba el menú lateral; requirió un reajuste de las clases flexbox y overflow de Tailwind.
- **Commits**
  - `0431f8d` feat(pagos): agregar servicio HTTP para iniciar preferencia de pago
  - `0719ae6` feat(membresias): mapear endpoints de planes y verificacion de estado
  - `bdc8264` feat(membresias): crear componente reutilizable PlanCard
  - `528d7b8` feat(pagos): maquetar modal de checkout seguro con integracion de metodos
  - `f8c60c9` refactor(ui): reemplazar svgs en duro por componentes de phosphor icons en PlanCard.vue
  - `3ed1710` feat(membresias): implementar pantalla de membresías integrando estados, mora y retorno de checkout
  - `4499b8a` fix(membresias): unificar id_membresia_plan en UI y adjuntar token JWT en servicio de pagos
  - `20c6983` fix(membresias): pasar objeto plan completo al modal para garantizar la visualización del precio correcto
  - `e195170` refactor(membresias): enviar objeto plan completo al modal, eliminar css custom y aplicar tailwind estricto
  - `c41235a` fix(layout): cambiar min-h-screen por h-screen para mantener sidebar fijo y habilitar scroll interno

----

#### 17/10/2026 - 22/10/2026

#### Matías Sillen | Rol: Desarrollador Frontend

* **Actividades:**
* Integración del inicio de sesión con Google OAuth a través de Supabase en las vistas de Login y Registro.
* Implementación de un interceptor HTTP global para capturar errores `403` y redirigir a los usuarios logueados con Google sin cuenta local.
* Creación de la vista `CompletarPerfilView.vue` para recolectar datos de negocio obligatorios (DNI, Teléfono, Sede) de usuarios provenientes de Google OAuth.
* Actualización del guard global en el Vue Router para realizar una verificación proactiva (`/auth/me`) del perfil local antes de permitir el acceso al Dashboard.
* Asignación dinámica del rol "externo" (`id_rol: 4`) en los flujos de registro local y de Google.
* Extensión de los permisos de visualización en la barra de navegación lateral (`Sidebar.vue`) para incluir al rol `gerente`.
* Aplicación de políticas estrictas de seguridad en contraseñas usando expresiones regulares con Zod en los formularios de registro y recuperación.
* Refactorización del componente reutilizable `BaseInput.vue` para incluir un botón dinámico (toggle) de visibilidad de contraseña utilizando Phosphor Icons.


* **Decisiones:**
* Implementar una verificación de perfil "proactiva" en el Router en lugar de "reactiva" para evitar el efecto de "limbo de autenticación" donde un usuario de Google quedaba atrapado en el Dashboard sin datos locales.
* Configurar el parámetro `prompt: 'select_account'` en la solicitud OAuth para forzar al proveedor a mostrar siempre el selector de cuentas de Google, incluso si ya existe una sesión activa en el navegador.
* Agregar un botón explícito de cancelación en la vista de completar perfil para forzar el cierre síncrono de la sesión en Supabase y evitar bucles de redirección infinitos.


* **Dificultades:**
* Sincronización de estado (condición de carrera) entre la recarga rápida de la URL con el token de Google y la lectura de `isAuthenticated` en Pinia por parte de Vue Router.
* Manejo del bucle infinito de rutas cuando el usuario se arrepentía de completar el perfil de Google y quería regresar al login normal.


* **Commits**
* `4d392f9` chore(auth): configurar cliente global de Supabase
* `82bcd13` feat(auth): migrar auth.service a Supabase SDK
* `e5a3c7e` feat(auth): integrar Pinia con onAuthStateChange de Supabase
* `db7eec9` fix(api): interceptor HTTP utiliza sesión activa de Supabase
* `ee65382` feat(auth): flujo de registro unificado con foto opcional en Supabase
* `f0e9f80` feat(auth): login integrado con Supabase y enlace a cambio de password
* `5a1a120` feat(auth): vista de cambio de contraseña
* `61f1c1f` fix(router): agregar ruta de cambio de contraseña y aplicar lazy loading a registro
* `e2fd8de` fix(auth): restaurar enlace a registro en UI de login
* `2ac1af9` fix(auth): forzar asignación síncrona de sesión en Pinia para evitar condición de carrera en el router
* `60d9084` fix(auth): forzar cierre de sesión síncrono en Pinia para arreglar bloqueo del router
* `6f7cc9d` fix(sidebar): hacer el cierre de sesión asíncrono para prevenir errores de navegación
* `d36ffe9` fix(auth): traducir errores de Supabase al español en login
* `2ae046c` feat(auth): aplicar validación Zod estricta (regex) y traducir errores de Supabase en registro
* `94fda06` fix(auth): traducir errores de Supabase al español en recuperación de contraseña
* `61f1c1f` fix(router): agregar ruta de cambio de contraseña y aplicar lazy loading a registro
* `be302c8` feat(auth): agregar soporte para signInWithOAuth mediante Google
* `17dbda4` feat(api): interceptar error 403 de cuenta no asociada y redirigir a completar perfil
* `7004c00` feat(auth): vista para completar datos de perfil (DNI, Sede) tras login con Google
* `a4c6800` chore(router): agregar ruta de completar-perfil para Google OAuth
* `4e758be` feat(auth): agregar botón y lógica de integración visual para login con Google
* `6afd70e` feat(auth): añadir verifyLocalProfile para comprobación proactiva de perfil
* `fd3d598` fix(router): implementar verificación proactiva de perfil antes de acceder al dashboard
* `bb64813` fix(auth): agregar botón cancelar para abortar registro y purgar sesión de Supabase
* `eeca00e` fix(auth): asignar id_rol 4 a perfiles de clientes externos en lugar de dejarlos sin rol
* `49b974e` feat(roles): extender permisos de administrador al rol gerente en vistas y rutas
* `b195719` feat(auth): aplicar política estricta de contraseñas seguras con Zod
* `7d74a2a` feat(ui): agregar toggle de visibilidad de contraseña global en BaseInput

----

#### 26/10/2026

#### Matías Sillen | Rol: Desarrollador Frontend

* **Actividades:**
* Separación de los campos de identidad en los formularios de registro y completado de perfil, diferenciando explícitamente `nombre` y `apellido` bajo validaciones estrictas de Zod.
* Implementación de la funcionalidad completa de gestión de fotos de perfil (carga local, previsualización en miniatura circular, botón de cambio y opción de eliminación) tanto en `RegistroView.vue` como en `CompletarPerfilView.vue`.
* Eliminación del selector de tipos de perfil en las vistas públicas, forzando la asignación automática y estricta del rol de "cliente externo" (`id_rol: 4`).
* Unificación y mejora del layout visual en las pantallas de autenticación, configurando un panel izquierdo fijo con el logo centrado y un panel derecho con scroll vertical independiente (`h-screen overflow-hidden` y `overflow-y-auto`).
* Adición de un indicador dinámico de fuerza de contraseña en tiempo real y un botón de retroceso hacia el inicio de sesión.
* Corrección en la sanitización de URLs post-OAuth en `src/router/index.ts`, pasando de un estado nulo a preservar `window.history.state` al limpiar los tokens de Supabase del hash.


* **Decisiones:**
* Preservar el estado actual del historial del navegador (`window.history.state`) al ejecutar `replaceState` para evitar la pérdida de referencias de Vue Router, eliminando así los warnings de consola y la latencia al hacer clic en los ítems del menú.
* Precompletar automáticamente los campos de nombre y apellido dividiendo el `full_name` devuelto por los metadatos de Google OAuth al completar el perfil.


* **Dificultades:**
* Retrasos intermitentes en la transición de rutas del menú lateral provocados por la eliminación drástica del historial al remover los tokens de la barra de direcciones de forma insegura, lo cual se resolvió correctamente manteniendo el contexto del router.


* **Commits**
* `901716a` fix(auth): corregir cursor de botones interactivos
* `2dce948` fix(auth): mejorar errores, separar campos y retirar opcion de socio
* `2e3db4c` fix(auth): proteger tokens en interceptor y sanitizar URL de redireccion
* `94208b1` fix(auth): separar nombre/apellido, agregar volver, scroll de panel y medidor de contraseña
* `0242ea6` style(auth): centrar logo de FitZone y unificar layout de scroll con registro
* `e53f97a` fix(auth): separar campos nombre/apellido y forzar rol externo en autocompletado
* `ebc1773` fix(router): preservar history state al limpiar url para evitar demoras en navegacion

----

#### 27/10/2026 - 29/10/2026

#### Matías Sillen | Rol: Desarrollador Frontend

* **Actividades:**
* Restauración y unificación completa del sistema de enrutamiento en `src/router/index.ts`, reintegrando el control de acceso basado en roles (RBAC), las rutas anidadas del módulo de gerencia y las landing pages.
* Corrección de la sanitización de URLs post-OAuth de Supabase, reemplazando el paso de un estado nulo por la preservación de `window.history.state` en la API de History del navegador.
* Reintegración de la lógica de mapeo de rol del backend (`authStore.setPerfilInterno`) dentro del bloque de Verificación Proactiva del Guard global.


* **Decisiones:**
* Preservar el objeto de estado interno (`window.history.state`) al momento de limpiar el token de la barra de direcciones (`replaceState`). Esto permite mantener la URL segura sin destruir las referencias de navegación internas que utiliza Vue Router.
* Mantener la inicialización de Supabase centralizada y controlada en el Store para evitar la creación de múltiples instancias de `GoTrueClient` que generaban cuellos de botella en el almacenamiento local.


* **Dificultades:**
* Al limpiar el fragmento de la URL (`#access_token=...`) para evitar la exposición de credenciales, Vue Router perdía su historial de estado, lo que provocaba advertencias en consola (`history.state seems to have been manually replaced`) y generaba una latencia notoria al navegar entre las distintas pantallas del menú lateral.


* **Commits**
* `d7c5d46` fix(router): restaurar rbac, roles de rutas anidadas e inyectar fix de seguridad y performance

----

#### 14/11/2026
#### Matías Sillén Ríos | Rol: Desarrollador Frontend

- **Actividades:**
  - Reorganización completa de `src/router/index.ts` agrupando rutas hijas de `MainLayout` por módulo, incorporando Lazy Loading (`() => import(...)`) en `PerfilView.vue`, completando `meta.roles` en rutas faltantes (`canchas/reservas/:id`), hidratando los datos completos del perfil en `beforeEach` y optimizando `LoginView.vue` para navegar directamente con `rutaPorRol`.
  - Optimización del interceptor de peticiones en `src/common/api/http.ts` para leer el token activo desde Pinia antes de consultar `supabase.auth.getSession()`, y limpieza de sesión ante respuestas HTTP `401`.
  - Eliminación del rol hardcodeado `roles: [4]` en `RegistroView.vue` y `CompletarPerfilView.vue`, agregando manejo de compensación ante fallos parciales entre Supabase Auth y el backend local, y persistencia del avatar de Google OAuth al completar el perfil.
  - Actualización de `src/store/auth.ts`, `MainLayout.vue` y `Sidebar.vue`: eliminación del enlace duplicado `Mi Perfil` del menú lateral, implementación de menú desplegable de usuario en la Navbar mostrando nombre y apellido reales (nunca el correo), fotografía de perfil (Supabase Storage y fallback de Google OAuth con `referrerpolicy="no-referrer"`), iniciales ante error de carga y estado Skeleton.
  - Ampliación de `PerfilView.vue` y `auth.service.ts`: incorporación de estado Skeleton, campos bloqueados (`email` y `dni`), edición validada con Zod de `nombre`, `apellido` y `telefono` sincronizada en tiempo real con Pinia/Navbar, carga y vista previa de fotografía de perfil (JPG, PNG o WEBP hasta 2 MB) y formulario independiente de cambio de contraseña con reautenticación previa (`reauthenticateWithPassword` + `updatePassword`) en Supabase Auth.
  - Incorporación de pruebas automatizadas con Vitest en `src/router/__tests__/router.spec.ts` y `src/modules/M1-usuarios/views/__tests__/PerfilView.spec.ts`.
- **Decisiones:**
  - Centralizar el acceso a `/perfil` en un menú desplegable de usuario en la Navbar y retirarlo del Sidebar para evitar duplicación de navegación y mantener sincronizado visualmente el avatar y el nombre completo del usuario activo.
  - Separar en `PerfilView.vue` el formulario de datos personales del formulario de cambio de contraseña, exigiendo reautenticación con la contraseña actual en Supabase Auth antes de aplicar `updateUser`.
  - Utilizar `referrerpolicy="no-referrer"` y fallback a metadatos de sesión (`avatar_url` / `picture`) para garantizar la visualización confiable de avatares provenientes de cuentas de Google OAuth.
- **Dificultades:**
  - Al iniciar sesión con cuentas de Google OAuth, la foto de perfil no se visualizaba porque `CompletarPerfilView.vue` no persistía la URL externa cuando no se subía un archivo local y las etiquetas `<img>` carecían de `referrerpolicy="no-referrer"` frente a la CDN de Google; se resolvió persistiendo la URL en el alta y agregando fallback desde los metadatos de sesión.
- **Commits:**
- `232e6e2` fix(router): reorganizar rutas con lazy loading y corregir navegacion
- `afb2ed5` fix(router): corregir advertencia deprecada de consultas de cliente
- `46d6383` fix(auth): asignar rol externo dinamicamente en el registro
- `17e522e` fix(navbar): mostrar nombre real y foto de perfil desde Supabase
- `a0a6f9f` feat(profile): trasladar acceso a mi perfil desde el sidebar a la navbar
- `4acc4f5` feat(profile): ampliar vista mi perfil con edicion, avatar y cambio de contrasena
- `fce0331` test(auth): agregar pruebas unitarias y de integracion de auth y perfil
- `1a8bfae` fix(navbar): persistir y mostrar avatar de cuenta de Google OAuth

---

#### 14/11/2026
#### Matías Sillén Ríos | Rol: Desarrollador Frontend

- **Actividades:**
  - Creación de la vista exclusiva del Dashboard del Socio (`SocioDashboardView.vue`) reutilizando el layout principal (`MainLayout.vue`), tarjetas, badges y componentes `Skeleton` existentes en `src/common/`, mostrando saludo personalizado, resumen de actividad, próximas reservas reales y accesos rápidos.
  - Implementación de la vista de Historial de Reservas (`HistorialReservasView.vue`) con distinción visual entre reservas de canchas y clases grupales (`@phosphor-icons/vue`), visualización de fechas, horarios, sedes y estados reales persistidos, filtrado por tipo de actividad, paginación y ordenamiento descendente (más recientes primero).
  - Integración de rutas con carga diferida (Lazy Loading) en `src/router/index.ts` y actualización de navegación en `Sidebar.vue` y `ruta-por-rol.ts`, habilitando el acceso exclusivo a usuarios con rol `socio` y bloqueando mediante `beforeEach` el ingreso directo de usuarios con rol `externo`.
  - Implementación de estados de interfaz completos (carga con `Skeleton`, historial vacío cuando el socio no posee actividades registradas y manejo de errores de red con opción de reintento) junto con validación de contratos mediante interfaces TypeScript y Zod.
  - Cobertura de pruebas automatizadas (Vitest / Cypress) validando control de acceso RBAC entre `socio` y `externo`, renderizado de estados visuales y visualización correcta de reservas de canchas y clases grupales.
- **Decisiones:**
  - Presentar una vista unificada de historial con filtros por categoría (`Todas`, `Canchas`, `Clases grupales`) e indicadores visuales diferenciados por tipo y estado real, evitando duplicar lógica de consulta y manteniendo consistencia visual en móvil y escritorio.
  - Centralizar el control de acceso tanto en la visibilidad del menú lateral como en los guards de Vue Router conectados al rol real hidratado desde el backend en Pinia (`useAuthStore`).
- **Dificultades:**
  - Evitar saltos visuales o exposición momentánea de componentes del Dashboard antes de confirmar el rol real del usuario tras recargar la página; se resolvió condicionando la navegación a la hidratación previa del perfil en `router.beforeEach` y mostrando estados `Skeleton` durante la carga inicial.
- **Commits:**
- `563bb88` feat(router): registrar rutas de dashboard y historial del socio
- `fc0b819` feat(dashboard): implementar vista de historial y dashboard del socio

---

#### 18/11/2026
#### Matías Sillén Ríos | Rol: Desarrollador Frontend

- **Actividades:**
  - Corrección de desbordamiento de scroll en PanelGerenciaView.vue utilizando clases de Tailwind CSS (`w-full overflow-x-hidden`).
- **Commits:**
- `61c10c3` fix(gerencia): evitar desbordamiento en PanelGerenciaView

---

---