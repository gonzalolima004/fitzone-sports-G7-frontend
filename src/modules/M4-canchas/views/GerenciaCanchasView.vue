<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  PhCourtBasketball,
  PhCheckCircle,
  PhXCircle,
  PhArrowsClockwise,
} from '@phosphor-icons/vue'
import { useSedeStore } from '@/store/sede'
import { toast } from '@/common/utils/toast'
import BaseButton from '@/common/components/BaseButton.vue'
import canchasService from '../services/canchas.service'
import CanchaFiltros from '../components/CanchaFiltros.vue'
import CanchaCard from '../components/CanchaCard.vue'
import CanchaModal from '../components/CanchaModal.vue'
import MantenimientoModal from '../components/MantenimientoModal.vue'
import ConfirmarBajaModal from '../components/ConfirmarBajaModal.vue'
import type {
  Cancha,
  CanchaTipo,
  CrearCanchaDto,
  ActualizarCanchaDto,
  CrearMantenimientoDto,
} from '../types/canchas.types'

const sedeStore = useSedeStore()

// Estado principal
const canchas = ref<Cancha[]>([])
const tiposCancha = ref<CanchaTipo[]>([])
const cargando = ref(true)
const guardandoCancha = ref(false)
const guardandoMantenimiento = ref(false)
const procesandoEliminar = ref(false)

// Filtros
const idSedeFiltro = ref<number | ''>('')
const idTipoFiltro = ref<number | ''>('')
const busquedaTexto = ref('')
const estadoFiltro = ref<'todas' | 'activas' | 'inactivas'>('todas')

// Modal Cancha (Creación / Edición)
const modalCanchaAbierto = ref(false)
const esEdicion = ref(false)
const canchaSeleccionada = ref<Cancha | null>(null)

// Modal Mantenimiento
const modalMantenimientoAbierto = ref(false)
const canchaParaMantenimiento = ref<Cancha | null>(null)

// Modal Confirmar Baja / Eliminación
const modalEliminarAbierto = ref(false)
const canchaParaEliminar = ref<Cancha | null>(null)

// Cargar catálogo de tipos de canchas desde el backend
async function cargarTipos() {
  try {
    tiposCancha.value = await canchasService.getTiposCancha()
  } catch (error) {
    console.error('Error al cargar tipos de canchas:', error)
  }
}

// Cargar lista de canchas desde el backend
async function cargarCanchas() {
  cargando.value = true
  try {
    canchas.value = await canchasService.getCanchas()
  } catch (error) {
    console.error('Error al cargar canchas:', error)
    toast.error('No se pudieron cargar las canchas.')
  } finally {
    cargando.value = false
  }
}

// Canchas filtradas según sede, tipo, estado y texto de búsqueda
const canchasFiltradas = computed(() => {
  return canchas.value.filter((cancha) => {
    // Filtro por Sede
    if (
      idSedeFiltro.value !== '' &&
      cancha.id_sede !== Number(idSedeFiltro.value)
    ) {
      return false
    }

    // Filtro por Tipo de Cancha
    if (
      idTipoFiltro.value !== '' &&
      cancha.id_cancha_tipo !== Number(idTipoFiltro.value)
    ) {
      return false
    }

    // Filtro por Estado (activa / inactiva)
    if (estadoFiltro.value === 'activas' && !cancha.activo) {
      return false
    }
    if (estadoFiltro.value === 'inactivas' && cancha.activo) {
      return false
    }

    // Filtro por búsqueda textual en el nombre de la cancha
    if (busquedaTexto.value.trim() !== '') {
      const query = busquedaTexto.value.toLowerCase().trim()
      const matchNombre = (cancha.nombre || '').toLowerCase().includes(query)
      const tipo = tiposCancha.value.find(
        (t) => t.id_cancha_tipo === cancha.id_cancha_tipo
      )
      const matchTipo = (tipo?.descripcion || '').toLowerCase().includes(query)
      if (!matchNombre && !matchTipo) {
        return false
      }
    }

    return true
  })
})

// Métricas cuantitativas
const totalCanchas = computed(() => canchas.value.length)
const totalActivas = computed(
  () => canchas.value.filter((c) => c.activo).length
)
const totalInactivas = computed(
  () => canchas.value.filter((c) => !c.activo).length
)

// Mapa de nombres de sedes
function obtenerNombreSede(idSede: number): string {
  const sede = sedeStore.sedes.find((s) => s.id_sede === idSede)
  return sede ? sede.nombre : `Sede #${idSede}`
}

