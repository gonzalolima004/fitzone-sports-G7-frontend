<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { RouterView, RouterLink, useRouter } from 'vue-router'
import Sidebar from '../components/Sidebar.vue'
import { useAuthStore } from '../../store/auth'
import { useSedeStore } from '../../store/sede'
import { obtenerFechaHoyLocal } from '../utils/date'
import { PhUser, PhSignOut, PhCaretDown } from '@phosphor-icons/vue'

const authStore = useAuthStore()
const sedeStore = useSedeStore()
const router = useRouter()

// Control del menú lateral en pantallas de ancho reducido (móvil/tablet)
const menuAbierto = ref(false)
const menuUsuarioAbierto = ref(false)
const menuUsuarioRef = ref<HTMLElement | null>(null)
const avatarError = ref(false)

onMounted(() => {
  sedeStore.cargarSedes()
  document.addEventListener('click', handleClickOutside)

  if (typeof navigator === 'undefined' || navigator.onLine) {
    if (['socio', 'recepcionista', 'gerente'].includes(authStore.rol)) {
      void import('@/modules/M2-accesos/views/CredencialView.vue').catch(
        () => {}
      )
    }
    if (
      authStore.rol === 'socio' &&
      authStore.usuario?.id &&
      !authStore.usuario?.estadoMembresia
    ) {
      void authStore.sincronizarPerfilSocio?.()
    }
  }
})

