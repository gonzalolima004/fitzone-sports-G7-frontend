<script setup lang="ts">
import { useRouter } from 'vue-router'
import BaseButton from '@/common/components/BaseButton.vue'
import { PhArrowRight, PhSparkle } from '@phosphor-icons/vue'

const router = useRouter()
</script>

<template>
  <section class="py-20 sm:py-24 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div
        class="relative rounded-3xl bg-[#202759] text-white p-8 sm:p-14 lg:p-18 overflow-hidden shadow-2xl text-center"
      >
        <!-- Decoración de fondo sutil -->
        <div
          class="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#F96167]/15 blur-3xl pointer-events-none"
        ></div>
        <div
          class="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#202759]/50 blur-3xl pointer-events-none"
        ></div>

        <div class="relative z-10 max-w-3xl mx-auto">
          <!-- Badge -->
          <div
            class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-[#F96167] text-xs font-bold tracking-wider uppercase mb-6"
          >
            <PhSparkle class="w-4 h-4" weight="fill" />
            <span>Sumate a la comunidad deportiva</span>
          </div>

          <!-- Título -->
          <h2
            class="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-6 leading-tight"
          >
            Llevá tu entrenamiento<br />
            <span class="text-[#F96167]">al siguiente nivel hoy.</span>
          </h2>

          <!-- Subtítulo -->
          <p
            class="text-base sm:text-lg text-slate-300 max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Registrate en menos de dos minutos, generá tu credencial digital con
            código QR y empezá a disfrutar de todas nuestras sedes.
          </p>

          <!-- Botones de Acción -->
          <div
            class="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <BaseButton
              variant="secondary"
              size="lg"
              class="w-full sm:w-auto shadow-xl hover:shadow-2xl min-h-[48px]"
              @click="router.push('/registro')"
            >
              <template #icon>
                <PhArrowRight class="w-5 h-5 mr-1.5" weight="bold" />
              </template>
              Crear mi cuenta gratis
            </BaseButton>

            <BaseButton
              variant="ghost"
              size="lg"
              class="w-full sm:w-auto border border-white/40 text-white hover:bg-white/10 hover:border-white min-h-[48px]"
              @click="router.push('/login')"
            >
              Ya soy socio · Iniciar sesión
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
