# Bitácora
Vialle, Angelina — Rol: Desarrolladora Frontend / Team Leader / Arquitectura / QA (Repositorio Frontend)

---

## Sprint 5 — Unidad IV: Frontend basado en componentes
Semana del 2026-10-05

### 2026-10-09 · <horas> h

**Actividad**
Desarrollé la vista de credencial del socio para la generación y visualización dinámica del código QR de acceso (`CredencialView.vue`), creé el servicio `accesos.service.ts` para consumir el endpoint de generación de QR adjuntando la sesión activa e implementé el composable `useQr.ts` para gestionar la cuenta regresiva, expiración y renovación automática, manejando estados de carga, fallos de red y expiración de sesión.

**Decisión**
Centralicé la lógica del temporizador y la renovación automática dentro del composable `useQr.ts` para limpiar correctamente los intervalos al desmontar el componente y evitar fugas de memoria o llamadas innecesarias a la API.

**Problema o bloqueo**
Ninguno registrado durante la sesión.

**Commits**
`5e29d5c` feat(M2): interfases de qrResponse y appiError
`350c189` feat(M2): crear componente de QR
`47bb1c8` feat(M2): implementar servicio y composable para QR
`866333f` feat(M2): bitacora y arreglos

---

## Sprint 5 — Unidad IV: Frontend basado en componentes
Semana del 2026-10-12

### 2026-10-14 · <horas> h

**Actividad**
Desarrollé la vista de recepción (`RecepcionView.vue`) y el componente reutilizable `ValidacionAcceso.vue` para el control de acceso en sucursales, incorporando ingreso manual por token QR y escaneo en tiempo real mediante `html5-qrcode`. Conecté el flujo con `accesos.service.ts` para validar ingresos, controlar aforo, registrar egresos y mostrar estados visuales de éxito o rechazo (QR vencido, membresía inválida, sede llena o doble ingreso).

**Decisión**
Extraje la lógica del lector y de validación en el componente `ValidacionAcceso.vue` para mantener la vista desacoplada y evitar duplicación de código. Además, implementé un control de estado (`isLoadingIngreso` y bandera de escaneo activo) para prevenir disparos simultáneos y condiciones de carrera al escanear con la cámara.

**Problema o bloqueo**
Se produjeron lecturas múltiples por segundo desde la cámara web debido a la captura de fotogramas repetidos en paralelo. Lo resolví bloqueando inmediatamente el lector al detectar un código válido antes de invocar la petición a la API.

**Commits**
`c22666e` feat(M2): crear vista de recepcion y componente de validacion de acceso
`fcc87a1` feat(M2): metodos service accesos e interfaces actualizacion
`e1fd8b2` feat(M2): actualizacion credencial

---

## Sprint 5 — Unidad IV: Frontend basado en componentes
Semana del 2026-10-12

### 2026-10-18 · <horas> h

**Actividad**
Desarrollé el monitor de aforo en tiempo real (`AforoView.vue`) junto con el componente visual `IndicadorAforo.vue`, conectando el endpoint `GET /accesos/aforo/:id_sede` para consultar ocupación y capacidad máxima. Creé el composable `useAforo.ts` para encapsular la consulta inicial, el cálculo de porcentajes/alertas y la suscripción en tiempo real con desconexión limpia al cambiar de sede.

**Decisión**
Encapsulé toda la lógica de estado y suscripción en vivo dentro de `useAforo.ts` para separar los datos de la interfaz de usuario, utilizando la reactividad de Vue para reflejar ingresos y egresos al instante sin recargar la pantalla.

**Problema o bloqueo**
Ninguno registrado durante la sesión.

**Commits**
`943acf8` feat(M2): creacion de componente Indicador aforo
`42dc7b5` feat(M2): creacion del composables useAforo
`df535ba` feat(M2): actualizacion de accesos.service se agrega funcion obtener aforo
`4f6b5af` feat(M2): actualizacion composable, importaciones y nombre de tipos
`d038aca` feat(M2): actualizacion accesos.types creacion de una nueva interfaz
`233f730` feat(M2): creacion vista aforoView
`929d7a1` feat(M2): actualizacion bitacora

---

## Sprint 6 — Unidad IV: Frontend basado en componentes
Semana del 2026-10-19

### 2026-10-25 · <horas> h

**Actividad**
Implementé en el módulo M1 la vista administrativa `DirectorioUsuariosView.vue` y el composable `useDirectorioUsuarios.ts` para visualizar, buscar por DNI/nombre/email y filtrar usuarios por rol y estado. Definí los tipos en `usuario.types.ts`, helpers en `user-helpers.ts`, el método `obtenerUsuarios` en `usuarios.service.ts`, los esquemas de validación Zod en `validators.ts`, la ruta protegida `/usuarios` y limpieza de logs en `useAforo.ts` y `accesos.service.ts`.

