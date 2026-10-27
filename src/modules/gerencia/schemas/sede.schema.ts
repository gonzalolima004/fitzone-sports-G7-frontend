import { z } from 'zod'

/**
 * Validación del formulario de sedes. Replica las reglas de CreateSedeDto del
 * backend (nombre y dirección de hasta 50 caracteres, aforo entero positivo y
 * ciudad obligatoria) para avisar antes de enviar. Los campos llegan como
 * texto desde los inputs y se convierten a número acá.
 */
export const sedeSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'Ingresá el nombre de la sede.')
    .max(50, 'El nombre admite hasta 50 caracteres.'),
  direccion: z
    .string()
    .trim()
    .min(1, 'Ingresá la dirección.')
    .max(50, 'La dirección admite hasta 50 caracteres.'),
  aforo_maximo: z.coerce
    .number({ error: 'Ingresá un número válido.' })
    .int('El aforo debe ser un número entero.')
    .positive('El aforo debe ser mayor a 0.'),
  id_ciudad: z.coerce
    .number({ error: 'Seleccioná una ciudad.' })
    .int('Seleccioná una ciudad.')
    .positive('Seleccioná una ciudad.'),
})

export type SedeValidada = z.infer<typeof sedeSchema>
