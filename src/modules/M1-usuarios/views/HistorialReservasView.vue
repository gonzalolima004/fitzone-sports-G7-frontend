<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import {
  PhCalendar,
  PhCourtBasketball,
  PhWarningCircle,
  PhClock,
} from '@phosphor-icons/vue'
import { useSedeStore } from '@/store/sede'
import {
  usuariosService,
  type ItemHistorial,
  type TipoActividadHistorial,
} from '../services/usuarios.service'
import BaseSkeleton from '@/common/components/BaseSkeleton.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { toast } from '@/common/utils/toast'

type FiltroTipo = 'Todas' | 'Canchas' | 'Clases'

const MAP_FILTRO_TIPO: Record<FiltroTipo, TipoActividadHistorial> = {
  Todas: 'todas',
  Canchas: 'canchas',
  Clases: 'clases',
}

const sedeStore = useSedeStore()

const filtro = ref<FiltroTipo>('Todas')
const page = ref(1)
const limit = 10
const totalPaginas = ref(1)
const totalRegistros = ref(0)

const isLoading = ref(true)
const errorMessage = ref<string | null>(null)
const actividades = ref<ItemHistorial[]>([])

async function cargarHistorial() {
  isLoading.value = true
  errorMessage.value = null
  try {
    const idSede =
      sedeStore.sedeSeleccionada?.id_sede ??
      sedeStore.idSedeSeleccionada ??
      undefined

    const respuesta = await usuariosService.obtenerHistorial({
      page: page.value,
      limit,
      tipo: MAP_FILTRO_TIPO[filtro.value],
      ...(idSede ? { id_sede: idSede } : {}),
    })

    actividades.value = respuesta.items
    totalPaginas.value = respuesta.meta.total_paginas
    totalRegistros.value = respuesta.meta.total
  } catch {
    errorMessage.value = 'Error al cargar el historial.'
    toast.error('No se pudo cargar el historial de reservas.')
  } finally {
    isLoading.value = false
  }
}

function seleccionarFiltro(nuevoFiltro: FiltroTipo) {
  if (filtro.value === nuevoFiltro) return
  filtro.value = nuevoFiltro
  page.value = 1
  cargarHistorial()
}

function cambiarPagina(nuevaPagina: number) {
  if (nuevaPagina < 1 || nuevaPagina > totalPaginas.value) return
  page.value = nuevaPagina
  cargarHistorial()
}

function claseBadgeEstado(estado: string): string {
  const normalizado = estado.toLowerCase()
  if (normalizado.includes('cancel')) return 'bg-red-50 text-red-700'
  if (normalizado.includes('pendiente')) return 'bg-amber-50 text-amber-700'
  if (normalizado.includes('confirm')) return 'bg-emerald-50 text-emerald-700'
  return 'bg-slate-100 text-[#202759]'
}

function formatearFechaReserva(fecha: string): string {
  const d = new Date(fecha)
  const dia = d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
  const hora = d.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${dia} ${hora}`
}

function formatearFechaHora(fechaInicio: string, fechaFin: string): string {
  const inicio = new Date(fechaInicio)
  const fin = new Date(fechaFin)
  const fecha = inicio.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const horaInicio = inicio.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const horaFin = fin.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${fecha} · ${horaInicio} - ${horaFin}`
}

let inicializado = false

watch(
  () => [sedeStore.idSedeSeleccionada, sedeStore.versionContexto],
  () => {
    if (!inicializado) return
    page.value = 1
    cargarHistorial()
  }
)

onMounted(async () => {
  if (sedeStore.sedes.length === 0) {
    await sedeStore.cargarSedes()
  }
  inicializado = true
  await cargarHistorial()
})
</script>

