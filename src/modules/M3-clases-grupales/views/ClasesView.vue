<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useSedeStore } from '@/store/sede'
import axios from 'axios'
import { clasesService, type ClaseResponse } from '../services/clases.service'
import ClaseCard, { type ClaseCardProps } from '../components/ClaseCard.vue'

const sedeStore = useSedeStore()

const fechaSeleccionada = ref<string>('')
const fechasDisponibles = ref<
  { fecha: Date; label: string; shortLabel: string }[]
>([])

const clases = ref<ClaseResponse[]>([])
const cargando = ref(false)
const error = ref<string | null>(null)

// Mapeo dinámico para simular los datos que faltan en el backend
const clasesAgendadas = computed<ClaseCardProps[]>(() => {
  return clases.value.map((clase, index) => {
    // Generamos datos simulados basados en el ID para mantener consistencia
    const esSpinning = clase.nombre.toLowerCase().includes('spinning')
    const esYoga = clase.nombre.toLowerCase().includes('yoga')

    let tipo = 'CROSSFIT'
    let icono = '🏋️'
    if (esSpinning) {
      tipo = 'SPINNING'
      icono = '🚴‍♂️'
    } else if (esYoga) {
      tipo = 'YOGA VINYASA'
      icono = '🧘‍♀️'
    }

    const cuposOcupados =
      index % 3 === 0
        ? clase.capacidad_maxima
        : Math.floor(clase.capacidad_maxima * 0.7)
    const estado =
      cuposOcupados >= clase.capacidad_maxima ? 'COMPLETO' : 'DISPONIBLE'

    // Horarios simulados secuenciales
    const horaInicio = 8 + index * 2
    const horario = `${horaInicio.toString().padStart(2, '0')}:30 - ${(horaInicio + 1).toString().padStart(2, '0')}:15 hs`

    return {
      id: clase.id_clase,
      nombre: clase.nombre,
      tipo,
      icono,
      horario,
      profesor: `Prof. ${['Laura Méndez', 'Martín Sosa', 'Juan Pablo Rossi'][index % 3]}`,
      sala: esSpinning ? 'Sala 1' : esYoga ? 'Sala Zen' : 'Box Central',
      capacidadMaxima: clase.capacidad_maxima,
      cuposOcupados,
      enListaEspera: estado === 'COMPLETO' ? 3 : 0,
      estado,
    }
  })
})

onMounted(() => {
  generarFechas()
  if (sedeStore.idSedeSeleccionada) {
    cargarClases()
  }
})

watch(
  () => sedeStore.idSedeSeleccionada,
  (nuevoId) => {
    if (nuevoId) {
      cargarClases()
    } else {
      clases.value = []
    }
  }
)

async function cargarClases() {
  if (!sedeStore.idSedeSeleccionada) return
  cargando.value = true
  error.value = null
  try {
    clases.value = await clasesService.obtenerClasesPorSede(
      sedeStore.idSedeSeleccionada
    )
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      error.value = err.response?.data?.message || 'Error al cargar las clases.'
    } else {
      error.value = 'Error al cargar las clases.'
    }
  } finally {
    cargando.value = false
  }
}

function generarFechas() {
  const fechas = []
  const diasSemana = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
  ]
  const hoy = new Date()

  for (let i = 0; i < 5; i++) {
    const fecha = new Date(hoy.getTime())
    fecha.setDate(hoy.getDate() + i)

    const label =
      i === 0
        ? `Hoy (${diasSemana[fecha.getDay()]} ${fecha.getDate()})`
        : `${diasSemana[fecha.getDay()]} ${fecha.getDate()}`

    fechas.push({
      fecha,
      label,
      shortLabel: fecha.toISOString().split('T')[0], // Formato YYYY-MM-DD
    })
  }

  fechasDisponibles.value = fechas
  fechaSeleccionada.value = fechas[0].shortLabel
}

function seleccionarFecha(fechaStr: string) {
  fechaSeleccionada.value = fechaStr
}

