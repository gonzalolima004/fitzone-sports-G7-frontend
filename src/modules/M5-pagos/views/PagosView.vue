<script setup lang="ts">
import { PhSoccerBall, PhIdentificationCard, PhCreditCard } from '@phosphor-icons/vue'
import BotonPagar from '../components/BotonPagar.vue'
</script>

<template>
  <div class="space-y-8 max-w-5xl mx-auto py-4">
    <!-- Encabezado del módulo -->
    <div>
      <div class="flex items-center gap-3 mb-2">
        <div
          class="w-10 h-10 rounded-xl bg-[#202759] text-white flex items-center justify-center shadow-xs"
        >
          <PhCreditCard :size="22" weight="bold" />
        </div>
        <div>
          <h1 class="text-2xl font-black text-[#202759] m-0">
            Pagos y Facturación
          </h1>
          <p class="text-sm text-slate-500 m-0">
            Inicio de pagos de reservas y membresías con Mercado Pago Checkout Pro
          </p>
        </div>
      </div>
    </div>

    <!-- Sección de prueba de conceptos de pago -->
    <div>
      <h2 class="text-base font-bold text-slate-700 mb-4">
        Conceptos disponibles para abonar
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Tarjeta 1: Reserva de Cancha -->
        <div
          class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div class="flex items-center justify-between mb-4">
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
              >
                <PhSoccerBall :size="15" weight="bold" />
                Reserva de Cancha
              </span>
              <span class="text-xs font-semibold text-slate-400">ID #1</span>
            </div>

            <h3 class="text-lg font-bold text-[#202759] m-0 mb-1">
              Cancha de Pádel 1 — Turno Central
            </h3>
            <p class="text-xs text-slate-500 m-0 mb-4">
              Sede Central · 60 minutos con iluminación nocturna
            </p>

            <div class="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-6">
              <span class="text-xs text-slate-500 block">Total a pagar</span>
              <span class="text-2xl font-black text-[#202759]">$ 15.000,00</span>
            </div>
          </div>

          <div class="pt-2">
            <BotonPagar
              concepto="Reserva Cancha Pádel 1"
              :monto="15000"
              :id-cancha-reserva="1"
              detalle="Turno de Pádel - Sede Central"
              button-text="Pagar Cancha"
              button-variant="secondary"
            />
          </div>
        </div>

        <!-- Tarjeta 2: Membresía Deportiva -->
        <div
          class="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div class="flex items-center justify-between mb-4">
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
              >
                <PhIdentificationCard :size="15" weight="bold" />
                Membresía Mensual
              </span>
              <span class="text-xs font-semibold text-slate-400">ID #1</span>
            </div>

            <h3 class="text-lg font-bold text-[#202759] m-0 mb-1">
              Plan Premium All-Access
            </h3>
            <p class="text-xs text-slate-500 m-0 mb-4">
              Acceso ilimitado a gimnasio, clases y reserva prioritaria
            </p>

            <div class="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-6">
              <span class="text-xs text-slate-500 block">Total a pagar</span>
              <span class="text-2xl font-black text-[#202759]">$ 35.000,00</span>
            </div>
          </div>

          <div class="pt-2">
            <BotonPagar
              concepto="Membresía Premium All-Access"
              :monto="35000"
              :id-membresia="1"
              detalle="Vigencia mensual con renovación automática"
              button-text="Pagar Membresía"
              button-variant="primary"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
