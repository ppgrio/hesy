import { type ColumnConfig } from './useSortFilter'

interface Props<T> {
  columns: ColumnConfig<T>[]
  filtros: { [K in keyof T]: string }
  onFiltroChange: (key: keyof T, value: string) => void
  sortKey: keyof T
  sortDir: 'asc' | 'desc'
  onSort: (key: keyof T) => void
  ocultarAcciones?: boolean
}

function CrudTableHead<T>({ columns, filtros, onFiltroChange, sortKey, sortDir, onSort, ocultarAcciones = false }: Props<T>) {
  return (
    <thead>
      <tr>
        {columns.map(col => (
          <th key={`f-${String(col.key)}`}>
            {col.filterable !== false ? (
              <input
                type="text"
                className="filtro-input"
                placeholder={col.label}
                value={filtros[col.key] ?? ''}
                onChange={e => onFiltroChange(col.key, e.target.value)}
              />
            ) : null}
          </th>
        ))}
        {!ocultarAcciones && <th></th>}
      </tr>
      <tr>
        {columns.map(col => (
          <th
            key={String(col.key)}
            className={col.sortable === false ? undefined : 'sortable'}
            onClick={col.sortable === false ? undefined : () => onSort(col.key)}
          >
            {col.label}
            {col.sortable !== false && sortKey === col.key && (
              <span className="sort-arrow">{sortDir === 'desc' ? ' ▼' : ' ▲'}</span>
            )}
          </th>
        ))}
        {!ocultarAcciones && <th>Acciones</th>}
      </tr>
    </thead>
  )
}

export default CrudTableHead
