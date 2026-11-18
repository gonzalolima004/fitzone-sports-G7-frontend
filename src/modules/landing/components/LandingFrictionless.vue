<script setup lang="ts">
import {
  PhWarningCircle,
  PhCheckCircle,
  PhClock,
  PhChatCircleDots,
  PhArrowsLeftRight,
  PhIdentificationBadge,
  PhQrCode,
  PhCreditCard,
  PhLightning,
  PhBuildings,
  PhMapPin,
  PhPlay,
} from '@phosphor-icons/vue'

const PASOS = [
  {
    icon: PhMapPin,
    title: 'Elegí tu sede y plan',
    description:
      'Seleccioná tu sede preferida en Entre Ríos y el plan o turno de cancha que se adapte a vos.',
  },
  {
    icon: PhCreditCard,
    title: 'Aboná con Mercado Pago',
    description:
      'Completás tu pago online de forma 100% segura con acreditación automática al instante.',
  },
  {
    icon: PhPlay,
    title: 'Escaneá tu QR y entrená',
    description:
      'Tu credencial digital se activa de inmediato. Mostrás tu código en recepción y empezás.',
  },
]
</script>

<template>
  <section
    id="como-funciona"
    class="bg-white border-t border-slate-100 py-20 sm:py-28"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Encabezado -->
      <div class="mb-16 flex flex-col items-center text-center">
        <span
          class="text-xs font-bold uppercase tracking-[0.2em] text-[#b82a30] bg-[#f96167]/15 px-3.5 py-1.5 rounded-full inline-block mb-3"
        >
          Pasate al entrenamiento digital
        </span>
        <h2
          class="text-3xl sm:text-5xl font-black tracking-tight text-[#202759] max-w-3xl leading-tight"
        >
          Dejá atrás las esperas y los trámites en el mostrador.
        </h2>
      </div>

      <!-- Bloque Antes vs Después (Estilo gestion-canchas) -->
      <div
        class="mx-auto mb-20 grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2"
      >
        <!-- Lado Izquierdo: Antes -->
        <div
          class="bg-slate-50/80 border border-slate-200/90 group relative flex flex-col items-center overflow-hidden rounded-3xl p-8 text-center sm:p-10 shadow-xs"
        >
          <div
            class="absolute top-0 h-1.5 w-full bg-gradient-to-r from-[#b82a30]/20 via-[#b82a30]/50 to-[#b82a30]/20"
          ></div>
          <div
            class="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-[#b82a30] shadow-xs"
          >
            <PhWarningCircle class="h-8 w-8 text-white" weight="bold" />
          </div>
          <h3 class="mb-6 text-xl font-bold text-[#202759]">
            El gimnasio tradicional
          </h3>
          <ul
            class="flex w-full flex-col items-center space-y-4 text-sm font-medium text-slate-600"
          >
            <li class="flex w-full max-w-[320px] items-center gap-3">
              <PhClock class="h-5 w-5 shrink-0 text-slate-400" weight="bold" />
              <span class="text-left"
                >Filas en recepción para pagar la cuota</span
              >
            </li>
            <li class="flex w-full max-w-[320px] items-center gap-3">
              <PhIdentificationBadge
                class="h-5 w-5 shrink-0 text-slate-400"
                weight="bold"
              />
              <span class="text-left">Carnets físicos y fichas de papel</span>
            </li>
            <li class="flex w-full max-w-[320px] items-center gap-3">
              <PhChatCircleDots
                class="h-5 w-5 shrink-0 text-slate-400"
                weight="bold"
              />
              <span class="text-left"
                >WhatsApp saturado para consultar cupos</span
              >
            </li>
            <li class="flex w-full max-w-[320px] items-center gap-3">
              <PhArrowsLeftRight
                class="h-5 w-5 shrink-0 text-slate-400"
                weight="bold"
              />
              <span class="text-left">Superposición de turnos en canchas</span>
            </li>
          </ul>
        </div>

        <!-- Lado Derecho: Con FitZone Sports -->
        <div
          class="bg-[#202759]/5 border-2 border-[#202759]/30 relative flex flex-col items-center overflow-hidden rounded-3xl p-8 text-center shadow-xl shadow-[#202759]/10 sm:p-10"
        >
          <div
            class="absolute top-0 h-1.5 w-full bg-gradient-to-r from-[#F96167] via-[#202759] to-[#F96167]"
          ></div>
          <div
            class="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#202759] text-white shadow-lg shadow-[#202759]/25"
          >
            <PhCheckCircle class="h-8 w-8 text-white" weight="fill" />
          </div>
          <h3 class="mb-6 text-xl font-bold text-[#202759]">
            Con FitZone Sports
          </h3>
          <ul
            class="flex w-full flex-col items-center space-y-4 text-sm font-semibold text-[#202759]"
          >
            <li class="flex w-full max-w-[320px] items-center gap-3">
              <PhQrCode class="h-5 w-5 shrink-0 text-[#F96167]" weight="bold" />
              <span class="text-left">Credencial digital QR en tu celular</span>
            </li>
            <li class="flex w-full max-w-[320px] items-center gap-3">
              <PhCreditCard
                class="h-5 w-5 shrink-0 text-[#F96167]"
                weight="bold"
              />
              <span class="text-left">Pago online con Mercado Pago</span>
            </li>
            <li class="flex w-full max-w-[320px] items-center gap-3">
              <PhLightning
                class="h-5 w-5 shrink-0 text-[#F96167]"
                weight="bold"
              />
              <span class="text-left"
                >Reserva de clases y canchas en 1 clic</span
              >
            </li>
            <li class="flex w-full max-w-[320px] items-center gap-3">
              <PhBuildings
                class="h-5 w-5 shrink-0 text-[#F96167]"
                weight="bold"
              />
              <span class="text-left">Acceso a toda la red provincial</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bloque 3 Pasos -->
      <div>
        <div class="mb-14 text-center">
          <span
            class="text-xs font-bold uppercase tracking-[0.2em] text-[#b82a30] bg-[#f96167]/15 px-3.5 py-1.5 rounded-full inline-block mb-3"
          >
            En 3 simples pasos
          </span>
          <h3
            class="text-3xl sm:text-4xl font-black text-[#202759] tracking-tight"
          >
            Cómo empezás en FitZone
          </h3>
        </div>

        <div class="mx-auto grid max-w-5xl grid-cols-1 gap-10 sm:grid-cols-3">
          <div
            v-for="(paso, index) in PASOS"
            :key="paso.title"
            class="relative flex flex-col items-center text-center group"
          >
            <div class="relative mb-5">
              <div
                class="absolute inset-0 rounded-2xl bg-[#F96167]/20 blur-xl transition-all group-hover:bg-[#F96167]/30"
              ></div>
              <div
                class="relative flex size-16 items-center justify-center rounded-2xl bg-[#202759] text-white shadow-lg shadow-[#202759]/25 transition-transform group-hover:scale-105"
              >
                <component
                  :is="paso.icon"
                  class="size-7 text-[#F96167]"
                  weight="bold"
                />
              </div>
            </div>
            <span
              class="mb-1 text-xs font-bold tracking-[0.15em] text-[#b82a30] uppercase"
            >
              Paso {{ index + 1 }}
            </span>
            <h4 class="mb-2 text-lg font-bold text-[#202759]">
              {{ paso.title }}
            </h4>
            <p class="max-w-xs text-sm leading-relaxed text-slate-600">
              {{ paso.description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
