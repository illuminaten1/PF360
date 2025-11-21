import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColumnDef } from '@tanstack/react-table'
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
  XCircleIcon,
  UserPlusIcon,
  PlusIcon,
  ClipboardDocumentListIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import AssignerBAPModal from '../forms/AssignerBAPModal'
import AssignerDemandesLotModal from '../forms/AssignerDemandesLotModal'
import { useAuth } from '@/contexts/AuthContext'

dayjs.locale('fr')

interface Facets {
  types?: string[]
  grades?: string[]
  badges?: Array<{ id: string; nom: string; couleur: string | null }>
  baps?: Array<{ id: string; nom: string }>
  assigneA?: Array<{ id: string; fullName: string }>
}

interface DemandesTableV2Props {
  onView: (demande: Demande) => void
  onEdit: (demande: Demande) => void
  onDelete: (demande: Demande) => void
  onAddToDossier: (demande: Demande) => void
  onCreateDossierWithSelection?: (selectedDemandes: Demande[]) => void
  onLinkToExistingDossier?: (selectedDemandes: Demande[]) => void
  onBulkAssignToUser?: (selectedDemandes: Demande[]) => void
  canDelete?: boolean
  facets?: Facets
}

const DemandesTableV2 = React.forwardRef<ServerDataTableRef, DemandesTableV2Props>(
  (
    {
      onView,
      onEdit,
      onDelete,
      onAddToDossier,
      onCreateDossierWithSelection,
      onLinkToExistingDossier,
      onBulkAssignToUser,
      canDelete = true,
      facets
    },
    ref
  ) => {
    const navigate = useNavigate()
    const { user } = useAuth()

    const [showBAPModal, setShowBAPModal] = useState(false)
    const [selectedDemandeId, setSelectedDemandeId] = useState<string>('')
    const [selectedDemandeNumeroDS, setSelectedDemandeNumeroDS] = useState<string>('')
    const [currentBAP, setCurrentBAP] = useState<any>(null)
    const [selectedDemandes, setSelectedDemandes] = useState<Set<string>>(new Set())
    const [showAssignerLotModal, setShowAssignerLotModal] = useState(false)
    const [modalKey, setModalKey] = useState(0)
    const [contextMenu, setContextMenu] = useState<{
      show: boolean
      x: number
      y: number
      demande: Demande | null
    }>({ show: false, x: 0, y: 0, demande: null })
    const [copySuccess, setCopySuccess] = useState<string | null>(null)

    const [allDemandes, setAllDemandes] = useState<Demande[]>([])

    const getTypeColor = (type: string) => {
      return type === 'VICTIME' ? 'bg-sky-100 text-sky-800' : 'bg-orange-100 text-orange-800'
    }

    const getTypeLabel = (type: string) => {
      return type === 'VICTIME' ? 'Victime' : 'Mis en cause'
    }

    const handleViewDossier = useCallback(
      (dossierId: string) => {
        navigate(`/dossiers/${dossierId}`)
      },
      [navigate]
    )

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

    const handleSelectDemande = useCallback(
      (demandeId: string, checked: boolean) => {
        const newSelection = new Set(selectedDemandes)
        if (checked) {
          newSelection.add(demandeId)
        } else {
          newSelection.delete(demandeId)
        }
        setSelectedDemandes(newSelection)
      },
      [selectedDemandes]
    )

    const isDemandeSelectable = (demande: Demande) => {
      return !demande.dossier && !demande.assigneA && (!demande.baps || demande.baps.length === 0)
    }

    const getSelectedDemandesData = () => {
      return allDemandes.filter((demande) => selectedDemandes.has(demande.id))
    }

    const generateDemandeString = (demande: Demande) => {
      const nom = demande.nom.toUpperCase()
      const prenom = demande.prenom
      const grade = demande.grade?.gradeAbrege || ''
      const type = demande.type === 'VICTIME' ? 'VICT' : 'MEC'
      const dateFaits = demande.dateFaits ? dayjs(demande.dateFaits).format('DD-MM-YYYY') : 'Date non renseignée'

      let result = `${nom} ${prenom}`
      if (grade) {
        result += ` ${grade}`
      }
      result += ` - ${type} - ${dateFaits}`

      return result
    }

    const handleContextMenu = (e: React.MouseEvent, demande: Demande) => {
      e.preventDefault()
      e.stopPropagation()

      setContextMenu({
        show: true,
        x: e.clientX,
        y: e.clientY,
        demande
      })
    }

    const handleCopyString = async () => {
      if (!contextMenu.demande) return

      const stringToCopy = generateDemandeString(contextMenu.demande)

      try {
        await navigator.clipboard.writeText(stringToCopy)
        setCopySuccess(`Nom de dossier copié pour DS ${contextMenu.demande.numeroDS}`)
        setTimeout(() => setCopySuccess(null), 3000)
      } catch (err) {
        console.error('Erreur lors de la copie:', err)
      }

      setContextMenu({ show: false, x: 0, y: 0, demande: null })
    }

    const closeContextMenu = () => {
      setContextMenu({ show: false, x: 0, y: 0, demande: null })
    }

    useEffect(() => {
      const handleClickOutside = () => {
        if (contextMenu.show) {
          closeContextMenu()
        }
      }

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && contextMenu.show) {
          closeContextMenu()
        }
      }

      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleEscape)

      return () => {
        document.removeEventListener('click', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
      }
    }, [contextMenu.show])

    const columns = useMemo<ColumnDef<Demande>[]>(
      () => [
        // Selection checkbox
        {
          id: 'select',
          header: '',
          cell: ({ row }) => {
            const demande = row.original
            const isSelectable = isDemandeSelectable(demande)
            const isSelected = selectedDemandes.has(demande.id)

            return (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => handleSelectDemande(demande.id, e.target.checked)}
                  disabled={!isSelectable}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )
          },
          enableSorting: false,
          enableColumnFilter: false,
          size: 50
        },
        // numeroDS - Filtre texte
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
        // dateReception - Filtre date range
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
        // type - Filtre dropdown
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
        // grade - Filtre dropdown
        {
          id: 'grade',
          header: 'Grade',
          accessorFn: (row) => row.grade?.gradeAbrege || '-',
          cell: ({ getValue }) => <div className="text-sm text-gray-900">{getValue<string>()}</div>,
          enableColumnFilter: true,
          meta: {
            filterComponent: (column: any) => <MultiSelectFilter column={column} options={facets?.grades || []} placeholder="Tous grades" />
          }
        },
        // nom - Filtre texte
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
        // prenom - Filtre texte
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
        // dateFaits - Filtre date range
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
        // dossier
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
        // assigneA - Filtre dropdown
        {
          id: 'assigneA',
          header: 'Assigné à',
          accessorFn: (row) =>
            row.assigneA ? `${row.assigneA.grade || ''} ${row.assigneA.prenom} ${row.assigneA.nom}`.trim() : 'Non assigné',
          cell: ({ row }) => {
            const demande = row.original
            const assigneA = demande.assigneA
            return (
              <div className="text-sm">
                {assigneA ? (
                  <div className="flex items-center space-x-2">
                    <div className="text-gray-900">
                      <div className="font-medium">
                        {assigneA.grade && `${assigneA.grade} `}
                        {assigneA.prenom} {assigneA.nom}
                      </div>
                    </div>
                    {user?.role === 'ADMIN' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedDemandes(new Set([demande.id]))
                          setModalKey((prev) => prev + 1)
                          setShowAssignerLotModal(true)
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <PencilIcon className="h-3 w-3 mr-1" />
                        Modifier
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="text-gray-400 italic">Non assigné</span>
                    {user?.role === 'ADMIN' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedDemandes(new Set([demande.id]))
                          setModalKey((prev) => prev + 1)
                          setShowAssignerLotModal(true)
                        }}
                        className="ml-2 text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <UserPlusIcon className="h-4 w-4 mr-1" />
                        Assigner
                      </button>
                    )}
                  </div>
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
        // baps - Filtre dropdown
        {
          id: 'baps',
          header: 'BAP',
          accessorFn: (row) => {
            const baps = row.baps || []
            return baps
              .map((bapRel: any) => bapRel.bap?.nomBAP)
              .filter(Boolean)
              .join(', ')
          },
          cell: ({ row }) => {
            const demande = row.original
            const baps = demande.baps || []

            return (
              <div className="text-sm">
                {baps.length === 0 ? (
                  <div className="flex items-center">
                    <span className="text-gray-400 italic">Aucun BAP</span>
                    {user?.role === 'ADMIN' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedDemandeId(demande.id)
                          setSelectedDemandeNumeroDS(demande.numeroDS)
                          setCurrentBAP(null)
                          setShowBAPModal(true)
                        }}
                        className="ml-2 text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Assigner
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="text-gray-900">
                      {baps.map((bapRel: any, index: number) => (
                        <div key={bapRel.bap.id} className="font-medium">
                          {index > 0 && ', '}
                          {bapRel.bap.nomBAP}
                        </div>
                      ))}
                    </div>
                    {user?.role === 'ADMIN' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedDemandeId(demande.id)
                          setSelectedDemandeNumeroDS(demande.numeroDS)
                          setCurrentBAP(baps.length > 0 ? baps[0].bap : null)
                          setShowBAPModal(true)
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                      >
                        <PencilIcon className="h-3 w-3 mr-1" />
                        Modifier
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          },
          enableColumnFilter: true,
          meta: {
            filterComponent: (column: any) => (
              <MultiSelectFilter column={column} options={facets?.baps?.map((b) => b.nom) || []} placeholder="Tous BAP" />
            )
          }
        },
        // dateAudience - Filtre date range
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
        // actions
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
        },
        // Colonnes cachées mais searchables
        {
          accessorKey: 'nigend',
          header: 'NIGEND',
          cell: ({ getValue }) => <div className="text-sm text-gray-500">{getValue<string>() || '-'}</div>,
          enableColumnFilter: true,
          meta: {
            filterComponent: (column: any) => <DebouncedTextFilter column={column} placeholder="NIGEND..." />
          }
        },
        {
          accessorKey: 'unite',
          header: 'Unité',
          cell: ({ getValue }) => <span className="text-sm text-gray-900">{getValue<string>() || '-'}</span>,
          enableColumnFilter: true,
          meta: {
            filterComponent: (column: any) => <DebouncedTextFilter column={column} placeholder="Unité..." />
          }
        },
        {
          accessorKey: 'commune',
          header: 'Commune',
          cell: ({ getValue }) => <div className="text-sm text-gray-900">{getValue<string>() || '-'}</div>,
          enableColumnFilter: true,
          meta: {
            filterComponent: (column: any) => <DebouncedTextFilter column={column} placeholder="Commune..." />
          }
        }
      ],
      [onView, onEdit, onDelete, onAddToDossier, handleViewDossier, selectedDemandes, facets, user, canDelete, handleSelectDemande]
    )

    // Custom params builder for demandes API
    const buildDemandesParams = (
      pagination: { pageIndex: number; pageSize: number },
      sorting: any[],
      columnFilters: any[],
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
        } else if (id === 'nigend' && value) {
          params.nigend = value
        } else if (id === 'unite' && value) {
          params.unite = value
        } else if (id === 'commune' && value) {
          params.commune = value
        } else if (id === 'type' && value) {
          params.type = Array.isArray(value) ? value : [value]
        } else if (id === 'grade' && value) {
          params.grade = Array.isArray(value) ? value : [value]
        } else if (id === 'assigneA' && value) {
          params.assigneA = Array.isArray(value) ? value : [value]
        } else if (id === 'baps' && value) {
          params.bap = Array.isArray(value) ? value : [value]
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

    // Barre d'actions pour la sélection multiple
    const SelectionToolbar = useCallback(() => {
      if (selectedDemandes.size === 0 || (!onCreateDossierWithSelection && !onLinkToExistingDossier && !onBulkAssignToUser)) {
        return null
      }

      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mx-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-sm font-medium text-blue-900">
                  {selectedDemandes.size} demande{selectedDemandes.size > 1 ? 's' : ''} sélectionnée
                  {selectedDemandes.size > 1 ? 's' : ''}
                </span>
              </div>
              <span className="text-xs text-blue-700">(demandes non liées à un dossier, utilisateur ou BAP)</span>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={() => setSelectedDemandes(new Set())}
                className="px-3 py-2 text-xs text-blue-700 hover:text-blue-900 border border-blue-300 rounded hover:bg-blue-100 transition-colors text-center"
              >
                Désélectionner tout
              </button>
              {onBulkAssignToUser && user?.role === 'ADMIN' && (
                <button
                  onClick={() => {
                    setModalKey((prev) => prev + 1)
                    setShowAssignerLotModal(true)
                  }}
                  className="px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <UserPlusIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">Attribuer à un rédacteur</span>
                </button>
              )}
              {onLinkToExistingDossier && (
                <button
                  onClick={() => onLinkToExistingDossier(getSelectedDemandesData())}
                  className="px-3 sm:px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <FolderIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">Lier à un dossier</span>
                </button>
              )}
              {onCreateDossierWithSelection && (
                <button
                  onClick={() => onCreateDossierWithSelection(getSelectedDemandesData())}
                  className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <PlusIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">Créer un dossier</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )
    }, [selectedDemandes, onCreateDossierWithSelection, onLinkToExistingDossier, onBulkAssignToUser, user, getSelectedDemandesData])

    return (
      <>
        {/* Notification de copie */}
        {copySuccess && (
          <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <CheckIcon className="h-5 w-5" />
            <span className="text-sm font-medium">{copySuccess}</span>
          </div>
        )}

        {/* Menu contextuel */}
        {contextMenu.show && contextMenu.demande && (
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[200px]"
            style={{
              left: contextMenu.x,
              top: contextMenu.y
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCopyString}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            >
              <ClipboardDocumentListIcon className="h-4 w-4" />
              <span>Copier les informations</span>
            </button>
            <div className="border-t border-gray-200 my-1"></div>
            <div className="px-4 py-2">
              <div className="text-xs text-gray-500 font-medium mb-1">Aperçu:</div>
              <div className="text-xs text-gray-600 break-all max-w-xs">
                {generateDemandeString(contextMenu.demande).substring(0, 100)}...
              </div>
            </div>
          </div>
        )}

        <ServerDataTable<Demande>
          ref={ref}
          endpoint="/demandes"
          queryKey="demandes"
          columns={columns}
          initialPageSize={50}
          initialSorting={[{ id: 'dateReception', desc: true }]}
          initialColumnVisibility={{
            nigend: false,
            unite: false,
            commune: false
          }}
          buildParams={buildDemandesParams}
          onRowClick={onView}
          onRowContextMenu={handleContextMenu}
          emptyMessage="Aucune demande trouvée"
          toolbarBottom={<SelectionToolbar />}
          onDataChange={setAllDemandes}
          transform={(data) => {
            const demandes = data?.demandes || data?.data || []
            return {
              data: demandes,
              total: data?.total || 0,
              pageCount: data?.pagination?.pages || data?.pageCount || 0
            }
          }}
        />

        {/* Modal pour assigner des BAP */}
        <AssignerBAPModal
          isOpen={showBAPModal}
          onClose={() => setShowBAPModal(false)}
          demandeId={selectedDemandeId}
          demandeNumeroDS={selectedDemandeNumeroDS}
          currentBAP={currentBAP}
        />

        {/* Modal pour assigner des demandes en lot */}
        <AssignerDemandesLotModal
          key={modalKey}
          isOpen={showAssignerLotModal}
          onClose={() => {
            setShowAssignerLotModal(false)
            setSelectedDemandes(new Set())
          }}
          onSuccess={() => {
            setSelectedDemandes(new Set())
          }}
          selectedDemandes={getSelectedDemandesData()}
        />
      </>
    )
  }
)

DemandesTableV2.displayName = 'DemandesTableV2'

export default DemandesTableV2
