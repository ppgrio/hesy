import { useState, useEffect } from 'react'
import { useMensaje } from '../shared/hooks'
import MensajeToast from '../shared/MensajeToast'
import CrudModal from '../shared/CrudModal'
import CrudTableHead from '../shared/CrudTableHead'
import useSortFilter from '../shared/useSortFilter'
import type { ColumnConfig } from '../shared/useSortFilter'
import InventarioRow from './InventarioRow'
import '../shared/crud.css'

interface Area {
  id: number
  nombre: string
}

interface InventarioItem {
  id: number
  codigo: number | null
  nombre: string
  cantidad: number
  caducidad: string | null
  area_id: number | null
  area: string | null
}

const columns: ColumnConfig<InventarioItem>[] = [
  { key: 'codigo', label: 'Código' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'cantidad', label: 'Cantidad' },
  { key: 'caducidad', label: 'Caducidad' },
  { key: 'area', label: 'Área' },
]

function Inventario() {
  const [items, setItems] = useState<InventarioItem[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nuevoCodigo, setNuevoCodigo] = useState('')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevaCantidad, setNuevaCantidad] = useState('')
  const [nuevaCaducidad, setNuevaCaducidad] = useState('')
  const [nuevaAreaId, setNuevaAreaId] = useState('')
  const { mensaje, mostrarMensaje } = useMensaje(4000)
  const [modalOpen, setModalOpen] = useState(false)

  const { sortKey, sortDir, filtros, setFiltro, handleSort, sorted } = useSortFilter(
    items, columns, 'codigo', 'asc'
  )

  useEffect(() => {
    Promise.all([
      fetch('/api/inventario'),
      fetch('/api/areas'),
    ])
      .then(async ([resItems, resAreas]) => {
        if (!resItems.ok) throw new Error('Error al obtener inventario')
        if (!resAreas.ok) throw new Error('Error al obtener áreas')
        const data = await resItems.json()
        const areasData = await resAreas.json()
        setItems(data)
        setAreas(areasData)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  function limpiarForm() {
    setNuevoCodigo('')
    setNuevoNombre('')
    setNuevaCantidad('')
    setNuevaCaducidad('')
    setNuevaAreaId('')
  }

  function handleAdd() {
    const nombre = nuevoNombre.trim()
    if (!nombre) {
      mostrarMensaje('error', 'El nombre es obligatorio')
      return
    }
    if (nombre.length > 30) {
      mostrarMensaje('error', 'El nombre no puede exceder 30 caracteres')
      return
    }
    const cantidad = parseInt(nuevaCantidad, 10)
    if (isNaN(cantidad)) {
      mostrarMensaje('error', 'La cantidad debe ser un número')
      return
    }
    if (cantidad < 0) {
      mostrarMensaje('error', 'La cantidad no puede ser negativa')
      return
    }

    const body: Record<string, unknown> = { nombre, cantidad }
    if (nuevoCodigo.trim()) body.codigo = parseInt(nuevoCodigo, 10)
    if (nuevaCaducidad) body.caducidad = nuevaCaducidad
    if (nuevaAreaId) body.area_id = parseInt(nuevaAreaId, 10)

    fetch('/api/inventario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Error al agregar item')
        }
        return res.json()
      })
      .then(item => {
        setItems(prev => [...prev, item])
        limpiarForm()
        setModalOpen(false)
        mostrarMensaje('exito', `Item "${item.nombre}" agregado`)
      })
      .catch(err => mostrarMensaje('error', err.message))
  }

  function handleUpdated(item: InventarioItem) {
    setItems(prev => prev.map(i => (i.id === item.id ? item : i)))
  }

  function handleDeleted(id: number) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <section id="patients-page">
      <div className="inventario-header">
        <h1>Inventario</h1>
        <button className="btn-agregar" onClick={() => setModalOpen(true)}>+ Agregar Item</button>
      </div>

      <MensajeToast mensaje={mensaje} />

      <CrudModal open={modalOpen} onClose={() => setModalOpen(false)} titulo="Agregar Item">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Código"
          value={nuevoCodigo}
          onChange={e => setNuevoCodigo(e.target.value)}
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
          type="number"
          placeholder="Cantidad"
          value={nuevaCantidad}
          onChange={e => setNuevaCantidad(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
          min="0"
        />
        <input
          type="date"
          value={nuevaCaducidad}
          onChange={e => setNuevaCaducidad(e.target.value)}
        />
        <select
          value={nuevaAreaId}
          onChange={e => setNuevaAreaId(e.target.value)}
        >
          <option value="">Sin área</option>
          {areas.map(a => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </select>
        <button onClick={handleAdd}>Agregar</button>
      </CrudModal>

      {loading && <p className="status">Cargando inventario...</p>}
      {error && <p className="status error">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="status">No hay items en inventario.</p>
      )}

      {!loading && !error && items.length > 0 && (
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
                sorted.map(item => (
                  <InventarioRow
                    key={item.id}
                    item={item}
                    areas={areas}
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
export default Inventario
