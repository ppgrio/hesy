import { useState } from 'react'

interface Doctor {
  id: number
  nombre: string
}

interface Props {
  doctor: Doctor
  onUpdated: (doctor: Doctor) => void
  onDeleted: (id: number) => void
  mostrarMensaje: (tipo: 'error' | 'exito', texto: string) => void
}

function DoctorRow({ doctor, onUpdated, onDeleted, mostrarMensaje }: Props) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')

  function iniciarEdicion() {
    setEditing(true)
    setEditName(doctor.nombre)
  }

  function cancelarEdicion() {
    setEditing(false)
    setEditName('')
  }

  function guardarEdicion() {
    const nombre = editName.trim()
    if (!nombre) return
    if (nombre.length > 20) {
      mostrarMensaje('error', 'El nombre no puede exceder 20 caracteres')
      return
    }
    fetch(`/api/doctor/${doctor.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre }),
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Error al actualizar doctor')
        }
        return res.json()
      })
      .then(updated => {
        onUpdated(updated)
        cancelarEdicion()
        mostrarMensaje('exito', 'Doctor actualizado')
      })
      .catch(err => mostrarMensaje('error', err.message))
  }

  function handleDelete() {
    if (!confirm(`¿Eliminar al doctor "${doctor.nombre}"?`)) return
    fetch(`/api/doctor/${doctor.id}`, { method: 'DELETE' })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Error al eliminar doctor')
        }
        onDeleted(doctor.id)
        mostrarMensaje('exito', `Doctor "${doctor.nombre}" eliminado`)
      })
      .catch(err => mostrarMensaje('error', err.message))
  }

  return (
    <tr>
      <td>{doctor.id}</td>
      {editing ? (
        <td>
          <input
            type="text"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') guardarEdicion(); if (e.key === 'Escape') cancelarEdicion() }}
            autoFocus
            className="input-editar"
          />
        </td>
      ) : (
        <td>{doctor.nombre}</td>
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

export default DoctorRow
