<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { PhCaretLeft } from '@phosphor-icons/vue'

interface Props {
  titulo: string
  descripcion?: string
  etiqueta?: string
  mostrarVolver?: boolean
}

withDefaults(defineProps<Props>(), {
  descripcion: '',
  etiqueta: '',
  mostrarVolver: true,
})
</script>

<template>
  <header
    class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-4 border-b border-slate-200"
  >
    <div>
      <RouterLink
        v-if="mostrarVolver"
        to="/gerencia"
        class="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-[#202759] transition-colors"
      >
        <PhCaretLeft :size="14" weight="bold" />
        Panel de gerencia
      </RouterLink>
      <div class="flex items-center gap-2 mt-1">
        <span
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#202759]/10 text-[#202759]"
        >
          Módulo Gerencia
        </span>
        <span v-if="etiqueta" class="text-xs text-slate-400 font-medium">
          {{ etiqueta }}
        </span>
      </div>
      <h1 class="text-2xl font-bold text-[#202759] tracking-tight mt-1">
        {{ titulo }}
      </h1>
      <p v-if="descripcion" class="text-xs sm:text-sm text-slate-500 mt-0.5">
        {{ descripcion }}
      </p>
    </div>

    <div v-if="$slots.acciones" class="flex flex-wrap items-center gap-3">
      <slot name="acciones" />
    </div>
  </header>
</template>
