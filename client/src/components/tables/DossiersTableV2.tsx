import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef, SortingState, ColumnFiltersState, PaginationState } from '@tanstack/react-table'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { Dossier } from '@/types'
import { ServerDataTable, ServerDataTableRef, DebouncedTextFilter, MultiSelectFilter } from '@/components/tables'
import { PencilIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline'
import LierDemandesModal from '../forms/LierDemandesModal'

dayjs.locale('fr')

interface Facets {
  sgamis?: Array<{ id: string; nom: string }>
  assigneA?: Array<{ id: string; fullName: string }>
  badges?: Array<{ id: string; nom: string; couleur: string | null }>
}

interface DossiersTableV2Props {
  onView: (dossier: Dossier) => void
  onEdit: (dossier: Dossier) => void
  onDelete: (dossier: Dossier) => void
  facets?: Facets
}

// Custom cell component for demandeurs with expand/collapse
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
          // Show all demandeurs
          <div className="space-y-1">
            {dossier.demandes.map((d, index) => (
              <div key={index} className="flex items-center justify-between">
                <span>
                  {d.grade?.gradeAbrege ? `${d.grade.gradeAbrege} ` : ''}
                  {d.prenom} {d.nom}
                </span>
                {d.numeroDS && <span className="text-xs text-gray-500 ml-2">({d.numeroDS})</span>}
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
          // Show first 2 + button
          <div>
            {dossier.demandes.slice(0, 2).map((d, index) => (
              <div key={index} className={index > 0 ? 'mt-1' : ''}>
                <span>
                  {d.grade?.gradeAbrege ? `${d.grade.gradeAbrege} ` : ''}
                  {d.prenom} {d.nom}
                </span>
                {d.numeroDS && <span className="text-xs text-gray-500 ml-2">({d.numeroDS})</span>}
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

const DossiersTableV2 = React.forwardRef<ServerDataTableRef, DossiersTableV2Props>(
  ({ onView, onEdit, onDelete, facets }, ref) => {
    const navigate = useNavigate()
    const [showLierDemandesModal, setShowLierDemandesModal] = useState(false)
    const [selectedDossierId, setSelectedDossierId] = useState<string>('')
    const [selectedDossierNumero, setSelectedDossierNumero] = useState<string>('')

    // Define columns
    const columns = useMemo<ColumnDef<Dossier>[]>(
      () => [
        {
          accessorKey: 'numero',
          header: 'Numéro',
          cell: ({ getValue }) => <div className="font-medium text-gray-900">{getValue<string>()}</div>,
          enableColumnFilter: true,
          meta: {
            filterComponent: (column: any) => <DebouncedTextFilter column={column} placeholder="Numéro..." />
          }
        },
        {
          accessorKey: 'nomDossier',
          header: 'Nom du dossier',
          cell: ({ getValue }) => {
            const nomDossier = getValue<string>()
            return nomDossier ? (
              <div className="text-sm font-medium text-gray-900">{nomDossier}</div>
            ) : (
              <span className="text-gray-400 text-sm">-</span>
            )
          },
          enableColumnFilter: true,
          meta: {
            filterComponent: (column: any) => <DebouncedTextFilter column={column} placeholder="Nom..." />
          }
        },
        {
          id: 'nombreDemandes',
          header: 'Nb Demandes',
          accessorFn: (row) => row.stats?.nombreDemandes || row.demandes.length,
          cell: ({ getValue }) => <div className="text-sm font-medium text-gray-900">{getValue<number>()}</div>,
          enableColumnFilter: false,
          enableSorting: true
        },
        {
          id: 'demandeurs',
          header: 'Demandeurs',
          accessorFn: (row) => {
            if (row.demandes.length === 0) return 'Aucun'
            return row.demandes
              .map((d) => `${d.grade?.gradeAbrege ? `${d.grade.gradeAbrege} ` : ''}${d.prenom} ${d.nom} ${d.numeroDS || ''}`)
              .join(' | ')
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
          enableSorting: false,
          meta: {
            filterComponent: (column: any) => <DebouncedTextFilter column={column} placeholder="Demandeur..." />
          }
        },
        {
          id: 'sgami',
          header: 'SGAMI',
          accessorFn: (row) => row.sgami?.nom || 'Non assigné',
          cell: ({ row }) => {
            const sgami = row.original.sgami
            return (
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  sgami ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {sgami?.nom || 'Non assigné'}
              </span>
            )
          },
          enableColumnFilter: true,
          meta: {
            filterComponent: (column: any) => (
              <MultiSelectFilter
                column={column}
                options={['Non assigné', ...(facets?.sgamis?.map((s) => s.nom) || [])]}
                placeholder="Tous"
              />
            )
          }
        },
        {
          id: 'assigneA',
          header: 'Assigné à',
          accessorFn: (row) =>
            row.assigneA ? `${row.assigneA.grade || ''} ${row.assigneA.prenom} ${row.assigneA.nom}`.trim() : 'Non assigné',
          cell: ({ row }) => {
            const assigneA = row.original.assigneA
            return assigneA ? (
              <div className="flex items-center">
                <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">
                  {assigneA.grade && `${assigneA.grade} `}
                  {assigneA.prenom} {assigneA.nom}
                </span>
              </div>
            ) : (
              <span className="text-sm text-gray-500">Non assigné</span>
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
          id: 'badges',
          header: 'Badges',
          accessorFn: (row) => row.badges.map((b) => b.badge.nom).join(', '),
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
                    style={
                      badgeRel.badge.couleur
                        ? {
                            backgroundColor: `${badgeRel.badge.couleur}20`,
                            color: badgeRel.badge.couleur
                          }
                        : {}
                    }
                  >
                    {badgeRel.badge.nom}
                  </span>
                ))}
                {badges.length > 3 && <span className="text-xs text-gray-500">+{badges.length - 3}</span>}
              </div>
            )
          },
          enableColumnFilter: true,
          enableSorting: false,
          meta: {
            filterComponent: (column: any) => (
              <MultiSelectFilter
                column={column}
                options={facets?.badges?.map((b) => b.nom) || []}
                placeholder="Tous"
              />
            )
          }
        },
        {
          accessorKey: 'createdAt',
          header: 'Date création',
          cell: ({ getValue }) => <div className="text-sm text-gray-900">{dayjs(getValue<string>()).format('DD/MM/YYYY')}</div>,
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
      [onEdit, onDelete, facets]
    )

    // Custom params builder for dossiers API
    const buildDossiersParams = (
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

      // Dossiers-specific filter mapping
      columnFilters.forEach((filter) => {
        const { id, value } = filter

        if (id === 'numero' && value) {
          params.numero = value
        } else if (id === 'nomDossier' && value) {
          params.nomDossier = value
        } else if (id === 'demandeurs' && value) {
          params.demandeur = value
        } else if (id === 'sgami' && value) {
          params.sgami = Array.isArray(value) ? value : [value]
        } else if (id === 'assigneA' && value) {
          params.assigneA = Array.isArray(value) ? value : [value]
        } else if (id === 'badges' && value) {
          params.badges = Array.isArray(value) ? value : [value]
        }
      })

      return params
    }

    return (
      <>
        <ServerDataTable<Dossier>
          ref={ref}
          endpoint="/dossiers"
          queryKey="dossiers"
          columns={columns}
          initialPageSize={25}
          initialSorting={[{ id: 'createdAt', desc: true }]}
          buildParams={buildDossiersParams}
          onRowClick={onView}
          emptyMessage="Aucun dossier trouvé"
          transform={(data) => ({
            data: data?.dossiers || data?.data || [],
            total: data?.total || 0,
            pageCount: data?.pagination?.pages || data?.pageCount || 0
          })}
        />

        {/* Modal pour lier des demandes */}
        <LierDemandesModal
          isOpen={showLierDemandesModal}
          onClose={() => setShowLierDemandesModal(false)}
          dossierId={selectedDossierId}
          dossierNumero={selectedDossierNumero}
        />
      </>
    )
  }
)

DossiersTableV2.displayName = 'DossiersTableV2'

export default DossiersTableV2
