import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PlusIcon } from '@heroicons/react/24/outline'
import { Avocat } from '@/types'
import api from '@/utils/api'
import AvocatsTable from '@/components/tables/AvocatsTable'
import AvocatModal from '@/components/forms/AvocatModal'
import AvocatViewModal from '@/components/forms/AvocatViewModal'

interface AvocatsStats {
  totalAvocats: number
  avocatsActifs: number
  avocatsParRegion: Record<string, number>
  avocatsAvecSpecialisation: number
}

const Avocats: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedAvocat, setSelectedAvocat] = useState<Avocat | null>(null)
  const [showInactive, setShowInactive] = useState(false)

  const queryClient = useQueryClient()

  // Fetch all avocats
  const { data: avocats = [], isLoading } = useQuery({
    queryKey: ['avocats', showInactive],
    queryFn: async () => {
      const response = await api.get(`/avocats${showInactive ? '?includeInactive=true' : ''}`)
      return response.data
    }
  })

  // Fetch stats
  const { data: stats } = useQuery<AvocatsStats>({
    queryKey: ['avocats-stats'],
    queryFn: async () => {
      // Pour l'instant, on calcule les stats côté client
      // Plus tard, on pourra créer un endpoint dédié
      const totalAvocats = avocats.length
      const avocatsActifs = avocats.filter((a: Avocat) => a.active !== false).length
      const avocatsAvecSpecialisation = avocats.filter((a: Avocat) => a.specialisation).length
      
      const avocatsParRegion = avocats.reduce((acc: Record<string, number>, avocat: Avocat) => {
        if (avocat.region) {
          acc[avocat.region] = (acc[avocat.region] || 0) + 1
        }
        return acc
      }, {})

      return {
        totalAvocats,
        avocatsActifs,
        avocatsParRegion,
        avocatsAvecSpecialisation
      }
    },
    enabled: avocats.length > 0
  })

  // Create avocat mutation
  const createAvocatMutation = useMutation({
    mutationFn: async (data: Partial<Avocat>) => {
      const response = await api.post('/avocats', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avocats'] })
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
      queryClient.invalidateQueries({ queryKey: ['avocats'] })
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
      queryClient.invalidateQueries({ queryKey: ['avocats'] })
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
      queryClient.invalidateQueries({ queryKey: ['avocats'] })
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

  const handleEditAvocat = (avocat: Avocat) => {
    setSelectedAvocat(avocat)
    setIsModalOpen(true)
  }

  const handleViewAvocat = (avocat: Avocat) => {
    setSelectedAvocat(avocat)
    setIsViewModalOpen(true)
  }

  const handleDeleteAvocat = (avocat: Avocat) => {
    if (window.confirm(`Êtes-vous sûr de vouloir désactiver l'avocat ${avocat.prenom} ${avocat.nom} ?`)) {
      deleteAvocatMutation.mutate(avocat.id)
    }
  }

  const handleToggleActive = (avocat: Avocat) => {
    if (avocat.active === false) {
      if (window.confirm(`Êtes-vous sûr de vouloir réactiver l'avocat ${avocat.prenom} ${avocat.nom} ?`)) {
        reactivateAvocatMutation.mutate(avocat.id)
      }
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
  }


  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Annuaire des avocats</h1>
            <p className="mt-1 text-sm text-gray-600">
              Gestion de l'annuaire des avocats
            </p>
          </div>
          <div className="flex items-center space-x-4">
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
              className="btn-primary flex items-center"
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
        onEdit={handleEditAvocat}
        onDelete={handleDeleteAvocat}
        onToggleActive={handleToggleActive}
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
    </div>
  )
}

export default Avocats