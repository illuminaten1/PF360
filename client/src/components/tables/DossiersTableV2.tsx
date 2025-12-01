import React, { useMemo, useState, forwardRef, useImperativeHandle, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type OnChangeFn,
  type PaginationState,
  type Column
} from '@tanstack/react-table'
import { Dossier } from '@/types'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import {
  PencilIcon,
  TrashIcon,
  UserIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import LierDemandesModal from '../forms/LierDemandesModal'

dayjs.locale('fr')

// Extend TanStack Table's ColumnMeta to include custom filterComponent
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    filterComponent?: (column: Column<TData, TValue>) => React.ReactNode
  }
}

interface Facets {
  sgamis?: Array<{ id: string; nom: string }>
  assigneA?: Array<{ id: string; fullName: string }>
  badges?: Array<{ id: string; nom: string; couleur: string | null }>
}

interface DossiersTableV2Props {
  data: Dossier[]
  loading?: boolean
  onView: (dossier: Dossier) => void
  onEdit: (dossier: Dossier) => void
  onDelete: (dossier: Dossier) => void
  // Server-side props
  pageCount: number
  totalRows: number
  pagination: PaginationState
  sorting: SortingState
  columnFilters: ColumnFiltersState
  globalFilter: string
  onPaginationChange: OnChangeFn<PaginationState>
  onSortingChange: OnChangeFn<SortingState>
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>
  onGlobalFilterChange: (filter: string) => void
  onClearFilters?: () => void
  facets?: Facets
}

export interface DossiersTableV2Ref {
  setColumnFilters: (filters: any[]) => void
  clearAllFilters: () => void
}

// Filtre texte simple avec debounce
function DebouncedTextFilter({ column, placeholder = 'Filtrer...' }: { column: any; placeholder?: string }) {
  const columnFilterValue = column.getFilterValue() as string ?? ''
  const [value, setValue] = useState(columnFilterValue)

  useEffect(() => {
    setValue(columnFilterValue)
  }, [columnFilterValue])

  useEffect(() => {
    const timer = setTimeout(() => {
      column.setFilterValue(value || undefined)
    }, 500)

    return () => clearTimeout(timer)
  }, [value, column])

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="w-32 border shadow rounded px-2 py-1 text-xs"
    />
  )
}

