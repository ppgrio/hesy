import type { Session } from './types'
import { DAYS, HORAS, formatFecha } from './utils'

interface Props {
  dias: Date[]
  getSesionesEnSlot: (diaIdx: number, hora: string) => Session[]
  onSlotClick: (diaIdx: number, hora: string) => void
  onSessionClick: (s: Session) => void
  onDeleteSession: (id: number, nombre: string | null) => void
}

function CalendarioGrid({ dias, getSesionesEnSlot, onSlotClick, onSessionClick, onDeleteSession }: Props) {
  return (
    <div className="cal-wrapper">
      <table className="cal-tabla">
        <thead>
          <tr>
            <th className="cal-hora-header">Hora</th>
            {dias.map((d, i) => (
              <th key={i} className="cal-dia-header">
                <span className="cal-dia-nombre">{DAYS[i]}</span>
                <span className="cal-dia-fecha">{formatFecha(d)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HORAS.map(hora => (
            <tr key={hora}>
              <td className="cal-hora">{hora}</td>
              {dias.map((_, diaIdx) => {
                const sesiones = getSesionesEnSlot(diaIdx, hora)
                return (
                  <td
                    key={diaIdx}
                    className="cal-celda"
                    onClick={() => onSlotClick(diaIdx, hora)}
                  >
                    {sesiones.length > 0 ? (
                      <div className="cal-pacientes-lista">
                        {sesiones.map(s => (
                          <div
                            key={s.id}
                            className="cal-paciente-item"
                            onClick={e => { e.stopPropagation(); onSessionClick(s) }}
                          >
                            {s.acceso && <span className="cal-paciente-acceso">{s.acceso}</span>}
                            <span className="cal-paciente-nombre">{s.paciente_nombre || '—'}</span>
                            {s.filtro && <span className="cal-paciente-filtro">{s.filtro}</span>}
                            <button
                              className="cal-quitar"
                              onClick={e => { e.stopPropagation(); onDeleteSession(s.id, s.paciente_nombre) }}
                              title="Quitar paciente"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="cal-vacio">
                        <span className="cal-mas">+</span>
                      </div>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default CalendarioGrid
