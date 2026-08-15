import { getMonday, formatFechaCompleta } from '../shared/utils'

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const HORAS: string[] = []
for (let h = 7; h <= 22; h++) {
  HORAS.push(`${String(h).padStart(2, '0')}:00`)
  if (h < 22) HORAS.push(`${String(h).padStart(2, '0')}:30`)
}

function toSlotKey(diaIdx: number, hora: string): string {
  return `${diaIdx}-${hora}`
}

function roundToSlot(fecha_hora: string): string {
  const date = new Date(fecha_hora)
  const h = date.getHours()
  const m = date.getMinutes()
  return `${String(h).padStart(2, '0')}:${m < 30 ? '00' : '30'}`
}

function formatFecha(d: Date): string {
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  return `${dia}/${mes}`
}

function formatISOtoDatetime(dia: Date, hora: string): string {
  const y = dia.getFullYear()
  const m = String(dia.getMonth() + 1).padStart(2, '0')
  const d = String(dia.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}T${hora}:00`
}

export { DAYS, HORAS, getMonday, formatFechaCompleta, toSlotKey, roundToSlot, formatFecha, formatISOtoDatetime }
