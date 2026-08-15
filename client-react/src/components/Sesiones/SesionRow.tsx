import { useState } from 'react'

interface Paciente {
  no_expediente: number
  nombre: string
  usos_restantes: number | null
}

interface Filtro {
  id: number
  estado: string
}

interface Acceso {
  id: number
  tipo: string
}

interface SesionItemData {
  id: number
  paciente_id: number
  paciente_nombre: string | null
  acceso: string | null
  filtro: string | null
  fecha_hora: string | null
}

interface SesionItem extends SesionItemData {
  fecha: string
  hora: string
}

interface Props {
  sesion: SesionItem
  pacientes: Paciente[]
  filtros: Filtro[]
  accesos: Acceso[]
  onUpdated: (sesion: SesionItemData) => void
  onDeleted: (id: number) => void
  mostrarMensaje: (tipo: 'error' | 'exito', texto: string) => void
}

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  return iso.substring(0, 16)
}

function SesionRow({ sesion, pacientes, filtros, accesos, onUpdated, onDeleted, mostrarMensaje }: Props) {
  const [editing, setEditing] = useState(false)
  const [editPacienteId, setEditPacienteId] = useState('')
  const [editFechaHora, setEditFechaHora] = useState('')
  const [editFiltro, setEditFiltro] = useState('')
  const [editAcceso, setEditAcceso] = useState('')

  function iniciarEdicion() {
    setEditing(true)
    setEditPacienteId(sesion.paciente_id ? String(sesion.paciente_id) : '')
    setEditFechaHora(toDatetimeLocal(sesion.fecha_hora))
    setEditFiltro(sesion.filtro ?? '')
    setEditAcceso(sesion.acceso ?? '')
  }

  function cancelarEdicion() {
    setEditing(false)
  }

  function guardarEdicion() {
    const body: Record<string, unknown> = {}
    if (editPacienteId) body.paciente_id = parseInt(editPacienteId, 10)
    if (editFechaHora) body.fecha_hora = editFechaHora
    body.filtro = editFiltro
    body.acceso = editAcceso

    fetch(`/api/session/${sesion.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Error al actualizar sesión')
        }
        return res.json()
      })
      .then(updated => {
        onUpdated(updated)
        cancelarEdicion()
        mostrarMensaje('exito', 'Sesión actualizada')
      })
      .catch(err => mostrarMensaje('error', err.message))
  }

  function handleDelete() {
    if (!confirm(`¿Eliminar la sesión #${sesion.id}?`)) return
    fetch(`/api/session/${sesion.id}`, { method: 'DELETE' })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Error al eliminar sesión')
        }
        onDeleted(sesion.id)
        mostrarMensaje('exito', `Sesión #${sesion.id} eliminada`)
      })
      .catch(err => mostrarMensaje('error', err.message))
  }

  return (
    <tr>
      <td>{sesion.id}</td>
      {editing ? (
        <>
          <td>
            <select
              value={editPacienteId}
              onChange={e => setEditPacienteId(e.target.value)}
              className="input-editar"
              autoFocus
            >
              <option value="">Seleccionar paciente</option>
              {pacientes.map(p => (
                <option key={p.no_expediente} value={p.no_expediente}>
                  {p.nombre} ({p.usos_restantes != null ? p.usos_restantes : '—'} usos)
                </option>
              ))}
            </select>
          </td>
          <td>
            <input
              type="datetime-local"
              value={editFechaHora}
              onChange={e => setEditFechaHora(e.target.value)}
              className="input-editar"
            />
          </td>
          <td></td>
          <td>
            <select
              value={editFiltro}
              onChange={e => setEditFiltro(e.target.value)}
              className="input-editar"
            >
              <option value="">Sin filtro</option>
              {filtros.map(f => (
                <option key={f.id} value={f.estado}>{f.estado}</option>
              ))}
            </select>
          </td>
          <td>
            <select
              value={editAcceso}
              onChange={e => setEditAcceso(e.target.value)}
              className="input-editar"
            >
              <option value="">Sin acceso</option>
              {accesos.map(a => (
                <option key={a.id} value={a.tipo}>{a.tipo}</option>
              ))}
            </select>
          </td>
        </>
      ) : (
        <>
          <td>{sesion.paciente_nombre ?? '—'}</td>
          <td>{sesion.fecha}</td>
          <td>{sesion.hora}</td>
          <td>{sesion.filtro ?? '—'}</td>
          <td>{sesion.acceso ?? '—'}</td>
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

export default SesionRow
