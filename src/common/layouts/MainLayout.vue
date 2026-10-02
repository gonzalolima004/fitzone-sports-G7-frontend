<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterView, RouterLink } from 'vue-router'
import Sidebar from '../components/Sidebar.vue'
import { useAuthStore } from '../../store/auth'
import { useSedeStore } from '../../store/sede'

const authStore = useAuthStore()
const sedeStore = useSedeStore()

// Control del menú lateral en pantallas de ancho reducido (móvil/tablet)
const menuAbierto = ref(false)

onMounted(() => {
  sedeStore.cargarSedes()
})

function onCambioSede(event: Event) {
  const target = event.target as HTMLSelectElement
  sedeStore.seleccionarSede(Number(target.value))
}

const nombreAMostrar = computed(() => {
  return authStore.usuario?.nombre || authStore.usuario?.email || ''
})

const inicialUsuario = computed(() => {
  if (nombreAMostrar.value) {
    return nombreAMostrar.value.trim().charAt(0).toUpperCase()
  }
  return authStore.rol.charAt(0).toUpperCase()
})
</script>

<template>
  <div class="min-h-screen bg-[#f4f6fa] text-slate-800 flex">
    <!-- Telón oscuro de fondo para móvil cuando el menú está abierto -->
    <div
      v-if="menuAbierto"
      class="fixed inset-0 bg-slate-900/40 z-20 md:hidden backdrop-blur-xs transition-opacity"
      @click="menuAbierto = false"
    ></div>

    <!-- Barra lateral / Sidebar -->
    <Sidebar :abierto="menuAbierto" @cerrar="menuAbierto = false" />

    <!-- Área de contenido y encabezado principal -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Encabezado superior -->
      <header
        class="bg-white border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-10"
      >
        <!-- Lado izquierdo: Botón hamburguesa (solo móvil) y título -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="md:hidden p-2 rounded-xl text-[#202759] hover:bg-slate-100 transition-colors cursor-pointer"
            title="Abrir menú"
            @click="menuAbierto = !menuAbierto"
          >
            <svg
              class="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span class="md:hidden font-extrabold text-[#202759] text-base"
            >FitZone</span
          >
        </div>

        <!-- Lado derecho: Selector de Sede + Perfil de usuario -->
        <div class="flex items-center gap-3">
          <!-- Selector interactivo de Sede (conectado a la API y Pinia) -->
          <div
            class="inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-xs sm:text-sm font-semibold text-[#202759] transition-colors shadow-2xs"
          >
            <svg
              class="w-4 h-4 text-[#202759] flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>

            <!-- Estado de carga -->
            <span
              v-if="sedeStore.cargando"
              class="text-xs text-slate-500 font-normal"
            >
              Cargando sedes...
            </span>

            <!-- Selector desplegable de sedes reales -->
            <select
              v-else-if="sedeStore.sedes.length > 0"
              :value="sedeStore.idSedeSeleccionada"
              class="bg-transparent text-[#202759] font-bold text-xs sm:text-sm focus:outline-none cursor-pointer pr-1"
              title="Cambiar sede activa"
              @change="onCambioSede"
            >
              <option
                v-for="sede in sedeStore.sedes"
                :key="sede.id_sede"
                :value="sede.id_sede"
                class="text-slate-800"
              >
                {{ sede.nombre }}
              </option>
            </select>

            <!-- Fallback en caso de que no haya sedes o error -->
            <span v-else class="text-xs text-slate-500 font-normal">
              {{ sedeStore.error ? 'Error de sedes' : 'Sin sedes' }}
            </span>
          </div>

          <!-- Perfil dinámico de Usuario -->
          <div
            v-if="authStore.isAuthenticated || nombreAMostrar"
            class="flex items-center gap-2"
          >
            <span
              class="text-xs font-semibold text-slate-700 hidden sm:inline"
              >{{ nombreAMostrar }}</span
            >
            <div
              class="w-9 h-9 rounded-full bg-[#202759]/10 border border-[#202759]/20 flex items-center justify-center text-[#202759] font-bold text-sm select-none"
              :title="nombreAMostrar"
            >
              {{ inicialUsuario }}
            </div>
          </div>

          <!-- Acceso directo a login si no hay sesión -->
          <RouterLink
            v-else
            to="/login"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 rounded-full text-xs font-semibold text-[#202759] bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span class="hidden sm:inline">Iniciar sesión</span>
          </RouterLink>
        </div>
      </header>

      <!-- Zona de contenido dinámico (se refresca automáticamente al cambiar de sede) -->
      <main class="flex-1 p-4 sm:p-6 md:p-8 bg-[#f4f6fa] overflow-y-auto">
        <RouterView :key="sedeStore.idSedeSeleccionada ?? 'default'" />
      </main>
    </div>
  </div>
</template>
