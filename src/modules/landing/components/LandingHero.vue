<script setup lang="ts">
import { PhArrowRight } from '@phosphor-icons/vue'

function scrollA(href: string) {
  if (!href || href === '#' || href === '#top') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  const target = document.querySelector(href)
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<template>
  <section
    class="relative flex min-h-[100svh] flex-col justify-center overflow-hidden pt-28 pb-12 sm:pt-32 sm:pb-16 text-white"
  >
    <!-- Fondo Mobile -->
    <div class="absolute inset-0 lg:hidden" aria-hidden="true">
      <img
        src="/hero-fondo-mobile.avif"
        alt="Fondo deportivo FitZone"
        class="h-full w-full object-cover object-right"
      />
      <div
        class="absolute inset-0 bg-gradient-to-r from-[#202759] via-[#202759]/90 to-transparent"
      ></div>
      <div
        class="absolute inset-0 bg-gradient-to-t from-[#202759] via-transparent to-[#202759]/60"
      ></div>
    </div>

    <!-- Fondo Desktop -->
    <div class="absolute inset-0 hidden lg:block" aria-hidden="true">
      <img
        src="/hero-fondo.jpg"
        alt="Fondo deportivo FitZone"
        class="h-full w-full object-cover object-right lg:object-[center_35%]"
      />
      <!-- Gradients para oscurecer y dar perfecta lectura a la columna izquierda -->
      <div
        class="absolute inset-0 bg-gradient-to-r from-[#202759] via-[#202759]/92 via-50% to-[#202759]/20"
      ></div>
      <div
        class="absolute inset-0 bg-gradient-to-t from-[#202759] via-transparent to-[#202759]/40"
      ></div>
      <div
        class="absolute inset-0 bg-gradient-to-b from-[#202759]/60 via-transparent to-[#202759]"
      ></div>
    </div>

    <!-- Contenido Principal -->
    <div
      class="relative z-10 mx-auto flex w-full flex-1 flex-col justify-center px-4 sm:px-6 lg:px-12 xl:px-16 max-w-7xl"
    >
      <div
        class="flex w-full flex-col items-start text-left lg:w-7/12 xl:w-1/2 lg:pr-6"
      >
        <!-- Título Principal -->
        <h1
          class="font-black text-4xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.08] mb-6 drop-shadow-md"
        >
          Tu pase al gym y tus canchas <br />
          <span class="text-[#F96167]">de la forma más fácil.</span>
        </h1>

        <!-- Subtítulo -->
        <p
          class="text-base sm:text-xl text-white/90 leading-relaxed max-w-2xl mb-10 drop-shadow-sm font-normal"
        >
          La plataforma deportiva más completa de Entre Ríos. Musculación,
          clases grupales y reserva de canchas con acreditación instantánea por
          QR.
        </p>

        <!-- Botones CTA -->
        <div
          class="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <button
            type="button"
            class="w-full sm:w-auto px-8 py-4 rounded-xl text-base sm:text-lg font-black bg-white text-[#202759] shadow-[0_0_25px_rgba(255,255,255,0.35)] hover:bg-white/95 hover:shadow-[0_0_35px_rgba(255,255,255,0.55)] transition-all hover:scale-103 active:scale-97 cursor-pointer text-center"
            @click="scrollA('#planes')"
          >
            Ver Planes y Precios
          </button>

          <button
            type="button"
            class="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl border border-white/40 text-white font-semibold text-sm sm:text-base hover:bg-white/15 hover:border-white transition-all hover:scale-103 active:scale-97 cursor-pointer backdrop-blur-sm"
            @click="scrollA('#canchas')"
          >
            <span>Alquilar canchas por turno</span>
            <PhArrowRight
              class="w-4 h-4 transition-transform group-hover:translate-x-1"
              weight="bold"
            />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
