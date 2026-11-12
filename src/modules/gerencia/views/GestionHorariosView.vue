<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  PhArrowCounterClockwise,
  PhArrowsClockwise,
  PhInfo,
  PhTrash,
  PhWarning,
} from '@phosphor-icons/vue'
import BaseButton from '@/common/components/BaseButton.vue'
import BaseSkeleton from '@/common/components/BaseSkeleton.vue'
import { useSedeStore } from '@/store/sede'
import { toast } from '@/common/utils/toast'
import EncabezadoGerencia from '../components/EncabezadoGerencia.vue'
import PestanasGerencia from '../components/PestanasGerencia.vue'
import { horariosService } from '../services/horarios.service'
import { horarioDeAperturaSchema } from '../schemas/horarios.schema'
import { erroresPorCampo } from '../utils/validacion'
import { obtenerMensajeDeError } from '../utils/errores'
import { PESTANAS_SEDES } from '../utils/navegacion'
import {
  armarSemana,
  diaDesdeGuardado,
  operacionDe,
  type DiaEditable,
  type OperacionHorario,
} from '../utils/horarios'
import type { HorarioSemanal } from '../types/gerencia.types'

const sedeStore = useSedeStore()

const idSede = computed(() => sedeStore.sedeSeleccionada?.id_sede ?? null)
const nombreSede = computed(() => sedeStore.sedeSeleccionada?.nombre ?? '')

/** La sede es la misma que la del selector del encabezado. */
const sedeElegida = computed({
  get: () => (idSede.value === null ? '' : String(idSede.value)),
  set: (valor: string) => {
    if (valor) sedeStore.seleccionarSede(Number(valor))
  },
})

const dias = ref<DiaEditable[]>([])
const cargando = ref(true)
const errorCarga = ref('')
const guardando = ref(false)
/** Errores de validación por día y por campo. */
const errores = ref<Record<number, Record<string, string>>>({})
/** Rechazos del backend por día. */
const rechazos = ref<Record<number, string>>({})
const avisoGuardado = ref('')

const diasConCambios = computed(() =>
  dias.value.filter((dia) => operacionDe(dia) !== null)
)
const hayCambios = computed(() => diasConCambios.value.length > 0)
const diasSinHorario = computed(
  () => dias.value.filter((dia) => dia.guardado === null).length
)

const enMinusculas = (dia: DiaEditable) => dia.nombre.toLowerCase()

function limpiarMensajes() {
  errores.value = {}
  rechazos.value = {}
  avisoGuardado.value = ''
}

// Si llega la respuesta de una sede anterior, se descarta.
let versionCarga = 0

async function cargarHorarios() {
  const version = ++versionCarga
  const sede = idSede.value
  limpiarMensajes()
  errorCarga.value = ''
  if (sede === null) {
    dias.value = []
    cargando.value = false
    return
  }

  cargando.value = true
  try {
    const horarios = await horariosService.listar(sede)
    if (version !== versionCarga) return
    dias.value = armarSemana(horarios)
  } catch (error: unknown) {
    if (version !== versionCarga) return
    errorCarga.value = obtenerMensajeDeError(
      error,
      'No se pudo cargar el horario. Revisá la conexión e intentá nuevamente.'
    )
  } finally {
    if (version === versionCarga) cargando.value = false
  }
}

/** Al pasar un día a "Abre", propone el horario de otro día que abre. */
function proponerHoras(dia: DiaEditable) {
  if (dia.hora_apertura || dia.hora_cierre) return
  const referencia = dias.value.find(
    (otro) =>
      otro !== dia &&
      otro.atencion === 'abre' &&
      otro.hora_apertura &&
      otro.hora_cierre
  )
  if (referencia) {
    dia.hora_apertura = referencia.hora_apertura
    dia.hora_cierre = referencia.hora_cierre
  }
}

function olvidarErrores(dia: DiaEditable) {
  Reflect.deleteProperty(errores.value, dia.dia)
  Reflect.deleteProperty(rechazos.value, dia.dia)
}

