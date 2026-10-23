<script setup lang="ts">
import { onMounted, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSedeStore } from '@/store/sede'
import { useAforo } from '../composables/useAforo'
import IndicadorAforo from '../components/IndicadorAforo.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import BaseSkeleton from '@/common/components/BaseSkeleton.vue'
import { PhArrowsClockwise, PhWarning } from '@phosphor-icons/vue'

const sedeStore = useSedeStore()
const { idSedeSeleccionada, versionContexto } = storeToRefs(sedeStore)

// Creamos un valor seguro garantizado como number (evitando el null) y lo usamos
const sedeIdSeguro = computed(() => idSedeSeleccionada.value ?? 1)
const {
  aforo,
  cargando,
  error,
  online,
  datosDesactualizados,
  obtenerAforo,
  iniciarEscuchaTiempoReal,
  detenerEscuchaTiempoReal,
} = useAforo(sedeIdSeguro)

// Recargar automática
watch([idSedeSeleccionada, versionContexto], () => {
  if (idSedeSeleccionada.value) {
    detenerEscuchaTiempoReal()
    iniciarEscuchaTiempoReal(idSedeSeleccionada.value)
  }
})

onMounted(async () => {
  if (sedeStore.sedes.length === 0) {
    await sedeStore.cargarSedes()
  }
  iniciarEscuchaTiempoReal(sedeIdSeguro.value)
})
</script>

<template>
  <div class="space-y-6 p-6 max-w-4xl mx-auto">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-extrabold text-[#202759] m-0">
          Monitor de Aforo
        </h2>
        <p class="text-xs text-slate-500 m-1">
          Control de capacidad y ocupación en tiempo real para recepción.
        </p>
      </div>
      <BaseButton
        variant="outline"
        size="sm"
        :loading="cargando"
        @click="() => idSedeSeleccionada && obtenerAforo(idSedeSeleccionada)"
      >
        <template #icon>
          <PhArrowsClockwise :size="16" weight="bold" />
        </template>
        Actualizar
      </BaseButton>
    </div>

    <!-- Aviso de Datos Desactualizados / Sin Conexión -->
    <div
      v-if="!online || datosDesactualizados"
      class="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2"
    >
      <PhWarning :size="18" weight="bold" />
      <span
        >Estás sin conexión o los datos mostrados pueden estar desactualizados.
        Se reintentará al recuperar la red.</span
      >
    </div>

    <!-- Estado de Carga -->
    <div v-if="cargando && !aforo.maximo" class="grid grid-cols-1 gap-4">
      <BaseSkeleton height="160px" rounded="2xl" />
    </div>

    <!-- Estado de Error -->
    <div
      v-else-if="error"
      class="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-[#F96167]"
    >
      {{ error }}
    </div>

    <!-- Visualización del Aforo -->
    <div v-else>
      <IndicadorAforo :actual="aforo.actual" :maximo="aforo.maximo" />
    </div>
  </div>
</template>
