import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PlusIcon } from '@heroicons/react/24/outline'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { Dossier } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/utils/api'
import DossiersTableV2, { DossiersTableV2Ref } from '@/components/tables/DossiersTableV2'
import DossierModal from '@/components/forms/DossierModal'

// Helper function to convert TanStack Table filters to API params
const buildApiParams = (
  pagination: { pageIndex: number; pageSize: number },
  sorting: SortingState,
  columnFilters: ColumnFiltersState,
  globalFilter: string
) => {
  const params: any = {
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize
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

    if (id === 'numero' && value) {
      params.numero = value
    } else if (id === 'nomDossier' && value) {
      params.nomDossier = value
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

const Dossiers: React.FC = () => {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null)
  const { user } = useAuth()
  const tableRef = useRef<DossiersTableV2Ref>(null)

  // Server-side state
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }])
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

  // Fetch dossiers with server-side pagination, sorting, and filtering
  const { data: dossiersData, isLoading } = useQuery({
    queryKey: ['dossiers', pagination, sorting, columnFilters, debouncedGlobalFilter],
    queryFn: async () => {
      const params = buildApiParams(pagination, sorting, columnFilters, debouncedGlobalFilter)
      const response = await api.get('/dossiers', { params })
      return response.data
    },
    placeholderData: (previousData) => previousData
  })

  const dossiers = dossiersData?.dossiers || []
  const totalRows = dossiersData?.total || 0
  const pageCount = dossiersData?.pagination?.pages || 0

  // Fetch facets for filters
  const { data: facets } = useQuery({
    queryKey: ['dossiers-facets'],
    queryFn: async () => {
      const response = await api.get('/dossiers/facets')
      return response.data
    },
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  })

  // Fetch all dossiers for stats (lightweight query)
  const { data: allDossiersForStats = [] } = useQuery<Dossier[]>({
    queryKey: ['dossiers-stats'],
    queryFn: async () => {
      const response = await api.get('/dossiers/stats')
      return response.data
    }
  })

  // Create dossier mutation
  const createDossierMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/dossiers', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers-stats'] })
      toast.success('Dossier créé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la création')
    }
  })

  // Update dossier mutation
  const updateDossierMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/dossiers/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers-stats'] })
      toast.success('Dossier modifié avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification')
    }
  })

  // Delete dossier mutation
  const deleteDossierMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/dossiers/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers-stats'] })
      toast.success('Dossier supprimé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression')
    }
  })

  const handleCreateDossier = () => {
    setSelectedDossier(null)
    setIsModalOpen(true)
  }

  const handleEditDossier = (dossier: Dossier) => {
    setSelectedDossier(dossier)
    setIsModalOpen(true)
  }

  const handleViewDossier = (dossier: Dossier) => {
    navigate(`/dossiers/${dossier.id}`)
  }

  const handleDeleteDossier = (dossier: Dossier) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le dossier ${dossier.numero} ?`)) {
      deleteDossierMutation.mutate(dossier.id)
    }
  }

  const handleSubmitDossier = async (data: any) => {
    if (selectedDossier) {
      await updateDossierMutation.mutateAsync({ id: selectedDossier.id, data })
    } else {
      await createDossierMutation.mutateAsync(data)
    }
  }

  const applyMyDossiersFilter = useCallback(() => {
    if (tableRef.current && user) {
      const userFullName = `${user.grade || ''} ${user.prenom} ${user.nom}`.trim()

      tableRef.current.setColumnFilters([
        {
          id: 'assigneA',
          value: [userFullName]
        }
      ])
    }
  }, [user])

  // Appliquer automatiquement le filtre "mes-dossiers" si demandé via sessionStorage
  useEffect(() => {
    const filterToApply = sessionStorage.getItem('dossiers-apply-filter')
    if (filterToApply === 'mes-dossiers' && tableRef.current && user) {
      // Attendre que le composant soit entièrement monté
      const timer = setTimeout(() => {
        applyMyDossiersFilter()
        // Nettoyer le sessionStorage après application
        sessionStorage.removeItem('dossiers-apply-filter')
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [user, applyMyDossiersFilter])

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dossiers</h1>
            <p className="mt-1 text-sm text-gray-600">
              Gestion des dossiers
            </p>
          </div>
          <button
            onClick={handleCreateDossier}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nouveau dossier
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">{allDossiersForStats.length}</div>
            <div className="text-sm text-gray-600">Total dossiers</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">
              {allDossiersForStats.filter(d => d.decisions && d.decisions.length > 0).length}
            </div>
            <div className="text-sm text-gray-600">Avec décision</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">
              {allDossiersForStats.filter(d => d.assigneA).length}
            </div>
            <div className="text-sm text-gray-600">Assignés</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">
              {allDossiersForStats.reduce((sum, d) => sum + (d.stats?.totalConventionsHT || 0), 0).toLocaleString('fr-FR')} €
            </div>
            <div className="text-sm text-gray-600">Montant total</div>
          </div>
        </div>
      </div>

      <DossiersTableV2
        ref={tableRef}
        data={dossiers}
        onView={handleViewDossier}
        onEdit={handleEditDossier}
        onDelete={handleDeleteDossier}
        loading={isLoading}
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
        onClearFilters={() => {
          setColumnFilters([])
          setGlobalFilter('')
          setPagination({ pageIndex: 0, pageSize: pagination.pageSize })
        }}
        facets={facets}
      />

      <DossierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitDossier}
        dossier={selectedDossier}
        title={selectedDossier ? 'Modifier le dossier' : 'Créer un nouveau dossier'}
      />
    </div>
  )
}

export default Dossiers