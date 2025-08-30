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
import { Convention } from '@/types'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BanknotesIcon,
  ScaleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import SearchBar from './SearchBar'

dayjs.locale('fr')

interface ConventionsTableProps {
  data: Convention[]
  loading?: boolean
  onView: (convention: Convention) => void
  onEdit: (convention: Convention) => void
  onDelete: (convention: Convention) => void
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

const getTypeBadge = (type: string) => {
  switch (type) {
    case 'CONVENTION':
      return 'bg-blue-100 text-blue-800'
    case 'AVENANT':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getVictimeMecBadge = (type: string) => {
  switch (type) {
    case 'VICTIME':
      return 'bg-sky-100 text-sky-800'
    case 'MIS_EN_CAUSE':
      return 'bg-amber-100 text-amber-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getVictimeMecLabel = (type: string) => {
  switch (type) {
    case 'VICTIME':
      return 'Victime'
    case 'MIS_EN_CAUSE':
      return 'Mis en cause'
    default:
      return type
  }
}

const ConventionsTable: React.FC<ConventionsTableProps> = ({
  data,
  loading = false,
  onView,
  onEdit,
  onDelete
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'numero', desc: true }
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')

  const columns = useMemo<ColumnDef<Convention>[]>(
    () => [
      {
        accessorKey: 'numero',
        header: 'N° Convention',
        cell: ({ getValue }) => {
          const numero = getValue<number>()
          return (
            <span className="text-sm font-medium text-gray-900">
              {numero}
            </span>
          )
        },
        enableColumnFilter: true,
        filterFn: 'includesString'
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ getValue }) => {
          const type = getValue<string>()
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(type)}`}>
              {type}
            </span>
          )
        },
        enableColumnFilter: true,
        filterFn: 'includesString'
      },
      {
        id: 'dossier',
        header: 'Dossier',
        accessorFn: (row) => row.dossier.numero,
        cell: ({ row }) => (
          <div 
            className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
            onClick={() => onView(row.original)}
          >
            {row.original.dossier.numero}
            {row.original.dossier.nomDossier && (
              <div className="text-xs text-gray-500 mt-1">
                {row.original.dossier.nomDossier}
              </div>
            )}
          </div>
        ),
        enableColumnFilter: true,
        filterFn: 'includesString'
      },
      {
        accessorKey: 'victimeOuMisEnCause',
        header: 'Partie',
        cell: ({ getValue }) => {
          const type = getValue<'VICTIME' | 'MIS_EN_CAUSE'>()
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVictimeMecBadge(type)}`}>
              {getVictimeMecLabel(type)}
            </span>
          )
        },
        enableColumnFilter: true,
        filterFn: (row, columnId, value) => {
          if (value === '') return true
          const type = row.getValue(columnId) as string
          return type === value
        }
      },
      {
        accessorKey: 'instance',
        header: 'Instance',
        cell: ({ getValue }) => {
          const instance = getValue<string>()
          return (
            <div className="text-sm text-gray-900 max-w-xs truncate" title={instance}>
              {instance}
            </div>
          )
        },
        enableColumnFilter: true,
        filterFn: 'includesString'
      },
      {
        id: 'avocat',
        header: 'Avocat',
        accessorFn: (row) => `${row.avocat.prenom || ''} ${row.avocat.nom}`.trim(),
        cell: ({ row }) => {
          const avocat = row.original.avocat
          return (
            <div className="text-sm">
              <div className="text-gray-900 font-medium">
                {avocat.prenom} {avocat.nom}
              </div>
              {avocat.region && (
                <div className="text-xs text-gray-500">{avocat.region}</div>
              )}
            </div>
          )
        },
        enableColumnFilter: true,
        filterFn: 'includesString'
      },
      {
        accessorKey: 'montantHT',
        header: 'Montant HT',
        cell: ({ getValue }) => {
          const montant = getValue<number>()
          return (
            <div className="flex items-center text-sm">
              <BanknotesIcon className="h-4 w-4 text-gray-400 mr-2" />
              <span className="font-medium text-gray-900">
                {montant.toLocaleString()} €
              </span>
            </div>
          )
        },
        enableColumnFilter: false,
        sortingFn: 'basic'
      },
      {
        accessorKey: 'montantHTGagePrecedemment',
        header: 'Montant gagé préc.',
        cell: ({ getValue }) => {
          const montant = getValue<number>()
          return montant ? (
            <div className="flex items-center text-sm">
              <BanknotesIcon className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-gray-900">
                {montant.toLocaleString()} €
              </span>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )
        },
        enableColumnFilter: false,
        sortingFn: 'basic'
      },
      {
        id: 'demandes',
        header: 'Demandeurs',
        accessorFn: (row) => {
          if (row.demandes.length === 0) return 'Aucun'
          return row.demandes.map(d => `${d.demande.prenom} ${d.demande.nom} (${d.demande.numeroDS})`).join(' | ')
        },
        cell: ({ row }) => {
          const convention = row.original
          if (convention.demandes.length === 0) {
            return <span className="text-gray-400">Aucun demandeur</span>
          }

          const [showAll, setShowAll] = React.useState(false)
          
          return (
            <div className="text-sm">
              <div className="text-gray-900">
                {showAll ? (
                  <div className="space-y-1">
                    {convention.demandes.map((d, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span>{d.demande.prenom} {d.demande.nom}</span>
                        <span className="text-xs text-gray-500 ml-2">({d.demande.numeroDS})</span>
                      </div>
                    ))}
                    {convention.demandes.length > 2 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowAll(false)
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs underline mt-1"
                      >
                        Réduire
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    {convention.demandes.slice(0, 2).map((d, index) => (
                      <div key={index} className={index > 0 ? 'mt-1' : ''}>
                        <span>{d.demande.prenom} {d.demande.nom}</span>
                        <span className="text-xs text-gray-500 ml-2">({d.demande.numeroDS})</span>
                      </div>
                    ))}
                    {convention.demandes.length > 2 && (
                      <div className="mt-1">
                        <span className="text-gray-500 text-xs">+{convention.demandes.length - 2} autre(s) </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowAll(true)
                          }}
                          className="text-blue-600 hover:text-blue-800 text-xs underline"
                        >
                          Voir tous
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        },
        enableColumnFilter: true,
        filterFn: 'includesString',
        enableSorting: false
      },
      {
        id: 'diligences',
        header: 'Diligences',
        accessorFn: (row) => row.diligences.map(d => d.diligence.nom).join(', '),
        cell: ({ row }) => {
          const diligences = row.original.diligences
          if (diligences.length === 0) {
            return <span className="text-gray-400">Aucune</span>
          }

          return (
            <div className="text-sm">
              {diligences.slice(0, 2).map((d, index) => (
                <div key={index} className={`flex items-center ${index > 0 ? 'mt-1' : ''}`}>
                  <ScaleIcon className="h-3 w-3 text-gray-400 mr-1" />
                  <span className="text-gray-900">{d.diligence.nom}</span>
                </div>
              ))}
              {diligences.length > 2 && (
                <div className="text-xs text-gray-500 mt-1">
                  +{diligences.length - 2} autre(s)
                </div>
              )}
            </div>
          )
        },
        enableColumnFilter: true,
        filterFn: 'includesString',
        enableSorting: false
      },
      {
        accessorKey: 'dateRetourSigne',
        header: 'Date retour signée',
        cell: ({ getValue }) => {
          const date = getValue<string>()
          
          return (
            <div className="flex items-center text-sm">
              {date ? (
                <>
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-gray-900">
                    {dayjs(date).format('DD/MM/YYYY')}
                  </span>
                </>
              ) : (
                <>
                  <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-gray-500">En attente</span>
                </>
              )}
            </div>
          )
        },
        enableColumnFilter: false,
        sortingFn: 'datetime'
      },
      {
        accessorKey: 'dateCreation',
        header: 'Date création',
        cell: ({ getValue }) => (
          <div className="text-sm text-gray-900">
            {dayjs(getValue<string>()).format('DD/MM/YYYY')}
          </div>
        ),
        enableColumnFilter: false,
        sortingFn: 'datetime'
      },
      {
        id: 'creePar',
        header: 'Créé par',
        accessorFn: (row) => `${row.creePar.grade || ''} ${row.creePar.prenom} ${row.creePar.nom}`.trim(),
        cell: ({ row }) => {
          const creePar = row.original.creePar
          return (
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-900">
                {creePar.grade && `${creePar.grade} `}{creePar.prenom} {creePar.nom}
              </span>
            </div>
          )
        },
        enableColumnFilter: true,
        filterFn: 'includesString'
      },
      {
        id: 'modifiePar',
        header: 'Modifié par',
        accessorFn: (row) => row.modifiePar ? `${row.modifiePar.grade || ''} ${row.modifiePar.prenom} ${row.modifiePar.nom}`.trim() : 'Non modifié',
        cell: ({ row }) => {
          const modifiePar = row.original.modifiePar
          return modifiePar ? (
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-900">
                {modifiePar.grade && `${modifiePar.grade} `}{modifiePar.prenom} {modifiePar.nom}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-500">-</span>
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
        pageSize: 25
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
              {[10, 25, 50, 100].map(pageSize => (
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

export default ConventionsTable