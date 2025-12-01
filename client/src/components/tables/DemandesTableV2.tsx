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
import { Demande } from '@/types'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'

// Extend TanStack Table's ColumnMeta to include custom filterComponent
declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    filterComponent?: (column: Column<TData, TValue>) => React.ReactNode
  }
}
import {
  PencilIcon,
  TrashIcon,
  FolderIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserPlusIcon,
  PlusIcon,
  ClipboardDocumentListIcon,
  CheckIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import AssignerBAPModal from '../forms/AssignerBAPModal'
import AssignerDemandesLotModal from '../forms/AssignerDemandesLotModal'
import { useAuth } from '@/contexts/AuthContext'

dayjs.locale('fr')

interface Facets {
  types?: string[]
  grades?: string[]
  badges?: Array<{ id: string; nom: string; couleur: string | null }>
  baps?: Array<{ id: string; nom: string }>
  assigneA?: Array<{ id: string; fullName: string }>
}

interface DemandesTableV2Props {
  data: Demande[]
  loading?: boolean
  onView: (demande: Demande) => void
  onEdit: (demande: Demande) => void
  onDelete: (demande: Demande) => void
  onAddToDossier: (demande: Demande) => void
  onCreateDossierWithSelection?: (selectedDemandes: Demande[]) => void
  onLinkToExistingDossier?: (selectedDemandes: Demande[]) => void
  onBulkAssignToUser?: (selectedDemandes: Demande[]) => void
  canDelete?: boolean
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

export interface DemandesTableV2Ref {
  setColumnFilters: (filters: any[]) => void
  clearAllFilters: () => void
  clearSelection: () => void
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

const DemandesTableV2 = forwardRef<DemandesTableV2Ref, DemandesTableV2Props>(({
  data,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onAddToDossier,
  onCreateDossierWithSelection,
  onLinkToExistingDossier,
  onBulkAssignToUser,
  canDelete = true,
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
  const { user } = useAuth()

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    numeroDS: false,
    dateReception: true,
    type: true,
    grade: true,
    nom: true,
    prenom: true,
    dateFaits: true,
    dossier: true,
    assigneA: true,
    baps: true,
    dateAudience: true,
    actions: true,
    nigend: false,
    unite: false,
    commune: false
  })

  const [showBAPModal, setShowBAPModal] = useState(false)
  const [selectedDemandeId, setSelectedDemandeId] = useState<string>('')
  const [selectedDemandeNumeroDS, setSelectedDemandeNumeroDS] = useState<string>('')
  const [currentBAP, setCurrentBAP] = useState<any>(null)
  const [selectedDemandes, setSelectedDemandes] = useState<Set<string>>(new Set())
  const [showAssignerLotModal, setShowAssignerLotModal] = useState(false)
  const [modalKey, setModalKey] = useState(0)
  const [contextMenu, setContextMenu] = useState<{
    show: boolean
    x: number
    y: number
    demande: Demande | null
  }>({ show: false, x: 0, y: 0, demande: null })
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

  const getTypeColor = (type: string) => {
    return type === 'VICTIME' ? 'bg-sky-100 text-sky-800' : 'bg-orange-100 text-orange-800'
  }

  const getTypeLabel = (type: string) => {
    return type === 'VICTIME' ? 'Victime' : 'Mis en cause'
  }

  const handleViewDossier = useCallback((dossierId: string) => {
    navigate(`/dossiers/${dossierId}`)
  }, [navigate])

  const getAudienceUrgency = (dateAudience?: string) => {
    if (!dateAudience) return { type: 'none', style: 'bg-gray-100 text-gray-800', icon: null }

    const today = dayjs()
    const audienceDate = dayjs(dateAudience)
    const daysDiff = audienceDate.diff(today, 'day')

    if (daysDiff < 0) {
      return {
        type: 'passed',
        style: 'bg-gray-100 text-gray-800',
        icon: XCircleIcon
      }
    } else if (daysDiff < 7) {
      return {
        type: 'urgent',
        style: 'bg-red-100 text-red-800',
        icon: ExclamationTriangleIcon
      }
    } else if (daysDiff < 14) {
      return {
        type: 'soon',
        style: 'bg-orange-100 text-orange-800',
        icon: ClockIcon
      }
    } else {
      return {
        type: 'normal',
        style: 'bg-green-100 text-green-800',
        icon: CheckCircleIcon
      }
    }
  }

  const handleSelectDemande = useCallback((demandeId: string, checked: boolean) => {
    const newSelection = new Set(selectedDemandes)
    if (checked) {
      newSelection.add(demandeId)
    } else {
      newSelection.delete(demandeId)
    }
    setSelectedDemandes(newSelection)
  }, [selectedDemandes])

  const isDemandeSelectable = (demande: Demande) => {
    return !demande.dossier && !demande.assigneA && (!demande.baps || demande.baps.length === 0)
  }

  const getSelectedDemandesData = () => {
    return data.filter(demande => selectedDemandes.has(demande.id))
  }

  const generateDemandeString = (demande: Demande) => {
    const nom = demande.nom.toUpperCase()
    const prenom = demande.prenom
    const grade = demande.grade?.gradeAbrege || ''
    const type = demande.type === 'VICTIME' ? 'VICT' : 'MEC'
    const dateFaits = demande.dateFaits ? dayjs(demande.dateFaits).format('DD-MM-YYYY') : 'Date non renseignée'

    let result = `${nom} ${prenom}`
    if (grade) {
      result += ` ${grade}`
    }
    result += ` - ${type} - ${dateFaits}`

    return result
  }

  const handleContextMenu = (e: React.MouseEvent, demande: Demande) => {
    e.preventDefault()
    e.stopPropagation()

    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      demande
    })
  }

  const handleCopyString = async () => {
    if (!contextMenu.demande) return

    const stringToCopy = generateDemandeString(contextMenu.demande)

    try {
      await navigator.clipboard.writeText(stringToCopy)
      setCopySuccess(`Nom de dossier copié pour DS ${contextMenu.demande.numeroDS}`)
      setTimeout(() => setCopySuccess(null), 3000)
    } catch (err) {
      console.error('Erreur lors de la copie:', err)
    }

    setContextMenu({ show: false, x: 0, y: 0, demande: null })
  }

  const closeContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, demande: null })
  }

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.show) {
        closeContextMenu()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && contextMenu.show) {
        closeContextMenu()
      }
    }

    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [contextMenu.show])

  const columns = useMemo<ColumnDef<Demande>[]>(
    () => [
      // Selection checkbox
      {
        id: 'select',
        header: '',
        cell: ({ row }) => {
          const demande = row.original
          const isSelectable = isDemandeSelectable(demande)
          const isSelected = selectedDemandes.has(demande.id)

          return (
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => handleSelectDemande(demande.id, e.target.checked)}
                disabled={!isSelectable}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )
        },
        enableSorting: false,
        enableColumnFilter: false,
        size: 50
      },
      // numeroDS - Filtre texte
      {
        accessorKey: 'numeroDS',
        header: 'Numéro DS',
        cell: ({ getValue }) => (
          <div className="font-medium text-gray-900">
            {getValue<string>()}
          </div>
        ),
        enableColumnFilter: true,
        meta: {
          filterComponent: (column: any) => <DebouncedTextFilter column={column} placeholder="N° DS..." />
        }
      },
      // dateReception - Filtre date range
      {
        accessorKey: 'dateReception',
        header: 'Réception',
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
      // type - Filtre dropdown
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ getValue }) => {
          const type = getValue<string>()
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(type)}`}>
              {getTypeLabel(type)}
            </span>
          )
        },
        enableColumnFilter: true,
        meta: {
          filterComponent: (column: any) => (
            <MultiSelectFilter
              column={column}
              options={facets?.types || ['VICTIME', 'MIS_EN_CAUSE']}
              placeholder="Tous types"
            />
          )
        }
      },
      // grade - Filtre dropdown
      {
        id: 'grade',
        header: 'Grade',
        accessorFn: (row) => row.grade?.gradeAbrege || '-',
        cell: ({ getValue }) => (
          <div className="text-sm text-gray-900">
            {getValue<string>()}
          </div>
        ),
        enableColumnFilter: true,
        meta: {
          filterComponent: (column: any) => (
            <MultiSelectFilter
              column={column}
              options={facets?.grades || []}
              placeholder="Tous grades"
            />
          )
        }
      },
      // nom - Filtre texte
      {
        accessorKey: 'nom',
        header: 'Nom',
        cell: ({ getValue }) => {
          const nom = getValue<string>()
          return (
            <div className="font-medium text-gray-900 max-w-[150px] truncate" title={nom}>
              {nom}
            </div>
          )
        },
        enableColumnFilter: true,
        meta: {
          filterComponent: (column: any) => <DebouncedTextFilter column={column} placeholder="Nom..." />
        }
      },
      // prenom - Filtre texte
      {
        accessorKey: 'prenom',
        header: 'Prénom',
        cell: ({ getValue }) => {
          const prenom = getValue<string>()
          return (
            <div className="text-gray-900 max-w-[150px] truncate" title={prenom}>
              {prenom}
            </div>
          )
        },
        enableColumnFilter: true,
        meta: {
          filterComponent: (column: any) => <DebouncedTextFilter column={column} placeholder="Prénom..." />
        }
      },
      // dateFaits - Filtre date range
      {
        accessorKey: 'dateFaits',
        header: 'Date faits',
        cell: ({ getValue }) => {
          const date = getValue<string>()
          return date ? (
            <div className="text-sm text-gray-900">
              {dayjs(date).format('DD/MM/YYYY')}
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          )
        },
        enableColumnFilter: true,
        sortingFn: 'datetime',
        meta: {
          filterComponent: (column: any) => <DateRangeFilter column={column} />
        }
      },
      // dossier
      {
        id: 'dossier',
        header: 'Dossier',
        accessorFn: (row) => row.dossier?.numero || 'Non lié',
        cell: ({ row }) => {
          const demande = row.original
          return demande.dossier ? (
            <div className="text-sm">
              <div
                className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                onClick={(e) => {
                  e.stopPropagation()
                  handleViewDossier(demande.dossier!.id)
                }}
              >
                {demande.dossier.numero}
              </div>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddToDossier(demande)
              }}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <FolderIcon className="h-4 w-4 mr-1" />
              Lier
            </button>
          )
        },
        enableColumnFilter: false,
        enableSorting: false
      },
      // assigneA - Filtre dropdown
      {
        id: 'assigneA',
        header: 'Assigné à',
        accessorFn: (row) => row.assigneA ? `${row.assigneA.grade || ''} ${row.assigneA.prenom} ${row.assigneA.nom}`.trim() : 'Non assigné',
        cell: ({ row }) => {
          const demande = row.original
          const assigneA = demande.assigneA
          return (
            <div className="text-sm">
              {assigneA ? (
                <div className="flex items-center space-x-2">
                  <div className="text-gray-900">
                    <div className="font-medium">
                      {assigneA.grade && `${assigneA.grade} `}{assigneA.prenom} {assigneA.nom}
                    </div>
                  </div>
                  {user?.role === 'ADMIN' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedDemandes(new Set([demande.id]))
                        setModalKey(prev => prev + 1)
                        setShowAssignerLotModal(true)
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <PencilIcon className="h-3 w-3 mr-1" />
                      Modifier
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="text-gray-400 italic">Non assigné</span>
                  {user?.role === 'ADMIN' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedDemandes(new Set([demande.id]))
                        setModalKey(prev => prev + 1)
                        setShowAssignerLotModal(true)
                      }}
                      className="ml-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <UserPlusIcon className="h-4 w-4 mr-1" />
                      Assigner
                    </button>
                  )}
                </div>
              )}
            </div>
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
      // baps - Filtre dropdown
      {
        id: 'baps',
        header: 'BAP',
        accessorFn: (row) => {
          const baps = row.baps || []
          return baps.map((bapRel: any) => bapRel.bap?.nomBAP).filter(Boolean).join(', ')
        },
        cell: ({ row }) => {
          const demande = row.original
          const baps = demande.baps || []

          return (
            <div className="text-sm">
              {baps.length === 0 ? (
                <div className="flex items-center">
                  <span className="text-gray-400 italic">Aucun BAP</span>
                  {user?.role === 'ADMIN' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedDemandeId(demande.id)
                        setSelectedDemandeNumeroDS(demande.numeroDS)
                        setCurrentBAP(null)
                        setShowBAPModal(true)
                      }}
                      className="ml-2 text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Assigner
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="text-gray-900">
                    {baps.map((bapRel: any, index: number) => (
                      <div key={bapRel.bap.id} className="font-medium">
                        {index > 0 && ', '}{bapRel.bap.nomBAP}
                      </div>
                    ))}
                  </div>
                  {user?.role === 'ADMIN' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedDemandeId(demande.id)
                        setSelectedDemandeNumeroDS(demande.numeroDS)
                        setCurrentBAP(baps.length > 0 ? baps[0].bap : null)
                        setShowBAPModal(true)
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                    >
                      <PencilIcon className="h-3 w-3 mr-1" />
                      Modifier
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        },
        enableColumnFilter: true,
        meta: {
          filterComponent: (column: any) => (
            <MultiSelectFilter
              column={column}
              options={facets?.baps?.map(b => b.nom) || []}
              placeholder="Tous BAP"
            />
          )
        }
      },
      // dateAudience - Filtre date range
      {
        accessorKey: 'dateAudience',
        header: 'Date audience',
        cell: ({ getValue }) => {
          const dateAudience = getValue<string>()
          if (!dateAudience) {
            return (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                -
              </span>
            )
          }

          const urgency = getAudienceUrgency(dateAudience)
          const IconComponent = urgency.icon
          const today = dayjs().startOf('day')
          const audienceDate = dayjs(dateAudience).startOf('day')
          const daysDiff = audienceDate.diff(today, 'day')

          return (
            <div className="flex items-center">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${urgency.style}`}>
                {IconComponent && (
                  <IconComponent className="h-3 w-3 mr-1" />
                )}
                {dayjs(dateAudience).format('DD/MM/YYYY')}
                {daysDiff >= 0 && (
                  <span className="ml-1">
                    - {daysDiff} j.
                  </span>
                )}
              </span>
            </div>
          )
        },
        enableColumnFilter: true,
        sortingFn: 'datetime',
        meta: {
          filterComponent: (column: any) => <DateRangeFilter column={column} />
        }
      },
      // actions
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
            {canDelete && (
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
            )}
          </div>
        ),
        enableColumnFilter: false,
        enableSorting: false
      },
      // Colonnes cachées mais searchables
      {
        accessorKey: 'nigend',
        header: 'NIGEND',
        cell: ({ getValue }) => (
          <div className="text-sm text-gray-500">
            {getValue<string>() || '-'}
          </div>
        ),
        enableColumnFilter: true,
        meta: {
          filterComponent: (column: any) => <DebouncedTextFilter column={column} placeholder="NIGEND..." />
        }
      },
      {
        accessorKey: 'unite',
        header: 'Unité',
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-900">
            {getValue<string>() || '-'}
          </span>
        ),
        enableColumnFilter: true,
        meta: {
          filterComponent: (column: any) => <DebouncedTextFilter column={column} placeholder="Unité..." />
        }
      },
      {
        accessorKey: 'commune',
        header: 'Commune',
        cell: ({ getValue }) => (
          <div className="text-sm text-gray-900">
            {getValue<string>() || '-'}
          </div>
        ),
        enableColumnFilter: true,
        meta: {
          filterComponent: (column: any) => <DebouncedTextFilter column={column} placeholder="Commune..." />
        }
      }
    ],
    [onEdit, onDelete, onAddToDossier, handleViewDossier, selectedDemandes, facets, user, canDelete, handleSelectDemande]
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
    },
    clearSelection: () => {
      setSelectedDemandes(new Set())
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
      {/* Notification de copie */}
      {copySuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <CheckIcon className="h-5 w-5" />
          <span className="text-sm font-medium">{copySuccess}</span>
        </div>
      )}

      {/* Menu contextuel */}
      {contextMenu.show && contextMenu.demande && (
        <div
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[200px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleCopyString}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
          >
            <ClipboardDocumentListIcon className="h-4 w-4" />
            <span>Copier les informations</span>
          </button>
          <div className="border-t border-gray-200 my-1"></div>
          <div className="px-4 py-2">
            <div className="text-xs text-gray-500 font-medium mb-1">Aperçu:</div>
            <div className="text-xs text-gray-600 break-all max-w-xs">
              {generateDemandeString(contextMenu.demande).substring(0, 100)}...
            </div>
          </div>
        </div>
      )}

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
                title="Effacer tous les filtres et afficher toutes les demandes"
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
                  title="Effacer tous les filtres et afficher toutes les demandes"
                >
                  Effacer tous les filtres
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'actions pour la sélection multiple */}
      {selectedDemandes.size > 0 && (onCreateDossierWithSelection || onLinkToExistingDossier || onBulkAssignToUser) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mt-4 mb-4 mx-4 sm:mx-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm font-medium text-blue-900">
                  {selectedDemandes.size} demande{selectedDemandes.size > 1 ? 's' : ''} sélectionnée{selectedDemandes.size > 1 ? 's' : ''}
                </span>
              </div>
              <span className="text-xs text-blue-700">
                (demandes non liées à un dossier, utilisateur ou BAP)
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={() => setSelectedDemandes(new Set())}
                className="px-3 py-2 text-xs text-blue-700 hover:text-blue-900 border border-blue-300 rounded hover:bg-blue-100 transition-colors text-center"
              >
                Désélectionner tout
              </button>
              {onBulkAssignToUser && user?.role === 'ADMIN' && (
                <button
                  onClick={() => {
                    setModalKey(prev => prev + 1)
                    setShowAssignerLotModal(true)
                  }}
                  className="px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <UserPlusIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">Attribuer à un rédacteur</span>
                </button>
              )}
              {onLinkToExistingDossier && (
                <button
                  onClick={() => onLinkToExistingDossier(getSelectedDemandesData())}
                  className="px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <FolderIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">Lier à un dossier</span>
                </button>
              )}
              {onCreateDossierWithSelection && (
                <button
                  onClick={() => onCreateDossierWithSelection(getSelectedDemandesData())}
                  className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <PlusIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">Créer un dossier</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
                            {header.column.id === 'select' ? (
                              flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )
                            ) : (
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
                            )}
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
                  onContextMenu={(e) => handleContextMenu(e, row.original)}
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

      {/* Modal pour assigner des BAP */}
      <AssignerBAPModal
        isOpen={showBAPModal}
        onClose={() => setShowBAPModal(false)}
        demandeId={selectedDemandeId}
        demandeNumeroDS={selectedDemandeNumeroDS}
        currentBAP={currentBAP}
      />

      {/* Modal pour assigner des demandes en lot */}
      <AssignerDemandesLotModal
        key={modalKey}
        isOpen={showAssignerLotModal}
        onClose={() => {
          setShowAssignerLotModal(false)
          setSelectedDemandes(new Set())
        }}
        onSuccess={() => {
          setSelectedDemandes(new Set())
        }}
        selectedDemandes={getSelectedDemandesData()}
      />
    </div>
  )
})

DemandesTableV2.displayName = 'DemandesTableV2'

export default DemandesTableV2
