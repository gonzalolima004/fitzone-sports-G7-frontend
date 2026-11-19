# ADR-007: Enrutamiento mediante Vue Router con estrategia de Lazy Loading

- **Estado:** Aceptado
- **Fecha:** 2026-08-31
- **Autor:** Gonzalo Lima
- **Sprint:** 1

## Contexto
Nuestra aplicación tiene muchos módulos, por lo que necesitamos gestionar la navegación entre las distintas pantallas. Como decidimos organizar el proyecto por módulos, si cargamos todo el código de golpe cuando el usuario entra a la web, la carga inicial será muy lenta.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **Carga estática tradicional** | Toda la aplicación queda disponible de inmediato tras la primera carga. | El tamaño del paquete inicial crece exponencialmente, degradando el rendimiento en conexiones lentas. | Incompatible con los requerimientos de rendimiento y optimización para dispositivos móviles del socio. |
| **Enrutamiento por páginas separadas sin framework** | Simplicidad en la arquitectura de archivos del servidor web. | Rompe la experiencia de SPA (Single Page Application) fluida que exige un portal interactivo moderno. | Descartado por requerimientos funcionales del sistema (experiencia fluida responsive). |
| **Vue Router con Lazy Loading** | Optimiza drásticamente la carga inicial dividiendo el código en fragmentos (chunks) bajo demanda. | Exige disciplina en la sintaxis de las rutas para evitar romper la carga diferida. | **Seleccionada** por su perfecta sinergia con la arquitectura modular y su alto rendimiento. |

## Decisión
Utilizaremos Vue Router como herramienta para el manejo de rutas. 
Además, establecemos como regla estricta utilizar Lazy Loading como técnica de optimización, ya que retrasa la descarga de recursos o código hasta el momento exacto en que el usuario los necesita.

## Consecuencias
- **Positivas:** La aplicación cargará muchísimo más rápido al inicio, ya que el navegador solo descargará el código del módulo que el usuario está visitando en ese momento. Se alinea perfectamente con nuestra decisión previa (ADR 0004) de separar el proyecto en módulos independientes.
- **Negativa:** Exige prestar atención al momento de registrar una nueva ruta para asegurarse de usar la importación dinámica; si un desarrollador importa la vista de manera normal arriba del archivo, rompe el beneficio de la carga diferida.
- **Deuda asumida:** Monitorear el tamaño de los chunks generados en compilaciones de producción.