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
  PhUsersThree,
} from '@phosphor-icons/vue'
import BaseSkeleton from '@/common/components/BaseSkeleton.vue'
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
import { membresiasService } from '../services/membresias.service'
import { sedesService } from '../services/sedes.service'
import { formatearMoneda } from '../utils/formato'
import { tieneEstado } from '../utils/membresias'
import type { Ciudad, SedeGestion } from '../types/gerencia.types'

const hoy = new Date()
const fechaHoy = obtenerFechaLocalISO(hoy)
const inicioDeMes = obtenerFechaLocalISO(
  new Date(hoy.getFullYear(), hoy.getMonth(), 1)
)

// Cada dato se carga por separado: si uno falla, el resto se muestra igual.
const sedes = ref<SedeGestion[]>([])
const ciudades = ref<Ciudad[]>([])
const cargandoSedes = ref(true)
const errorSedes = ref(false)

const sociosActivos = ref(0)
const sociosActivosPorSede = ref(new Map<number, number>())
const cargandoSocios = ref(true)
const errorSocios = ref(false)

const ingresosDelMes = ref(0)
const ingresosPorSede = ref(new Map<number, number>())
const cargandoIngresos = ref(true)
const errorIngresos = ref(false)

const reservasDeHoy = ref(0)
const cargandoReservasHoy = ref(true)
const errorReservasHoy = ref(false)

const reservasDelMesPorSede = ref(new Map<number, number>())
const cargandoReservasMes = ref(true)
const errorReservasMes = ref(false)

const aforoPorSede = ref(new Map<number, number>())
const cargandoAforo = ref(true)
const errorAforo = ref(false)

const aforoActualTotal = computed(() =>
  [...aforoPorSede.value.values()].reduce((total, valor) => total + valor, 0)
)

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
    descripcion: 'Plan, vencimiento y estado de cada socio.',
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

/** Una fila por sede para la tabla de rendimiento (null = dato no disponible). */
const filasSedes = computed(() => {
  const nombresCiudades = new Map(
    ciudades.value.map((ciudad) => [ciudad.id_ciudad, ciudad.nombre])
  )
  return [...sedes.value]
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    .map((sede) => {
      const aforoActual = aforoPorSede.value.get(sede.id_sede) ?? null
      return {
        id: sede.id_sede,
        nombre: sede.nombre,
        ciudad: nombresCiudades.get(sede.id_ciudad) ?? '—',
        socios: errorSocios.value
          ? null
          : (sociosActivosPorSede.value.get(sede.id_sede) ?? 0),
        aforoActual,
        aforoMaximo: sede.aforo_maximo,
        porcentajeAforo:
          aforoActual === null || !sede.aforo_maximo
            ? null
            : Math.round((aforoActual / sede.aforo_maximo) * 100),
        reservasDelMes: errorReservasMes.value
          ? null
          : (reservasDelMesPorSede.value.get(sede.id_sede) ?? 0),
        recaudacion: errorIngresos.value
          ? null
          : (ingresosPorSede.value.get(sede.id_sede) ?? 0),
      }
    })
})

function claseOcupacion(porcentaje: number): string {
  if (porcentaje >= 90) return 'bg-rose-50 text-rose-700 border-rose-200'
  if (porcentaje >= 70) return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-emerald-50 text-emerald-700 border-emerald-200'
}

async function cargarAforo() {
  const resultados = await Promise.allSettled(
    sedes.value.map((sede) => sedesService.obtenerAforo(sede.id_sede))
  )
  const porSede = new Map<number, number>()
  resultados.forEach((resultado, indice) => {
    if (resultado.status === 'fulfilled') {
      porSede.set(sedes.value[indice].id_sede, resultado.value.aforoActual)
    }
  })
  aforoPorSede.value = porSede
  errorAforo.value = sedes.value.length > 0 && porSede.size === 0
  cargandoAforo.value = false
}

async function cargarSedes() {
  try {
    const [listaSedes, listaCiudades] = await Promise.all([
      sedesService.listar(),
      sedesService.listarCiudades().catch(() => []),
    ])
    sedes.value = listaSedes
    ciudades.value = listaCiudades
  } catch {
    errorSedes.value = true
    errorAforo.value = true
    cargandoAforo.value = false
    return
  } finally {
    cargandoSedes.value = false
  }
  await cargarAforo()
}

