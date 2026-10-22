<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import { rutaPorRol } from '@/common/guards/ruta-por-rol'
import {
  PhArrowRight,
  PhList,
  PhX,
  PhUserCircle,
  PhLightning,
} from '@phosphor-icons/vue'

const router = useRouter()
const authStore = useAuthStore()

const menuMovilAbierto = ref(false)
const isScrolled = ref(false)

// 4 accesos clave para mantener el header limpio ordenados según la página
const enlacesNav = [
  { nombre: 'Sedes', href: '#sedes' },
  { nombre: 'Actividades', href: '#actividades' },
  { nombre: 'Canchas', href: '#canchas' },
  { nombre: 'Planes', href: '#planes' },
]

function irALogin() {
  menuMovilAbierto.value = false
  router.push('/login')
}

function irARegistro() {
  menuMovilAbierto.value = false
  router.push('/registro')
}

function irAlPanel() {
  menuMovilAbierto.value = false
  router.push(rutaPorRol(authStore.rol))
}

function scrollA(href: string) {
  menuMovilAbierto.value = false
  if (!href || href === '#' || href === '#top') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  const target = document.querySelector(href)
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' })
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && menuMovilAbierto.value) {
    menuMovilAbierto.value = false
  }
}

function handleScroll() {
  isScrolled.value = window.scrollY > 20
}

