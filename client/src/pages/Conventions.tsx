import React, { useCallback, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Convention } from '@/types'
import api from '@/utils/api'
import ConventionsTableV2 from '@/components/tables/ConventionsTableV2'
import type { SortingState, ColumnFiltersState, PaginationState } from '@tanstack/react-table'

interface ConventionsResponse {
  conventions: Convention[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

interface Facets {
  types: string[]
  victimeMecs: string[]
  instances: string[]
  createurs: Array<{ id: string; fullName: string }>
  modificateurs: Array<{ id: string; fullName: string }>
}

interface Stats {
  totalConventions: number
  conventionCount: number
  avenantCount: number
  victimeCount: number
  misEnCauseCount: number
  totalMontantHT: number
  signeesCount: number
}

const Conventions: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // État pour la pagination, le tri et les filtres
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25
  })
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'numero', desc: true }
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
      sortBy: sorting[0]?.id || 'numero',
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
      } else if (filter.id === 'victimeOuMisEnCause') {
        params.victimeOuMisEnCause = Array.isArray(value) ? value : [value]
      } else if (filter.id === 'instance') {
        params.instance = value
      } else if (filter.id === 'avocat') {
        params.avocatNom = value
      } else if (filter.id === 'dateRetourSigne' && typeof value === 'object' && value !== null) {
        const dateFilter = value as { from?: string; to?: string }
        if (dateFilter.from) params.dateRetourSigneDebut = dateFilter.from
        if (dateFilter.to) params.dateRetourSigneFin = dateFilter.to
      } else if (filter.id === 'dateCreation' && typeof value === 'object' && value !== null) {
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

  // Fetch conventions avec pagination et filtres
  const { data, isLoading } = useQuery<ConventionsResponse>({
    queryKey: ['conventions', pagination, sorting, columnFilters, globalFilter],
    queryFn: async () => {
      const params = buildQueryParams()
      const response = await api.get('/conventions', { params })
      return response.data
    },
    placeholderData: (previousData) => previousData
  })

  // Fetch facets pour les filtres
  const { data: facets } = useQuery<Facets>({
    queryKey: ['conventions-facets'],
    queryFn: async () => {
      const response = await api.get('/conventions/facets')
      return response.data
    }
  })

  // Fetch stats
  const { data: stats } = useQuery<Stats>({
    queryKey: ['conventions-stats'],
    queryFn: async () => {
      const response = await api.get('/conventions/stats')
      return response.data
    }
  })

  // Update convention mutation
  const updateConventionMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const response = await api.put(`/conventions/${updateData.id}`, updateData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conventions'] })
      queryClient.invalidateQueries({ queryKey: ['conventions-stats'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification de la convention')
    }
  })

  // Delete convention mutation
  const deleteConventionMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/conventions/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conventions'] })
      queryClient.invalidateQueries({ queryKey: ['conventions-stats'] })
      toast.success('Convention supprimée avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression')
    }
  })

  const handleViewConvention = (convention: Convention) => {
    navigate(`/dossiers/${convention.dossier.id}`)
  }

  const handleEditConvention = (convention: Convention) => {
    navigate(`/dossiers/${convention.dossier.id}`)
  }

  const handleDeleteConvention = (convention: Convention) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la convention n°${convention.numero} ?`)) {
      deleteConventionMutation.mutate(convention.id)
    }
  }

  // Fonction pour sauvegarder la date de retour signée
  const handleConventionDateChange = useCallback(async (conventionId: string, field: 'dateRetourSigne', value: string | null) => {
    try {
      const updateData = {
        id: conventionId,
        [field]: value ? new Date(value).toISOString() : null
      }
      await updateConventionMutation.mutateAsync(updateData)
      toast.success('Date de retour signée mise à jour')
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la date:', error)
    }
  }, [updateConventionMutation])

  const handleClearFilters = () => {
    setColumnFilters([])
    setGlobalFilter('')
    setPagination({ pageIndex: 0, pageSize: 25 })
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Conventions d'honoraires</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestion des conventions et avenants d'honoraires
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.totalConventions}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.conventionCount}</div>
              <div className="text-sm text-gray-600">Conventions</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.avenantCount}</div>
              <div className="text-sm text-gray-600">Avenants</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-sky-600">{stats.victimeCount}</div>
              <div className="text-sm text-gray-600">Victimes</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-amber-600">{stats.misEnCauseCount}</div>
              <div className="text-sm text-gray-600">Mis en cause</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-green-600">{stats.signeesCount}</div>
              <div className="text-sm text-gray-600">Signées</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.totalMontantHT.toLocaleString()} €</div>
              <div className="text-sm text-gray-600">Total HT</div>
            </div>
          </div>
        )}
      </div>

      <ConventionsTableV2
        data={data?.conventions || []}
        loading={isLoading}
        onView={handleViewConvention}
        onEdit={handleEditConvention}
        onDelete={handleDeleteConvention}
        onDateChange={handleConventionDateChange}
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

export default Conventions