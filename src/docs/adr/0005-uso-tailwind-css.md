# 5. Uso de Tailwind CSS para los estilos

Fecha: 2026-08-31
Estado: Aceptado

## Contexto
Tenemos que definir cómo vamos a manejar los estilos de la aplicación. Escribir CSS puro nos obligaría a crear un archivo `.css` por cada componente (lo que haría que la estructura se parezca un poco a la de Angular) o, a tener un archivo CSS global por cada módulo, lo cual se volvería un desorden enorme y muy difícil de mantener a medida que el proyecto crezca.

## Decisión
Vamos a instalar y usar Tailwind CSS como nuestro framework de estilos principal. Nos permite aplicar los estilos directamente en el HTML dentro del mismo archivo del componente.

## Consecuencias
* **Positivas:**
  * Nos ahorramos crear, nombrar y mantener decenas de archivos `.css` separados.
  * Evita estilos globales que se pisan entre distintos módulos.
* **Negativa:**
  * Como unos miembros del equipo están acostumbrados a usar Angular junto a un archivo .css por componente, deben de aprender a usar este framework.