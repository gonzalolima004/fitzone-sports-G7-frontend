<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, RouterLink } from 'vue-router'
import Sidebar from '../components/Sidebar.vue'

// Lectura dinámica del usuario almacenado en sesión (localStorage)
const usuarioActual = computed(() => {
  const data = localStorage.getItem('usuario') || localStorage.getItem('user')
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return { nombre: data }
  }
})

const inicialUsuario = computed(() => {
  if (!usuarioActual.value) return ''
  const nombre =
    usuarioActual.value.nombre ||
    usuarioActual.value.name ||
    usuarioActual.value.email ||
    ''
  return nombre.trim().charAt(0).toUpperCase()
})

const nombreAMostrar = computed(() => {
  if (!usuarioActual.value) return ''
  return (
    usuarioActual.value.nombre ||
    usuarioActual.value.name ||
    usuarioActual.value.email ||
    ''
  )
})
</script>

<template>
  <div class="min-h-screen bg-[#f4f6fa] text-slate-800 flex">
    <!-- Barra lateral / Sidebar -->
    <Sidebar />

    <!-- Área de contenido y encabezado principal -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Encabezado superior -->
      <header class="bg-white border-b border-slate-200/80 px-8 py-3.5 flex items-center justify-end gap-3 sticky top-0 z-10">
        <!-- Selector o insignia de Sede (Pill estilo imagen) -->
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-sm font-semibold text-[#202759] transition-colors shadow-2xs cursor-default">
          <svg class="w-4 h-4 text-[#202759]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Sede Central Palermo</span>
        </div>

        <!-- Perfil dinámico de Usuario -->
        <div v-if="inicialUsuario" class="flex items-center gap-2">
          <span class="text-xs font-semibold text-slate-700 hidden sm:inline">{{ nombreAMostrar }}</span>
          <div
            class="w-9 h-9 rounded-full bg-[#202759]/10 border border-[#202759]/20 flex items-center justify-center text-[#202759] font-bold text-sm select-none"
            :title="nombreAMostrar"
          >
            {{ inicialUsuario }}
          </div>
        </div>

        <!-- Si no hay sesión iniciada -->
        <RouterLink
          v-else
          to="/login"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#202759] bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Iniciar sesión</span>
        </RouterLink>
      </header>

      <!-- Zona de contenido dinámico (render de vistas) -->
      <main class="flex-1 p-6 md:p-8 bg-[#f4f6fa] overflow-y-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>
