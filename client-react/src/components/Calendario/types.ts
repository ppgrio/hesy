interface Session {
  id: number
  paciente_id: number
  paciente_nombre: string | null
  acceso: string | null
  filtro: string | null
  fecha_hora: string | null
}

interface Patient {
  no_expediente: number
  nombre: string
  acceso: string | null
  filtro: string | null
}

interface InventarioItem {
  id: number
  nombre: string
  cantidad: number
}

interface MedicamentoUso {
  id: number
  inventario_id: number
  nombre: string | null
  cantidad_usada: number
  stock_disponible: number
}

interface SlotBusqueda {
  diaIdx: number
  hora: string
}

export type { Session, Patient, InventarioItem, MedicamentoUso, SlotBusqueda }
