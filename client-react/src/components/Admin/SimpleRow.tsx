import { useState } from 'react'

interface SimpleItem {
  id: number
  value: string
}

interface Props {
  item: SimpleItem
  apiUrl: string
  fieldKey: string
  entityName: string
  maxLength: number
  onUpdated: (item: SimpleItem) => void
  onDeleted: (id: number) => void
  mostrarMensaje: (tipo: 'error' | 'exito', texto: string) => void
}

function SimpleRow({ item, apiUrl, fieldKey, entityName, maxLength, onUpdated, onDeleted, mostrarMensaje }: Props) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  function iniciarEdicion() {
    setEditing(true)
    setEditValue(item.value)
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
    fetch(`${apiUrl}/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [fieldKey]: val }),
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
        onUpdated({ id: updated.id, value })
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
