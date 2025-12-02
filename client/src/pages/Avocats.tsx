import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PlusIcon } from '@heroicons/react/24/outline'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { Avocat } from '@/types'
import api from '@/utils/api'
import AvocatsTable from '@/components/tables/AvocatsTable'
import AvocatModal from '@/components/forms/AvocatModal'
import AvocatViewModal from '@/components/forms/AvocatViewModal'
import AvocatActionConfirmationModal from '@/components/common/AvocatActionConfirmationModal'

interface AvocatsStats {
  totalAvocats: number
  avocatsActifs: number
  avocatsParRegion: Record<string, number>
  avocatsAvecSpecialisation: number
}

// Helper function to convert TanStack Table filters to API params
const buildApiParams = (
  pagination: { pageIndex: number; pageSize: number },
  sorting: SortingState,
  columnFilters: ColumnFiltersState,
  globalFilter: string,
  includeInactive: boolean
) => {
  const params: any = {
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize
  }

  // Include inactive avocats
  if (includeInactive) {
    params.includeInactive = 'true'
  }

  // Global search
  if (globalFilter) {
    params.search = globalFilter
  }

  // Sorting
  if (sorting.length > 0) {
    const sort = sorting[0]
    params.sortBy = sort.id
    params.sortOrder = sort.desc ? 'desc' : 'asc'
  }

  // Column filters
  columnFilters.forEach((filter) => {
    const { id, value } = filter

    if (id === 'nom' && value) {
      params.nom = value
    } else if (id === 'prenom' && value) {
      params.prenom = value
    } else if (id === 'email' && value) {
      params.email = value
    } else if (id === 'telephonePublic1' && value) {
      params.telephonePublic1 = value
    } else if (id === 'region' && value) {
      // Multi-select filter - can be an array
      params.region = Array.isArray(value) ? value : [value]
    } else if (id === 'specialisation' && value) {
      // Multi-select filter - can be an array
      params.specialisation = Array.isArray(value) ? value : [value]
    } else if (id === 'villesIntervention' && value) {
      // Multi-select filter - can be an array
      params.villesIntervention = Array.isArray(value) ? value : [value]
    }
  })

  return params
}

