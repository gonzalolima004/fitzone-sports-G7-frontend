<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  PhArrowRight,
  PhBuildings,
  PhCalendarCheck,
  PhChartBar,
  PhChartLineUp,
  PhCourtBasketball,
  PhCurrencyDollar,
  PhIdentificationCard,
  PhMedal,
} from '@phosphor-icons/vue'
import { useSedeStore } from '@/store/sede'
import {
  formatearFechaDDMMAAAA,
  obtenerFechaLocalISO,
} from '@/common/utils/date-formatter'
import {
  obtenerIngresos,
  obtenerOcupacion,
} from '@/modules/M6-reportes/services/reportes.service'
import EncabezadoGerencia from '../components/EncabezadoGerencia.vue'
import IndicadorGerencia from '../components/IndicadorGerencia.vue'
import { planesService } from '../services/planes.service'
import { formatearMoneda } from '../utils/formato'

const sedeStore = useSedeStore()

const hoy = new Date()
const fechaHoy = obtenerFechaLocalISO(hoy)
const inicioDeMes = obtenerFechaLocalISO(
  new Date(hoy.getFullYear(), hoy.getMonth(), 1)
)

const cargandoSedes = ref(true)

const totalPlanes = ref(0)
const cargandoPlanes = ref(true)
const errorPlanes = ref(false)

const ingresosDelMes = ref(0)
const cargandoIngresos = ref(true)
const errorIngresos = ref(false)

const reservasDeHoy = ref(0)
const cargandoReservas = ref(true)
const errorReservas = ref(false)

const totalSedes = computed(() => sedeStore.sedes.length)

const accesos = [
  {
    titulo: 'Sedes',
    descripcion: 'Alta, modificación y baja de sedes y ciudades.',
    ruta: '/gerencia/sedes',
    icono: PhBuildings,
  },
  {
    titulo: 'Planes de membresía',
    descripcion: 'Nombre, duración y precio de cada plan.',
    ruta: '/gerencia/planes',
    icono: PhMedal,
  },
  {
    titulo: 'Membresías de socios',
    descripcion: 'Plan, vigencia, estado y renovación de cada socio.',
    ruta: '/gerencia/membresias',
    icono: PhIdentificationCard,
  },
  {
    titulo: 'Canchas',
    descripcion: 'Inventario, tarifas y mantenimiento por sede.',
    ruta: '/gerencia/canchas',
    icono: PhCourtBasketball,
  },
  {
    titulo: 'Reporte de ingresos',
    descripcion: 'Ingresos por período, sede y concepto.',
    ruta: '/gerencia/reportes',
    icono: PhChartLineUp,
  },
  {
    titulo: 'Ocupación y reservas',
    descripcion: 'Asistencias y reservas de canchas y clases.',
    ruta: '/gerencia/reportes/ocupacion',
    icono: PhChartBar,
  },
] as const

async function cargarSedes() {
  cargandoSedes.value = true
  await sedeStore.cargarSedes()
  cargandoSedes.value = false
}

async function cargarPlanes() {
  try {
    totalPlanes.value = (await planesService.listar()).length
  } catch {
    errorPlanes.value = true
  } finally {
    cargandoPlanes.value = false
  }
}

async function cargarIngresosDelMes() {
  try {
    const reporte = await obtenerIngresos({
      fecha_desde: inicioDeMes,
      fecha_hasta: fechaHoy,
    })
    ingresosDelMes.value = reporte.total_ingresos
  } catch {
    errorIngresos.value = true
  } finally {
    cargandoIngresos.value = false
  }
}

async function cargarReservasDeHoy() {
  try {
    const reporte = await obtenerOcupacion({
      fecha_desde: fechaHoy,
      fecha_hasta: fechaHoy,
    })
    reservasDeHoy.value = reporte.sedes.reduce(
      (total, sede) =>
        total + sede.total_reservas_canchas + sede.total_reservas_clases,
      0
    )
  } catch {
    errorReservas.value = true
  } finally {
    cargandoReservas.value = false
  }
}

onMounted(() => {
  // Cada indicador carga por separado: si uno falla, los demás se muestran.
  void Promise.allSettled([
    cargarSedes(),
    cargarPlanes(),
    cargarIngresosDelMes(),
    cargarReservasDeHoy(),
  ])
})
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    <EncabezadoGerencia
      titulo="Panel de gerencia"
      descripcion="Resumen de la cadena y accesos a la administración de sedes, planes, canchas y reportes."
      etiqueta="Gerente Central"
      :mostrar-volver="false"
    />

    <section
      aria-label="Indicadores de la cadena"
      class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3"
    >
      <IndicadorGerencia
        titulo="Sedes activas"
        :valor="String(totalSedes)"
        detalle="En toda la cadena"
        :cargando="cargandoSedes"
        :error="!!sedeStore.error"
      >
        <template #icono>
          <PhBuildings :size="22" weight="bold" />
        </template>
      </IndicadorGerencia>
      <IndicadorGerencia
        titulo="Planes en catálogo"
        :valor="String(totalPlanes)"
        detalle="Disponibles para contratar"
        :cargando="cargandoPlanes"
        :error="errorPlanes"
      >
        <template #icono>
          <PhMedal :size="22" weight="bold" />
        </template>
      </IndicadorGerencia>
      <IndicadorGerencia
        titulo="Ingresos del mes"
        :valor="formatearMoneda(ingresosDelMes)"
        :detalle="`Desde el ${formatearFechaDDMMAAAA(inicioDeMes)}`"
        :cargando="cargandoIngresos"
        :error="errorIngresos"
      >
        <template #icono>
          <PhCurrencyDollar :size="22" weight="bold" />
        </template>
      </IndicadorGerencia>
      <IndicadorGerencia
        titulo="Reservas de hoy"
        :valor="String(reservasDeHoy)"
        detalle="Canchas y clases confirmadas"
        :cargando="cargandoReservas"
        :error="errorReservas"
      >
        <template #icono>
          <PhCalendarCheck :size="22" weight="bold" />
        </template>
      </IndicadorGerencia>
    </section>

    <section aria-labelledby="titulo-accesos" class="space-y-3">
      <h2 id="titulo-accesos" class="text-base font-bold text-[#202759]">
        Administración
      </h2>
      <nav class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <RouterLink
          v-for="acceso in accesos"
          :key="acceso.ruta"
          :to="acceso.ruta"
          class="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-[#202759]/40 hover:shadow-sm transition-all flex flex-col gap-3"
        >
          <div class="flex items-center justify-between">
            <div
              class="w-10 h-10 rounded-xl bg-[#F96167]/10 text-[#F96167] flex items-center justify-center"
            >
              <component :is="acceso.icono" :size="20" weight="bold" />
            </div>
            <PhArrowRight
              :size="18"
              class="text-slate-300 group-hover:text-[#202759] group-hover:translate-x-0.5 transition-all"
            />
          </div>
          <div>
            <h3 class="text-sm font-bold text-[#202759] m-0">
              {{ acceso.titulo }}
            </h3>
            <p class="text-xs text-slate-500 mt-1 m-0">
              {{ acceso.descripcion }}
            </p>
          </div>
        </RouterLink>
      </nav>
    </section>
  </div>
</template>
