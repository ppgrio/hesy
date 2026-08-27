import { useState, useEffect } from 'react'
import { formatFechaCompleta } from '../shared/utils'
import { useMensaje } from '../shared/hooks'
import MensajeToast from '../shared/MensajeToast'
import ModalMedicamentos from '../shared/ModalMedicamentos'
import '../shared/crud.css'

interface SesionPago {
  id: number
  paciente_nombre: string | null
  paciente_no_expediente: number | null
  filtro: string | null
  precio: number | null
  fecha_hora: string | null
  medicamentos: { nombre: string | null; cantidad: number; precio: number | null }[]
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

function Pagos() {
  const [sesiones, setSesiones] = useState<SesionPago[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hoy = useState(hoyLocal)[0]
  const { mensaje, mostrarMensaje } = useMensaje(3000)

  const [sessionSeleccionada, setSessionSeleccionada] = useState<SesionPago | null>(null)
  const [medicamentos, setMedicamentos] = useState<MedicamentoUso[]>([])
  const [inventarioItems, setInventarioItems] = useState<InventarioItem[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [cargando, setCargando] = useState(false)

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

  function abrirModalMedicamentos(s: SesionPago) {
    setSessionSeleccionada(s)
    setMedicamentos([])
    setBusqueda('')
    setCantidad(1)
    setCargando(true)
    Promise.all([
      fetch(`/api/session/${s.id}/medicamentos`).then(r => r.json()),
      fetch('/api/inventario').then(r => r.json()),
    ])
      .then(([medicamentosData, inventario]) => {
        setMedicamentos(medicamentosData)
        setInventarioItems(inventario)
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
    setInventarioItems([])
    setBusqueda('')
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
        setMedicamentos(prev => [...prev, nuevoUso])
        setInventarioItems(prev => prev.map(i =>
          i.id === item.id ? { ...i, cantidad: i.cantidad - cantidad } : i
        ))
        setBusqueda('')
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
        setInventarioItems(prev => prev.map(i =>
          i.id === uso.inventario_id ? { ...i, cantidad: i.cantidad + uso.cantidad_usada } : i
        ))
        mostrarMensaje('exito', `${uso.nombre} quitado de la sesión`)
      })
      .catch(err => mostrarMensaje('error', err.message))
  }

  return (
    <section id="patients-page">
      <div className="inventario-header">
        <h1>Pagos</h1>
      </div>
      <p>{formatFechaCompleta(new Date())} — {sesiones.length} sesiones</p>

      <MensajeToast mensaje={mensaje} />

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
                <th>Costo</th>
              </tr>
            </thead>
            <tbody>
              {sesiones.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px 0' }}>
                    Sin sesiones hoy.
                  </td>
                </tr>
              ) : (
                sesiones.map(s => (
                  <tr key={s.id} onClick={() => abrirModalMedicamentos(s)} style={{ cursor: 'pointer' }}>
                    <td>{fmtHora(s.fecha_hora)}</td>
                    <td>{s.paciente_no_expediente ?? '—'}</td>
                    <td>{s.paciente_nombre ?? '—'}</td>
                    <td>{s.filtro ?? '—'}</td>
                    <td>{s.precio != null ? `$${s.precio.toFixed(2)}` : '—'}</td>
                    <td>{fmtMedicamentos(s.medicamentos ?? [])}</td>
                    <td><b>${costoSesion(s).toFixed(2)}</b></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <ModalMedicamentos
        session={sessionSeleccionada}
        medicamentos={medicamentos}
        inventarioItems={inventarioItems}
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        cantidad={cantidad}
        onCantidadChange={setCantidad}
        cargando={cargando}
        onClose={cerrarModalMedicamentos}
        onAgregarMedicamento={agregarMedicamento}
        onQuitarMedicamento={quitarMedicamento}
        precioBase={sessionSeleccionada?.precio ?? null}
      />
    </section>
  )
}

export default Pagos
