# 7. Enrutamiento con Vue Router y Lazy Loading

Fecha: 2026-08-31
Estado: Aceptado

## Contexto
Nuestra aplicación tiene muchos módulos, por lo que necesitamos gestionar la navegación entre las distintas pantallas. Como decidimos organizar el proyecto por módulos, si cargamos todo el código de golpe cuando el usuario entra a la web, la carga inicial será muy lenta.

## Decisión
Utilizaremos Vue Router como herramienta para el manejo de rutas. 
Además, establecemos como regla estricta utilizar Lazy Loading como técnica de optimización, ya que retrasa la descarga de recursos o código hasta el momento exacto en que el usuario los necesita.

## Consecuencias
* **Positivas:**
  * La aplicación cargará muchísimo más rápido al inicio, ya que el navegador solo descargará el código del módulo que el usuario está visitando en ese momento.
  * Se alinea perfectamente con nuestra decisión previa (ADR 0004) de separar el proyecto en módulos independientes.
* **Negativa:**
  * Exige prestar atención al momento de registrar una nueva ruta para asegurarse de usar la importación dinámica; si un desarrollador importa la vista de manera normal arriba del archivo, rompe el beneficio de la carga diferida.
