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

#### 26/10/2026
#### Gonzalo Lima | Rol: Desarrollador Frontend

- **Actividades**:
  - Migración y alineación completa de los planes de membresía a Plan Mensual (30 días), Plan Trimestral (90 días) y Plan Anual (365 días).
  - Actualización de la landing page con botones de acción: redirige a /membresia si el usuario está autenticado, o a /login si no lo está.
  - Actualización del modal de checkout con leyenda dinámica de renovación automática según la duración del plan seleccionado (mensual, trimestral o anual) y emisión del ID de plan y preferencia de renovación al backend.
- **Decisiones**:
  - Eliminar los selectores artificiales de ciclo de facturación en la landing para consumir directamente los planes reales desde el endpoint del backend.
  - Enrutar a los usuarios no autenticados al login al interactuar con acciones comerciales clave de la landing page para optimizar el embudo de conversión a socios.
- **Dificultades**: Ninguna.
- **Commits:**
  - `feat(pagos): enviar id_membresia_plan y texto dinámico de renovación en checkout`
  - `feat(membresias): actualizar cards, beneficios y landing con los nuevos planes`

----

#### 29/10/2026
#### Gonzalo Lima | Rol: Desarrollador Frontend

- **Actividades**:
  - Vista de membresías: visualización del estado y vigencia de la suscripción en cabecera (plan actual, fechas y badges) y dinamización de acciones en tarjetas de planes.
  - Modal de checkout: simplificación del flujo reemplazando el formulario simulado de tarjeta por confirmación directa y redirección a Mercado Pago.
  - Remoción de la opción de renovación automática en checkout y vista de membresías.
- **Decisiones**:
  - Delegar el cobro exclusivamente a Checkout Pro de Mercado Pago sin formularios intermedios de tarjeta.
- **Dificultades**: Ninguna.
- **Commits**:
  - `fix(pagos): reemplazar inputs ficticios de tarjeta por modal de confirmacion en checkout`
  - `feat(membresias): resaltar plan actual, dinamizar botones y mostrar vigencia en cabecera`
  - `refactor(pagos): remover seleccion de renovacion automatica en checkout`

----

#### 04/11/2026
#### Gonzalo Lima | Rol: Desarrollador Frontend

- **Actividades**:
  - Optimización de la Landing Page: centralización y deduplicación de peticiones en el store para evitar llamadas repetidas.
  - Obtención dinámica de los tipos de cancha desde el backend,eliminando datos hardcodeados.
  - Rediseño del botón "Mi panel" y ocultamiento del botón de menú hamburguesa en mobile cuando el usuario tiene sesión activa.
  - Verificación de pago de membresías: reconciliación automática de pagos pendientes y sincronización inmediata del rol del usuario de `"externo"` a `"socio"` en `authStore` tras acreditarse el pago.
- **Decisiones**:
  - Reutilizar la promesa en vuelo dentro del store de Pinia para que múltiples componentes montados en simultáneo compartan una única petición HTTP.
  - Refrescar el perfil local contra el backend al detectarse la membresía activa para actualizar los permisos del menú lateral sin obligar al usuario a reloguear.
- **Dificultades**: En el entorno Sandbox de Mercado Pago sobre `localhost` no se muestra el botón de retorno automático al sitio, por lo que se resolvió verificando los pagos pendientes del usuario al ingresar a la vista de membresías.
- **Commits**:
  - `feat(landing): utilizar el store para una única llamada a la api de sedes y ciudades`
  - `feat(landing): obtener los tipos de cancha dinámicamente desde el backend`
  - `chore(landing): mejorar estética del botón "Mi panel"`
  - `feat(membresias): acreditar pagos de membresia y promover rol externo a socio`

----

#### 07/11/2026
#### Gonzalo Lima | Rol: Desarrollador Frontend

- **Actividades**:
  - Descarga segura de comprobantes: se actualizó la vista del historial de pagos para que la descarga de facturas en PDF viaje protegida con la cuenta del usuario, garantizando la privacidad de su información.
  - Botón para suspender membresía: se agregó el botón "Suspender membresía" con una ventana de confirmación clara. Al suspenderla, se muestra un aviso indicando hasta qué día siguen activos los beneficios y se desactivan los botones de compra para no pagar dos veces.
- **Decisiones**:
  - Descargar los comprobantes mediante la sesión activa del usuario para que nadie externo pueda abrirlos.
  - Desactivar la contratación de planes mientras la membresía suspendida siga vigente para evitar cobros dobles accidentales.
- **Dificultades**: Ninguna.
- **Commits**:
  - `feat(pagos): descargar comprobantes mediante peticion autenticada en historial de pagos`
  - `feat(membresia): añadir botón para suspender membresía y badge informativos`

----