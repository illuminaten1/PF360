import React, { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState
} from '@tanstack/react-table'
import { 
  PencilIcon,
  TrashIcon,
  BuildingOfficeIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { BAP } from '@/types'
import SearchBar from './SearchBar'

interface BAPTableProps {
  data: BAP[]
  loading?: boolean
  onEdit: (bap: BAP) => void
  onDelete: (id: string) => void
}

function Filter({ column }: { column: any }) {
  const columnFilterValue = column.getFilterValue()

  return (
    <input
      type="text"
      value={(columnFilterValue ?? '') as string}
      onChange={(e) => column.setFilterValue(e.target.value)}
      placeholder={`Filtrer...`}
      className="w-32 border shadow rounded px-2 py-1 text-xs"
    />
  )
}

const BAPTable: React.FC<BAPTableProps> = ({
  data,
  loading = false,
  onEdit,
  onDelete
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'nomBAP', desc: false }
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const columns = useMemo<ColumnDef<BAP>[]>(
    () => [
      {
        accessorKey: 'nomBAP',
        header: 'Nom du BAP',
        cell: ({ getValue }) => {
          return (
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-900">
                  {getValue<string>()}
                </div>
              </div>
            </div>
          )
        },
        enableColumnFilter: true,
        filterFn: 'includesString'
      },
      {
        accessorKey: 'emails',
        header: 'Adresses email',
        cell: ({ row }) => {
          const bap = row.original
          const emails = [bap.mail1, bap.mail2, bap.mail3, bap.mail4].filter(Boolean)
          
          if (emails.length === 0) {
            return (
              <span className="text-sm text-gray-400">Aucune adresse email</span>
            )
          }
          
          return (
            <div className="text-sm">
              <div className="space-y-1">
                {emails.slice(0, 2).map((email, index) => (
                  <div key={index} className="text-gray-900">
                    {email}
                  </div>
                ))}
                {emails.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{emails.length - 2} autre{emails.length - 2 > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
          )
        },
        enableColumnFilter: false
      },
      {
        accessorKey: 'totalUsage',
        header: 'Utilisation',
        cell: ({ row }) => {
          const bap = row.original
          const totalUsage = bap.totalUsage || 0
          const dossiersCount = bap.dossiersCount || 0
          const demandesCount = bap.demandesCount || 0
          
          if (totalUsage === 0) {
            return (
              <span className="text-sm text-gray-400">Non utilisé</span>
            )
          }
          
          return (
            <div className="text-sm">
              <div className="font-medium text-gray-900">{totalUsage} utilisations</div>
              <div className="text-xs text-gray-500">
                {dossiersCount > 0 && `${dossiersCount} dossier${dossiersCount > 1 ? 's' : ''}`}
                {dossiersCount > 0 && demandesCount > 0 && ' • '}
                {demandesCount > 0 && `${demandesCount} demande${demandesCount > 1 ? 's' : ''}`}
              </div>
            </div>
          )
        },
        enableColumnFilter: false,
        sortingFn: 'basic'
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const bap = row.original
          const isUsed = (bap.totalUsage || 0) > 0
          
          return (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onEdit(bap)}
                className="p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
                title="Modifier"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(bap.id)}
                disabled={isUsed}
                className={`p-1 rounded-full ${
                  isUsed 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                }`}
                title={isUsed ? 'Impossible de supprimer un BAP utilisé' : 'Supprimer'}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          )
        },
        enableColumnFilter: false,
        enableSorting: false
      }
    ],
    [onEdit, onDelete]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    initialState: {
      pagination: {
        pageSize: 20
      }
    }
  })

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded-t-lg mb-4"></div>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 mb-2 mx-4"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <SearchBar 
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        filteredRowsCount={table.getFilteredRowModel().rows.length}
      />

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        {header.isPlaceholder ? null : (
                          <>
                            <div
                              className={`cursor-pointer select-none flex items-center ${
                                header.column.getCanSort() ? 'hover:text-gray-700' : ''
                              }`}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {header.column.getCanSort() && (
                                <span className="ml-1">
                                  {header.column.getIsSorted() === 'asc' ? (
                                    <ChevronUpIcon className="h-4 w-4" />
                                  ) : header.column.getIsSorted() === 'desc' ? (
                                    <ChevronDownIcon className="h-4 w-4" />
                                  ) : (
                                    <div className="h-4 w-4 opacity-0 group-hover:opacity-100">
                                      <ChevronUpIcon className="h-4 w-4" />
                                    </div>
                                  )}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      {header.column.getCanFilter() && (
                        <div>
                          <Filter column={header.column} />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-700">
            <span>
              Page {table.getState().pagination.pageIndex + 1} sur{' '}
              {table.getPageCount()} • {table.getFilteredRowModel().rows.length} résultat(s)
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={table.getState().pagination.pageSize}
              onChange={e => {
                table.setPageSize(Number(e.target.value))
              }}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {[10, 20, 50, 100].map(pageSize => (
                <option key={pageSize} value={pageSize}>
                  {pageSize} par page
                </option>
              ))}
            </select>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                title="Première page"
              >
                {'<<'}
              </button>
              
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                title="Page précédente"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              
              <span className="px-3 py-1 text-sm">
                {table.getState().pagination.pageIndex + 1}
              </span>
              
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                title="Page suivante"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
                title="Dernière page"
              >
                {'>>'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BAPTable