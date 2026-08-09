import { useState, useEffect } from 'react'
import { useMensaje } from '../shared/hooks'
import MensajeToast from '../shared/MensajeToast'
import CrudModal from '../shared/CrudModal'
import CrudTableHead from '../shared/CrudTableHead'
import useSortFilter from '../shared/useSortFilter'
import type { ColumnConfig } from '../shared/useSortFilter'
import DoctorRow from './DoctorRow'
import '../shared/crud.css'

interface Doctor {
  id: number
  nombre: string
}

const columns: ColumnConfig<Doctor>[] = [
  { key: 'id', label: 'ID' },
  { key: 'nombre', label: 'Nombre' },
]

function Doctores() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const { mensaje, mostrarMensaje } = useMensaje(4000)
  const [modalOpen, setModalOpen] = useState(false)

  const { sortKey, sortDir, filtros, setFiltro, handleSort, sorted } = useSortFilter(
    doctors, columns, 'id', 'asc'
  )

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

  function handleAdd() {
    const nombre = nuevoNombre.trim()
    if (!nombre) {
      mostrarMensaje('error', 'El nombre es obligatorio')
      return
    }
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
        setModalOpen(false)
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
      <div className="inventario-header">
        <h1>Doctores</h1>
        <button className="btn-agregar" onClick={() => setModalOpen(true)}>+ Agregar Doctor</button>
      </div>

      <MensajeToast mensaje={mensaje} />

      <CrudModal open={modalOpen} onClose={() => setModalOpen(false)} titulo="Agregar Doctor">
        <input
          type="text"
          placeholder="Nombre del doctor"
          value={nuevoNombre}
          onChange={e => setNuevoNombre(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
        />
        <button onClick={handleAdd}>Agregar</button>
      </CrudModal>

      {loading && <p className="status">Cargando doctores...</p>}
      {error && <p className="status error">{error}</p>}
      {!loading && !error && doctors.length === 0 && (
        <p className="status">No hay doctores registrados.</p>
      )}

      {!loading && !error && doctors.length > 0 && (
        <div className="table-wrapper">
          <table>
            <CrudTableHead
              columns={columns}
              filtros={filtros}
              onFiltroChange={setFiltro}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
            />
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '24px 0' }}>
                    Sin resultados.
                  </td>
                </tr>
              ) : (
                sorted.map(d => (
                  <DoctorRow
                    key={d.id}
                    doctor={d}
                    onUpdated={handleUpdated}
                    onDeleted={handleDeleted}
                    mostrarMensaje={mostrarMensaje}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
export default Doctores
