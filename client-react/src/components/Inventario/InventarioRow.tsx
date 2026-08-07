import { useState } from 'react'

interface Area {
  id: number
  nombre: string
}

interface InventarioItem {
  id: number
  codigo: number | null
  nombre: string
  cantidad: number
  caducidad: string | null
  area_id: number | null
  area: string | null
}

interface Props {
  item: InventarioItem
  areas: Area[]
  onUpdated: (item: InventarioItem) => void
  onDeleted: (id: number) => void
  mostrarMensaje: (tipo: 'error' | 'exito', texto: string) => void
}

function InventarioRow({ item, areas, onUpdated, onDeleted, mostrarMensaje }: Props) {
  const [editing, setEditing] = useState(false)
  const [editCodigo, setEditCodigo] = useState('')
  const [editNombre, setEditNombre] = useState('')
  const [editCantidad, setEditCantidad] = useState('')
  const [editCaducidad, setEditCaducidad] = useState('')
  const [editAreaId, setEditAreaId] = useState('')

  function iniciarEdicion() {
    setEditing(true)
    setEditCodigo(item.codigo != null ? String(item.codigo) : '')
    setEditNombre(item.nombre)
    setEditCantidad(String(item.cantidad))
    setEditCaducidad(item.caducidad ?? '')
    setEditAreaId(item.area_id ? String(item.area_id) : '')
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
    if (nombre.length > 30) {
      mostrarMensaje('error', 'El nombre no puede exceder 30 caracteres')
      return
    }
    const cantidad = parseInt(editCantidad, 10)
    if (isNaN(cantidad)) {
      mostrarMensaje('error', 'La cantidad debe ser un número')
      return
    }
    if (cantidad < 0) {
      mostrarMensaje('error', 'La cantidad no puede ser negativa')
      return
    }

    const body: Record<string, unknown> = { nombre, cantidad }
    if (editCodigo.trim()) body.codigo = parseInt(editCodigo, 10)
    else body.codigo = null
    if (editCaducidad) body.caducidad = editCaducidad
    else body.caducidad = null
    if (editAreaId) body.area_id = parseInt(editAreaId, 10)
    else body.area_id = null

    fetch(`/api/inventario/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Error al actualizar item')
        }
        return res.json()
      })
      .then(updated => {
        onUpdated(updated)
        cancelarEdicion()
        mostrarMensaje('exito', 'Item actualizado')
      })
      .catch(err => mostrarMensaje('error', err.message))
  }

  function handleDelete() {
    if (!confirm(`¿Eliminar "${item.nombre}"?`)) return
    fetch(`/api/inventario/${item.id}`, { method: 'DELETE' })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Error al eliminar item')
        }
        onDeleted(item.id)
        mostrarMensaje('exito', `"${item.nombre}" eliminado`)
      })
      .catch(err => mostrarMensaje('error', err.message))
  }

  function formatDate(d: string | null) {
    if (!d) return '—'
    return d
  }

  return (
    <tr>
      {editing ? (
        <td>
          <input
            type="text"
            inputMode="numeric"
            value={editCodigo}
            onChange={e => setEditCodigo(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') guardarEdicion(); if (e.key === 'Escape') cancelarEdicion() }}
            autoFocus
            className="input-editar"
          />
        </td>
      ) : (
        <td>{item.codigo ?? '—'}</td>
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
              type="number"
              value={editCantidad}
              onChange={e => setEditCantidad(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') guardarEdicion(); if (e.key === 'Escape') cancelarEdicion() }}
              min="0"
              className="input-editar"
            />
          </td>
          <td>
            <input
              type="date"
              value={editCaducidad}
              onChange={e => setEditCaducidad(e.target.value)}
              className="input-editar"
            />
          </td>
          <td>
            <select
              value={editAreaId}
              onChange={e => setEditAreaId(e.target.value)}
              className="input-editar"
            >
              <option value="">Sin área</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </td>
        </>
      ) : (
        <>
          <td>{item.nombre}</td>
          <td>{item.cantidad}</td>
          <td>{formatDate(item.caducidad)}</td>
          <td>{item.area ?? '—'}</td>
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

export default InventarioRow