/** Socios con una membresía activa y vigente, en total y por sede de origen. */
async function cargarSociosActivos() {
  try {
    const [membresias, usuarios] = await Promise.all([
      membresiasService.listar(),
      membresiasService.listarUsuarios(),
    ])
    const activos = new Set(
      membresias
        .filter(
          (membresia) =>
            tieneEstado(membresia, 'activa') &&
            membresia.fecha_fin.slice(0, 10) >= fechaHoy
        )
        .map((membresia) => membresia.id_usuario)
    )
    const sedePorUsuario = new Map(
      usuarios.map((usuario) => [usuario.id_usuario, usuario.id_sede])
    )
    const porSede = new Map<number, number>()
    for (const idUsuario of activos) {
      const idSede = sedePorUsuario.get(idUsuario)
      if (idSede != null) {
        porSede.set(idSede, (porSede.get(idSede) ?? 0) + 1)
      }
    }
    sociosActivos.value = activos.size
    sociosActivosPorSede.value = porSede
  } catch {
    errorSocios.value = true
  } finally {
    cargandoSocios.value = false
  }
}

async function cargarIngresosDelMes() {
  try {
    const reporte = await obtenerIngresos({
      fecha_desde: inicioDeMes,
      fecha_hasta: fechaHoy,
    })
    ingresosDelMes.value = reporte.total_ingresos
    ingresosPorSede.value = new Map(
      reporte.sedes.map((sede) => [sede.id_sede, sede.total_ingresos])
    )
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
    errorReservasHoy.value = true
  } finally {
    cargandoReservasHoy.value = false
  }
}

async function cargarReservasDelMes() {
  try {
    const reporte = await obtenerOcupacion({
      fecha_desde: inicioDeMes,
      fecha_hasta: fechaHoy,
    })
    reservasDelMesPorSede.value = new Map(
      reporte.sedes.map((sede) => [
        sede.id_sede,
        sede.total_reservas_canchas + sede.total_reservas_clases,
      ])
    )
  } catch {
    errorReservasMes.value = true
  } finally {
    cargandoReservasMes.value = false
  }
}

