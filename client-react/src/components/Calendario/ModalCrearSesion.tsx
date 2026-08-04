import type { Patient, SlotBusqueda } from './types'
import { DAYS, formatFecha } from './utils'

interface Props {
  slot: SlotBusqueda | null
  dias: Date[]
  textoBusqueda: string
  onTextoBusquedaChange: (text: string) => void
  pacienteSeleccionado: Patient | null
  filtroSeleccionado: string
  onFiltroChange: (f: string) => void
  accesoSeleccionado: string
  onAccesoChange: (a: string) => void
  resultadosBusqueda: Patient[]
  opcionesFiltro: string[]
  opcionesAcceso: string[]
  onSelectPaciente: (p: Patient) => void
  onCancel: () => void
  onConfirm: () => void
}

function ModalCrearSesion({
  slot, dias, textoBusqueda, onTextoBusquedaChange,
  pacienteSeleccionado, filtroSeleccionado, onFiltroChange,
  accesoSeleccionado, onAccesoChange, resultadosBusqueda,
  opcionesFiltro, opcionesAcceso, onSelectPaciente,
  onCancel, onConfirm,
}: Props) {
  if (!slot) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-contenido modal-crear" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            Nueva sesión
            <span className="modal-hora">
              {DAYS[slot.diaIdx]} {formatFecha(dias[slot.diaIdx])} — {slot.hora}
            </span>
          </h2>
          <button className="modal-cerrar" onClick={onCancel}>×</button>
        </div>

        <div className="modal-cuerpo">
          <label className="modal-campo">
            <span>Paciente</span>
            <div className="modal-busqueda-wrapper">
              <input
                type="text"
                placeholder="Buscar paciente..."
                value={textoBusqueda}
                onChange={e => {
                  onTextoBusquedaChange(e.target.value)
                }}
                onKeyDown={e => { if (e.key === 'Escape') onCancel() }}
                autoFocus
              />
              {!pacienteSeleccionado && textoBusqueda && (
                <div className="modal-resultados">
                  {resultadosBusqueda.length > 0 ? (
                    resultadosBusqueda.slice(0, 8).map(p => (
                      <button
                        key={p.no_expediente}
                        className="modal-resultado-item"
                        onClick={() => onSelectPaciente(p)}
                      >
                        <span className="modal-resultado-nombre">{p.nombre}</span>
                        {p.filtro && (
                          <span className="modal-resultado-stock">{p.filtro} · {p.acceso}</span>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="modal-resultados-vacio">Sin resultados</div>
                  )}
                </div>
              )}
            </div>
          </label>

          <label className="modal-campo">
            <span>Filtro</span>
            <select value={filtroSeleccionado} onChange={e => onFiltroChange(e.target.value)} disabled={!pacienteSeleccionado}>
              <option value="">— Selecciona filtro —</option>
              {opcionesFiltro.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>

          <label className="modal-campo">
            <span>Acceso</span>
            <select value={accesoSeleccionado} onChange={e => onAccesoChange(e.target.value)} disabled={!pacienteSeleccionado}>
              <option value="">— Selecciona acceso —</option>
              {opcionesAcceso.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>

          <div className="modal-crear-acciones">
            <button className="modal-btn-secundario" onClick={onCancel}>Cancelar</button>
            <button className="modal-btn-primario" onClick={onConfirm} disabled={!pacienteSeleccionado}>
              Agregar a la sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ModalCrearSesion
