import { z } from 'zod'

// Esquema base reutilizable para la validación de datos de usuario
export const usuarioSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .regex(
      /^[a-zA-ZÀ-ÿ\s]+$/,
      'El nombre solo puede contener letras y espacios.'
    ),
  apellido: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres.')
    .regex(
      /^[a-zA-ZÀ-ÿ\s]+$/,
      'El apellido solo puede contener letras y espacios.'
    ),
  dni: z
    .string()
    .regex(/^\d{7,8}$/, 'El DNI debe contener entre 7 y 8 números sin puntos.'),
  email: z.string().email('El correo electrónico no es válido.'),
  telefono: z
    .string()
    .regex(
      /^\+?\d{10,15}$/,
      'El teléfono debe contener entre 10 y 15 números. El + solo puede estar adelante'
    ),
  id_sede: z.string().min(1, 'Debes seleccionar una sede válida.'),
})

// Esquema específico para cuando se completa el perfil mediante Google (unifica nombre y apellido)
export const completarPerfilSchema = z.object({
  nombre: usuarioSchema.shape.nombre,
  apellido: usuarioSchema.shape.apellido,
  dni: usuarioSchema.shape.dni,
  email: usuarioSchema.shape.email,
  telefono: usuarioSchema.shape.telefono,
  id_sede: usuarioSchema.shape.id_sede,
})
export const usuarioDirectorioSchema = z.object({
  nombre: usuarioSchema.shape.nombre,
  apellido: usuarioSchema.shape.apellido,
  dni: usuarioSchema.shape.dni,
  email: usuarioSchema.shape.email,
  telefono: usuarioSchema.shape.telefono,
  id_sede: usuarioSchema.shape.id_sede,
  contrasenia: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres.')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula.')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número.'),
  roles: z.array(z.number()).min(1, 'Debe tener al menos un rol.'),
})
