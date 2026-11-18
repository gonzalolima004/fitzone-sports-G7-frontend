<script setup lang="ts">
import BaseSkeleton from '@/common/components/BaseSkeleton.vue'

/** Indicador numérico del dashboard con estados de carga y error. */
interface Props {
  titulo: string
  valor: string
  detalle?: string
  cargando: boolean
  error?: boolean
  /** Color del borde izquierdo, como en la maqueta del dashboard ejecutivo. */
  acento?: 'azul' | 'coral' | 'verde' | 'ambar'
}

withDefaults(defineProps<Props>(), {
  detalle: '',
  error: false,
  acento: 'azul',
})

const BORDES: Record<NonNullable<Props['acento']>, string> = {
  azul: 'border-l-[#202759]',
  coral: 'border-l-[#F96167]',
  verde: 'border-l-emerald-500',
  ambar: 'border-l-amber-500',
}
</script>

<template>
  <article
    class="p-4 bg-white rounded-2xl border border-slate-200 border-l-4 flex items-center gap-3"
    :class="BORDES[acento]"
    :aria-busy="cargando"
  >
    <div
      class="w-11 h-11 rounded-xl bg-[#202759]/10 text-[#202759] flex items-center justify-center shrink-0"
    >
      <slot name="icono" />
    </div>
    <div class="min-w-0">
      <h2 class="text-[11px] uppercase font-bold text-slate-400 m-0">
        {{ titulo }}
      </h2>
      <BaseSkeleton v-if="cargando" width="w-20" height="h-7" class="mt-1" />
      <template v-else-if="error">
        <p class="text-xl font-bold text-slate-300 m-0">—</p>
        <p class="text-[11px] text-rose-600 m-0">No disponible</p>
      </template>
      <template v-else>
        <p
          class="text-xl font-bold text-[#202759] tabular-nums truncate m-0"
          data-testid="valor-indicador"
        >
          {{ valor }}
        </p>
        <p v-if="detalle" class="text-[11px] text-slate-500 m-0">
          {{ detalle }}
        </p>
      </template>
    </div>
  </article>
</template>