// Filtre dropdown avec multi-select
function MultiSelectFilter({
  column,
  options,
  placeholder = 'Tous'
}: {
  column: any;
  options: string[];
  placeholder?: string
}) {
  const columnFilterValue = (column.getFilterValue() ?? []) as string[]
  const [isOpen, setIsOpen] = React.useState(false)

  const handleToggleOption = (option: string) => {
    const currentFilters = [...columnFilterValue]
    const index = currentFilters.indexOf(option)

    if (index > -1) {
      currentFilters.splice(index, 1)
    } else {
      currentFilters.push(option)
    }

    column.setFilterValue(currentFilters.length > 0 ? currentFilters : undefined)
  }

  const clearAll = () => {
    column.setFilterValue(undefined)
  }

  const selectAll = () => {
    column.setFilterValue([...options])
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-32 border shadow rounded px-2 py-1 text-xs text-left bg-white hover:bg-gray-50 flex items-center justify-between"
      >
        <span className="truncate">
          {columnFilterValue.length === 0
            ? placeholder
            : columnFilterValue.length === options.length
            ? placeholder
            : `${columnFilterValue.length} sélectionné${columnFilterValue.length > 1 ? 's' : ''}`
          }
        </span>
        <span className="text-gray-400">▼</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          <div className="p-2 border-b border-gray-200">
            <div className="flex gap-1">
              <button
                onClick={selectAll}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Tout
              </button>
              <button
                onClick={clearAll}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Aucun
              </button>
            </div>
          </div>

          <div className="p-1">
            {options.map(option => (
              <label key={option} className="flex items-center px-2 py-1 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={columnFilterValue.includes(option)}
                  onChange={() => handleToggleOption(option)}
                  className="mr-2 text-blue-600"
                />
                <span className="text-xs truncate">{option}</span>
              </label>
            ))}
            {options.length === 0 && (
              <div className="px-2 py-1 text-xs text-gray-500">Aucune option disponible</div>
            )}
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

const DemandeursCell: React.FC<{
  dossier: Dossier
  onLierDemandes: (dossierId: string, dossierNumero: string) => void
}> = ({ dossier, onLierDemandes }) => {
  const [showAll, setShowAll] = React.useState(false)

  if (dossier.demandes.length === 0) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation()
          onLierDemandes(dossier.id, dossier.numero)
        }}
        className="text-sm text-blue-600 hover:text-blue-800 underline"
      >
        Lier des demandes
      </button>
    )
  }

  return (
    <div className="text-sm">
      <div className="text-gray-900">
        {showAll ? (
          <div className="space-y-1">
            {dossier.demandes.map((d, index) => (
              <div key={index} className="flex items-center justify-between">
                <span>{d.grade?.gradeAbrege ? `${d.grade.gradeAbrege} ` : ''}{d.prenom} {d.nom}</span>
                {d.numeroDS && (
                  <span className="text-xs text-gray-500 ml-2">({d.numeroDS})</span>
                )}
              </div>
            ))}
            {dossier.demandes.length > 2 && (
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
            {dossier.demandes.slice(0, 2).map((d, index) => (
              <div key={index} className={index > 0 ? 'mt-1' : ''}>
                <span>{d.grade?.gradeAbrege ? `${d.grade.gradeAbrege} ` : ''}{d.prenom} {d.nom}</span>
                {d.numeroDS && (
                  <span className="text-xs text-gray-500 ml-2">({d.numeroDS})</span>
                )}
              </div>
            ))}
            {dossier.demandes.length > 2 && (
              <div className="mt-1">
                <span className="text-gray-500 text-xs">+{dossier.demandes.length - 2} autre(s) </span>
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
}

const DossiersTableV2 = forwardRef<DossiersTableV2Ref, DossiersTableV2Props>(({
  data,
  loading = false,
  onView,
  onEdit,
  onDelete,
  // Server-side props
  pageCount,
  totalRows,
  pagination,
  sorting,
  columnFilters,
  globalFilter,
  onPaginationChange,
  onSortingChange,
  onColumnFiltersChange,
  onGlobalFilterChange,
  onClearFilters,
  facets
}, ref) => {
  const navigate = useNavigate()
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [showLierDemandesModal, setShowLierDemandesModal] = useState(false)
  const [selectedDossierId, setSelectedDossierId] = useState<string>('')
  const [selectedDossierNumero, setSelectedDossierNumero] = useState<string>('')

  const columns = useMemo<ColumnDef<Dossier>[]>(
    () => [
      {
        accessorKey: 'numero',
        header: 'Numéro',
        cell: ({ getValue }) => (
          <div className="font-medium text-gray-900">
            {getValue<string>()}
          </div>
        ),
        enableColumnFilter: true,
        meta: {
          filterComponent: (column: any) => <DebouncedTextFilter column={column} placeholder="Numéro..." />
        }
      },
      {
        accessorKey: 'nomDossier',
        header: 'Nom du dossier',
        cell: ({ getValue }) => {
          const nomDossier = getValue<string>()
          return nomDossier ? (
            <div className="text-sm font-medium text-gray-900">
              {nomDossier}
            </div>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )
        },
        enableColumnFilter: true,
        meta: {
          filterComponent: (column: any) => <DebouncedTextFilter column={column} placeholder="Nom..." />
        }
      },
      {
        id: 'nombreDemandes',
        header: 'Nb Demandes',
        accessorFn: (row) => row.stats?.nombreDemandes || row.demandes.length,
        cell: ({ getValue }) => (
          <div className="text-sm font-medium text-gray-900">
            {getValue<number>()}
          </div>
        ),
        enableColumnFilter: false,
        enableSorting: true
      },
      {
        id: 'demandeurs',
        header: 'Demandeurs',
        accessorFn: (row) => {
          if (row.demandes.length === 0) return 'Aucun'
          return row.demandes.map(d => `${d.grade?.gradeAbrege ? `${d.grade.gradeAbrege} ` : ''}${d.prenom} ${d.nom} ${d.numeroDS || ''}`).join(' | ')
        },
        cell: ({ row }) => {
          const dossier = row.original
          return (
            <DemandeursCell
              dossier={dossier}
              onLierDemandes={(dossierId, dossierNumero) => {
                setSelectedDossierId(dossierId)
                setSelectedDossierNumero(dossierNumero)
                setShowLierDemandesModal(true)
              }}
            />
          )
        },
        enableColumnFilter: false,
        enableSorting: false
      },
      {
        id: 'sgami',
        header: 'SGAMI',
        accessorFn: (row) => row.sgami?.nom || 'Non assigné',
        cell: ({ row }) => {
          const sgami = row.original.sgami
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              sgami ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {sgami?.nom || 'Non assigné'}
            </span>
          )
        },
        enableColumnFilter: true,
        meta: {
          filterComponent: (column: any) => (
            <MultiSelectFilter
              column={column}
              options={['Non assigné', ...(facets?.sgamis?.map(s => s.nom) || [])]}
              placeholder="Tous SGAMI"
            />
          )
        }
      },
      {
        id: 'assigneA',
        header: 'Assigné à',
        accessorFn: (row) => row.assigneA ? `${row.assigneA.grade || ''} ${row.assigneA.prenom} ${row.assigneA.nom}`.trim() : 'Non assigné',
        cell: ({ row }) => {
          const assigneA = row.original.assigneA
          return assigneA ? (
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-900">
                {assigneA.grade && `${assigneA.grade} `}{assigneA.prenom} {assigneA.nom}
              </span>
            </div>
          ) : (
            <span className="text-sm text-gray-500">Non assigné</span>
          )
        },
        enableColumnFilter: true,
        meta: {
          filterComponent: (column: any) => (
            <MultiSelectFilter
              column={column}
              options={['Non assigné', ...(facets?.assigneA?.map(a => a.fullName) || [])]}
              placeholder="Tous"
            />
          )
        }
      },
      {
        id: 'badges',
        header: 'Badges',
        accessorFn: (row) => row.badges.map(b => b.badge.nom).join(', '),
        cell: ({ row }) => {
          const badges = row.original.badges
          if (badges.length === 0) {
            return <span className="text-gray-400">-</span>
          }
          return (
            <div className="flex flex-wrap gap-1">
              {badges.slice(0, 3).map((badgeRel) => (
                <span
                  key={badgeRel.badge.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                  style={badgeRel.badge.couleur ? {
                    backgroundColor: `${badgeRel.badge.couleur}20`,
                    color: badgeRel.badge.couleur
                  } : {}}
                >
                  {badgeRel.badge.nom}
                </span>
              ))}
              {badges.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{badges.length - 3}
                </span>
              )}
            </div>
          )
        },
        enableColumnFilter: true,
        meta: {
          filterComponent: (column: any) => (
            <MultiSelectFilter
              column={column}
              options={facets?.badges?.map(b => b.nom) || []}
              placeholder="Tous badges"
            />
          )
        }
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
              onClick={(e) => {
                e.stopPropagation()
                onEdit(row.original)
              }}
              className="p-1 text-gray-400 hover:text-green-600 rounded-full hover:bg-green-50"
              title="Modifier"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(row.original)
              }}
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
    [onEdit, onDelete, facets]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      pagination
    },
    onSortingChange,
    onColumnFiltersChange,
    onGlobalFilterChange,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    // Server-side mode
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount,
    rowCount: totalRows
  })

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    setColumnFilters: (filters: any[]) => {
      onColumnFiltersChange(filters)
    },
    clearAllFilters: () => {
      onColumnFiltersChange([])
      onGlobalFilterChange('')
      onPaginationChange({ pageIndex: 0, pageSize: pagination.pageSize })
    }
  }), [onColumnFiltersChange, onGlobalFilterChange, onPaginationChange, pagination.pageSize])

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
      <div className="border-b border-gray-200">
        <div className="p-4">
          {/* Desktop: tout sur une ligne */}
          <div className="hidden sm:flex items-center gap-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              name="search"
              autoComplete="off"
              value={globalFilter ?? ''}
              onChange={(e) => onGlobalFilterChange(String(e.target.value))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Recherche globale..."
            />
            <span className="text-sm text-gray-500 whitespace-nowrap">
              {totalRows} résultat(s)
            </span>
            {onClearFilters && (columnFilters.length > 0 || globalFilter) && (
              <button
                onClick={onClearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200 whitespace-nowrap"
                title="Effacer tous les filtres et afficher tous les dossiers"
              >
                Effacer tous les filtres
              </button>
            )}
          </div>

          {/* Mobile: deux lignes */}
          <div className="sm:hidden space-y-3">
            <div className="flex items-center gap-2">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                name="search"
                autoComplete="off"
                value={globalFilter ?? ''}
                onChange={(e) => onGlobalFilterChange(String(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Recherche globale..."
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500">
                {totalRows} résultat(s)
              </span>
              {onClearFilters && (columnFilters.length > 0 || globalFilter) && (
                <button
                  onClick={onClearFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200 whitespace-nowrap"
                  title="Effacer tous les filtres et afficher tous les dossiers"
                >
                  Effacer tous les filtres
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto" style={{ minHeight: '400px' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      header.column.getFilterValue()
                        ? 'bg-blue-50 border-l-2 border-l-blue-300'
                        : 'bg-gray-50'
                    }`}
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
                      {header.column.getCanFilter() && header.column.columnDef.meta?.filterComponent && (
                        <div>
                          {header.column.columnDef.meta.filterComponent(header.column)}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={table.getHeaderGroups()[0]?.headers.length || 1}
                  className="px-6 py-16 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center">
                    <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-900 mb-1">Aucun résultat trouvé</p>
                    <p className="text-sm text-gray-500">Essayez de modifier vos critères de filtrage</p>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onView(row.original)}
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className={`px-6 py-4 whitespace-nowrap ${
                        cell.column.getFilterValue() ? 'bg-blue-50/70' : ''
                      }`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center justify-center sm:justify-start text-xs sm:text-sm text-gray-700">
            <span>
              Page {pagination.pageIndex + 1} sur{' '}
              {pageCount} • {totalRows} résultat(s)
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2">
            <select
              value={pagination.pageSize}
              onChange={e => {
                onPaginationChange({
                  pageIndex: 0,
                  pageSize: Number(e.target.value)
                })
              }}
              className="w-full sm:w-auto border border-gray-300 rounded px-2 py-1 text-xs sm:text-sm"
            >
              {[10, 20, 50, 100, 200].map(pageSize => (
                <option key={pageSize} value={pageSize}>
                  {pageSize} par page
                </option>
              ))}
            </select>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => onPaginationChange({ ...pagination, pageIndex: 0 })}
                disabled={pagination.pageIndex === 0}
                className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-xs sm:text-sm"
                title="Première page"
              >
                {'<<'}
              </button>

              <button
                onClick={() => onPaginationChange({ ...pagination, pageIndex: pagination.pageIndex - 1 })}
                disabled={pagination.pageIndex === 0}
                className="p-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                title="Page précédente"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>

              <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm">
                {pagination.pageIndex + 1}
              </span>

              <button
                onClick={() => onPaginationChange({ ...pagination, pageIndex: pagination.pageIndex + 1 })}
                disabled={pagination.pageIndex >= pageCount - 1}
                className="p-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                title="Page suivante"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>

              <button
                onClick={() => onPaginationChange({ ...pagination, pageIndex: pageCount - 1 })}
                disabled={pagination.pageIndex >= pageCount - 1}
                className="px-2 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-xs sm:text-sm"
                title="Dernière page"
              >
                {'>>'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal pour lier des demandes */}
      <LierDemandesModal
        isOpen={showLierDemandesModal}
        onClose={() => setShowLierDemandesModal(false)}
        dossierId={selectedDossierId}
        dossierNumero={selectedDossierNumero}
      />
    </div>
  )
})

DossiersTableV2.displayName = 'DossiersTableV2'

export default DossiersTableV2
