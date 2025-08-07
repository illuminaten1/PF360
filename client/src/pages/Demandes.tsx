import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PlusIcon } from '@heroicons/react/24/outline'
import { Demande } from '@/types'
import api from '@/utils/api'
import DemandesTable from '@/components/tables/DemandesTable'
import DemandeModal from '@/components/forms/DemandeModal'
import DemandeViewModal from '@/components/forms/DemandeViewModal'

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
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)

  const queryClient = useQueryClient()

  // Fetch all demandes (client-side filtering with TanStack)
  const { data: demandes = [], isLoading } = useQuery({
    queryKey: ['demandes-all'],
    queryFn: async () => {
      const response = await api.get('/demandes?limit=25000') // Get all demandes for client-side processing
      return response.data.demandes
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

  // Create demande mutation
  const createDemandeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/demandes', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandes-all'] })
      queryClient.invalidateQueries({ queryKey: ['demandes-stats'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
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
      queryClient.invalidateQueries({ queryKey: ['demandes-all'] })
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
      queryClient.invalidateQueries({ queryKey: ['demandes-all'] })
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
    setSelectedDemande(demande)
    setIsViewModalOpen(true)
  }

  const handleDeleteDemande = (demande: Demande) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la demande ${demande.numeroDS} ?`)) {
      deleteDemandeMutation.mutate(demande.id)
    }
  }

  const handleAddToDossier = (demande: Demande) => {
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

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
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
        data={demandes}
        loading={isLoading}
        onView={handleViewDemande}
        onEdit={handleEditDemande}
        onDelete={handleDeleteDemande}
        onAddToDossier={handleAddToDossier}
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

      <DemandeViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedDemande(null)
        }}
        demande={selectedDemande}
      />
    </div>
  )
}

export default Demandes