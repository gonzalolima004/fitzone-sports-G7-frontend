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

#### 12/10/2026
#### Gonzalo Lima | Rol: Desarrollador Frontend

- **Actividades:**
  - Creación del servicio de pagos para conectar la interfaz con la API de cobros.
  - Creación del botón y modal de confirmación de pago con validación y estados de carga.
  - Listado dinámico de conceptos pendientes (membresías adeudadas y reservas de canchas).
  - Redirección al checkout de Mercado Pago al confirmar el pago.
- **Decisiones:**
  - Reutilizar los componentes base del sistema (botones y modales) para mantener la consistencia visual.
  - Mostrar mensajes de estado claros cuando el socio está al día con sus pagos.
- **Dificultades:**
  - Problema con el token de sesión en las peticiones que provocaba error de autenticación, resuelto unificando su lectura en el cliente HTTP.
- **Commits:**
  - `feat(pagos): pago service y botón disparador de acción de pago`
  - `feat(pagos): conectar service con api iniciar-pagos`
  - `feat(pagos): integracion de pagos pendientes e inicio de checkout`

----

#### 12/10/2026
#### Gonzalo Lima | Rol: Desarrollador Frontend

- **Actividades:**
  - Creación de la vista de resultado del pago con soporte para estados Aprobado, Pendiente, Rechazado y No identificado.
  - Configuración de la ruta /pagos/resultado y para los retornos de MercadoPago (pagos/exito, pagos/error, pagos/pendiente).
  - Consulta al backend (GET /pagos/:id) para certificar el estado real del pago a partir de localStorage o parámetros de URL.
  - Integración de botones contextuales.
- **Decisiones:**
  - Validar siempre el estado persistido en la base de datos para no depender únicamente de los parámetros de retorno de la pasarela.
  - Unificar la estructura de la tarjeta mediante propiedades reactivas computadas para mantener el código conciso y sin duplicaciones.
  - Uso estricto de componentes base (BaseButton) respetando la guía de diseño institucional.
- **Dificultades:**
  - Manejo de accesos directos sin identificador de pago o consultas no autorizadas, resuelto incorporando un estado defensivo con navegación segura al panel de pagos.
- **Commits:**
  - `feat(pagos): crear vistas de resultados y sus rutas`
  - `feat(pagos): conectar las vistas con el estado real del pago`
  - `feat(pagos): conexión con acciones contextuales y navegación dependiendo del resultado del pago`
  - `fix(pagos): mejoras en la ui y corrección de errores visuales`

----

#### 12/10/2026
#### Gonzalo Lima | Rol: Desarrollador Frontend

- **Actividades:**
  - Creación del componente HistorialPagos para la consulta de pagos realizados por el usuario.
  - Conexión para poder descargar el PDF del comprobante.
  - Desglose de datos en mini badges visuales con iconos.
  - Normalización estética de importes monetarios en ARS sin decimales en tarjetas, historial y modales de pago.
  - Optimización de armonía visual en tarjetas de pagos pendientes para vista mobile.
  - Creación del componente genérico BaseSkeleton e integración en conceptos pendientes e historial de pagos.
- **Decisiones:**
  - Desacoplar el historial en un componente dedicado y reutilizable para mantener un tamaño de archivo liviano y alta legibilidad.
  - Restringir la disponibilidad de descarga del comprobante únicamente a transacciones certificadas en estado 'Aprobado'.
  - Implementar BaseSkeleton para estandarizar los estados de carga.
- **Dificultades:**
  - Desbalance visual y saltos de línea involuntarios en los badges descriptivos y botones de cobro en pantallas estrechas.
- **Commits:**
  - `feat(pagos): creación de historial de pagos`
  - `fix(pagos): armonizar diseño en desktop y mobile`
  - `feat(pagos): agregar skeleton loaders base y utilizarlo en toda la sección`

----

#### 20/10/2026 - 22/10/2026
#### Gonzalo Lima | Rol: Desarrollador Frontend

