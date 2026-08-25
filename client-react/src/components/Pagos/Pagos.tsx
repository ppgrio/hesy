import { useState, useEffect } from 'react'
import { formatFechaCompleta } from '../shared/utils'

interface SesionPago {
  id: number
  paciente_nombre: string | null
  paciente_no_expediente: number | null
  filtro: string | null
  precio: number | null
  fecha_hora: string | null
  medicamentos: { nombre: string | null; cantidad: number }[]
}

function fmtMedicamentos(meds: { nombre: string | null; cantidad: number }[]): string {
  if (meds.length === 0) return '—'
  return meds.map(m => `${m.nombre ?? '—'} x${m.cantidad}`).join(', ')
}

function hoyLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtHora(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function Pagos() {
  const [sesiones, setSesiones] = useState<SesionPago[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hoy = useState(hoyLocal)[0]

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/session?desde=${hoy}&hasta=${hoy}`)
      .then(async res => {
        if (!res.ok) throw new Error('Error al obtener sesiones')
        return res.json()
      })
      .then((data: SesionPago[]) => {
        setSesiones(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [hoy])

  return (
    <section id="patients-page">
      <div className="inventario-header">
        <h1>Pagos</h1>
      </div>
      <p>{formatFechaCompleta(new Date())} — {sesiones.length} sesiones</p>

      {loading && <p className="status">Cargando sesiones de hoy...</p>}
      {error && <p className="status error">{error}</p>}

      {!loading && !error && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Hora</th>
                <th>No. Expediente</th>
                <th>Paciente</th>
                <th>Filtro</th>
                <th>Precio</th>
                <th>Medicamentos</th>
              </tr>
            </thead>
            <tbody>
              {sesiones.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px 0' }}>
                    Sin sesiones hoy.
                  </td>
                </tr>
              ) : (
                sesiones.map(s => (
                  <tr key={s.id}>
                    <td>{fmtHora(s.fecha_hora)}</td>
                    <td>{s.paciente_no_expediente ?? '—'}</td>
                    <td>{s.paciente_nombre ?? '—'}</td>
                    <td>{s.filtro ?? '—'}</td>
                    <td>{s.precio != null ? `$${s.precio.toFixed(2)}` : '—'}</td>
                    <td>{fmtMedicamentos(s.medicamentos ?? [])}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default Pagos
