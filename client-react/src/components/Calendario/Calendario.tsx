import { useState, useEffect, useMemo } from 'react'
import type { Session, Patient, SlotBusqueda, FiltroOption, AccesoOption } from './types'
import { getMonday, formatFechaCompleta, roundToSlot, toSlotKey, formatISOtoDatetime } from './utils'
import { useMensaje } from '../shared/hooks'
import MensajeToast from '../shared/MensajeToast'
import CalendarioGrid from './CalendarioGrid'
import ModalCrearSesion from './ModalCrearSesion'
import '../shared/crud.css'
import './Calendario.css'

function Calendario() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [pacientes, setPacientes] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [modalCrear, setModalCrear] = useState<SlotBusqueda | null>(null)
  const [pacienteId, setPacienteId] = useState('')
  const [filtroSeleccionado, setFiltroSeleccionado] = useState('')
  const [accesoSeleccionado, setAccesoSeleccionado] = useState('')
  const [opcionesFiltro, setOpcionesFiltro] = useState<FiltroOption[]>([])
  const [opcionesAcceso, setOpcionesAcceso] = useState<AccesoOption[]>([])
  const { mensaje, mostrarMensaje } = useMensaje(3000)

  const lunes = useMemo(() => {
    const m = getMonday(new Date())
    m.setDate(m.getDate() + semanaOffset * 7)
    return m
  }, [semanaOffset])

  const dias = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lunes)
      d.setDate(lunes.getDate() + i)
      return d
    })
  }, [lunes])

  const domingo = useMemo(() => {
    const d = new Date(lunes)
    d.setDate(lunes.getDate() + 6)
    return d
  }, [lunes])

  useEffect(() => {
    setLoading(true)
    setError(null)
    const desde = lunes.toISOString().split('T')[0]
    const hasta = domingo.toISOString().split('T')[0]
    Promise.all([
      fetch(`/api/session?desde=${desde}&hasta=${hasta}`).then(r => r.json()),
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
  }, [lunes, domingo])

  useEffect(() => {
    Promise.all([
      fetch('/api/filtros').then(r => r.json()),
      fetch('/api/accesos').then(r => r.json()),
    ])
      .then(([filtros, accesos]) => {
        setOpcionesFiltro(filtros)
        setOpcionesAcceso(accesos)
      })
      .catch(() => {})
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
    setModalCrear({ diaIdx, hora })
    setPacienteId('')
    setFiltroSeleccionado('')
    setAccesoSeleccionado('')
  }

  function cerrarModalCrear() {
    setModalCrear(null)
    setPacienteId('')
    setFiltroSeleccionado('')
    setAccesoSeleccionado('')
  }

  function handlePacienteChange(id: string) {
    setPacienteId(id)
    if (id) {
      const p = pacientes.find(p => p.id === parseInt(id, 10))
      if (p) {
        setFiltroSeleccionado(p.filtro || '')
        setAccesoSeleccionado(p.acceso || '')
        return
      }
    }
    setFiltroSeleccionado('')
    setAccesoSeleccionado('')
  }

  function crearSesion() {
    if (!modalCrear || !pacienteId) return
    const { diaIdx, hora } = modalCrear
    const fecha_hora = formatISOtoDatetime(dias[diaIdx], hora)
    const p = pacientes.find(p => p.id === parseInt(pacienteId, 10))
    fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paciente_id: parseInt(pacienteId, 10),
        fecha_hora,
        filtro: filtroSeleccionado || null,
        acceso: accesoSeleccionado || null,
      }),
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Error al agregar sesión')
        }
        return res.json()
      })
      .then(nuevaSession => {
        setSessions(prev => [...prev, nuevaSession])
        cerrarModalCrear()
        mostrarMensaje('exito', `Sesión creada para ${p?.nombre || 'paciente'}`)
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

  return (
    <section id="patients-page">
      <h1>Calendario</h1>

      {loading && <p className="status">Cargando calendario...</p>}
      {error && <p className="status error">{error}</p>}

      {!loading && !error && (
        <>
          <MensajeToast mensaje={mensaje} />

          <div className="cal-nav">
            <button onClick={irSemanaAnterior}>← Semana anterior</button>
            <span className="cal-rango">
              Semana del {formatFechaCompleta(lunes)} al {formatFechaCompleta(domingo)}
            </span>
            <button onClick={irSemanaSiguiente}>Semana siguiente →</button>
            {semanaOffset !== 0 && <button onClick={irHoy}>Hoy</button>}
          </div>

          <CalendarioGrid
            dias={dias}
            getSesionesEnSlot={getSesionesEnSlot}
            onSlotClick={handleSlotClick}
            onDeleteSession={handleDeleteSession}
          />
        </>
      )}

      <ModalCrearSesion
        slot={modalCrear}
        dias={dias}
        pacientes={pacientes}
        pacienteId={pacienteId}
        onPacienteIdChange={handlePacienteChange}
        filtroSeleccionado={filtroSeleccionado}
        onFiltroChange={setFiltroSeleccionado}
        accesoSeleccionado={accesoSeleccionado}
        onAccesoChange={setAccesoSeleccionado}
        opcionesFiltro={opcionesFiltro}
        opcionesAcceso={opcionesAcceso}
        onCancel={cerrarModalCrear}
        onConfirm={crearSesion}
      />
    </section>
  )
}

export default Calendario