- **Actividades:**
  - Implementación de redirección inteligente post-login según el rol del usuario mediante guard auxiliar y actualización de tipos en auth store.
  - Ajuste de visibilidad y permisos en las secciones del menú lateral (Sidebar) alineado con los roles de usuario.
  - Reestructuración de rutas para publicar la Landing Page en la ruta raíz (`/`) como vista pública y reubicación del dashboard privado en `/inicio`.
  - Creación del módulo `landing` con rutas dedicadas y vista orquestadora modularizada (`LandingView.vue`).
  - Maquetado y desarrollo de componentes modulares para la Landing Page:
    - `LandingHeader`: Barra de navegación fija con scroll suave a secciones, selector rápido de sedes y accesos a login/registro.
    - `LandingHero`: Portada institucional con propuesta de valor, badges destacados, llamadas a la acción e imágenes responsive.
    - `LandingFrictionless`: Sección explicativa de acreditación instantánea mediante QR, reserva de canchas y red de sedes.
    - `LandingSedes`: Catálogo interactivo de sedes con buscador por ciudad/nombre, filtro por departamentos de Entre Ríos y mapa interactivo con Leaflet.
    - `LandingServicios`: Grilla completa de disciplinas deportivas con filtrado dinámico por categoría y desglose de características.
    - `LandingPlanes`: Comparador de planes de suscripción con selector de periodicidad mensual/anual con descuento y vinculación al registro.
    - `LandingCanchas`: Módulo informativo de canchas deportivas con acceso a alquiler para socios y usuarios externos.
    - `LandingFaq`: Acordeón interactivo con preguntas frecuentes sobre servicios, membresías y acreditaciones.
    - `LandingCta` y `LandingFooter`: Banner final de llamado a la acción y pie de página con accesos rápidos, información de sedes y contacto.
- **Decisiones:**
  - Modularizar la Landing Page en componentes independientes bajo `src/modules/landing/components/` para mantener una alta mantenibilidad, facilitar pruebas y evitar archivos extensos.
  - Separar la vidriera pública en la ruta raíz (`/`) y trasladar el panel principal a `/inicio` para ofrecer una navegación natural a visitantes y socios.
  - Centralizar la lógica de redirección basada en roles en una utilidad compartida (`rutaPorRol`) para reutilizarla tanto en el formulario de login como en el guard global del router.
  - Integrar Leaflet para la visualización geográfica de sedes en Entre Ríos sin depender de servicios pagos de mapas.
- **Dificultades:**
  - Adaptar la navegación y guards para permitir el acceso público a la landing y a la reserva de canchas para usuarios externos sin provocar redirecciones involuntarias al login.
- **Commits:**
  - `feat(rbac): redirección después de iniciar sesión dependiendo del rol`
  - `feat(landing): ruta para la lading y mover dashboard a /inicio`
  - `feat(landing): landing completa modularizada`

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
- **Commits:**
  -  `feat(membresias): mapear endpoints de planes y verificacion de estado`
  -  `feat(pagos): agregar servicio HTTP para iniciar preferencia de pago`
  -  `feat(membresias): crear componente reutilizable PlanCard`
  -  `feat(pagos): maquetar modal de checkout seguro con integracion de metodos`
  -  `refactor(ui): reemplazar svgs en duro por componentes de phosphor icons en PlanCard.vue`
  -  `feat(membresias): implementar pantalla de membresías integrando estados, mora y retorno de checkout`
  -  `fix(membresias): unificar id_membresia_plan en UI y adjuntar token JWT en servicio de pagos`
  -  `fix(membresias): pasar objeto plan completo al modal para garantizar la visualización del precio correcto`
  -  `refactor(membresias): enviar objeto plan completo al modal, eliminar css custom y aplicar tailwind estricto`
  -  `fix(layout): cambiar min-h-screen por h-screen para mantener sidebar fijo y habilitar scroll interno`

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

#### 14/10/2026
#### Angelina Viale | Rol: Desarrollador Frontend

- **Actividades:**
  - Desarrollo de la vista de recepción (RecepcionView.vue) y del componente reutilizable de validación (ValidacionAcceso.vue) para el control de acceso en sucursales.
  - Implementación de la opción de ingreso manual del token QR y del escaneo de códigos en tiempo real utilizando la librería html5-qrcode
  - Conexión del flujo de validación con el servicio de accesos (accesos.service.ts) para consumir el endpoint de validación y control de aforo/ingresos
  -Incorporación de la lógica para registrar la salida (egreso) del socio y manejo visual de los estados de éxito, errores y rechazos del servidor (QR vencido, membresía inválida, sede llena o doble ingreso).
- **Decisiones:**
  - Extraer y centralizar la lógica del lector y validación en el componente ValidacionAcceso.vue para mantener la vista limpia, evitar la duplicación de código y cumplir con el principio de separación de responsabilidades.
  - Implementar un mecanismo de control de estado (isLoadingIngreso y bandera de escaneo activo) para evitar múltiples disparos simultáneos y condiciones de carrera al escanear con la cámara.
- **Dificultades:** Conflictos temporales de lecturas múltiples por segundo desde la cámara web (captura de fotogramas repetidos en paralelo), resueltos bloqueando el lector inmediatamente al detectar un código válido antes de invocar la API..
- **Commits:**
  - `feat(M2): crear vista de recepcion y componente de validacion de acceso`
  - `feat(M2): metodos service accesos e interfaces actualizacion`
  - `feat(M2): actualizacion credencial`

----