watch(
  [
    () => sedeStore.sedeSeleccionada?.id_sede,
    () => sedeStore.fechaReferenciaHorario,
  ],
  async ([idSede, fechaRef]) => {
    if (!idSede) return
    const fecha = fechaRef || obtenerFechaHoyLocal()
    const key = `${idSede}_${fecha}`
    if (!sedeStore.horariosCache[key]) {
      try {
        await sedeStore.obtenerHorarioOperativo(idSede, fecha)
      } catch {
        // Silencioso en el header global si falla la consulta de horario
      }
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function handleClickOutside(event: MouseEvent) {
  if (
    menuUsuarioRef.value &&
    !menuUsuarioRef.value.contains(event.target as Node)
  ) {
    menuUsuarioAbierto.value = false
  }
}

const nombreCompleto = computed(() => {
  const nombre = authStore.usuario?.nombre?.trim()
  const apellido = authStore.usuario?.apellido?.trim()
  if (nombre && apellido) {
    return `${nombre} ${apellido}`
  }
  if (nombre) return nombre
  return 'Usuario FitZone'
})

const inicialUsuario = computed(() => {
  const nombre = authStore.usuario?.nombre?.trim()
  if (nombre) {
    return nombre.charAt(0).toUpperCase()
  }
  return authStore.rol.charAt(0).toUpperCase()
})

const rolCapitalizado = computed(() => {
  const r = authStore.rol || 'socio'
  return r.charAt(0).toUpperCase() + r.slice(1)
})

const fotoPerfilUrl = computed(() => {
  if (avatarError.value) return null
  return authStore.usuario?.foto_url || null
})

const nombreAMostrar = computed(() => nombreCompleto.value)

async function handleLogout() {
  menuUsuarioAbierto.value = false
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="h-screen overflow-hidden bg-[#f4f6fa] text-slate-800 flex">
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

        <!-- Lado derecho: Badge de Sede + Horario Operativo + Perfil de usuario -->
        <div class="flex items-center gap-3">
          <!-- Indicador de sede activa y horario de apertura/cierre -->
          <div
            v-if="sedeStore.sedeSeleccionada"
            class="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200/80 rounded-full text-xs font-medium text-slate-600"
            title="Sede activa y horario operativo"
          >
            <div class="flex items-center gap-1.5">
              <svg
                class="w-3.5 h-3.5 text-[#202759] shrink-0"
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
              <strong
                class="font-bold text-[#202759] max-w-[160px] sm:max-w-[220px] truncate"
              >
                {{ sedeStore.sedeSeleccionada.nombre }}
              </strong>
            </div>

            <template v-if="sedeStore.horarioOperativoActual">
              <span class="text-slate-300 hidden sm:inline">|</span>
              <div class="hidden sm:flex items-center gap-1.5">
                <template
                  v-if="
                    sedeStore.horarioOperativoActual.abierto ||
                    sedeStore.horarioOperativoActual.es_horario_especial
                  "
                >
                  <span
                    :class="[
                      'font-semibold font-mono tabular-nums text-xs',
                      sedeStore.horarioOperativoActual.es_horario_especial
                        ? 'text-amber-800'
                        : 'text-emerald-700',
                    ]"
                  >
                    {{ sedeStore.horarioOperativoActual.hora_apertura }} a
                    {{ sedeStore.horarioOperativoActual.hora_cierre }} hs
                  </span>
                  <span
                    v-if="sedeStore.horarioOperativoActual.es_horario_especial"
                    class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                  >
                    Horario Especial
                  </span>
                </template>
                <span v-else class="text-[#F96167] font-bold">
                  Sede Cerrada
                </span>
              </div>
            </template>
          </div>

          <!-- Estado Skeleton mientras carga el perfil inicial -->
          <div
            v-if="authStore.cargandoPerfil && !authStore.usuario?.nombre"
            class="flex items-center gap-2 animate-pulse"
          >
            <div class="h-4 w-24 bg-slate-200 rounded hidden sm:block"></div>
            <div class="w-9 h-9 rounded-full bg-slate-200"></div>
          </div>

          <!-- Perfil dinámico de Usuario con Menú Desplegable -->
          <div
            v-else-if="authStore.isAuthenticated"
            ref="menuUsuarioRef"
            class="relative"
          >
            <button
              type="button"
              class="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer p-1 rounded-full focus:outline-none"
              title="Abrir menú de usuario"
              @click="menuUsuarioAbierto = !menuUsuarioAbierto"
            >
              <span
                class="text-xs font-semibold text-slate-700 hidden sm:inline max-w-[150px] truncate"
              >
                {{ nombreCompleto }}
              </span>

              <!-- Fotografía o inicial -->
              <img
                v-if="fotoPerfilUrl"
                :src="fotoPerfilUrl"
                :alt="nombreAMostrar"
                referrerpolicy="no-referrer"
                class="w-9 h-9 rounded-full object-cover border border-[#202759]/20 shadow-2xs"
                data-testid="navbar-user-avatar"
                @error="avatarError = true"
              />
              <div
                v-else
                class="w-9 h-9 rounded-full overflow-hidden bg-[#202759]/10 border border-[#202759]/20 flex items-center justify-center text-[#202759] font-bold text-sm select-none"
              >
                <span>{{ inicialUsuario }}</span>
              </div>

              <PhCaretDown
                :size="14"
                weight="bold"
                class="text-slate-500 hidden sm:block transition-transform duration-200"
                :class="{ 'rotate-180': menuUsuarioAbierto }"
              />
            </button>

            <!-- Menú desplegable (Dropdown) -->
            <div
              v-if="menuUsuarioAbierto"
              class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-1"
            >
              <!-- Cabecera del desplegable con nombre y rol -->
              <div class="px-4 py-2 border-b border-slate-100">
                <p class="text-xs text-slate-400 font-medium">Conectado como</p>
                <p class="text-sm font-bold text-[#202759] truncate">
                  {{ nombreCompleto }}
                </p>
                <span
                  class="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-[#202759] rounded-md text-[10px] font-semibold uppercase tracking-wider"
                >
                  {{ rolCapitalizado }}
                </span>
              </div>

              <!-- Enlace a Mi Perfil -->
              <RouterLink
                to="/perfil"
                class="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                @click="menuUsuarioAbierto = false"
              >
                <PhUser :size="16" weight="bold" class="text-slate-500" />
                <span>Mi perfil</span>
              </RouterLink>

              <!-- Cerrar sesión -->
              <button
                type="button"
                class="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                @click="handleLogout"
              >
                <PhSignOut :size="16" weight="bold" class="text-red-500" />
                <span>Cerrar sesión</span>
              </button>
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
