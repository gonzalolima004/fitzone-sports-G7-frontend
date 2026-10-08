<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { PhBicycle, PhPlug, PhTray, PhWarning } from '@phosphor-icons/vue'
import { useSedeStore } from '@/store/sede'
import axios from 'axios'
import { clasesService, type ClaseResponse } from '../services/clases.service'
import ClaseCard, { type ClaseCardProps } from '../components/ClaseCard.vue'
import BaseModal from '@/common/components/BaseModal.vue'
import BaseButton from '@/common/components/BaseButton.vue'
import { toast } from '@/common/utils/toast'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/common/utils/supabase'

const sedeStore = useSedeStore()

const fechaSeleccionada = ref<string>('')
const fechasDisponibles = ref<
  { fecha: Date; label: string; shortLabel: string }[]
>([])

const clases = ref<ClaseResponse[]>([])
const cargando = ref(false)
const error = ref<string | null>(null)
const authStore = useAuthStore()

// Diccionario local para rastrear id_clase -> id_reserva en esta sesión
const misReservasLocal = ref<Record<number, number>>({})
const misListasEsperaLocal = ref<Record<number, number>>({})

// Mapeo dinámico para simular los datos que faltan en el backend
const clasesAgendadas = computed<ClaseCardProps[]>(() => {
  return clases.value.map((clase, index) => {
    // Generamos datos simulados basados en el ID para mantener consistencia
    const esSpinning = clase.nombre.toLowerCase().includes('spinning')
    const esYoga = clase.nombre.toLowerCase().includes('yoga')

    let tipo = 'CROSSFIT'
    let icono = 'barbell'
    if (esSpinning) {
      tipo = 'SPINNING'
      icono = 'bicycle'
    } else if (esYoga) {
      tipo = 'YOGA VINYASA'
      icono = 'lotus'
    }

    const cuposOcupados =
      index % 3 === 0
        ? clase.capacidad_maxima
        : Math.floor(clase.capacidad_maxima * 0.7)

    let estado: ClaseCardProps['estado'] =
      cuposOcupados >= clase.capacidad_maxima ? 'COMPLETO' : 'DISPONIBLE'

    if (misReservasLocal.value[clase.id_clase]) {
      estado = 'MISMA_RESERVA'
    } else if (misListasEsperaLocal.value[clase.id_clase]) {
      estado = 'EN_ESPERA'
    }

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

// Escuchar cambios en tiempo real desde Supabase para aviso de vacantes
let vacantesSubscription: ReturnType<typeof supabase.channel> | null = null

function setupRealtimeNotifications() {
  if (!authStore.usuario?.id) return

  // Suscribirnos a la tabla lista_espera buscando cuando nuestro estado cambie a NOTIFICADO
  vacantesSubscription = supabase
    .channel('lista-espera-vacantes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'lista_espera',
        filter: `id_usuario=eq.${authStore.usuario.id}`,
      },
      (payload) => {
        const newData = payload.new as { estado: string }
        if (newData.estado === 'NOTIFICADO') {
          toast.success(
            `¡Se ha liberado un lugar en tu clase! Revisa tus notificaciones para confirmar la reserva.`,
            { autoClose: false } // No auto-cerrar para que lo vea seguro
          )
          cargarClases()
        }
      }
    )
    .subscribe()
}

onMounted(() => {
  generarFechas()
  if (sedeStore.idSedeSeleccionada) {
    cargarClases()
  }
  setupRealtimeNotifications()
})

onUnmounted(() => {
  if (vacantesSubscription) {
    supabase.removeChannel(vacantesSubscription)
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

// ESTADO MODAL RESERVA
const modalReservaVisible = ref(false)
const claseAReservar = ref<ClaseCardProps | null>(null)
const reservando = ref(false)
const errorReserva = ref<string | null>(null)

function handleReservar(idClase: number) {
  const clase = clasesAgendadas.value.find((c) => c.id === idClase)
  if (clase) {
    claseAReservar.value = clase
    errorReserva.value = null
    modalReservaVisible.value = true
  }
}

async function confirmarReserva() {
  if (!claseAReservar.value) return

  reservando.value = true
  try {
    const res = await clasesService.reservarClase({
      id_clase: claseAReservar.value.id,
      fecha: fechaSeleccionada.value,
    })

    // Guardar en el estado local el id_reserva
    misReservasLocal.value[claseAReservar.value.id] = res.id_reserva

    toast.success(`Reserva confirmada para ${claseAReservar.value.nombre}`)
    modalReservaVisible.value = false
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      errorReserva.value =
        err.response?.data?.message ||
        'Ocurrió un error al intentar reservar la clase.'
    } else {
      errorReserva.value = 'Ocurrió un error inesperado.'
    }
  } finally {
    reservando.value = false
    await cargarClases()
  }
}

// ESTADO MODAL LISTA DE ESPERA
const modalEsperaVisible = ref(false)
const claseAEsperar = ref<ClaseCardProps | null>(null)
const esperando = ref(false)
const errorEspera = ref<string | null>(null)

function handleListaEspera(idClase: number) {
  const clase = clasesAgendadas.value.find((c) => c.id === idClase)
  if (clase) {
    claseAEsperar.value = clase
    errorEspera.value = null
    modalEsperaVisible.value = true
  }
}

async function confirmarListaEspera() {
  if (!claseAEsperar.value) return

  esperando.value = true
  try {
    const res = await clasesService.inscribirListaEspera({
      id_clase: claseAEsperar.value.id,
      fecha: fechaSeleccionada.value,
    })

    misListasEsperaLocal.value[claseAEsperar.value.id] = res.id_lista

    toast.success(`Estás en lista de espera para ${claseAEsperar.value.nombre}`)
    modalEsperaVisible.value = false
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      errorEspera.value =
        err.response?.data?.message || 'Error al anotarse en lista de espera.'
    } else {
      errorEspera.value = 'Ocurrió un error inesperado al anotarse.'
    }
  } finally {
    esperando.value = false
    await cargarClases()
  }
}

// ESTADO MODAL CANCELACIÓN
const modalCancelacionVisible = ref(false)
const cancelando = ref(false)
const claseACancelar = ref<ClaseCardProps | null>(null)
const errorCancelacion = ref<string | null>(null)

function handleCancelar(idClase: number) {
  const clase = clasesAgendadas.value.find((c) => c.id === idClase)
  if (clase) {
    claseACancelar.value = clase
    errorCancelacion.value = null
    modalCancelacionVisible.value = true
  }
}

async function confirmarCancelacion() {
  if (!claseACancelar.value) return
  const idReserva = misReservasLocal.value[claseACancelar.value.id]
  if (!idReserva) return

  cancelando.value = true
  try {
    await clasesService.cancelarReserva(idReserva)
    delete misReservasLocal.value[claseACancelar.value.id]

    toast.info(`Reserva de ${claseACancelar.value.nombre} cancelada.`)
    modalCancelacionVisible.value = false
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      errorCancelacion.value =
        err.response?.data?.message || 'Error al cancelar la reserva.'
    } else {
      errorCancelacion.value = 'Ocurrió un error inesperado al cancelar.'
    }
  } finally {
    cancelando.value = false
    await cargarClases()
  }
}
</script>

<template>
  <div class="p-6 md:p-8 max-w-7xl mx-auto animate-fade-in">
    <!-- Header -->
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
    >
      <div class="flex items-center gap-3">
        <PhBicycle :size="32" weight="duotone" class="text-rose-500" />
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
    <div
      v-if="cargando"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="bg-white rounded-3xl p-6 h-[380px] border border-slate-100 shadow-sm flex flex-col justify-between"
      >
        <div class="flex justify-between items-center mb-5">
          <div class="h-8 w-24 bg-slate-200 rounded-lg"></div>
          <div class="h-4 w-32 bg-slate-200 rounded-full"></div>
        </div>
        <div class="mb-6 flex-grow">
          <div class="h-6 w-3/4 bg-slate-200 rounded-md mb-3"></div>
          <div class="h-4 w-1/2 bg-slate-100 rounded-md"></div>
        </div>
        <div class="mb-6">
          <div class="flex justify-between mb-2">
            <div class="h-4 w-20 bg-slate-200 rounded-md"></div>
            <div class="h-4 w-16 bg-slate-200 rounded-md"></div>
          </div>
          <div class="h-2.5 w-full bg-slate-100 rounded-full mb-3"></div>
          <div class="h-3 w-4/5 bg-slate-100 rounded-md"></div>
        </div>
        <div class="h-12 w-full bg-slate-200 rounded-xl"></div>
      </div>
    </div>

    <div
      v-else-if="error"
      class="bg-rose-50 rounded-3xl p-8 text-center border-2 border-rose-100 animate-fade-in shadow-sm"
    >
      <PhPlug :size="48" weight="duotone" class="text-rose-500 mx-auto mb-4" />
      <h3 class="text-xl font-bold text-rose-700 mb-2">
        Oops, tuvimos un problema de conexión
      </h3>
      <p class="text-rose-600 font-medium mb-6 max-w-md mx-auto">{{ error }}</p>
      <button
        class="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md active:scale-95"
        @click="cargarClases"
      >
        Volver a intentar
      </button>
    </div>

    <div
      v-else-if="clasesAgendadas.length === 0"
      class="text-center p-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl animate-fade-in flex flex-col items-center justify-center"
    >
      <PhTray :size="52" weight="duotone" class="text-slate-400 mx-auto mb-4" />
      <h3 class="text-xl font-bold text-slate-700 mb-2">Agenda despejada</h3>
      <p class="text-slate-500 font-medium max-w-sm">
        No hay clases grupales programadas para la Sede actual en la fecha que
        seleccionaste.
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
        @cancelar="handleCancelar"
      />
    </div>

    <!-- Modal de Confirmación de Reserva -->
    <BaseModal
      v-model="modalReservaVisible"
      title="Confirmar Reserva"
      :subtitle="
        claseAReservar
          ? `¿Deseas reservar un cupo para ${claseAReservar.nombre}?`
          : ''
      "
    >
      <div
        v-if="claseAReservar"
        class="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-2"
      >
        <ul class="space-y-3 text-sm text-slate-700">
          <li class="flex items-center gap-2">
            <span class="font-semibold w-20">Clase:</span>
            <span>{{ claseAReservar.nombre }}</span>
          </li>
          <li class="flex items-center gap-2">
            <span class="font-semibold w-20">Horario:</span>
            <span>{{ claseAReservar.horario }}</span>
          </li>
          <li class="flex items-center gap-2">
            <span class="font-semibold w-20">Día:</span>
            <span>{{ fechaSeleccionada }}</span>
          </li>
          <li class="flex items-center gap-2">
            <span class="font-semibold w-20">Profesor:</span>
            <span>{{ claseAReservar.profesor }}</span>
          </li>
        </ul>
      </div>

      <div
        v-if="errorReserva"
        class="bg-rose-50 text-rose-700 p-3 rounded-lg text-sm border border-rose-200 mt-4 flex gap-2 items-start"
      >
        <PhWarning
          :size="20"
          weight="fill"
          class="shrink-0 text-rose-500 mt-0.5"
        />
        <p class="font-medium">{{ errorReserva }}</p>
      </div>

      <template #actions>
        <BaseButton variant="outline" @click="modalReservaVisible = false">
          Cancelar
        </BaseButton>
        <BaseButton
          variant="primary"
          :loading="reservando"
          @click="confirmarReserva"
        >
          Confirmar Reserva
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Modal de Confirmación de Cancelación -->
    <BaseModal
      v-model="modalCancelacionVisible"
      title="Cancelar Reserva"
      :subtitle="
        claseACancelar
          ? `¿Estás seguro que deseas cancelar tu lugar en ${claseACancelar.nombre}?`
          : ''
      "
    >
      <p class="text-slate-600 mb-4">
        Si cancelas, liberarás tu lugar. Tené en cuenta que si querés volver a
        anotarte, estarás sujeto a la disponibilidad de cupos en ese momento.
      </p>

      <div
        v-if="errorCancelacion"
        class="bg-rose-50 text-rose-700 p-3 rounded-lg text-sm border border-rose-200 mt-2 mb-4 flex gap-2 items-start"
      >
        <PhWarning
          :size="20"
          weight="fill"
          class="shrink-0 text-rose-500 mt-0.5"
        />
        <p class="font-medium">{{ errorCancelacion }}</p>
      </div>

      <template #actions>
        <BaseButton variant="outline" @click="modalCancelacionVisible = false">
          Volver
        </BaseButton>
        <BaseButton
          variant="danger"
          :loading="cancelando"
          @click="confirmarCancelacion"
        >
          Sí, Cancelar Reserva
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Modal de Confirmación de Lista de Espera -->
    <BaseModal
      v-model="modalEsperaVisible"
      title="Anotarse en Lista de Espera"
      :subtitle="
        claseAEsperar
          ? `La clase ${claseAEsperar.nombre} está completa. ¿Deseas anotarte en la lista de espera?`
          : ''
      "
    >
      <p class="text-slate-600 mb-4">
        Te avisaremos si se libera un lugar. Si se libera, tendrás un tiempo
        limitado para confirmar tu asistencia antes de que el lugar pase al
        siguiente socio en la lista.
      </p>

      <div
        v-if="errorEspera"
        class="bg-rose-50 text-rose-700 p-3 rounded-lg text-sm border border-rose-200 mt-2 mb-4 flex gap-2 items-start"
      >
        <PhWarning
          :size="20"
          weight="fill"
          class="shrink-0 text-rose-500 mt-0.5"
        />
        <p class="font-medium">{{ errorEspera }}</p>
      </div>

      <template #actions>
        <BaseButton variant="outline" @click="modalEsperaVisible = false">
          Cancelar
        </BaseButton>
        <BaseButton
          variant="primary"
          :loading="esperando"
          @click="confirmarListaEspera"
        >
          Anotarme
        </BaseButton>
      </template>
    </BaseModal>
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