#### 18/10/2026
#### Angelina Viale | Rol: Desarrollador Frontend

- **Actividades:**
  -Desarrollo del monitor de aforo en tiempo real para la vista de recepción (AforoView.vue) e integración del componente visual IndicadorAforo.vue.

  -Conexión con el endpoint inicial GET /accesos/aforo/:id_sede para obtener el aforo actual y la capacidad máxima configurada por sede.

  -Creación del composable reutilizable useAforo.ts para encapsular la lógica de consulta inicial, cálculo de porcentajes/alertas de capacidad y la suscripción al canal de eventos en tiempo real.

  -Implementación de la gestión de ciclo de vida del WebSocket/suscripción en tiempo real, garantizando la desconexión limpia al cambiar de sede.

  -Integración de estados de carga, manejo de errores de conexión y alertas visuales al alcanzar o superar el límite de capacidad permitido de la sede.
- **Decisiones:**
  -Encapsular toda la lógica de estado y suscripción en vivo en el composable useAforo.ts para separar la capa de datos de la interfaz de usuario.
  -Centralizar la notificación de cambios de aforo mediante la reactividad de Vue, asegurando que las actualizaciones de ingresos/egresos desde la recepción se reflejen inmediatamente en el monitor sin requerir recargar la pantalla.
  
- **Dificultades:** Ninguna.
- **Commits:**
  - `feat(M2): creacion de componente Indicador aforo`
  - `feat(M2): creacion del composables useAforo`
  - `feat(M2): actualizacion de accesos.service se agrega funcion obtener aforo`
  - `feat(M2): actualizacion composable, importaciones y nombre de tipos`
  -`feat(M2): actualizacion accesos.types creacion de una nueva interfaz`
  -`feat(M2): creacion vista aforoView`
  -`feat(M2): actualizacion bitacora`

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

