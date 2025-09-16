import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  VisibilityState,
  ColumnFiltersState,
  SortingState,
} from '@tanstack/react-table'
import { ChevronDownIcon, ChevronUpIcon, EyeIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/utils/api'

// Composant de filtre déroulant multi-sélection
const MultiSelectFilter: React.FC<{
  column: any
  values: string[]
  title: string
}> = ({ column, values, title }) => {
  const [isOpen, setIsOpen] = useState(false)
  const selectedValues = (column.getFilterValue() as string[]) || []
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const toggleValue = (value: string) => {
    const newSelectedValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value]
    
    column.setFilterValue(newSelectedValues.length > 0 ? newSelectedValues : undefined)
  }

  const clearFilter = () => {
    column.setFilterValue(undefined)
    setIsOpen(false)
  }

  const uniqueValues = [...new Set(values.filter(v => v != null && v !== ''))].sort()

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className={`mt-1 w-full px-2 py-1 text-xs border rounded focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between ${
          selectedValues.length > 0 
            ? 'border-blue-500 bg-blue-50 text-blue-700' 
            : 'border-gray-300 bg-white text-gray-700'
        }`}
      >
        <FunnelIcon className="h-3 w-3" />
        <span className="mx-1 truncate">
          {selectedValues.length > 0 ? `${selectedValues.length} sélectionné${selectedValues.length > 1 ? 's' : ''}` : 'Filtrer...'}
        </span>
        <ChevronDownIcon className={`h-3 w-3 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute z-50 mt-1 w-64 bg-white border border-gray-300 rounded-md shadow-lg"
          style={{ top: '100%', left: '-50%' }}
        >
          <div className="p-2 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-gray-700">{title}</span>
              {selectedValues.length > 0 && (
                <button
                  onClick={clearFilter}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {uniqueValues.map((value) => (
              <label
                key={value}
                className="flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(value)}
                  onChange={() => toggleValue(value)}
                  className="mr-2 h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="truncate">{value}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface Demande {
  id: string
  numeroDS: string
  type: 'VICTIME' | 'MIS_EN_CAUSE'
  
  // Infos militaires
  nom: string
  prenom: string
  nigend?: string
  statutDemandeur: string
  branche?: string
  formationAdministrative?: string
  departement?: string
  adressePostaleLigne1?: string
  adressePostaleLigne2?: string
  telephoneProfessionnel?: string
  telephonePersonnel?: string
  emailProfessionnel?: string
  emailPersonnel?: string
  unite?: string
  
  // Infos faits
  dateReception?: string
  dateFaits?: string
  dateAudience?: string
  commune?: string
  codePostal?: string
  position?: 'EN_SERVICE' | 'HORS_SERVICE'
  contexteMissionnel?: string
  qualificationInfraction?: string
  resume?: string
  blessures?: string
  partieCivile?: boolean
  montantPartieCivile?: number
  qualificationsPenales?: string
  
  // Soutiens
  soutienPsychologique?: boolean
  soutienSocial?: boolean
  soutienMedical?: boolean
  
  // Commentaires
  commentaireDecision?: string
  commentaireConvention?: string
  
  // Métadonnées
  createdAt?: string
  updatedAt?: string
  
  // Relations
  grade?: {
    gradeAbrege: string
    gradeComplet: string
  }
  assigneA?: {
    nom: string
    prenom: string
    grade: string
  }
  dossier?: {
    numero: string
    sgami?: {
      nom: string
    }
  }
  creePar?: {
    nom: string
    prenom: string
    grade: string
  }
  modifiePar?: {
    nom: string
    prenom: string
    grade: string
  }
  badges: Array<{
    badge: {
      nom: string
      couleur: string
    }
  }>
  baps: Array<{
    bap: {
      nomBAP: string
    }
  }>
  decisions: Array<{
    decision: {
      type: string
      dateSignature?: string
      dateEnvoi?: string
    }
  }>
  conventions: Array<{
    convention: {
      numero: string
      type: string
      montantHT?: number
      dateCreation?: string
      avocat?: {
        nom: string
        prenom: string
      }
    }
  }>
}

const fetchAllDemandes = async (): Promise<Demande[]> => {
  const response = await api.get('/demandes?limit=999999')
  return response.data.demandes
}

const DemandesTablePanel: React.FC = () => {
  const navigate = useNavigate()
  // Configuration des colonnes visibles par défaut
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    // Colonnes visibles par défaut : Type, Militaire, Statut demandeur, Date réception, Date faits, Département, Formation administrative, Assigné à, Dossier, Badges, BAP
    numeroDS: false,
    // type: true (visible par défaut)
    // militaire: true (visible par défaut)
    // statutDemandeur: true (visible par défaut)
    nigend: false,
    branche: false,
    // formationAdministrative: true (visible par défaut)
    // departement: true (visible par défaut)
    adressePostaleLigne1: false,
    adressePostaleLigne2: false,
    telephoneProfessionnel: false,
    telephonePersonnel: false,
    emailProfessionnel: false,
    emailPersonnel: false,
    unite: false,
    // dateReception: true (visible par défaut)
    // dateFaits: true (visible par défaut)
    dateAudience: false,
    commune: false,
    codePostal: false,
    position: false,
    contexteMissionnel: false,
    qualificationInfraction: false,
    qualificationsPenales: false,
    resume: false,
    blessures: false,
    partieCivile: false,
    montantPartieCivile: false,
    soutiens: false,
    // assigneA: true (visible par défaut)
    creePar: false,
    modifiePar: false,
    createdAt: false,
    updatedAt: false,
    // dossier: true (visible par défaut)
    decisions: false,
    conventions: false,
    // badges: true (visible par défaut)
    // baps: true (visible par défaut)
  })
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const { data: demandes = [], isLoading, error } = useQuery({
    queryKey: ['all-demandes'],
    queryFn: fetchAllDemandes,
  })

  const handleViewDossier = (dossierId: string) => {
    navigate(`/dossiers/${dossierId}`)
  }

  // Fonction de filtre personnalisée pour les multi-sélections
  const multiSelectFilter = useCallback((row: any, columnId: string, filterValue: string[]) => {
    if (!filterValue || filterValue.length === 0) return true
    
    const demande = row.original
    let cellValue: string
    
    // Gestion spéciale pour les colonnes complexes
    if (columnId === 'assigneA') {
      const assigneA = demande.assigneA
      cellValue = assigneA ? `${assigneA.grade} ${assigneA.prenom} ${assigneA.nom}`.trim() : 'Non assigné'
      return filterValue.includes(cellValue)
    } else if (columnId === 'dossier') {
      cellValue = demande.dossier?.numero || 'Aucun dossier'
      return filterValue.includes(cellValue)
    } else if (columnId === 'partieCivile') {
      cellValue = demande.partieCivile ? 'Oui' : 'Non'
      return filterValue.includes(cellValue)
    } else if (columnId === 'badges') {
      // Pour les badges, on vérifie si un des badges sélectionnés est présent
      if (!demande.badges?.length) {
        return filterValue.includes('Aucun badge')
      }
      const badgeNames = demande.badges.map((b: any) => b.badge.nom)
      return filterValue.some(filter => badgeNames.includes(filter))
    } else if (columnId === 'baps') {
      // Pour les BAP, on vérifie si un des BAP sélectionnés est présent
      if (!demande.baps?.length) {
        return filterValue.includes('Aucun BAP')
      }
      const bapNames = demande.baps.map((b: any) => b.bap.nomBAP)
      return filterValue.some(filter => bapNames.includes(filter))
    } else {
      cellValue = String(row.getValue(columnId) || '')
      return filterValue.includes(cellValue)
    }
    
    // Pour les cas qui ont déjà retourné, ce code ne sera jamais atteint
    return true
  }, [])

  // Extraction des valeurs uniques pour les filtres déroulants
  const getUniqueValues = useCallback((accessor: string) => {
    const allValues = demandes.flatMap(demande => {
      // Gestion des accesseurs complexes (relations)
      if (accessor === 'militaire') {
        const grade = demande.grade?.gradeAbrege || ''
        const nom = demande.nom || ''
        const prenom = demande.prenom || ''
        return `${grade} ${prenom} ${nom}`.trim()
      }
      if (accessor === 'assigneA') {
        const assigneA = demande.assigneA
        if (!assigneA) return 'Non assigné'
        return `${assigneA.grade} ${assigneA.prenom} ${assigneA.nom}`.trim()
      }
      if (accessor === 'dossier') {
        return demande.dossier?.numero || 'Aucun dossier'
      }
      if (accessor === 'partieCivile') {
        return demande.partieCivile ? 'Oui' : 'Non'
      }
      if (accessor === 'badges') {
        // Pour les badges, on retourne tous les noms de badges individuels
        if (!demande.badges?.length) return ['Aucun badge']
        return demande.badges.map(b => b.badge.nom)
      }
      if (accessor === 'baps') {
        // Pour les BAP, on retourne tous les noms de BAP individuels
        if (!demande.baps?.length) return ['Aucun BAP']
        return demande.baps.map(b => b.bap.nomBAP)
      }
      // Accesseur simple
      return String((demande as any)[accessor] || '')
    })
    
    return allValues
  }, [demandes])

  const columns = useMemo<ColumnDef<Demande>[]>(
    () => [
      {
        accessorKey: 'numeroDS',
        header: 'N° DS',
        cell: ({ getValue }) => (
          <span className="font-mono text-sm">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        filterFn: multiSelectFilter,
        cell: ({ getValue }) => {
          const type = getValue() as string
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                type === 'VICTIME'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-orange-100 text-orange-800'
              }`}
            >
              {type}
            </span>
          )
        },
      },
      {
        id: 'militaire',
        header: 'Militaire',
        cell: ({ row }) => {
          const demande = row.original
          const grade = demande.grade?.gradeAbrege || ''
          const nom = demande.nom || ''
          const prenom = demande.prenom || ''
          return (
            <div className="text-sm">
              <div className="font-medium">{`${grade} ${prenom} ${nom}`.trim()}</div>
              {demande.nigend && (
                <div className="text-gray-500 text-xs">{demande.nigend}</div>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'statutDemandeur',
        header: 'Statut demandeur',
        filterFn: multiSelectFilter,
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'dateReception',
        header: 'Date réception',
        cell: ({ getValue }) => {
          const date = getValue() as string
          return date ? new Date(date).toLocaleDateString('fr-FR') : ''
        },
      },
      {
        accessorKey: 'dateFaits',
        header: 'Date faits',
        cell: ({ getValue }) => {
          const date = getValue() as string
          return date ? new Date(date).toLocaleDateString('fr-FR') : ''
        },
      },
      {
        accessorKey: 'dateAudience',
        header: 'Date audience',
        cell: ({ getValue }) => {
          const date = getValue() as string
          return date ? new Date(date).toLocaleDateString('fr-FR') : ''
        },
      },
      {
        accessorKey: 'commune',
        header: 'Commune',
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'codePostal',
        header: 'Code postal',
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'unite',
        header: 'Unité',
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'departement',
        header: 'Département',
        filterFn: multiSelectFilter,
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'contexteMissionnel',
        header: 'Contexte missionnel',
        filterFn: multiSelectFilter,
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'qualificationInfraction',
        header: 'Qualification infraction',
        filterFn: multiSelectFilter,
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'qualificationsPenales',
        header: 'Qualifications pénales',
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'position',
        header: 'Position',
        filterFn: multiSelectFilter,
        cell: ({ getValue }) => {
          const position = getValue() as string
          if (!position) return ''
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                position === 'EN_SERVICE'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {position === 'EN_SERVICE' ? 'En service' : 'Hors service'}
            </span>
          )
        },
      },
      {
        accessorKey: 'branche',
        header: 'Branche',
        filterFn: multiSelectFilter,
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'formationAdministrative',
        header: 'Formation administrative',
        filterFn: multiSelectFilter,
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'adressePostaleLigne1',
        header: 'Adresse ligne 1',
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'adressePostaleLigne2',
        header: 'Adresse ligne 2',
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'telephoneProfessionnel',
        header: 'Téléphone pro.',
        cell: ({ getValue }) => (
          <span className="text-sm font-mono">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'telephonePersonnel',
        header: 'Téléphone perso.',
        cell: ({ getValue }) => (
          <span className="text-sm font-mono">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'emailProfessionnel',
        header: 'Email pro.',
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'emailPersonnel',
        header: 'Email perso.',
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'resume',
        header: 'Résumé',
        cell: ({ getValue }) => {
          const resume = getValue() as string
          if (!resume) return ''
          return (
            <span className="text-sm" title={resume}>
              {resume.length > 50 ? resume.substring(0, 50) + '...' : resume}
            </span>
          )
        },
      },
      {
        accessorKey: 'blessures',
        header: 'Blessures',
        cell: ({ getValue }) => (
          <span className="text-sm">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: 'partieCivile',
        header: 'Partie civile',
        filterFn: multiSelectFilter,
        cell: ({ getValue }) => {
          const isPartieCivile = getValue() as boolean
          return (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                isPartieCivile
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {isPartieCivile ? 'Oui' : 'Non'}
            </span>
          )
        },
      },
      {
        accessorKey: 'montantPartieCivile',
        header: 'Montant PC',
        cell: ({ getValue }) => {
          const montant = getValue() as number
          if (!montant) return ''
          return (
            <span className="text-sm font-mono">
              {montant.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </span>
          )
        },
      },
      {
        id: 'soutiens',
        header: 'Soutiens',
        cell: ({ row }) => {
          const demande = row.original
          const soutiens = []
          if (demande.soutienPsychologique) soutiens.push('Psy')
          if (demande.soutienSocial) soutiens.push('Social')
          if (demande.soutienMedical) soutiens.push('Médical')
          
          if (!soutiens.length) return ''
          
          return (
            <div className="flex flex-wrap gap-1">
              {soutiens.map((soutien, index) => (
                <span
                  key={index}
                  className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                >
                  {soutien}
                </span>
              ))}
            </div>
          )
        },
      },
      {
        id: 'assigneA',
        header: 'Assigné à',
        filterFn: multiSelectFilter,
        cell: ({ row }) => {
          const assigneA = row.original.assigneA
          if (!assigneA) return ''
          return (
            <span className="text-sm">
              {`${assigneA.grade} ${assigneA.prenom} ${assigneA.nom}`.trim()}
            </span>
          )
        },
      },
      {
        id: 'creePar',
        header: 'Créé par',
        cell: ({ row }) => {
          const creePar = row.original.creePar
          if (!creePar) return ''
          return (
            <span className="text-sm">
              {`${creePar.grade} ${creePar.prenom} ${creePar.nom}`.trim()}
            </span>
          )
        },
      },
      {
        id: 'modifiePar',
        header: 'Modifié par',
        cell: ({ row }) => {
          const modifiePar = row.original.modifiePar
          if (!modifiePar) return ''
          return (
            <span className="text-sm">
              {`${modifiePar.grade} ${modifiePar.prenom} ${modifiePar.nom}`.trim()}
            </span>
          )
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Date création',
        cell: ({ getValue }) => {
          const date = getValue() as string
          return date ? new Date(date).toLocaleDateString('fr-FR') : ''
        },
      },
      {
        accessorKey: 'updatedAt',
        header: 'Dernière modif.',
        cell: ({ getValue }) => {
          const date = getValue() as string
          return date ? new Date(date).toLocaleDateString('fr-FR') : ''
        },
      },
      {
        id: 'dossier',
        header: 'Dossier',
        filterFn: multiSelectFilter,
        cell: ({ row }) => {
          const dossier = row.original.dossier
          if (!dossier) return ''
          return (
            <div className="text-sm">
              <div
                className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                onClick={(e) => {
                  e.stopPropagation()
                  handleViewDossier(dossier.id)
                }}
              >
                {dossier.numero}
              </div>
              {dossier.sgami && (
                <div className="text-gray-500 text-xs">{dossier.sgami.nom}</div>
              )}
            </div>
          )
        },
      },
      {
        id: 'decisions',
        header: 'Décisions',
        cell: ({ row }) => {
          const decisions = row.original.decisions
          if (!decisions?.length) return ''
          return (
            <div className="text-sm">
              {decisions.map((decisionRel, index) => (
                <div key={index} className="mb-1">
                  <span className="font-medium">{decisionRel.decision.type}</span>
                  {decisionRel.decision.dateSignature && (
                    <div className="text-xs text-gray-500">
                      {new Date(decisionRel.decision.dateSignature).toLocaleDateString('fr-FR')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        },
      },
      {
        id: 'conventions',
        header: 'Conventions',
        cell: ({ row }) => {
          const conventions = row.original.conventions
          if (!conventions?.length) return ''
          return (
            <div className="text-sm">
              {conventions.map((conventionRel, index) => (
                <div key={index} className="mb-1">
                  <div className="font-medium">{conventionRel.convention.numero}</div>
                  <div className="text-xs text-gray-500">
                    {conventionRel.convention.type}
                    {conventionRel.convention.montantHT && (
                      <span> - {conventionRel.convention.montantHT.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                    )}
                  </div>
                  {conventionRel.convention.avocat && (
                    <div className="text-xs text-gray-500">
                      {conventionRel.convention.avocat.prenom} {conventionRel.convention.avocat.nom}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        },
      },
      {
        id: 'badges',
        header: 'Badges',
        accessorFn: (row) => row.badges?.map(b => b.badge.nom).join(', ') || '',
        filterFn: multiSelectFilter,
        cell: ({ row }) => {
          const badges = row.original.badges
          if (!badges?.length) return ''
          return (
            <div className="flex flex-wrap gap-1">
              {badges.map((badgeRel, index) => (
                <span
                  key={index}
                  className="px-2 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: badgeRel.badge.couleur + '20',
                    color: badgeRel.badge.couleur,
                    border: `1px solid ${badgeRel.badge.couleur}`,
                  }}
                >
                  {badgeRel.badge.nom}
                </span>
              ))}
            </div>
          )
        },
      },
      {
        id: 'baps',
        header: 'BAP',
        accessorFn: (row) => row.baps?.map(b => b.bap.nomBAP).join(', ') || '',
        filterFn: multiSelectFilter,
        cell: ({ row }) => {
          const baps = row.original.baps
          if (!baps?.length) return ''
          return (
            <span className="text-sm">
              {baps.map(bapRel => bapRel.bap.nomBAP).join(', ')}
            </span>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: demandes,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      columnVisibility,
      columnFilters,
      sorting,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  })

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Chargement des demandes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        Erreur lors du chargement des demandes
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Toutes les demandes ({demandes.length})
        </h2>
        
        {/* Recherche globale */}
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Rechercher..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          />
          
          {/* Dropdown visibilité des colonnes */}
          <div className="relative">
            <button
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => {
                const dropdown = document.getElementById('columns-dropdown')
                dropdown?.classList.toggle('hidden')
              }}
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              Colonnes
              <ChevronDownIcon className="h-4 w-4 ml-2" />
            </button>
            
            <div
              id="columns-dropdown"
              className="hidden absolute right-0 z-10 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
            >
              <div className="py-1 max-h-60 overflow-y-auto">
                {table.getAllLeafColumns().map((column) => {
                  return (
                    <label
                      key={column.id}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={column.getIsVisible()}
                        onChange={column.getToggleVisibilityHandler()}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      {typeof column.columnDef.header === 'string' 
                        ? column.columnDef.header 
                        : column.id}
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres actifs */}
      {columnFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {columnFilters.map((filter) => (
            <span
              key={filter.id}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {filter.id}: {String(filter.value)}
              <button
                onClick={() =>
                  setColumnFilters((prev) =>
                    prev.filter((f) => f.id !== filter.id)
                  )
                }
                className="ml-1 h-3 w-3 rounded-full inline-flex items-center justify-center text-blue-400 hover:text-blue-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
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
                      <span className="flex flex-col">
                        <ChevronUpIcon
                          className={`h-3 w-3 ${
                            header.column.getIsSorted() === 'asc'
                              ? 'text-blue-500'
                              : 'text-gray-300'
                          }`}
                        />
                        <ChevronDownIcon
                          className={`h-3 w-3 ${
                            header.column.getIsSorted() === 'desc'
                              ? 'text-blue-500'
                              : 'text-gray-300'
                          }`}
                        />
                      </span>
                    </div>
                    
                    {/* Filtre de colonne */}
                    {header.column.getCanFilter() && (() => {
                      const columnId = header.column.id
                      // Colonnes avec filtres multi-sélection
                      const multiSelectColumns = ['type', 'statutDemandeur', 'position', 'branche', 'formationAdministrative', 'contexteMissionnel', 'qualificationInfraction', 'departement', 'partieCivile', 'assigneA', 'dossier', 'badges', 'baps']
                      
                      if (multiSelectColumns.includes(columnId)) {
                        return (
                          <div onClick={(e) => e.stopPropagation()}>
                            <MultiSelectFilter
                              column={header.column}
                              values={getUniqueValues(columnId)}
                              title={typeof header.column.columnDef.header === 'string' ? header.column.columnDef.header : columnId}
                            />
                          </div>
                        )
                      }
                      
                      // Filtre texte par défaut pour les autres colonnes
                      return (
                        <input
                          type="text"
                          value={(header.column.getFilterValue() ?? '') as string}
                          onChange={(e) =>
                            header.column.setFilterValue(e.target.value)
                          }
                          placeholder={`Filtrer...`}
                          className="mt-1 w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )
                    })()}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-3 py-4 whitespace-nowrap text-sm text-gray-900"
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
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-700">
            Page {table.getState().pagination.pageIndex + 1} sur{' '}
            {table.getPageCount()}
          </span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value))
            }}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            {[25, 50, 100, 200].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize} par page
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Première
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Précédente
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Suivante
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Dernière
          </button>
        </div>
      </div>
    </div>
  )
}

export default DemandesTablePanel