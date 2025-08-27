import React, { useMemo, useState, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getFacetedUniqueValues,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState
} from '@tanstack/react-table'
import { api } from '@/utils/api'
import { Demande } from '@/types'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  FolderIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useNavigate } from 'react-router-dom'
import { exportRevueDecisions } from '@/utils/excelExport'

dayjs.locale('fr')

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

interface RevueDecisionsTableProps {
  selectedUserId: string
  selectedUser?: {
    id: string
    nom: string
    prenom: string
    grade?: string
  }
}

interface EditingCell {
  demandeId: string
  value: string
}

const RevueDecisionsTable: React.FC<RevueDecisionsTableProps> = ({ 
  selectedUserId, 
  selectedUser 
}) => {
  const navigate = useNavigate()
  const [data, setData] = useState<Demande[]>([])
  const [loading, setLoading] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'dateReception', desc: true }
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (selectedUserId) {
      fetchDemandesSansDecision()
    } else {
      setData([])
    }
  }, [selectedUserId])

  const fetchDemandesSansDecision = async () => {
    if (!selectedUserId) return
    
    try {
      setLoading(true)
      // Récupérer toutes les demandes de l'utilisateur sans décision
      const response = await api.get('/demandes', {
        params: {
          assigneAId: selectedUserId,
          limit: 1000 // Grande limite pour récupérer toutes les demandes
        }
      })
      
      // Filtrer côté client les demandes sans décision
      const demandesSansDecision = response.data.demandes.filter((demande: Demande) => 
        !demande.decisions || demande.decisions.length === 0
      )
      
      setData(demandesSansDecision)
    } catch (error) {
      console.error('Error fetching demandes sans décision:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const handleEditComment = (demandeId: string, currentValue: string) => {
    setEditingCell({
      demandeId,
      value: currentValue || ''
    })
  }

  const handleSaveComment = async () => {
    if (!editingCell) return

    try {
      setSaving(true)
      await api.put(`/demandes/${editingCell.demandeId}`, {
        commentaireDecision: editingCell.value
      })

      // Mettre à jour les données localement
      setData(prevData => 
        prevData.map(demande => 
          demande.id === editingCell.demandeId 
            ? { ...demande, commentaireDecision: editingCell.value }
            : demande
        )
      )

      setEditingCell(null)
    } catch (error) {
      console.error('Error saving comment:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingCell(null)
  }

  const handleViewDossier = (dossierId: string) => {
    navigate(`/dossiers/${dossierId}`)
  }

  const handleExportExcel = () => {
    if (data.length === 0) return
    exportRevueDecisions(table.getFilteredRowModel().rows.map(row => row.original), selectedUser)
  }

  const getTypeColor = (type: string) => {
    return type === 'VICTIME' ? 'bg-sky-100 text-sky-800' : 'bg-orange-100 text-orange-800'
  }

  const getTypeLabel = (type: string) => {
    return type === 'VICTIME' ? 'Victime' : 'Mis en cause'
  }

  const columns = useMemo<ColumnDef<Demande>[]>(
    () => [
      {
        accessorKey: 'nom',
        header: 'Nom',
        cell: ({ getValue }) => (
          <div className="font-medium text-gray-900">
            {getValue<string>()}
          </div>
        )
      },
      {
        accessorKey: 'prenom',
        header: 'Prénom',
        cell: ({ getValue }) => (
          <div className="text-gray-900">
            {getValue<string>()}
          </div>
        )
      },
      {
        accessorKey: 'type',
        header: 'Qualité',
        cell: ({ getValue }) => {
          const type = getValue<string>()
          return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(type)}`}>
              {getTypeLabel(type)}
            </span>
          )
        },
        enableColumnFilter: true,
        filterFn: (row: any, id: any, value: any) => {
          return value?.length === 0 ? true : value?.includes(row.getValue(id))
        }
      },
      {
        accessorKey: 'dateReception',
        header: 'Date de réception',
        cell: ({ getValue }) => (
          <div className="text-sm text-gray-900">
            {dayjs(getValue<string>()).format('DD/MM/YYYY')}
          </div>
        ),
        sortingFn: 'datetime',
        enableColumnFilter: true,
        filterFn: (row: any, id: any, value: any) => {
          if (!value) return true
          
          const rowDate = dayjs(row.getValue(id))
          const { from, to } = value
          
          if (from && to) {
            return rowDate.isAfter(dayjs(from).subtract(1, 'day')) && rowDate.isBefore(dayjs(to).add(1, 'day'))
          } else if (from) {
            return rowDate.isAfter(dayjs(from).subtract(1, 'day'))
          } else if (to) {
            return rowDate.isBefore(dayjs(to).add(1, 'day'))
          }
          
          return true
        }
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
                onClick={(e) => {
                  e.stopPropagation()
                  handleViewDossier(demande.dossier!.id)
                }}
              >
                {demande.dossier.numero}
              </div>
            </div>
          ) : (
            <span className="text-sm text-gray-400 italic">Non lié</span>
          )
        },
        enableColumnFilter: true,
        filterFn: 'includesString',
        sortingFn: (rowA, rowB, columnId) => {
          const a = rowA.getValue(columnId) as string
          const b = rowB.getValue(columnId) as string
          
          if (a === 'Non lié' && b === 'Non lié') return 0
          if (a === 'Non lié') return 1
          if (b === 'Non lié') return -1
          
          return a.localeCompare(b, 'fr', { numeric: true })
        }
      },
      {
        accessorKey: 'commentaireDecision',
        header: 'Commentaire',
        cell: ({ row, getValue }) => {
          const demande = row.original
          const currentValue = getValue<string>()
          const isEditing = editingCell?.demandeId === demande.id

          if (isEditing) {
            return (
              <div className="flex items-center space-x-2 min-w-0">
                <input
                  type="text"
                  value={editingCell.value}
                  onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ajouter un commentaire..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveComment()
                    } else if (e.key === 'Escape') {
                      handleCancelEdit()
                    }
                  }}
                />
                <button
                  onClick={handleSaveComment}
                  disabled={saving}
                  className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                  title="Sauvegarder"
                >
                  <CheckIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="p-1 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                  title="Annuler"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            )
          }

          return (
            <div className="flex items-center space-x-2 min-w-0 group">
              <div className="flex-1 min-w-0">
                {currentValue ? (
                  <span className="text-sm text-gray-900">{currentValue}</span>
                ) : (
                  <span className="text-sm text-gray-400 italic">Aucun commentaire</span>
                )}
              </div>
              <button
                onClick={() => handleEditComment(demande.id, currentValue)}
                className="p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Modifier le commentaire"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            </div>
          )
        },
        enableSorting: false
      }
    ],
    [editingCell, saving, handleViewDossier]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    initialState: {
      pagination: {
        pageSize: 25
      }
    }
  })

  if (!selectedUserId) {
    return (
      <div className="p-8 text-center">
        <div className="flex flex-col items-center">
          <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun utilisateur sélectionné</h3>
          <p className="text-sm text-gray-500">
            Veuillez sélectionner un utilisateur pour voir ses demandes sans décision.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="bg-white">
      {/* En-tête avec informations utilisateur */}
      {selectedUser && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Demandes sans décision - {selectedUser.grade && `${selectedUser.grade} `}{selectedUser.prenom} {selectedUser.nom}
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                {data.length} demande{data.length !== 1 ? 's' : ''} sans décision
              </p>
            </div>
            {data.length > 0 && (
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Exporter vers Excel"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Exporter Excel
              </button>
            )}
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
                    <div className="flex flex-col space-y-2 min-h-[80px]">
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
                    <p className="text-sm font-medium text-gray-900 mb-1">Aucune demande sans décision</p>
                    <p className="text-sm text-gray-500">Toutes les demandes de cet utilisateur ont une décision</p>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
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
      {table.getRowModel().rows.length > 0 && (
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
      )}
    </div>
  )
}

export default RevueDecisionsTable