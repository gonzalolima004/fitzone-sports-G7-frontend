<script setup lang="ts">
// Vista principal orquestadora de la Landing Page FitZone Sports (Modular)
</script>

<template>
  <div class="min-h-screen font-sans bg-white text-[#202759]">
    <!-- Placeholder temporal para Subtarea B1 (se modulariza en B2, B3 y B4) -->
    <header
      class="sticky top-0 z-50 bg-[#202759] text-white px-6 py-4 flex justify-between items-center shadow-md"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-black tracking-tight text-white">
          FitZone <span class="text-[#F96167]">Sports</span>
        </span>
      </div>
      <div class="flex items-center gap-3">
        <RouterLink
          to="/login"
          class="px-4 py-2 text-sm font-bold text-white hover:text-[#F96167] transition-colors"
        >
          Iniciar sesión
        </RouterLink>
        <RouterLink
          to="/registro"
          class="px-4 py-2 text-sm font-bold bg-[#F96167] text-white rounded-xl shadow-md hover:bg-[#fa777c] transition-all"
        >
          Registrarme
        </RouterLink>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-6 py-24 text-center">
      <div
        class="inline-block mb-4 px-4 py-1.5 rounded-full bg-[#F96167]/10 text-[#F96167] text-xs font-bold tracking-wider uppercase"
      >
        Red Provincial en 25+ Sedes
      </div>
      <h1
        class="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#202759] mb-6 leading-tight"
      >
        Tu entrenamiento y tus deportes,<br />
        <span class="text-[#F96167]">en un solo ecosistema.</span>
      </h1>
      <p class="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
        Accedé a musculación, clases grupales, canchas de pádel, fútbol y tenis
        con acreditación por QR en toda la provincia de Entre Ríos.
      </p>
      <div class="flex flex-col sm:flex-row justify-center gap-4">
        <RouterLink
          to="/registro"
          class="px-8 py-3.5 bg-[#F96167] text-white text-base font-bold rounded-xl shadow-lg hover:bg-[#fa777c] hover:shadow-xl transition-all"
        >
          Empezar ahora
        </RouterLink>
        <RouterLink
          to="/canchas"
          class="px-8 py-3.5 bg-white border-2 border-[#202759] text-[#202759] text-base font-bold rounded-xl hover:bg-[#202759] hover:text-white transition-all"
        >
          Alquilar Canchas (Externos)
        </RouterLink>
      </div>
    </main>
  </div>
</template>