- **Actividades:** Revisión del tablero y dependencias; publicación y normalización de las cuatro ramas propias a `feature/`; actualización de bitácoras dev/TL; resolución de conflictos frontend #16, #17, #18 y #20 conservando los cambios de sus autores; preparación del [traspaso](./cierre-tl-2026-10-14.md).
- **Integración propia:** A solicitud de Facundo, creación y merge hacia dev de frontend [#21](https://github.com/gonzalolima004/fitzone-sports-G7-frontend/pull/21), [#22](https://github.com/gonzalolima004/fitzone-sports-G7-frontend/pull/22) y backend [#56](https://github.com/gonzalolima004/fitzone-sports-G7-backend/pull/56). Se resolvieron conflictos en rutas y bitácoras conservando los registros completos y las pantallas de pagos. El PR de esta rama entrega la documentación de cierre.
- **Decisiones:** Preservar el historial mediante merges y conservar ocupación como ruta hija única del panel. La solicitud de crear y fusionar los PR reemplazó el acuerdo previo de apertura manual. Las integraciones previas de #16/#17/#18/#20 fueron externas a esta asistencia.
- **Dificultades y resolución:** Regeneración local de Prisma Client por el esquema de clases actualizado; conflicto de entradas de log; ruta de ocupación duplicada al incorporar dev. Se conservaron las entradas de todos los autores y se reemplazó la plantilla vacía de TL.
- **Verificación final de código:** Frontend build/lint y 11 pruebas aprobados; backend build/typecheck y 9 pruebas aprobados más verificación SQL con PGlite. No se modificó la base compartida ni se acredita aceptación visual o sesión real con tests simulados.
- **Trello:** Tareas frontend 5 y 6 documentadas y finalizadas como desarrollo integrado; backend ocupación actualizado conservando Finalizado. TL tarea 2 mantiene pendientes de revisión entre compañeros y aceptación integrada.
- **Commits de resolución:** `f7e9073`, `9f0197f`, `b1afc69`, `714e0e7`, `e44c72e`; integraciones propias `c354c59`, `1a3c1e1`, `0f0f93a`.
- **Pendientes:** Revisión humana, aceptación visual y con datos reales, contrato de checkout de membresías, sorteo y acuerdos de la reunión del 14/10 a las 15:00; nuevo TL asume el 15/10.

---

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

---

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

---

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


* **Commits:**
* `chore(auth): configurar cliente global de Supabase`
* `feat(auth): migrar auth.service a Supabase SDK`
* `feat(auth): integrar Pinia con onAuthStateChange de Supabase`
* `fix(api): interceptor HTTP utiliza sesión activa de Supabase`
* `feat(auth): flujo de registro unificado con foto opcional en Supabase`
* `feat(auth): login integrado con Supabase y enlace a cambio de password`
* `feat(auth): vista de cambio de contraseña`
* `fix(router): agregar ruta de cambio de contraseña y aplicar lazy loading a registro`
* `fix(auth): restaurar enlace a registro en UI de login`
* `fix(auth): forzar asignación síncrona de sesión en Pinia para evitar condición de carrera en el router`
* `fix(auth): forzar cierre de sesión síncrono en Pinia para arreglar bloqueo del router`
* `fix(sidebar): hacer el cierre de sesión asíncrono para prevenir errores de navegación`
* `fix(auth): traducir errores de Supabase al español en login`
* `feat(auth): aplicar validación Zod estricta (regex) y traducir errores de Supabase en registro`
* `fix(auth): traducir errores de Supabase al español en recuperación de contraseña`
* `fix(router): agregar ruta de cambio de contraseña y aplicar lazy loading a registro`
* `feat(auth): agregar soporte para signInWithOAuth mediante Google`
* `feat(api): interceptar error 403 de cuenta no asociada y redirigir a completar perfil`
* `feat(auth): vista para completar datos de perfil (DNI, Sede) tras login con Google`
* `chore(router): agregar ruta de completar-perfil para Google OAuth`
* `feat(auth): agregar botón y lógica de integración visual para login con Google`
* `feat(auth): añadir verifyLocalProfile para comprobación proactiva de perfil`
* `fix(router): implementar verificación proactiva de perfil antes de acceder al dashboard`
* `fix(auth): agregar botón cancelar para abortar registro y purgar sesión de Supabase`
* `fix(auth): asignar id_rol 4 a perfiles de clientes externos en lugar de dejarlos sin rol`
* `feat(roles): extender permisos de administrador al rol gerente en vistas y rutas`
* `feat(auth): aplicar política estricta de contraseñas seguras con Zod`
* `feat(ui): agregar toggle de visibilidad de contraseña global en BaseInput`

---

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
---

#### 25/10/2026
#### Angelina Vialle | Rol: Team Leader / Desarrolladora Frontend
- **Actividades**:
  - **Módulo M1 (Usuarios y Directorio de Gerencia)**:
    - Implementación de la vista administrativa `DirectorioUsuariosView.vue` para visualización, búsqueda por DNI/nombre/email y filtrado de usuarios por rol y estado.
    - Desarrollo del composable `useDirectorioUsuarios.ts` para orquestar la paginación, filtros reactivos, modal de edición de datos de usuario, asignación de roles y estados.
    - Definición y centralización del tipado TypeScript en `usuario.types.ts` (`Rol`, `UsuarioResponse`, `RegistroPayload`, `ActualizarUsuarioPayload` y `UsuarioRolRelacion`).
    - Creación de helpers de visualización en `user-helpers.ts` para badges y mapeo de nombres de roles (`Gerente`, `Profesor`, `Recepcionista`, `Cliente`).
    - Extensión de `usuarios.service.ts` con la función `obtenerUsuarios` y tipado para actualización.
    - Definición de esquemas de validación Zod en `validators.ts` y configuración de feedback mediante toasts con duración optimizada para mensajes de error.
    - Configuración de ruta protegida `/usuarios` en `router/index.ts`, agregado de acceso en `Sidebar.vue` y configuración de idioma a español en `index.html`.
  - **Módulo M2 (Accesos y Aforo)**:
    - Limpieza de código, eliminación de `console.log` y mensajes redundantes en `useAforo.ts` y `accesos.service.ts`.
- **Decisiones**:
  - Centralizar y estandarizar los contratos de datos de usuarios y roles entre backend y frontend para evitar discrepancias estructurales al editar perfiles o asignar roles.
  - Implementar la lógica del directorio en un composable específico (`useDirectorioUsuarios`) y helpers de presentación desacoplados (`user-helpers.ts`) para mantener la vista limpia y modular.
  - Reutilizar validadores Zod centralizados tanto para registro como para edición con toasts informativos de duración adecuada para garantizar que el usuario pueda leer las correcciones solicitadas.
- **Dificultades**:
  - Adaptar la estructura relacional de `usuario_rol` proveniente de Prisma en el backend con los controles de selección y actualización de roles en los formularios del frontend.
- **Commits:**
- `feat(zod): esquema de validacion comun`
- `feat(comun): agregado de rutas, correcion de pagina a español`
- `feat(M1): agregado funcion obtenerUsuarios, extraccion de interfaz RegistroPayload`
- `feat(M1): interfaces par rol, usuarioResponse, registroPayload, actualizarUsuarioPayload y usuarioRolRelacion`
- `feat(M2): quitado de mensajes y console.log innecesarios`
- `feat(M1): archivo de como visualizan roles`
- `feat(M1): vista de gerente directorio de usuarios`
- `feat(M1): soporte para selección de roles en edición y configurar duración de toasts en validación Zod`
- `docs(log): actualizacion de bitacora`
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

---

