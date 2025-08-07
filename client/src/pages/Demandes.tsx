import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PlusIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Demande } from '@/types'
import api from '@/utils/api'
import DemandesTable from '@/components/tables/DemandesTable'
import DemandeModal from '@/components/forms/DemandeModal'

interface DemandesStats {
  totalDemandes: number
  demandesToday: number
  demandesVictimes: number
  demandesMisEnCause: number
  demandesNonAffecteesAnnee: number
  demandesSansDecision: number
  demandesNonAffecteesToday: number
}

const Demandes: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(true)
  const [filters, setFilters] = useState({
    type: '',
    dateDebut: '',
    dateFin: '',
    assigneAId: ''
  })

  const queryClient = useQueryClient()

  // Fetch users for assignment filter
  const { data: users = [] } = useQuery({
    queryKey: ['demandes-users'],
    queryFn: async () => {
      const response = await api.get('/demandes/users')
      return response.data
    }
  })

  // Fetch demandes with filters
  const { data: demandesData, isLoading } = useQuery({
    queryKey: ['demandes', searchTerm, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filters.type) params.append('type', filters.type)
      if (filters.dateDebut) params.append('dateDebut', filters.dateDebut)
      if (filters.dateFin) params.append('dateFin', filters.dateFin)
      if (filters.assigneAId) params.append('assigneAId', filters.assigneAId)
      
      const response = await api.get(`/demandes?${params.toString()}`)
      return response.data
    }
  })

  // Fetch stats
  const { data: stats } = useQuery<DemandesStats>({
    queryKey: ['demandes-stats'],
    queryFn: async () => {
      const response = await api.get('/demandes/stats')
      return response.data
    }
  })

  const demandes = demandesData?.demandes || []

  // Create demande mutation
  const createDemandeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/demandes', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandes'] })
      queryClient.invalidateQueries({ queryKey: ['demandes-stats'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] }) // Update dossiers list
      toast.success('Demande créée avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la création')
    }
  })

  // Update demande mutation
  const updateDemandeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/demandes/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandes'] })
      queryClient.invalidateQueries({ queryKey: ['demandes-stats'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      toast.success('Demande modifiée avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification')
    }
  })

  // Delete demande mutation
  const deleteDemandeMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/demandes/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandes'] })
      queryClient.invalidateQueries({ queryKey: ['demandes-stats'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      toast.success('Demande supprimée avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression')
    }
  })

  const handleCreateDemande = () => {
    setSelectedDemande(null)
    setIsModalOpen(true)
  }

  const handleEditDemande = (demande: Demande) => {
    setSelectedDemande(demande)
    setIsModalOpen(true)
  }

  const handleViewDemande = (demande: Demande) => {
    // Pour l'instant, ouvre la demande en mode édition
    setSelectedDemande(demande)
    setIsModalOpen(true)
  }

  const handleDeleteDemande = (demande: Demande) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la demande ${demande.numeroDS} ?`)) {
      deleteDemandeMutation.mutate(demande.id)
    }
  }

  const handleAddToDossier = (demande: Demande) => {
    // This will open the modal in edit mode to allow assigning to a dossier
    setSelectedDemande(demande)
    setIsModalOpen(true)
  }

  const handleSubmitDemande = async (data: any) => {
    if (selectedDemande) {
      await updateDemandeMutation.mutateAsync({ id: selectedDemande.id, data })
    } else {
      await createDemandeMutation.mutateAsync(data)
    }
  }

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Demandes</h1>
            <p className="mt-1 text-sm text-gray-600">
              Gestion des demandes d'aide juridique
            </p>
          </div>
          <button
            onClick={handleCreateDemande}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nouvelle demande
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            {/* Statistiques de l'année */}
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-700 mb-3">Année {new Date().getFullYear()}</div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalDemandes}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-2xl font-bold text-sky-600">{stats.demandesVictimes}</div>
                  <div className="text-sm text-gray-600">Victimes</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-2xl font-bold text-orange-600">{stats.demandesMisEnCause}</div>
                  <div className="text-sm text-gray-600">Mis en cause</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-2xl font-bold text-red-600">{stats.demandesNonAffecteesAnnee}</div>
                  <div className="text-sm text-gray-600">Non affectées</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="text-2xl font-bold text-purple-600">{stats.demandesSansDecision}</div>
                  <div className="text-sm text-gray-600">Sans décision</div>
                </div>
              </div>
            </div>
            
            {/* Statistiques actuelles */}
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-700 mb-3">Aujourd'hui</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                  <div className="text-2xl font-bold text-green-600">{stats.demandesToday}</div>
                  <div className="text-sm text-gray-600">Reçues</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
                  <div className="text-2xl font-bold text-red-600">{stats.demandesNonAffecteesToday}</div>
                  <div className="text-sm text-gray-600">Non affectées</div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      <DemandesTable
        demandes={demandes}
        onView={handleViewDemande}
        onEdit={handleEditDemande}
        onDelete={handleDeleteDemande}
        onAddToDossier={handleAddToDossier}
        loading={isLoading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFilterChange={handleFilterChange}
        users={users}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onClearFilters={() => {
          setFilters({
            type: '',
            dateDebut: '',
            dateFin: '',
            assigneAId: ''
          })
        }}
        onTodayFilter={() => {
          const today = new Date().toISOString().split('T')[0]
          setFilters(prev => ({
            ...prev,
            dateDebut: today,
            dateFin: today
          }))
        }}
      />

      <DemandeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedDemande(null)
        }}
        onSubmit={handleSubmitDemande}
        demande={selectedDemande}
        title={selectedDemande ? 'Modifier la demande' : 'Créer une nouvelle demande'}
      />
    </div>
  )
}

export default Demandes