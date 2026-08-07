import { useState, useEffect, useMemo } from 'react'
import { useMensaje } from '../shared/hooks'
import MensajeToast from '../shared/MensajeToast'
import DoctorRow from './DoctorRow'

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
  const { mensaje, mostrarMensaje } = useMensaje(4000)

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

  function handleUpdated(doctor: Doctor) {
    setDoctors(prev => prev.map(d => (d.id === doctor.id ? doctor : d)))
  }

  function handleDeleted(id: number) {
    setDoctors(prev => prev.filter(d => d.id !== id))
  }

  return (
    <section id="patients-page">
      <h1>Doctores</h1>

      <MensajeToast mensaje={mensaje} />

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
                <DoctorRow
                  key={d.id}
                  doctor={d}
                  onUpdated={handleUpdated}
                  onDeleted={handleDeleted}
                  mostrarMensaje={mostrarMensaje}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
export default Doctores
