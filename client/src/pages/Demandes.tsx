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
}

const Demandes: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    type: '',
    position: '',
    partieCivile: ''
  })

  const queryClient = useQueryClient()

  // Fetch demandes with filters
  const { data: demandesData, isLoading } = useQuery({
    queryKey: ['demandes', searchTerm, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (filters.type) params.append('type', filters.type)
      if (filters.position) params.append('position', filters.position)
      if (filters.partieCivile) params.append('partieCivile', filters.partieCivile)
      
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
    // Navigate to demande detail page (to be implemented)
    console.log('View demande:', demande.id)
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

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par numéro DS, nom, NIGEND, commune..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input w-full pl-10"
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filtres
          </button>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label block text-gray-700 mb-2">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="input w-full"
                >
                  <option value="">Tous les types</option>
                  <option value="VICTIME">Victime</option>
                  <option value="MIS_EN_CAUSE">Mis en cause</option>
                </select>
              </div>
              <div>
                <label className="label block text-gray-700 mb-2">Position</label>
                <select
                  value={filters.position}
                  onChange={(e) => handleFilterChange('position', e.target.value)}
                  className="input w-full"
                >
                  <option value="">Toutes les positions</option>
                  <option value="EN_SERVICE">En service</option>
                  <option value="HORS_SERVICE">Hors service</option>
                </select>
              </div>
              <div>
                <label className="label block text-gray-700 mb-2">Partie civile</label>
                <select
                  value={filters.partieCivile}
                  onChange={(e) => handleFilterChange('partieCivile', e.target.value)}
                  className="input w-full"
                >
                  <option value="">Toutes</option>
                  <option value="true">Avec partie civile</option>
                  <option value="false">Sans partie civile</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-gray-900">{stats.totalDemandes}</div>
              <div className="text-sm text-gray-600">Total de l'année {new Date().getFullYear()}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-green-600">{stats.demandesToday}</div>
              <div className="text-sm text-gray-600">Aujourd'hui</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-red-600">{stats.demandesVictimes}</div>
              <div className="text-sm text-gray-600">Victimes</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.demandesMisEnCause}</div>
              <div className="text-sm text-gray-600">Mis en cause</div>
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