function quitarHorario(dia: DiaEditable) {
  Object.assign(dia, {
    atencion: 'sin-horario',
    hora_apertura: '',
    hora_cierre: '',
  })
  olvidarErrores(dia)
}

function deshacer(dia: DiaEditable) {
  Object.assign(dia, diaDesdeGuardado(dia.dia, dia.nombre, dia.guardado))
  olvidarErrores(dia)
}

function descartarCambios() {
  dias.value = dias.value.map((dia) =>
    diaDesdeGuardado(dia.dia, dia.nombre, dia.guardado)
  )
  limpiarMensajes()
}

function validar(): boolean {
  const encontrados: Record<number, Record<string, string>> = {}
  for (const dia of diasConCambios.value) {
    if (dia.atencion !== 'abre') continue
    const resultado = horarioDeAperturaSchema.safeParse({
      hora_apertura: dia.hora_apertura,
      hora_cierre: dia.hora_cierre,
    })
    if (!resultado.success) {
      encontrados[dia.dia] = erroresPorCampo(resultado.error)
    }
  }
  errores.value = encontrados
  return Object.keys(encontrados).length === 0
}

async function ejecutar(
  sede: number,
  operacion: OperacionHorario
): Promise<HorarioSemanal | null> {
  if (operacion.tipo === 'crear') {
    return horariosService.crear(sede, operacion.datos)
  }
  if (operacion.tipo === 'actualizar') {
    return horariosService.actualizar(
      sede,
      operacion.idHorario,
      operacion.datos
    )
  }
  await horariosService.eliminar(sede, operacion.idHorario)
  return null
}

/**
 * Saca del caché del store los horarios operativos de la sede, para que
 * canchas y clases los vuelvan a pedir con el horario nuevo.
 */
function olvidarHorariosOperativos(sede: number) {
  for (const clave of Object.keys(sedeStore.horariosCache)) {
    if (clave.startsWith(`${sede}_`)) {
      Reflect.deleteProperty(sedeStore.horariosCache, clave)
    }
  }
}

/**
 * Guarda solo los días que cambiaron, con un pedido por día en paralelo. Si
 * alguno falla, los demás quedan guardados y ese día conserva lo editado.
 */
async function guardar() {
  const sede = idSede.value
  if (sede === null || !hayCambios.value || guardando.value) return
  limpiarMensajes()
  if (!validar()) return

  const pendientes = dias.value.flatMap((dia) => {
    const operacion = operacionDe(dia)
    return operacion ? [{ dia, operacion }] : []
  })

  guardando.value = true
  const resultados = await Promise.allSettled(
    pendientes.map(({ operacion }) => ejecutar(sede, operacion))
  )

  const fallidos: string[] = []
  resultados.forEach((resultado, indice) => {
    const { dia } = pendientes[indice]
    if (resultado.status === 'fulfilled') {
      Object.assign(dia, diaDesdeGuardado(dia.dia, dia.nombre, resultado.value))
    } else {
      rechazos.value[dia.dia] = obtenerMensajeDeError(
        resultado.reason,
        'No se pudo guardar este día. Intentá nuevamente.'
      )
      fallidos.push(enMinusculas(dia))
    }
  })
  olvidarHorariosOperativos(sede)
  guardando.value = false

  if (fallidos.length === 0) {
    toast.success(`Horario de ${nombreSede.value} guardado.`)
  } else if (fallidos.length === pendientes.length) {
    avisoGuardado.value =
      'No se pudo guardar el horario. Revisá el mensaje de cada día.'
  } else {
    avisoGuardado.value = `Se guardaron los demás días, pero no ${unir(fallidos)}. Revisá el mensaje de cada uno.`
  }
}

/** Ej.: "el lunes", "el lunes y el martes", "el lunes, el martes y el jueves". */
function unir(nombres: string[]): string {
  const conArticulo = nombres.map((nombre) => `el ${nombre}`)
  return conArticulo.length === 1
    ? conArticulo[0]
    : `${conArticulo.slice(0, -1).join(', ')} y ${conArticulo[conArticulo.length - 1]}`
}

