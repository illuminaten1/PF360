import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PlusIcon, TagIcon } from '@heroicons/react/24/outline'
import { Badge } from '@/types'
import api from '@/utils/api'
import BadgesTable from '@/components/tables/BadgesTable'
import BadgeModal from '@/components/forms/BadgeModal'


const Badges: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)

  const queryClient = useQueryClient()

  const { data: badgesData, isLoading } = useQuery({
    queryKey: ['badges-all'],
    queryFn: async () => {
      const response = await api.get('/badges')
      return response.data
    }
  })

  const { data: stats } = useQuery({
    queryKey: ['badges-stats'],
    queryFn: async () => {
      const response = await api.get('/badges/stats')
      return response.data
    }
  })

  const createBadgeMutation = useMutation({
    mutationFn: async (badgeData: Partial<Badge>) => {
      const response = await api.post('/badges', badgeData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges-all'] })
      queryClient.invalidateQueries({ queryKey: ['badges-stats'] })
      queryClient.invalidateQueries({ queryKey: ['badges'] })
      setIsModalOpen(false)
      setSelectedBadge(null)
      toast.success('Badge créé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création du badge')
    }
  })

  const updateBadgeMutation = useMutation({
    mutationFn: async ({ id, ...badgeData }: Partial<Badge> & { id: string }) => {
      const response = await api.put(`/badges/${id}`, badgeData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges-all'] })
      queryClient.invalidateQueries({ queryKey: ['badges-stats'] })
      queryClient.invalidateQueries({ queryKey: ['badges'] })
      setIsModalOpen(false)
      setSelectedBadge(null)
      toast.success('Badge modifié avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification du badge')
    }
  })

  const deleteBadgeMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/badges/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badges-all'] })
      queryClient.invalidateQueries({ queryKey: ['badges-stats'] })
      queryClient.invalidateQueries({ queryKey: ['badges'] })
      toast.success('Badge supprimé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du badge')
    }
  })

  const handleCreateBadge = () => {
    setSelectedBadge(null)
    setIsModalOpen(true)
  }

  const handleEditBadge = (badge: Badge) => {
    setSelectedBadge(badge)
    setIsModalOpen(true)
  }

  const handleDeleteBadge = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce badge ? Cette action est irréversible.')) {
      deleteBadgeMutation.mutate(id)
    }
  }

  const handleSubmit = (badgeData: Partial<Badge>) => {
    if (selectedBadge) {
      updateBadgeMutation.mutate({ ...badgeData, id: selectedBadge.id })
    } else {
      createBadgeMutation.mutate(badgeData)
    }
  }

  const badges = badgesData?.badges || []

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <TagIcon className="w-7 h-7 mr-3 text-blue-600" />
            Gestion des badges
          </h1>
          <p className="text-gray-600 mt-1">Gérez les badges et leurs couleurs</p>
        </div>
        <button
          onClick={handleCreateBadge}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Nouveau badge</span>
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <TagIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total badges</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalBadges}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <TagIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Badges utilisés</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.usedBadges}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gray-100">
                <TagIcon className="w-6 h-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Badges non utilisés</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.unusedBadges}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <BadgesTable
        data={badges}
        loading={isLoading}
        onEdit={handleEditBadge}
        onDelete={handleDeleteBadge}
      />

      {isModalOpen && (
        <BadgeModal
          badge={selectedBadge}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedBadge(null)
          }}
          onSubmit={handleSubmit}
          isSubmitting={createBadgeMutation.isPending || updateBadgeMutation.isPending}
        />
      )}
    </div>
  )
}

export default Badges