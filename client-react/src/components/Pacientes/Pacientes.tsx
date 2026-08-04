import { useState, useEffect, useMemo } from 'react'
import './Pacientes.css'

interface Patient {
  no_expediente: number
  nombre: string
  fecha_nacimiento: string | null
  hierros: number | null
  eritropoyetina: number | null
  observaciones: string | null
  fecha_inicio_filtro: string | null
  fecha_fin_filtro: string | null
  doctor: string | null
  acceso: string | null
  filtro: string | null
}

type SortKey = keyof Patient

const columns: { key: SortKey; label: string }[] = [
  { key: 'no_expediente', label: 'No. Expediente' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'fecha_nacimiento', label: 'Fecha Nacimiento' },
  { key: 'hierros', label: 'Hierros' },
  { key: 'eritropoyetina', label: 'Eritropoyetina' },
  { key: 'doctor', label: 'Doctor' },
  { key: 'acceso', label: 'Acceso' },
  { key: 'filtro', label: 'Filtro' },
  { key: 'fecha_inicio_filtro', label: 'Inicio Filtro' },
  { key: 'fecha_fin_filtro', label: 'Fin Filtro' },
  { key: 'observaciones', label: 'Observaciones' },
]

function Pacientes() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('no_expediente')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetch('/api/patient')
      .then(res => {
        if (!res.ok) throw new Error('Error al obtener pacientes')
        return res.json()
      })
      .then(data => {
        setPatients(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const sorted = useMemo(() => {
    return [...patients].sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [patients, sortKey, sortDir])

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  return (
    <section id="patients-page">
      <h1>Pacientes</h1>

      {loading && <p className="status">Cargando pacientes...</p>}
      {error && <p className="status error">{error}</p>}
      {!loading && !error && patients.length === 0 && (
        <p className="status">No hay pacientes registrados.</p>
      )}

      {!loading && !error && patients.length > 0 && (
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
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => (
                <tr key={p.no_expediente}>
                  <td>{p.no_expediente}</td>
                  <td>{p.nombre}</td>
                  <td>{p.fecha_nacimiento ?? '—'}</td>
                  <td>{p.hierros ?? '—'}</td>
                  <td>{p.eritropoyetina ?? '—'}</td>
                  <td>{p.doctor ?? '—'}</td>
                  <td>{p.acceso ?? '—'}</td>
                  <td>{p.filtro ?? '—'}</td>
                  <td>{p.fecha_inicio_filtro ?? '—'}</td>
                  <td>{p.fecha_fin_filtro ?? '—'}</td>
                  <td>{p.observaciones ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default Pacientes
