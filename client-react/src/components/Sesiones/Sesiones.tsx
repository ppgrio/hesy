import { useState, useEffect, useMemo } from 'react'
import { getMonday, formatFechaCompleta } from '../shared/utils'
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
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [sortKey, setSortKey] = useState<ColumnKey>('fecha')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const lunes = useMemo(() => {
    const m = getMonday(new Date())
    m.setDate(m.getDate() + semanaOffset * 7)
    return m
  }, [semanaOffset])

  const domingo = useMemo(() => {
    const d = new Date(lunes)
    d.setDate(lunes.getDate() + 6)
    return d
  }, [lunes])

  useEffect(() => {
    setLoading(true)
    setError(null)
    const desde = lunes.toISOString().split('T')[0]
    const hasta = domingo.toISOString().split('T')[0]
    fetch(`/api/session?desde=${desde}&hasta=${hasta}`)
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
  }, [lunes, domingo])

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

  function handleSort(key: ColumnKey) {
    if (key === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function irSemanaAnterior() { setSemanaOffset(o => o - 1) }
  function irSemanaSiguiente() { setSemanaOffset(o => o + 1) }
  function irHoy() { setSemanaOffset(0) }

  return (
    <section id="patients-page">
      <h1>Sesiones</h1>

      {loading && <p className="status">Cargando sesiones...</p>}
      {error && <p className="status error">{error}</p>}

      {!loading && !error && (
        <>
          <div className="semana-nav">
            <button onClick={irSemanaAnterior}>← Semana anterior</button>
            <span className="semana-rango">
              Semana del {formatFechaCompleta(lunes)} al {formatFechaCompleta(domingo)}
            </span>
            <button onClick={irSemanaSiguiente}>Semana siguiente →</button>
            {semanaOffset !== 0 && <button onClick={irHoy}>Hoy</button>}
          </div>

          <p className="contador">
            {sessions.length === 0
              ? 'No hay sesiones en esta semana'
              : `${sessions.length} sesión(es) en esta semana`
            }
          </p>

          {sessions.length > 0 && (
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
                  {sorted.map(s => {
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
