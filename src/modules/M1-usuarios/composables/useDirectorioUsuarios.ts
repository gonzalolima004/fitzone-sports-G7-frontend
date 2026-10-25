import { ref, computed, onMounted } from 'vue'
import { usuariosService } from '../services/usuarios.service'
import type { UsuarioResponse, RegistroPayload } from '../types/usuario.types'
import { toast } from '@/common/utils/toast'
import { http } from '@/common/api/http'
import { usuarioDirectorioSchema } from '@/common/utils/validators'

export function useDirectorioUsuarios() {
  const usuarios = ref<UsuarioResponse[]>([])
  const sedes = ref<{ id_sede: number; nombre: string }[]>([])
  const cargando = ref<boolean>(true)

  // Filtros
  const filtroBusqueda = ref<string>('')
  const estadoSeleccionado = ref<string>('todos')
  const sedeSeleccionada = ref<string>('todas')

  // Modales
  const modalRegistroAbierto = ref<boolean>(false)
  const modalEdicionAbierto = ref<boolean>(false)
  const guardandoUsuario = ref<boolean>(false)

  const usuarioEnEdicion = ref<UsuarioResponse | null>(null)

  // Añadimos idRolSeleccionado para controlar el select de la interfaz
  const payloadInicial: RegistroPayload & { idRolSeleccionado: number } = {
    dni: '',
    email: '',
    contrasenia: '',
    nombre: '',
    apellido: '',
    telefono: '',
    id_sede: '1',
    roles: [1],
    idRolSeleccionado: 1, // 1 por defecto (socio)
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
      await Promise.all([
        cargarSedes(),
        usuariosService.obtenerUsuarios().then((data) => {
          usuarios.value = data
        }),
      ])
    } catch (error) {
      console.error('Error al cargar el directorio de usuarios:', error)
      toast.error('No se pudo cargar el padrón de usuarios.')
    } finally {
      cargando.value = false
    }
  }

  // Filtrado avanzado
  const usuariosFiltrados = computed<UsuarioResponse[]>(() => {
    return usuarios.value.filter((u: UsuarioResponse) => {
      const query = filtroBusqueda.value.toLowerCase()
      const coincideTexto =
        u.nombre.toLowerCase().includes(query) ||
        u.apellido.toLowerCase().includes(query) ||
        u.dni.includes(query) ||
        u.email.toLowerCase().includes(query)

      let coincideEstado = true
      if (estadoSeleccionado.value === 'activos') {
        coincideEstado = u.id_usuario_estado === 1
      } else if (estadoSeleccionado.value === 'suspendidos') {
        coincideEstado = u.id_usuario_estado === 3
      }

      let coincideSede = true
      if (sedeSeleccionada.value !== 'todas') {
        coincideSede = String(u.id_sede) === String(sedeSeleccionada.value)
      }

      return coincideTexto && coincideEstado && coincideSede
    })
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
      u.sede?.nombre,
      u.id_usuario_estado === 1 ? 'ACTIVO' : 'SUSPENDIDO',
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
    const rolActualId = usuario.roles?.[0]?.id_rol ?? 1
    usuarioEnEdicion.value = {
      ...usuario,
      rol_seleccionado: rolActualId,
    } as UsuarioResponse & { rol_seleccionado?: number }
    modalEdicionAbierto.value = true
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
    // 1. Extraemos idRolSeleccionado para que NO se envíe en la petición HTTP
    const { idRolSeleccionado, ...datosParaEnviar } = nuevoUsuario.value

    // 2. Construimos el payload limpio y asignamos el rol en formato de array (ej: [3] para gerente)
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

      // Manejo específico para DNI duplicado (409 Conflict)
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

  onMounted(() => {
    cargarDirectorio()
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
    exportarPadron,
    abrirModalEdicion,
    guardarEdicionUsuario,
    registrarNuevoUsuario,
  }
}
