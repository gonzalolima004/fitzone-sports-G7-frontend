<script setup lang="ts">
import { useRouter } from 'vue-router'
import BaseButton from '@/common/components/BaseButton.vue'
import { PhArrowLeft } from '@phosphor-icons/vue'

const router = useRouter()

function volverAtras() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<template>
  <main
    class="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center"
  >
    <h1 class="text-6xl font-extrabold text-[#202759]">404</h1>
    <p class="mt-2 text-xl font-semibold text-slate-700">
      Página no encontrada
    </p>

    <div class="mt-6">
      <BaseButton variant="primary" size="md" @click="volverAtras">
        <template #icon>
          <PhArrowLeft :size="18" weight="bold" />
        </template>
        Volver atrás
      </BaseButton>
    </div>
  </main>
</template>
