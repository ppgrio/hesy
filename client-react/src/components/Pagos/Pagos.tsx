import { useState, useEffect, useCallback } from 'react'
import { formatFechaCompleta } from '../shared/utils'
import { useMensaje } from '../shared/hooks'
import MensajeToast from '../shared/MensajeToast'
import CrudTableHead from '../shared/CrudTableHead'
import useSortFilter from '../shared/useSortFilter'
import type { ColumnConfig } from '../shared/useSortFilter'
import Paginacion from '../shared/Paginacion'
import ModalMedicamentos from '../shared/ModalMedicamentos'
import '../shared/crud.css'
import './Pagos.css'

const PAGE_SIZE = 20

interface SesionPago {
  id: number
  paciente_nombre: string | null
  paciente_no_expediente: number | null
  filtro: string | null
  precio: number | null
  fecha_hora: string | null
  medicamentos: { id: number; nombre: string | null; cantidad: number; precio: number | null }[]
  pagado: boolean
}

interface SesionPagoItem extends SesionPago {
  hora: string
  medicamentos_text: string
  costo: number
  estado: string
}

interface InventarioItem {
  id: number
  nombre: string
  cantidad: number
  precio: number | null
}

interface MedicamentoUso {
  id: number
  inventario_id: number
  nombre: string | null
  cantidad_usada: number
  precio: number | null
  stock_disponible: number
}

const columns: ColumnConfig<SesionPagoItem>[] = [
  { key: 'hora', label: 'Hora' },
  { key: 'paciente_no_expediente', label: 'No. Expediente' },
  { key: 'paciente_nombre', label: 'Paciente' },
  { key: 'filtro', label: 'Filtro' },
  { key: 'precio', label: 'Precio' },
  { key: 'medicamentos_text', label: 'Medicamentos', filterable: false, sortable: false },
  { key: 'costo', label: 'Costo', filterable: false, sortable: false },
  { key: 'estado', label: 'Estado' },
]

function fmtMedicamentos(meds: { nombre: string | null; cantidad: number }[]): string {
  if (meds.length === 0) return '—'
  return meds.map(m => `${m.nombre ?? '—'} x${m.cantidad}`).join(', ')
}

function costoSesion(s: SesionPago): number {
  const base = s.precio ?? 0
  const meds = (s.medicamentos ?? []).reduce(
    (acc, m) => acc + ((m.precio ?? 0) * m.cantidad),
    0
  )
  return base + meds
}

function hoyLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtHora(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function enrich(s: SesionPago): SesionPagoItem {
  return {
    ...s,
    hora: fmtHora(s.fecha_hora),
    medicamentos_text: fmtMedicamentos(s.medicamentos ?? []),
    costo: costoSesion(s),
    estado: s.pagado ? 'Pagado' : 'Pendiente',
  }
}

function Pagos() {
  const [sesiones, setSesiones] = useState<SesionPagoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const hoy = useState(hoyLocal)[0]
  const { mensaje, mostrarMensaje } = useMensaje(3000)

  const [sessionSeleccionada, setSessionSeleccionada] = useState<SesionPagoItem | null>(null)
  const [medicamentos, setMedicamentos] = useState<MedicamentoUso[]>([])
  const [cantidad, setCantidad] = useState(1)
  const [cargando, setCargando] = useState(false)

  const { sortKey, sortDir, filtros: filtrosState, setFiltro, handleSort } = useSortFilter(
    sesiones, columns, 'hora', 'asc'
  )

  const buscarMedicamentos = useCallback((q: string) => {
    if (!q.trim()) return Promise.resolve([] as InventarioItem[])
    const params = new URLSearchParams({ page: '1', page_size: '10', nombre: q })
    return fetch(`/api/inventario?${params}`)
      .then(async res => {
        if (!res.ok) throw new Error('Error al buscar medicamentos')
        return res.json()
      })
      .then(data => data.items as InventarioItem[])
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({
      desde: hoy,
      hasta: hoy,
      page: String(page),
      page_size: String(PAGE_SIZE),
      sort: String(sortKey),
      dir: sortDir,
    })
    for (const [k, v] of Object.entries(filtrosState)) if (v) params.set(k, v)
    fetch(`/api/session?${params}`)
      .then(async res => {
        if (!res.ok) throw new Error('Error al obtener sesiones')
        return res.json()
      })
      .then((data: { items: SesionPago[]; total: number; total_pages: number }) => {
        setSesiones(data.items.map(enrich))
        setTotal(data.total)
        setTotalPages(data.total_pages)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [hoy, page, sortKey, sortDir, filtrosState])

  function abrirModalMedicamentos(s: SesionPagoItem) {
    setSessionSeleccionada(s)
    setMedicamentos([])
    setCantidad(1)
    setCargando(true)
    fetch(`/api/session/${s.id}/medicamentos`)
      .then(async res => {
        if (!res.ok) throw new Error('Error al cargar medicamentos')
        return res.json()
      })
      .then((medicamentosData: MedicamentoUso[]) => {
        setMedicamentos(medicamentosData)
        setCargando(false)
      })
      .catch(() => {
        mostrarMensaje('error', 'Error al cargar medicamentos')
        setCargando(false)
      })
  }

  function cerrarModalMedicamentos() {
    setSessionSeleccionada(null)
    setMedicamentos([])
    setCantidad(1)
  }

  function agregarMedicamento(item: InventarioItem) {
    if (!sessionSeleccionada || cantidad < 1) return
    if (cantidad > item.cantidad) {
      mostrarMensaje('error', `Stock insuficiente de ${item.nombre}. Disponible: ${item.cantidad}`)
      return
    }
    fetch(`/api/session/${sessionSeleccionada.id}/medicamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inventario_id: item.id, cantidad_usada: cantidad }),
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Error al agregar medicamento')
        }
        return res.json()
      })
      .then(nuevoUso => {
        setMedicamentos(prev => {
          const existe = prev.some(m => m.id === nuevoUso.id)
          return existe ? prev.map(m => (m.id === nuevoUso.id ? nuevoUso : m)) : [...prev, nuevoUso]
        })
        const id = sessionSeleccionada.id
        setSesiones(prev => prev.map(ses => {
          if (ses.id !== id) return ses
          const medsActuales = ses.medicamentos ?? []
          const existe = medsActuales.some(m => m.id === nuevoUso.id)
          const medicamentos = existe
            ? medsActuales.map(m =>
                m.id === nuevoUso.id
                  ? { id: nuevoUso.id, nombre: nuevoUso.nombre, cantidad: nuevoUso.cantidad_usada, precio: nuevoUso.precio }
                  : m
              )
            : [
                ...medsActuales,
                { id: nuevoUso.id, nombre: nuevoUso.nombre, cantidad: nuevoUso.cantidad_usada, precio: nuevoUso.precio },
              ]
          return enrich({ ...ses, medicamentos })
        }))
        setCantidad(1)
        mostrarMensaje('exito', `${item.nombre} agregado a la sesión`)
      })
      .catch(err => mostrarMensaje('error', err.message))
  }

  function quitarMedicamento(uso: MedicamentoUso) {
    if (!confirm(`¿Quitar ${uso.nombre} (${uso.cantidad_usada}) de la sesión?`)) return
    fetch(`/api/medicamento-sesion/${uso.id}`, { method: 'DELETE' })
      .then(async res => {
        if (!res.ok) throw new Error('Error al quitar medicamento')
        setMedicamentos(prev => prev.filter(m => m.id !== uso.id))
        const id = sessionSeleccionada?.id
        if (id != null) {
          setSesiones(prev => prev.map(ses => {
            if (ses.id !== id) return ses
            return enrich({
              ...ses,
              medicamentos: (ses.medicamentos ?? []).filter(m => m.id !== uso.id),
            })
          }))
        }
        mostrarMensaje('exito', `${uso.nombre} quitado de la sesión`)
      })
      .catch(err => mostrarMensaje('error', err.message))
  }

  function togglePago(s: SesionPagoItem) {
    const nuevo = !s.pagado
    fetch(`/api/session/${s.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pagado: nuevo }),
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Error al actualizar el estado')
        }
        return res.json()
      })
      .then(updated => {
        setSesiones(prev => prev.map(x => (x.id === updated.id ? enrich({ ...x, pagado: updated.pagado }) : x)))
        mostrarMensaje('exito', `Sesión marcada como ${nuevo ? 'pagada' : 'pendiente'}`)
      })
      .catch(err => mostrarMensaje('error', err.message))
  }

  return (
    <section id="patients-page">
      <div className="inventario-header">
        <h1>Pagos</h1>
        <div className="inventario-nav">
          {!loading && !error && totalPages > 1 && (
            <Paginacion page={page} totalPages={totalPages} onChange={setPage} />
          )}
        </div>
      </div>
      <p>{formatFechaCompleta(new Date())} — {total} sesiones</p>

      <MensajeToast mensaje={mensaje} />

      {loading && <p className="status">Cargando sesiones de hoy...</p>}
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
              ocultarAcciones
            />
            <tbody>
              {sesiones.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: 'center', padding: '24px 0' }}>
                    Sin resultados.
                  </td>
                </tr>
              ) : (
                sesiones.map(s => (
                  <tr key={s.id} onClick={() => abrirModalMedicamentos(s)} style={{ cursor: 'pointer' }}>
                    <td>{s.hora}</td>
                    <td>{s.paciente_no_expediente ?? '—'}</td>
                    <td>{s.paciente_nombre ?? '—'}</td>
                    <td>{s.filtro ?? '—'}</td>
                    <td>{s.precio != null ? `$${s.precio.toFixed(2)}` : '—'}</td>
                    <td>{s.medicamentos_text}</td>
                    <td><b>${s.costo.toFixed(2)}</b></td>
                    <td onClick={e => e.stopPropagation()}>
                      <button
                        className={`estado-badge ${s.pagado ? 'estado-pagado' : 'estado-pendiente'}`}
                        onClick={e => { e.stopPropagation(); togglePago(s) }}
                        title={s.pagado ? 'Marcar como pendiente' : 'Marcar como pagada'}
                      >
                        {s.estado}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <Paginacion page={page} totalPages={totalPages} onChange={setPage} />
      )}

      <ModalMedicamentos
        session={sessionSeleccionada}
        medicamentos={medicamentos}
        cantidad={cantidad}
        onCantidadChange={setCantidad}
        cargando={cargando}
        onClose={cerrarModalMedicamentos}
        onAgregarMedicamento={agregarMedicamento}
        onQuitarMedicamento={quitarMedicamento}
        precioBase={sessionSeleccionada?.precio ?? null}
        buscarMedicamentos={buscarMedicamentos}
      />
    </section>
  )
}

export default Pagos
