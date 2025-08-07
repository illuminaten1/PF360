import React, { useMemo, useRef, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
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
  ChevronDownIcon
} from '@heroicons/react/24/outline'

dayjs.locale('fr')

interface DemandesTableProps {
  demandes: Demande[]
  onView: (demande: Demande) => void
  onEdit: (demande: Demande) => void
  onDelete: (demande: Demande) => void
  onAddToDossier: (demande: Demande) => void
  loading?: boolean
}

const columnHelper = createColumnHelper<Demande>()

// Fonctions utilitaires déplacées hors du composant
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

// Composant de loading
const LoadingTable = () => (
  <div className="bg-white rounded-lg shadow">
    <div className="animate-pulse">
      <div className="h-12 bg-gray-200 rounded-t-lg mb-4"></div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 mb-2 mx-4"></div>
      ))}
    </div>
  </div>
)

// Composant empty state
const EmptyTable = () => (
  <div className="bg-white rounded-lg shadow p-8 text-center">
    <div className="text-gray-400 mb-4">
      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m5-9H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2z" />
      </svg>
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande</h3>
    <p className="text-gray-600">Commencez par créer votre première demande.</p>
  </div>
)

const DemandesTable: React.FC<DemandesTableProps> = ({
  demandes,
  onView,
  onEdit,
  onDelete,
  onAddToDossier,
  loading = false
}) => {
  // Tous les hooks en premier, inconditionnellement
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const parentRef = useRef<HTMLDivElement>(null)

  const columns = useMemo(() => [
    columnHelper.accessor('numeroDS', {
      header: 'Numéro DS',
      cell: ({ row }) => (
        <div>
          <div 
            className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
            onClick={() => onView(row.original)}
          >
            {row.original.numeroDS}
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getTypeColor(row.original.type)}`}>
            {getTypeLabel(row.original.type)}
          </span>
        </div>
      ),
      enableSorting: true,
      sortingFn: 'alphanumeric'
    }),
    columnHelper.accessor('dateReception', {
      header: 'Date réception',
      cell: ({ getValue }) => (
        <div className="text-sm text-gray-900">
          {dayjs(getValue()).format('DD/MM/YYYY')}
        </div>
      ),
      enableSorting: true,
      sortingFn: 'datetime'
    }),
    columnHelper.display({
      id: 'militaire',
      header: 'Militaire',
      cell: ({ row }) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {row.original.grade ? `${row.original.grade} ` : ''}{row.original.prenom} {row.original.nom}
          </div>
          {row.original.nigend && (
            <div className="text-gray-500 text-xs">
              NIGEND: {row.original.nigend}
            </div>
          )}
        </div>
      ),
      enableSorting: false
    }),
    columnHelper.accessor('unite', {
      header: 'Unité',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-900">
          {getValue() || '-'}
        </span>
      ),
      enableSorting: true,
      sortingFn: 'alphanumeric'
    }),
    columnHelper.display({
      id: 'faits',
      header: 'Faits',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.dateFaits && (
            <div className="text-gray-900">
              {dayjs(row.original.dateFaits).format('DD/MM/YYYY')}
            </div>
          )}
          {row.original.commune && (
            <div className="text-gray-500 text-xs">
              {row.original.commune}
            </div>
          )}
        </div>
      ),
      enableSorting: false
    }),
    columnHelper.display({
      id: 'dossier',
      header: 'Dossier',
      cell: ({ row }) => (
        row.original.dossier ? (
          <div className="text-sm">
            <div className="font-medium text-blue-600">
              {row.original.dossier.numero}
            </div>
            {row.original.dossier.sgami && (
              <div className="text-gray-500 text-xs">
                {row.original.dossier.sgami.nom}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => onAddToDossier(row.original)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <FolderIcon className="h-4 w-4 mr-1" />
            Lier au dossier
          </button>
        )
      ),
      enableSorting: false
    }),
    columnHelper.display({
      id: 'assigneA',
      header: 'Assigné à',
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.assigneA ? (
            <div className="text-gray-900">
              <div className="font-medium">
                {row.original.assigneA.grade && `${row.original.assigneA.grade} `}{row.original.assigneA.prenom} {row.original.assigneA.nom}
              </div>
            </div>
          ) : (
            <span className="text-gray-500 italic">Non assigné</span>
          )}
        </div>
      ),
      enableSorting: false
    }),
    columnHelper.accessor('dateAudience', {
      header: 'Date audience',
      cell: ({ getValue }) => {
        const dateAudience = getValue()
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
      enableSorting: true,
      sortingFn: 'datetime'
    }),
    columnHelper.display({
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
      enableSorting: false
    })
  ], [onView, onEdit, onDelete, onAddToDossier])

  const table = useReactTable({
    data: demandes,
    columns,
    state: {
      sorting,
      columnFilters
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  })

  const { rows } = table.getRowModel()
  
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 70,
    overscan: 10
  })

  // Rendu conditionnel APRÈS tous les hooks
  if (loading) {
    return <LoadingTable />
  }

  if (demandes.length === 0) {
    return <EmptyTable />
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div 
        ref={parentRef}
        className="overflow-auto"
        style={{ height: '600px' }}
      >
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0 z-10">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center space-x-1">
                      <span>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </span>
                      {header.column.getCanSort() && (
                        <span className="flex flex-col">
                          <ChevronUpIcon 
                            className={`h-3 w-3 ${header.column.getIsSorted() === 'asc' ? 'text-blue-600' : 'text-gray-400'}`}
                          />
                          <ChevronDownIcon 
                            className={`h-3 w-3 -mt-1 ${header.column.getIsSorted() === 'desc' ? 'text-blue-600' : 'text-gray-400'}`}
                          />
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              position: 'relative'
            }}
          >
            {virtualizer.getVirtualItems().map(virtualRow => {
              const row = rows[virtualRow.index]
              return (
                <tr
                  key={row.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="border-b border-gray-200 hover:bg-gray-50"
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DemandesTable