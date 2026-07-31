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
  const [modalSession, setModalSession] = useState<Session | null>(null)
  const [modalMedicamentos, setModalMedicamentos] = useState<MedicamentoUso[]>([])
  const [inventarioItems, setInventarioItems] = useState<InventarioItem[]>([])
  const [modalBusqueda, setModalBusqueda] = useState('')
  const [modalCantidad, setModalCantidad] = useState(1)
  const [modalCargando, setModalCargando] = useState(false)

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

  function abrirModalMedicamentos(s: Session) {
    setModalSession(s)
    setModalMedicamentos([])
    setModalBusqueda('')
    setModalCantidad(1)
    setModalCargando(true)
    Promise.all([
      fetch(`/api/session/${s.id}/medicamentos`).then(r => r.json()),
      fetch('/api/inventario').then(r => r.json()),
    ])
      .then(([medicamentos, inventario]) => {
        setModalMedicamentos(medicamentos)
        setInventarioItems(inventario)
        setModalCargando(false)
      })
      .catch(() => {
        mostrarMensaje('error', 'Error al cargar medicamentos')
        setModalCargando(false)
      })
  }

  function cerrarModalMedicamentos() {
    setModalSession(null)
    setModalMedicamentos([])
    setInventarioItems([])
    setModalBusqueda('')
    setModalCantidad(1)
  }

  const modalResultadosBusqueda = useMemo(() => {
    if (!modalBusqueda.trim()) return []
    const q = modalBusqueda.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return inventarioItems.filter(i =>
      i.cantidad > 0 && i.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)
    )
  }, [modalBusqueda, inventarioItems])

  function agregarMedicamento(item: InventarioItem) {
    if (!modalSession || modalCantidad < 1) return
    if (modalCantidad > item.cantidad) {
      mostrarMensaje('error', `Stock insuficiente de ${item.nombre}. Disponible: ${item.cantidad}`)
      return
    }
    fetch(`/api/session/${modalSession.id}/medicamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inventario_id: item.id, cantidad_usada: modalCantidad }),
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Error al agregar medicamento')
        }
        return res.json()
      })
      .then(nuevoUso => {
        setModalMedicamentos(prev => [...prev, nuevoUso])
        setInventarioItems(prev => prev.map(i =>
          i.id === item.id ? { ...i, cantidad: i.cantidad - modalCantidad } : i
        ))
        setModalBusqueda('')
        setModalCantidad(1)
        mostrarMensaje('exito', `${item.nombre} agregado a la sesión`)
      })
      .catch(err => mostrarMensaje('error', err.message))
  }

  function quitarMedicamento(uso: MedicamentoUso) {
    if (!confirm(`¿Quitar ${uso.nombre} (${uso.cantidad_usada}) de la sesión?`)) return
    fetch(`/api/medicamento-sesion/${uso.id}`, { method: 'DELETE' })
      .then(async res => {
        if (!res.ok) throw new Error('Error al quitar medicamento')
        setModalMedicamentos(prev => prev.filter(m => m.id !== uso.id))
        setInventarioItems(prev => prev.map(i =>
          i.id === uso.inventario_id ? { ...i, cantidad: i.cantidad + uso.cantidad_usada } : i
        ))
        mostrarMensaje('exito', `${uso.nombre} quitado de la sesión`)
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
                                <div
                                  key={s.id}
                                  className="cal-paciente-item"
                                  onClick={e => { e.stopPropagation(); abrirModalMedicamentos(s) }}
                                >
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

      {modalSession && (
        <div className="modal-overlay" onClick={cerrarModalMedicamentos}>
          <div className="modal-contenido" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                Medicamentos — {modalSession.paciente_nombre || '—'}
                <span className="modal-hora">
                  {modalSession.fecha_hora
                    ? new Date(modalSession.fecha_hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
                    : ''}
                </span>
              </h2>
              <button className="modal-cerrar" onClick={cerrarModalMedicamentos}>×</button>
            </div>

            {modalCargando ? (
              <p className="modal-cargando">Cargando medicamentos...</p>
            ) : (
              <>
                <div className="modal-lista">
                  {modalMedicamentos.length === 0 ? (
                    <p className="modal-vacio">Sin medicamentos registrados</p>
                  ) : (
                    modalMedicamentos.map(u => (
                      <div key={u.id} className="modal-item">
                        <span className="modal-item-nombre">{u.nombre || '—'}</span>
                        <span className="modal-item-cantidad">{u.cantidad_usada}</span>
                        <button className="modal-item-quitar" onClick={() => quitarMedicamento(u)}>Quitar</button>
                      </div>
                    ))
                  )}
                </div>

                <div className="modal-agregar">
                  <h3>Agregar medicamento</h3>
                  <div className="modal-agregar-fila">
                    <div className="modal-busqueda-wrapper">
                      <input
                        type="text"
                        placeholder="Buscar medicamento..."
                        value={modalBusqueda}
                        onChange={e => setModalBusqueda(e.target.value)}
                      />
                      {modalBusqueda && (
                        <div className="modal-resultados">
                          {modalResultadosBusqueda.length > 0 ? (
                            modalResultadosBusqueda.slice(0, 10).map(item => (
                              <button
                                key={item.id}
                                className="modal-resultado-item"
                                onClick={() => { setModalCantidad(1); agregarMedicamento(item) }}
                              >
                                <span className="modal-resultado-nombre">{item.nombre}</span>
                                <span className="modal-resultado-stock">{item.cantidad} disp.</span>
                              </button>
                            ))
                          ) : (
                            <div className="modal-resultados-vacio">Sin resultados</div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="modal-cantidad-wrapper">
                      <label>Cant:</label>
                      <input
                        type="number"
                        min={1}
                        value={modalCantidad}
                        onChange={e => setModalCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default Calendario
