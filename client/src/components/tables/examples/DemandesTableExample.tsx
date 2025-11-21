/**
 * EXEMPLE D'UTILISATION DE ServerDataTable
 *
 * Ce fichier montre comment utiliser le composant ServerDataTable réutilisable
 * pour créer une table server-side avec Demandes.
 *
 * Comparez avec DemandesTableV2.tsx (1397 lignes) vs ce fichier (~300 lignes)
 */

import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef, SortingState, ColumnFiltersState, PaginationState } from '@tanstack/react-table'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { Demande } from '@/types'
import { ServerDataTable, ServerDataTableRef, DebouncedTextFilter, MultiSelectFilter, DateRangeFilter } from '@/components/tables'
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FolderIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

dayjs.locale('fr')

interface Facets {
  types?: string[]
  grades?: string[]
  baps?: Array<{ id: string; nom: string }>
  assigneA?: Array<{ id: string; fullName: string }>
}

interface DemandesTableExampleProps {
  onView: (demande: Demande) => void
  onEdit: (demande: Demande) => void
  onDelete: (demande: Demande) => void
  onAddToDossier: (demande: Demande) => void
  canDelete?: boolean
  facets?: Facets
}

const DemandesTableExample = React.forwardRef<ServerDataTableRef, DemandesTableExampleProps>(
  ({ onView, onEdit, onDelete, onAddToDossier, canDelete = true, facets }, ref) => {
    const navigate = useNavigate()

    // Helper functions
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
        return { type: 'passed', style: 'bg-gray-100 text-gray-800', icon: XCircleIcon }
      } else if (daysDiff < 7) {
        return { type: 'urgent', style: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon }
      } else if (daysDiff < 14) {
        return { type: 'soon', style: 'bg-orange-100 text-orange-800', icon: ClockIcon }
      } else {
        return { type: 'normal', style: 'bg-green-100 text-green-800', icon: CheckCircleIcon }
      }
    }

    // Define columns
    const columns = useMemo<ColumnDef<Demande>[]>(
      () => [
        {
          accessorKey: 'numeroDS',
          header: 'Numéro DS',
          cell: ({ getValue, row }) => (
            <div
              className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
              onClick={(e) => {
                e.stopPropagation()
                onView(row.original)
              }}
            >
              {getValue<string>()}
            </div>
          ),
          enableColumnFilter: true,
          meta: {
            filterComponent: (column: any) => <DebouncedTextFilter column={column} placeholder="N° DS..." />
          }
        },
        {
          accessorKey: 'dateReception',
          header: 'Réception',
          cell: ({ getValue }) => <div className="text-sm text-gray-900">{dayjs(getValue<string>()).format('DD/MM/YYYY')}</div>,
          enableColumnFilter: true,
          sortingFn: 'datetime',
          meta: {
            filterComponent: (column: any) => <DateRangeFilter column={column} />
          }
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
          meta: {
            filterComponent: (column: any) => (
              <MultiSelectFilter column={column} options={facets?.types || ['VICTIME', 'MIS_EN_CAUSE']} placeholder="Tous types" />
            )
          }
        },
        {
          id: 'grade',
          header: 'Grade',
          accessorFn: (row) => row.grade?.gradeAbrege || '-',
          cell: ({ getValue }) => <div className="text-sm text-gray-900">{getValue<string>()}</div>,
          enableColumnFilter: true,
          meta: {
            filterComponent: (column: any) => (
              <MultiSelectFilter column={column} options={facets?.grades || []} placeholder="Tous grades" />
            )
          }
        },
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
        {
          accessorKey: 'dateFaits',
          header: 'Date faits',
          cell: ({ getValue }) => {
            const date = getValue<string>()
            return date ? (
              <div className="text-sm text-gray-900">{dayjs(date).format('DD/MM/YYYY')}</div>
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
        {
          id: 'assigneA',
          header: 'Assigné à',
          accessorFn: (row) =>
            row.assigneA ? `${row.assigneA.grade || ''} ${row.assigneA.prenom} ${row.assigneA.nom}`.trim() : 'Non assigné',
          cell: ({ row }) => {
            const assigneA = row.original.assigneA
            return (
              <div className="text-sm">
                {assigneA ? (
                  <div className="text-gray-900">
                    {assigneA.grade && `${assigneA.grade} `}
                    {assigneA.prenom} {assigneA.nom}
                  </div>
                ) : (
                  <span className="text-gray-400 italic">Non assigné</span>
                )}
              </div>
            )
          },
          enableColumnFilter: true,
          meta: {
            filterComponent: (column: any) => (
              <MultiSelectFilter
                column={column}
                options={['Non assigné', ...(facets?.assigneA?.map((a) => a.fullName) || [])]}
                placeholder="Tous"
              />
            )
          }
        },
        {
          accessorKey: 'dateAudience',
          header: 'Date audience',
          cell: ({ getValue }) => {
            const dateAudience = getValue<string>()
            if (!dateAudience) {
              return (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">-</span>
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
                  {IconComponent && <IconComponent className="h-3 w-3 mr-1" />}
                  {dayjs(dateAudience).format('DD/MM/YYYY')}
                  {daysDiff >= 0 && <span className="ml-1">- {daysDiff} j.</span>}
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
        }
      ],
      [onView, onEdit, onDelete, onAddToDossier, canDelete, facets]
    )

    // Custom params builder for demandes API
    const buildDemandesParams = (
      pagination: PaginationState,
      sorting: SortingState,
      columnFilters: ColumnFiltersState,
      globalFilter: string
    ) => {
      const params: any = {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize
      }

      if (globalFilter) {
        params.search = globalFilter
      }

      if (sorting.length > 0) {
        const sort = sorting[0]
        params.sortBy = sort.id
        params.sortOrder = sort.desc ? 'desc' : 'asc'
      }

      // Demandes-specific filter mapping
      columnFilters.forEach((filter) => {
        const { id, value } = filter

        if (id === 'numeroDS' && value) {
          params.numeroDS = value
        } else if (id === 'nom' && value) {
          params.nom = value
        } else if (id === 'prenom' && value) {
          params.prenom = value
        } else if (id === 'type' && value) {
          params.type = Array.isArray(value) ? value : [value]
        } else if (id === 'grade' && value) {
          params.grade = Array.isArray(value) ? value : [value]
        } else if (id === 'assigneA' && value) {
          params.assigneA = Array.isArray(value) ? value : [value]
        } else if (id === 'dateReception' && typeof value === 'object' && !Array.isArray(value)) {
          const dateRange = value as { from?: string; to?: string }
          if (dateRange.from) params.dateDebut = dateRange.from
          if (dateRange.to) params.dateFin = dateRange.to
        } else if (id === 'dateFaits' && typeof value === 'object' && !Array.isArray(value)) {
          const dateRange = value as { from?: string; to?: string }
          if (dateRange.from) params.dateFaitsDebut = dateRange.from
          if (dateRange.to) params.dateFaitsFin = dateRange.to
        } else if (id === 'dateAudience' && typeof value === 'object' && !Array.isArray(value)) {
          const dateRange = value as { from?: string; to?: string }
          if (dateRange.from) params.dateAudienceDebut = dateRange.from
          if (dateRange.to) params.dateAudienceFin = dateRange.to
        }
      })

      return params
    }

    return (
      <ServerDataTable<Demande>
        ref={ref}
        endpoint="/demandes"
        queryKey="demandes"
        columns={columns}
        initialPageSize={50}
        initialSorting={[{ id: 'dateReception', desc: true }]}
        buildParams={buildDemandesParams}
        onRowClick={onView}
        emptyMessage="Aucune demande trouvée"
        transform={(data) => ({
          data: data?.demandes || [],
          total: data?.total || 0,
          pageCount: data?.pagination?.pages || 0
        })}
      />
    )
  }
)

DemandesTableExample.displayName = 'DemandesTableExample'

export default DemandesTableExample
