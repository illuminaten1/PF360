import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Paiement } from '@/types'
import api from '@/utils/api'
import PaiementsTableV2 from '@/components/tables/PaiementsTableV2'
import type { SortingState, ColumnFiltersState, PaginationState } from '@tanstack/react-table'

interface PaiementsResponse {
  paiements: Paiement[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

interface Facets {
  qualitesBeneficiaires: string[]
  emissionsTitre: string[]
  conventionsJointes: string[]
  sgamis: Array<{ id: string; nom: string }>
  pces: Array<{ id: string; pceDetaille: string; pceNumerique: string }>
  createurs: Array<{ id: string; fullName: string }>
}

interface Stats {
  totalPaiements: number
  avocatCount: number
  autresIntervenantCount: number
  emissionTitreCount: number
  conventionJointeCount: number
  totalMontantTTC: number
}

const Paiements: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // État pour la pagination, le tri et les filtres
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  })
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true }
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  // Réinitialiser la page lors du changement de filtres
  useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }))
  }, [columnFilters, globalFilter])

  // Construire les paramètres de requête
  const buildQueryParams = () => {
    const params: any = {
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      sortBy: sorting[0]?.id || 'createdAt',
      sortOrder: sorting[0]?.desc ? 'desc' : 'asc'
    }

    // Recherche globale
    if (globalFilter) {
      params.search = globalFilter
    }

    // Filtres par colonne
    columnFilters.forEach((filter) => {
      const value = filter.value

      if (filter.id === 'numero') {
        params.numero = value
      } else if (filter.id === 'dossier') {
        params.dossierNumero = value
      } else if (filter.id === 'sgami') {
        params.sgamiNom = Array.isArray(value) ? value : [value]
      } else if (filter.id === 'qualiteBeneficiaire') {
        params.qualiteBeneficiaire = Array.isArray(value) ? value : [value]
      } else if (filter.id === 'identiteBeneficiaire') {
        params.identiteBeneficiaire = value
      } else if (filter.id === 'facture') {
        params.facture = value
      } else if (filter.id === 'emissionTitrePerception') {
        params.emissionTitrePerception = Array.isArray(value) ? value : [value]
      } else if (filter.id === 'conventionJointeFRI') {
        params.conventionJointeFRI = Array.isArray(value) ? value : [value]
      } else if (filter.id === 'pce') {
        params.pceDetaille = value
      } else if (filter.id === 'dateServiceFait' && typeof value === 'object' && value !== null) {
        const dateFilter = value as { from?: string; to?: string }
        if (dateFilter.from) params.dateServiceFaitDebut = dateFilter.from
        if (dateFilter.to) params.dateServiceFaitFin = dateFilter.to
      } else if (filter.id === 'createdAt' && typeof value === 'object' && value !== null) {
        const dateFilter = value as { from?: string; to?: string }
        if (dateFilter.from) params.createdAtDebut = dateFilter.from
        if (dateFilter.to) params.createdAtFin = dateFilter.to
      } else if (filter.id === 'creePar') {
        params.creePar = Array.isArray(value) ? value : [value]
      }
    })

    return params
  }

  // Fetch paiements avec pagination et filtres
  const { data, isLoading } = useQuery<PaiementsResponse>({
    queryKey: ['paiements', pagination, sorting, columnFilters, globalFilter],
    queryFn: async () => {
      const params = buildQueryParams()
      const response = await api.get('/paiements', { params })
      return response.data
    },
    placeholderData: (previousData) => previousData
  })

  // Fetch facets pour les filtres
  const { data: facets } = useQuery<Facets>({
    queryKey: ['paiements-facets'],
    queryFn: async () => {
      const response = await api.get('/paiements/facets')
      return response.data
    }
  })

  // Fetch stats
  const { data: stats } = useQuery<Stats>({
    queryKey: ['paiements-stats'],
    queryFn: async () => {
      const response = await api.get('/paiements/stats')
      return response.data
    }
  })

  // Delete paiement mutation
  const deletePaiementMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/paiements/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements'] })
      queryClient.invalidateQueries({ queryKey: ['paiements-stats'] })
      toast.success('Paiement supprimé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression')
    }
  })

  const handleViewPaiement = (paiement: Paiement) => {
    navigate(`/dossiers/${paiement.dossier.id}`)
  }

  const handleEditPaiement = (paiement: Paiement) => {
    navigate(`/dossiers/${paiement.dossier.id}`)
  }

  const handleDeletePaiement = (paiement: Paiement) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ce paiement ?`)) {
      deletePaiementMutation.mutate(paiement.id)
    }
  }

  const handleClearFilters = () => {
    setColumnFilters([])
    setGlobalFilter('')
    setPagination({ pageIndex: 0, pageSize: 25 })
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestion des paiements et fiches de règlement
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.totalPaiements}</div>
              <div className="text-sm text-gray-600">Total paiements</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.avocatCount}</div>
              <div className="text-sm text-gray-600">Avocats</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.autresIntervenantCount}</div>
              <div className="text-sm text-gray-600">Autres intervenants</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-sky-600">{stats.emissionTitreCount}</div>
              <div className="text-sm text-gray-600">Émission titre</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-amber-600">{stats.conventionJointeCount}</div>
              <div className="text-sm text-gray-600">Convention jointe</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.totalMontantTTC.toLocaleString()} €</div>
              <div className="text-sm text-gray-600">Total TTC</div>
            </div>
          </div>
        )}
      </div>

      <PaiementsTableV2
        data={data?.paiements || []}
        loading={isLoading}
        onView={handleViewPaiement}
        onEdit={handleEditPaiement}
        onDelete={handleDeletePaiement}
        pageCount={data?.pagination.totalPages || 0}
        totalRows={data?.pagination.total || 0}
        pagination={pagination}
        sorting={sorting}
        columnFilters={columnFilters}
        globalFilter={globalFilter}
        onPaginationChange={setPagination}
        onSortingChange={setSorting}
        onColumnFiltersChange={setColumnFilters}
        onGlobalFilterChange={setGlobalFilter}
        onClearFilters={handleClearFilters}
        facets={facets}
      />
    </div>
  )
}

export default Paiements