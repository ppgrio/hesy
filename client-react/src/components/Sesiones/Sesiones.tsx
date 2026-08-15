import { useState, useEffect, useMemo } from 'react'
import { useMensaje } from '../shared/hooks'
import MensajeToast from '../shared/MensajeToast'
import CrudModal from '../shared/CrudModal'
import CrudTableHead from '../shared/CrudTableHead'
import useSortFilter from '../shared/useSortFilter'
import type { ColumnConfig } from '../shared/useSortFilter'
import SesionRow from './SesionRow'
import { getMonday, formatFechaCompleta } from '../shared/utils'
import '../shared/crud.css'
import './Sesiones.css'

interface Paciente {
  no_expediente: number
  nombre: string
  usos_restantes: number | null
}

interface Filtro {
  id: number
  estado: string
}

interface Acceso {
  id: number
  tipo: string
}

interface SesionItemData {
  id: number
  paciente_id: number
  paciente_nombre: string | null
  acceso: string | null
  filtro: string | null
  fecha_hora: string | null
}

interface SesionItem extends SesionItemData {
  fecha: string
  hora: string
}

const columns: ColumnConfig<SesionItem>[] = [
  { key: 'id', label: 'ID' },
  { key: 'paciente_nombre', label: 'Paciente' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'hora', label: 'Hora' },
  { key: 'filtro', label: 'Filtro' },
  { key: 'acceso', label: 'Acceso' },
]

function fmtFecha(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtHora(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function enrich(data: SesionItemData[]): SesionItem[] {
  return data.map(s => ({ ...s, fecha: fmtFecha(s.fecha_hora), hora: fmtHora(s.fecha_hora) }))
}

function Sesiones() {
  const [sessions, setSessions] = useState<SesionItem[]>([])
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [accesos, setAccesos] = useState<Acceso[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [semanaOffset, setSemanaOffset] = useState(0)
  const { mensaje, mostrarMensaje } = useMensaje(4000)
  const [modalOpen, setModalOpen] = useState(false)

  const [nuevoPacienteId, setNuevoPacienteId] = useState('')
  const [nuevoFechaHora, setNuevoFechaHora] = useState('')
  const [nuevoFiltro, setNuevoFiltro] = useState('')
  const [nuevoAcceso, setNuevoAcceso] = useState('')

  const { sortKey, sortDir, filtros: filtrosState, setFiltro, handleSort, sorted } = useSortFilter(
    sessions, columns, 'fecha', 'desc'
  )

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

    Promise.all([
      fetch(`/api/session?desde=${desde}&hasta=${hasta}`),
      fetch('/api/patient'),
      fetch('/api/filtros'),
      fetch('/api/accesos'),
    ])
      .then(async ([resSes, resPac, resFil, resAcc]) => {
        if (!resSes.ok) throw new Error('Error al obtener sesiones')
        if (!resPac.ok) throw new Error('Error al obtener pacientes')
        if (!resFil.ok) throw new Error('Error al obtener filtros')
        if (!resAcc.ok) throw new Error('Error al obtener accesos')
        const sesData: SesionItemData[] = await resSes.json()
        const pacData = await resPac.json()
        const filData = await resFil.json()
        const accData = await resAcc.json()
        setSessions(enrich(sesData))
        setPacientes(pacData)
        setFiltros(filData)
        setAccesos(accData)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [lunes, domingo])

  function handleAdd() {
    const paciente_id = nuevoPacienteId.trim()
    if (!paciente_id) {
      mostrarMensaje('error', 'Debe seleccionar un paciente')
      return
    }
    if (!nuevoFechaHora) {
      mostrarMensaje('error', 'Debe seleccionar fecha y hora')
      return
    }

    const body: Record<string, unknown> = {
      paciente_id: parseInt(paciente_id, 10),
      fecha_hora: nuevoFechaHora,
    }
    if (nuevoFiltro) body.filtro = nuevoFiltro
    if (nuevoAcceso) body.acceso = nuevoAcceso

    fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Error al crear sesión')
        }
        return res.json()
      })
      .then((sesion: SesionItemData) => {
        setSessions(prev => [...prev, ...enrich([sesion])])
        setNuevoPacienteId('')
        setNuevoFechaHora('')
        setNuevoFiltro('')
        setNuevoAcceso('')
        setModalOpen(false)
        mostrarMensaje('exito', `Sesión #${sesion.id} creada`)
      })
      .catch(err => mostrarMensaje('error', err.message))
  }

  function handleUpdated(sesion: SesionItemData) {
    const enriched = enrich([sesion])[0]
    setSessions(prev => prev.map(s => (s.id === enriched.id ? enriched : s)))
  }

  function handleDeleted(id: number) {
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  function irSemanaAnterior() { setSemanaOffset(o => o - 1) }
  function irSemanaSiguiente() { setSemanaOffset(o => o + 1) }
  function irHoy() { setSemanaOffset(0) }

  return (
    <section id="patients-page">
      <div className="inventario-header">
        <h1>Sesiones</h1>
        <button className="btn-agregar" onClick={() => setModalOpen(true)}>+ Agregar Sesión</button>
      </div>

      <MensajeToast mensaje={mensaje} />

      <CrudModal open={modalOpen} onClose={() => setModalOpen(false)} titulo="Agregar Sesión">
        <select
          value={nuevoPacienteId}
          onChange={e => setNuevoPacienteId(e.target.value)}
        >
          <option value="">Seleccionar paciente</option>
          {pacientes.map(p => (
            <option key={p.no_expediente} value={p.no_expediente}>
              {p.nombre} ({p.usos_restantes != null ? p.usos_restantes : '—'} usos)
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={nuevoFechaHora}
          onChange={e => setNuevoFechaHora(e.target.value)}
        />
        <select
          value={nuevoFiltro}
          onChange={e => setNuevoFiltro(e.target.value)}
        >
          <option value="">Sin filtro</option>
          {filtros.map(f => (
            <option key={f.id} value={f.estado}>{f.estado}</option>
          ))}
        </select>
        <select
          value={nuevoAcceso}
          onChange={e => setNuevoAcceso(e.target.value)}
        >
          <option value="">Sin acceso</option>
          {accesos.map(a => (
            <option key={a.id} value={a.tipo}>{a.tipo}</option>
          ))}
        </select>
        <button onClick={handleAdd}>Agregar</button>
      </CrudModal>

      <div className="semana-nav">
        <button onClick={irSemanaAnterior}>← Semana anterior</button>
        <span className="semana-rango">
          Semana del {formatFechaCompleta(lunes)} al {formatFechaCompleta(domingo)}
        </span>
        <button onClick={irSemanaSiguiente}>Semana siguiente →</button>
        {semanaOffset !== 0 && <button onClick={irHoy}>Hoy</button>}
      </div>

      {loading && <p className="status">Cargando sesiones...</p>}
      {error && <p className="status error">{error}</p>}

      {!loading && !error && (
        <>
          <p className="contador">
            {sessions.length === 0
              ? 'No hay sesiones en esta semana'
              : `${sessions.length} sesión(es) en esta semana`}
          </p>

          {sessions.length > 0 && (
            <div className="table-wrapper">
              <table>
                <CrudTableHead
                  columns={columns}
                  filtros={filtrosState}
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
                    sorted.map(s => (
                      <SesionRow
                        key={s.id}
                        sesion={s}
                        pacientes={pacientes}
                        filtros={filtros}
                        accesos={accesos}
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
        </>
      )}
    </section>
  )
}
export default Sesiones
