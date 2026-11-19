# ADR-003: Estructura de carpetas basada en módulos en el Frontend

- **Estado:** Aceptado
- **Fecha:** 2026-08-31
- **Autor:** Gonzalo Lima
- **Sprint:** 1

## Contexto
Necesitamos definir cómo organizar los archivos de Vue desde el principio para evitar que el repositorio se vuelva un desorden. El proyecto está configurado con Vite, TypeScript y Tailwind CSS.

## Alternativas consideradas

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **Estructura plana por tipo de archivo** | Familiar en proyectos pequeños o aplicaciones simples. | Los archivos de una misma funcionalidad quedan dispersos por todo el repositorio a medida que este crece. | Dificulta la mantenibilidad y la asignación de tareas por módulos funcionales. |
| **Estructura basada en características** | Agrupa componentes, vistas y lógica estrictamente por dominio de negocio de forma aislada. | Puede generar duplicación de elementos genéricos si no se separa adecuadamente lo compartido. | Muy rígida para una SPA de tamaño mediano con vistas administrativas y de socio cruzadas. |
| **Estructura modular híbrida** | Agrupa por negocio en `modules/`, aislando lo genérico en `common/` y centralizando estado y rutas. | Exige acuerdos previos sobre qué va en `common/` y qué pertenece a un módulo específico. | **Seleccionada** por su equilibrio perfecto entre escalabilidad, orden y cohesión. |

## Decisión
La estructura base será la siguiente, todo dentro de la carpeta `src/`:
* `modules/`: Código agrupado por módulos del negocio.
* `common/`: Componentes genéricos como botones, layouts y utilidades que se comparten en toda la aplicación.
* `store/`: Archivos de estado global.
* `router/`: Configuración de las rutas y navegación.
* `assets/`: Archivos estáticos como imágenes.

## Consecuencias
- **Positivas:** El proyecto escala mucho mejor. Si alguien tiene que trabajar en una funcionalidad específica, sabe exactamente en qué carpeta de `modules/` mirar sin saltar por todo el repositorio.
- **Negativa:** Exige mayor disciplina del equipo para definir correctamente los límites de cada módulo y debatir constantemente qué cosas son de uso general (`common/`) y qué cosas pertenecen a un solo módulo.
- **Deuda asumida:** Refactorizar componentes que inicialmente se crearon como genéricos si su uso pasa a ser exclusivo de un solo módulo.
