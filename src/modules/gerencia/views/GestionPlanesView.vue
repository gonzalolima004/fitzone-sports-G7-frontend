<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  PhArrowsClockwise,
  PhCurrencyDollar,
  PhMedal,
  PhPencilSimple,
  PhPlus,
  PhTrash,
} from '@phosphor-icons/vue'
import BaseButton from '@/common/components/BaseButton.vue'
import BaseSkeleton from '@/common/components/BaseSkeleton.vue'
import { toast } from '@/common/utils/toast'
import EncabezadoGerencia from '../components/EncabezadoGerencia.vue'
import PlanFormModal from '../components/PlanFormModal.vue'
import ConfirmarEliminacionModal from '../components/ConfirmarEliminacionModal.vue'
import { planesService } from '../services/planes.service'
import { obtenerMensajeDeError } from '../utils/errores'
import { describirDuracion, formatearMoneda } from '../utils/formato'
import type { PlanMembresia, PlanPayload } from '../types/gerencia.types'

const planes = ref<PlanMembresia[]>([])
const cargando = ref(true)
const errorCarga = ref('')

const formularioAbierto = ref(false)
const planEnEdicion = ref<PlanMembresia | null>(null)
const guardando = ref(false)
const errorFormulario = ref('')

const confirmacionAbierta = ref(false)
const planParaEliminar = ref<PlanMembresia | null>(null)
const eliminando = ref(false)
const errorEliminacion = ref('')

const planesOrdenados = computed(() =>
  [...planes.value].sort(
    (a, b) => a.duracion_dias - b.duracion_dias || a.precio - b.precio
  )
)
const precioMinimo = computed(() =>
  planes.value.length ? Math.min(...planes.value.map((p) => p.precio)) : 0
)
const precioMaximo = computed(() =>
  planes.value.length ? Math.max(...planes.value.map((p) => p.precio)) : 0
)

async function cargarPlanes() {
  cargando.value = true
  errorCarga.value = ''
  try {
    planes.value = await planesService.listar()
  } catch (error: unknown) {
    errorCarga.value = obtenerMensajeDeError(
      error,
      'No se pudieron cargar los planes. Revisá la conexión e intentá nuevamente.'
    )
  } finally {
    cargando.value = false
  }
}

function abrirAlta() {
  planEnEdicion.value = null
  errorFormulario.value = ''
  formularioAbierto.value = true
}

function abrirEdicion(plan: PlanMembresia) {
  planEnEdicion.value = plan
  errorFormulario.value = ''
  formularioAbierto.value = true
}

async function guardarPlan(datos: PlanPayload) {
  guardando.value = true
  errorFormulario.value = ''
  try {
    if (planEnEdicion.value) {
      await planesService.actualizar(planEnEdicion.value.id, datos)
      toast.success(`Plan "${datos.nombre}" actualizado.`)
    } else {
      await planesService.crear(datos)
      toast.success(`Plan "${datos.nombre}" creado.`)
    }
    formularioAbierto.value = false
    await cargarPlanes()
  } catch (error: unknown) {
    errorFormulario.value = obtenerMensajeDeError(
      error,
      'No se pudo guardar el plan. Intentá nuevamente.'
    )
  } finally {
    guardando.value = false
  }
}

function pedirConfirmacionEliminacion(plan: PlanMembresia) {
  planParaEliminar.value = plan
  errorEliminacion.value = ''
  confirmacionAbierta.value = true
}

async function confirmarEliminacion() {
  if (!planParaEliminar.value) return
  const plan = planParaEliminar.value

  eliminando.value = true
  errorEliminacion.value = ''
  try {
    await planesService.eliminar(plan.id)
    confirmacionAbierta.value = false
    toast.success(`Plan "${plan.nombre}" eliminado.`)
    await cargarPlanes()
  } catch (error: unknown) {
    // Hoy el backend responde 500 si el plan tiene membresías asociadas
    // (clave foránea), por eso el mensaje por defecto explica ese caso.
    errorEliminacion.value = obtenerMensajeDeError(
      error,
      'No se pudo eliminar el plan. Si tiene membresías asociadas no puede eliminarse: podés editarlo en su lugar.'
    )
  } finally {
    eliminando.value = false
  }
}

