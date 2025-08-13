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
import { Decision } from '@/types'
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
  PaperAirplaneIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import SearchBar from './SearchBar'
import DatePickerModal from '../common/DatePickerModal'

dayjs.locale('fr')

interface DecisionsTableProps {
  data: Decision[]
  loading?: boolean
  onView: (decision: Decision) => void
  onEdit: (decision: Decision) => void
  onDelete: (decision: Decision) => void
  onDateChange?: (decisionId: string, field: 'dateSignature' | 'dateEnvoi', value: string | null) => void
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

const getTypeDecisionBadge = (type: string) => {
  switch (type) {
    case 'AJ':
      return 'bg-green-100 text-green-800'
    case 'AJE':
      return 'bg-blue-100 text-blue-800'
    case 'PJ':
      return 'bg-purple-100 text-purple-800'
    case 'REJET':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getTypeDecisionLabel = (type: string) => {
  switch (type) {
    case 'AJ':
      return 'Aide Juridique'
    case 'AJE':
      return 'Aide Juridique Évolutive'
    case 'PJ':
      return 'Protection Juridictionnelle'
    case 'REJET':
      return 'Rejet'
    default:
      return type
  }
}

const DecisionsTable: React.FC<DecisionsTableProps> = ({
  data,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onDateChange
}) => {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'createdAt', desc: true }
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')
  
  // État pour le modal de date
  const [dateModal, setDateModal] = React.useState<{
    isOpen: boolean
    decisionId: string
    field: 'dateSignature' | 'dateEnvoi'
    currentDate: string | null
  }>({
    isOpen: false,
    decisionId: '',
    field: 'dateSignature',
    currentDate: null
  })

  const handleDateClick = (decision: Decision, field: 'dateSignature' | 'dateEnvoi') => {
    setDateModal({
      isOpen: true,
      decisionId: decision.id,
      field,
      currentDate: decision[field] || null
    })
  }

  const handleDateConfirm = (date: string | null) => {
    if (onDateChange) {
      onDateChange(dateModal.decisionId, dateModal.field, date)
    }
  }

  const handleDateModalClose = () => {
    setDateModal(prev => ({ ...prev, isOpen: false }))
  }

  const columns = useMemo<ColumnDef<Decision>[]>(
    () => [
      {
        accessorKey: 'numero',
        header: 'N° Décision',
        cell: ({ getValue }) => {
          const numero = getValue<string>()
          return (
            <span className="font-mono text-sm font-medium text-gray-900">
              {numero || 'Non défini'}
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
        accessorKey: 'type',
        header: 'Type',
        cell: ({ getValue }) => {
          const type = getValue<string>()
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeDecisionBadge(type)}`}>
              {getTypeDecisionLabel(type)}
            </span>
          )
        },
        enableColumnFilter: true,
        filterFn: 'includesString'
      },
      {
        id: 'demandeurs',
        header: 'Demandeurs',
        accessorFn: (row) => {
          if (row.demandes.length === 0) return 'Aucun'
          return row.demandes.map(d => `${d.demande.prenom} ${d.demande.nom} (${d.demande.numeroDS})`).join(' | ')
        },
        cell: ({ row }) => {
          const decision = row.original
          if (decision.demandes.length === 0) {
            return <span className="text-gray-400">Aucun demandeur</span>
          }

          const [showAll, setShowAll] = React.useState(false)
          
          return (
            <div className="text-sm">
              <div className="text-gray-900">
                {showAll ? (
                  <div className="space-y-1">
                    {decision.demandes.map((d, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span>{d.demande.prenom} {d.demande.nom}</span>
                        <span className="text-xs text-gray-500 ml-2">({d.demande.numeroDS})</span>
                      </div>
                    ))}
                    {decision.demandes.length > 2 && (
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
                    {decision.demandes.slice(0, 2).map((d, index) => (
                      <div key={index} className={index > 0 ? 'mt-1' : ''}>
                        <span>{d.demande.prenom} {d.demande.nom}</span>
                        <span className="text-xs text-gray-500 ml-2">({d.demande.numeroDS})</span>
                      </div>
                    ))}
                    {decision.demandes.length > 2 && (
                      <div className="mt-1">
                        <span className="text-gray-500 text-xs">+{decision.demandes.length - 2} autre(s) </span>
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
        accessorKey: 'dateSignature',
        header: 'Date signature',
        cell: ({ getValue, row }) => {
          const date = getValue<string>()
          const decision = row.original
          
          return (
            <div className="flex items-center text-sm">
              <DocumentIcon className="h-4 w-4 text-gray-400 mr-2" />
              <button
                onClick={() => handleDateClick(decision, 'dateSignature')}
                className="text-gray-900 hover:text-blue-600 hover:underline transition-colors"
              >
                {date ? dayjs(date).format('DD/MM/YYYY') : 'Non définie'}
              </button>
            </div>
          )
        },
        enableColumnFilter: false,
        sortingFn: 'datetime'
      },
      {
        accessorKey: 'dateEnvoi',
        header: 'Date envoi',
        cell: ({ getValue, row }) => {
          const date = getValue<string>()
          const decision = row.original
          
          return (
            <div className="flex items-center text-sm">
              <PaperAirplaneIcon className="h-4 w-4 text-gray-400 mr-2" />
              <button
                onClick={() => handleDateClick(decision, 'dateEnvoi')}
                className="text-gray-900 hover:text-blue-600 hover:underline transition-colors"
              >
                {date ? dayjs(date).format('DD/MM/YYYY') : 'Non définie'}
              </button>
            </div>
          )
        },
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

      {/* Date Picker Modal */}
      <DatePickerModal
        isOpen={dateModal.isOpen}
        onClose={handleDateModalClose}
        onConfirm={handleDateConfirm}
        currentDate={dateModal.currentDate}
        title={`Modifier la ${dateModal.field === 'dateSignature' ? 'date de signature' : 'date d\'envoi'}`}
        field={dateModal.field === 'dateSignature' ? 'Date de signature' : 'Date d\'envoi'}
      />
    </div>
  )
}

export default DecisionsTable