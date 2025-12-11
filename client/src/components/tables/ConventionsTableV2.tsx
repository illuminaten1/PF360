import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type OnChangeFn,
  type PaginationState,
  type Column
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
  ClockIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import DatePickerModal from '../common/DatePickerModal'
import DemandeursCell from '../common/DemandeursCell'

dayjs.locale('fr')

// Extend TanStack Table's ColumnMeta to include custom filterComponent
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    filterComponent?: (column: Column<TData, TValue>) => React.ReactNode
  }
}

interface Facets {
  types?: string[]
  victimeMecs?: string[]
  instances?: string[]
  createurs?: Array<{ id: string; fullName: string }>
  modificateurs?: Array<{ id: string; fullName: string }>
}

interface ConventionsTableV2Props {
  data: Convention[]
  loading?: boolean
  onView: (convention: Convention) => void
  onEdit: (convention: Convention) => void
  onDelete: (convention: Convention) => void
  onDateChange?: (conventionId: string, field: 'dateRetourSigne', value: string | null) => void
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

// Filtre texte simple avec debounce
function DebouncedTextFilter({ column, placeholder = 'Filtrer...' }: { column: any; placeholder?: string }) {
  const columnFilterValue = column.getFilterValue() as string ?? ''
  const [value, setValue] = useState(columnFilterValue)

  React.useEffect(() => {
    setValue(columnFilterValue)
  }, [columnFilterValue])

  React.useEffect(() => {
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

// Filtre de plage de dates
function DateRangeFilter({ column }: { column: any }) {
  const columnFilterValue = column.getFilterValue() as { from?: string; to?: string } | undefined
  const [isOpen, setIsOpen] = React.useState(false)
  const [fromDate, setFromDate] = React.useState(columnFilterValue?.from || '')
  const [toDate, setToDate] = React.useState(columnFilterValue?.to || '')

  const applyFilter = () => {
    const filter = {
      ...(fromDate && { from: fromDate }),
      ...(toDate && { to: toDate })
    }

    if (Object.keys(filter).length === 0) {
      column.setFilterValue(undefined)
    } else {
      column.setFilterValue(filter)
    }
    setIsOpen(false)
  }

  const clearFilter = () => {
    setFromDate('')
    setToDate('')
    column.setFilterValue(undefined)
    setIsOpen(false)
  }

  const getDisplayText = () => {
    if (!columnFilterValue) return 'Toutes dates'

    const { from, to } = columnFilterValue
    if (from && to) {
      return `${dayjs(from).format('DD/MM')} - ${dayjs(to).format('DD/MM')}`
    } else if (from) {
      return `Depuis ${dayjs(from).format('DD/MM')}`
    } else if (to) {
      return `Jusqu'à ${dayjs(to).format('DD/MM')}`
    }
    return 'Toutes dates'
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-32 border shadow rounded px-2 py-1 text-xs text-left bg-white hover:bg-gray-50 flex items-center justify-between"
      >
        <span className="truncate">{getDisplayText()}</span>
        <span className="text-gray-400">▼</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-60 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="p-3">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-200">
                <button
                  onClick={applyFilter}
                  className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Appliquer
                </button>
                <button
                  onClick={clearFilter}
                  className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Effacer
                </button>
              </div>
            </div>
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

const ConventionsTableV2: React.FC<ConventionsTableV2Props> = ({
  data,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onDateChange,
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
}) => {
  const navigate = useNavigate()

  // État pour les conventions avec demandeurs expandés
  const [expandedConventions, setExpandedConventions] = React.useState<Set<string>>(new Set())

  // État pour le modal de date
  const [dateModal, setDateModal] = React.useState<{
    isOpen: boolean
    conventionId: string
    field: 'dateRetourSigne'
    currentDate: string | null
  }>({
    isOpen: false,
    conventionId: '',
    field: 'dateRetourSigne',
    currentDate: null
  })

  const handleDateClick = (convention: Convention, field: 'dateRetourSigne') => {
    setDateModal({
      isOpen: true,
      conventionId: convention.id,
      field,
      currentDate: convention[field] || null
    })
  }

  const handleDateConfirm = (date: string | null) => {
    if (onDateChange) {
      onDateChange(dateModal.conventionId, dateModal.field, date)
    }
  }

  const handleDateModalClose = () => {
    setDateModal(prev => ({ ...prev, isOpen: false }))
  }

  const handleViewDossier = (dossierId: string) => {
    navigate(`/dossiers/${dossierId}`)
  }

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
        meta: {
          filterComponent: (column: any) => <DebouncedTextFilter column={column} placeholder="N°..." />
        }
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
        meta: {
          filterComponent: (column: any) => (
            <MultiSelectFilter
              column={column}
              options={facets?.types || ['CONVENTION', 'AVENANT']}
              placeholder="Tous types"
            />
          )
        }
      },
      {
        id: 'dossier',
        header: 'Dossier',
        accessorFn: (row) => row.dossier.numero,
        cell: ({ row }) => (
          <div
            className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation()
              handleViewDossier(row.original.dossier.id)
            }}
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
        meta: {
          filterComponent: (column: any) => <DebouncedTextFilter column={column} placeholder="Dossier..." />
        }
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
        meta: {
          filterComponent: (column: any) => (
            <MultiSelectFilter
              column={column}
              options={facets?.victimeMecs || ['VICTIME', 'MIS_EN_CAUSE']}
              placeholder="Tous"
            />
          )
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
        meta: {
          filterComponent: (column: any) => <DebouncedTextFilter column={column} placeholder="Instance..." />
        }
      },
      {
        id: 'avocat',
        header: 'Avocat',
        accessorFn: (row) => `${row.avocat.prenom || ''} ${row.avocat.nom}`.trim(),
        cell: ({ row }) => {
          const avocat = row.original.avocat
          return (
            <div className="text-sm break-words">
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
        meta: {
          filterComponent: (column: any) => <DebouncedTextFilter column={column} placeholder="Avocat..." />
        }
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
          return (
            <DemandeursCell
              demandes={convention.demandes.map(d => ({
                prenom: d.demande.prenom,
                nom: d.demande.nom,
                numeroDS: d.demande.numeroDS
              }))}
              showAll={expandedConventions.has(convention.id)}
              onToggleShowAll={() => {
                setExpandedConventions(prev => {
                  const newSet = new Set(prev)
                  if (newSet.has(convention.id)) {
                    newSet.delete(convention.id)
                  } else {
                    newSet.add(convention.id)
                  }
                  return newSet
                })
              }}
            />
          )
        },
        enableColumnFilter: false,
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
            <div className="text-sm min-w-[200px] max-w-md">
              {diligences.slice(0, 2).map((d, index) => (
                <div key={index} className={`flex items-center ${index > 0 ? 'mt-1' : ''}`}>
                  <ScaleIcon className="h-3 w-3 text-gray-400 mr-1 flex-shrink-0" />
                  <span className="text-gray-900 break-words">{d.diligence.nom}</span>
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
        enableColumnFilter: false,
        enableSorting: false
      },
      {
        accessorKey: 'dateRetourSigne',
        header: 'Date retour signée',
        cell: ({ getValue, row }) => {
          const date = getValue<string>()
          const convention = row.original

          return (
            <div className="flex items-center text-sm">
              {date ? (
                <>
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDateClick(convention, 'dateRetourSigne')
                    }}
                    className="text-gray-900 hover:text-blue-600 hover:underline transition-colors"
                  >
                    {dayjs(date).format('DD/MM/YYYY')}
                  </button>
                </>
              ) : (
                <>
                  <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDateClick(convention, 'dateRetourSigne')
                    }}
                    className="text-gray-500 hover:text-blue-600 hover:underline transition-colors"
                  >
                    En attente
                  </button>
                </>
              )}
            </div>
          )
        },
        enableColumnFilter: true,
        sortingFn: 'datetime',
        meta: {
          filterComponent: (column: any) => <DateRangeFilter column={column} />
        }
      },
      {
        accessorKey: 'dateCreation',
        header: 'Date création',
        cell: ({ getValue }) => (
          <div className="text-sm text-gray-900">
            {dayjs(getValue<string>()).format('DD/MM/YYYY')}
          </div>
        ),
        enableColumnFilter: true,
        sortingFn: 'datetime',
        meta: {
          filterComponent: (column: any) => <DateRangeFilter column={column} />
        }
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
        meta: {
          filterComponent: (column: any) => (
            <MultiSelectFilter
              column={column}
              options={facets?.createurs?.map(c => c.fullName) || []}
              placeholder="Tous"
            />
          )
        }
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
        meta: {
          filterComponent: (column: any) => (
            <MultiSelectFilter
              column={column}
              options={['Non modifié', ...(facets?.modificateurs?.map(m => m.fullName) || [])]}
              placeholder="Tous"
            />
          )
        }
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onView(row.original)
              }}
              className="p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
              title="Voir"
            >
              <EyeIcon className="h-5 w-5" />
            </button>
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
    [onView, onEdit, onDelete, facets, handleViewDossier, expandedConventions]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination
    },
    onSortingChange,
    onColumnFiltersChange,
    onGlobalFilterChange,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    // Server-side mode
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount,
    rowCount: totalRows
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
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 hover:border-blue-700 transition-colors duration-200 whitespace-nowrap shadow-sm"
                title="Effacer tous les filtres et afficher toutes les conventions"
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
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 hover:border-blue-700 transition-colors duration-200 whitespace-nowrap shadow-sm"
                  title="Effacer tous les filtres et afficher toutes les conventions"
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
                      className={`px-6 py-4 ${
                        cell.column.id === 'demandes' || cell.column.id === 'avocat' || cell.column.id === 'diligences' ? '' : 'whitespace-nowrap'
                      } ${cell.column.getFilterValue() ? 'bg-blue-50/70' : ''}`}
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
              {[10, 25, 50, 100].map(pageSize => (
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

      {/* Date Picker Modal */}
      <DatePickerModal
        isOpen={dateModal.isOpen}
        onClose={handleDateModalClose}
        onConfirm={handleDateConfirm}
        currentDate={dateModal.currentDate}
        title="Modifier la date de retour signée"
        field="Date de retour signée"
      />
    </div>
  )
}

export default ConventionsTableV2
