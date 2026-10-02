# 3. Uso de Pinia para guardar datos globales

Fecha: 2026-08-31
Estado: Aceptado

## Contexto
A medida que la aplicación crezca, vamos a necesitar compartir datos entre pantallas que no están conectadas directamente (por ejemplo, saber quién es el usuario logueado o qué opciones eligió).

## Decisión
Vamos a instalar y usar Pinia para manejar los datos globales de la aplicación. Decidimos usar un gestor de estados y no hacerlo con las herramientas básicas de Vue.js porque miembros del grupo tenían experiencia usando Zustand.

## Consecuencias
* **Positivas:**
  * Tiene una extensión de navegador excelente que nos permite ver los datos en vivo y encontrar bugs muy rápido.
  * Es muy fácil de aprender.
* **Negativas:**
  * Tenemos que dedicarle un poco de tiempo inicial a leer la documentación para entender cómo organizar los archivos y cómo hacerles pruebas.