function handleReservar(idClase: number) {
  console.log('Reservar clase:', idClase)
  // Próximamente: Llamar endpoint de reserva
}

function handleListaEspera(idClase: number) {
  console.log('Anotarse en lista de espera:', idClase)
  // Próximamente: Llamar endpoint de lista de espera
}
</script>

<template>
  <div class="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in">
    <!-- Header -->
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
    >
      <div class="flex items-center gap-3">
        <span class="text-3xl" role="img" aria-label="Bicicleta">🚴‍♂️</span>
        <h1 class="text-2xl font-extrabold text-slate-800 tracking-tight">
          Agenda de Clases Grupales
        </h1>
      </div>

      <div class="flex flex-wrap items-center gap-3 text-xs md:text-sm">
        <div
          class="bg-white text-slate-600 px-4 py-2.5 rounded-full font-semibold border border-slate-200 shadow-sm flex items-center gap-2"
        >
          <span class="text-slate-400">Sede:</span>
          <span class="text-slate-800">{{
            sedeStore.sedeSeleccionada?.nombre || 'Sin seleccionar'
          }}</span>
        </div>
        <div
          class="bg-white text-slate-600 px-4 py-2.5 rounded-full font-semibold border border-slate-200 shadow-sm uppercase tracking-wide"
        >
          Reserva con 48 hs de anticipación
        </div>
      </div>
    </div>

    <!-- Alert / Info -->
    <div
      class="bg-sky-50 border border-sky-100 rounded-2xl p-5 mb-8 flex items-start gap-4 shadow-sm"
    >
      <div
        class="bg-sky-200/50 p-2 rounded-lg flex-shrink-0 mt-0.5 text-sky-600"
      >
        <svg
          class="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clip-rule="evenodd"
          ></path>
        </svg>
      </div>
      <div class="text-sky-800 text-sm leading-relaxed">
        <strong class="font-bold"
          >Regla de Reserva y Cancelación (RF-07):</strong
        >
        Las reservas abren 48 hs antes de cada clase. Podés cancelar tu reserva
        sin penalidad hasta
        <strong class="font-bold text-sky-900">2 horas antes</strong> del inicio
        para liberar el cupo al siguiente socio en lista de espera.
      </div>
    </div>

    <!-- Filtro Fechas -->
    <div
      class="flex flex-nowrap md:flex-wrap overflow-x-auto gap-3 mb-8 pb-2 md:pb-0 scrollbar-hide"
    >
      <button
        v-for="fecha in fechasDisponibles"
        :key="fecha.shortLabel"
        :class="[
          'whitespace-nowrap px-6 py-3 rounded-2xl font-bold transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 border',
          fechaSeleccionada === fecha.shortLabel
            ? 'bg-rose-500 text-white border-rose-500 shadow-rose-200/50'
            : 'bg-white text-slate-600 border-slate-200 hover:border-rose-200 hover:text-rose-500',
        ]"
        @click="seleccionarFecha(fecha.shortLabel)"
      >
        {{ fecha.label }}
      </button>
    </div>

    <!-- Grilla de Clases -->
    <div v-if="cargando" class="flex justify-center p-12">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"
      ></div>
    </div>

    <div
      v-else-if="error"
      class="bg-rose-50 text-rose-600 p-6 rounded-2xl text-center font-medium border border-rose-100"
    >
      {{ error }}
    </div>

    <div
      v-else-if="clasesAgendadas.length === 0"
      class="text-center p-12 bg-slate-50 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl"
    >
      <p class="font-medium">
        No hay clases programadas para esta sede en la fecha seleccionada.
      </p>
    </div>

    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in"
    >
      <ClaseCard
        v-for="clase in clasesAgendadas"
        :key="clase.id"
        :clase="clase"
        @reservar="handleReservar"
        @lista-espera="handleListaEspera"
      />
    </div>
  </div>
</template>

<style scoped>
/* Ocultar barra de desplazamiento para el filtro de fechas en móviles */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