<template>
  <div class="space-y-6">
    <header
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-[#202759]">Historial de Reservas</h1>
        <p
          v-if="sedeStore.sedeSeleccionada"
          class="text-sm text-slate-500 mt-0.5"
        >
          Sede seleccionada:
          <strong class="text-[#202759]">{{
            sedeStore.sedeSeleccionada.nombre
          }}</strong>
        </p>
      </div>
      <div class="flex bg-slate-100 p-1 rounded-xl">
        <button
          v-for="f in ['Todas', 'Canchas', 'Clases'] as FiltroTipo[]"
          :key="f"
          :class="[
            'px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer',
            filtro === f
              ? 'bg-white text-[#202759] shadow-sm'
              : 'text-slate-500 hover:text-[#202759]',
          ]"
          @click="seleccionarFiltro(f)"
        >
          {{ f }}
        </button>
      </div>
    </header>

    <div v-if="isLoading" class="space-y-4">
      <BaseSkeleton v-for="i in 3" :key="i" variant="rounded" height="80px" />
    </div>

    <div v-else-if="errorMessage" class="text-center py-10 space-y-4">
      <PhWarningCircle :size="48" class="mx-auto text-red-400" />
      <p class="text-red-700">{{ errorMessage }}</p>
      <BaseButton variant="outline" @click="cargarHistorial"
        >Reintentar</BaseButton
      >
    </div>

    <div
      v-else-if="actividades.length === 0"
      class="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-12 text-center"
    >
      <div
        class="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-[#202759]"
      >
        <PhCourtBasketball
          v-if="filtro === 'Canchas'"
          :size="28"
          weight="bold"
          class="text-[#F96167]"
        />
        <PhCalendar v-else :size="28" weight="bold" />
      </div>
      <h2 class="text-lg font-bold text-[#202759]">Sin reservas registradas</h2>
      <p class="text-sm text-slate-500 mt-1 max-w-md mx-auto">
        No tenés reservas
        <span v-if="filtro !== 'Todas'">de {{ filtro.toLowerCase() }}</span>
        en
        <strong class="text-slate-700">{{
          sedeStore.sedeSeleccionada?.nombre || 'esta sede'
        }}</strong
        >.
      </p>
      <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
        <BaseButton
          v-if="filtro !== 'Todas'"
          variant="outline"
          size="sm"
          @click="seleccionarFiltro('Todas')"
        >
          Ver todas
        </BaseButton>
        <RouterLink v-if="filtro !== 'Clases'" to="/canchas">
          <BaseButton variant="primary" size="sm" class="cursor-pointer">
            Reservar cancha
          </BaseButton>
        </RouterLink>
        <RouterLink v-if="filtro !== 'Canchas'" to="/clases">
          <BaseButton variant="outline" size="sm" class="cursor-pointer">
            Explorar clases
          </BaseButton>
        </RouterLink>
      </div>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="act in actividades"
        :key="act.id"
        class="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
      >
        <div class="flex items-center gap-4">
          <div
            class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-[#202759] shrink-0"
          >
            <PhCourtBasketball
              v-if="act.tipo === 'cancha'"
              :size="24"
              weight="bold"
              class="text-[#F96167]"
            />
            <PhCalendar v-else :size="24" weight="bold" />
          </div>
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-base font-bold text-[#202759]">
                {{ act.titulo }}
              </h3>
              <span
                class="px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-600"
              >
                {{ act.tipo === 'cancha' ? 'Cancha' : 'Clase' }}
              </span>
            </div>
            <p
              v-if="act.subtitulo"
              class="text-sm font-medium text-slate-700 mt-0.5"
            >
              {{ act.subtitulo }}
            </p>
            <p
              class="inline-flex items-center gap-1.5 text-sm text-slate-600 mt-1.5"
            >
              <PhClock :size="15" class="text-slate-400 shrink-0" />
              {{ formatearFechaHora(act.fecha_inicio, act.fecha_fin) }}
            </p>
          </div>
        </div>

        <div class="flex flex-col sm:items-end gap-1 shrink-0 pl-16 sm:pl-0">
          <div class="flex items-center gap-2">
            <span
              v-if="act.precio != null"
              class="text-sm font-bold text-[#202759]"
            >
              ${{ act.precio.toLocaleString('es-AR') }}
            </span>
            <span
              :class="[
                'px-3 py-1 rounded-full text-xs font-bold',
                claseBadgeEstado(act.estado),
              ]"
            >
              {{ act.estado }}
            </span>
          </div>
          <span v-if="act.fecha_creacion" class="text-xs text-slate-400">
            Reservada {{ formatearFechaReserva(act.fecha_creacion) }}
          </span>
        </div>
      </div>

      <div
        v-if="totalPaginas > 1"
        class="flex items-center justify-between pt-4 border-t border-slate-200 text-sm text-slate-600"
      >
        <span
          >Página {{ page }} de {{ totalPaginas }} ({{
            totalRegistros
          }}
          reservas)</span
        >
        <div class="flex gap-2">
          <BaseButton
            variant="outline"
            size="sm"
            :disabled="page <= 1"
            @click="cambiarPagina(page - 1)"
          >
            Anterior
          </BaseButton>
          <BaseButton
            variant="outline"
            size="sm"
            :disabled="page >= totalPaginas"
            @click="cambiarPagina(page + 1)"
          >
            Siguiente
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>
