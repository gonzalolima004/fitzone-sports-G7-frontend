<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  PhArrowCounterClockwise,
  PhArrowsClockwise,
  PhIdentificationCard,
  PhPencilSimple,
  PhPlus,
} from '@phosphor-icons/vue'
import BaseButton from '@/common/components/BaseButton.vue'
import BaseSkeleton from '@/common/components/BaseSkeleton.vue'
import { toast } from '@/common/utils/toast'
import {
  formatearFechaDDMMAAAA,
  obtenerFechaLocalISO,
} from '@/common/utils/date-formatter'
import EncabezadoGerencia from '../components/EncabezadoGerencia.vue'
import MembresiaAltaModal from '../components/MembresiaAltaModal.vue'
import MembresiaEdicionModal from '../components/MembresiaEdicionModal.vue'
import ConfirmarEliminacionModal from '../components/ConfirmarEliminacionModal.vue'
import { membresiasService } from '../services/membresias.service'
import { planesService } from '../services/planes.service'
import { obtenerMensajeDeError } from '../utils/errores'
import {
  armarFilasPorSocio,
  claseEstadoMembresia,
  coincideConBusqueda,
  iniciales,
  nombreCompleto,
  tieneEstado,
} from '../utils/membresias'
import type {
  EstadoMembresia,
  FilaMembresiaSocio,
  MembresiaAltaPayload,
  MembresiaEdicionPayload,
  MembresiaSocio,
  PlanMembresia,
  UsuarioGestion,
} from '../types/gerencia.types'

/** Valor del filtro de estado para los socios sin membresía. */
const SIN_MEMBRESIA = 'sin-membresia'

const membresias = ref<MembresiaSocio[]>([])
const estados = ref<EstadoMembresia[]>([])
const planes = ref<PlanMembresia[]>([])
const usuarios = ref<UsuarioGestion[]>([])
const cargando = ref(true)
const errorCarga = ref('')

const filtroEstado = ref('')
const filtroSede = ref('')
const busqueda = ref('')

const altaAbierta = ref(false)
const altaTitulo = ref('Nueva membresía')
const altaSocio = ref<number | null>(null)
const altaPlan = ref<number | null>(null)
const guardandoAlta = ref(false)
const errorAlta = ref('')

const edicionAbierta = ref(false)
const membresiaEnEdicion = ref<MembresiaSocio | null>(null)
const guardandoEdicion = ref(false)
const errorEdicion = ref('')

const reactivando = ref<number | null>(null)

const confirmacionAbierta = ref(false)
const membresiaParaEliminar = ref<MembresiaSocio | null>(null)
const eliminando = ref(false)
const errorEliminacion = ref('')

const hoy = obtenerFechaLocalISO()

const filas = computed(() =>
  armarFilasPorSocio(usuarios.value, membresias.value)
)

