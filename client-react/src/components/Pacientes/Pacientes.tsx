import { useState, useEffect } from 'react'
import { useMensaje } from '../shared/hooks'
import MensajeToast from '../shared/MensajeToast'
import CrudModal from '../shared/CrudModal'
import CrudTableHead from '../shared/CrudTableHead'
import useSortFilter from '../shared/useSortFilter'
import type { ColumnConfig } from '../shared/useSortFilter'
import { validarEnteros, validarFlotante } from '../shared/utils'
import Paginacion from '../shared/Paginacion'
import PacienteRow from './PacienteRow'
import '../shared/crud.css'

interface Doctor {
  id: number
  nombre: string
}

interface Acceso {
  id: number
  tipo: string
}

interface Filtro {
  id: number
  estado: string
}

interface PacienteItem {
  id: number
  no_expediente: number | null
  nombre: string
  fecha_nacimiento: string | null
  hierros: number | null
  eritropoyetina: number | null
  usos_restantes: number | null
  credito: number | null
  observaciones: string | null
  fecha_inicio_filtro: string | null
  fecha_fin_filtro: string | null
  doctor_id: number | null
  doctor: string | null
  acceso_id: number | null
  acceso: string | null
  filtro_id: number | null
  filtro: string | null
}

const columns: ColumnConfig<PacienteItem>[] = [
  { key: 'no_expediente', label: 'No. Expediente' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'fecha_nacimiento', label: 'Fecha Nac.' },
  { key: 'hierros', label: 'Hierros' },
  { key: 'eritropoyetina', label: 'Eritropoyetina' },
  { key: 'usos_restantes', label: 'Usos Rest.' },
  { key: 'credito', label: 'Crédito' },
  { key: 'doctor', label: 'Doctor' },
  { key: 'acceso', label: 'Acceso' },
  { key: 'filtro', label: 'Filtro' },
  { key: 'fecha_inicio_filtro', label: 'Inicio Filtro' },
  { key: 'fecha_fin_filtro', label: 'Fin Filtro' },
  { key: 'observaciones', label: 'Observaciones' },
]

