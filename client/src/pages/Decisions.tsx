import React, { useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Decision } from '@/types'
import api from '@/utils/api'
import DecisionsTableV2 from '@/components/tables/DecisionsTableV2'
import type { SortingState, ColumnFiltersState, PaginationState } from '@tanstack/react-table'

interface DecisionsResponse {
  decisions: Decision[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

interface Facets {
  types: string[]
  typeVictMecs: string[]
  createurs: Array<{ id: string; fullName: string }>
  modificateurs: Array<{ id: string; fullName: string }>
}

const Decisions: React.FC = () => {
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
      } else if (filter.id === 'type') {
        params.type = Array.isArray(value) ? value : [value]
      } else if (filter.id === 'avis_hierarchiques') {
        const mappedValues = (Array.isArray(value) ? value : [value]).map((v: string) =>
          v === 'Oui' ? 'true' : 'false'
        )
        if (mappedValues.length === 1) {
          params.avis_hierarchiques = mappedValues[0]
        }
      } else if (filter.id === 'typeVictMec') {
        params.typeVictMec = Array.isArray(value) ? value : [value]
      } else if (filter.id === 'dateSignature' && typeof value === 'object' && value !== null) {
        const dateFilter = value as { from?: string; to?: string }
        if (dateFilter.from) params.dateSignatureDebut = dateFilter.from
        if (dateFilter.to) params.dateSignatureFin = dateFilter.to
      } else if (filter.id === 'dateEnvoi' && typeof value === 'object' && value !== null) {
        const dateFilter = value as { from?: string; to?: string }
        if (dateFilter.from) params.dateEnvoiDebut = dateFilter.from
        if (dateFilter.to) params.dateEnvoiFin = dateFilter.to
      } else if (filter.id === 'createdAt' && typeof value === 'object' && value !== null) {
        const dateFilter = value as { from?: string; to?: string }
        if (dateFilter.from) params.createdAtDebut = dateFilter.from
        if (dateFilter.to) params.createdAtFin = dateFilter.to
      } else if (filter.id === 'creePar') {
        params.creePar = Array.isArray(value) ? value : [value]
      } else if (filter.id === 'modifiePar') {
        params.modifiePar = Array.isArray(value) ? value : [value]
      }
    })

    return params
  }

  // Fetch decisions avec pagination et filtres
  const { data, isLoading } = useQuery<DecisionsResponse>({
    queryKey: ['decisions', pagination, sorting, columnFilters, globalFilter],
    queryFn: async () => {
      const params = buildQueryParams()
      const response = await api.get('/decisions', { params })
      return response.data
    },
    placeholderData: (previousData) => previousData
  })

  // Fetch facets pour les filtres
  const { data: facets } = useQuery<Facets>({
    queryKey: ['decisions-facets'],
    queryFn: async () => {
      const response = await api.get('/decisions/facets')
      return response.data
    }
  })

  // Update decision mutation
  const updateDecisionMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const response = await api.put(`/decisions/${updateData.id}`, updateData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification de la décision')
    }
  })

  // Delete decision mutation
  const deleteDecisionMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/decisions/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions'] })
      toast.success('Décision supprimée avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression')
    }
  })

  const handleViewDecision = (decision: Decision) => {
    navigate(`/dossiers/${decision.dossier.id}`)
  }

  const handleEditDecision = (decision: Decision) => {
    navigate(`/dossiers/${decision.dossier.id}`)
  }

  const handleDeleteDecision = (decision: Decision) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer cette décision ${decision.type} ?`)) {
      deleteDecisionMutation.mutate(decision.id)
    }
  }

  const handleDecisionDateChange = useCallback(async (decisionId: string, field: 'dateSignature' | 'dateEnvoi', value: string | null) => {
    try {
      const updateData = {
        id: decisionId,
        [field]: value ? new Date(value).toISOString() : null
      }
      await updateDecisionMutation.mutateAsync(updateData)
      toast.success(`${field === 'dateSignature' ? 'Date de signature' : 'Date d\'envoi'} mise à jour`)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la date:', error)
    }
  }, [updateDecisionMutation])

  const handleClearFilters = () => {
    setColumnFilters([])
    setGlobalFilter('')
    setPagination({ pageIndex: 0, pageSize: pagination.pageSize })
  }

  const decisions = data?.decisions || []
  const totalRows = data?.pagination?.total || 0
  const pageCount = data?.pagination?.totalPages || 0

  // Stats basées sur le total (pas seulement la page actuelle)
  const getStatsData = () => {
    // Pour les stats, on peut faire une requête séparée ou les calculer côté serveur
    // Pour l'instant, on affiche juste le total
    return {
      totalDecisions: totalRows,
      ajCount: decisions.filter((d: Decision) => d.type === 'AJ').length,
      ajeCount: decisions.filter((d: Decision) => d.type === 'AJE').length,
      pjCount: decisions.filter((d: Decision) => d.type === 'PJ').length,
      rejetCount: decisions.filter((d: Decision) => d.type === 'REJET').length
    }
  }

  const stats = getStatsData()

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Décisions</h1>
            <p className="mt-1 text-sm text-gray-600">
              Consultation des décisions
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.totalDecisions}</div>
            <div className="text-sm text-gray-600">Total décisions</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{stats.ajCount}</div>
            <div className="text-sm text-gray-600">Aide Juridique (page)</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.ajeCount}</div>
            <div className="text-sm text-gray-600">AJ Évolutive (page)</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.pjCount}</div>
            <div className="text-sm text-gray-600">Protection Juridictionnelle (page)</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-red-600">{stats.rejetCount}</div>
            <div className="text-sm text-gray-600">Rejets (page)</div>
          </div>
        </div>
      </div>

      <DecisionsTableV2
        data={decisions}
        loading={isLoading}
        onView={handleViewDecision}
        onEdit={handleEditDecision}
        onDelete={handleDeleteDecision}
        onDateChange={handleDecisionDateChange}
        pageCount={pageCount}
        totalRows={totalRows}
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

export default Decisions