const sedes = computed(() => {
  const porId = new Map<number, string>()
  for (const { socio } of filas.value) {
    if (socio.id_sede !== null) {
      porId.set(socio.id_sede, socio.sede_nombre ?? `Sede ${socio.id_sede}`)
    }
  }
  return [...porId.entries()]
    .map(([id, nombre]) => ({ id, nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
})

const filasFiltradas = computed(() =>
  filas.value.filter(
    ({ socio, membresia }) =>
      coincideConBusqueda(socio, busqueda.value) &&
      (!filtroSede.value || String(socio.id_sede) === filtroSede.value) &&
      (!filtroEstado.value ||
        (filtroEstado.value === SIN_MEMBRESIA
          ? membresia === null
          : String(membresia?.id_membresia_estado) === filtroEstado.value))
  )
)

/** Socios por estado de su membresía actual (tabla membresia_estado). */
const resumen = computed(() => [
  ...estados.value.map((estado) => ({
    clave: String(estado.id_membresia_estado),
    descripcion: estado.descripcion,
    cantidad: filas.value.filter(
      ({ membresia }) =>
        membresia?.id_membresia_estado === estado.id_membresia_estado
    ).length,
  })),
  {
    clave: SIN_MEMBRESIA,
    descripcion: 'Sin membresía',
    cantidad: filas.value.filter(({ membresia }) => membresia === null).length,
  },
])

const sociosParaAlta = computed(() => filas.value.map(({ socio }) => socio))

function estaVencidaPorFecha(membresia: MembresiaSocio): boolean {
  return membresia.fecha_fin.slice(0, 10) < hoy
}

/** Acción principal de cada fila, según el estado de la membresía actual. */
function accionPrincipal(
  fila: FilaMembresiaSocio
): 'asociar' | 'renovar' | 'reactivar' | null {
  const { membresia } = fila
  if (!membresia) return 'asociar'
  if (tieneEstado(membresia, 'vencida')) return 'renovar'
  if (tieneEstado(membresia, 'suspendida')) {
    return estaVencidaPorFecha(membresia) ? 'renovar' : 'reactivar'
  }
  return null
}

async function cargarDatos() {
  cargando.value = true
  errorCarga.value = ''
  try {
    const [listaMembresias, listaEstados, listaPlanes, listaUsuarios] =
      await Promise.all([
        membresiasService.listar(),
        membresiasService.listarEstados(),
        planesService.listar(),
        membresiasService.listarUsuarios(),
      ])
    membresias.value = listaMembresias
    estados.value = listaEstados
    planes.value = listaPlanes
    usuarios.value = listaUsuarios
  } catch (error: unknown) {
    errorCarga.value = obtenerMensajeDeError(
      error,
      'No se pudieron cargar las membresías. Revisá la conexión e intentá nuevamente.'
    )
  } finally {
    cargando.value = false
  }
}

async function recargarMembresias() {
  try {
    membresias.value = await membresiasService.listar()
  } catch (error: unknown) {
    toast.error(
      obtenerMensajeDeError(
        error,
        'No se pudo actualizar el listado. Probá con el botón Actualizar.'
      )
    )
  }
}

function alternarFiltroEstado(clave: string) {
  filtroEstado.value = filtroEstado.value === clave ? '' : clave
}

function limpiarFiltros() {
  filtroEstado.value = ''
  filtroSede.value = ''
  busqueda.value = ''
}

function abrirAlta(
  opciones: { socio?: number; plan?: number; titulo?: string } = {}
) {
  altaSocio.value = opciones.socio ?? null
  altaPlan.value = opciones.plan ?? null
  altaTitulo.value = opciones.titulo ?? 'Nueva membresía'
  errorAlta.value = ''
  altaAbierta.value = true
}

function ejecutarAccionPrincipal(fila: FilaMembresiaSocio) {
  const accion = accionPrincipal(fila)
  if (accion === 'asociar') {
    abrirAlta({ socio: fila.socio.id_usuario, titulo: 'Asociar membresía' })
  } else if (accion === 'renovar' && fila.membresia) {
    abrirAlta({
      socio: fila.socio.id_usuario,
      plan: fila.membresia.id_membresia_plan,
      titulo: 'Renovar membresía',
    })
  } else if (accion === 'reactivar' && fila.membresia) {
    void reactivar(fila.membresia)
  }
}

async function guardarAlta(datos: MembresiaAltaPayload) {
  guardandoAlta.value = true
  errorAlta.value = ''
  try {
    const creada = await membresiasService.crear(datos)
    altaAbierta.value = false
    toast.success(
      `Membresía de ${nombreCompleto(creada.usuario)} dada de alta.`
    )
    await recargarMembresias()
  } catch (error: unknown) {
    errorAlta.value = obtenerMensajeDeError(
      error,
      'No se pudo dar de alta la membresía. Intentá nuevamente.'
    )
  } finally {
    guardandoAlta.value = false
  }
}

async function reactivar(membresia: MembresiaSocio) {
  const activa = estados.value.find(
    (estado) => estado.descripcion.trim().toLowerCase() === 'activa'
  )
  if (!activa) {
    toast.error('No se encontró el estado Activa en el catálogo.')
    return
  }
  reactivando.value = membresia.id_membresia
  try {
    await membresiasService.cambiarEstado(
      membresia.id_membresia,
      activa.id_membresia_estado
    )
    toast.success(
      `Membresía de ${nombreCompleto(membresia.usuario)} reactivada.`
    )
    await recargarMembresias()
  } catch (error: unknown) {
    toast.error(
      obtenerMensajeDeError(
        error,
        'No se pudo reactivar la membresía. Intentá nuevamente.'
      )
    )
  } finally {
    reactivando.value = null
  }
}

function abrirEdicion(membresia: MembresiaSocio) {
  membresiaEnEdicion.value = membresia
  errorEdicion.value = ''
  edicionAbierta.value = true
}

async function guardarEdicion(datos: MembresiaEdicionPayload) {
  const membresia = membresiaEnEdicion.value
  if (!membresia) return

  const cambios: { fecha_fin?: string; renovacion_automatica?: boolean } = {}
  if (datos.fecha_fin !== membresia.fecha_fin.slice(0, 10)) {
    cambios.fecha_fin = datos.fecha_fin
  }
  if (datos.renovacion_automatica !== membresia.renovacion_automatica) {
    cambios.renovacion_automatica = datos.renovacion_automatica
  }
  const cambiaEstado =
    datos.id_membresia_estado !== membresia.id_membresia_estado

  if (!cambiaEstado && Object.keys(cambios).length === 0) {
    edicionAbierta.value = false
    toast.info('No hubo cambios en la membresía.')
    return
  }

  guardandoEdicion.value = true
  errorEdicion.value = ''
  let seGuardoAlgo = false
  try {
    if (Object.keys(cambios).length > 0) {
      await membresiasService.actualizar(membresia.id_membresia, cambios)
      seGuardoAlgo = true
    }
    if (cambiaEstado) {
      await membresiasService.cambiarEstado(
        membresia.id_membresia,
        datos.id_membresia_estado
      )
      seGuardoAlgo = true
    }
    edicionAbierta.value = false
    toast.success(
      `Membresía de ${nombreCompleto(membresia.usuario)} actualizada.`
    )
  } catch (error: unknown) {
    errorEdicion.value = obtenerMensajeDeError(
      error,
      'No se pudo actualizar la membresía. Intentá nuevamente.'
    )
  } finally {
    guardandoEdicion.value = false
  }
  if (seGuardoAlgo) {
    await recargarMembresias()
  }
}

function pedirConfirmacionEliminacion() {
  const membresia = membresiaEnEdicion.value
  if (!membresia) return
  edicionAbierta.value = false
  membresiaParaEliminar.value = membresia
  errorEliminacion.value = ''
  confirmacionAbierta.value = true
}

async function confirmarEliminacion() {
  const membresia = membresiaParaEliminar.value
  if (!membresia) return

  eliminando.value = true
  errorEliminacion.value = ''
  try {
    await membresiasService.eliminar(membresia.id_membresia)
    confirmacionAbierta.value = false
    toast.success(
      `Membresía de ${nombreCompleto(membresia.usuario)} eliminada.`
    )
    await recargarMembresias()
  } catch (error: unknown) {
    errorEliminacion.value = obtenerMensajeDeError(
      error,
      'No se pudo eliminar la membresía. Intentá nuevamente.'
    )
  } finally {
    eliminando.value = false
  }
}

onMounted(cargarDatos)
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    <EncabezadoGerencia
      titulo="Membresías de socios"
      descripcion="Plan, vencimiento y estado de la membresía de cada socio."
      etiqueta="Control de membresía"
    >
      <template #acciones>
        <BaseButton
          variant="outline"
          size="sm"
          title="Actualizar listado"
          :loading="cargando"
          @click="cargarDatos"
        >
          <template #icon>
            <PhArrowsClockwise :size="15" />
          </template>
          Actualizar
        </BaseButton>
        <BaseButton
          variant="secondary"
          size="sm"
          :disabled="cargando || Boolean(errorCarga)"
          @click="abrirAlta()"
        >
          <template #icon>
            <PhPlus :size="15" weight="bold" />
          </template>
          Nueva membresía
        </BaseButton>
      </template>
    </EncabezadoGerencia>

    <section
      aria-label="Socios por estado de membresía"
      class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3"
    >
      <template v-if="cargando">
        <div
          v-for="tarjeta in 4"
          :key="tarjeta"
          class="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200"
        >
          <BaseSkeleton width="w-20" height="h-3" />
          <BaseSkeleton width="w-10" height="h-6" class="mt-2" />
        </div>
      </template>
      <button
        v-for="estado in resumen"
        v-else
        :key="estado.clave"
        type="button"
        :aria-pressed="filtroEstado === estado.clave"
        :title="`Ver solo los socios con estado ${estado.descripcion}`"
        class="p-3 sm:p-4 bg-white rounded-2xl border text-left transition-colors cursor-pointer"
        :class="
          filtroEstado === estado.clave
            ? 'border-[#202759] ring-2 ring-[#202759]/15'
            : 'border-slate-200 hover:border-slate-300'
        "
        @click="alternarFiltroEstado(estado.clave)"
      >
        <span
          class="inline-flex px-2 py-0.5 rounded-full border text-[11px] font-bold uppercase tracking-wide"
          :class="claseEstadoMembresia(estado.descripcion)"
        >
          {{ estado.descripcion }}
        </span>
        <span
          :data-testid="`total-${estado.clave}`"
          class="block mt-1 text-lg sm:text-xl font-bold text-[#202759] tabular-nums"
        >
          {{ estado.cantidad }}
        </span>
      </button>
    </section>

    <section
      aria-label="Filtros"
      class="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 flex flex-col lg:flex-row lg:items-center gap-2 sm:gap-3"
    >
      <input
        id="filtro-busqueda"
        v-model="busqueda"
        type="search"
        aria-label="Buscar socio por nombre, DNI o email"
        placeholder="Buscar por nombre, DNI o email"
        class="w-full lg:flex-1 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-[#202759] focus:ring-[#202759]/15"
      />
      <div class="grid grid-cols-2 lg:flex gap-2 sm:gap-3">
        <select
          id="filtro-estado"
          v-model="filtroEstado"
          aria-label="Filtrar por estado"
          class="px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-[#202759] focus:ring-[#202759]/15"
        >
          <option value="">Todos los estados</option>
          <option
            v-for="estado in estados"
            :key="estado.id_membresia_estado"
            :value="String(estado.id_membresia_estado)"
          >
            {{ estado.descripcion }}
          </option>
          <option :value="SIN_MEMBRESIA">Sin membresía</option>
        </select>
        <select
          id="filtro-sede"
          v-model="filtroSede"
          aria-label="Filtrar por sede"
          class="px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-[#202759] focus:ring-[#202759]/15"
        >
          <option value="">Todas las sedes</option>
          <option v-for="sede in sedes" :key="sede.id" :value="String(sede.id)">
            {{ sede.nombre }}
          </option>
        </select>
      </div>
      <span
        data-testid="total-socios"
        class="self-start lg:self-auto inline-flex px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap"
      >
        {{ filas.length }} socios
      </span>
    </section>

    <section
      class="bg-white rounded-2xl border border-slate-200 overflow-hidden"
      :aria-busy="cargando"
    >
      <div v-if="cargando" class="p-4 space-y-3">
        <div
          v-for="fila in 4"
          :key="fila"
          class="flex items-center gap-4 py-2 border-b border-slate-100 last:border-0"
        >
          <BaseSkeleton width="w-40" height="h-4" />
          <BaseSkeleton width="w-24" height="h-4" />
          <BaseSkeleton width="w-28" height="h-4" />
          <BaseSkeleton variant="button" width="w-28" class="ml-auto" />
        </div>
      </div>

      <div
        v-else-if="errorCarga"
        role="alert"
        class="p-10 flex flex-col items-center gap-3 text-center"
      >
        <p class="text-sm text-rose-700">{{ errorCarga }}</p>
        <BaseButton variant="outline" size="sm" @click="cargarDatos">
          Reintentar
        </BaseButton>
      </div>

      <div
        v-else-if="filas.length === 0"
        class="p-12 flex flex-col items-center gap-3 text-center"
      >
        <div
          class="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center"
        >
          <PhIdentificationCard :size="28" />
        </div>
        <h2 class="text-base font-bold text-[#202759]">
          Todavía no hay socios registrados
        </h2>
        <p class="text-sm text-slate-500 max-w-md">
          Cuando se registren socios, vas a poder asignarles una membresía desde
          acá.
        </p>
      </div>

      <div
        v-else-if="filasFiltradas.length === 0"
        class="p-10 flex flex-col items-center gap-3 text-center"
      >
        <p class="text-sm text-slate-500">
          Ningún socio coincide con los filtros.
        </p>
        <BaseButton variant="outline" size="sm" @click="limpiarFiltros">
          Limpiar filtros
        </BaseButton>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <caption class="sr-only">
            Membresías de los socios
          </caption>
          <thead class="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th scope="col" class="px-4 py-3 font-semibold">Socio</th>
              <th
                scope="col"
                class="hidden md:table-cell px-4 py-3 font-semibold"
              >
                DNI
              </th>
              <th
                scope="col"
                class="hidden lg:table-cell px-4 py-3 font-semibold"
              >
                Sede
              </th>
              <th
                scope="col"
                class="hidden sm:table-cell px-4 py-3 font-semibold"
              >
                Plan y vencimiento
              </th>
              <th
                scope="col"
                class="hidden sm:table-cell px-4 py-3 font-semibold"
              >
                Estado
              </th>
              <th scope="col" class="px-4 py-3 font-semibold text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="fila in filasFiltradas"
              :key="fila.socio.id_usuario"
              data-testid="fila-socio"
              class="border-t border-slate-100"
            >
              <th scope="row" class="px-4 py-3 font-medium text-slate-800">
                <div class="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    class="hidden sm:flex shrink-0 w-9 h-9 rounded-full bg-[#202759]/10 text-[#202759] text-xs font-bold items-center justify-center"
                  >
                    {{ iniciales(fila.socio) }}
                  </span>
                  <span class="min-w-0">
                    <span class="block">{{ nombreCompleto(fila.socio) }}</span>
                    <span
                      class="block text-xs font-normal text-slate-500 truncate"
                    >
                      {{ fila.socio.email }}
                    </span>
                    <span
                      class="block text-xs font-normal text-slate-500 md:hidden"
                    >
                      DNI {{ fila.socio.dni }}
                    </span>
                    <span
                      class="block text-xs font-normal text-slate-500 sm:hidden"
                    >
                      <template v-if="fila.membresia">
                        {{ fila.membresia.membresia_plan.nombre }} · vence
                        {{ formatearFechaDDMMAAAA(fila.membresia.fecha_fin) }}
                      </template>
                      <template v-else>Sin membresía</template>
                    </span>
                    <span
                      class="sm:hidden inline-flex mt-1 px-2 py-0.5 rounded-full border text-[11px] font-bold uppercase tracking-wide"
                      :class="
                        claseEstadoMembresia(
                          fila.membresia?.membresia_estado.descripcion ??
                            'Sin membresía'
                        )
                      "
                    >
                      {{
                        fila.membresia?.membresia_estado.descripcion ??
                        'Sin membresía'
                      }}
                    </span>
                  </span>
                </div>
              </th>
              <td
                class="hidden md:table-cell px-4 py-3 text-slate-600 tabular-nums"
              >
                {{ fila.socio.dni }}
              </td>
              <td class="hidden lg:table-cell px-4 py-3 text-slate-600">
                {{ fila.socio.sede_nombre ?? '—' }}
              </td>
              <td class="hidden sm:table-cell px-4 py-3">
                <template v-if="fila.membresia">
                  <span class="block text-slate-700">
                    {{ fila.membresia.membresia_plan.nombre }}
                  </span>
                  <span
                    class="block text-xs tabular-nums"
                    :class="
                      estaVencidaPorFecha(fila.membresia)
                        ? 'text-amber-700'
                        : 'text-slate-500'
                    "
                  >
                    {{
                      estaVencidaPorFecha(fila.membresia) ? 'Venció' : 'Vence'
                    }}
                    el {{ formatearFechaDDMMAAAA(fila.membresia.fecha_fin) }}
                  </span>
                </template>
                <span v-else class="text-slate-500">Sin membresía</span>
              </td>
              <td class="hidden sm:table-cell px-4 py-3">
                <span
                  data-testid="estado-membresia"
                  class="inline-flex px-2 py-0.5 rounded-full border text-[11px] font-bold uppercase tracking-wide"
                  :class="
                    claseEstadoMembresia(
                      fila.membresia?.membresia_estado.descripcion ??
                        'Sin membresía'
                    )
                  "
                >
                  {{
                    fila.membresia?.membresia_estado.descripcion ??
                    'Sin membresía'
                  }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-2">
                  <BaseButton
                    v-if="accionPrincipal(fila) === 'asociar'"
                    variant="secondary"
                    size="sm"
                    :aria-label="`Asociar membresía a ${nombreCompleto(fila.socio)}`"
                    @click="ejecutarAccionPrincipal(fila)"
                  >
                    <template #icon>
                      <PhPlus :size="14" weight="bold" />
                    </template>
                    <span class="hidden sm:inline">Asociar</span>
                  </BaseButton>
                  <BaseButton
                    v-else-if="accionPrincipal(fila) === 'renovar'"
                    variant="secondary"
                    size="sm"
                    :aria-label="`Renovar membresía de ${nombreCompleto(fila.socio)}`"
                    @click="ejecutarAccionPrincipal(fila)"
                  >
                    <template #icon>
                      <PhArrowsClockwise :size="14" />
                    </template>
                    <span class="hidden sm:inline">Renovar</span>
                  </BaseButton>
                  <BaseButton
                    v-else-if="accionPrincipal(fila) === 'reactivar'"
                    variant="outline"
                    size="sm"
                    :loading="reactivando === fila.membresia?.id_membresia"
                    :aria-label="`Reactivar membresía de ${nombreCompleto(fila.socio)}`"
                    @click="ejecutarAccionPrincipal(fila)"
                  >
                    <template #icon>
                      <PhArrowCounterClockwise :size="14" />
                    </template>
                    <span class="hidden sm:inline">Reactivar</span>
                  </BaseButton>
                  <BaseButton
                    v-if="fila.membresia"
                    variant="outline"
                    size="sm"
                    :aria-label="`Gestionar membresía de ${nombreCompleto(fila.socio)}`"
                    @click="abrirEdicion(fila.membresia)"
                  >
                    <template #icon>
                      <PhPencilSimple :size="14" />
                    </template>
                    <span class="hidden sm:inline">Gestionar</span>
                  </BaseButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <MembresiaAltaModal
      v-model="altaAbierta"
      :titulo="altaTitulo"
      :socio-inicial="altaSocio"
      :plan-inicial="altaPlan"
      :socios="sociosParaAlta"
      :planes="planes"
      :membresias="membresias"
      :guardando="guardandoAlta"
      :error-servidor="errorAlta"
      @guardar="guardarAlta"
    />

    <MembresiaEdicionModal
      v-model="edicionAbierta"
      :membresia="membresiaEnEdicion"
      :estados="estados"
      :guardando="guardandoEdicion"
      :error-servidor="errorEdicion"
      @guardar="guardarEdicion"
      @eliminar="pedirConfirmacionEliminacion"
    />

    <ConfirmarEliminacionModal
      v-model="confirmacionAbierta"
      titulo="¿Eliminar esta membresía?"
      texto-confirmar="Sí, eliminar"
      :procesando="eliminando"
      :error="errorEliminacion"
      @confirmar="confirmarEliminacion"
    >
      <template v-if="membresiaParaEliminar">
        Se eliminará la membresía de
        <strong>{{ nombreCompleto(membresiaParaEliminar.usuario) }}</strong>
        ({{ membresiaParaEliminar.membresia_plan.nombre }}, del
        {{ formatearFechaDDMMAAAA(membresiaParaEliminar.fecha_inicio) }} al
        {{ formatearFechaDDMMAAAA(membresiaParaEliminar.fecha_fin) }}). Solo se
        pueden eliminar membresías cargadas por error, sin pagos registrados; si
        tiene pagos, cambiá su estado a Suspendida.
      </template>
    </ConfirmarEliminacionModal>
  </div>
</template>
