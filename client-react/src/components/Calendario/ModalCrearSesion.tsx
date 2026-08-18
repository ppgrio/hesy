import CrudModal from '../shared/CrudModal'
import type { Patient, SlotBusqueda, FiltroOption, AccesoOption } from './types'
import { DAYS, formatFecha } from './utils'

interface Props {
  slot: SlotBusqueda | null
  dias: Date[]
  pacientes: Patient[]
  pacienteId: string
  onPacienteIdChange: (id: string) => void
  filtroSeleccionado: string
  onFiltroChange: (f: string) => void
  accesoSeleccionado: string
  onAccesoChange: (a: string) => void
  opcionesFiltro: FiltroOption[]
  opcionesAcceso: AccesoOption[]
  onCancel: () => void
  onConfirm: () => void
}

function ModalCrearSesion({
  slot, dias, pacientes,
  pacienteId, onPacienteIdChange,
  filtroSeleccionado, onFiltroChange,
  accesoSeleccionado, onAccesoChange,
  opcionesFiltro, opcionesAcceso,
  onCancel, onConfirm,
}: Props) {
  if (!slot) return null

  const titulo = slot
    ? `Nueva sesión — ${DAYS[slot.diaIdx]} ${formatFecha(dias[slot.diaIdx])} ${slot.hora}`
    : 'Nueva sesión'

  return (
    <CrudModal open={true} onClose={onCancel} titulo={titulo}>
      <select
        value={pacienteId}
        onChange={e => onPacienteIdChange(e.target.value)}
      >
        <option value="">Seleccionar paciente</option>
        {pacientes.map(p => (
          <option key={p.id} value={p.id}>
            {p.nombre} ({p.no_expediente != null ? p.no_expediente : '—'}) ({p.usos_restantes != null ? p.usos_restantes : '—'} usos)
          </option>
        ))}
      </select>
      <select
        value={filtroSeleccionado}
        onChange={e => onFiltroChange(e.target.value)}
      >
        <option value="">Sin filtro</option>
        {opcionesFiltro.map(f => (
          <option key={f.id} value={f.estado}>{f.estado}</option>
        ))}
      </select>
      <select
        value={accesoSeleccionado}
        onChange={e => onAccesoChange(e.target.value)}
      >
        <option value="">Sin acceso</option>
        {opcionesAcceso.map(a => (
          <option key={a.id} value={a.tipo}>{a.tipo}</option>
        ))}
      </select>
      <button onClick={onConfirm} disabled={!pacienteId}>
        Agregar
      </button>
    </CrudModal>
  )
}

export default ModalCrearSesion
