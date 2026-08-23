import { useState } from 'react'

interface SimpleItem {
  id: number
  value: string
  precio?: string
}

interface Props {
  item: SimpleItem
  apiUrl: string
  fieldKey: string
  entityName: string
  maxLength: number
  precioKey?: string
  precioLabel?: string
  onUpdated: (item: SimpleItem) => void
  onDeleted: (id: number) => void
  mostrarMensaje: (tipo: 'error' | 'exito', texto: string) => void
}

function SimpleRow({ item, apiUrl, fieldKey, entityName, maxLength, precioKey, precioLabel, onUpdated, onDeleted, mostrarMensaje }: Props) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [editPrecio, setEditPrecio] = useState('')

  function iniciarEdicion() {
    setEditing(true)
    setEditValue(item.value)
    setEditPrecio(item.precio ?? '')
  }

  function cancelarEdicion() {
    setEditing(false)
  }

  function guardarEdicion() {
    const val = editValue.trim()
    if (!val) {
      mostrarMensaje('error', `El ${fieldKey} es obligatorio`)
      return
    }
    if (val.length > maxLength) {
      mostrarMensaje('error', `No puede exceder ${maxLength} caracteres`)
      return
    }
    if (precioKey && !editPrecio.trim()) {
      mostrarMensaje('error', `${precioLabel} es obligatorio`)
      return
    }
    if (precioKey && (isNaN(Number(editPrecio)) || Number(editPrecio) < 0)) {
      mostrarMensaje('error', `${precioLabel} debe ser un número`)
      return
    }
    const body: Record<string, unknown> = { [fieldKey]: val }
    if (precioKey) body[precioKey] = Number(editPrecio)
    fetch(`${apiUrl}/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || `Error al actualizar ${entityName.toLowerCase()}`)
        }
        return res.json()
      })
      .then(updated => {
        const value = updated[fieldKey] ?? updated.nombre ?? updated.tipo ?? updated.estado ?? ''
        const precio = precioKey ? String(updated[precioKey] ?? '') : undefined
        onUpdated({ id: updated.id, value, precio })
        cancelarEdicion()
        mostrarMensaje('exito', `${entityName} actualizado`)
      })
      .catch(err => mostrarMensaje('error', err.message))
  }

  function handleDelete() {
    if (!confirm(`¿Eliminar ${entityName.toLowerCase()} "${item.value}"?`)) return
    fetch(`${apiUrl}/${item.id}`, { method: 'DELETE' })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || `Error al eliminar ${entityName.toLowerCase()}`)
        }
        onDeleted(item.id)
        mostrarMensaje('exito', `${entityName} "${item.value}" eliminado`)
      })
      .catch(err => mostrarMensaje('error', err.message))
  }

  return (
    <tr>
      <td>{item.id}</td>
      {editing ? (
        <td>
          <input
            type="text"
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') guardarEdicion(); if (e.key === 'Escape') cancelarEdicion() }}
            autoFocus
            className="input-editar"
          />
        </td>
      ) : (
        <td>{item.value}</td>
      )}
      {precioKey && (
        editing ? (
          <td>
            <input
              type="text"
              inputMode="decimal"
              value={editPrecio}
              onChange={e => setEditPrecio(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') guardarEdicion(); if (e.key === 'Escape') cancelarEdicion() }}
              className="input-editar"
            />
          </td>
        ) : (
          <td>{item.precio ?? '—'}</td>
        )
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

export default SimpleRow
export type { SimpleItem }
