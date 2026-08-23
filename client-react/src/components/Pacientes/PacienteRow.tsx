import { useState } from 'react'
import { validarEnteros, validarFlotante } from '../shared/utils'

interface Doctor {
  id: number
  nombre: string
}

interface Acceso {
  id: number
  tipo: string
}

interface Filtro {
  id: number
  estado: string
}

interface PacienteItem {
  id: number
  no_expediente: number | null
  nombre: string
  fecha_nacimiento: string | null
  hierros: number | null
  eritropoyetina: number | null
  usos_restantes: number | null
  credito: number | null
  observaciones: string | null
  fecha_inicio_filtro: string | null
  fecha_fin_filtro: string | null
  doctor_id: number | null
  doctor: string | null
  acceso_id: number | null
  acceso: string | null
  filtro_id: number | null
  filtro: string | null
}

interface Props {
  paciente: PacienteItem
  doctores: Doctor[]
  accesos: Acceso[]
  filtros: Filtro[]
  onUpdated: (paciente: PacienteItem) => void
  onDeleted: (id: number) => void
  mostrarMensaje: (tipo: 'error' | 'exito', texto: string) => void
}

function PacienteRow({ paciente, doctores, accesos, filtros, onUpdated, onDeleted, mostrarMensaje }: Props) {
  const [editing, setEditing] = useState(false)
  const [editNoExpediente, setEditNoExpediente] = useState('')
  const [editNombre, setEditNombre] = useState('')
  const [editFechaNacimiento, setEditFechaNacimiento] = useState('')
  const [editHierros, setEditHierros] = useState('')
  const [editEritropoyetina, setEditEritropoyetina] = useState('')
  const [editUsosRestantes, setEditUsosRestantes] = useState('')
  const [editCredito, setEditCredito] = useState('')
  const [editDoctorId, setEditDoctorId] = useState('')
  const [editAccesoId, setEditAccesoId] = useState('')
  const [editFiltroId, setEditFiltroId] = useState('')
  const [editFechaInicioFiltro, setEditFechaInicioFiltro] = useState('')
  const [editFechaFinFiltro, setEditFechaFinFiltro] = useState('')
  const [editObservaciones, setEditObservaciones] = useState('')

  function iniciarEdicion() {
    setEditing(true)
    setEditNoExpediente(paciente.no_expediente != null ? String(paciente.no_expediente) : '')
    setEditNombre(paciente.nombre)
    setEditFechaNacimiento(paciente.fecha_nacimiento ?? '')
    setEditHierros(paciente.hierros != null ? String(paciente.hierros) : '')
    setEditEritropoyetina(paciente.eritropoyetina != null ? String(paciente.eritropoyetina) : '')
    setEditUsosRestantes(paciente.usos_restantes != null ? String(paciente.usos_restantes) : '')
    setEditCredito(paciente.credito != null ? String(paciente.credito) : '')
    setEditDoctorId(paciente.doctor_id ? String(paciente.doctor_id) : '')
    setEditAccesoId(paciente.acceso_id ? String(paciente.acceso_id) : '')
    setEditFiltroId(paciente.filtro_id ? String(paciente.filtro_id) : '')
    setEditFechaInicioFiltro(paciente.fecha_inicio_filtro ?? '')
    setEditFechaFinFiltro(paciente.fecha_fin_filtro ?? '')
    setEditObservaciones(paciente.observaciones ?? '')
  }

  function cancelarEdicion() {
    setEditing(false)
  }

  function guardarEdicion() {
    const nombre = editNombre.trim()
    if (!nombre) {
      mostrarMensaje('error', 'El nombre es obligatorio')
      return
    }
    if (nombre.length > 60) {
      mostrarMensaje('error', 'El nombre no puede exceder 60 caracteres')
      return
    }

    if (!validarEnteros([
      ['Hierros', editHierros],
      ['Eritropoyetina', editEritropoyetina],
      ['Usos restantes', editUsosRestantes],
    ], mostrarMensaje, true)) return
    if (!validarEnteros([['No. expediente', editNoExpediente]], mostrarMensaje)) return
    if (!validarFlotante([['Crédito', editCredito]], mostrarMensaje, true)) return

    const body: Record<string, unknown> = { nombre }
    if (editNoExpediente.trim()) body.no_expediente = parseInt(editNoExpediente, 10)
    else body.no_expediente = null
    if (editFechaNacimiento) body.fecha_nacimiento = editFechaNacimiento
    else body.fecha_nacimiento = null
    if (editHierros.trim()) body.hierros = parseInt(editHierros, 10)
    else body.hierros = null
    if (editEritropoyetina.trim()) body.eritropoyetina = parseInt(editEritropoyetina, 10)
    else body.eritropoyetina = null
    if (editUsosRestantes.trim()) body.usos_restantes = parseInt(editUsosRestantes, 10)
    else body.usos_restantes = null
    body.credito = parseFloat(editCredito)
    if (editDoctorId) body.doctor_id = parseInt(editDoctorId, 10)
    else body.doctor_id = null
    if (editAccesoId) body.acceso_id = parseInt(editAccesoId, 10)
    else body.acceso_id = null
    if (editFiltroId) body.filtro_id = parseInt(editFiltroId, 10)
    else body.filtro_id = null
    if (editFechaInicioFiltro) body.fecha_inicio_filtro = editFechaInicioFiltro
    else body.fecha_inicio_filtro = null
    if (editFechaFinFiltro) body.fecha_fin_filtro = editFechaFinFiltro
    else body.fecha_fin_filtro = null
    if (editObservaciones.trim()) body.observaciones = editObservaciones.trim()
    else body.observaciones = null

    fetch(`/api/patient/${paciente.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Error al actualizar paciente')
        }
        return res.json()
      })
      .then(updated => {
        onUpdated(updated)
        cancelarEdicion()
        mostrarMensaje('exito', 'Paciente actualizado')
      })
      .catch(err => mostrarMensaje('error', err.message))
  }

  function handleDelete() {
    if (!confirm(`¿Eliminar al paciente "${paciente.nombre}"?`)) return
    fetch(`/api/patient/${paciente.id}`, { method: 'DELETE' })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Error al eliminar paciente')
        }
        onDeleted(paciente.id)
        mostrarMensaje('exito', `Paciente "${paciente.nombre}" eliminado`)
      })
      .catch(err => mostrarMensaje('error', err.message))
  }

  function formatDate(d: string | null) {
    if (!d) return '—'
    return d
  }

  const thStyle: React.CSSProperties = { width: 100 }

  return (
    <tr>
      {editing ? (
        <td style={thStyle}>
          <input
            type="text"
            inputMode="numeric"
            value={editNoExpediente}
            onChange={e => setEditNoExpediente(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') guardarEdicion(); if (e.key === 'Escape') cancelarEdicion() }}
            className="input-editar"
          />
        </td>
      ) : (
        <td style={thStyle}>{paciente.no_expediente ?? '—'}</td>
      )}
      {editing ? (
        <>
          <td>
            <input
              type="text"
              value={editNombre}
              onChange={e => setEditNombre(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') guardarEdicion(); if (e.key === 'Escape') cancelarEdicion() }}
              autoFocus
              className="input-editar"
            />
          </td>
          <td>
            <input
              type="date"
              value={editFechaNacimiento}
              onChange={e => setEditFechaNacimiento(e.target.value)}
              className="input-editar"
            />
          </td>
          <td>
            <input
              type="text"
              inputMode="numeric"
              value={editHierros}
              onChange={e => setEditHierros(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') guardarEdicion(); if (e.key === 'Escape') cancelarEdicion() }}
              className="input-editar"
            />
          </td>
          <td>
            <input
              type="text"
              inputMode="numeric"
              value={editEritropoyetina}
              onChange={e => setEditEritropoyetina(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') guardarEdicion(); if (e.key === 'Escape') cancelarEdicion() }}
              className="input-editar"
            />
          </td>
          <td>
            <input
              type="text"
              inputMode="numeric"
              value={editUsosRestantes}
              onChange={e => setEditUsosRestantes(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') guardarEdicion(); if (e.key === 'Escape') cancelarEdicion() }}
              className="input-editar"
            />
          </td>
          <td>
            <input
              type="text"
              inputMode="decimal"
              value={editCredito}
              onChange={e => setEditCredito(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') guardarEdicion(); if (e.key === 'Escape') cancelarEdicion() }}
              className="input-editar"
            />
          </td>
          <td>
            <select
              value={editDoctorId}
              onChange={e => setEditDoctorId(e.target.value)}
              className="input-editar"
            >
              <option value="">Sin doctor</option>
              {doctores.map(d => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
          </td>
          <td>
            <select
              value={editAccesoId}
              onChange={e => setEditAccesoId(e.target.value)}
              className="input-editar"
            >
              <option value="">Sin acceso</option>
              {accesos.map(a => (
                <option key={a.id} value={a.id}>{a.tipo}</option>
              ))}
            </select>
          </td>
          <td>
            <select
              value={editFiltroId}
              onChange={e => setEditFiltroId(e.target.value)}
              className="input-editar"
            >
              <option value="">Sin filtro</option>
              {filtros.map(f => (
                <option key={f.id} value={f.id}>{f.estado}</option>
              ))}
            </select>
          </td>
          <td>
            <input
              type="date"
              value={editFechaInicioFiltro}
              onChange={e => setEditFechaInicioFiltro(e.target.value)}
              className="input-editar"
            />
          </td>
          <td>
            <input
              type="date"
              value={editFechaFinFiltro}
              onChange={e => setEditFechaFinFiltro(e.target.value)}
              className="input-editar"
            />
          </td>
          <td>
            <input
              type="text"
              value={editObservaciones}
              onChange={e => setEditObservaciones(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') guardarEdicion(); if (e.key === 'Escape') cancelarEdicion() }}
              className="input-editar"
            />
          </td>
        </>
      ) : (
        <>
          <td>{paciente.nombre}</td>
          <td>{formatDate(paciente.fecha_nacimiento)}</td>
          <td>{paciente.hierros ?? '—'}</td>
          <td>{paciente.eritropoyetina ?? '—'}</td>
          <td>{paciente.usos_restantes ?? '—'}</td>
          <td>{paciente.credito ?? '—'}</td>
          <td>{paciente.doctor ?? '—'}</td>
          <td>{paciente.acceso ?? '—'}</td>
          <td>{paciente.filtro ?? '—'}</td>
          <td>{formatDate(paciente.fecha_inicio_filtro)}</td>
          <td>{formatDate(paciente.fecha_fin_filtro)}</td>
          <td>{paciente.observaciones ?? '—'}</td>
        </>
      )}
      <td>
        {editing ? (
          <span className="acciones-flex">
            <button className="btn-accion" onClick={guardarEdicion}>Guardar</button>
            <button className="btn-accion" onClick={cancelarEdicion}>Cancelar</button>
          </span>
        ) : (
          <span className="acciones-flex">
            <button className="btn-accion" onClick={iniciarEdicion}>Editar</button>
            <button className="btn-accion btn-accion-eliminar" onClick={handleDelete}>Eliminar</button>
          </span>
        )}
      </td>
    </tr>
  )
}

export default PacienteRow
