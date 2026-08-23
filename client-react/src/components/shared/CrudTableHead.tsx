import { type ColumnConfig } from './useSortFilter'

interface Props<T> {
  columns: ColumnConfig<T>[]
  filtros: { [K in keyof T]: string }
  onFiltroChange: (key: keyof T, value: string) => void
  sortKey: keyof T
  sortDir: 'asc' | 'desc'
  onSort: (key: keyof T) => void
}

function CrudTableHead<T>({ columns, filtros, onFiltroChange, sortKey, sortDir, onSort }: Props<T>) {
  return (
    <thead>
      <tr>
        {columns.map(col => (
          <th key={`f-${String(col.key)}`}>
            <input
              type="text"
              className="filtro-input"
              placeholder={col.label}
              value={filtros[col.key] ?? ''}
              onChange={e => onFiltroChange(col.key, e.target.value)}
            />
          </th>
        ))}
        <th></th>
      </tr>
      <tr>
        {columns.map(col => (
          <th
            key={String(col.key)}
            className="sortable"
            onClick={() => onSort(col.key)}
          >
            {col.label}
            {sortKey === col.key && (
              <span className="sort-arrow">{sortDir === 'desc' ? ' ▼' : ' ▲'}</span>
            )}
          </th>
        ))}
        <th>Acciones</th>
      </tr>
    </thead>
  )
}

export default CrudTableHead