onMounted(() => {
  void Promise.allSettled([
    cargarSedes(),
    cargarSociosActivos(),
    cargarIngresosDelMes(),
    cargarReservasDeHoy(),
    cargarReservasDelMes(),
  ])
})
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    <EncabezadoGerencia
      titulo="Panel de gerencia"
      descripcion="Socios, facturación, reservas y aforo de toda la cadena."
      etiqueta="Gerente Central"
      :mostrar-volver="false"
    >
      <template #acciones>
        <span
          data-testid="sedes-activas"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 whitespace-nowrap"
        >
          <PhBuildings :size="15" class="text-[#202759]" />
          <template v-if="cargandoSedes">Cargando sedes...</template>
          <template v-else-if="errorSedes">Sedes no disponibles</template>
          <template v-else>
            Red de sedes:
            <strong class="text-[#202759]">
              {{ sedes.length }} {{ sedes.length === 1 ? 'activa' : 'activas' }}
            </strong>
          </template>
        </span>
      </template>
    </EncabezadoGerencia>

    <section
      aria-label="Indicadores de la cadena"
      class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3"
    >
      <IndicadorGerencia
        titulo="Socios activos"
        :valor="sociosActivos.toLocaleString('es-AR')"
        detalle="Con membresía vigente"
        acento="azul"
        :cargando="cargandoSocios"
        :error="errorSocios"
      >
        <template #icono>
          <PhIdentificationCard :size="22" weight="bold" />
        </template>
      </IndicadorGerencia>
      <IndicadorGerencia
        titulo="Facturación del mes"
        :valor="formatearMoneda(ingresosDelMes)"
        :detalle="`Membresías y canchas desde el ${formatearFechaDDMMAAAA(inicioDeMes)}`"
        acento="coral"
        :cargando="cargandoIngresos"
        :error="errorIngresos"
      >
        <template #icono>
          <PhCurrencyDollar :size="22" weight="bold" />
        </template>
      </IndicadorGerencia>
      <IndicadorGerencia
        titulo="Reservas de hoy"
        :valor="reservasDeHoy.toLocaleString('es-AR')"
        detalle="Canchas y clases confirmadas"
        acento="verde"
        :cargando="cargandoReservasHoy"
        :error="errorReservasHoy"
      >
        <template #icono>
          <PhCalendarCheck :size="22" weight="bold" />
        </template>
      </IndicadorGerencia>
      <IndicadorGerencia
        titulo="Aforo simultáneo"
        :valor="aforoActualTotal.toLocaleString('es-AR')"
        detalle="Personas entrenando ahora"
        acento="ambar"
        :cargando="cargandoAforo"
        :error="errorAforo"
      >
        <template #icono>
          <PhUsersThree :size="22" weight="bold" />
        </template>
      </IndicadorGerencia>
    </section>

    <section
      aria-labelledby="titulo-rendimiento"
      class="bg-white rounded-2xl border border-slate-200 overflow-hidden"
    >
      <div
        class="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3"
      >
        <h2 id="titulo-rendimiento" class="text-sm font-bold text-[#202759]">
          Rendimiento por sede
          <span class="font-normal text-slate-500">(mes en curso)</span>
        </h2>
        <RouterLink
          to="/gerencia/sedes"
          class="shrink-0 whitespace-nowrap inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-[#202759] hover:border-[#202759] transition-colors"
        >
          Administrar sedes
          <PhArrowRight :size="13" />
        </RouterLink>
      </div>

      <div v-if="cargandoSedes" class="p-4 space-y-3">
        <div
          v-for="fila in 3"
          :key="fila"
          class="flex items-center gap-4 py-2 border-b border-slate-100 last:border-0"
        >
          <BaseSkeleton width="w-32" height="h-4" />
          <BaseSkeleton width="w-20" height="h-4" />
          <BaseSkeleton width="w-24" height="h-4" />
          <BaseSkeleton width="w-24" height="h-4" class="ml-auto" />
        </div>
      </div>

      <p
        v-else-if="errorSedes"
        role="alert"
        class="p-8 text-center text-sm text-rose-700"
      >
        No se pudieron cargar las sedes.
      </p>

      <p
        v-else-if="filasSedes.length === 0"
        class="p-8 text-center text-sm text-slate-500"
      >
        Todavía no hay sedes activas.
      </p>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <caption class="sr-only">
            Rendimiento de cada sede en el mes en curso
          </caption>
          <thead class="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th scope="col" class="px-4 py-3 font-semibold">Sede</th>
              <th
                scope="col"
                class="hidden md:table-cell px-4 py-3 font-semibold text-right"
              >
                Socios activos
              </th>
              <th
                scope="col"
                class="hidden sm:table-cell px-4 py-3 font-semibold"
              >
                Aforo actual / máx.
              </th>
              <th
                scope="col"
                class="hidden lg:table-cell px-4 py-3 font-semibold text-right"
              >
                Reservas del mes
              </th>
              <th scope="col" class="px-4 py-3 font-semibold text-right">
                Recaudación del mes
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="fila in filasSedes"
              :key="fila.id"
              data-testid="fila-rendimiento"
              class="border-t border-slate-100"
            >
              <th scope="row" class="px-4 py-3 font-medium text-slate-800">
                {{ fila.nombre }}
                <span class="block text-xs font-normal text-slate-500">
                  {{ fila.ciudad }}
                </span>
              </th>
              <td
                data-testid="socios-sede"
                class="hidden md:table-cell px-4 py-3 text-right tabular-nums"
              >
                <BaseSkeleton
                  v-if="cargandoSocios"
                  width="w-8"
                  height="h-4"
                  class="ml-auto"
                />
                <template v-else>{{ fila.socios ?? '—' }}</template>
              </td>
              <td
                data-testid="aforo-sede"
                class="hidden sm:table-cell px-4 py-3 tabular-nums"
              >
                <BaseSkeleton v-if="cargandoAforo" width="w-24" height="h-4" />
                <span
                  v-else
                  class="inline-flex items-center gap-2 whitespace-nowrap"
                >
                  {{ fila.aforoActual ?? '—' }} / {{ fila.aforoMaximo }}
                  <span
                    v-if="fila.porcentajeAforo !== null"
                    data-testid="porcentaje-aforo"
                    class="inline-flex px-2 py-0.5 rounded-full border text-[11px] font-bold"
                    :class="claseOcupacion(fila.porcentajeAforo)"
                  >
                    {{ fila.porcentajeAforo }}%
                  </span>
                </span>
              </td>
              <td
                data-testid="reservas-sede"
                class="hidden lg:table-cell px-4 py-3 text-right tabular-nums"
              >
                <BaseSkeleton
                  v-if="cargandoReservasMes"
                  width="w-8"
                  height="h-4"
                  class="ml-auto"
                />
                <template v-else>{{ fila.reservasDelMes ?? '—' }}</template>
              </td>
              <td
                data-testid="recaudacion-sede"
                class="px-4 py-3 text-right tabular-nums font-semibold whitespace-nowrap"
              >
                <BaseSkeleton
                  v-if="cargandoIngresos"
                  width="w-20"
                  height="h-4"
                  class="ml-auto"
                />
                <template v-else>
                  {{
                    fila.recaudacion === null
                      ? '—'
                      : formatearMoneda(fila.recaudacion)
                  }}
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section aria-labelledby="titulo-accesos" class="space-y-3">
      <h2 id="titulo-accesos" class="text-base font-bold text-[#202759]">
        Administración
      </h2>
      <nav
        data-testid="accesos"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
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
