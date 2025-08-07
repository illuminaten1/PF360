import React, { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type PaginationState
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

dayjs.locale('fr')

interface DemandesTableProps {
  data: Demande[]
  totalCount: number
  loading?: boolean
  pagination: PaginationState
  sorting: SortingState
  onPaginationChange: (pagination: PaginationState | ((old: PaginationState) => PaginationState)) => void
  onSortingChange: (sorting: SortingState | ((old: SortingState) => SortingState)) => void
  onView: (demande: Demande) => void
  onEdit: (demande: Demande) => void
  onDelete: (demande: Demande) => void
  onAddToDossier: (demande: Demande) => void
}

const DemandesTable: React.FC<DemandesTableProps> = ({
  data,
  totalCount,
  loading = false,
  pagination,
  sorting,
  onPaginationChange,
  onSortingChange,
  onView,
  onEdit,
  onDelete,
  onAddToDossier
}) => {
  const getTypeColor = (type: string) => {
    return type === 'VICTIME' ? 'bg-sky-100 text-sky-800' : 'bg-orange-100 text-orange-800'
  }

  const getTypeLabel = (type: string) => {
    return type === 'VICTIME' ? 'Victime' : 'Mis en cause'
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
        cell: ({ row, getValue }) => (
          <div>
            <div 
              className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
              onClick={() => onView(row.original)}
            >
              {getValue<string>()}
            </div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getTypeColor(row.original.type)}`}>
              {getTypeLabel(row.original.type)}
            </span>
          </div>
        ),
        size: 150
      },
      {
        accessorKey: 'dateReception',
        header: 'Date réception',
        cell: ({ getValue }) => (
          <div className="text-sm text-gray-900">
            {dayjs(getValue<string>()).format('DD/MM/YYYY')}
          </div>
        ),
        size: 120
      },
      {
        accessorKey: 'militaire',
        header: 'Militaire',
        cell: ({ row }) => {
          const demande = row.original
          return (
            <div className="text-sm">
              <div className="font-medium text-gray-900">
                {demande.grade ? `${demande.grade} ` : ''}{demande.prenom} {demande.nom}
              </div>
              {demande.nigend && (
                <div className="text-gray-500 text-xs">
                  NIGEND: {demande.nigend}
                </div>
              )}
            </div>
          )
        },
        enableSorting: false,
        size: 200
      },
      {
        accessorKey: 'unite',
        header: 'Unité',
        cell: ({ getValue }) => (
          <span className="text-sm text-gray-900">
            {getValue<string>() || '-'}
          </span>
        ),
        size: 150
      },
      {
        accessorKey: 'dateFaits',
        header: 'Faits',
        cell: ({ row }) => {
          const demande = row.original
          return (
            <div className="text-sm">
              {demande.dateFaits && (
                <div className="text-gray-900">
                  {dayjs(demande.dateFaits).format('DD/MM/YYYY')}
                </div>
              )}
              {demande.commune && (
                <div className="text-gray-500 text-xs">
                  {demande.commune}
                </div>
              )}
            </div>
          )
        },
        enableSorting: false,
        size: 150
      },
      {
        accessorKey: 'dossier',
        header: 'Dossier',
        cell: ({ row }) => {
          const demande = row.original
          return demande.dossier ? (
            <div className="text-sm">
              <div className="font-medium text-blue-600">
                {demande.dossier.numero}
              </div>
              {demande.dossier.sgami && (
                <div className="text-gray-500 text-xs">
                  {demande.dossier.sgami.nom}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onAddToDossier(demande)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <FolderIcon className="h-4 w-4 mr-1" />
              Lier au dossier
            </button>
          )
        },
        enableSorting: false,
        size: 150
      },
      {
        accessorKey: 'assigneA',
        header: 'Assigné à',
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
        enableSorting: false,
        size: 150
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
        size: 180
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
        enableSorting: false,
        size: 120
      }
    ],
    [onView, onEdit, onDelete, onAddToDossier]
  )

  const table = useReactTable({
    data,
    columns,
    rowCount: totalCount,
    state: {
      pagination,
      sorting
    },
    onPaginationChange,
    onSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    manualSorting: true
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

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m5-9H7a2 2 0 00-2 2v10a2 2 0 002-2V6a2 2 0 00-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande</h3>
        <p className="text-gray-600">Aucune demande ne correspond aux critères de recherche.</p>
      </div>
    )
  }

  const pageCount = Math.ceil(totalCount / pagination.pageSize)

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    style={{ width: header.getSize() }}
                    onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                  >
                    <div className="flex items-center space-x-2">
                      <span>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
                      {header.column.getCanSort() && (
                        <span className="flex flex-col">
                          {header.column.getIsSorted() === 'asc' ? (
                            <ChevronUpIcon className="h-4 w-4 text-gray-400" />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                          ) : (
                            <div className="h-4 w-4"></div>
                          )}
                        </span>
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
              Affichage de {pagination.pageIndex * pagination.pageSize + 1} à{' '}
              {Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalCount)} sur{' '}
              {totalCount} résultats
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={pagination.pageSize}
              onChange={e => {
                onPaginationChange({
                  ...pagination,
                  pageSize: Number(e.target.value),
                  pageIndex: 0
                })
              }}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {[10, 20, 50, 100].map(pageSize => (
                <option key={pageSize} value={pageSize}>
                  {pageSize} par page
                </option>
              ))}
            </select>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onPaginationChange({ ...pagination, pageIndex: 0 })}
                disabled={pagination.pageIndex === 0}
                className="p-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                <ChevronLeftIcon className="h-4 w-4 -ml-2" />
              </button>
              
              <button
                onClick={() => onPaginationChange({ ...pagination, pageIndex: pagination.pageIndex - 1 })}
                disabled={pagination.pageIndex === 0}
                className="p-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              
              <span className="px-3 py-1 text-sm">
                Page {pagination.pageIndex + 1} sur {pageCount}
              </span>
              
              <button
                onClick={() => onPaginationChange({ ...pagination, pageIndex: pagination.pageIndex + 1 })}
                disabled={pagination.pageIndex >= pageCount - 1}
                className="p-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => onPaginationChange({ ...pagination, pageIndex: pageCount - 1 })}
                disabled={pagination.pageIndex >= pageCount - 1}
                className="p-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRightIcon className="h-4 w-4" />
                <ChevronRightIcon className="h-4 w-4 -ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DemandesTable