import React, { useMemo, useState, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState
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
  XMarkIcon
} from '@heroicons/react/24/outline'
import LoadingSpinner from '@/components/common/LoadingSpinner'

dayjs.locale('fr')

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
  const [data, setData] = useState<Demande[]>([])
  const [loading, setLoading] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'dateReception', desc: true }
  ])
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
        sortingFn: 'datetime'
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
    [editingCell, saving]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
          <h3 className="text-lg font-medium text-gray-900">
            Demandes sans décision - {selectedUser.grade && `${selectedUser.grade} `}{selectedUser.prenom} {selectedUser.nom}
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            {data.length} demande{data.length !== 1 ? 's' : ''} sans décision
          </p>
        </div>
      )}

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
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
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