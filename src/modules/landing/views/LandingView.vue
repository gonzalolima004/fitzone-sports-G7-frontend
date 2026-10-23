<script setup lang="ts">
import LandingHeader from '../components/LandingHeader.vue'
import LandingHero from '../components/LandingHero.vue'
import LandingFrictionless from '../components/LandingFrictionless.vue'
import LandingServicios from '../components/LandingServicios.vue'
import LandingCanchas from '../components/LandingCanchas.vue'
import LandingPlanes from '../components/LandingPlanes.vue'
import LandingSedes from '../components/LandingSedes.vue'
import LandingFaq from '../components/LandingFaq.vue'
import LandingFooter from '../components/LandingFooter.vue'
</script>

<template>
  <div class="min-h-screen font-sans bg-white text-[#202759]">
    <!-- Navbar sticky / transparent con transicion en scroll -->
    <LandingHeader />

    <!-- Orquestación de secciones inspiradas en gestion-canchas-frontend -->
    <main>
      <!-- 1. Hero Principal Inmersivo -->
      <LandingHero />

      <!-- 2. Experiencia Digital y Bento: Antes vs Después, Bento Grid y 3 Pasos -->
      <LandingFrictionless />

      <!-- 3. Red Multisede Provincial (Mapa Interactivo) -->
      <LandingSedes />

      <!-- 6. Clases Grupales y Actividades (Sincronizado en tiempo real) -->
      <LandingServicios />

      <!-- 7. Alquiler de Canchas (Pádel, Fútbol, Tenis) -->
      <LandingCanchas />

      <!-- 8. Membresías y Planes Oficiales -->
      <LandingPlanes />

      <!-- 9. Preguntas Frecuentes (Acordeón interactivo) -->
      <LandingFaq />
    </main>

    <!-- Footer institucional con enlaces y contacto -->
    <LandingFooter />
  </div>
</template>
