import { describe, expect, it } from 'vitest'
import { validarConEsquema, extraerErroresZod } from '@/common/utils/validation'
import {
  crearCanchaSchema,
  actualizarCanchaSchema,
  canchaSchema,
  crearCanchaTipoSchema,
  actualizarCanchaTipoSchema,
  canchaTipoSchema,
  crearMantenimientoSchema,
  actualizarMantenimientoSchema,
  mantenimientoSchema,
} from '@/modules/M4-canchas/schemas'

describe('M4-canchas: Validaciones con esquemas Zod', () => {
  describe('Helper genérico validarConEsquema', () => {
    it('retorna valido: true y los datos tipados cuando la estructura es correcta', () => {
      const datos = {
        nombre: 'Cancha Central 1',
        id_sede: '1',
        id_cancha_tipo: '2',
        costo_base: '8500',
        disponible: true,
      }

      const res = validarConEsquema(canchaSchema, datos)

      expect(res.valido).toBe(true)
      expect(res.datos).toEqual({
        nombre: 'Cancha Central 1',
        id_sede: 1,
        id_cancha_tipo: 2,
        costo_base: 8500,
        disponible: true,
      })
      expect(res.errores).toEqual({})
      expect(res.primerError).toBeUndefined()
    })

    it('retorna valido: false, mapa de errores por campo y primer error descriptivo al fallar', () => {
      const datos = {
        nombre: '  ',
        id_sede: '',
        id_cancha_tipo: '',
        costo_base: '-10',
      }

      const res = validarConEsquema(canchaSchema, datos)

      expect(res.valido).toBe(false)
      expect(res.datos).toBeUndefined()
      expect(res.errores.nombre).toBeDefined()
      expect(res.errores.id_sede).toBeDefined()
      expect(res.errores.id_cancha_tipo).toBeDefined()
      expect(res.errores.costo_base).toBeDefined()
      expect(res.primerError).toBeTruthy()
    })
  })

  describe('Canchas: crearCanchaSchema y canchaSchema', () => {
    it('mantiene crearCanchaSchema idéntico al alias canchaSchema', () => {
      expect(canchaSchema).toBe(crearCanchaSchema)
    })

    it('valida exitosamente con acentos, ñ, números, espacios y guiones', () => {
      const input = {
        nombre: 'Pádel Techada A - Cancha 1',
        id_sede: '5',
        id_cancha_tipo: 1,
        costo_base: '9500.50',
        disponible: false,
      }

      const res = canchaSchema.safeParse(input)

      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.nombre).toBe('Pádel Techada A - Cancha 1')
        expect(res.data.id_sede).toBe(5)
        expect(res.data.id_cancha_tipo).toBe(1)
        expect(res.data.costo_base).toBe(9500.5)
        expect(res.data.disponible).toBe(false)
      }
    })

    it('asigna disponible: true por defecto si se omite', () => {
      const input = {
        nombre: 'Tenis Polvo 1',
        id_sede: 1,
        id_cancha_tipo: 2,
        costo_base: 12000,
      }

      const res = canchaSchema.safeParse(input)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.disponible).toBe(true)
      }
    })

    it('rechaza símbolos especiales y caracteres peligrosos (inyecciones, comillas, etc.)', () => {
      const nombrePeligroso =
        'Cancha Con Iluminación Experimental´;;;!#"ais0da2'
      const res = canchaSchema.safeParse({
        nombre: nombrePeligroso,
        id_sede: 1,
        id_cancha_tipo: 1,
        costo_base: 5000,
      })

      expect(res.success).toBe(false)
      if (!res.success) {
        const errs = extraerErroresZod(res.error)
        expect(errs.nombre).toBe(
          'El nombre solo puede contener letras, números, espacios y guiones (sin símbolos especiales).'
        )
      }
    })

    it('rechaza comas u otros símbolos no admitidos en el nombre', () => {
      const res = canchaSchema.safeParse({
        nombre: 'Cancha 1, techada',
        id_sede: 1,
        id_cancha_tipo: 1,
        costo_base: 5000,
      })

      expect(res.success).toBe(false)
      if (!res.success) {
        const errs = extraerErroresZod(res.error)
        expect(errs.nombre).toBe(
          'El nombre solo puede contener letras, números, espacios y guiones (sin símbolos especiales).'
        )
      }
    })

    it('rechaza nombres vacíos o que exceden los 50 caracteres', () => {
      const resVacio = canchaSchema.safeParse({
        nombre: '   ',
        id_sede: 1,
        id_cancha_tipo: 1,
        costo_base: 5000,
      })
      expect(resVacio.success).toBe(false)

      const resLargo = canchaSchema.safeParse({
        nombre: 'Cancha '.repeat(10), // > 50 chars
        id_sede: 1,
        id_cancha_tipo: 1,
        costo_base: 5000,
      })
      expect(resLargo.success).toBe(false)
      if (!resLargo.success) {
        const errs = extraerErroresZod(resLargo.error)
        expect(errs.nombre).toBe(
          'El nombre no puede superar los 50 caracteres.'
        )
      }
    })

    it('rechaza costo_base menor o igual a cero', () => {
      const res = canchaSchema.safeParse({
        nombre: 'Cancha Válida',
        id_sede: 1,
        id_cancha_tipo: 1,
        costo_base: 0,
      })

      expect(res.success).toBe(false)
      if (!res.success) {
        const errs = extraerErroresZod(res.error)
        expect(errs.costo_base).toBe('El costo base debe ser mayor a 0.')
      }
    })

    it('rechaza costo_base con más de 2 decimales', () => {
      const res = canchaSchema.safeParse({
        nombre: 'Cancha Válida',
        id_sede: 1,
        id_cancha_tipo: 1,
        costo_base: 8500.999,
      })

      expect(res.success).toBe(false)
      if (!res.success) {
        const errs = extraerErroresZod(res.error)
        expect(errs.costo_base).toBe('El costo base admite hasta 2 decimales.')
      }
    })

    it('rechaza costo_base que supere el límite máximo (99999999.99)', () => {
      const res = canchaSchema.safeParse({
        nombre: 'Cancha Válida',
        id_sede: 1,
        id_cancha_tipo: 1,
        costo_base: 100_000_000,
      })

      expect(res.success).toBe(false)
      if (!res.success) {
        const errs = extraerErroresZod(res.error)
        expect(errs.costo_base).toBe(
          'El costo base no puede superar los $99.999.999,99.'
        )
      }
    })
  })

  describe('Canchas: actualizarCanchaSchema', () => {
    it('permite actualización parcial de campos', () => {
      const res = actualizarCanchaSchema.safeParse({
        nombre: 'Nuevo Nombre',
        costo_base: '15000',
        activo: false,
      })

      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.nombre).toBe('Nuevo Nombre')
        expect(res.data.costo_base).toBe(15000)
        expect(res.data.activo).toBe(false)
      }
    })

    it('valida restricciones de formato si el nombre se incluye en la edición', () => {
      const res = actualizarCanchaSchema.safeParse({
        nombre: 'Cancha; Maliciosa!',
      })

      expect(res.success).toBe(false)
      if (!res.success) {
        const errs = extraerErroresZod(res.error)
        expect(errs.nombre).toBe(
          'El nombre solo puede contener letras, números, espacios y guiones (sin símbolos especiales).'
        )
      }
    })
  })

  describe('Tipos de Cancha: crearCanchaTipoSchema y canchaTipoSchema', () => {
    it('mantiene crearCanchaTipoSchema idéntico al alias canchaTipoSchema', () => {
      expect(canchaTipoSchema).toBe(crearCanchaTipoSchema)
    })

    it('valida un tipo de cancha correcto con acentos y espacios', () => {
      const res = canchaTipoSchema.safeParse({
        descripcion: '  Fútbol 5 Sintético  ',
      })

      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.descripcion).toBe('Fútbol 5 Sintético')
        expect(res.data.activo).toBe(true)
      }
    })

    it('rechaza símbolos especiales en la descripción del deporte', () => {
      const res = canchaTipoSchema.safeParse({
        descripcion: 'Básquet / Techado #1',
      })

      expect(res.success).toBe(false)
      if (!res.success) {
        const errs = extraerErroresZod(res.error)
        expect(errs.descripcion).toBe(
          'La descripción solo puede contener letras, números, espacios y guiones (sin símbolos especiales).'
        )
      }
    })

    it('rechaza descripción que supere los 50 caracteres', () => {
      const res = canchaTipoSchema.safeParse({
        descripcion: 'A'.repeat(51),
      })

      expect(res.success).toBe(false)
      if (!res.success) {
        const errs = extraerErroresZod(res.error)
        expect(errs.descripcion).toBe(
          'La descripción no puede superar los 50 caracteres.'
        )
      }
    })

    it('en edición admite actualizar únicamente la descripción o el estado activo', () => {
      const res1 = actualizarCanchaTipoSchema.safeParse({
        descripcion: 'Vóley Playa',
      })
      expect(res1.success).toBe(true)

      const res2 = actualizarCanchaTipoSchema.safeParse({
        activo: false,
      })
      expect(res2.success).toBe(true)
    })
  })

  describe('Mantenimiento: crearMantenimientoSchema y mantenimientoSchema', () => {
    it('mantiene crearMantenimientoSchema idéntico al alias mantenimientoSchema', () => {
      expect(mantenimientoSchema).toBe(crearMantenimientoSchema)
    })

    it('valida una programación con fechas coherentes', () => {
      const res = mantenimientoSchema.safeParse({
        id_cancha: '3',
        fecha_inicio: '2026-11-20T08:00',
        fecha_fin: '2026-11-20T14:00',
        motivo: 'Pintura y cambio de red',
      })

      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.id_cancha).toBe(3)
        expect(res.data.fecha_inicio).toBe('2026-11-20T08:00')
        expect(res.data.fecha_fin).toBe('2026-11-20T14:00')
        expect(res.data.motivo).toBe('Pintura y cambio de red')
      }
    })

    it('falla con mensaje específico en fecha_fin si es anterior o igual a fecha_inicio', () => {
      const res = mantenimientoSchema.safeParse({
        id_cancha: 1,
        fecha_inicio: '2026-11-20T15:00',
        fecha_fin: '2026-11-20T10:00',
        motivo: '',
      })

      expect(res.success).toBe(false)
      if (!res.success) {
        const errs = extraerErroresZod(res.error)
        expect(errs.fecha_fin).toBe(
          'La fecha de fin debe ser posterior a la fecha de inicio.'
        )
      }
    })

    it('rechaza si falta la cancha seleccionada o es cero', () => {
      const res = mantenimientoSchema.safeParse({
        id_cancha: '',
        fecha_inicio: '2026-11-20T08:00',
        fecha_fin: '2026-11-20T14:00',
      })

      expect(res.success).toBe(false)
      if (!res.success) {
        const errs = extraerErroresZod(res.error)
        expect(errs.id_cancha).toBe('Debes seleccionar una cancha válida.')
      }
    })

    it('rechaza motivos que superen los 255 caracteres', () => {
      const res = mantenimientoSchema.safeParse({
        id_cancha: 1,
        fecha_inicio: '2026-11-20T08:00',
        fecha_fin: '2026-11-20T14:00',
        motivo: 'A'.repeat(256),
      })

      expect(res.success).toBe(false)
      if (!res.success) {
        const errs = extraerErroresZod(res.error)
        expect(errs.motivo).toBe(
          'El motivo no puede superar los 255 caracteres.'
        )
      }
    })

    it('en edición realiza validación cruzada si ambas fechas están presentes', () => {
      const resInvalido = actualizarMantenimientoSchema.safeParse({
        fecha_inicio: '2026-11-20T15:00',
        fecha_fin: '2026-11-20T10:00',
      })
      expect(resInvalido.success).toBe(false)

      const resValido = actualizarMantenimientoSchema.safeParse({
        motivo: 'Solo cambio de motivo',
      })
      expect(resValido.success).toBe(true)
    })
  })
})