function resumenCambios(cantidad: number): string {
  return cantidad === 1
    ? '1 día con cambios sin guardar.'
    : `${cantidad} días con cambios sin guardar.`
}

let listo = false
watch(idSede, (_nueva, anterior) => {
  if (!listo) return
  if (hayCambios.value && anterior !== null) {
    const nombreAnterior =
      sedeStore.sedes.find((sede) => sede.id_sede === anterior)?.nombre ??
      'la sede anterior'
    toast.info(
      `Se descartaron los cambios sin guardar del horario de ${nombreAnterior}.`
    )
  }
  void cargarHorarios()
})

onMounted(async () => {
  await sedeStore.cargarSedes()
  listo = true
  await cargarHorarios()
})
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    <EncabezadoGerencia
      titulo="Horarios de las sedes"
      descripcion="Apertura y cierre de cada día de la semana. Canchas y clases toman este horario."
      etiqueta="Multi-sede"
    >
      <template #acciones>
        <BaseButton
          variant="outline"
          size="sm"
          title="Actualizar horario"
          :loading="cargando"
          :disabled="hayCambios || guardando"
          @click="cargarHorarios"
        >
          <template #icon>
            <PhArrowsClockwise :size="15" />
          </template>
          Actualizar
        </BaseButton>
      </template>
    </EncabezadoGerencia>

    <PestanasGerencia
      etiqueta="Secciones de sedes"
      :pestanas="PESTANAS_SEDES"
    />

    <section
      aria-label="Sede"
      class="p-4 bg-white rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-x-4 gap-y-3"
    >
      <div class="flex items-center gap-2 grow sm:grow-0">
        <label
          for="sede-horarios"
          class="text-xs font-bold text-[#202759] whitespace-nowrap"
        >
          Horario de
        </label>
        <select
          id="sede-horarios"
          v-model="sedeElegida"
          :disabled="sedeStore.sedes.length === 0 || hayCambios || guardando"
          :title="
            hayCambios
              ? 'Guardá o descartá los cambios para cambiar de sede'
              : undefined
          "
          class="w-full sm:w-64 px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-[#202759] focus:ring-[#202759]/15 disabled:bg-slate-100"
        >
          <option value="" disabled>
            {{ sedeStore.cargando ? 'Cargando sedes...' : 'Sin sedes' }}
          </option>
          <option
            v-for="sede in sedeStore.sedes"
            :key="sede.id_sede"
            :value="String(sede.id_sede)"
          >
            {{ sede.nombre }}
          </option>
        </select>
      </div>
      <p class="flex items-start gap-1.5 text-xs text-slate-500 m-0 max-w-md">
        <PhInfo :size="15" class="shrink-0 mt-px text-[#202759]" />
        <span>
          Para un feriado, un cierre o un horario especial de un día puntual,
          usá el
          <RouterLink
            :to="{ name: 'gerencia-calendario' }"
            class="font-semibold text-[#202759] underline underline-offset-2"
            >calendario</RouterLink
          >.
        </span>
      </p>
    </section>

    <div
      v-if="errorCarga"
      role="alert"
      class="p-6 bg-white rounded-2xl border border-rose-200 text-center space-y-3"
    >
      <p class="text-sm text-rose-700">{{ errorCarga }}</p>
      <BaseButton variant="outline" size="sm" @click="cargarHorarios">
        Reintentar
      </BaseButton>
    </div>

    <section
      v-else
      aria-labelledby="titulo-semana"
      class="bg-white rounded-2xl border border-slate-200 overflow-hidden"
    >
      <header
        class="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2"
      >
        <h2 id="titulo-semana" class="text-sm font-bold text-[#202759] m-0">
          Semana de {{ nombreSede || 'la sede' }}
        </h2>
        <p
          v-if="!cargando && diasSinHorario > 0"
          data-testid="aviso-sin-horario"
          class="flex items-center gap-1.5 text-xs font-medium text-amber-800 m-0"
        >
          <PhWarning :size="15" class="shrink-0" />
          {{
            diasSinHorario === 1
              ? '1 día sin horario cargado: ese día la sede figura cerrada.'
              : `${diasSinHorario} días sin horario cargado: esos días la sede figura cerrada.`
          }}
        </p>
      </header>

      <div v-if="cargando" class="p-4 space-y-3">
        <BaseSkeleton
          v-for="fila in 7"
          :key="fila"
          width="w-full"
          height="h-11"
        />
      </div>

      <template v-else>
        <div
          class="hidden xl:grid grid-cols-[8rem_12rem_minmax(0,1fr)_minmax(0,1fr)_7.5rem] gap-4 px-4 py-2 bg-slate-50 text-[11px] font-bold uppercase text-slate-500"
          aria-hidden="true"
        >
          <span>Día</span>
          <span>Atención</span>
          <span>Abre a las</span>
          <span>Cierra a las</span>
          <span />
        </div>

        <ul class="divide-y divide-slate-100 m-0 p-0 list-none">
          <li
            v-for="dia in dias"
            :key="dia.dia"
            :data-testid="`dia-${dia.dia}`"
            class="px-4 py-3 grid grid-cols-2 xl:grid-cols-[8rem_12rem_minmax(0,1fr)_minmax(0,1fr)_7.5rem] gap-x-4 gap-y-2 items-center transition-colors"
            :class="operacionDe(dia) ? 'bg-amber-50/60' : ''"
          >
            <div
              class="order-1 xl:order-none flex flex-wrap items-baseline gap-x-2 xl:flex-col xl:gap-0.5"
            >
              <p class="text-sm font-bold text-slate-800 m-0">
                {{ dia.nombre }}
              </p>
              <span
                v-if="operacionDe(dia)?.tipo === 'quitar'"
                class="text-[11px] font-semibold text-rose-700"
                >Se quita al guardar</span
              >
              <span
                v-else-if="operacionDe(dia)"
                class="text-[11px] font-semibold text-amber-800"
                >Sin guardar</span
              >
              <span
                v-else-if="dia.guardado === null"
                class="text-[11px] font-semibold text-amber-800"
                >Sin horario cargado</span
              >
            </div>

            <fieldset
              class="order-3 xl:order-none col-span-2 xl:col-span-1 m-0 p-1 border-0 flex w-fit gap-1 rounded-xl bg-slate-100"
            >
              <legend class="sr-only">
                Atención del {{ enMinusculas(dia) }}
              </legend>
              <label
                :for="`horario-abre-${dia.dia}`"
                class="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#202759]/40"
                :class="
                  dia.atencion === 'abre'
                    ? 'bg-white text-[#202759] shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                "
              >
                <input
                  :id="`horario-abre-${dia.dia}`"
                  v-model="dia.atencion"
                  type="radio"
                  :name="`atencion-${dia.dia}`"
                  value="abre"
                  class="sr-only"
                  :disabled="guardando"
                  @change="proponerHoras(dia)"
                />
                Abre
              </label>
              <label
                :for="`horario-cerrada-${dia.dia}`"
                class="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#202759]/40"
                :class="
                  dia.atencion === 'cerrada'
                    ? 'bg-white text-rose-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                "
              >
                <input
                  :id="`horario-cerrada-${dia.dia}`"
                  v-model="dia.atencion"
                  type="radio"
                  :name="`atencion-${dia.dia}`"
                  value="cerrada"
                  class="sr-only"
                  :disabled="guardando"
                  @change="olvidarErrores(dia)"
                />
                Cerrada
              </label>
            </fieldset>

            <template v-if="dia.atencion === 'abre'">
              <div class="order-4 xl:order-none space-y-1">
                <span
                  class="xl:hidden block text-[11px] font-bold text-slate-500"
                  >Abre a las</span
                >
                <input
                  :id="`horario-apertura-${dia.dia}`"
                  v-model="dia.hora_apertura"
                  type="time"
                  :aria-label="`Hora de apertura del ${enMinusculas(dia)}`"
                  :aria-invalid="Boolean(errores[dia.dia]?.hora_apertura)"
                  :disabled="guardando"
                  class="w-full px-3 py-2 bg-white border rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 disabled:bg-slate-100"
                  :class="
                    errores[dia.dia]?.hora_apertura
                      ? 'border-[#F96167] focus:ring-[#F96167]/20'
                      : 'border-slate-300 focus:border-[#202759] focus:ring-[#202759]/15'
                  "
                />
                <p
                  v-if="errores[dia.dia]?.hora_apertura"
                  class="text-xs text-[#F96167] font-medium m-0"
                >
                  {{ errores[dia.dia]?.hora_apertura }}
                </p>
              </div>
              <div class="order-4 xl:order-none space-y-1">
                <span
                  class="xl:hidden block text-[11px] font-bold text-slate-500"
                  >Cierra a las</span
                >
                <input
                  :id="`horario-cierre-${dia.dia}`"
                  v-model="dia.hora_cierre"
                  type="time"
                  :aria-label="`Hora de cierre del ${enMinusculas(dia)}`"
                  :aria-invalid="Boolean(errores[dia.dia]?.hora_cierre)"
                  :disabled="guardando"
                  class="w-full px-3 py-2 bg-white border rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 disabled:bg-slate-100"
                  :class="
                    errores[dia.dia]?.hora_cierre
                      ? 'border-[#F96167] focus:ring-[#F96167]/20'
                      : 'border-slate-300 focus:border-[#202759] focus:ring-[#202759]/15'
                  "
                />
                <p
                  v-if="errores[dia.dia]?.hora_cierre"
                  class="text-xs text-[#F96167] font-medium m-0"
                >
                  {{ errores[dia.dia]?.hora_cierre }}
                </p>
              </div>
            </template>
            <p
              v-else
              class="order-4 xl:order-none col-span-2 text-xs text-slate-500 m-0"
            >
              {{
                dia.atencion === 'cerrada'
                  ? 'No abre en todo el día.'
                  : 'Figura cerrada hasta que cargues el horario.'
              }}
            </p>

            <div class="order-2 xl:order-none text-right">
              <button
                v-if="operacionDe(dia)"
                type="button"
                class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
                :aria-label="`Deshacer los cambios del ${enMinusculas(dia)}`"
                :disabled="guardando"
                @click="deshacer(dia)"
              >
                <PhArrowCounterClockwise :size="14" />
                Deshacer
              </button>
              <button
                v-else-if="dia.guardado"
                type="button"
                class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer disabled:opacity-50"
                :aria-label="`Quitar el horario del ${enMinusculas(dia)}`"
                :disabled="guardando"
                @click="quitarHorario(dia)"
              >
                <PhTrash :size="14" />
                Quitar
              </button>
            </div>

            <p
              v-if="rechazos[dia.dia]"
              role="alert"
              class="order-5 xl:order-none col-span-2 xl:col-span-5 m-0 p-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg"
            >
              {{ rechazos[dia.dia] }}
            </p>
          </li>
        </ul>

        <p
          v-if="avisoGuardado"
          role="alert"
          class="mx-4 mb-3 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl"
        >
          {{ avisoGuardado }}
        </p>

        <footer
          class="px-4 py-3 border-t border-slate-100 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3"
        >
          <p data-testid="resumen-cambios" class="text-xs text-slate-500 m-0">
            {{
              hayCambios
                ? resumenCambios(diasConCambios.length)
                : 'No hay cambios sin guardar.'
            }}
          </p>
          <div class="flex flex-wrap gap-2">
            <BaseButton
              variant="outline"
              size="sm"
              :disabled="!hayCambios || guardando"
              @click="descartarCambios"
            >
              Descartar cambios
            </BaseButton>
            <BaseButton
              variant="primary"
              size="sm"
              :loading="guardando"
              :disabled="!hayCambios"
              @click="guardar"
            >
              Guardar cambios
            </BaseButton>
          </div>
        </footer>
      </template>
    </section>
  </div>
</template>
