import { useState, useMemo, useCallback } from 'react'
import { matchFilter } from './utils'

interface ColumnConfig<T> {
  key: keyof T
  label: string
}

type FiltrosState<T> = { [K in keyof T]: string }

interface UseSortFilterReturn<T> {
  sortKey: keyof T
  sortDir: 'asc' | 'desc'
  filtros: FiltrosState<T>
  setFiltro: (key: keyof T, value: string) => void
  handleSort: (key: keyof T) => void
  filtered: T[]
  sorted: T[]
}

function initFiltros<T>(columns: ColumnConfig<T>[]): FiltrosState<T> {
  const f = {} as FiltrosState<T>
  for (const col of columns) {
    f[col.key] = '' as string
  }
  return f
}

function useSortFilter<T>(
  items: T[],
  columns: ColumnConfig<T>[],
  defaultSortKey: keyof T,
  defaultSortDir: 'asc' | 'desc' = 'asc',
): UseSortFilterReturn<T> {
  const [sortKey, setSortKey] = useState<keyof T>(defaultSortKey)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSortDir)
  const [filtros, setFiltros] = useState<FiltrosState<T>>(() => initFiltros(columns))

  const setFiltro = useCallback((key: keyof T, value: string) => {
    setFiltros(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSort = useCallback((key: keyof T) => {
    if (key === sortKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }, [sortKey])

  const filtered = useMemo(() => {
    return items.filter(item => {
      for (const col of columns) {
        const q = filtros[col.key].toLowerCase().trim()
        if (q && !matchFilter(item[col.key], q)) return false
      }
      return true
    })
  }, [items, filtros, columns])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const va = a[sortKey]
      const vb = b[sortKey]
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filtered, sortKey, sortDir])

  return { sortKey, sortDir, filtros, setFiltro, handleSort, filtered, sorted }
}

export default useSortFilter
export type { ColumnConfig }
