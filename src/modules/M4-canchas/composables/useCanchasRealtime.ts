import { watch, onUnmounted, type Ref, type ComputedRef } from 'vue'
import canchasService from '@/modules/M4-canchas/services/canchas.service'
import type { TurnoReservadoPayload } from '@/modules/M4-canchas/types/canchas.types'

export type SedeIdSource =
  | Ref<number | null | undefined>
  | ComputedRef<number | null | undefined>
  | (() => number | null | undefined)

/**
 * Composable para gestionar la suscripción en tiempo real al canal Supabase Broadcast
 * de la sede activa (`canchas:sede:${idSede}`) escuchando el evento `turno_reservado`.
 * Reacciona a cambios de sede y limpia automáticamente suscripciones al desmontar.
 */
export function useCanchasRealtime(
  sedeSource: SedeIdSource,
  onTurnoReservado: (payload: TurnoReservadoPayload) => void
) {
  let limpiarSuscripcion: (() => void) | null = null

  function suscribir(idSede: number | null | undefined) {
    if (limpiarSuscripcion) {
      limpiarSuscripcion()
      limpiarSuscripcion = null
    }

    if (idSede) {
      limpiarSuscripcion = canchasService.suscribirTurnoReservado(
        idSede,
        onTurnoReservado
      )
    }
  }

  const getter =
    typeof sedeSource === 'function' ? sedeSource : () => sedeSource.value

  watch(
    getter,
    (nuevoId) => {
      suscribir(nuevoId)
    },
    { immediate: true }
  )

  onUnmounted(() => {
    if (limpiarSuscripcion) {
      limpiarSuscripcion()
      limpiarSuscripcion = null
    }
  })

  return {
    desuscribir: () => {
      if (limpiarSuscripcion) {
        limpiarSuscripcion()
        limpiarSuscripcion = null
      }
    },
  }
}

export default useCanchasRealtime
