import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import http from '../common/api/http'

export interface Sede {
  id_sede: number
  nombre: string
  direccion?: string
  telefono?: string
  activo?: boolean
}

export const useSedeStore = defineStore('sede', () => {
  const sedes = ref<Sede[]>([])
  const guardada = localStorage.getItem('id_sede_seleccionada')
  const idSedeSeleccionada = ref<number | null>(
    guardada ? Number(guardada) : null
  )
  const cargando = ref(false)
  const error = ref<string | null>(null)

  // Contador de versión de contexto: cambia cada vez que el usuario cambia de sede
  // para que las vistas limpien datos anteriores y recarguen información
  const versionContexto = ref(0)

  // Sede seleccionada activa
  const sedeSeleccionada = computed<Sede | null>(() => {
    if (sedes.value.length === 0) return null
    return (
      sedes.value.find((s) => s.id_sede === idSedeSeleccionada.value) ||
      sedes.value[0] ||
      null
    )
  })

  // Consultar sedes activas desde la API del backend
  async function cargarSedes() {
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
    }
  }

  // Cambiar la sede activa y actualizar contexto
  function seleccionarSede(id: number) {
    if (idSedeSeleccionada.value !== id) {
      idSedeSeleccionada.value = id
      localStorage.setItem('id_sede_seleccionada', String(id))
      versionContexto.value++
    }
  }

  return {
    sedes,
    idSedeSeleccionada,
    sedeSeleccionada,
    cargando,
    error,
    versionContexto,
    cargarSedes,
    seleccionarSede,
  }
})
