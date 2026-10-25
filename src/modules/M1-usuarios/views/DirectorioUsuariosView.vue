<script setup lang="ts">
import {
  PhUsers,
  PhUserPlus,
  PhFileArrowDown,
  PhMagnifyingGlass,
} from '@phosphor-icons/vue'

import BaseButton from '@/common/components/BaseButton.vue'
import BaseInput from '@/common/components/BaseInput.vue'
import BaseModal from '@/common/components/BaseModal.vue'
import Skeleton from '@/common/components/BaseSkeleton.vue'

import { useDirectorioUsuarios } from '../composables/useDirectorioUsuarios'
import { obtenerPerfilBadge } from '../utils/user-helpers'

const {
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
} = useDirectorioUsuarios()
</script>

<template>
  <div class="p-6 sm:p-8 bg-slate-50 min-h-screen text-slate-800">
    <!-- Header Principal -->
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-2xl bg-[#202759] flex items-center justify-center text-white shadow-md"
        >
          <PhUsers :size="24" weight="bold" />
        </div>
        <div>
          <h1 class="text-2xl font-extrabold text-[#202759] tracking-tight m-0">
            Directorio Centralizado de Usuarios
          </h1>
          <p class="text-xs text-slate-500 mt-0.5 m-0 font-medium">
            Gestión global de recepcionistas, externos, socios y gerentes
          </p>
        </div>
      </div>

      <!-- Acciones del Header -->
      <div class="flex items-center gap-3">
        <BaseButton variant="outline" size="md" @click="exportarPadron">
          <template #icon>
            <PhFileArrowDown :size="18" weight="bold" />
          </template>
          Exportar Padrón
        </BaseButton>

        <BaseButton
          variant="secondary"
          size="md"
          @click="modalRegistroAbierto = true"
        >
          <template #icon>
            <PhUserPlus :size="18" weight="bold" />
          </template>
          + Registrar Usuario
        </BaseButton>
      </div>
    </div>

    <!-- Barra de Filtros y Buscador -->
    <div
      class="bg-white border border-slate-200/80 p-4 rounded-2xl mb-6 shadow-sm flex flex-wrap gap-4 items-center justify-between"
    >
      <div class="relative flex-1 min-w-[280px]">
        <PhMagnifyingGlass
          class="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400"
        />
        <input
          v-model="filtroBusqueda"
          type="text"
          placeholder="Buscar por nombre, DNI o email..."
          class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#202759] focus:ring-2 focus:ring-[#202759]/15 transition-all"
        />
      </div>

      <div class="flex items-center gap-3">
        <select
          v-model="estadoSeleccionado"
          class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-medium focus:outline-none focus:border-[#202759]"
        >
          <option value="todos">Todos los Estados</option>
          <option value="activos">Activos</option>
          <option value="suspendidos">Suspendidos</option>
        </select>

        <!-- Filtro Dinámico de Sedes -->
        <select
          v-model="sedeSeleccionada"
          class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-medium focus:outline-none focus:border-[#202759]"
        >
          <option value="todas">Todas las Sedes</option>
          <option v-for="s in sedes" :key="s.id_sede" :value="s.id_sede">
            {{ s.nombre }}
          </option>
        </select>

        <div
          class="bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold text-[#202759] tracking-wider"
        >
          {{ usuariosFiltrados.length }} REGISTRADOS
        </div>
      </div>
    </div>

    <!-- Tabla de Usuarios -->
    <div
      class="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm"
    >
      <div v-if="cargando" class="p-6 space-y-4">
        <div
          v-for="n in 4"
          :key="n"
          class="flex items-center justify-between gap-4"
        >
          <div class="flex items-center gap-3">
            <Skeleton variant="circular" width="40px" height="40px" />
            <div class="space-y-2">
              <Skeleton width="180px" height="14px" />
              <Skeleton width="120px" height="10px" />
            </div>
          </div>
          <Skeleton width="90px" height="24px" rounded="full" />
          <Skeleton width="140px" height="14px" />
          <Skeleton width="80px" height="28px" rounded="xl" />
        </div>
      </div>

      <table v-else class="w-full text-left border-collapse">
        <thead>
          <tr
            class="border-b border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-500 uppercase tracking-wider"
          >
            <th class="p-4.5">Usuario / Foto</th>
            <th class="p-4.5">DNI</th>
            <th class="p-4.5">Tipo / Perfil</th>
            <th class="p-4.5">Sede Origen</th>
            <th class="p-4.5">Estado</th>
            <th class="p-4.5 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-sm">
          <tr
            v-for="user in usuariosFiltrados"
            :key="user.id_usuario"
            class="hover:bg-slate-50/80 transition-colors"
          >
            <td class="p-4.5 flex items-center gap-3.5">
              <div
                class="w-10 h-10 rounded-full bg-[#202759]/10 border border-[#202759]/20 flex items-center justify-center font-bold text-[#202759] overflow-hidden shrink-0"
              >
                <img
                  v-if="user.foto_url && user.foto_url.startsWith('http')"
                  :src="user.foto_url"
                  alt="Foto"
                  class="w-full h-full object-cover"
                />
                <span v-else class="text-xs"
                  >{{ user.nombre.charAt(0)
                  }}{{ user.apellido.charAt(0) }}</span
                >
              </div>
              <div>
                <div class="font-bold text-[#202759]">
                  {{ user.nombre }} {{ user.apellido }}
                </div>
                <div class="text-xs text-slate-400 font-normal">
                  {{ user.email }}
                </div>
              </div>
            </td>
            <td class="p-4.5 font-medium text-slate-600">{{ user.dni }}</td>
            <td class="p-4.5">
              <span
                class="px-3 py-1 rounded-full text-xs font-extrabold tracking-wide border"
                :class="obtenerPerfilBadge(user).clases"
              >
                {{ obtenerPerfilBadge(user).texto }}
              </span>
            </td>
            <td class="p-4.5 text-slate-600 font-medium">
              {{ user.sede ? user.sede.nombre : `Sede ID: ${user.id_sede}` }}
            </td>
            <td class="p-4.5">
              <span
                class="px-3 py-1 rounded-full text-xs font-extrabold tracking-wide"
                :class="
                  user.id_usuario_estado === 1
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-red-50 text-[#F96167] border border-red-200'
                "
              >
                {{ user.id_usuario_estado === 1 ? 'ACTIVO' : 'SUSPENDIDO' }}
              </span>
            </td>
            <td class="p-4.5 text-right">
              <BaseButton
                variant="outline"
                size="sm"
                @click="abrirModalEdicion(user)"
              >
                Gestionar
              </BaseButton>
            </td>
          </tr>
          <tr v-if="usuariosFiltrados.length === 0">
            <td colspan="6" class="p-12 text-center text-slate-400 font-medium">
              No se encontraron usuarios registrados con los filtros
              seleccionados.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 1. Modal de Registro de Usuario -->
    <BaseModal
      v-model="modalRegistroAbierto"
      title="Registrar Nuevo Usuario"
      subtitle="Complete los datos para dar de alta un usuario en el sistema."
      max-width="lg"
    >
      <form
        id="form-registrar-usuario"
        class="space-y-4"
        @submit.prevent="registrarNuevoUsuario"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BaseInput
            v-model="nuevoUsuario.nombre"
            label="Nombre"
            placeholder="Ej: Juan"
            required
          />
          <BaseInput
            v-model="nuevoUsuario.apellido"
            label="Apellido"
            placeholder="Ej: Pérez"
            required
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BaseInput
            v-model="nuevoUsuario.dni"
            label="DNI"
            placeholder="Ej: 38945120"
            required
          />
          <BaseInput
            v-model="nuevoUsuario.telefono"
            label="Teléfono"
            placeholder="Ej: +5493454859676"
            required
          />
        </div>

        <BaseInput
          v-model="nuevoUsuario.email"
          label="Correo Electrónico"
          type="email"
          placeholder="juan.perez@fitzone.com"
          required
        />
        <BaseInput
          v-model="nuevoUsuario.contrasenia"
          label="Contraseña"
          type="password"
          placeholder="Mínimo 6 caracteres"
          required
        />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5 w-full text-left">
            <label class="text-xs font-bold text-[#202759] tracking-wide"
              >Sede Asignada</label
            >
            <select
              v-model="nuevoUsuario.id_sede"
              class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#202759] focus:ring-2 focus:ring-[#202759]/15"
            >
              <option
                v-for="s in sedes"
                :key="s.id_sede"
                :value="String(s.id_sede)"
              >
                {{ s.nombre }}
              </option>
            </select>
          </div>

          <div class="flex flex-col gap-1.5 w-full text-left">
            <label class="text-xs font-bold text-[#202759] tracking-wide"
              >Rol / Perfil</label
            >
            <select
              v-model="nuevoUsuario.idRolSeleccionado"
              class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#202759] focus:ring-2 focus:ring-[#202759]/15"
            >
              <option :value="1">Socio</option>
              <option :value="2">Recepcionista</option>
              <option :value="3">Gerente</option>
              <option :value="4">Externo</option>
            </select>
          </div>
        </div>
      </form>

      <template #actions>
        <BaseButton variant="outline" @click="modalRegistroAbierto = false">
          Cancelar
        </BaseButton>
        <BaseButton
          variant="primary"
          type="submit"
          form="form-registrar-usuario"
          :loading="guardandoUsuario"
        >
          Guardar Usuario
        </BaseButton>
      </template>
    </BaseModal>

    <!-- 2. Modal de Edición/Gestión de Usuario (SEPARADO) -->
    <BaseModal
      v-model="modalEdicionAbierto"
      title="Gestionar y Modificar Usuario"
      subtitle="Modifique los datos personales, el estado o la sede asignada para regular el acceso por ciudad."
      max-width="lg"
    >
      <form
        v-if="usuarioEnEdicion"
        id="form-editar-usuario"
        class="space-y-4"
        @submit.prevent="guardarEdicionUsuario"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BaseInput
            v-model="usuarioEnEdicion.nombre"
            label="Nombre"
            required
          />
          <BaseInput
            v-model="usuarioEnEdicion.apellido"
            label="Apellido"
            required
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BaseInput v-model="usuarioEnEdicion.dni" label="DNI" required />
          <BaseInput
            v-model="usuarioEnEdicion.telefono"
            label="Teléfono"
            required
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Selector de Sede -->
          <div class="flex flex-col gap-1.5 w-full text-left">
            <label class="text-xs font-bold text-[#202759] tracking-wide"
              >Sede Asignada</label
            >
            <select
              v-model="usuarioEnEdicion.id_sede"
              class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#202759]"
            >
              <option v-for="s in sedes" :key="s.id_sede" :value="s.id_sede">
                {{ s.nombre }}
              </option>
            </select>
          </div>

          <!-- Selector de Estado -->
          <div class="flex flex-col gap-1.5 w-full text-left">
            <label class="text-xs font-bold text-[#202759] tracking-wide"
              >Estado del Usuario</label
            >
            <select
              v-model="usuarioEnEdicion.id_usuario_estado"
              class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#202759]"
            >
              <option :value="1">Activo</option>
              <option :value="3">Suspendido</option>
            </select>
          </div>
        </div>
        <!-- Nuevo Fila: Selector de Rol / Perfil en Edición -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5 w-full text-left">
            <label class="text-xs font-bold text-[#202759] tracking-wide"
              >Rol / Perfil</label
            >
            <select
              v-model="(usuarioEnEdicion as any).rol_seleccionado"
              class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#202759] focus:ring-2 focus:ring-[#202759]/15"
            >
              <option :value="1">Socio</option>
              <option :value="2">Recepcionista</option>
              <option :value="3">Gerente</option>
              <option :value="4">Externo</option>
            </select>
          </div>
        </div>
      </form>

      <template #actions>
        <BaseButton variant="outline" @click="modalEdicionAbierto = false">
          Cancelar
        </BaseButton>
        <BaseButton
          variant="primary"
          type="submit"
          form="form-editar-usuario"
          :loading="guardandoUsuario"
        >
          Guardar Cambios
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
