# ADR-005: Utilización de Tailwind CSS para el diseño y estilos de la aplicación

- **Estado:** Aceptado
- **Fecha:** 2026-08-31
- **Autor:** Gonzalo Lima
- **Sprint:** 1

## Contexto
Tenemos que definir cómo vamos a manejar los estilos de la aplicación. Escribir CSS puro nos obligaría a crear un archivo `.css` por cada componente (lo que haría que la estructura se parezca un poco a la de Angular) o, a tener un archivo CSS global por cada módulo, lo cual se volvería un desorden enorme y muy difícil de mantener a medida que el proyecto crezca.

| Alternativa | A favor | En contra | Por qué se descartó |
|---|---|---|---|
| **CSS Modules / Archivos `.css` por componente** | Estilos completamente aislados y sintaxis de CSS tradicional conocida. | Genera una cantidad excesiva de archivos individuales y dificulta mantener una consistencia visual global. | Vuelve el mantenimiento de estilos tedioso y propenso a duplicación de código. |
| **Librerías de componentes UI preconstruidas (ej. Vuetify / BootstrapVue)** | Componentes listos para usar (botones, modales, tablas). | Restringe severamente la personalización visual y acopla el diseño a los patrones predeterminados de la librería. | Limita la libertad de diseño responsive exigida por el portal del socio. |
| **Tailwind CSS (Utility-first)** | Permite aplicar estilos directamente mediante clases utilitarias, evitando crear decenas de archivos CSS separados y previniendo conflictos globales. | Los miembros habituados a enfoques tradicionales o basados en Angular deben superar una curva inicial de aprendizaje. | **Seleccionada** por su rapidez de desarrollo, diseño adaptativo y limpieza estructural en el código. |

## Decisión
Vamos a instalar y usar Tailwind CSS como nuestro framework de estilos principal. Nos permite aplicar los estilos directamente en el HTML dentro del mismo archivo del componente.

## Consecuencias
- **Positivas:** Nos ahorramos crear, nombrar y mantener decenas de archivos `.css` separados. Evita estilos globales que se pisan entre distintos módulos.
- **Negativa:** Como unos miembros del equipo están acostumbrados a usar Angular junto a un archivo .css por componente, deben de aprender a usar este framework.
- **Deuda asumida:** Mantener componentes limpios extrayendo clases repetitivas mediante directivas o componentes reutilizables si el marcado HTML se vuelve muy extenso.

## Requisitos relacionados
Unidad IV.