# 🎨 Componentes Compartidos de la Interfaz (UI Base)

Este directorio contiene los componentes atómicos y reutilizables de **FitZone Sports**. Están diseñados siguiendo la paleta oficial del proyecto, con fondos claros y bordes redondeados modernos:
- **Color Principal:** `#202759` (Azul Noche / Deep Navy)
- **Color Secundario / Acento:** `#F96167` (Coral Cálido)
- **Superficies:** Fondos claros (`#ffffff` y `#f4f6fa`), sin modo oscuro.

---

## 🔘 1. BaseButton (`BaseButton.vue`)

Botón estándar con soporte para variantes, tamaños y estado de carga animado (*spinner*).

### Props

| Prop | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'danger-outline' \| 'outline' \| 'ghost'` | `'primary'` | Estilo visual del botón (`primary` = `#202759`, `secondary` = `#F96167`, `danger` = Rojo, `danger-outline` = Borde rojo). |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Tamaño y espaciado del botón. |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Tipo nativo del botón HTML. |
| `disabled` | `boolean` | `false` | Deshabilita la interacción visual y funcional. |
| `loading` | `boolean` | `false` | Muestra un spinner animado y bloquea los clics. |

### Eventos (Emits)

| Evento | Parámetro | Descripción |
|---|---|---|
| `@click` | `MouseEvent` | Se emite al hacer clic (ignorado si está en `loading` o `disabled`). |

### Ejemplo de uso

```vue
<script setup lang="ts">
import BaseButton from '@/common/components/BaseButton.vue'
</script>

<template>
  <!-- Botón Primario -->
  <BaseButton variant="primary" @click="guardar">
    Guardar cambios
  </BaseButton>

  <!-- Botón Secundario con estado de carga -->
  <BaseButton variant="secondary" :loading="cargando">
    Procesar pago
  </BaseButton>

  <!-- Botón Outline -->
  <BaseButton variant="outline" size="sm">
    Cancelar
  </BaseButton>
</template>
```

---

## 📝 2. BaseInput (`BaseInput.vue`)

Campo de texto accesible con soporte para `v-model`, mensaje de validación de error en `#F96167` y texto de ayuda.

### Props

| Prop | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `modelValue` | `string \| number` | `''` | Valor enlazado bidireccionalmente con `v-model`. |
| `label` | `string` | `''` | Texto de la etiqueta superior. |
| `type` | `string` | `'text'` | Tipo de input (`text`, `email`, `password`, `number`, `date`, etc.). |
| `placeholder` | `string` | `''` | Texto de marcador de posición. |
| `error` | `string` | `''` | Mensaje de validación de error (resalta el borde en `#F96167`). |
| `hint` | `string` | `''` | Texto secundario de ayuda debajo del campo. |
| `required` | `boolean` | `false` | Añade el asterisco `*` en `#F96167` en la etiqueta. |
| `disabled` | `boolean` | `false` | Deshabilita la edición del campo. |

### Eventos (Emits)

| Evento | Parámetro | Descripción |
|---|---|---|
| `@update:modelValue` | `string` | Actualización de valor para `v-model`. |
| `@blur` | `FocusEvent` | Se emite al perder el foco. |
| `@focus` | `FocusEvent` | Se emite al recibir el foco. |

### Ejemplo de uso

```vue
<script setup lang="ts">
import { ref } from 'vue'
import BaseInput from '@/common/components/BaseInput.vue'

const email = ref('')
const errorEmail = ref('')
</script>

<template>
  <BaseInput
    v-model="email"
    label="Correo Electrónico"
    type="email"
    placeholder="socio@fitzone.com"
    required
    :error="errorEmail"
    hint="Ingresá el correo con el que te diste de alta en la sede."
  />
</template>
```

---

## 🪟 3. BaseModal (`BaseModal.vue`)

Ventana modal con animación de entrada/salida, bloqueo de scroll en el fondo, cierre por tecla `Esc` y clic exterior.

### Props

| Prop | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `modelValue` | `boolean` | `false` | Control de apertura con `v-model`. |
| `title` | `string` | `''` | Título del encabezado del modal. |
| `subtitle` | `string` | `''` | Subtítulo descriptivo debajo del título principal. |
| `maxWidth` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Ancho máximo de la ventana modal. |
| `closeOnBackdrop` | `boolean` | `true` | Si es `true`, cierra el modal al tocar fuera. |

### Slots

| Slot | Descripción |
|---|---|
| `#title` | Personalización completa del encabezado (opcional). |
| `#default` | Contenido principal del modal. |
| `#actions` | Botones de acción inferiores con distribución y proporción 50/50 automática. |

### Eventos (Emits)

| Evento | Descripción |
|---|---|
| `@update:modelValue` | Emite `false` al cerrarse. |
| `@close` | Emite la notificación de cierre. |

### Ejemplo de uso

