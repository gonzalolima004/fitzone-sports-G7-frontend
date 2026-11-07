import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import http from '../common/api/http'

export interface Ciudad {
  id_ciudad: number
  nombre: string
  activo?: boolean
}

export interface Sede {
  id_sede: number
  nombre: string
  direccion?: string
  telefono?: string
  aforo_maximo?: number
  activo?: boolean
  id_ciudad?: number
}

export interface HorarioOperativo {
  abierto: boolean
  hora_apertura: string
  hora_cierre: string
  motivo_cierre?: string
  es_horario_especial?: boolean
}

export const useSedeStore = defineStore('sede', () => {
  const sedes = ref<Sede[]>([])
  const ciudades = ref<Ciudad[]>([])
  const guardada = localStorage.getItem('id_sede_seleccionada')
  const idSedeSeleccionada = ref<number | null>(
    guardada ? Number(guardada) : null
  )
  const cargando = ref(false)
  const error = ref<string | null>(null)

  // Contador de versión de contexto: cambia cada vez que el usuario cambia de sede
  // para que las vistas limpien datos anteriores y recarguen información
  const versionContexto = ref(0)

  // Caché en memoria para horarios operativos indexado por "idSede_YYYY-MM-DD"
  const horariosCache = ref<Record<string, HorarioOperativo>>({})

  // Sede seleccionada activa
  const sedeSeleccionada = computed<Sede | null>(() => {
    if (sedes.value.length === 0) return null
    return (
      sedes.value.find((s) => s.id_sede === idSedeSeleccionada.value) ||
      sedes.value[0] ||
      null
    )
  })

  // Control de peticiones concurrentes en curso para evitar llamadas redundantes
  let peticionSedesEnCurso: Promise<void> | null = null
  let peticionCiudadesEnCurso: Promise<void> | null = null
  const peticionesHorarioEnCurso = new Map<string, Promise<HorarioOperativo>>()

  // Consultar sedes activas desde la API del backend
  async function cargarSedes(forzar = false) {
    if (!forzar && sedes.value.length > 0) return
    if (peticionSedesEnCurso) return peticionSedesEnCurso

    peticionSedesEnCurso = (async () => {
      cargando.value = true
      error.value = null
      try {
        const respuesta = await http.get<Sede[]>('/sedes')
        sedes.value = Array.isArray(respuesta.data) ? respuesta.data : []

        // Si hay sedes y ninguna seleccionada previamente, seleccionamos la primera
        if (sedes.value.length > 0) {
          const existe = sedes.value.some(
            (s) => s.id_sede === idSedeSeleccionada.value
          )
          if (!existe || idSedeSeleccionada.value === null) {
            seleccionarSede(sedes.value[0].id_sede)
          }
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          error.value =
            (err.response?.data as { message?: string } | undefined)?.message ||
            err.message ||
            'Error al cargar sedes'
        } else if (err instanceof Error) {
          error.value = err.message
        } else {
          error.value = 'Error al cargar sedes'
        }
        console.error('[useSedeStore]:', error.value)
      } finally {
        cargando.value = false
        peticionSedesEnCurso = null
      }
    })()

    return peticionSedesEnCurso
  }

  // Consultar ciudades activas desde la API del backend
  async function cargarCiudades(forzar = false) {
    if (!forzar && ciudades.value.length > 0) return
    if (peticionCiudadesEnCurso) return peticionCiudadesEnCurso

    peticionCiudadesEnCurso = (async () => {
      try {
        const respuesta = await http.get<Ciudad[]>('/ciudades')
        ciudades.value = Array.isArray(respuesta.data) ? respuesta.data : []
      } catch (err: unknown) {
        console.error('[useSedeStore]: Error al cargar ciudades', err)
      } finally {
        peticionCiudadesEnCurso = null
      }
    })()

    return peticionCiudadesEnCurso
  }

  // Cambiar la sede activa y actualizar contexto
  function seleccionarSede(id: number) {
    if (idSedeSeleccionada.value !== id) {
      idSedeSeleccionada.value = id
      localStorage.setItem('id_sede_seleccionada', String(id))
      versionContexto.value++
    }
  }

  // Guarda o actualiza un horario en caché fusionando para no perder banderas como es_horario_especial
  function guardarHorarioEnCache(
    idSede: number,
    fechaStr: string,
    nuevo: HorarioOperativo
  ) {
    const key = `${idSede}_${fechaStr}`
    const actual = horariosCache.value[key]
    horariosCache.value[key] = {
      ...actual,
      ...nuevo,
      es_horario_especial:
        nuevo.es_horario_especial ?? actual?.es_horario_especial,
    }
  }

  // Consulta o devuelve desde memoria el horario operativo de una sede
  async function obtenerHorarioOperativo(
    idSede: number,
    fechaStr: string
  ): Promise<HorarioOperativo> {
    const key = `${idSede}_${fechaStr}`
    if (horariosCache.value[key]) {
      return horariosCache.value[key]
    }
    if (peticionesHorarioEnCurso.has(key)) {
      return peticionesHorarioEnCurso.get(key)!
    }

    const promesa = (async () => {
      try {
        const { data } = await http.get<HorarioOperativo>(
          `/sedes/${idSede}/horario-operativo`,
          { params: { fecha: fechaStr } }
        )
        horariosCache.value[key] = data
        return data
      } finally {
        peticionesHorarioEnCurso.delete(key)
      }
    })()

    peticionesHorarioEnCurso.set(key, promesa)
    return promesa
  }

  return {
    sedes,
    ciudades,
    idSedeSeleccionada,
    sedeSeleccionada,
    cargando,
    error,
    versionContexto,
    horariosCache,
    cargarSedes,
    cargarCiudades,
    seleccionarSede,
    obtenerHorarioOperativo,
    guardarHorarioEnCache,
  }
})