// Mapa de nombres de tipos de cancha
function obtenerNombreTipo(idTipo: number): string {
  const tipo = tiposCancha.value.find((t) => t.id_cancha_tipo === idTipo)
  return tipo ? tipo.descripcion || `Tipo #${idTipo}` : `Tipo #${idTipo}`
}

// Abrir modal de creación
function abrirCrearCancha() {
  esEdicion.value = false
  canchaSeleccionada.value = null
  modalCanchaAbierto.value = true
}

// Abrir modal de edición
function abrirEditarCancha(cancha: Cancha) {
  esEdicion.value = true
  canchaSeleccionada.value = cancha
  modalCanchaAbierto.value = true
}

// Guardar cancha (Crear o Actualizar)
async function handleGuardarCancha(datos: {
  nombre: string
  id_sede: number
  id_cancha_tipo: number
  costo_base: number
  activo?: boolean
}) {
  guardandoCancha.value = true
  try {
    if (esEdicion.value && canchaSeleccionada.value) {
      const dto: ActualizarCanchaDto = {
        nombre: datos.nombre,
        id_sede: datos.id_sede,
        id_cancha_tipo: datos.id_cancha_tipo,
        costo_base: datos.costo_base,
        activo: datos.activo,
      }
      await canchasService.actualizarCancha(
        canchaSeleccionada.value.id_cancha,
        dto
      )
      toast.success('Cancha actualizada exitosamente.')
    } else {
      const dto: CrearCanchaDto = {
        nombre: datos.nombre,
        id_sede: datos.id_sede,
        id_cancha_tipo: datos.id_cancha_tipo,
        costo_base: datos.costo_base,
      }
      await canchasService.crearCancha(dto)
      toast.success('Nueva cancha creada exitosamente.')
    }
    modalCanchaAbierto.value = false
    await cargarCanchas()
  } catch (error) {
    console.error('Error al guardar cancha:', error)
    toast.error('Ocurrió un error al guardar los datos de la cancha.')
  } finally {
    guardandoCancha.value = false
  }
}

// Abrir modal de mantenimiento
function abrirModalMantenimiento(cancha: Cancha) {
  canchaParaMantenimiento.value = cancha
  modalMantenimientoAbierto.value = true
}

// Guardar mantenimiento
async function handleGuardarMantenimiento(dto: CrearMantenimientoDto) {
  if (!canchaParaMantenimiento.value) return
  guardandoMantenimiento.value = true
  try {
    await canchasService.programarMantenimiento(
      canchaParaMantenimiento.value.id_cancha,
      dto
    )
    toast.success('Mantenimiento programado con éxito.')
    modalMantenimientoAbierto.value = false
    await cargarCanchas()
  } catch (error) {
    console.error('Error al programar mantenimiento:', error)
    toast.error('No se pudo programar el mantenimiento.')
  } finally {
    guardandoMantenimiento.value = false
  }
}

// Abrir confirmación de baja / eliminación
function abrirModalEliminar(cancha: Cancha) {
  canchaParaEliminar.value = cancha
  modalEliminarAbierto.value = true
}

// Confirmar baja / eliminación
async function handleConfirmarEliminar(cancha: Cancha) {
  procesandoEliminar.value = true
  try {
    await canchasService.eliminarCancha(cancha.id_cancha)
    toast.success(`Cancha "${cancha.nombre}" dada de baja.`)
    modalEliminarAbierto.value = false
    await cargarCanchas()
  } catch (error) {
    console.error('Error al eliminar cancha:', error)
    toast.error('No se pudo eliminar la cancha.')
  } finally {
    procesandoEliminar.value = false
  }
}