function Pacientes() {
  const [pacientes, setPacientes] = useState<PacienteItem[]>([])
  const [doctores, setDoctores] = useState<Doctor[]>([])
  const [accesos, setAccesos] = useState<Acceso[]>([])
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { mensaje, mostrarMensaje } = useMensaje(4000)
  const [modalOpen, setModalOpen] = useState(false)

  const { sortKey, sortDir, filtros: filtrosState, setFiltro, handleSort } = useSortFilter(
    pacientes, columns, 'no_expediente', 'desc'
  )

  const [nuevoExpediente, setNuevoExpediente] = useState('')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoFechaNacimiento, setNuevoFechaNacimiento] = useState('')
  const [nuevoHierros, setNuevoHierros] = useState('')
  const [nuevoEritropoyetina, setNuevoEritropoyetina] = useState('')
  const [nuevoUsosRestantes, setNuevoUsosRestantes] = useState('')
  const [nuevoCredito, setNuevoCredito] = useState('')
  const [nuevoDoctorId, setNuevoDoctorId] = useState('')
  const [nuevoAccesoId, setNuevoAccesoId] = useState('')
  const [nuevoFiltroId, setNuevoFiltroId] = useState('')
  const [nuevoFechaInicioFiltro, setNuevoFechaInicioFiltro] = useState('')
  const [nuevoFechaFinFiltro, setNuevoFechaFinFiltro] = useState('')
  const [nuevoObservaciones, setNuevoObservaciones] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/doctor'),
      fetch('/api/accesos'),
      fetch('/api/filtros'),
    ])
      .then(async ([resDoc, resAcc, resFil]) => {
        if (!resDoc.ok) throw new Error('Error al obtener doctores')
        if (!resAcc.ok) throw new Error('Error al obtener accesos')
        if (!resFil.ok) throw new Error('Error al obtener filtros')
        setDoctores(await resDoc.json())
        setAccesos(await resAcc.json())
        setFiltros(await resFil.json())
      })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  useEffect(() => {
    const params = new URLSearchParams({
      page: String(page), page_size: '100', sort: String(sortKey), dir: sortDir,
    })
    for (const [k, v] of Object.entries(filtrosState)) if (v) params.set(k, v)
    fetch(`/api/patient?${params}`)
      .then(async res => {
        if (!res.ok) throw new Error('Error al obtener pacientes')
        const data = await res.json()
        setPacientes(data.items)
        setTotalPages(data.total_pages)
        setError(null)
        setLoading(false)
      })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [page, sortKey, sortDir, filtrosState])

  function limpiarForm() {
    setNuevoExpediente('')
    setNuevoNombre('')
    setNuevoFechaNacimiento('')
    setNuevoHierros('')
    setNuevoEritropoyetina('')
    setNuevoUsosRestantes('')
    setNuevoCredito('')
    setNuevoDoctorId('')
    setNuevoAccesoId('')
    setNuevoFiltroId('')
    setNuevoFechaInicioFiltro('')
    setNuevoFechaFinFiltro('')
    setNuevoObservaciones('')
  }

  function handleAdd() {
    const nombre = nuevoNombre.trim()
    if (!nombre) {
      mostrarMensaje('error', 'El nombre es obligatorio')
      return
    }
    if (nombre.length > 60) {
      mostrarMensaje('error', 'El nombre no puede exceder 60 caracteres')
      return
    }

    if (!validarEnteros([
      ['Hierros', nuevoHierros],
      ['Eritropoyetina', nuevoEritropoyetina],
      ['Usos restantes', nuevoUsosRestantes],
    ], mostrarMensaje, true)) return
    if (!validarEnteros([['No. expediente', nuevoExpediente]], mostrarMensaje)) return
    if (!validarFlotante([['Crédito', nuevoCredito]], mostrarMensaje, true)) return

    const body: Record<string, unknown> = { nombre }
    if (nuevoExpediente.trim()) body.no_expediente = parseInt(nuevoExpediente, 10)
    if (nuevoFechaNacimiento) body.fecha_nacimiento = nuevoFechaNacimiento
    if (nuevoHierros.trim()) body.hierros = parseInt(nuevoHierros, 10)
    if (nuevoEritropoyetina.trim()) body.eritropoyetina = parseInt(nuevoEritropoyetina, 10)
    if (nuevoUsosRestantes.trim()) body.usos_restantes = parseInt(nuevoUsosRestantes, 10)
    body.credito = parseFloat(nuevoCredito)
    if (nuevoDoctorId) body.doctor_id = parseInt(nuevoDoctorId, 10)
    if (nuevoAccesoId) body.acceso_id = parseInt(nuevoAccesoId, 10)
    if (nuevoFiltroId) body.filtro_id = parseInt(nuevoFiltroId, 10)
    if (nuevoFechaInicioFiltro) body.fecha_inicio_filtro = nuevoFechaInicioFiltro
    if (nuevoFechaFinFiltro) body.fecha_fin_filtro = nuevoFechaFinFiltro
    if (nuevoObservaciones.trim()) body.observaciones = nuevoObservaciones.trim()

    fetch('/api/patient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Error al agregar paciente')
        }
        return res.json()
      })
      .then(paciente => {
        setPacientes(prev => [...prev, paciente])
        setPage(1)
        limpiarForm()
        setModalOpen(false)
        mostrarMensaje('exito', `Paciente "${paciente.nombre}" agregado`)
      })
      .catch(err => mostrarMensaje('error', err.message))
  }

  function handleUpdated(paciente: PacienteItem) {
    setPacientes(prev => prev.map(p => (p.id === paciente.id ? paciente : p)))
  }

  function handleDeleted(id: number) {
    setPacientes(prev => {
      const next = prev.filter(p => p.id !== id)
      if (next.length === 0 && page > 1) setPage(page - 1)
      return next
    })
  }

  return (
    <section id="patients-page">
      <div className="inventario-header">
        <h1>Pacientes</h1>
        <div className="inventario-nav">
          {!loading && !error && totalPages > 1 && (
            <Paginacion page={page} totalPages={totalPages} onChange={setPage} />
          )}
          <button className="btn-agregar" onClick={() => setModalOpen(true)}>+ Agregar Paciente</button>
        </div>
      </div>

      <MensajeToast mensaje={mensaje} />

      <CrudModal open={modalOpen} onClose={() => setModalOpen(false)} titulo="Agregar Paciente" ancho>
        <input
          type="text"
          inputMode="numeric"
          placeholder="No. Expediente"
          value={nuevoExpediente}
          onChange={e => setNuevoExpediente(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
        />
        <input
          type="text"
          placeholder="Nombre"
          value={nuevoNombre}
          onChange={e => setNuevoNombre(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
        />
        <input
          type="date"
          placeholder="Fecha de Nacimiento"
          value={nuevoFechaNacimiento}
          onChange={e => setNuevoFechaNacimiento(e.target.value)}
        />
        <input
          type="text"
          inputMode="numeric"
          placeholder="Hierros"
          value={nuevoHierros}
          onChange={e => setNuevoHierros(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
        />
        <input
          type="text"
          inputMode="numeric"
          placeholder="Eritropoyetina"
          value={nuevoEritropoyetina}
          onChange={e => setNuevoEritropoyetina(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
        />
        <input
          type="text"
          inputMode="numeric"
          placeholder="Usos restantes"
          value={nuevoUsosRestantes}
          onChange={e => setNuevoUsosRestantes(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
        />
        <input
          type="text"
          inputMode="decimal"
          placeholder="Crédito"
          value={nuevoCredito}
          onChange={e => setNuevoCredito(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
        />
        <select
          value={nuevoDoctorId}
          onChange={e => setNuevoDoctorId(e.target.value)}
        >
          <option value="">Sin doctor</option>
          {doctores.map(d => (
            <option key={d.id} value={d.id}>{d.nombre}</option>
          ))}
        </select>
        <select
          value={nuevoAccesoId}
          onChange={e => setNuevoAccesoId(e.target.value)}
        >
          <option value="">Sin acceso</option>
          {accesos.map(a => (
            <option key={a.id} value={a.id}>{a.tipo}</option>
          ))}
        </select>
        <select
          value={nuevoFiltroId}
          onChange={e => setNuevoFiltroId(e.target.value)}
        >
          <option value="">Sin filtro</option>
          {filtros.map(f => (
            <option key={f.id} value={f.id}>{f.estado}</option>
          ))}
        </select>
        <input
          type="date"
          placeholder="Inicio Filtro"
          value={nuevoFechaInicioFiltro}
          onChange={e => setNuevoFechaInicioFiltro(e.target.value)}
        />
        <input
          type="date"
          placeholder="Fin Filtro"
          value={nuevoFechaFinFiltro}
          onChange={e => setNuevoFechaFinFiltro(e.target.value)}
        />
        <input
          type="text"
          placeholder="Observaciones"
          value={nuevoObservaciones}
          onChange={e => setNuevoObservaciones(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
        />
        <button onClick={handleAdd}>Agregar</button>
      </CrudModal>

      {loading && <p className="status">Cargando pacientes...</p>}
      {error && <p className="status error">{error}</p>}
      {!loading && !error && (
        <div className="table-wrapper">
          <table>
            <CrudTableHead
              columns={columns}
              filtros={filtrosState}
              onFiltroChange={(k, v) => { setFiltro(k, v); setPage(1) }}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={k => { handleSort(k); setPage(1) }}
            />
            <tbody>
              {pacientes.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '24px 0' }}>
                    Sin resultados.
                  </td>
                </tr>
              ) : (
                pacientes.map(p => (
                  <PacienteRow
                    key={p.id}
                    paciente={p}
                    doctores={doctores}
                    accesos={accesos}
                    filtros={filtros}
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

      {!loading && !error && totalPages > 1 && (
        <Paginacion page={page} totalPages={totalPages} onChange={setPage} />
      )}
    </section>
  )
}
export default Pacientes