watch(menuMovilAbierto, (abierto) => {
  if (abierto) {
    document.body.classList.add('overflow-hidden')
  } else {
    document.body.classList.remove('overflow-hidden')
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('scroll', handleScroll)
  document.body.classList.remove('overflow-hidden')
})
</script>

<template>
  <header
    class="fixed top-0 left-0 right-0 z-[1050] w-full transition-all duration-300 border-b"
    :class="[
      isScrolled
        ? 'bg-[#202759]/95 backdrop-blur-xl border-white/10 shadow-lg shadow-black/25 py-3.5'
        : 'bg-[#202759]/50 backdrop-blur-md border-white/10 py-4 sm:py-5',
    ]"
  >
    <div
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-[1fr_auto_1fr] items-center"
    >
      <!-- 1. Columna Izquierda: Logo con isotipo deportivo -->
      <div class="flex items-center justify-start">
        <a
          href="#"
          class="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F96167] rounded-lg"
          aria-label="FitZone Sports - Inicio"
          @click.prevent="scrollA('#')"
        >
          <div
            class="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#e0484e] to-[#F96167] flex items-center justify-center text-white shadow-md shadow-[#F96167]/30 transition-transform duration-200 group-hover:scale-105"
          >
            <PhLightning class="w-5 h-5" weight="fill" />
          </div>
          <span
            class="text-xl sm:text-2xl font-black tracking-tight text-white select-none"
          >
            FitZone <span class="text-[#F96167]">Sports</span>
          </span>
        </a>
      </div>

      <!-- 2. Columna Centro: Enlaces 100% centrados matemáticamente -->
      <nav
        class="hidden md:flex items-center justify-center gap-1 lg:gap-2"
        aria-label="Navegación principal"
      >
        <a
          v-for="enlace in enlacesNav"
          :key="enlace.href"
          :href="enlace.href"
          class="px-4 py-2 rounded-full text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
          @click.prevent="scrollA(enlace.href)"
        >
          {{ enlace.nombre }}
        </a>
      </nav>

      <!-- 3. Columna Derecha: Acciones alineadas al extremo derecho -->
      <div class="flex items-center justify-end gap-2.5 lg:gap-3">
        <!-- Acciones Desktop / Tablet (>= sm) -->
        <div class="hidden sm:flex items-center gap-2.5 lg:gap-3">
          <template v-if="authStore.isAuthenticated">
            <button
              type="button"
              class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/20 text-white font-bold text-sm hover:bg-white/25 transition-all cursor-pointer"
              @click="irAlPanel"
            >
              <PhUserCircle class="w-4 h-4 text-[#F96167]" weight="bold" />
              <span>Mi panel</span>
            </button>
          </template>

          <template v-else>
            <button
              type="button"
              class="px-4 py-2 rounded-full text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              @click="irALogin"
            >
              Iniciar sesión
            </button>

            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#F96167] text-white font-black text-sm shadow-md shadow-[#F96167]/30 hover:bg-[#e0484e] hover:shadow-lg hover:shadow-[#F96167]/40 transition-all hover:scale-102 active:scale-98 cursor-pointer"
              @click="irARegistro"
            >
              <span>Registrarse</span>
              <PhArrowRight class="w-3.5 h-3.5" weight="bold" />
            </button>
          </template>
        </div>

        <!-- Botones Mobile (< sm) -->
        <template v-if="!authStore.isAuthenticated">
          <button
            type="button"
            class="px-3.5 py-1.5 rounded-full bg-[#F96167] text-white text-xs font-black shadow-xs shadow-[#F96167]/30 sm:hidden"
            @click="irARegistro"
          >
            Registrarse
          </button>
        </template>
        <template v-else>
          <button
            type="button"
            class="px-3 py-1.5 rounded-full bg-white text-[#202759] text-xs font-black shadow-xs sm:hidden"
            @click="irAlPanel"
          >
            Mi panel
          </button>
        </template>

        <!-- Toggle Menú Móvil (< md) -->
        <button
          type="button"
          class="p-2 rounded-xl text-white hover:bg-white/10 transition-colors cursor-pointer md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F96167]"
          :aria-expanded="menuMovilAbierto"
          :aria-label="menuMovilAbierto ? 'Cerrar menú' : 'Abrir menú'"
          @click="menuMovilAbierto = !menuMovilAbierto"
        >
          <PhList v-if="!menuMovilAbierto" class="w-6 h-6" weight="bold" />
          <PhX v-else class="w-6 h-6" weight="bold" />
        </button>
      </div>
    </div>

    <!-- Menú Desplegable (Mobile) -->
    <div
      v-if="menuMovilAbierto"
      id="menu-movil-desplegable"
      role="region"
      aria-label="Navegación móvil"
      class="md:hidden border-t border-white/10 bg-[#202759]/98 backdrop-blur-2xl px-6 pt-4 pb-6 space-y-4 shadow-2xl text-white animate-in slide-in-from-top duration-200"
    >
      <nav class="flex flex-col space-y-1.5" aria-label="Enlaces móviles">
        <a
          v-for="enlace in enlacesNav"
          :key="enlace.href"
          :href="enlace.href"
          class="text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 px-3.5 py-2.5 rounded-xl transition-colors"
          @click.prevent="scrollA(enlace.href)"
        >
          {{ enlace.nombre }}
        </a>
      </nav>

      <div class="pt-3 border-t border-white/10 flex flex-col gap-2.5">
        <template v-if="authStore.isAuthenticated">
          <button
            type="button"
            class="w-full py-2.5 rounded-full bg-white text-[#202759] font-black text-sm flex items-center justify-center gap-2 shadow-md hover:bg-slate-100 cursor-pointer"
            @click="irAlPanel"
          >
            <PhUserCircle class="w-4 h-4 text-[#F96167]" weight="bold" />
            <span>Ir a mi panel</span>
          </button>
        </template>
        <template v-else>
          <button
            type="button"
            class="w-full py-2.5 rounded-full border border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-colors cursor-pointer"
            @click="irALogin"
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            class="w-full py-2.5 rounded-full bg-[#F96167] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-[#F96167]/30 hover:bg-[#e0484e] cursor-pointer"
            @click="irARegistro"
          >
            <span>Crear cuenta / Registrarme</span>
            <PhArrowRight class="w-4 h-4" weight="bold" />
          </button>
        </template>
      </div>
    </div>
  </header>
</template>
