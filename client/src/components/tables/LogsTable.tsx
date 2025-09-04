import React, { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState
} from '@tanstack/react-table'
import { 
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import dayjs from 'dayjs'
import SearchBar from './SearchBar'

interface Log {
  id: number
  userId: number
  action: string
  detail: string | null
  entite: string | null
  entiteId: number | null
  timestamp: string
  user: {
    nom: string
    prenom: string
    identifiant: string
  }
}

interface LogsTableProps {
  data: Log[]
  loading?: boolean
}

const LogsTable: React.FC<LogsTableProps> = ({
  data,
  loading = false
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'timestamp', desc: true }
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')

  const columns = useMemo<ColumnDef<Log>[]>(
    () => [
      {
        accessorKey: 'timestamp',
        header: 'Date & Heure',
        cell: ({ row }) => (
          <div className="text-sm">
            {dayjs(row.original.timestamp).format('DD/MM/YYYY HH:mm:ss')}
          </div>
        ),
        size: 150
      },
      {
        accessorKey: 'user',
        header: 'Utilisateur',
        cell: ({ row }) => {
          const { user } = row.original
          return (
            <div className="flex items-center space-x-2">
              <UserIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">
                {user.prenom} {user.nom}
              </span>
              <span className="text-xs text-gray-500">
                ({user.identifiant})
              </span>
            </div>
          )
        },
        size: 200
      },
      {
        accessorKey: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {row.original.action}
          </span>
        ),
        size: 120
      },
      {
        accessorKey: 'entite',
        header: 'Entité',
        cell: ({ row }) => row.original.entite ? (
          <span className="text-sm text-gray-900">
            {row.original.entite}
            {row.original.entiteId && (
              <span className="text-xs text-gray-500 ml-1">
                (ID: {row.original.entiteId})
              </span>
            )}
          </span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        ),
        size: 150
      },
      {
        accessorKey: 'detail',
        header: 'Détail',
        cell: ({ row }) => row.original.detail ? (
          <span className="text-sm text-gray-700 truncate max-w-xs block">
            {row.original.detail}
          </span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        ),
        size: 250
      }
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 25
      }
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ClockIcon className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-600">
            {data.length} entrées au total
          </span>
        </div>
        <SearchBar
          globalFilter={globalFilter ?? ''}
          onGlobalFilterChange={(value) => setGlobalFilter(String(value))}
          filteredRowsCount={table.getFilteredRowModel().rows.length}
          placeholder="Rechercher dans les logs..."
        />
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 bg-white">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ width: header.getSize() }}
                  >
                    <div className="flex items-center space-x-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {{
                        asc: <ChevronUpIcon className="w-4 h-4" />,
                        desc: <ChevronDownIcon className="w-4 h-4" />
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-4 py-3 whitespace-nowrap"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="text-sm text-gray-700">
            Page {table.getState().pagination.pageIndex + 1} sur{' '}
            {table.getPageCount()}, {table.getFilteredRowModel().rows.length} résultats
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="flex items-center px-3 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              Précédent
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="flex items-center px-3 py-1 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default LogsTable