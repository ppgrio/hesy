import { useState, useEffect, useMemo } from 'react'
import './Calendario.css'

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
}

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const HORAS: string[] = []
for (let h = 7; h <= 22; h++) {
  HORAS.push(`${String(h).padStart(2, '0')}:00`)
  if (h < 22) HORAS.push(`${String(h).padStart(2, '0')}:30`)
}

function getMonday(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
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

function formatFechaCompleta(d: Date): string {
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatISOtoDatetime(dia: Date, hora: string): string {
  const y = dia.getFullYear()
  const m = String(dia.getMonth() + 1).padStart(2, '0')
  const d = String(dia.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}T${hora}:00`
}

interface SlotBusqueda {
  diaIdx: number
  hora: string
}

function Calendario() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [pacientes, setPacientes] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [slotBuscando, setSlotBuscando] = useState<SlotBusqueda | null>(null)
  const [textoBusqueda, setTextoBusqueda] = useState('')
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'exito'; texto: string } | null>(null)

  function mostrarMensaje(tipo: 'error' | 'exito', texto: string) {
    setMensaje({ tipo, texto })
    setTimeout(() => setMensaje(null), 3000)
  }

  const lunes = useMemo(() => {
    const m = getMonday(new Date())
    m.setDate(m.getDate() + semanaOffset * 7)
    return m
  }, [semanaOffset])

  const dias = useMemo(() => {
    return DAYS.map((_, i) => {
      const d = new Date(lunes)
      d.setDate(lunes.getDate() + i)
      return d
    })
  }, [lunes])

  useEffect(() => {
    Promise.all([
      fetch('/api/session').then(r => r.json()),
      fetch('/api/patient').then(r => r.json()),
    ])
      .then(([sessionsData, pacientesData]) => {
        setSessions(sessionsData)
        setPacientes(pacientesData)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const grid = useMemo(() => {
    const map = new Map<string, Session[]>()
    for (const s of sessions) {
      if (!s.fecha_hora) continue
      const sd = new Date(s.fecha_hora)
      const diaIdx = dias.findIndex(d =>
        d.getFullYear() === sd.getFullYear() &&
        d.getMonth() === sd.getMonth() &&
        d.getDate() === sd.getDate()
      )
      if (diaIdx === -1) continue
      const hora = roundToSlot(s.fecha_hora)
      const key = toSlotKey(diaIdx, hora)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(s)
    }
    return map
  }, [sessions, dias])

  function getSesionesEnSlot(diaIdx: number, hora: string): Session[] {
    return grid.get(toSlotKey(diaIdx, hora)) || []
  }

  function handleSlotClick(diaIdx: number, hora: string) {
    setSlotBuscando({ diaIdx, hora })
    setTextoBusqueda('')
  }

  function cerrarBusqueda() {
    setSlotBuscando(null)
    setTextoBusqueda('')
  }

  const resultadosBusqueda = useMemo(() => {
    if (!textoBusqueda.trim()) return []
    const q = textoBusqueda.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return pacientes.filter(p =>
      p.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)
    )
  }, [textoBusqueda, pacientes])

  function handleSelectPaciente(p: Patient) {
    if (!slotBuscando) return
    const { diaIdx, hora } = slotBuscando
    const fecha_hora = formatISOtoDatetime(dias[diaIdx], hora)
    fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paciente_id: p.no_expediente, fecha_hora }),
    })
      .then(async res => {
        if (!res.ok) throw new Error('Error al agregar sesión')
        return res.json()
      })
      .then(nuevaSession => {
        setSessions(prev => [...prev, nuevaSession])
        cerrarBusqueda()
        mostrarMensaje('exito', `${p.nombre} agregado a la sesión`)
      })
      .catch(err => mostrarMensaje('error', err.message))
  }

  function handleDeleteSession(id: number, nombre: string | null) {
    if (!confirm(`¿Quitar a ${nombre || 'este paciente'} de la sesión?`)) return
    fetch(`/api/session/${id}`, { method: 'DELETE' })
      .then(async res => {
        if (!res.ok) throw new Error('Error al eliminar sesión')
        setSessions(prev => prev.filter(s => s.id !== id))
        mostrarMensaje('exito', `${nombre || 'Paciente'} quitado de la sesión`)
      })
      .catch(err => mostrarMensaje('error', err.message))
  }

  function irSemanaAnterior() { setSemanaOffset(o => o - 1) }
  function irSemanaSiguiente() { setSemanaOffset(o => o + 1) }
  function irHoy() { setSemanaOffset(0) }

  const domingo = new Date(lunes)
  domingo.setDate(lunes.getDate() + 6)

  return (
    <section id="patients-page">
      <h1>Calendario</h1>

      {loading && <p className="status">Cargando calendario...</p>}
      {error && <p className="status error">{error}</p>}

      {!loading && !error && (
        <>
          {mensaje && (
            <p className={`mensaje ${mensaje.tipo === 'error' ? 'mensaje-error' : 'mensaje-exito'}`}>
              {mensaje.texto}
            </p>
          )}
          <div className="cal-nav">
            <button onClick={irSemanaAnterior}>← Semana anterior</button>
            <span className="cal-rango">
              Semana del {formatFechaCompleta(lunes)} al {formatFechaCompleta(domingo)}
            </span>
            <button onClick={irSemanaSiguiente}>Semana siguiente →</button>
            {semanaOffset !== 0 && <button onClick={irHoy}>Hoy</button>}
          </div>

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
                      const buscando = slotBuscando?.diaIdx === diaIdx && slotBuscando?.hora === hora

                      return (
                        <td
                          key={diaIdx}
                          className={`cal-celda${buscando ? ' cal-buscando' : ''}`}
                          onClick={() => !buscando && handleSlotClick(diaIdx, hora)}
                        >
                          {buscando ? (
                            <div className="cal-busqueda" onClick={e => e.stopPropagation()}>
                              <input
                                type="text"
                                placeholder="Buscar paciente..."
                                value={textoBusqueda}
                                onChange={e => setTextoBusqueda(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Escape') cerrarBusqueda() }}
                                autoFocus
                              />
                              {resultadosBusqueda.length > 0 && (
                                <div className="cal-resultados">
                                  {resultadosBusqueda.slice(0, 8).map(p => (
                                    <button key={p.no_expediente} onClick={() => handleSelectPaciente(p)}>
                                      {p.nombre}
                                    </button>
                                  ))}
                                </div>
                              )}
                              {textoBusqueda && resultadosBusqueda.length === 0 && (
                                <div className="cal-resultados vacio">Sin resultados</div>
                              )}
                            </div>
                          ) : sesiones.length > 0 ? (
                            <div className="cal-pacientes-lista">
                              {sesiones.map(s => (
                                <div key={s.id} className="cal-paciente-item">
                                  {s.acceso && <span className="cal-paciente-acceso">{s.acceso}</span>}
                                  <span className="cal-paciente-nombre">{s.paciente_nombre || '—'}</span>
                                  {s.filtro && <span className="cal-paciente-filtro">{s.filtro}</span>}
                                  <button
                                    className="cal-quitar"
                                    onClick={e => { e.stopPropagation(); handleDeleteSession(s.id, s.paciente_nombre) }}
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
        </>
      )}
    </section>
  )
}

export default Calendario
