<script setup lang="ts">
import {
  PhMagnifyingGlass,
  PhPlus,
  PhSlidersHorizontal,
  PhTag,
} from '@phosphor-icons/vue'
import BaseButton from '@/common/components/BaseButton.vue'
import type { CanchaTipo } from '../types/canchas.types'

interface SedeOpcion {
  id_sede: number
  nombre: string
}

interface Props {
  sedes: SedeOpcion[]
  tiposCancha: CanchaTipo[]
  sedeId: number | ''
  tipoId: number | ''
  estado: 'todas' | 'disponibles' | 'no_disponibles'
  busqueda: string
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:sedeId', value: number | ''): void
  (e: 'update:tipoId', value: number | ''): void
  (e: 'update:estado', value: 'todas' | 'disponibles' | 'no_disponibles'): void
  (e: 'update:busqueda', value: string): void
  (e: 'crearCancha'): void
  (e: 'gestionarTipos'): void
}>()
</script>

<template>
  <div
    class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4"
  >
    <!-- Fila superior: Búsqueda y Botones de Acción -->
    <div
      class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
    >
      <!-- Input de búsqueda por texto -->
      <div class="relative flex-1">
        <PhMagnifyingGlass
          :size="18"
          class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          :value="busqueda"
          type="text"
          placeholder="Buscar cancha por nombre..."
          class="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#202759]/20 focus:border-[#202759] transition-all placeholder:text-slate-400"
          @input="
            emit('update:busqueda', ($event.target as HTMLInputElement).value)
          "
        />
      </div>

      <!-- Acciones de Cabecera -->
      <div class="flex items-center gap-2 shrink-0">
        <!-- Botón Gestionar Tipos -->
        <BaseButton
          variant="outline"
          size="md"
          title="Administrar tipos de canchas y deportes"
          @click="emit('gestionarTipos')"
        >
          <template #icon>
            <PhTag :size="16" />
          </template>
          Tipos de Cancha
        </BaseButton>

        <!-- Botón Nueva Cancha -->
        <BaseButton variant="primary" size="md" @click="emit('crearCancha')">
          <template #icon>
            <PhPlus :size="16" weight="bold" />
          </template>
          Nueva Cancha
        </BaseButton>
      </div>
    </div>

    <!-- Fila inferior: Filtros desplegables -->
    <div
      class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100"
    >
      <!-- Selector de Sede -->
      <div class="flex flex-col gap-1.5">
        <label
          class="text-xs font-semibold text-slate-600 flex items-center gap-1.5"
        >
          <PhSlidersHorizontal :size="14" class="text-slate-400" />
          Sede
        </label>
        <select
          :value="sedeId"
          class="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#202759]/20 focus:border-[#202759] transition-all text-slate-700"
          @change="
            emit(
              'update:sedeId',
              ($event.target as HTMLSelectElement).value === ''
                ? ''
                : Number(($event.target as HTMLSelectElement).value)
            )
          "
        >
          <option value="">Todas las sedes</option>
          <option
            v-for="sede in sedes"
            :key="sede.id_sede"
            :value="sede.id_sede"
          >
            {{ sede.nombre }}
          </option>
        </select>
      </div>

      <!-- Selector de Tipo de Cancha / Deporte -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-600">
          Tipo de Cancha
        </label>
        <select
          :value="tipoId"
          class="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#202759]/20 focus:border-[#202759] transition-all text-slate-700"
          @change="
            emit(
              'update:tipoId',
              ($event.target as HTMLSelectElement).value === ''
                ? ''
                : Number(($event.target as HTMLSelectElement).value)
            )
          "
        >
          <option value="">Todos los tipos</option>
          <option
            v-for="tipo in tiposCancha"
            :key="tipo.id_cancha_tipo"
            :value="tipo.id_cancha_tipo"
          >
            {{ tipo.descripcion || `Tipo #${tipo.id_cancha_tipo}` }}
          </option>
        </select>
      </div>

      <!-- Selector de Estado -->
      <div class="flex flex-col gap-1.5">
        <label class="text-xs font-semibold text-slate-600">
          Disponibilidad
        </label>
        <select
          :value="estado"
          class="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#202759]/20 focus:border-[#202759] transition-all text-slate-700"
          @change="
            emit(
              'update:estado',
              ($event.target as HTMLSelectElement).value as
                'todas' | 'disponibles' | 'no_disponibles'
            )
          "
        >
          <option value="todas">Todos los estados</option>
          <option value="disponibles">Solo disponibles</option>
          <option value="no_disponibles">No disponibles</option>
        </select>
      </div>
    </div>
  </div>
</template>
