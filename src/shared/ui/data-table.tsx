import { ArrowDown, ArrowDownUp, ArrowUp } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'

export interface DataColumn<T> {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  sortValue?: (row: T) => string | number | null | undefined
  className?: string
}

interface DataTableProps<T> {
  columns: DataColumn<T>[]
  data: T[]
  getRowKey: (row: T) => string
}

export function DataTable<T>({ columns, data, getRowKey }: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const sortedData = useMemo(() => {
    if (!sort) {
      return data
    }

    const column = columns.find((item) => item.key === sort.key)

    if (!column?.sortValue) {
      return data
    }

    return [...data].sort((firstRow, secondRow) => {
      const first = column.sortValue?.(firstRow) ?? ''
      const second = column.sortValue?.(secondRow) ?? ''
      const comparison =
        typeof first === 'number' && typeof second === 'number'
          ? first - second
          : String(first).localeCompare(String(second), undefined, { numeric: true, sensitivity: 'base' })

      return sort.direction === 'asc' ? comparison : -comparison
    })
  }, [columns, data, sort])

  function toggleSort(column: DataColumn<T>) {
    if (!column.sortValue) {
      return
    }

    setSort((current) => {
      if (current?.key !== column.key) {
        return { key: column.key, direction: 'asc' }
      }

      if (current.direction === 'asc') {
        return { key: column.key, direction: 'desc' }
      }

      return null
    })
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th className={column.className} key={column.key} scope="col">
                {column.sortValue ? (
                  <button className="sort-button" type="button" onClick={() => toggleSort(column)}>
                    {column.header}
                    {sort?.key === column.key ? (
                      sort.direction === 'asc' ? (
                        <ArrowUp size={13} aria-hidden="true" />
                      ) : (
                        <ArrowDown size={13} aria-hidden="true" />
                      )
                    ) : (
                      <ArrowDownUp size={13} aria-hidden="true" />
                    )}
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row) => (
            <tr key={getRowKey(row)}>
              {columns.map((column) => (
                <td className={column.className} key={column.key}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
