import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usuariosService } from '@/modules/M1-usuarios/services/usuarios.service'
import apiClient from '@/common/api/http'

vi.mock('@/common/api/http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}))

describe('usuariosService (M1-usuarios)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('obtenerDashboard', () => {
    it('envía id_sede en params cuando se proporciona', async () => {
      const mockDashboard = {
        membresia: null,
        totales: {},
        proximas_actividades: [],
      }
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockDashboard })

      const res = await usuariosService.obtenerDashboard(3)

      expect(apiClient.get).toHaveBeenCalledWith('/usuarios/me/dashboard', {
        params: { id_sede: 3 },
      })
      expect(res).toEqual(mockDashboard)
    })

    it('envía params vacío cuando no se pasa id_sede', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: {} })

      await usuariosService.obtenerDashboard()

      expect(apiClient.get).toHaveBeenCalledWith('/usuarios/me/dashboard', {
        params: {},
      })
    })
  })

  describe('obtenerHistorial', () => {
    it('consulta historial con filtros de paginación y tipo', async () => {
      const mockHistorial = {
        items: [],
        meta: { total: 0, page: 1, limit: 10, total_paginas: 0 },
      }
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockHistorial })

      const query = { page: 1, limit: 10, tipo: 'canchas' as const, id_sede: 2 }
      const res = await usuariosService.obtenerHistorial(query)

      expect(apiClient.get).toHaveBeenCalledWith('/usuarios/me/historial', {
        params: query,
      })
      expect(res).toEqual(mockHistorial)
    })
  })

  describe('obtenerUsuarios', () => {
    it('filtra por id_sede si se indica', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [{ id: 1 }] })

      const res = await usuariosService.obtenerUsuarios(5)

      expect(apiClient.get).toHaveBeenCalledWith('/usuarios', {
        params: { id_sede: 5 },
      })
      expect(res).toHaveLength(1)
    })

    it('consulta todos los usuarios sin filtro si id_sede es undefined', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: [] })

      await usuariosService.obtenerUsuarios()

      expect(apiClient.get).toHaveBeenCalledWith('/usuarios', {
        params: {},
      })
    })
  })

  describe('registrarUsuario y actualizarPerfil', () => {
    it('registra un usuario vía POST /usuarios', async () => {
      const payload = { nombre: 'Ana', email: 'ana@test.com' }
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { id: 99, ...payload },
      })

      const res = await usuariosService.registrarUsuario(payload as never)

      expect(apiClient.post).toHaveBeenCalledWith('/usuarios', payload)
      expect(res.id).toBe(99)
    })

    it('actualiza perfil vía PATCH /usuarios/:id', async () => {
      const datos = { telefono: '3454000000' }
      vi.mocked(apiClient.patch).mockResolvedValue({
        data: { id: 10, ...datos },
      })

      const res = await usuariosService.actualizarPerfil(10, datos as never)

      expect(apiClient.patch).toHaveBeenCalledWith('/usuarios/10', datos)
      expect(res.telefono).toBe('3454000000')
    })
  })

  describe('subirFotoPerfil', () => {
    it('adjunta el archivo bajo la clave "foto" con multipart/form-data', async () => {
      const archivo = new File(['contenido'], 'avatar.png', {
        type: 'image/png',
      })
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { avatar_url: 'https://cdn.fitzone.com/avatar.png' },
      })

      const res = await usuariosService.subirFotoPerfil(7, archivo)

      expect(apiClient.post).toHaveBeenCalledWith(
        '/usuarios/7/foto',
        expect.any(FormData),
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      )

      const formDataEnviado = vi.mocked(apiClient.post).mock
        .calls[0][1] as FormData
      expect(formDataEnviado.get('foto')).toBe(archivo)
      expect(res.avatar_url).toBe('https://cdn.fitzone.com/avatar.png')
    })
  })
})