onMounted(cargarPlanes)
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    <EncabezadoGerencia
      titulo="Planes de membresía"
      descripcion="Definí los planes que pueden contratar los socios: nombre, duración y precio."
      etiqueta="Control de membresía"
    >
      <template #acciones>
        <BaseButton
          variant="outline"
          size="sm"
          title="Actualizar listado"
          :loading="cargando"
          @click="cargarPlanes"
        >
          <template #icon>
            <PhArrowsClockwise :size="15" />
          </template>
          Actualizar
        </BaseButton>
        <BaseButton variant="secondary" size="sm" @click="abrirAlta">
          <template #icon>
            <PhPlus :size="15" weight="bold" />
          </template>
          Nuevo plan
        </BaseButton>
      </template>
    </EncabezadoGerencia>

    <section
      aria-label="Resumen de planes"
      class="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3"
    >
      <div
        class="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 flex items-center gap-3"
      >
        <div
          class="flex w-10 h-10 rounded-xl bg-[#202759]/10 text-[#202759] items-center justify-center shrink-0"
        >
          <PhMedal :size="20" weight="bold" />
        </div>
        <div>
          <p class="text-[11px] uppercase font-bold text-slate-400">
            Planes en catálogo
          </p>
          <BaseSkeleton v-if="cargando" width="w-10" height="h-6" />
          <p
            v-else
            data-testid="total-planes"
            class="text-lg sm:text-xl font-bold text-[#202759] tabular-nums"
          >
            {{ planes.length }}
          </p>
        </div>
      </div>
      <div
        class="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 flex items-center gap-3"
      >
        <div
          class="flex w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 items-center justify-center shrink-0"
        >
          <PhCurrencyDollar :size="20" weight="bold" />
        </div>
        <div>
          <p class="text-[11px] uppercase font-bold text-slate-400">
            Precio desde
          </p>
          <BaseSkeleton v-if="cargando" width="w-24" height="h-6" />
          <p
            v-else
            class="text-lg sm:text-xl font-bold text-emerald-700 tabular-nums"
          >
            {{ planes.length ? formatearMoneda(precioMinimo) : '—' }}
          </p>
        </div>
      </div>
      <div
        class="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 flex items-center gap-3"
      >
        <div
          class="flex w-10 h-10 rounded-xl bg-amber-50 text-amber-600 items-center justify-center shrink-0"
        >
          <PhCurrencyDollar :size="20" weight="bold" />
        </div>
        <div>
          <p class="text-[11px] uppercase font-bold text-slate-400">
            Precio hasta
          </p>
          <BaseSkeleton v-if="cargando" width="w-24" height="h-6" />
          <p
            v-else
            class="text-lg sm:text-xl font-bold text-amber-700 tabular-nums"
          >
            {{ planes.length ? formatearMoneda(precioMaximo) : '—' }}
          </p>
        </div>
      </div>
    </section>

    <section
      class="bg-white rounded-2xl border border-slate-200 overflow-hidden"
      :aria-busy="cargando"
    >
      <div v-if="cargando" class="p-4 space-y-3">
        <div
          v-for="fila in 3"
          :key="fila"
          class="flex items-center gap-4 py-2 border-b border-slate-100 last:border-0"
        >
          <BaseSkeleton width="w-40" height="h-4" />
          <BaseSkeleton width="w-28" height="h-4" />
          <BaseSkeleton width="w-20" height="h-4" />
          <BaseSkeleton variant="button" width="w-28" class="ml-auto" />
        </div>
      </div>

      <div
        v-else-if="errorCarga"
        role="alert"
        class="p-10 flex flex-col items-center gap-3 text-center"
      >
        <p class="text-sm text-rose-700">{{ errorCarga }}</p>
        <BaseButton variant="outline" size="sm" @click="cargarPlanes">
          Reintentar
        </BaseButton>
      </div>

      <div
        v-else-if="planes.length === 0"
        class="p-12 flex flex-col items-center gap-3 text-center"
      >
        <div
          class="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center"
        >
          <PhMedal :size="28" />
        </div>
        <h2 class="text-base font-bold text-[#202759]">
          Todavía no hay planes de membresía
        </h2>
        <p class="text-sm text-slate-500 max-w-md">
          Sin planes los socios no pueden contratar una membresía.
        </p>
        <BaseButton size="sm" @click="abrirAlta"
          >Crear el primer plan</BaseButton
        >
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <caption class="sr-only">
            Planes de membresía disponibles
          </caption>
          <thead class="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th scope="col" class="px-4 py-3 font-semibold">Plan</th>
              <th
                scope="col"
                class="hidden sm:table-cell px-4 py-3 font-semibold"
              >
                Duración
              </th>
              <th scope="col" class="px-4 py-3 font-semibold text-right">
                Precio
              </th>
              <th scope="col" class="px-4 py-3 font-semibold text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="plan in planesOrdenados"
              :key="plan.id"
              data-testid="fila-plan"
              class="border-t border-slate-100"
            >
              <th scope="row" class="px-4 py-3 font-medium text-slate-800">
                {{ plan.nombre }}
                <span
                  class="block text-xs font-normal text-slate-500 sm:hidden"
                >
                  {{ describirDuracion(plan.duracion_dias) }}
                </span>
              </th>
              <td class="hidden sm:table-cell px-4 py-3 text-slate-600">
                {{ describirDuracion(plan.duracion_dias) }}
              </td>
              <td class="px-4 py-3 text-right tabular-nums font-semibold">
                {{ formatearMoneda(plan.precio) }}
              </td>
              <td class="px-4 py-3">
                <div class="flex justify-end gap-2">
                  <BaseButton
                    variant="outline"
                    size="sm"
                    :aria-label="`Editar plan ${plan.nombre}`"
                    @click="abrirEdicion(plan)"
                  >
                    <template #icon>
                      <PhPencilSimple :size="14" />
                    </template>
                    <span class="hidden sm:inline">Editar</span>
                  </BaseButton>
                  <BaseButton
                    variant="danger-outline"
                    size="sm"
                    :aria-label="`Eliminar plan ${plan.nombre}`"
                    @click="pedirConfirmacionEliminacion(plan)"
                  >
                    <template #icon>
                      <PhTrash :size="14" />
                    </template>
                    <span class="hidden sm:inline">Eliminar</span>
                  </BaseButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <PlanFormModal
      v-model="formularioAbierto"
      :plan="planEnEdicion"
      :guardando="guardando"
      :error-servidor="errorFormulario"
      @guardar="guardarPlan"
    />

    <ConfirmarEliminacionModal
      v-model="confirmacionAbierta"
      :titulo="`¿Eliminar el plan ${planParaEliminar?.nombre ?? ''}?`"
      texto-confirmar="Sí, eliminar"
      :procesando="eliminando"
      :error="errorEliminacion"
      @confirmar="confirmarEliminacion"
    >
      El plan <strong>{{ planParaEliminar?.nombre }}</strong> se quitará del
      catálogo. Si ya tiene membresías asociadas, el sistema no permitirá
      eliminarlo para conservar el historial.
    </ConfirmarEliminacionModal>
  </div>
</template>
