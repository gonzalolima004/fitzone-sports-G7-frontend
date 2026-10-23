import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  normalizarFecha,
  obtenerFechaLocalISO,
  formatearFechaDDMMAAAA,
  formatearFechaLegible,
  formatearFechaCompleta,
  obtenerNombreDia,
  obtenerNombreDiaCorto,
  generarDiasAgenda,
  compararHorarios,
  formatearDiasSemana,
  coincideFechaClase,
  obtenerEstadoVentanaReserva,
} from '@/common/utils/date-formatter'

describe('Módulo utilitario date-formatter (E12-T2)', () => {
  describe('normalizarFecha y formateo base', () => {
    it('normaliza fechas en formato YYYY-MM-DD sin desfase horario', () => {
      const fecha = normalizarFecha('2026-10-21')
      expect(fecha.getFullYear()).toBe(2026)
      expect(fecha.getMonth()).toBe(9) // Octubre (0-indexed)
      expect(fecha.getDate()).toBe(21)
    })

    it('normaliza cadenas ISO completas provenientes de la base de datos', () => {
      const fecha = normalizarFecha('2026-10-25T00:00:00.000Z')
      expect(fecha.getFullYear()).toBe(2026)
      expect(fecha.getMonth()).toBe(9)
      expect(fecha.getDate()).toBe(25)
    })

    it('retorna la fecha local en formato YYYY-MM-DD', () => {
      const d = new Date(2026, 9, 21, 15, 30)
      expect(obtenerFechaLocalISO(d)).toBe('2026-10-21')
    })

    it('formatea fechas al estándar dd/mm/aaaa', () => {
      expect(formatearFechaDDMMAAAA('2026-10-05')).toBe('05/10/2026')
      expect(formatearFechaDDMMAAAA('2026-12-31')).toBe('31/12/2026')
    })

    it('formatea fechas legibles en español', () => {
      // 21 de Octubre de 2026 es Miércoles
      const fecha = '2026-10-21'
      expect(formatearFechaLegible(fecha)).toBe('Miércoles 21 de Octubre')
      expect(formatearFechaCompleta(fecha)).toContain('2026')
      expect(obtenerNombreDia(fecha)).toBe('Miércoles')
      expect(obtenerNombreDiaCorto(fecha)).toBe('Mié')
    })
  })

  describe('generarDiasAgenda y compararHorarios', () => {
    it('genera una tira semanal de 7 días consecutivos', () => {
      const dias = generarDiasAgenda('2026-10-21', 7)
      expect(dias).toHaveLength(7)
      expect(dias[0]?.fechaISO).toBe('2026-10-21')
      expect(dias[6]?.fechaISO).toBe('2026-10-27')
    })

    it('ordena horarios cronológicamente de forma ascendente', () => {
      const horarios = ['18:00', '08:30', '14:00', '07:00']
      const ordenados = horarios.sort(compararHorarios)
      expect(ordenados).toEqual(['07:00', '08:30', '14:00', '18:00'])
    })
  })

  describe('formatearDiasSemana', () => {
    it('retorna cadena vacía para arrays vacíos o nulos', () => {
      expect(formatearDiasSemana([])).toBe('')
      expect(formatearDiasSemana(undefined)).toBe('')
    })

    it('retorna "Todos los días" cuando contiene los 7 días de la semana', () => {
      expect(formatearDiasSemana([0, 1, 2, 3, 4, 5, 6])).toBe('Todos los días')
    })

    it('formatea días de semana laborales ordenados desde Lunes', () => {
      expect(formatearDiasSemana([5, 1, 3])).toBe('Lun, Mié, Vie')
      expect(formatearDiasSemana([2, 4])).toBe('Mar, Jue')
    })

    it('formatea fines de semana', () => {
      expect(formatearDiasSemana([0, 6])).toBe('Sáb, Dom')
    })
  })

  describe('coincideFechaClase', () => {
    it('hace coincidir una clase puntual únicamente con su fecha específica', () => {
      const clase = { fecha: '2026-10-25', dias_semana: [] }
      expect(coincideFechaClase(clase, '2026-10-25')).toBe(true)
      expect(coincideFechaClase(clase, '2026-10-26')).toBe(false)
    })

    it('evalúa correctamente clases recurrentes por día de la semana', () => {
      // 2026-10-21 es Miércoles (día 3)
      // 2026-10-22 es Jueves (día 4)
      const claseLMyV = { fecha: null, dias_semana: [1, 3, 5] }
      expect(coincideFechaClase(claseLMyV, '2026-10-21')).toBe(true)
      expect(coincideFechaClase(claseLMyV, '2026-10-22')).toBe(false)
    })

    it('acepta cualquier fecha si la clase no define restricciones de periodicidad', () => {
      const claseAbierta = { fecha: null, dias_semana: [] }
      expect(coincideFechaClase(claseAbierta, '2026-10-21')).toBe(true)
      expect(coincideFechaClase(claseAbierta, '2026-10-22')).toBe(true)
    })
  })

  describe('obtenerEstadoVentanaReserva (Regla de 48 hs y Clases Pasadas)', () => {
    beforeEach(() => {
      // Fijar hora del sistema: Miércoles 21/10/2026 a las 10:00:00
      vi.useFakeTimers()
      vi.setSystemTime(new Date(2026, 9, 21, 10, 0, 0))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('permite reservar una clase dentro de la ventana de 48 horas', () => {
      // Mismo día a las 18:00 (dentro de 8 horas)
      const resHoy = obtenerEstadoVentanaReserva('2026-10-21', '18:00')
      expect(resHoy.puedeReservar).toBe(true)

      // Mañana 22/10 a las 10:00 (dentro de 24 horas)
      const resManana = obtenerEstadoVentanaReserva('2026-10-22', '10:00')
      expect(resManana.puedeReservar).toBe(true)

      // Pasado mañana 23/10 a las 09:00 (dentro de 47 horas)
      const resPasado = obtenerEstadoVentanaReserva('2026-10-23', '09:00')
      expect(resPasado.puedeReservar).toBe(true)
    })

    it('bloquea la reserva de clases a más de 48 horas en el futuro', () => {
      // Sábado 24/10 a las 11:00 (a más de 70 horas)
      const res = obtenerEstadoVentanaReserva('2026-10-24', '11:00')
      expect(res.puedeReservar).toBe(false)
      expect(res.motivoBloqueo).toBe('FUTURO_LEJANO')
      expect(res.mensajeBloqueo).toBe('Abre 48 hs antes')
    })

    it('bloquea la reserva de clases que ya iniciaron o finalizaron en el pasado', () => {
      // Hoy a las 08:00 (ya pasaron 2 horas desde las 10:00)
      const resHoyPasado = obtenerEstadoVentanaReserva('2026-10-21', '08:00')
      expect(resHoyPasado.puedeReservar).toBe(false)
      expect(resHoyPasado.motivoBloqueo).toBe('PASADO')
      expect(resHoyPasado.mensajeBloqueo).toBe('Clase finalizada')

      // Ayer 20/10 a las 18:00
      const resAyer = obtenerEstadoVentanaReserva('2026-10-20', '18:00')
      expect(resAyer.puedeReservar).toBe(false)
      expect(resAyer.motivoBloqueo).toBe('PASADO')
    })
  })
})
