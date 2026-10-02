# 3. Estructura de carpetas en el Frontend

Fecha: 2026-08-31
Estado: Aceptado

## Contexto
Necesitamos definir cómo organizar los archivos de Vue desde el principio para evitar que el repositorio se vuelva un desorden. El proyecto está configurado con Vite, TypeScript y Tailwind CSS.

## Decisión
La estructura base será la siguiente, todo dentro de la carpeta `src/`:
* `modules/`: Código agrupado por módulos del negocio.
* `common/`: Componentes genéricos como botones, layouts y utilidades que se comparten en toda la aplicación.
* `store/`: Archivos de estado global.
* `router/`: Configuración de las rutas y navegación.
* `assets/`: Archivos estáticos como imágenes.

## Consecuencias
* **Positivas:**
  * El proyecto escala mucho mejor. Si alguien tiene que trabajar en una funcionalidad específica, sabe exactamente en qué carpeta de `modules/` mirar sin saltar por todo el repositorio.
* **Negativa:**
  * Exige mayor disciplina del equipo para definir correctamente los límites de cada módulo y debatir constantemente qué cosas son de uso general (`common/`) y qué cosas pertenecen a un solo módulo.
