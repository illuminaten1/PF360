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
import { Paiement } from '@/types'
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
  DocumentIcon,
  BanknotesIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'
import SearchBar from './SearchBar'

dayjs.locale('fr')

interface PaiementsTableProps {
  data: Paiement[]
  loading?: boolean
  onView: (paiement: Paiement) => void
  onEdit: (paiement: Paiement) => void
  onDelete: (paiement: Paiement) => void
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

const getQualiteBeneficiaireBadge = (qualite: string) => {
  switch (qualite) {
    case 'Avocat':
      return 'bg-blue-100 text-blue-800'
    case 'Commissaire de justice':
      return 'bg-purple-100 text-purple-800'
    case 'Militaire de la gendarmerie nationale':
      return 'bg-green-100 text-green-800'
    case 'Régisseur du tribunal judiciaire':
      return 'bg-amber-100 text-amber-800'
    case 'Médecin':
      return 'bg-red-100 text-red-800'
    case 'Victime':
      return 'bg-sky-100 text-sky-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getBooleanBadge = (value: string) => {
  return value === 'OUI' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
}

const getBooleanIcon = (value: string) => {
  return value === 'OUI' ? CheckCircleIcon : XCircleIcon
}

const PaiementsTable: React.FC<PaiementsTableProps> = ({
  data,
  loading = false,
  onView,
  onEdit,
  onDelete
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'createdAt', desc: true }
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')

  const columns = useMemo<ColumnDef<Paiement>[]>(
    () => [
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
        id: 'sgami',
        header: 'SGAMI',
        accessorFn: (row) => row.sgami.nom,
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="flex items-center">
              <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-gray-900">{row.original.sgami.nom}</span>
            </div>
          </div>
        ),
        enableColumnFilter: true,
        filterFn: 'includesString'
      },
      {
        accessorKey: 'qualiteBeneficiaire',
        header: 'Qualité bénéficiaire',
        cell: ({ getValue }) => {
          const qualite = getValue<string>()
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getQualiteBeneficiaireBadge(qualite)}`}>
              {qualite}
            </span>
          )
        },
        enableColumnFilter: true,
        filterFn: 'includesString'
      },
      {
        accessorKey: 'identiteBeneficiaire',
        header: 'Bénéficiaire',
        cell: ({ getValue, row }) => {
          const identite = getValue<string>()
          const avocat = row.original.avocat
          return (
            <div className="text-sm">
              <div className="text-gray-900 font-medium">
                {identite}
              </div>
              {avocat && (
                <div className="text-xs text-gray-500">
                  {avocat.region && `${avocat.region}`}
                </div>
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
        accessorKey: 'montantTTC',
        header: 'Montant TTC',
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
        accessorKey: 'facture',
        header: 'N° Facture',
        cell: ({ getValue }) => {
          const facture = getValue<string>()
          return facture ? (
            <span className="text-sm text-gray-900">{facture}</span>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )
        },
        enableColumnFilter: true,
        filterFn: 'includesString'
      },
      {
        accessorKey: 'emissionTitrePerception',
        header: 'Émission titre',
        cell: ({ getValue }) => {
          const emission = getValue<string>()
          const Icon = getBooleanIcon(emission)
          return (
            <div className="flex items-center">
              <Icon className={`h-4 w-4 mr-2 ${emission === 'OUI' ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBooleanBadge(emission)}`}>
                {emission}
              </span>
            </div>
          )
        },
        enableColumnFilter: true,
        filterFn: (row, columnId, value) => {
          if (value === '') return true
          const emission = row.getValue(columnId) as string
          return emission === value
        }
      },
      {
        accessorKey: 'conventionJointeFRI',
        header: 'Convention jointe',
        cell: ({ getValue }) => {
          const convention = getValue<string>()
          const Icon = getBooleanIcon(convention)
          return (
            <div className="flex items-center">
              <Icon className={`h-4 w-4 mr-2 ${convention === 'OUI' ? 'text-green-500' : 'text-red-500'}`} />
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBooleanBadge(convention)}`}>
                {convention}
              </span>
            </div>
          )
        },
        enableColumnFilter: true,
        filterFn: (row, columnId, value) => {
          if (value === '') return true
          const convention = row.getValue(columnId) as string
          return convention === value
        }
      },
      {
        accessorKey: 'dateServiceFait',
        header: 'Date service fait',
        cell: ({ getValue }) => {
          const date = getValue<string>()
          
          return date ? (
            <div className="flex items-center text-sm">
              <CalendarDaysIcon className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-gray-900">
                {dayjs(date).format('DD/MM/YYYY')}
              </span>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )
        },
        enableColumnFilter: false,
        sortingFn: 'datetime'
      },
      {
        id: 'pce',
        header: 'Code PCE',
        accessorFn: (row) => row.pce?.pceDetaille || 'Non défini',
        cell: ({ row }) => {
          const pce = row.original.pce
          return pce ? (
            <div className="text-sm">
              <div className="text-gray-900">{pce.pceDetaille}</div>
              <div className="text-xs text-gray-500">{pce.pceNumerique}</div>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">Non défini</span>
          )
        },
        enableColumnFilter: true,
        filterFn: 'includesString'
      },
      {
        accessorKey: 'createdAt',
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

export default PaiementsTable