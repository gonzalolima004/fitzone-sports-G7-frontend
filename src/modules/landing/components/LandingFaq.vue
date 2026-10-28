<script setup lang="ts">
import { ref } from 'vue'
import { PhCaretDown } from '@phosphor-icons/vue'

interface FaqItem {
  pregunta: string
  respuesta: string
}

const FAQ_ITEMS: FaqItem[] = [
  {
    pregunta: '¿Puedo alquilar una cancha sin pagar una cuota mensual?',
    respuesta:
      '¡Sí, claro! Podés alquilar turnos de pádel, fútbol o tenis pagando únicamente el valor del turno que jugás, sin matrícula ni cuotas obligatorias. Y si tenés una membresía activa, tenés un 15% de descuento en el alquiler.',
  },
  {
    pregunta: '¿Qué diferencia hay entre el Plan Mensual, Trimestral y Anual?',
    respuesta:
      'Todos los planes te dan exactamente el mismo acceso libre ilimitado a todas nuestras sedes, salas de musculación, clases grupales y 15% de descuento en alquiler de canchas. La única diferencia es el período contratado y el ahorro: los planes Trimestral y Anual ofrecen un precio mensual con descuento (hasta 25% OFF) y congelan el valor de tu cuota.',
  },
  {
    pregunta: '¿Cómo hago para entrar al gimnasio o a las canchas?',
    respuesta:
      'Desde tu celular entrás a tu cuenta de FitZone y abrís tu credencial digital con código QR. Lo mostrás en el lector de la entrada o en recepción y pasás al instante, sin tarjetas plásticas ni demoras.',
  },
  {
    pregunta: '¿Cómo y con qué medios puedo pagar?',
    respuesta:
      'Pagás de forma 100% segura a través de Mercado Pago con dinero en cuenta, tarjeta de débito o tarjeta de crédito. En cuanto abonás, tu pase o tu turno de cancha queda activo al momento.',
  },
  {
    pregunta: '¿Hay matrícula de inscripción o contratos que me aten?',
    respuesta:
      'Para nada. No cobramos matrícula ni costos extra de inscripción. Tampoco hay contratos con permanencia obligatoria: si pagás mes a mes, podés dejar de renovar cuando quieras sin ninguna penalidad.',
  },
  {
    pregunta: '¿Cómo me anoto a las clases grupales?',
    respuesta:
      'Entrás a la web desde tu celular, elegís tu sede, la clase que quieras hacer (como Spinning, Funcional, Yoga) y tocás en reservar. Así te asegurás tu lugar antes de salir de casa.',
  },
  {
    pregunta: '¿Tengo que descargar alguna app pesada en mi celular?',
    respuesta:
      'No hace falta descargar nada. FitZone funciona directo desde el navegador de tu celular (Chrome, Safari, etc.), así que no te ocupa espacio en la memoria ni gasta batería.',
  },
]

const abierto = ref<number | null>(0)

function toggleFaq(index: number) {
  abierto.value = abierto.value === index ? null : index
}
</script>

<template>
  <section
    id="faq"
    class="border-t border-slate-200/80 bg-slate-50/60 py-20 sm:py-28"
  >
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Encabezado de Sección estilo gestion-canchas -->
      <div class="mb-12 text-center">
        <span
          class="text-xs font-bold uppercase tracking-[0.2em] text-[#b82a30] bg-[#f96167]/15 px-3.5 py-1.5 rounded-full inline-block mb-3"
        >
          Ayuda
        </span>
        <h2
          class="text-3xl sm:text-5xl font-black text-[#202759] tracking-tight"
        >
          Preguntas frecuentes
        </h2>
        <p class="mt-4 text-base sm:text-lg text-slate-600">
          Respuestas claras y sin vueltas para que empieces a entrenar o
          reservar tu cancha sin dudas.
        </p>
      </div>

      <!-- Acordeón interactivo -->
      <div
        class="divide-y divide-slate-200 border border-slate-200/90 bg-white rounded-3xl px-6 sm:px-8 shadow-sm"
      >
        <div
          v-for="(item, index) in FAQ_ITEMS"
          :key="item.pregunta"
          class="border-b border-slate-100 last:border-b-0 py-5 transition-colors"
        >
          <button
            type="button"
            class="flex w-full items-center justify-between gap-4 text-left font-bold text-base sm:text-lg text-[#202759] hover:text-[#F96167] transition-colors cursor-pointer"
            :aria-expanded="abierto === index"
            @click="toggleFaq(index)"
          >
            <span>{{ item.pregunta }}</span>
            <PhCaretDown
              class="size-5 shrink-0 text-slate-400 transition-transform duration-300"
              :class="{ 'rotate-180 text-[#F96167]': abierto === index }"
              weight="bold"
            />
          </button>

          <!-- Contenido colapsable -->
          <div
            v-show="abierto === index"
            class="mt-3 text-sm sm:text-base leading-relaxed text-slate-600 pr-6 transition-all"
          >
            <p>{{ item.respuesta }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
