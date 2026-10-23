<script setup lang="ts">
import { computed } from 'vue'
import {
  PhPencilSimple,
  PhWrench,
  PhTrash,
  PhBuildings,
  PhCircle,
} from '@phosphor-icons/vue'
import BaseButton from '@/common/components/BaseButton.vue'
import type { Cancha } from '../types/canchas.types'

interface Props {
  cancha: Cancha
  nombreSede?: string
  nombreTipo?: string
}

const props = withDefaults(defineProps<Props>(), {
  nombreSede: 'Sede no asignada',
  nombreTipo: 'General',
})

const emit = defineEmits<{
  (e: 'editar', cancha: Cancha): void
  (e: 'mantenimiento', cancha: Cancha): void
  (e: 'eliminar', cancha: Cancha): void
}>()

const tipoEtiqueta = computed(() => {
  return props.cancha.cancha_tipo?.descripcion || props.nombreTipo || 'Cancha'
})

function formatoMoneda(valor: number): string {
  if (valor === undefined || valor === null || isNaN(valor)) return '$ 0'
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(valor)
}
</script>

<template>
  <div
    class="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
    :class="{
      'opacity-85 border-slate-200 bg-slate-50/50': cancha.disponible === false,
    }"
  >
    <!-- Contenido Superior -->
    <div class="p-5 space-y-4">
      <!-- Encabezado de la tarjeta: Badges y Estado -->
      <div class="flex items-center justify-between gap-2">
        <!-- Badge de Tipo / Disciplina -->
        <span
          class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-100 text-[#202759]"
        >
          {{ tipoEtiqueta }}
        </span>

        <!-- Badge de Estado Operativo (Disponible / No disponible) -->
        <span
          class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
          :class="
            cancha.disponible !== false
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          "
        >
          <PhCircle
            :size="8"
            weight="fill"
            :class="
              cancha.disponible !== false
                ? 'text-emerald-500'
                : 'text-amber-500'
            "
          />
          {{ cancha.disponible !== false ? 'Disponible' : 'No disponible' }}
        </span>
      </div>

      <!-- Nombre de la Cancha -->
      <div>
        <h3
          class="text-base font-bold text-[#202759] line-clamp-1"
          :title="cancha.nombre"
        >
          {{ cancha.nombre }}
        </h3>
        <!-- Sede a la que pertenece -->
        <p class="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
          <PhBuildings :size="14" class="text-slate-400 shrink-0" />
          <span class="truncate">{{ nombreSede }}</span>
        </p>
      </div>

      <!-- Tarifa / Costo Base -->
      <div
        class="pt-2 border-t border-slate-100 flex items-baseline justify-between"
      >
        <span class="text-xs text-slate-500">Costo base</span>
        <div class="text-right">
          <span class="text-lg font-bold text-[#202759] tabular-nums font-mono">
            {{ formatoMoneda(cancha.costo_base) }}
          </span>
          <span class="text-xs text-slate-400 ml-1">/ hora</span>
        </div>
      </div>
    </div>

    <!-- Barra de Acciones Inferior -->
    <div
      class="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2"
    >
      <!-- Mantenimiento -->
      <BaseButton
        variant="outline"
        size="sm"
        title="Programar mantenimiento"
        @click="emit('mantenimiento', cancha)"
      >
        <template #icon>
          <PhWrench :size="14" />
        </template>
        Mantenimiento
      </BaseButton>

      <div class="flex items-center gap-2">
        <!-- Editar -->
        <BaseButton
          variant="ghost"
          size="sm"
          title="Editar cancha"
          @click="emit('editar', cancha)"
        >
          <template #icon>
            <PhPencilSimple :size="15" />
          </template>
          Editar
        </BaseButton>

        <!-- Baja / Eliminar -->
        <BaseButton
          variant="danger-outline"
          size="sm"
          title="Eliminar o dar de baja cancha"
          @click="emit('eliminar', cancha)"
        >
          <template #icon>
            <PhTrash :size="15" />
          </template>
        </BaseButton>
      </div>
    </div>
  </div>
</template>
