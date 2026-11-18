<script setup lang="ts">
import { PhMapPin, PhEnvelopeSimple, PhClock } from '@phosphor-icons/vue'

const anoActual = new Date().getFullYear()

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
  <footer class="bg-[#202759] text-white border-t border-slate-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12">
        <!-- Columna 1: Branding -->
        <div class="space-y-4 max-w-sm">
          <div class="flex items-center gap-2">
            <span class="text-2xl font-black tracking-tight text-white">
              FitZone <span class="text-[#F96167]">Sports</span>
            </span>
          </div>
          <p class="text-sm text-slate-300 leading-relaxed">
            Plataforma deportiva integral de Entre Ríos. Musculación, clases
            grupales y alquiler de canchas con acreditación digital por QR.
          </p>
        </div>

        <!-- Columna 2: Enlaces Clave -->
        <div class="space-y-4">
          <h3 class="text-xs font-bold uppercase tracking-wider text-[#F96167]">
            Explorar
          </h3>
          <ul class="space-y-2.5 text-sm list-none p-0 m-0">
            <li>
              <a
                href="#actividades"
                class="text-slate-300 hover:text-white transition-colors py-1 inline-block"
                @click.prevent="scrollA('#actividades')"
              >
                Clases y Actividades
              </a>
            </li>
            <li>
              <a
                href="#canchas"
                class="text-slate-300 hover:text-white transition-colors py-1 inline-block"
                @click.prevent="scrollA('#canchas')"
              >
                Alquiler de Canchas
              </a>
            </li>
            <li>
              <a
                href="#planes"
                class="text-slate-300 hover:text-white transition-colors py-1 inline-block"
                @click.prevent="scrollA('#planes')"
              >
                Membresías y Precios
              </a>
            </li>
            <li>
              <a
                href="#sedes"
                class="text-slate-300 hover:text-white transition-colors py-1 inline-block"
                @click.prevent="scrollA('#sedes')"
              >
                Nuestras Sedes
              </a>
            </li>
            <li>
              <a
                href="#faq"
                class="text-slate-300 hover:text-white transition-colors py-1 inline-block"
                @click.prevent="scrollA('#faq')"
              >
                Preguntas Frecuentes
              </a>
            </li>
          </ul>
        </div>

        <!-- Columna 3: Contacto y Atención -->
        <div class="space-y-4">
          <h3 class="text-xs font-bold uppercase tracking-wider text-[#F96167]">
            Contacto
          </h3>
          <ul class="space-y-3 text-sm list-none p-0 m-0 text-slate-300">
            <li class="flex items-center gap-2.5">
              <PhEnvelopeSimple class="w-4 h-4 text-[#F96167] shrink-0" />
              <span>contacto@fitzone-sports.com.ar</span>
            </li>
            <li class="flex items-center gap-2.5">
              <PhMapPin class="w-4 h-4 text-[#F96167] shrink-0" />
              <span>Entre Ríos, Argentina</span>
            </li>
            <li class="flex items-center gap-2.5">
              <PhClock class="w-4 h-4 text-[#F96167] shrink-0" />
              <span class="text-xs text-slate-400"
                >Lun a Vie 07:00 a 23:00 · Sáb y Dom 08:00 a 20:00</span
              >
            </li>
          </ul>
        </div>
      </div>

      <!-- Barra Inferior de Copyright -->
      <div
        class="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-400 gap-4"
      >
        <p>© {{ anoActual }} FitZone Sports. Todos los derechos reservados.</p>
      </div>
    </div>
  </footer>
</template>