const Avocats: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isActionConfirmModalOpen, setIsActionConfirmModalOpen] = useState(false)
  const [selectedAvocat, setSelectedAvocat] = useState<Avocat | null>(null)
  const [actionType, setActionType] = useState<'deactivate' | 'reactivate'>('deactivate')
  const [showInactive, setShowInactive] = useState(false)

  // Server-side state
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 })
  const [sorting, setSorting] = useState<SortingState>([{ id: 'nom', desc: false }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  // Debounced global filter for API calls
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState('')

  const queryClient = useQueryClient()

  // Debounce global filter to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter)
      if (globalFilter !== debouncedGlobalFilter) {
        setPagination(prev => ({ ...prev, pageIndex: 0 }))
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [globalFilter])

  // Reset to first page when filters or showInactive change
  useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }))
  }, [columnFilters, showInactive])

  // Fetch avocats with server-side pagination, sorting, and filtering
  const { data: avocatsData, isLoading } = useQuery({
    queryKey: ['avocats-paginated', pagination, sorting, columnFilters, debouncedGlobalFilter, showInactive],
    queryFn: async () => {
      const params = buildApiParams(pagination, sorting, columnFilters, debouncedGlobalFilter, showInactive)
      const response = await api.get('/avocats/paginated', { params })
      return response.data
    },
    placeholderData: (previousData) => previousData
  })

  const avocats = avocatsData?.avocats || []
  const totalRows = avocatsData?.total || 0
  const pageCount = avocatsData?.pagination?.pages || 0

  // Fetch facets for filters
  const { data: facets } = useQuery({
    queryKey: ['avocats-facets', showInactive],
    queryFn: async () => {
      const params: any = {}
      if (showInactive) {
        params.includeInactive = 'true'
      }
      const response = await api.get('/avocats/facets', { params })
      return response.data
    },
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  })

  // Fetch stats (separate query, independent of pagination/filters)
  const { data: stats } = useQuery<AvocatsStats>({
    queryKey: ['avocats-stats', showInactive],
    queryFn: async () => {
      const params: any = {}
      if (showInactive) {
        params.includeInactive = 'true'
      }
      const response = await api.get('/avocats/stats', { params })
      return response.data
    }
  })

  // Create avocat mutation
  const createAvocatMutation = useMutation({
    mutationFn: async (data: Partial<Avocat>) => {
      const response = await api.post('/avocats', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avocats-paginated'] })
      queryClient.invalidateQueries({ queryKey: ['avocats-facets'] })
      queryClient.invalidateQueries({ queryKey: ['avocats-stats'] })
      toast.success('Avocat créé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la création')
    }
  })

  // Update avocat mutation
  const updateAvocatMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Avocat> }) => {
      const response = await api.put(`/avocats/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avocats-paginated'] })
      queryClient.invalidateQueries({ queryKey: ['avocats-facets'] })
      queryClient.invalidateQueries({ queryKey: ['avocats-stats'] })
      toast.success('Avocat modifié avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification')
    }
  })

  // Delete/Activate avocat mutation
  const deleteAvocatMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/avocats/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avocats-paginated'] })
      queryClient.invalidateQueries({ queryKey: ['avocats-facets'] })
      queryClient.invalidateQueries({ queryKey: ['avocats-stats'] })
      toast.success('Avocat désactivé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la désactivation')
    }
  })

  // Reactivate avocat mutation
  const reactivateAvocatMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/avocats/${id}/activate`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avocats-paginated'] })
      queryClient.invalidateQueries({ queryKey: ['avocats-facets'] })
      queryClient.invalidateQueries({ queryKey: ['avocats-stats'] })
      toast.success('Avocat réactivé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la réactivation')
    }
  })

  const handleCreateAvocat = () => {
    setSelectedAvocat(null)
    setIsModalOpen(true)
  }

  const handleViewAvocat = (avocat: Avocat) => {
    setSelectedAvocat(avocat)
    setIsViewModalOpen(true)
  }

  const handleDeleteAvocat = (avocat: Avocat) => {
    setSelectedAvocat(avocat)
    setActionType('deactivate')
    setIsActionConfirmModalOpen(true)
  }

  const handleToggleActive = (avocat: Avocat) => {
    if (avocat.active === false) {
      setSelectedAvocat(avocat)
      setActionType('reactivate')
      setIsActionConfirmModalOpen(true)
    }
  }

  const handleConfirmAction = () => {
    if (!selectedAvocat) return

    if (actionType === 'deactivate') {
      deleteAvocatMutation.mutate(selectedAvocat.id)
    } else {
      reactivateAvocatMutation.mutate(selectedAvocat.id)
    }

    setIsActionConfirmModalOpen(false)
    setSelectedAvocat(null)
  }

  const handleCloseActionModal = () => {
    if (!deleteAvocatMutation.isPending && !reactivateAvocatMutation.isPending) {
      setIsActionConfirmModalOpen(false)
      setSelectedAvocat(null)
    }
  }

  const handleEditFromView = () => {
    setIsViewModalOpen(false)
    setIsModalOpen(true)
  }

  const handleSubmitAvocat = async (data: Partial<Avocat>) => {
    if (selectedAvocat) {
      await updateAvocatMutation.mutateAsync({ id: selectedAvocat.id, data })
    } else {
      await createAvocatMutation.mutateAsync(data)
    }
    setIsModalOpen(false)
    setSelectedAvocat(null)
  }

  const handleClearFilters = () => {
    setColumnFilters([])
    setGlobalFilter('')
    setPagination({ pageIndex: 0, pageSize: pagination.pageSize })
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Annuaire des avocats</h1>
            <p className="mt-1 text-sm text-gray-600">
              Gestion de l'annuaire des avocats
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Voir les avocats inactifs</span>
            </label>
            <button
              onClick={handleCreateAvocat}
              className="btn-primary flex items-center w-full sm:w-auto justify-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Ajouter un avocat
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-blue-600">{stats.totalAvocats}</div>
              <div className="text-sm text-gray-600">Total avocats</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-green-600">{stats.avocatsActifs}</div>
              <div className="text-sm text-gray-600">Avocats actifs</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-purple-600">{stats.avocatsAvecSpecialisation}</div>
              <div className="text-sm text-gray-600">Avec spécialisation</div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-orange-600">{Object.keys(stats.avocatsParRegion).length}</div>
              <div className="text-sm text-gray-600">Régions couvertes</div>
            </div>
          </div>
        )}
      </div>

      <AvocatsTable
        data={avocats}
        loading={isLoading}
        onView={handleViewAvocat}
        onDelete={handleDeleteAvocat}
        onToggleActive={handleToggleActive}
        // Server-side props
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

      <AvocatModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedAvocat(null)
        }}
        onSubmit={handleSubmitAvocat}
        avocat={selectedAvocat}
        title={selectedAvocat ? 'Modifier l\'avocat' : 'Ajouter un nouvel avocat'}
      />

      <AvocatViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedAvocat(null)
        }}
        avocat={selectedAvocat}
        onEdit={handleEditFromView}
      />

      <AvocatActionConfirmationModal
        isOpen={isActionConfirmModalOpen}
        onClose={handleCloseActionModal}
        onConfirm={handleConfirmAction}
        avocatName={selectedAvocat?.nom || ''}
        avocatPrenom={selectedAvocat?.prenom || ''}
        action={actionType}
        isLoading={deleteAvocatMutation.isPending || reactivateAvocatMutation.isPending}
      />
    </div>
  )
}

export default Avocats
