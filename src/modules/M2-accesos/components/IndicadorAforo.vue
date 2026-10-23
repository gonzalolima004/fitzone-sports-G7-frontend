<script setup lang="ts">
import { computed } from 'vue'
import { PhUsers, PhWarning } from '@phosphor-icons/vue'

interface Props {
  actual?: number
  maximo?: number
}

const props = withDefaults(defineProps<Props>(), {
  actual: 0,
  maximo: 100,
})

const porcentajeOcupacion = computed(() => {
  if (props.maximo === 0) return 0
  return Math.round((props.actual / props.maximo) * 100)
})

const estaAlLimite = computed(() => porcentajeOcupacion.value >= 90)

const estadoColorClass = computed(() => {
  if (porcentajeOcupacion.value >= 90)
    return 'text-[#F96167] bg-rose-50 border-rose-200'
  if (porcentajeOcupacion.value >= 75)
    return 'text-amber-600 bg-amber-50 border-amber-200'
  return 'text-[#202759] bg-slate-50 border-slate-200'
})
</script>

<template>
  <div
    class="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col gap-4 select-none"
  >
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-xl bg-[#202759]/5 flex items-center justify-center text-[#202759]"
        >
          <PhUsers :size="22" weight="bold" />
        </div>
        <div>
          <h4 class="text-sm font-bold text-[#202759] m-0">
            Aforo Actual en Sede
          </h4>
          <span class="text-xs text-slate-500">Monitoreo en tiempo real</span>
        </div>
      </div>
      <div
        class="px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5"
        :class="estadoColorClass"
      >
        <PhWarning v-if="estaAlLimite" :size="14" weight="bold" />
        <span>{{ porcentajeOcupacion }}% Ocupación</span>
      </div>
    </div>

    <!-- Indicador numérico principal -->
    <div class="flex items-baseline gap-2 pt-2">
      <span class="text-4xl font-extrabold text-[#202759]">{{ actual }}</span>
      <span class="text-sm font-medium text-slate-400"
        >/ {{ maximo }} personas permitidas</span
      >
    </div>

    <!-- Barra de progreso visual -->
    <div class="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
      <div
        class="h-full transition-all duration-500 rounded-full"
        :class="porcentajeOcupacion >= 90 ? 'bg-[#F96167]' : 'bg-[#202759]'"
        :style="{ width: `${Math.min(porcentajeOcupacion, 100)}%` }"
      ></div>
    </div>

    <p
      v-if="estaAlLimite"
      class="text-xs text-[#F96167] font-medium m-0 flex items-center gap-1"
    >
      <PhWarning :size="14" weight="bold" />
      ¡Atención! La sede ha alcanzado o está próxima a su capacidad máxima.
    </p>
  </div>
</template>
