import React, { useMemo, useState } from 'react'
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
  type Column
} from '@tanstack/react-table'
import { Dossier } from '@/types'
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
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import SearchBar from './SearchBar'
import LierDemandesModal from '../forms/LierDemandesModal'

dayjs.locale('fr')

interface DossiersTableProps {
  data: Dossier[]
  loading?: boolean
  onView: (dossier: Dossier) => void
  onEdit: (dossier: Dossier) => void
  onDelete: (dossier: Dossier) => void
}

function Filter({ column }: { column: Column<Dossier, unknown> }) {
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

function SGAMIMultiSelectFilter({ column }: { column: Column<Dossier, unknown> }) {
  const columnFilterValue = (column.getFilterValue() ?? []) as string[]
  const [isOpen, setIsOpen] = React.useState(false)

  const uniqueSGAMIs = useMemo(() => {
    const uniqueValues = Array.from(column.getFacetedUniqueValues().keys())
    return uniqueValues.filter(Boolean).sort()
  }, [column])

  const handleToggleSGAMI = (sgami: string) => {
    const currentFilters = [...columnFilterValue]
    const index = currentFilters.indexOf(sgami)

    if (index > -1) {
      currentFilters.splice(index, 1)
    } else {
      currentFilters.push(sgami)
    }

    column.setFilterValue(currentFilters.length > 0 ? currentFilters : undefined)
  }

  const clearAll = () => {
    column.setFilterValue(undefined)
  }

  const selectAll = () => {
    column.setFilterValue([...uniqueSGAMIs])
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
            : columnFilterValue.length === uniqueSGAMIs.length
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
            {uniqueSGAMIs.map(sgami => (
              <label key={String(sgami)} className="flex items-center px-2 py-1 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={columnFilterValue.includes(String(sgami))}
                  onChange={() => handleToggleSGAMI(String(sgami))}
                  className="mr-2 text-blue-600"
                />
                <span className="text-xs truncate">{String(sgami)}</span>
              </label>
            ))}
            {uniqueSGAMIs.length === 0 && (
              <div className="px-2 py-1 text-xs text-gray-500">Aucun SGAMI disponible</div>
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

function AssigneAMultiSelectFilter({ column }: { column: Column<Dossier, unknown> }) {
  const columnFilterValue = (column.getFilterValue() ?? []) as string[]
  const [isOpen, setIsOpen] = React.useState(false)

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

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

function BadgesMultiSelectFilter({ column }: { column: Column<Dossier, unknown> }) {
  const columnFilterValue = (column.getFilterValue() ?? []) as string[]
  const [isOpen, setIsOpen] = React.useState(false)

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
          // Afficher tous les demandeurs
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
          // Afficher les 2 premiers + bouton
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

const DossiersTable: React.FC<DossiersTableProps> = ({
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
        filterFn: 'includesString'
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
        filterFn: 'includesString'
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
          // Inclure TOUS les demandeurs pour la recherche - cette chaîne est utilisée pour le filtrage
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
        enableColumnFilter: true,
        filterFn: 'includesString',
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
        filterFn: (row, _columnId, filterValue: string[]) => {
          if (!filterValue || filterValue.length === 0) return true

          const sgami = row.original.sgami
          const sgamiName = sgami?.nom || 'Non assigné'
          return filterValue.includes(sgamiName)
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
        filterFn: (row, _columnId, filterValue: string[]) => {
          if (!filterValue || filterValue.length === 0) return true

          const assigneA = row.original.assigneA
          const assigneString = assigneA ? `${assigneA.grade || ''} ${assigneA.prenom} ${assigneA.nom}`.trim() : 'Non assigné'
          return filterValue.includes(assigneString)
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
        filterFn: (row, _columnId, filterValue: string[]) => {
          if (!filterValue || filterValue.length === 0) return true

          const dossier = row.original
          const badges = dossier.badges || []
          const badgeNames = badges.map((badgeRel) => badgeRel.badge?.nom).filter(Boolean)

          return filterValue.some(selectedBadge => badgeNames.includes(selectedBadge))
        },
        enableSorting: false
      },
      // {
      //   id: 'nombreDecisions',
      //   header: 'Décisions',
      //   accessorFn: (row) => row.stats?.nombreDecisions || row.decisions.length,
      //   cell: ({ getValue, row }) => {
      //     const nombre = getValue<number>()
      //     const decisions = row.original.decisions
      //     return (
      //       <div className="text-sm">
      //         <div className="text-gray-900">{nombre}</div>
      //         {decisions.length > 0 && (
      //           <div className="text-gray-500 text-xs">
      //             Dernière: {dayjs(decisions[0]?.date).format('DD/MM/YYYY')}
      //           </div>
      //         )}
      //       </div>
      //     )
      //   },
      //   enableColumnFilter: false,
      //   enableSorting: true
      // },
      // {
      //   id: 'totalConventions',
      //   header: 'Conventions (€)',
      //   accessorFn: (row) => row.stats?.totalConventionsHT || 0,
      //   cell: ({ getValue }) => (
      //     <div className="text-sm font-medium text-gray-900">
      //       {getValue<number>().toLocaleString('fr-FR')} €
      //     </div>
      //   ),
      //   enableColumnFilter: false,
      //   enableSorting: true
      // },
      // {
      //   id: 'totalPaiements',
      //   header: 'Paiements (€)',
      //   accessorFn: (row) => row.stats?.totalPaiementsTTC || 0,
      //   cell: ({ getValue }) => (
      //     <div className="text-sm text-gray-900">
      //       {getValue<number>().toLocaleString('fr-FR')} €
      //     </div>
      //   ),
      //   enableColumnFilter: false,
      //   enableSorting: true
      // },
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
                          {header.column.id === 'sgami' ? (
                            <SGAMIMultiSelectFilter column={header.column} />
                          ) : header.column.id === 'assigneA' ? (
                            <AssigneAMultiSelectFilter column={header.column} />
                          ) : header.column.id === 'badges' ? (
                            <BadgesMultiSelectFilter column={header.column} />
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
              <tr
                key={row.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onView(row.original)}
              >
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
      
      {/* Modal pour lier des demandes */}
      <LierDemandesModal
        isOpen={showLierDemandesModal}
        onClose={() => setShowLierDemandesModal(false)}
        dossierId={selectedDossierId}
        dossierNumero={selectedDossierNumero}
      />
    </div>
  )
}

export default DossiersTable