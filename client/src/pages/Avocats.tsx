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

  const queryClient = useQueryClient()

  // Fetch all avocats
  const { data: avocats = [], isLoading } = useQuery({
    queryKey: ['avocats'],
    queryFn: async () => {
      const response = await api.get('/avocats')
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

  // Delete avocat mutation
  const deleteAvocatMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/avocats/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avocats'] })
      queryClient.invalidateQueries({ queryKey: ['avocats-stats'] })
      toast.success('Avocat supprimé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression')
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
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'avocat ${avocat.prenom} ${avocat.nom} ?`)) {
      deleteAvocatMutation.mutate(avocat.id)
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

  const topRegions = stats ? Object.entries(stats.avocatsParRegion)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) : []

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Annuaire des avocats</h1>
            <p className="mt-1 text-sm text-gray-600">
              Gestion de l'annuaire des avocats partenaires
            </p>
          </div>
          <button
            onClick={handleCreateAvocat}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Ajouter un avocat
          </button>
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

        {/* Top régions */}
        {topRegions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Répartition par région (Top 5)</h3>
            <div className="space-y-3">
              {topRegions.map(([region, count]) => (
                <div key={region} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{region}</span>
                  <div className="flex items-center space-x-2">
                    <div className="bg-blue-200 rounded-full h-2 w-24 relative">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(count / stats!.totalAvocats) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-500">{count}</span>
                  </div>
                </div>
              ))}
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