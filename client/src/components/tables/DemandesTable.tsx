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
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

dayjs.locale('fr')

interface DemandesTableProps {
  demandes: Demande[]
  onView: (demande: Demande) => void
  onEdit: (demande: Demande) => void
  onDelete: (demande: Demande) => void
  onAddToDossier: (demande: Demande) => void
  loading?: boolean
  // Filtres intégrés
  searchTerm: string
  onSearchChange: (value: string) => void
  filters: {
    type: string
    dateDebut: string
    dateFin: string
    assigneAId: string
  }
  onFilterChange: (filterName: string, value: string) => void
  users: any[]
  showFilters: boolean
  onToggleFilters: () => void
  onClearFilters: () => void
  onTodayFilter: () => void
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
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  users,
  showFilters,
  onToggleFilters,
  onClearFilters,
  onTodayFilter
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
      enableGlobalFilter: true,
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
      enableGlobalFilter: true,
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
      enableGlobalFilter: true,
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
      enableGlobalFilter: true,
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
      enableGlobalFilter: true,
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
      enableGlobalFilter: true,
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
      enableGlobalFilter: true,
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
      enableGlobalFilter: true,
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
      columnFilters,
      globalFilter: searchTerm
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: onSearchChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    globalFilterFn: (row, _, filterValue) => {
      // Recherche uniquement dans Numéro DS, NIGEND, Nom/Prénom
      const numeroDS = row.original.numeroDS?.toLowerCase() || ''
      const nigend = row.original.nigend?.toLowerCase() || ''
      const nom = row.original.nom?.toLowerCase() || ''
      const prenom = row.original.prenom?.toLowerCase() || ''
      const nomComplet1 = `${prenom} ${nom}`.toLowerCase()
      const nomComplet2 = `${nom} ${prenom}`.toLowerCase()
      
      const searchValue = filterValue.toLowerCase()
      
      return numeroDS.includes(searchValue) || 
             nigend.includes(searchValue) ||
             nom.includes(searchValue) ||
             prenom.includes(searchValue) ||
             nomComplet1.includes(searchValue) ||
             nomComplet2.includes(searchValue)
    },
    initialState: {
      pagination: {
        pageSize: 50
      }
    }
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

  // Empty state
  if (demandes.length === 0) {
    return (
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
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Barre de recherche et filtres intégrés */}
      <div className="px-6 py-4 border-b border-gray-200">
        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par numéro DS, nom, NIGEND..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <button
            onClick={onToggleFilters}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filtres
          </button>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-8 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => onFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tous les types</option>
                  <option value="VICTIME">Victime</option>
                  <option value="MIS_EN_CAUSE">Mis en cause</option>
                </select>
              </div>
              <div className="flex flex-col justify-end">
                <button
                  onClick={onTodayFilter}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                >
                  Aujourd'hui
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date début</label>
                <input
                  type="date"
                  value={filters.dateDebut}
                  onChange={(e) => onFilterChange('dateDebut', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date fin</label>
                <input
                  type="date"
                  value={filters.dateFin}
                  onChange={(e) => onFilterChange('dateFin', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigné à</label>
                <select
                  value={filters.assigneAId}
                  onChange={(e) => onFilterChange('assigneAId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tous les utilisateurs</option>
                  <option value="null">Non assigné</option>
                  {users?.map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.grade && `${user.grade} `}{user.prenom} {user.nom}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col justify-end">
                <button
                  onClick={onClearFilters}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200"
                >
                  Effacer les filtres
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

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
      
      {/* Pagination */}
      <div className="bg-gray-50 px-6 py-3 border-t flex items-center justify-between">
        <div className="flex-1 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Page{' '}
            <strong>
              {table.getState().pagination.pageIndex + 1} sur{' '}
              {table.getPageCount()}
            </strong>{' '}
            — Affichage de{' '}
            <strong>{table.getRowModel().rows.length}</strong> sur{' '}
            <strong>{table.getFilteredRowModel().rows.length}</strong> demande(s)
            {table.getState().columnFilters.length > 0 && (
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