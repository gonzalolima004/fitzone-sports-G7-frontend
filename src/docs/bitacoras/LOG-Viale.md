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
