import { useState, useEffect } from 'react'
import { useMensaje } from '../shared/hooks'
import MensajeToast from '../shared/MensajeToast'
import CrudModal from '../shared/CrudModal'
import CrudTableHead from '../shared/CrudTableHead'
import useSortFilter from '../shared/useSortFilter'
import type { ColumnConfig } from '../shared/useSortFilter'
import SimpleRow from './SimpleRow'
import type { SimpleItem } from './SimpleRow'

interface SectionConfig {
  title: string
  apiUrl: string
  fieldKey: string
  fieldLabel: string
  fieldPlaceholder: string
  entityName: string
  maxLength: number
  defaultSortDir?: 'asc' | 'desc'
}

interface RawItem {
  id: number
  [key: string]: unknown
}

const columns: ColumnConfig<SimpleItem>[] = [
  { key: 'id', label: 'ID' },
  { key: 'value', label: '' },
]

function mapItems(data: RawItem[], fieldKey: string): SimpleItem[] {
  return data.map((item: RawItem) => ({
    id: item.id,
    value: String(item[fieldKey] ?? ''),
  }))
}

function AdminSection({ config }: { config: SectionConfig }) {
  const [items, setItems] = useState<SimpleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nuevoValor, setNuevoValor] = useState('')
  const { mensaje, mostrarMensaje } = useMensaje(4000)
  const [modalOpen, setModalOpen] = useState(false)

  const cols: ColumnConfig<SimpleItem>[] = [
    { key: 'id', label: 'ID' },
    { key: 'value', label: config.fieldLabel },
  ]

  const { sortKey, sortDir, filtros, setFiltro, handleSort, sorted } = useSortFilter(
    items, cols, 'id', config.defaultSortDir ?? 'asc'
  )

  useEffect(() => {
    fetch(config.apiUrl)
      .then(res => {
        if (!res.ok) throw new Error(`Error al obtener ${config.entityName.toLowerCase()}s`)
        return res.json()
      })
      .then((data: RawItem[]) => {
        setItems(mapItems(data, config.fieldKey))
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [config.apiUrl, config.entityName, config.fieldKey])

  function handleAdd() {
    const val = nuevoValor.trim()
    if (!val) {
      mostrarMensaje('error', `El ${config.fieldKey.toLowerCase()} es obligatorio`)
      return
    }
    if (val.length > config.maxLength) {
      mostrarMensaje('error', `No puede exceder ${config.maxLength} caracteres`)
      return
    }
    fetch(config.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [config.fieldKey]: val }),
    })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || `Error al agregar ${config.entityName.toLowerCase()}`)
        }
        return res.json()
      })
      .then((created: RawItem) => {
        const value = String(created[config.fieldKey] ?? '')
        setItems(prev => [...prev, { id: created.id, value }])
        setNuevoValor('')
        setModalOpen(false)
        mostrarMensaje('exito', `${config.entityName} "${value}" agregado`)
      })
      .catch(err => mostrarMensaje('error', err.message))
  }

  function handleUpdated(item: SimpleItem) {
    setItems(prev => prev.map(i => (i.id === item.id ? item : i)))
  }

  function handleDeleted(id: number) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div>
      <div className="inventario-header">
        <h2>{config.title}</h2>
        <button className="btn-agregar" onClick={() => setModalOpen(true)}>
          + Agregar {config.entityName}
        </button>
      </div>

      <MensajeToast mensaje={mensaje} />

      <CrudModal open={modalOpen} onClose={() => setModalOpen(false)} titulo={`Agregar ${config.entityName}`}>
        <input
          type="text"
          placeholder={config.fieldPlaceholder}
          value={nuevoValor}
          onChange={e => setNuevoValor(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
        />
        <button onClick={handleAdd}>Agregar</button>
      </CrudModal>

      {loading && <p className="status">Cargando {config.entityName.toLowerCase()}s...</p>}
      {error && <p className="status error">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="status">No hay {config.entityName.toLowerCase()}s registrados.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="table-wrapper">
          <table>
            <CrudTableHead
              columns={cols}
              filtros={filtros}
              onFiltroChange={setFiltro}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
            />
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={cols.length + 1} style={{ textAlign: 'center', padding: '24px 0' }}>
                    Sin resultados.
                  </td>
                </tr>
              ) : (
                sorted.map(item => (
                  <SimpleRow
                    key={item.id}
                    item={item}
                    apiUrl={config.apiUrl}
                    fieldKey={config.fieldKey}
                    entityName={config.entityName}
                    maxLength={config.maxLength}
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
    </div>
  )
}

export default AdminSection
export type { SectionConfig }
