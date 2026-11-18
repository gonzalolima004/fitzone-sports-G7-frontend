import { ref, computed, onMounted, watch } from 'vue'
import { usuariosService } from '../services/usuarios.service'
import type { UsuarioResponse, RegistroPayload } from '../types/usuario.types'
import { toast } from '@/common/utils/toast'
import { http } from '@/common/api/http'
import { usuarioDirectorioSchema } from '@/common/utils/validators'

export const USER_STATUS = {
  ACTIVO: 1,
  DESACTIVADO: 3,
} as const

export function useDirectorioUsuarios() {
  const usuarios = ref<UsuarioResponse[]>([])
  const sedes = ref<{ id_sede: number; nombre: string }[]>([])
  const cargando = ref<boolean>(true)

  // Paginación
  const page = ref<number>(1)
  const limit = ref<number>(10)
  const totalPages = ref<number>(1)
  const totalRegistros = ref<number>(0)

  // Modal de confirmación de baja lógica
  const modalEliminacionAbierto = ref<boolean>(false)
  const usuarioAEliminar = ref<UsuarioResponse | null>(null)

  // Filtros: Activos por defecto
  const filtroBusqueda = ref<string>('')
  const estadoSeleccionado = ref<string>('activos')
  const sedeSeleccionada = ref<string>('todas')

  // Modales de registro y edición
  const modalRegistroAbierto = ref<boolean>(false)
  const modalEdicionAbierto = ref<boolean>(false)
  const guardandoUsuario = ref<boolean>(false)
  const usuarioEnEdicion = ref<UsuarioResponse | null>(null)

  const payloadInicial: RegistroPayload & { idRolSeleccionado: number } = {
    dni: '',
    email: '',
    contrasenia: '',
    nombre: '',
    apellido: '',
    telefono: '',
    id_sede: '1',
    roles: [1],
    idRolSeleccionado: 1,
  }

  const nuevoUsuario = ref({ ...payloadInicial })

  const cargarSedes = async (): Promise<void> => {
    try {
      const response = await http.get('/sedes')
      sedes.value = response.data
    } catch (error) {
      console.error('Error al cargar las sedes:', error)
    }
  }

  const cargarDirectorio = async (): Promise<void> => {
    try {
      cargando.value = true

      const includeDeactivated =
        estadoSeleccionado.value === 'todos' ||
        estadoSeleccionado.value === 'desactivados'

      const idEstadoParam =
        estadoSeleccionado.value === 'activos'
          ? USER_STATUS.ACTIVO
          : estadoSeleccionado.value === 'desactivados'
            ? USER_STATUS.DESACTIVADO
            : undefined

      const response = await http.get('/usuarios', {
        params: {
          page: page.value,
          limit: limit.value,
          includeDeactivated,
          id_usuario_estado: idEstadoParam,
          id_sede:
            sedeSeleccionada.value !== 'todas'
              ? sedeSeleccionada.value
              : undefined,
        },
      })

      if (response.data && response.data.data) {
        usuarios.value = response.data.data
        if (response.data.meta) {
          totalPages.value = response.data.meta.lastPage
          totalRegistros.value = response.data.meta.total
        }
      } else {
        usuarios.value = response.data
        totalRegistros.value = usuarios.value.length
      }
    } catch (error) {
      console.error('Error al cargar el directorio de usuarios:', error)
      toast.error('No se pudo cargar el padrón de usuarios.')
    } finally {
      cargando.value = false
    }
  }

  watch([estadoSeleccionado, sedeSeleccionada], () => {
    page.value = 1
    cargarDirectorio()
  })

  const usuariosFiltrados = computed<UsuarioResponse[]>(() => {
    const query = filtroBusqueda.value.trim().toLowerCase()
    if (!query) return usuarios.value

    return usuarios.value.filter(
      (u: UsuarioResponse) =>
        u.nombre.toLowerCase().includes(query) ||
        u.apellido.toLowerCase().includes(query) ||
        u.dni.includes(query) ||
        u.email.toLowerCase().includes(query)
    )
  })

  const exportarPadron = () => {
    if (usuariosFiltrados.value.length === 0) {
      toast.error('No hay datos para exportar.')
      return
    }

    const headers = ['Nombre', 'Apellido', 'DNI', 'Email', 'Sede', 'Estado']
    const filas = usuariosFiltrados.value.map((u) => [
      u.nombre,
      u.apellido,
      u.dni,
      u.email,
      u.sede?.nombre || '',
      u.id_usuario_estado === USER_STATUS.ACTIVO ? 'ACTIVO' : 'DESACTIVADO',
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...filas.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `padron_usuarios_${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Padrón exportado con éxito.')
  }

  const abrirModalEdicion = (usuario: UsuarioResponse) => {
    const rolActualId = usuario.roles?.[0]?.id_rol
    usuarioEnEdicion.value = {
      ...usuario,
      rol_seleccionado: rolActualId,
    } as UsuarioResponse & { rol_seleccionado?: number }
    modalEdicionAbierto.value = true
  }

  const confirmarEliminacion = (usuario: UsuarioResponse) => {
    usuarioAEliminar.value = usuario
    modalEliminacionAbierto.value = true
  }

  // OPTIMIZACIÓN: Baja lógica rápida con actualización inmediata en UI
  const ejecutarBajaLogica = async () => {
    if (!usuarioAEliminar.value) return
    const userId = usuarioAEliminar.value.id_usuario

    try {
      modalEliminacionAbierto.value = false

      // Actualización optimista instantánea en la lista local antes de que responda el servidor
      const index = usuarios.value.findIndex((u) => u.id_usuario === userId)
      if (index !== -1) {
        if (estadoSeleccionado.value === 'activos') {
          usuarios.value.splice(index, 1) // Si estábamos viendo solo activos, lo quitamos de la vista al instante
          totalRegistros.value = Math.max(0, totalRegistros.value - 1)
        } else {
          usuarios.value[index].id_usuario_estado = USER_STATUS.DESACTIVADO
        }
      }

      await http.delete(`/usuarios/${userId}`)
      toast.success('Usuario desactivado correctamente.')
      usuarioAEliminar.value = null
    } catch (error) {
      console.error('Error al desactivar usuario:', error)
      toast.error('No se pudo desactivar el usuario.')
      await cargarDirectorio() // Recargar si falla
    }
  }

  // OPTIMIZACIÓN: Restauración rápida con actualización inmediata en UI
  const restaurarUsuarioDirecto = async (usuario: UsuarioResponse) => {
    const userId = usuario.id_usuario
    try {
      modalEdicionAbierto.value = false
      guardandoUsuario.value = true

      // Actualización optimista instantánea
      const index = usuarios.value.findIndex((u) => u.id_usuario === userId)
      if (index !== -1) {
        if (estadoSeleccionado.value === 'desactivados') {
          usuarios.value.splice(index, 1) // Si estábamos viendo solo desactivados, lo quitamos al activarlo
          totalRegistros.value = Math.max(0, totalRegistros.value - 1)
        } else {
          usuarios.value[index].id_usuario_estado = USER_STATUS.ACTIVO
        }
      }

      await usuariosService.actualizarPerfil(userId, {
        id_usuario_estado: USER_STATUS.ACTIVO,
      })
      toast.success('¡Cuenta restaurada a estado activo con éxito!')
    } catch (error) {
      console.error('Error al restaurar usuario:', error)
      toast.error('No se pudo restaurar la cuenta.')
      await cargarDirectorio() // Recargar si falla
    } finally {
      guardandoUsuario.value = false
    }
  }

  const cambiarPagina = (nuevaPagina: number) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPages.value) {
      page.value = nuevaPagina
      cargarDirectorio()
    }
  }

  const guardarEdicionUsuario = async () => {
    if (!usuarioEnEdicion.value) return

    try {
      guardandoUsuario.value = true

      const usuarioEdit = usuarioEnEdicion.value as UsuarioResponse & {
        rol_seleccionado?: number
      }
      const idRolElegido = usuarioEdit.rol_seleccionado ?? 1

      await usuariosService.actualizarPerfil(
        usuarioEnEdicion.value.id_usuario,
        {
          nombre: usuarioEdit.nombre,
          apellido: usuarioEdit.apellido,
          dni: usuarioEdit.dni,
          telefono: usuarioEdit.telefono,
          id_sede: String(usuarioEdit.id_sede),
          id_usuario_estado: usuarioEdit.id_usuario_estado,
          roles: [idRolElegido],
        }
      )

      toast.success('¡Usuario actualizado con éxito!')
      modalEdicionAbierto.value = false
      await cargarDirectorio()
    } catch (error) {
      console.error('Error al actualizar usuario:', error)
      toast.error('No se pudieron guardar los cambios.')
    } finally {
      guardandoUsuario.value = false
    }
  }

  async function registrarNuevoUsuario() {
    const { idRolSeleccionado, ...datosParaEnviar } = nuevoUsuario.value

    const payloadAEnviar = {
      ...datosParaEnviar,
      roles: [Number(idRolSeleccionado)],
    }

    const validation = usuarioDirectorioSchema.safeParse(payloadAEnviar)
    if (!validation.success) {
      validation.error.issues.forEach((issue) =>
        toast.warning(issue.message, { autoClose: 6000 })
      )
      return
    }

    try {
      guardandoUsuario.value = true
      await usuariosService.registrarUsuario(payloadAEnviar)
      toast.success('¡Usuario registrado con éxito!')
      modalRegistroAbierto.value = false
      await cargarDirectorio()
      nuevoUsuario.value = { ...payloadInicial }
    } catch (error: unknown) {
      const err = error as {
        response?: {
          status?: number
          data?: {
            message?: string | string[]
            detail?: string
          }
        }
      }

      if (err.response?.status === 409) {
        const errorData = err.response.data?.message
        const mensajeDni =
          typeof errorData === 'string'
            ? errorData
            : Array.isArray(errorData)
              ? errorData[0]
              : err.response.data?.detail ||
                'El DNI ingresado ya se encuentra registrado.'
        toast.error(mensajeDni)
      } else {
        const generalMessage = err.response?.data?.message
        toast.error(
          typeof generalMessage === 'string'
            ? generalMessage
            : 'Error al registrar el usuario. Verificá los datos.'
        )
      }
      console.error('Error al registrar usuario:', error)
    } finally {
      guardandoUsuario.value = false
    }
  }

  onMounted(async () => {
    await Promise.all([cargarSedes(), cargarDirectorio()])
  })

  return {
    usuariosFiltrados,
    cargando,
    sedes,
    filtroBusqueda,
    estadoSeleccionado,
    sedeSeleccionada,
    modalRegistroAbierto,
    modalEdicionAbierto,
    guardandoUsuario,
    nuevoUsuario,
    usuarioEnEdicion,
    page,
    totalPages,
    totalRegistros,
    modalEliminacionAbierto,
    usuarioAEliminar,
    exportarPadron,
    abrirModalEdicion,
    confirmarEliminacion,
    ejecutarBajaLogica,
    restaurarUsuarioDirecto,
    cambiarPagina,
    guardarEdicionUsuario,
    registrarNuevoUsuario,
  }
}
