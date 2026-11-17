<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { PhMapPin, PhMagnifyingGlass, PhX } from '@phosphor-icons/vue'
import { useSedeStore } from '@/store/sede'

const sedeStore = useSedeStore()
const busquedaCiudad = ref('')

onMounted(() => {
  void sedeStore.cargarSedes()
  void sedeStore.cargarCiudades()
})

function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

const mapaCiudades = computed(() => {
  const mapa = new Map<number, string>()
  for (const ciudad of sedeStore.ciudades) {
    mapa.set(ciudad.id_ciudad, ciudad.nombre)
  }
  return mapa
})

function obtenerNombreCiudad(idCiudad?: number): string {
  if (!idCiudad) return ''
  return mapaCiudades.value.get(idCiudad) || ''
}

const sedesFiltradas = computed(() => {
  const termino = normalizarTexto(busquedaCiudad.value)
  if (!termino) return sedeStore.sedes

  return sedeStore.sedes.filter((sede) => {
    const nombreCiudad = normalizarTexto(obtenerNombreCiudad(sede.id_ciudad))
    const nombreSede = normalizarTexto(sede.nombre || '')
    const direccionSede = normalizarTexto(sede.direccion || '')
    return (
      nombreCiudad.includes(termino) ||
      nombreSede.includes(termino) ||
      direccionSede.includes(termino)
    )
  })
})

const sedeSeleccionadaEnFiltro = computed(() =>
  sedesFiltradas.value.some(
    (s) => s.id_sede === sedeStore.idSedeSeleccionada
  )
)

const valorSelect = computed(() => {
  if (sedeSeleccionadaEnFiltro.value && sedeStore.idSedeSeleccionada !== null) {
    return String(sedeStore.idSedeSeleccionada)
  }
  return ''
})

function onCambioSede(event: Event) {
  const target = event.target as HTMLSelectElement
  if (!target.value) return
  sedeStore.seleccionarSede(Number(target.value))
}

function limpiarBusqueda() {
  busquedaCiudad.value = ''
}
</script>

<template>
  <section
    class="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-2xs"
  >
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4"
    >
      <h2 class="text-lg font-bold text-[#202759] flex items-center gap-2">
        <PhMapPin :size="20" weight="bold" class="text-[#F96167]" />
        <span>Selector de Sede</span>
      </h2>

      <span
        v-if="sedeStore.sedeSeleccionada"
        class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-[#202759] self-start sm:self-auto"
      >
        Activa: {{ sedeStore.sedeSeleccionada.nombre }}
        <template v-if="obtenerNombreCiudad(sedeStore.sedeSeleccionada.id_ciudad)">
          ({{ obtenerNombreCiudad(sedeStore.sedeSeleccionada.id_ciudad) }})
        </template>
      </span>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- Buscador por ciudad -->
      <div class="flex flex-col gap-1.5 w-full text-left">
        <label
          for="perfil-buscar-ciudad"
          class="text-xs font-bold text-[#202759] tracking-wide"
        >
          Buscar ciudad
        </label>
        <div class="relative w-full">
          <PhMagnifyingGlass
            :size="18"
            weight="bold"
            class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            id="perfil-buscar-ciudad"
            v-model="busquedaCiudad"
            type="text"
            placeholder="Ej: Paraná, Concordia..."
            class="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:border-[#202759] focus:ring-2 focus:ring-[#202759]/15"
          />
          <button
            v-if="busquedaCiudad"
            type="button"
            class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#F96167] transition-colors cursor-pointer"
            title="Limpiar búsqueda"
            @click="limpiarBusqueda"
          >
            <PhX :size="16" weight="bold" />
          </button>
        </div>
      </div>

      <!-- Selector desplegable de sedes -->
      <div class="flex flex-col gap-1.5 w-full text-left">
        <label
          for="perfil-selector-sede"
          class="text-xs font-bold text-[#202759] tracking-wide"
        >
          Sede activa
        </label>

        <!-- Estado de carga -->
        <div
          v-if="sedeStore.cargando"
          class="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-sm text-slate-500"
        >
          Cargando sedes...
        </div>

        <!-- Selector desplegable de sedes reales -->
        <select
          v-else-if="sedeStore.sedes.length > 0"
          id="perfil-selector-sede"
          :value="valorSelect"
          :disabled="sedesFiltradas.length === 0"
          class="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-[#202759] transition-all duration-200 focus:outline-none focus:border-[#202759] focus:ring-2 focus:ring-[#202759]/15 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
          title="Cambiar sede activa"
          @change="onCambioSede"
        >
          <option
            v-if="!sedeSeleccionadaEnFiltro && sedesFiltradas.length > 0"
            value=""
            disabled
          >
            Selecciona una sede ({{ sedesFiltradas.length }} encontradas)
          </option>
          <option v-if="sedesFiltradas.length === 0" value="" disabled>
            Sin resultados para "{{ busquedaCiudad }}"
          </option>
          <option
            v-for="sede in sedesFiltradas"
            :key="sede.id_sede"
            :value="String(sede.id_sede)"
            class="text-slate-800"
          >
            {{ sede.nombre
            }}{{
              obtenerNombreCiudad(sede.id_ciudad)
                ? ` — ${obtenerNombreCiudad(sede.id_ciudad)}`
                : ''
            }}
          </option>
        </select>

        <!-- Fallback en caso de que no haya sedes o error -->
        <div
          v-else
          class="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-sm text-slate-500"
        >
          {{ sedeStore.error ? 'Error de sedes' : 'Sin sedes' }}
        </div>
      </div>
    </div>

    <p
      v-if="busquedaCiudad && sedesFiltradas.length === 0 && sedeStore.sedes.length > 0"
      class="mt-3 text-xs text-slate-500 flex items-center gap-2"
    >
      <span>No se encontraron sedes para esa ciudad.</span>
      <button
        type="button"
        class="font-semibold text-[#F96167] hover:underline cursor-pointer"
        @click="limpiarBusqueda"
      >
        Mostrar todas
      </button>
    </p>
  </section>
</template>
