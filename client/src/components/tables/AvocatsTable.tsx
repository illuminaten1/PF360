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
  type ColumnFiltersState
} from '@tanstack/react-table'
import { Avocat } from '@/types'
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'
import SearchBar from './SearchBar'

interface AvocatsTableProps {
  data: Avocat[]
  loading?: boolean
  onView: (avocat: Avocat) => void
  onEdit: (avocat: Avocat) => void
  onDelete: (avocat: Avocat) => void
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

function DynamicSelectFilter({ column, data }: { column: any; data: Avocat[] }) {
  const columnFilterValue = column.getFilterValue()
  
  // Extraire les valeurs uniques de la colonne
  const uniqueValues = useMemo(() => {
    let values: any[]
    
    if (column.id === 'villesIntervention') {
      // Pour les villes d'intervention, on flatten le tableau
      values = data
        .flatMap(row => row.villesIntervention || [])
        .filter(value => value !== null && value !== undefined && value !== '')
    } else {
      // Pour les autres colonnes
      values = data
        .map(row => row[column.id as keyof Avocat])
        .filter(value => value !== null && value !== undefined && value !== '')
    }
    
    return Array.from(new Set(values)).sort()
  }, [data, column.id])
  
  return (
    <select
      value={(columnFilterValue ?? '') as string}
      onChange={(e) => column.setFilterValue(e.target.value || undefined)}
      className="w-32 border shadow rounded px-2 py-1 text-xs"
    >
      <option value="">Tous</option>
      {uniqueValues.map((value) => (
        <option key={String(value)} value={String(value)}>
          {String(value)}
        </option>
      ))}
    </select>
  )
}

const AvocatsTable: React.FC<AvocatsTableProps> = ({
  data,
  loading = false,
  onView,
  onEdit,
  onDelete
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'nom', desc: false }
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')

  const columns = useMemo<ColumnDef<Avocat>[]>(
    () => [
      {
        accessorKey: 'nom',
        header: 'Nom',
        cell: ({ getValue, row }) => (
          <div 
            className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
            onClick={() => onView(row.original)}
          >
            {getValue<string>()}
          </div>
        ),
        enableColumnFilter: true,
        filterFn: 'includesString'
      },
      {
        accessorKey: 'prenom',
        header: 'Prénom',
        cell: ({ getValue }) => (
          <div className="text-gray-900">
            {getValue<string>()}
          </div>
        ),
        enableColumnFilter: true,
        filterFn: 'includesString'
      },
      {
        accessorKey: 'region',
        header: 'Région',
        cell: ({ getValue }) => {
          const region = getValue<string>()
          return region ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {region}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )
        },
        enableColumnFilter: true,
        filterFn: 'equals'
      },
      {
        accessorKey: 'specialisation',
        header: 'Spécialisation',
        cell: ({ getValue }) => (
          <div className="text-sm text-gray-900">
            {getValue<string>() || '-'}
          </div>
        ),
        enableColumnFilter: true,
        filterFn: 'includesString'
      },
      {
        accessorKey: 'villesIntervention',
        header: 'Villes d\'intervention',
        cell: ({ getValue }) => {
          const villes = getValue() as string[] | undefined
          if (!villes || villes.length === 0) {
            return <span className="text-gray-400">-</span>
          }
          
          return (
            <div className="flex flex-wrap gap-1">
              {villes.slice(0, 2).map((ville, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  {ville}
                </span>
              ))}
              {villes.length > 2 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  +{villes.length - 2}
                </span>
              )}
            </div>
          )
        },
        enableColumnFilter: true,
        filterFn: (row, columnId, filterValue) => {
          const villes = row.getValue(columnId) as string[] | undefined
          if (!villes || !filterValue) return true
          return villes.some(ville => 
            ville.toLowerCase().includes(filterValue.toLowerCase())
          )
        }
      },
      {
        accessorKey: 'telephonePublic1',
        header: 'Téléphone',
        cell: ({ getValue, row }) => {
          const telephone = getValue<string>()
          const telephone2 = row.original.telephonePublic2
          
          if (!telephone && !telephone2) {
            return <span className="text-gray-400">-</span>
          }
          
          return (
            <div className="text-sm">
              {telephone && (
                <div className="flex items-center text-blue-600 hover:text-blue-800">
                  <PhoneIcon className="h-4 w-4 mr-1" />
                  <a href={`tel:${telephone}`} className="hover:underline">
                    {telephone}
                  </a>
                </div>
              )}
              {telephone2 && (
                <div className="flex items-center text-blue-600 hover:text-blue-800 mt-1">
                  <PhoneIcon className="h-4 w-4 mr-1" />
                  <a href={`tel:${telephone2}`} className="hover:underline">
                    {telephone2}
                  </a>
                </div>
              )}
            </div>
          )
        },
        enableColumnFilter: true,
        filterFn: 'includesString'
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ getValue }) => {
          const email = getValue<string>()
          return email ? (
            <div className="flex items-center text-blue-600 hover:text-blue-800">
              <EnvelopeIcon className="h-4 w-4 mr-1" />
              <a href={`mailto:${email}`} className="hover:underline text-sm">
                {email}
              </a>
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          )
        },
        enableColumnFilter: true,
        filterFn: 'includesString'
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onView(row.original)}
              className="p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
              title="Voir"
            >
              <EyeIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => onEdit(row.original)}
              className="p-1 text-gray-400 hover:text-green-600 rounded-full hover:bg-green-50"
              title="Modifier"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete(row.original)}
              className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
              title="Supprimer"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        ),
        enableColumnFilter: false,
        enableSorting: false
      }
    ],
    [onView, onEdit, onDelete]
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
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    initialState: {
      pagination: {
        pageSize: 50
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
                          {header.column.id === 'region' || header.column.id === 'villesIntervention' ? (
                            <DynamicSelectFilter column={header.column} data={data} />
                          ) : (
                            <Filter column={header.column} />
                          )}
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

export default AvocatsTable