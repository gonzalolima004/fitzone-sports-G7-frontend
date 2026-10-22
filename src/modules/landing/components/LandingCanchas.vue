<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import BaseButton from '@/common/components/BaseButton.vue'
import {
  PhTennisBall,
  PhSoccerBall,
  PhArrowRight,
  PhLightning,
} from '@phosphor-icons/vue'

const router = useRouter()
const authStore = useAuthStore()

function irACanchas() {
  if (authStore.isAuthenticated) {
    router.push('/canchas')
  } else {
    router.push({
      path: '/login',
      query: { redirect: '/canchas' },
    })
  }
}
</script>

<template>
  <section
    id="canchas"
    class="py-20 sm:py-28 bg-[#f4f6fa]/60 border-b border-slate-100"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Encabezado de la Sección -->
      <div class="text-center max-w-3xl mx-auto mb-16">
        <span
          class="text-xs font-bold uppercase tracking-wider text-[#b82a30] bg-[#f96167]/15 px-3.5 py-1.5 rounded-full inline-block mb-3"
        >
          Alquiler de Canchas
        </span>
        <h2
          class="text-3xl sm:text-5xl font-black tracking-tight text-[#202759] mb-4"
        >
          Nuestras canchas e instalaciones
        </h2>
        <p class="text-base sm:text-lg text-slate-600 leading-relaxed">
          Reservá turnos de cancha por hora de forma 100% online, sin cuotas
          fijas ni matrículas obligatorias.
        </p>
      </div>

      <!-- Bento Grid Deportivo Asimétrico -->
      <div
        class="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(220px,auto)]"
      >
        <!-- 1. PÁDEL (Card Grande: 2 cols) -->
        <div
          class="bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-9 md:col-span-2 flex flex-col justify-between hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
        >
          <div class="relative z-10 max-w-xl">
            <div
              class="w-12 h-12 rounded-2xl bg-[#202759] text-[#F96167] flex items-center justify-center shrink-0 shadow-md shadow-[#202759]/10 mb-5"
            >
              <PhTennisBall class="w-6 h-6" weight="bold" />
            </div>

            <h3 class="text-2xl sm:text-3xl font-black text-[#202759] mb-3">
              Pádel
            </h3>
            <p class="text-slate-600 text-sm sm:text-base leading-relaxed">
              Pistas de pádel con blindex e iluminación preparadas para jugar
              tanto de día como en horario nocturno.
            </p>
          </div>

          <div
            class="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between relative z-10"
          >
            <button
              type="button"
              class="inline-flex items-center gap-2 text-sm font-extrabold text-[#202759] hover:text-[#F96167] transition-colors cursor-pointer"
              @click="irACanchas"
            >
              <span>Reservar turno de pádel</span>
              <PhArrowRight class="w-4 h-4" weight="bold" />
            </button>
          </div>

          <!-- Silueta abstracta de fondo -->
          <div
            class="absolute -right-6 -bottom-6 w-56 h-56 text-[#202759]/5 pointer-events-none group-hover:scale-110 transition-transform duration-500"
          >
            <PhTennisBall class="w-full h-full" weight="fill" />
          </div>
        </div>

        <!-- 2. FÚTBOL 5 & 7 (Card Chica: 1 col) -->
        <div
          class="bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-9 md:col-span-1 flex flex-col justify-between hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
        >
          <div class="relative z-10">
            <div
              class="w-12 h-12 rounded-2xl bg-[#202759] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#202759]/10 mb-5"
            >
              <PhSoccerBall class="w-6 h-6 text-[#F96167]" weight="bold" />
            </div>

            <h3 class="text-xl sm:text-2xl font-black text-[#202759] mb-3">
              Fútbol 5 y 7
            </h3>
            <p class="text-slate-600 text-sm leading-relaxed">
              Canchas de césped sintético para organizar partidos con amigos o
              entrenar en equipo.
            </p>
          </div>

          <div class="mt-8 pt-6 border-t border-slate-100 relative z-10">
            <button
              type="button"
              class="inline-flex items-center gap-2 text-sm font-extrabold text-[#202759] hover:text-[#F96167] transition-colors cursor-pointer"
              @click="irACanchas"
            >
              <span>Ver canchas de fútbol</span>
              <PhArrowRight class="w-4 h-4" weight="bold" />
            </button>
          </div>
        </div>

        <!-- 3. TENIS (Card Chica: 1 col) -->
        <div
          class="bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-9 md:col-span-1 flex flex-col justify-between hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
        >
          <div class="relative z-10">
            <div
              class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 mb-5"
            >
              <PhTennisBall class="w-6 h-6" weight="bold" />
            </div>

            <h3 class="text-xl sm:text-2xl font-black text-[#202759] mb-3">
              Tenis
            </h3>
            <p class="text-slate-600 text-sm leading-relaxed">
              Canchas de polvo de ladrillo preparadas para partidos individuales
              y dobles.
            </p>
          </div>

          <div class="mt-8 pt-6 border-t border-slate-100 relative z-10">
            <button
              type="button"
              class="inline-flex items-center gap-2 text-sm font-extrabold text-[#202759] hover:text-[#F96167] transition-colors cursor-pointer"
              @click="irACanchas"
            >
              <span>Ver canchas de tenis</span>
              <PhArrowRight class="w-4 h-4" weight="bold" />
            </button>
          </div>
        </div>

        <!-- 4. ALQUILER LIBRE (Card Grande: 2 cols) -->
        <div
          class="bg-gradient-to-br from-[#202759] to-[#171d44] text-white border border-[#202759] rounded-3xl p-7 sm:p-9 md:col-span-2 flex flex-col justify-between hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
        >
          <div class="relative z-10 max-w-xl">
            <div
              class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F96167] mb-3"
            >
              <PhLightning class="w-4 h-4" weight="bold" />
              <span>Modalidad libre</span>
            </div>

            <h3 class="text-2xl sm:text-3xl font-black text-white mb-3">
              Alquilás solo el turno que jugás
            </h3>
            <p class="text-slate-300 text-sm sm:text-base leading-relaxed">
              Elegís tu sede, reservás el día y horario que te quede cómodo, y
              abonás únicamente el turno con Mercado Pago sin trámites ni
              compromisos mensuales.
            </p>
          </div>

          <div
            class="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10"
          >
            <span class="text-xs text-slate-300">
              Disponibilidad en tiempo real para todas las sedes.
            </span>
            <BaseButton
              variant="secondary"
              size="md"
              class="w-full sm:w-auto min-h-[44px]"
              @click="irACanchas"
            >
              <template #icon>
                <PhArrowRight class="w-4 h-4 mr-1.5" weight="bold" />
              </template>
              Buscar turnos disponibles
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