**Decisión**
Estandaricé los contratos de usuarios y roles entre backend y frontend, desacoplé la lógica del directorio en `useDirectorioUsuarios.ts` y reutilicé los validadores Zod centralizados tanto en alta como en edición con toasts de duración extendida para facilitar la lectura de errores.

**Problema o bloqueo**
La estructura relacional `usuario_rol` devuelta por Prisma en el backend no coincidía directamente con los controles de selección del frontend. Lo resolví creando funciones de mapeo y helpers tipados (`user-helpers.ts`) para transformar los roles al editar perfiles.

**Commits**
`336a0d9` feat(zod): esquema de validacion comun
`08a14fa` feat(comun): agregado de rutas, correcion de pagina a español
`b5adf75` feat(M1): agregado funcion obtenerUsuarios, extraccion de interfaz RegistroPayload
`58784aa` feat(M1): interfaces par rol, usuarioResponse, registroPayload, actualizarUsuarioPayload y usuarioRolRelacion
`a44fa2b` feat(M2): quitado de mensajes y console.log innecesarios
`75f3366` feat(M1): archivo de como visualizan roles
`4ae0c7a` feat(M1): vista de gerente directorio de usuarios
`df3dcf9` feat(M1): soporte para selección de roles en edición y configurar duración de toasts en validación Zod
`1a8da7d` docs(log): actualizacion de bitacora

---

## Sprint 6 — Unidad IV: Frontend basado en componentes
Semana del 2026-10-26

### 2026-10-29 · <horas> h

**Actividad**
Extendí el módulo M2 para admitir validación de ingreso y egreso tanto por QR como por DNI: actualicé los DTOs en `accesos.types.ts`, adapté `accesos.service.ts` y agregué botones toggle en `ValidacionAcceso.vue` para alternar entre ambos métodos. Además, normalicé los mensajes de error del backend, registré la ruta `/recepcion` en `router/index.ts` con guardias RBAC y actualicé los permisos visibles en `Sidebar.vue`.

**Decisión**
Modelé los DTOs de validación y egreso como tipos unión (`qrToken` | `dni`) en lugar de duplicar endpoints o métodos de servicio, diseñé una alternancia por botones toggle en recepción para socios sin teléfono y centralicé el formateo de errores HTTP.

**Problema o bloqueo**
El servidor devolvía respuestas de error heterogéneas (arrays de strings en validaciones de `class-validator` frente a propiedades `detail` o `title` en errores de negocio). Lo resolví implementando un normalizador de errores en el servicio para mostrar mensajes legibles en pantalla.

**Commits**
`58cbd69` feat(M2): actualizacion index para accesos
`15501cc` feat(M2): cambio en tipos para agregar la opcion de ingreso por dni
`acff4ec` feat(M2): actualizacion para aceptar tanto dni o qrtoken
`fd76bc0` feat(M2): correciones para agregar la opcion de ingresar por DNI
`aa9beef` feat(M2): adicion de acceso en barra lateral

---

## Sprint 7 — Unidad V: Pruebas, integración y despliegue
Semana del 2026-11-09

### 2026-11-10 · <horas> h

**Actividad**
Implementé la generación y validación offline de códigos QR en el módulo M2 creando el servicio `offline-validator.ts` con Web Crypto API (`HMAC-SHA256`, firma de 16 caracteres y ventana de 60 segundos + 5s de tolerancia). Adapté `accesos.service.ts`, `ValidacionAcceso.vue` y el store `sede.ts` para generar tokens locales ante fallos de red, verificar alcance por ciudad (`id_ciudad`) y encolar ingresos y egresos en `localStorage` para sincronización diferida.

**Decisión**
Repliqué de forma idéntica en frontend y backend el algoritmo de firma `HMAC-SHA256` mediante la Web Crypto API nativa y una clave secreta compartida (`VITE_QR_OFFLINE_SECRET`) en lugar de esquemas asimétricos complejos, garantizando compatibilidad total entre el token generado offline y su validación posterior (ver ADR-003 y ADR-007).

**Problema o bloqueo**
Sin conexión a internet el terminal no podía consultar en la base central si el plan del socio habilitaba la sede ni validar en tiempo real contra Supabase. Lo resolví embebiendo `idCiudad` dentro del payload del QR (`${userId}.${idCiudad}.${timestamp}.${signature}`) para bloquear ingresos en otras ciudades y creando un fallback local con cola en `localStorage`.

