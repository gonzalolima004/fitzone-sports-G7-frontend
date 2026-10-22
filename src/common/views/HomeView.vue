<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useSedeStore } from '../../store/sede'
import { useAuthStore } from '../../store/auth'

const sedeStore = useSedeStore()
const authStore = useAuthStore()
const esGerencia = computed(() => authStore.rol === 'gerente')
</script>

<template>
  <section class="space-y-6">
    <header>
      <h1 class="text-2xl font-bold text-slate-800">
        {{ esGerencia ? 'Gestión de sedes' : 'Dashboard' }}
      </h1>
      <p v-if="sedeStore.sedeSeleccionada" class="mt-2 text-slate-600">
        Sede activa: <strong>{{ sedeStore.sedeSeleccionada.nombre }}</strong>
      </p>
    </header>
    <div v-if="esGerencia" class="space-y-4">
      <p class="text-slate-600">
        Abrí un reporte para consultar una sede o consolidar todas. Cada reporte
        tiene sus propios filtros.
      </p>
      <div class="grid gap-4 md:grid-cols-2">
        <RouterLink
          :to="{ name: 'reportes' }"
          class="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-[#202759] focus-visible:outline-2 focus-visible:outline-[#202759]"
        >
          <h2 class="text-xl font-bold text-[#202759]">Ingresos por sede</h2>
          <p class="mt-2 text-slate-600">
            Consultá ingresos por período, sede y concepto de cobro.
          </p>
          <span class="mt-4 block font-semibold text-[#202759]"
            >Ver ingresos →</span
          >
        </RouterLink>
        <RouterLink
          :to="{ name: 'reportes-ocupacion' }"
          class="rounded-xl border border-slate-200 bg-white p-6 transition hover:border-[#202759] focus-visible:outline-2 focus-visible:outline-[#202759]"
        >
          <h2 class="text-xl font-bold text-[#202759]">Ocupación y reservas</h2>
          <p class="mt-2 text-slate-600">
            Revisá asistencias y reservas de clases y canchas por período.
          </p>
          <span class="mt-4 block font-semibold text-[#202759]"
            >Ver actividad →</span
          >
        </RouterLink>
      </div>
    </div>
  </section>
</template>
