import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { Demande } from '@/types'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import {
  EyeIcon,
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
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import SearchBar from './SearchBar'

dayjs.locale('fr')

interface DemandesTableProps {
  data: Demande[]
  loading?: boolean
  onView: (demande: Demande) => void
  onEdit: (demande: Demande) => void
  onDelete: (demande: Demande) => void
  onAddToDossier: (demande: Demande) => void
  canDelete?: boolean
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

function TypeMultiSelectFilter({ column }: { column: any }) {
  const columnFilterValue = (column.getFilterValue() ?? []) as string[]
  const [isOpen, setIsOpen] = React.useState(false)
  
  // Utiliser getFacetedUniqueValues() pour récupérer les types
  const uniqueTypes = useMemo(() => {
    const uniqueValues = Array.from(column.getFacetedUniqueValues().keys())
    return uniqueValues.filter(Boolean).sort()
  }, [column])
  
  // Fonction pour obtenir le label français
  const getTypeLabel = (type: string) => {
    return type === 'VICTIME' ? 'Victime' : 'Mis en cause'
  }
  
  const handleToggleType = (type: string) => {
    const currentFilters = [...columnFilterValue]
    const index = currentFilters.indexOf(type)
    
    if (index > -1) {
      currentFilters.splice(index, 1)
    } else {
      currentFilters.push(type)
    }
    
    column.setFilterValue(currentFilters.length > 0 ? currentFilters : undefined)
  }
  
  const clearAll = () => {
    column.setFilterValue(undefined)
  }
  
  const selectAll = () => {
    column.setFilterValue([...uniqueTypes])
  }
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-32 border shadow rounded px-2 py-1 text-xs text-left bg-white hover:bg-gray-50 flex items-center justify-between"
      >
        <span className="truncate">
          {columnFilterValue.length === 0 
            ? 'Tous' 
            : columnFilterValue.length === uniqueTypes.length
            ? 'Tous'
            : `${columnFilterValue.length} sélectionné${columnFilterValue.length > 1 ? 's' : ''}`
          }
        </span>
        <span className="text-gray-400">▼</span>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
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
            {uniqueTypes.map(type => (
              <label key={String(type)} className="flex items-center px-2 py-1 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={columnFilterValue.includes(String(type))}
                  onChange={() => handleToggleType(String(type))}
                  className="mr-2 text-blue-600"
                />
                <span className="text-xs">{getTypeLabel(String(type))}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      
      {/* Overlay pour fermer le dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

function GradeMultiSelectFilter({ column }: { column: any }) {
  const columnFilterValue = (column.getFilterValue() ?? []) as string[]
  const [isOpen, setIsOpen] = React.useState(false)
  
  // Utiliser getFacetedUniqueValues() pour récupérer les grades
  const uniqueGrades = useMemo(() => {
    const uniqueValues = Array.from(column.getFacetedUniqueValues().keys())
    return uniqueValues.filter(Boolean).sort()
  }, [column])
  
  const handleToggleGrade = (grade: string) => {
    const currentFilters = [...columnFilterValue]
    const index = currentFilters.indexOf(grade)
    
    if (index > -1) {
      currentFilters.splice(index, 1)
    } else {
      currentFilters.push(grade)
    }
    
    column.setFilterValue(currentFilters.length > 0 ? currentFilters : undefined)
  }
  
  const clearAll = () => {
    column.setFilterValue(undefined)
  }
  
  const selectAll = () => {
    column.setFilterValue([...uniqueGrades])
  }
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-32 border shadow rounded px-2 py-1 text-xs text-left bg-white hover:bg-gray-50 flex items-center justify-between"
      >
        <span className="truncate">
          {columnFilterValue.length === 0 
            ? 'Tous' 
            : columnFilterValue.length === uniqueGrades.length
            ? 'Tous'
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
            {uniqueGrades.map(grade => (
              <label key={String(grade)} className="flex items-center px-2 py-1 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={columnFilterValue.includes(String(grade))}
                  onChange={() => handleToggleGrade(String(grade))}
                  className="mr-2 text-blue-600"
                />
                <span className="text-xs truncate">{String(grade)}</span>
              </label>
            ))}
            {uniqueGrades.length === 0 && (
              <div className="px-2 py-1 text-xs text-gray-500">Aucun grade disponible</div>
            )}
          </div>
        </div>
      )}
      
      {/* Overlay pour fermer le dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

function AssigneAMultiSelectFilter({ column }: { column: any }) {
  const columnFilterValue = (column.getFilterValue() ?? []) as string[]
  const [isOpen, setIsOpen] = React.useState(false)
  
  // Utiliser getFacetedUniqueValues() pour récupérer les assignations
  const uniqueAssignations = useMemo(() => {
    const uniqueValues = Array.from(column.getFacetedUniqueValues().keys())
    return uniqueValues.filter(Boolean).sort()
  }, [column])
  
  const handleToggleAssignation = (assignation: string) => {
    const currentFilters = [...columnFilterValue]
    const index = currentFilters.indexOf(assignation)
    
    if (index > -1) {
      currentFilters.splice(index, 1)
    } else {
      currentFilters.push(assignation)
    }
    
    column.setFilterValue(currentFilters.length > 0 ? currentFilters : undefined)
  }
  
  const clearAll = () => {
    column.setFilterValue(undefined)
  }
  
  const selectAll = () => {
    column.setFilterValue([...uniqueAssignations])
  }
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-32 border shadow rounded px-2 py-1 text-xs text-left bg-white hover:bg-gray-50 flex items-center justify-between"
      >
        <span className="truncate">
          {columnFilterValue.length === 0 
            ? 'Tous' 
            : columnFilterValue.length === uniqueAssignations.length
            ? 'Tous'
            : `${columnFilterValue.length} sélectionné${columnFilterValue.length > 1 ? 's' : ''}`
          }
        </span>
        <span className="text-gray-400">▼</span>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
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
            {uniqueAssignations.map(assignation => (
              <label key={String(assignation)} className="flex items-center px-2 py-1 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={columnFilterValue.includes(String(assignation))}
                  onChange={() => handleToggleAssignation(String(assignation))}
                  className="mr-2 text-blue-600"
                />
                <span className="text-xs truncate">{String(assignation)}</span>
              </label>
            ))}
            {uniqueAssignations.length === 0 && (
              <div className="px-2 py-1 text-xs text-gray-500">Aucune assignation disponible</div>
            )}
          </div>
        </div>
      )}
      
      {/* Overlay pour fermer le dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

function BadgesMultiSelectFilter({ column }: { column: any }) {
  const columnFilterValue = (column.getFilterValue() ?? []) as string[]
  const [isOpen, setIsOpen] = React.useState(false)
  
  // Utiliser getFacetedUniqueValues() comme suggéré
  const uniqueBadges = useMemo(() => {
    const uniqueValues = Array.from(column.getFacetedUniqueValues().keys())
    return uniqueValues.filter(Boolean).sort()
  }, [column])
  
  const handleToggleBadge = (badgeName: string) => {
    const currentFilters = [...columnFilterValue]
    const index = currentFilters.indexOf(badgeName)
    
    if (index > -1) {
      currentFilters.splice(index, 1)
    } else {
      currentFilters.push(badgeName)
    }
    
    column.setFilterValue(currentFilters.length > 0 ? currentFilters : undefined)
  }
  
  const clearAll = () => {
    column.setFilterValue(undefined)
  }
  
  const selectAll = () => {
    column.setFilterValue([...uniqueBadges])
  }
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-32 border shadow rounded px-2 py-1 text-xs text-left bg-white hover:bg-gray-50 flex items-center justify-between"
      >
        <span className="truncate">
          {columnFilterValue.length === 0 
            ? 'Tous' 
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
            {uniqueBadges.map(badgeName => (
              <label key={String(badgeName)} className="flex items-center px-2 py-1 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={columnFilterValue.includes(String(badgeName))}
                  onChange={() => handleToggleBadge(String(badgeName))}
                  className="mr-2 text-blue-600"
                />
                <span className="text-xs truncate">{String(badgeName)}</span>
              </label>
            ))}
            {uniqueBadges.length === 0 && (
              <div className="px-2 py-1 text-xs text-gray-500">Aucun badge disponible</div>
            )}
          </div>
        </div>
      )}
      
      {/* Overlay pour fermer le dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

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
        <span className="truncate">
          {getDisplayText()}
        </span>
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
      
      {/* Overlay pour fermer le dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

const DemandesTable: React.FC<DemandesTableProps> = ({
  data,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onAddToDossier,
  canDelete = true
}) => {
  const navigate = useNavigate()
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'dateReception', desc: true }
  ])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState('')

  const getTypeColor = (type: string) => {
    return type === 'VICTIME' ? 'bg-sky-100 text-sky-800' : 'bg-orange-100 text-orange-800'
  }

  const getTypeLabel = (type: string) => {
    return type === 'VICTIME' ? 'Victime' : 'Mis en cause'
  }

  const handleViewDossier = (dossierId: string) => {
    navigate(`/dossiers/${dossierId}`)
  }

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

  const columns = useMemo<ColumnDef<Demande>[]>(
    () => [
      {
        accessorKey: 'numeroDS',
        header: 'Numéro DS',
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
        filterFn: (row, _columnId, filterValue: string[]) => {
          if (!filterValue || filterValue.length === 0) return true
          
          const type = row.getValue('type') as string
          return filterValue.includes(type)
        }
      },
      {
        id: 'badges',
        header: 'Badges',
        accessorFn: (row) => {
          const badges = row.badges || []
          return badges.map((badgeRel: any) => badgeRel.badge?.nom).filter(Boolean).join(', ')
        },
        cell: ({ row }) => {
          const demande = row.original
          const badges = demande.badges || []
          
          if (badges.length === 0) {
            return <span className="text-gray-400 text-xs">-</span>
          }
          
          return (
            <div className="flex flex-wrap gap-1">
              {badges.slice(0, 2).map((badgeRel: any) => (
                <span
                  key={badgeRel.badge.id}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                  style={badgeRel.badge.couleur ? {
                    backgroundColor: `${badgeRel.badge.couleur}20`,
                    color: badgeRel.badge.couleur
                  } : {}}
                >
                  {badgeRel.badge.nom}
                </span>
              ))}
              {badges.length > 2 && (
                <span className="text-xs text-gray-500">
                  +{badges.length - 2}
                </span>
              )}
            </div>
          )
        },
        enableColumnFilter: true,
        filterFn: (row, _columnId, filterValue: string[]) => {
          if (!filterValue || filterValue.length === 0) return true
          
          const demande = row.original
          const badges = demande.badges || []
          const badgeNames = badges.map((badgeRel: any) => badgeRel.badge?.nom).filter(Boolean)
          
          return filterValue.some(selectedBadge => badgeNames.includes(selectedBadge))
        }
      },
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
        filterFn: (row, _columnId, filterValue: { from?: string; to?: string }) => {
          if (!filterValue) return true
          
          const date = row.getValue('dateReception') as string
          const rowDate = dayjs(date).startOf('day')
          
          const fromDate = filterValue.from ? dayjs(filterValue.from).startOf('day') : null
          const toDate = filterValue.to ? dayjs(filterValue.to).startOf('day') : null
          
          if (fromDate && toDate) {
            return (rowDate.isAfter(fromDate) || rowDate.isSame(fromDate)) && 
                   (rowDate.isBefore(toDate) || rowDate.isSame(toDate))
          } else if (fromDate) {
            return rowDate.isAfter(fromDate) || rowDate.isSame(fromDate)
          } else if (toDate) {
            return rowDate.isBefore(toDate) || rowDate.isSame(toDate)
          }
          
          return true
        }
      },
      {
        accessorKey: 'nom',
        header: 'Nom',
        cell: ({ getValue }) => (
          <div className="font-medium text-gray-900">
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
        accessorKey: 'grade',
        header: 'Grade',
        cell: ({ getValue }) => (
          <div className="text-sm text-gray-900">
            {getValue<string>() || '-'}
          </div>
        ),
        enableColumnFilter: true,
        filterFn: (row, _columnId, filterValue: string[]) => {
          if (!filterValue || filterValue.length === 0) return true
          
          const grade = row.getValue('grade') as string
          return filterValue.includes(grade || '')
        }
      },
      {
        accessorKey: 'nigend',
        header: 'NIGEND',
        cell: ({ getValue }) => (
          <div className="text-sm text-gray-500">
            {getValue<string>() || '-'}
          </div>
        ),
        enableColumnFilter: true,
        filterFn: 'includesString'
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
        filterFn: 'includesString'
      },
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
        enableColumnFilter: false,
        sortingFn: 'datetime'
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
        filterFn: 'includesString'
      },
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
                onClick={() => handleViewDossier(demande.dossier!.id)}
              >
                {demande.dossier.numero}
              </div>
            </div>
          ) : (
            <button
              onClick={() => onAddToDossier(demande)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <FolderIcon className="h-4 w-4 mr-1" />
              Lier
            </button>
          )
        },
        enableColumnFilter: true,
        filterFn: 'includesString',
        enableSorting: false
      },
      {
        id: 'assigneA',
        header: 'Assigné à',
        accessorFn: (row) => row.assigneA ? `${row.assigneA.grade || ''} ${row.assigneA.prenom} ${row.assigneA.nom}`.trim() : 'Non assigné',
        cell: ({ row }) => {
          const assigneA = row.original.assigneA
          return (
            <div className="text-sm">
              {assigneA ? (
                <div className="text-gray-900">
                  <div className="font-medium">
                    {assigneA.grade && `${assigneA.grade} `}{assigneA.prenom} {assigneA.nom}
                  </div>
                </div>
              ) : (
                <span className="text-gray-500 italic">Non assigné</span>
              )}
            </div>
          )
        },
        enableColumnFilter: true,
        filterFn: (row, _columnId, filterValue: string[]) => {
          if (!filterValue || filterValue.length === 0) return true
          
          const assigneA = row.original.assigneA
          const assigneString = assigneA ? `${assigneA.grade || ''} ${assigneA.prenom} ${assigneA.nom}`.trim() : 'Non assigné'
          return filterValue.includes(assigneString)
        }
      },
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
            {canDelete && (
              <button
                onClick={() => onDelete(row.original)}
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
      }
    ],
    [onView, onEdit, onDelete, onAddToDossier, handleViewDossier]
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
                          {header.column.id === 'type' ? (
                            <TypeMultiSelectFilter column={header.column} />
                          ) : header.column.id === 'badges' ? (
                            <BadgesMultiSelectFilter column={header.column} />
                          ) : header.column.id === 'grade' ? (
                            <GradeMultiSelectFilter column={header.column} />
                          ) : header.column.id === 'assigneA' ? (
                            <AssigneAMultiSelectFilter column={header.column} />
                          ) : header.column.id === 'dateReception' ? (
                            <DateRangeFilter column={header.column} />
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
              {[10, 20, 50, 100, 200].map(pageSize => (
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

export default DemandesTable