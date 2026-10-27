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
