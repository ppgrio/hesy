function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatFechaCompleta(d: Date): string {
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function matchFilter(value: unknown, q: string): boolean {
  if (value == null) return q === ''
  return normalizar(String(value)).includes(normalizar(q))
}

function validarEnteros(campos: [string, string][], error: (tipo: 'error' | 'exito', msg: string) => void, obligatorio = false): boolean {
  for (const [etiqueta, valor] of campos) {
    if (obligatorio && !valor.trim()) {
      error('error', `${etiqueta} es obligatorio`)
      return false
    }
    if (valor.trim() && !/^-?\d+$/.test(valor.trim())) {
      error('error', `${etiqueta} debe ser un número entero`)
      return false
    }
  }
  return true
}

export { getMonday, formatFechaCompleta, normalizar, matchFilter, validarEnteros }
