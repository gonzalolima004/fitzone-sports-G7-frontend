const formateadorMoneda = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
})

export function formatearMoneda(importe: number): string {
  return formateadorMoneda.format(importe)
}

const NOMBRES_DE_DURACION: Record<number, string> = {
  30: 'Mensual',
  90: 'Trimestral',
  180: 'Semestral',
  365: 'Anual',
}

/** Ej.: 30 → "30 días · Mensual", 1 → "1 día", 45 → "45 días". */
export function describirDuracion(dias: number): string {
  const texto = dias === 1 ? '1 día' : `${dias} días`
  const nombre = NOMBRES_DE_DURACION[dias]
  return nombre ? `${texto} · ${nombre}` : texto
}

/** Minúsculas y sin tildes, para comparar en búsquedas. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * Resume las canchas de una sede por tipo, ej.: "2 Pádel · 1 Fútbol 5".
 * Devuelve "Sin canchas" si la sede no tiene ninguna.
 */
export function describirInstalaciones(tipos: string[]): string {
  if (tipos.length === 0) return 'Sin canchas'
  const cantidades = new Map<string, number>()
  for (const tipo of tipos) {
    cantidades.set(tipo, (cantidades.get(tipo) ?? 0) + 1)
  }
  return [...cantidades.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'es'))
    .map(([tipo, cantidad]) => `${cantidad} ${tipo}`)
    .join(' · ')
}
