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
  createColumnHelper,
  SortingState,
  ColumnFiltersState
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
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import DebouncedInput from '@/components/common/DebouncedInput'
import SearchBar from '@/components/tables/SearchBar'

dayjs.locale('fr')

interface DemandesTableProps {
  demandes: Demande[]
  onView: (demande: Demande) => void
  onEdit: (demande: Demande) => void
  onDelete: (demande: Demande) => void
  onAddToDossier: (demande: Demande) => void
  loading?: boolean
  // Server-side props (TanStack officiel)
  globalFilter: string
  onGlobalFilterChange: (value: string) => void
  pagination: {
    pageIndex: number
    pageSize: number
  }
  onPaginationChange: (updater: any) => void
  totalRows: number
  pageCount: number
  filters: {
    type: string
    dateDebut: string
    dateFin: string
    assigneAId: string
  }
  onFilterChange: (filterName: string, value: string) => void
}

const columnHelper = createColumnHelper<Demande>()

// Fonctions utilitaires
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


const DemandesTable: React.FC<DemandesTableProps> = ({
  demandes,
  onView,
  onEdit,
  onDelete,
  onAddToDossier,
  loading = false,
  globalFilter,
  onGlobalFilterChange,
  pagination,
  onPaginationChange,
  totalRows,
  pageCount,
  filters,
  onFilterChange
}) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

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
      enableColumnFilter: true,
      filterFn: 'includesString'
    }),
    columnHelper.accessor('dateReception', {
      header: 'Date réception',
      cell: ({ getValue }) => (
        <div className="text-sm text-gray-900">
          {dayjs(getValue()).format('DD/MM/YYYY')}
        </div>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString'
    }),
    columnHelper.accessor('prenom', {
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
      enableSorting: false,
      enableColumnFilter: true,
      filterFn: (row, _, filterValue) => {
        if (!filterValue) return true
        const fullName = `${row.original.grade || ''} ${row.original.prenom} ${row.original.nom} ${row.original.nigend || ''}`.toLowerCase()
        return fullName.includes(filterValue.toLowerCase())
      }
    }),
    columnHelper.accessor('unite', {
      header: 'Unité',
      cell: ({ getValue }) => (
        <span className="text-sm text-gray-900">
          {getValue() || '-'}
        </span>
      ),
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: 'includesString'
    }),
    columnHelper.accessor('commune', {
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
      enableSorting: false,
      enableColumnFilter: true,
      filterFn: (row, _, filterValue) => {
        if (!filterValue) return true
        const commune = row.original.commune?.toLowerCase() || ''
        return commune.includes(filterValue.toLowerCase())
      }
    }),
    columnHelper.accessor('resume', {
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
      enableSorting: false,
      enableColumnFilter: true,
      filterFn: (row, _, filterValue) => {
        if (!filterValue) return true
        if (filterValue === 'non-lie') return !row.original.dossier
        if (filterValue === 'lie') return !!row.original.dossier
        const dossierInfo = `${row.original.dossier?.numero || ''} ${row.original.dossier?.sgami?.nom || ''}`.toLowerCase()
        return dossierInfo.includes(filterValue.toLowerCase())
      }
    }),
    columnHelper.accessor('blessures', {
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
      enableSorting: false,
      enableColumnFilter: true,
      filterFn: (row, _, filterValue) => {
        if (!filterValue) return true
        if (filterValue === 'non-assigne') return !row.original.assigneA
        if (filterValue === 'assigne') return !!row.original.assigneA
        const assigneInfo = `${row.original.assigneA?.grade || ''} ${row.original.assigneA?.prenom || ''} ${row.original.assigneA?.nom || ''}`.toLowerCase()
        return assigneInfo.includes(filterValue.toLowerCase())
      }
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
      enableColumnFilter: true,
      filterFn: (row, _, filterValue) => {
        if (!filterValue) return true
        if (filterValue === 'urgent') {
          if (!row.original.dateAudience) return false
          const daysDiff = dayjs(row.original.dateAudience).diff(dayjs(), 'day')
          return daysDiff >= 0 && daysDiff < 7
        }
        if (filterValue === 'proche') {
          if (!row.original.dateAudience) return false
          const daysDiff = dayjs(row.original.dateAudience).diff(dayjs(), 'day')
          return daysDiff >= 7 && daysDiff < 14
        }
        if (filterValue === 'sans-date') return !row.original.dateAudience
        return true
      }
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
      enableSorting: false,
      enableColumnFilter: false
    })
  ], [onView, onEdit, onDelete, onAddToDossier])

  const table = useReactTable({
    data: demandes,
    columns,
    state: {
      sorting,
      pagination
    },
    onSortingChange: setSorting,
    onPaginationChange: onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    // Server-side configuration (TanStack officiel)
    manualPagination: true,
    manualFiltering: true, 
    manualSorting: true,
    pageCount: pageCount,
    rowCount: totalRows
  })

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded-t-lg mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 mb-2 mx-4"></div>
          ))}
        </div>
      </div>
    )
  }

  // Empty state - différencier "pas de données" vs "recherche sans résultat"
  if (demandes.length === 0 && !loading) {
    const isSearching = globalFilter || Object.values(filters).some(f => f)
    
    if (isSearching) {
      // Recherche sans résultats - on garde la même SearchBar
      return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <SearchBar
            globalFilter={globalFilter}
            onGlobalFilterChange={onGlobalFilterChange}
            totalRows={totalRows}
            pageCount={pageCount}
            pagination={pagination}
          />

          {/* Message pas de résultats */}
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <MagnifyingGlassIcon className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun résultat</h3>
            <p className="text-gray-600">Essayez d'autres mots-clés ou effacez la recherche.</p>
          </div>
        </div>
      )
    } else {
      // Vraiment pas de données
      return (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m5-9H7a2 2 0 00-2 2v10a2 2 0 002-2V6a2 2 0 00-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande</h3>
          <p className="text-gray-600">Commencez par créer votre première demande.</p>
        </div>
      )
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <SearchBar
        globalFilter={globalFilter}
        onGlobalFilterChange={onGlobalFilterChange}
        totalRows={totalRows}
        pageCount={pageCount}
        pagination={pagination}
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
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center space-x-1 ${
                          header.column.getCanSort() ? 'cursor-pointer select-none hover:bg-gray-100 rounded px-2 py-1 -mx-2 -my-1' : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </span>
                        {header.column.getCanSort() && (
                          <div className="flex flex-col">
                            <ChevronUpIcon 
                              className={`h-3 w-3 ${header.column.getIsSorted() === 'asc' ? 'text-blue-600' : 'text-gray-400'}`}
                            />
                            <ChevronDownIcon 
                              className={`h-3 w-3 -mt-1 ${header.column.getIsSorted() === 'desc' ? 'text-blue-600' : 'text-gray-400'}`}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-gray-50"
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Server-side Pagination */}
      <div className="bg-gray-50 px-6 py-3 border-t flex items-center justify-between">
        <div className="flex-1 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Page{' '}
            <strong>
              {pagination.pageIndex + 1} sur{' '}
              {pageCount}
            </strong>{' '}
            — Affichage de{' '}
            <strong>{demandes.length}</strong> sur{' '}
            <strong>{totalRows.toLocaleString()}</strong> demande(s)
            {(globalFilter || Object.values(filters).some(f => f)) && (
              <span className="text-blue-600"> (filtrées)</span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <span className="px-3 py-2 text-sm text-gray-700">
              {pagination.pageIndex + 1}
            </span>
            <button
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DemandesTable