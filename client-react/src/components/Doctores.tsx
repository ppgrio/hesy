import { useState, useEffect, useMemo } from 'react'
import './Doctores.css'

interface Doctor {
  id: number
  nombre: string
}

type SortKey = keyof Doctor

const columns: { key: SortKey; label: string }[] = [
  { key: 'id', label: 'ID' },
  { key: 'nombre', label: 'Nombre' },
]

function Doctores() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('id')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [editandoNombre, setEditandoNombre] = useState('')
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'exito'; texto: string } | null>(null)

  function mostrarMensaje(tipo: 'error' | 'exito', texto: string) {
    setMensaje({ tipo, texto })
    setTimeout(() => setMensaje(null), 4000)
  }

  useEffect(() => {
    fetch('/api/doctor')
      .then(res => {
        if (!res.ok) throw new Error('Error al obtener doctores')
        return res.json()
      })
      .then(data => {
        setDoctors(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const sorted = useMemo(() => {
    return [...doctors].sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [doctors, sortKey, sortDir])

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function handleAdd() {
    const nombre = nuevoNombre.trim()
    if (!nombre) return
    if (nombre.length > 20) {
      mostrarMensaje('error', 'El nombre no puede exceder 20 caracteres')
      return
    }
    fetch('/api/doctor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre }),
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Error al agregar doctor')
        }
        return res.json()
      })
      .then(doctor => {
        setDoctors(prev => [...prev, doctor])
        setNuevoNombre('')
        mostrarMensaje('exito', `Doctor "${doctor.nombre}" agregado`)
      })
      .catch(err => mostrarMensaje('error', err.message))
  }

  function iniciarEdicion(doctor: Doctor) {
    setEditandoId(doctor.id)
    setEditandoNombre(doctor.nombre)
  }

  function cancelarEdicion() {
    setEditandoId(null)
    setEditandoNombre('')
  }

  function guardarEdicion(id: number) {
    const nombre = editandoNombre.trim()
    if (!nombre) return
    if (nombre.length > 20) {
      mostrarMensaje('error', 'El nombre no puede exceder 20 caracteres')
      return
    }
    fetch(`/api/doctor/${id}`, {
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
      .then(doctor => {
        setDoctors(prev => prev.map(d => (d.id === id ? doctor : d)))
        cancelarEdicion()
        mostrarMensaje('exito', 'Doctor actualizado')
      })
      .catch(err => mostrarMensaje('error', err.message))
  }

  function handleDelete(id: number, nombre: string) {
    if (!confirm(`¿Eliminar al doctor "${nombre}"?`)) return
    fetch(`/api/doctor/${id}`, { method: 'DELETE' })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Error al eliminar doctor')
        }
        setDoctors(prev => prev.filter(d => d.id !== id))
        mostrarMensaje('exito', `Doctor "${nombre}" eliminado`)
      })
      .catch(err => mostrarMensaje('error', err.message))
  }

  return (
    <section id="patients-page">
      <h1>Doctores</h1>

      {mensaje && (
        <p className={`mensaje ${mensaje.tipo === 'error' ? 'mensaje-error' : 'mensaje-exito'}`}>
          {mensaje.texto}
        </p>
      )}

      <div className="filtro-fechas">
        <input
          type="text"
          placeholder="Nombre del doctor"
          value={nuevoNombre}
          onChange={e => setNuevoNombre(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
        />
        <button onClick={handleAdd}>
          Agregar doctor
        </button>
      </div>

      {loading && <p className="status">Cargando doctores...</p>}
      {error && <p className="status error">{error}</p>}
      {!loading && !error && doctors.length === 0 && (
        <p className="status">No hay doctores registrados.</p>
      )}

      {!loading && !error && doctors.length > 0 && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    className="sortable"
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    {sortKey === col.key && (
                      <span className="sort-arrow">{sortDir === 'desc' ? ' ▼' : ' ▲'}</span>
                    )}
                  </th>
                ))}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(d => (
                <tr key={d.id}>
                  <td>{d.id}</td>
                  {editandoId === d.id ? (
                    <td>
                      <input
                        type="text"
                        value={editandoNombre}
                        onChange={e => setEditandoNombre(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') guardarEdicion(d.id); if (e.key === 'Escape') cancelarEdicion() }}
                        autoFocus
                        className="input-editar"
                      />
                    </td>
                  ) : (
                    <td>{d.nombre}</td>
                  )}
                  <td>
                    {editandoId === d.id ? (
                      <span className="acciones-flex">
                        <button className="btn-accion" onClick={() => guardarEdicion(d.id)}>Guardar</button>
                        <button className="btn-accion" onClick={cancelarEdicion}>Cancelar</button>
                      </span>
                    ) : (
                      <span className="acciones-flex">
                        <button className="btn-accion" onClick={() => iniciarEdicion(d)}>Editar</button>
                        <button className="btn-accion btn-accion-eliminar" onClick={() => handleDelete(d.id, d.nombre)}>Eliminar</button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
export default Doctores
