<script setup lang="ts">
import { onMounted, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSedeStore } from '@/store/sede'
import { useAforo } from '../composables/useAforo'
import ValidacionAcceso from '../components/ValidacionAcceso.vue'
import IndicadorAforo from '../components/IndicadorAforo.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import BaseSkeleton from '@/common/components/BaseSkeleton.vue'
import { PhArrowsClockwise, PhWarning, PhUsers } from '@phosphor-icons/vue'

const sedeStore = useSedeStore()
const { idSedeSeleccionada, versionContexto } = storeToRefs(sedeStore)
const sedeIdSeguro = computed(() => idSedeSeleccionada.value as number)
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

// Recarga automática al cambiar de sede o contexto
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
  <div class="space-y-6 p-4 max-w-6xl mx-auto">
    <!-- Header del Recepcionista -->
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
    >
      <div>
        <h2
          class="text-xl font-extrabold text-[#202759] m-0 flex items-center gap-2"
        >
          <PhUsers :size="24" class="text-[#f43f5e]" />
          <span>Monitor de Recepción y Aforo</span>
        </h2>
        <p class="text-xs text-slate-500 mt-1 m-0">
          Sede activa:
          <strong class="text-[#202759]">{{
            sedeStore.sedeSeleccionada?.nombre ?? 'Seleccione una sede'
          }}</strong>
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
        Actualizar Aforo
      </BaseButton>
    </div>

    <!-- Aviso de Datos Desactualizados / Sin Conexión -->
    <div
      v-if="!online || datosDesactualizados"
      class="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2"
    >
      <PhWarning :size="18" weight="bold" />
      <span
        >Estás sin conexión o los datos de aforo pueden estar desactualizados.
        Se reintentará al recuperar la red.</span
      >
    </div>

    <!-- Estado de Carga del Aforo -->
    <div v-if="cargando && !aforo.maximo" class="grid grid-cols-1 gap-4">
      <BaseSkeleton height="140px" rounded="2xl" />
    </div>

    <!-- Estado de Error -->
    <div
      v-else-if="error"
      class="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-[#F96167]"
    >
      {{ error }}
    </div>

    <!-- Indicador de Aforo en Tiempo Real-->
    <div
      v-else
      class="bg-white rounded-2xl border border-slate-200 shadow-sm p-2"
    >
      <IndicadorAforo :actual="aforo.actual" :maximo="aforo.maximo" />
    </div>

    <!-- Panel Operativo de Validación de Accesos (Ingresos y Egresos) -->
    <ValidacionAcceso />
  </div>
</template>
