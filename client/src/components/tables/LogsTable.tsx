import React, { useMemo, useState, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState
} from '@tanstack/react-table'
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import dayjs from 'dayjs'

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

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

interface LogsTableProps {
  data: Log[]
  pagination?: Pagination
  loading?: boolean
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

const LogsTable: React.FC<LogsTableProps> = ({
  data,
  pagination,
  loading = false,
  onPageChange,
  onPageSizeChange
}) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'timestamp', desc: true }
  ])
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const toggleRowExpansion = useCallback((rowId: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(rowId)) {
        newSet.delete(rowId)
      } else {
        newSet.add(rowId)
      }
      return newSet
    })
  }, [])

  const columns = useMemo<ColumnDef<Log>[]>(
    () => [
      {
        id: 'expand',
        header: '',
        cell: ({ row }) => {
          const isExpanded = expandedRows.has(row.original.id)
          const hasDetail = row.original.detail && row.original.detail.length > 50

          if (!hasDetail) return null

          return (
            <button
              onClick={() => toggleRowExpansion(row.original.id)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title={isExpanded ? "Réduire" : "Développer le détail"}
            >
              <EyeIcon className={`w-4 h-4 ${isExpanded ? 'text-blue-600' : 'text-gray-400'}`} />
            </button>
          )
        },
        size: 40,
        enableSorting: false
      },
      {
        accessorKey: 'timestamp',
        header: 'Date & Heure',
        cell: ({ row }) => (
          <div className="text-sm font-mono whitespace-nowrap">
            {dayjs(row.original.timestamp).format('DD/MM/YYYY HH:mm:ss')}
          </div>
        ),
        size: 140,
        minSize: 140,
        maxSize: 140
      },
      {
        accessorKey: 'user',
        header: 'Utilisateur',
        cell: ({ row }) => {
          const { user } = row.original
          return (
            <div className="flex items-center space-x-2 min-w-0">
              <UserIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {user.prenom} {user.nom}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {user.identifiant}
                </div>
              </div>
            </div>
          )
        },
        size: 180,
        minSize: 150,
        maxSize: 250
      },
      {
        accessorKey: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
            {row.original.action}
          </span>
        ),
        size: 120,
        minSize: 100,
        maxSize: 150
      },
      {
        accessorKey: 'entite',
        header: 'Entité',
        cell: ({ row }) => row.original.entite ? (
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              {row.original.entite}
            </div>
            {row.original.entiteId && (
              <div className="text-xs text-gray-500">
                ID: {row.original.entiteId}
              </div>
            )}
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        ),
        size: 120,
        minSize: 100,
        maxSize: 150
      },
      {
        accessorKey: 'detail',
        header: 'Détail',
        cell: ({ row }) => {
          const detail = row.original.detail
          const isExpanded = expandedRows.has(row.original.id)

          if (!detail) {
            return <span className="text-sm text-gray-400">-</span>
          }

          if (detail.length <= 50) {
            return <span className="text-sm text-gray-700">{detail}</span>
          }

          return (
            <div className="text-sm text-gray-700">
              <div className={`break-words ${isExpanded ? '' : 'overflow-hidden'}`} style={isExpanded ? {} : {
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>
                {isExpanded ? detail : `${detail.substring(0, 100)}...`}
              </div>
            </div>
          )
        },
        size: 300,
        minSize: 200,
        maxSize: 500
      }
    ],
    [expandedRows, toggleRowExpansion]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: pagination?.pages || 0
  })

  const handlePageChange = useCallback((newPage: number) => {
    onPageChange?.(newPage)
  }, [onPageChange])

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    onPageSizeChange?.(newPageSize)
  }, [onPageSizeChange])

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
            {pagination ? (
              <>
                {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total.toLocaleString()} entrées
              </>
            ) : (
              `${data.length} entrées`
            )}
          </span>
        </div>

        {pagination && onPageSizeChange && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Afficher :</span>
            <select
              value={pagination.limit}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
            <span className="text-sm text-gray-600">par page</span>
          </div>
        )}
      </div>

      <div className="overflow-hidden border rounded-lg bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        header.column.getCanSort() ? 'cursor-pointer hover:bg-gray-100' : ''
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{
                        width: header.getSize(),
                        minWidth: header.column.columnDef.minSize,
                        maxWidth: header.column.columnDef.maxSize
                      }}
                    >
                      <div className="flex items-center space-x-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <div className="flex-shrink-0">
                            {{
                              asc: <ChevronUpIcon className="w-4 h-4" />,
                              desc: <ChevronDownIcon className="w-4 h-4" />
                            }[header.column.getIsSorted() as string] ?? (
                              <div className="w-4 h-4 opacity-0 group-hover:opacity-50">
                                <ChevronUpIcon className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {table.getRowModel().rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 align-top"
                      style={{
                        width: cell.column.getSize(),
                        minWidth: cell.column.columnDef.minSize,
                        maxWidth: cell.column.columnDef.maxSize
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t bg-white rounded-b-lg">
          <div className="text-sm text-gray-700">
            Page {pagination.page} sur {pagination.pages}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={pagination.page === 1}
              className="flex items-center px-2 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Première page"
            >
              ««
            </button>
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="flex items-center px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              Précédent
            </button>

            {/* Pages numériques */}
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              const startPage = Math.max(1, pagination.page - 2)
              const pageNumber = startPage + i
              if (pageNumber > pagination.pages) return null

              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`px-3 py-1 text-sm border rounded transition-colors ${
                    pageNumber === pagination.page
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              )
            })}

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="flex items-center px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </button>
            <button
              onClick={() => handlePageChange(pagination.pages)}
              disabled={pagination.page === pagination.pages}
              className="flex items-center px-2 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Dernière page"
            >
              »»
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default LogsTable