**Commits**
`bbb9d9f` build(deps): agregar qrcode.vue
`cf871cb` fix(M1): remover id hardcodeado en rol
`4ab1e12` feat(store): adicion variable id_ciudad
`434dcc0` feat(M2): adicion logica para validacion offline y almacenar ingresos offline
`db41920` refactor(M2): mejora mensaje de error
`fc6cb52` feat(M2): adicion funciones para validar qr igual a backend en frontend
`5313bc9` feat(M2): servicio para manejar validacion offline de qr
`660d053` feat(M2): actualizacion egreso-ingreso, adicion de variables a appierror y a socioperfil
`9a86004` docs(log): actualizacion de bitacora

---

## Sprint 7 — Unidad V: Pruebas, integración y despliegue
Semana del 2026-11-09

### 2026-11-14 · <horas> h

**Actividad**
Implementé en el módulo M1 la baja lógica (*soft-delete*) con modal de confirmación (`DELETE /usuarios/:id`), la restauración directa de cuentas inactivas (`PATCH /usuarios/:id`) y la paginación/filtrado server-side en `useDirectorioUsuarios.ts` y `DirectorioUsuariosView.vue`. Además, ajusté las redirecciones por rol en `router/index.ts`, reorganicé `Sidebar.vue`, agregué guards de tipado en `MembresiaView.vue` y `ResultadoPagoView.vue` y corregí el formato en `DetalleReservaView.vue`.

**Decisión**
Apliqué actualización optimista en la UI para reflejar bajas y restauraciones al instante sin esperar la respuesta HTTP, migré el filtrado y paginado de usuarios al servidor para optimizar rendimiento y restringí la redirección automática a `/recepcion` únicamente al rol recepcionista.

**Problema o bloqueo**
Mantener sincronizada la actualización optimista con los filtros activos ("Activos" o "Desactivados") generaba desfases en los contadores locales, y la propiedad opcional `authStore.usuario.id` disparaba errores de compilación en TypeScript. Lo resolví ajustando condicionalmente el array reactivo según el filtro vigente y agregando validaciones estrictas de existencia antes de invocar `setPerfilInterno`.

**Commits**
`a972d3d` fix(index): redireccion de solo recepcionista
`32bed95` style(M4): arreglo formato
`524aec9` fix(M5 y M1): correcion para que este el id definido
`50c938e` fix(components): organizacion SideBar
`0a7f222` feat(M1): implementacion de baja logica, restauracion y paginacion

---

## Sprint 8 — Unidad VI: Cierre, manuales y defensa
Semana del 2026-11-16

### 2026-11-18 · 4 h

**Actividad**
Estandaricé la estructura y el formato de los Registros de Decisión Arquitectónica (ADR) del frontend para alinearlos con la plantilla exigida en el Anexo B de los lineamientos de entrega. Además, redacté e incorporé dos nuevos ADR correspondientes a las decisiones arquitectónicas del frontend sobre la estrategia offline del control de acceso y sincronización.

**Decisión**
Decidí respetar estrictamente el formato tabular y las secciones de la plantilla oficial en todos los ADR para garantizar uniformidad en el dossier final, documentando qué subconjunto de datos se almacena localmente, cómo se genera el QR dinámico sin conectividad continua y qué criterios de reconciliación aplica el terminal al reconectar.

**Problema o bloqueo**
Al revisar la carpeta `docs/adr/` de cara al checklist de autoevaluación, detecté que los ADR previos del frontend presentaban inconsistencias de formato respecto de los campos obligatorios solicitados para el dossier (especialmente en la tabla de alternativas consideradas y la deuda asumida). Lo resolví auditando y reestructurando cada archivo Markdown del frontend antes de sumar los nuevos registros.

**Commits**
`880b46d` docs(adr): adrs del frontend
`e09d590` fix(adr): arreglo formato documentos
`34a5e23` docs(bitacora): actualizar bitacora

---

## Sprint 8 — Unidad V: Pruebas, integración y despliegue
Semana del 2026-11-16

### 2026-11-19 · 3 h

**Actividad**
Implementé pruebas unitarias en el código fuente (`test(src)`) y pruebas específicas para autenticación y sede en el store (`test(store)`). Además, configuré el `.gitignore` para excluir los reportes de cobertura generados localmente.

**Decisión**
Mantuve la mayoría de las pruebas alineadas con el formato del estado global que venía trabajando el equipo, pero separé las de autenticación y sede en el `store` porque ya existía una carpeta dedicada a eso para respetar la organización previa del proyecto. También decidí ignorar los reportes de cobertura en `.gitignore` para evitar versionar artefactos generados automáticamente.

**Problema o bloqueo**
Al correr las pruebas localmente se generaban archivos de reporte de cobertura que ensuciaban el estado del repositorio. Lo resolví agregando las rutas correspondientes al `.gitignore` para mantener limpio el historial de cambios antes del cierre.

**Commits**
`9186d47` test(store): creacion test autenticacion y sede
`f7a3157` test(src): creacion de test unitarios
`721b8c5` chore: ignorar reporte de cobertura en .gitignore