```vue
<script setup lang="ts">
import { ref } from 'vue'
import BaseModal from '@/common/components/BaseModal.vue'
import BaseButton from '@/common/components/BaseButton.vue'

const mostrarModal = ref(false)
</script>

<template>
  <BaseButton @click="mostrarModal = true">
    Abrir confirmación
  </BaseButton>

  <BaseModal
    v-model="mostrarModal"
    title="Editar: Cancha 1 — Fútbol 5"
    subtitle="Modificá la configuración de la cancha."
  >
    <p>Formulario de configuración de la cancha...</p>

    <template #actions>
      <BaseButton variant="danger" @click="mostrarModal = false">
        Cancelar
      </BaseButton>
      <BaseButton variant="primary" @click="confirmar">
        Guardar cambios
      </BaseButton>
    </template>
  </BaseModal>
</template>
```

---

## 🔔 4. Notificaciones Toast (Toastify)

Notificaciones emergentes automáticas para avisos de feedback inmediato (éxito, error, advertencia o información). Basado en `vue3-toastify` (equivalente en Vue de React-Toastify) con tema claro.

### Métodos disponibles

| Método | Tipo | Descripción |
|---|---|---|
| `toast.success(mensaje, opciones)` | Éxito | Muestra notificación verde de confirmación con ícono de check. |
| `toast.error(mensaje, opciones)` | Error | Muestra notificación de error con ícono de advertencia/cruz. |
| `toast.warning(mensaje, opciones)` | Advertencia | Muestra notificación amarilla con ícono de alerta. |
| `toast.info(mensaje, opciones)` | Información | Muestra notificación azul de información. |

### Ejemplo de uso

```vue
<script setup lang="ts">
import { toast } from '@/common/utils/toast'
// También es posible importar directamente:
// import { toast } from 'vue3-toastify'

function onGuardar() {
  try {
    // ... lógica de guardado
    toast.success('¡Operación realizada con éxito!')
  } catch (error) {
    toast.error('Ocurrió un error al procesar la solicitud.')
  }
}
</script>

<template>
  <button @click="onGuardar">Guardar</button>
</template>
```

---

## 💡 5. Patrón de Confirmación y Feedback (Flujo Recomendado)

Para mantener la coherencia en todos los módulos de FitZone, este es el patrón estándar acordado para el equipo:

### ⚠️ Regla de Oro: ¿Modal o Toast?
- **Usar `BaseModal` ANTES de la acción:** Obligatorio para acciones críticas o destructivas (ej: *Eliminar sede*, *Cancelar turno*, *Dar de baja socio*). Actúa como **freno de mano** para evitar errores del usuario.
- **Usar `toast` DESPUÉS de la acción:** Para avisar si la operación en el backend fue exitosa o falló. **Nunca** se usa un toast para pedir confirmación (porque desaparece solo a los 3 segundos).

### 🚀 Ejemplo Completo: Confirmar Eliminación (ej: Eliminar Sede)

Cualquier compañero puede copiar y adaptar este flujo en sus vistas:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import BaseModal from '@/common/components/BaseModal.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { toast } from '@/common/utils/toast'
import http from '@/common/api/http'

// 1. Estados reactivos de control
const modalEliminarAbierto = ref(false)
const eliminando = ref(false)
const sedeIdSeleccionada = ref<number | null>(null)

function abrirConfirmacion(idSede: number) {
  sedeIdSeleccionada.value = idSede
  modalEliminarAbierto.value = true
}

// 2. Ejecutar acción al confirmar dentro del modal
async function confirmarEliminar() {
  try {
    eliminando.value = true
    
    // Llamada a la API backend
    await http.delete(`/sedes/${sedeIdSeleccionada.value}`)

    // Éxito: cerramos el modal y notificamos con Toast
    modalEliminarAbierto.value = false
    toast.success('¡Sede eliminada con éxito!')
    
    // Aquí se refresca la lista de sedes
  } catch (error) {
    // Error: notificamos sin cerrar el modal para que el usuario pueda reintentar
    toast.error('No se pudo eliminar la sede. Verificá si tiene turnos activos.')
  } finally {
    eliminando.value = false
  }
}
</script>

<template>
  <!-- Botón disparador en la tabla o tarjeta -->
  <BaseButton
    variant="danger-outline"
    size="sm"
    @click="abrirConfirmacion(12)"
  >
    Eliminar
  </BaseButton>

  <!-- Modal de confirmación -->
  <BaseModal
    v-model="modalEliminarAbierto"
    title="¿Eliminar Sede Belgrano?"
    subtitle="Esta acción es irreversible y afectará los turnos asociados."
  >
    <p class="m-0 text-slate-600 leading-relaxed">
      ¿Estás seguro de que deseás eliminar esta sede? Se darán de baja automáticamente todas las canchas y clases programadas.
    </p>

    <template #actions>
      <!-- Botón Cancelar (Izquierda) -->
      <BaseButton
        variant="outline"
        @click="modalEliminarAbierto = false"
      >
        Cancelar
      </BaseButton>

      <!-- Botón Confirmación Destructiva (Derecha) -->
      <BaseButton
        variant="danger"
        :loading="eliminando"
        @click="confirmarEliminar"
      >
        Sí, eliminar definitivamente
      </BaseButton>
    </template>
  </BaseModal>
</template>
```


