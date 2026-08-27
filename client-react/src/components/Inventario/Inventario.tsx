import { useState, useEffect } from 'react'
import { useMensaje } from '../shared/hooks'
import MensajeToast from '../shared/MensajeToast'
import CrudModal from '../shared/CrudModal'
import CrudTableHead from '../shared/CrudTableHead'
import useSortFilter from '../shared/useSortFilter'
import type { ColumnConfig } from '../shared/useSortFilter'
import { validarEnteros, validarFlotante } from '../shared/utils'
import Paginacion from '../shared/Paginacion'
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
  precio: number | null
  caducidad: string | null
  area_id: number | null
  area: string | null
}

const columns: ColumnConfig<InventarioItem>[] = [
  { key: 'codigo', label: 'Código' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'cantidad', label: 'Cantidad' },
  { key: 'precio', label: 'Precio' },
  { key: 'caducidad', label: 'Caducidad' },
  { key: 'area', label: 'Área' },
]

function Inventario() {
  const [items, setItems] = useState<InventarioItem[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [nuevoCodigo, setNuevoCodigo] = useState('')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevaCantidad, setNuevaCantidad] = useState('')
  const [nuevoPrecio, setNuevoPrecio] = useState('')
  const [nuevaCaducidad, setNuevaCaducidad] = useState('')
  const [nuevaAreaId, setNuevaAreaId] = useState('')
  const { mensaje, mostrarMensaje } = useMensaje(4000)
  const [modalOpen, setModalOpen] = useState(false)

  const { sortKey, sortDir, filtros, setFiltro, handleSort } = useSortFilter(
    items, columns, 'codigo', 'asc'
  )

  useEffect(() => {
    fetch('/api/areas')
      .then(async res => {
        if (!res.ok) throw new Error('Error al obtener áreas')
        setAreas(await res.json())
      })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  useEffect(() => {
    const params = new URLSearchParams({
      page: String(page), page_size: '100', sort: String(sortKey), dir: sortDir,
    })
    for (const [k, v] of Object.entries(filtros)) if (v) params.set(k, v)
    fetch(`/api/inventario?${params}`)
      .then(async res => {
        if (!res.ok) throw new Error('Error al obtener inventario')
        const data = await res.json()
        setItems(data.items)
        setTotalPages(data.total_pages)
        setError(null)
        setLoading(false)
      })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [page, sortKey, sortDir, filtros])

  function limpiarForm() {
    setNuevoCodigo('')
    setNuevoNombre('')
    setNuevaCantidad('')
    setNuevoPrecio('')
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
    if (!validarEnteros([['Código', nuevoCodigo]], mostrarMensaje)) return
    if (!validarFlotante([['Precio', nuevoPrecio]], mostrarMensaje, true)) return
    if (Number(nuevoPrecio) < 0) {
      mostrarMensaje('error', 'El precio no puede ser negativo')
      return
    }

    const body: Record<string, unknown> = { nombre, cantidad, precio: Number(nuevoPrecio) }
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
        setPage(1)
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
    setItems(prev => {
      const next = prev.filter(i => i.id !== id)
      if (next.length === 0 && page > 1) setPage(page - 1)
      return next
    })
  }

  return (
    <section id="patients-page">
      <div className="inventario-header">
        <h1>Inventario</h1>
        <div className="inventario-nav">
          {!loading && !error && totalPages > 1 && (
            <Paginacion page={page} totalPages={totalPages} onChange={setPage} />
          )}
          <button className="btn-agregar" onClick={() => setModalOpen(true)}>+ Agregar Item</button>
        </div>
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
          type="text"
          inputMode="decimal"
          placeholder="Precio"
          value={nuevoPrecio}
          onChange={e => setNuevoPrecio(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
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
      {!loading && !error && (
        <div className="table-wrapper">
          <table>
            <CrudTableHead
              columns={columns}
              filtros={filtros}
              onFiltroChange={(k, v) => { setFiltro(k, v); setPage(1) }}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={k => { handleSort(k); setPage(1) }}
            />
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '24px 0' }}>
                    Sin resultados.
                  </td>
                </tr>
              ) : (
                items.map(item => (
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

      {!loading && !error && totalPages > 1 && (
        <Paginacion page={page} totalPages={totalPages} onChange={setPage} />
      )}
    </section>
  )
}
export default Inventario