onMounted(async () => {
  await Promise.all([sedeStore.cargarSedes(), cargarTipos(), cargarCanchas()])
})
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-4">
    <!-- Encabezado de la Vista de Gerencia -->
    <div
      class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200"
    >
      <div>
        <h1 class="text-2xl font-bold text-[#202759] tracking-tight mt-1">
          Gestión de Canchas Deportivas
        </h1>
        <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
          Administrá el inventario, tarifas base y mantenimiento de canchas por
          sede.
        </p>
      </div>

      <!-- Métricas Resumen -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- Total -->
        <div
          class="px-3.5 py-2 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2.5"
        >
          <div
            class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#202759]"
          >
            <PhCourtBasketball :size="18" weight="bold" />
          </div>
          <div>
            <div class="text-[10px] uppercase font-bold text-slate-400">
              Total
            </div>
            <div
              class="text-base font-bold text-[#202759] tabular-nums leading-none"
            >
              {{ totalCanchas }}
            </div>
          </div>
        </div>

        <!-- Activas -->
        <div
          class="px-3.5 py-2 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2.5"
        >
          <div
            class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"
          >
            <PhCheckCircle :size="18" weight="bold" />
          </div>
          <div>
            <div class="text-[10px] uppercase font-bold text-slate-400">
              Activas
            </div>
            <div
              class="text-base font-bold text-emerald-700 tabular-nums leading-none"
            >
              {{ totalActivas }}
            </div>
          </div>
        </div>

        <!-- Inactivas -->
        <div
          class="px-3.5 py-2 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2.5"
        >
          <div
            class="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-[#F96167]"
          >
            <PhXCircle :size="18" weight="bold" />
          </div>
          <div>
            <div class="text-[10px] uppercase font-bold text-slate-400">
              Inactivas
            </div>
            <div
              class="text-base font-bold text-[#F96167] tabular-nums leading-none"
            >
              {{ totalInactivas }}
            </div>
          </div>
        </div>

        <!-- Botón de Refresco -->
        <BaseButton
          variant="outline"
          size="sm"
          title="Refrescar lista"
          :loading="cargando"
          @click="cargarCanchas"
        >
          <template #icon>
            <PhArrowsClockwise :size="15" />
          </template>
        </BaseButton>
      </div>
    </div>

    <!-- Componente de Filtros y Acciones -->
    <CanchaFiltros
      v-model:sede-id="idSedeFiltro"
      v-model:tipo-id="idTipoFiltro"
      v-model:estado="estadoFiltro"
      v-model:busqueda="busquedaTexto"
      :sedes="sedeStore.sedes"
      :tipos-cancha="tiposCancha"
      @crear-cancha="abrirCrearCancha"
    />

    <!-- Contenedor Principal: Grilla o Estados -->
    <div
      v-if="cargando"
      class="p-16 flex flex-col items-center justify-center gap-3 text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-xs"
    >
      <div
        class="animate-spin w-8 h-8 border-3 border-[#202759] border-t-transparent rounded-full"
      ></div>
      <p class="text-xs sm:text-sm font-medium text-slate-500">
        Cargando catálogo de canchas...
      </p>
    </div>

    <!-- Estado Vacío -->
    <div
      v-else-if="canchasFiltradas.length === 0"
      class="p-12 text-center flex flex-col items-center justify-center gap-3 bg-white rounded-2xl border border-slate-200 shadow-xs"
    >
      <div
        class="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-1"
      >
        <PhCourtBasketball :size="28" />
      </div>
      <h3 class="text-base font-bold text-[#202759]">
        No se encontraron canchas
      </h3>
      <p class="text-xs sm:text-sm text-slate-500 max-w-md">
        No hay canchas que coincidan con los filtros aplicados. Podés ajustar
        los filtros o dar de alta una nueva cancha para esta sede.
      </p>
      <div class="mt-2">
        <BaseButton variant="primary" size="sm" @click="abrirCrearCancha">
          Dar de Alta Nueva Cancha
        </BaseButton>
      </div>
    </div>

    <!-- Grilla de Canchas (Componente CanchaCard) -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      <CanchaCard
        v-for="cancha in canchasFiltradas"
        :key="cancha.id_cancha"
        :cancha="cancha"
        :nombre-sede="obtenerNombreSede(cancha.id_sede)"
        :nombre-tipo="obtenerNombreTipo(cancha.id_cancha_tipo)"
        @editar="abrirEditarCancha"
        @mantenimiento="abrirModalMantenimiento"
        @eliminar="abrirModalEliminar"
      />
    </div>

    <!-- Modales Reutilizables de M4-canchas -->
    <CanchaModal
      v-model="modalCanchaAbierto"
      :es-edicion="esEdicion"
      :cancha="canchaSeleccionada"
      :sedes="sedeStore.sedes"
      :tipos-cancha="tiposCancha"
      :guardando="guardandoCancha"
      @guardar="handleGuardarCancha"
    />

    <MantenimientoModal
      v-model="modalMantenimientoAbierto"
      :cancha="canchaParaMantenimiento"
      :guardando="guardandoMantenimiento"
      @guardar="handleGuardarMantenimiento"
    />

    <ConfirmarBajaModal
      v-model="modalEliminarAbierto"
      :cancha="canchaParaEliminar"
      :procesando="procesandoEliminar"
      @confirmar="handleConfirmarEliminar"
    />
  </div>
</template>
