import { useState, useEffect, useMemo } from 'react'
import './Sesiones.css'

interface Session {
  id: number
  paciente_id: number
  paciente_nombre: string | null
  fecha_hora: string | null
}

type ColumnKey = 'id' | 'paciente_nombre' | 'fecha' | 'hora'

const columnSortKey: Record<ColumnKey, keyof Session> = {
  id: 'id',
  paciente_nombre: 'paciente_nombre',
  fecha: 'fecha_hora',
  hora: 'fecha_hora',
}

const columns: { key: ColumnKey; label: string }[] = [
  { key: 'id', label: 'ID Sesión' },
  { key: 'paciente_nombre', label: 'Nombre Paciente' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'hora', label: 'Hora' },
]

function Sesiones() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [sortKey, setSortKey] = useState<ColumnKey>('fecha')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetch('/api/session')
      .then(res => {
        if (!res.ok) throw new Error('Error al obtener sesiones')
        return res.json()
      })
      .then(data => {
        setSessions(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const sorted = useMemo(() => {
    const sk = columnSortKey[sortKey]
    return [...sessions].sort((a, b) => {
      const va = a[sk]
      const vb = b[sk]
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [sessions, sortKey, sortDir])

  const filteredSessions = useMemo(() => {
    return sorted.filter(s => {
      if (!s.fecha_hora) return false
      const fecha = s.fecha_hora.split('T')[0]
      if (fechaDesde && fecha < fechaDesde) return false
      if (fechaHasta && fecha > fechaHasta) return false
      return true
    })
  }, [sorted, fechaDesde, fechaHasta])

  function handleSort(key: ColumnKey) {
    if (key === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  return (
    <section id="patients-page">
      <h1>Sesiones</h1>

      {loading && <p className="status">Cargando sesiones...</p>}
      {error && <p className="status error">{error}</p>}
      {!loading && !error && sessions.length === 0 && (
        <p className="status">No hay sesiones registradas.</p>
      )}

      {!loading && !error && sessions.length > 0 && (
        <>
          <div className="filtro-fechas">
            <label>
              Desde:
              <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
            </label>
            <label>
              Hasta:
              <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
            </label>
            {(fechaDesde || fechaHasta) && (
              <button onClick={() => { setFechaDesde(''); setFechaHasta('') }}>
                Limpiar filtro
              </button>
            )}
          </div>

          <p className="contador">
            Mostrando {filteredSessions.length} de {sessions.length} sesiones
          </p>

          {filteredSessions.length === 0 ? (
            <p className="status">No hay sesiones en el rango seleccionado.</p>
          ) : (
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
                  {filteredSessions.map(s => {
                    const fecha = s.fecha_hora ? new Date(s.fecha_hora) : null
                    const fechaStr = fecha
                      ? fecha.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
                      : '—'
                    const horaStr = fecha
                      ? fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
                      : '—'
                    return (
                      <tr key={s.id}>
                        <td>{s.id}</td>
                        <td>{s.paciente_nombre ?? '—'}</td>
                        <td>{fechaStr}</td>
                        <td>{horaStr}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default Sesiones
