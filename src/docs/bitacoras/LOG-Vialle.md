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
  - `5e29d5c` feat(M2): interfases de qrResponse y appiError
  - `350c189` feat(M2): crear componente de QR
  - `47bb1c8` feat(M2): implementar servicio y composable para QR
  - `866333f` feat(M2): bitacora y arreglos

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
  - `c22666e` feat(M2): crear vista de recepcion y componente de validacion de acceso
  - `fcc87a1` feat(M2): metodos service accesos e interfaces actualizacion
  - `e1fd8b2` feat(M2): actualizacion credencial

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
  - `943acf8` feat(M2): creacion de componente Indicador aforo
  - `42dc7b5` feat(M2): creacion del composables useAforo
  - `df535ba` feat(M2): actualizacion de accesos.service se agrega funcion obtener aforo
  - `4f6b5af` feat(M2): actualizacion composable, importaciones y nombre de tipos
  - `d038aca` feat(M2): actualizacion accesos.types creacion de una nueva interfaz
  - `233f730` feat(M2): creacion vista aforoView
  - `929d7a1` feat(M2): actualizacion bitacora

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
  - `5e29d5c` feat(M2): interfases de qrResponse y appiError
  - `350c189` feat(M2): crear componente de QR
  - `47bb1c8` feat(M2): implementar servicio y composable para QR
  - `866333f` feat(M2): bitacora y arreglos

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
  - `c22666e` feat(M2): crear vista de recepcion y componente de validacion de acceso
  - `fcc87a1` feat(M2): metodos service accesos e interfaces actualizacion
  - `e1fd8b2` feat(M2): actualizacion credencial

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
  - `943acf8` feat(M2): creacion de componente Indicador aforo
  - `42dc7b5` feat(M2): creacion del composables useAforo
  - `df535ba` feat(M2): actualizacion de accesos.service se agrega funcion obtener aforo
  - `4f6b5af` feat(M2): actualizacion composable, importaciones y nombre de tipos
  - `d038aca` feat(M2): actualizacion accesos.types creacion de una nueva interfaz
  - `233f730` feat(M2): creacion vista aforoView
  - `929d7a1` feat(M2): actualizacion bitacora

----
# Bitacora - Vialle Angelina - Rol: Diseñador de arquitectura
## Sprint 8 — Unidad Cierre - Semana del 2026-11-16

### 2026-11-18 . 4 h

**Actividad**
Estandaricé la estructura y el formato de los Registros de Decisión Arquitectónica (ADR) del frontend para alinearlos con la plantilla exigida en el Anexo B de los lineamientos de entrega. Además, redacté e incorporé dos nuevos ADR correspondientes a las decisiones arquitectónicas del frontend la estrategia offline del control de acceso y sincronizacion.

**Decisión**
Decidí respetar estrictamente el formato tabular y las secciones de la plantilla oficial en todos los ADR para garantizar uniformidad en el dossier final. Respecto al funcionamiento offline en el frontend, definí qué subconjunto de datos y credenciales se almacenan localmente para permitir la validación en sede ante caída de red, cómo se genera el QR dinámico desde el portal del socio sin depender de conectividad continua y qué criterios de reconciliación aplica el terminal al restablecerse la conexión con el servidor central.

**Problema o bloqueo**
Al revisar la carpeta `docs/adr/` de cara al checklist de autoevaluación, detecté que los ADR previos del frontend presentaban inconsistencias de formato respecto de los campos obligatorios solicitados para el dossier (especialmente en la tabla comparativa de alternativas consideradas y la explicitación de deuda asumida). Lo resolví auditando y reestructurando cada archivo Markdown del frontend antes de sumar los nuevos registros del frontend, asegurando homogeneidad para la exportación final al PDF.

**Commits**
* `880b46d` docs(adr): adrs del frontend
* `e09d590` fix(adr): arreglo formato documentos 


