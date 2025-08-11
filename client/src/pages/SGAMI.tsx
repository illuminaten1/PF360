import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PlusIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { SGAMI } from '@/types'
import api from '@/utils/api'
import SGAMITable from '@/components/tables/SGAMITable'
import SGAMIModal from '@/components/forms/SGAMIModal'

interface SGAMIStats {
  totalSGAMI: number
  activeSGAMI: number
  inactiveSGAMI: number
}

const SGAMIPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSGAMI, setSelectedSGAMI] = useState<SGAMI | null>(null)

  const queryClient = useQueryClient()

  const { data: sgamiData, isLoading } = useQuery({
    queryKey: ['sgami-all'],
    queryFn: async () => {
      const response = await api.get('/sgami')
      return response.data
    }
  })

  const { data: stats } = useQuery({
    queryKey: ['sgami-stats'],
    queryFn: async () => {
      const response = await api.get('/sgami/stats')
      return response.data
    }
  })

  const createSGAMIMutation = useMutation({
    mutationFn: async (sgamiData: Partial<SGAMI>) => {
      const response = await api.post('/sgami', sgamiData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sgami-all'] })
      queryClient.invalidateQueries({ queryKey: ['sgami-stats'] })
      setIsModalOpen(false)
      setSelectedSGAMI(null)
      toast.success('SGAMI créé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création du SGAMI')
    }
  })

  const updateSGAMIMutation = useMutation({
    mutationFn: async ({ id, ...sgamiData }: Partial<SGAMI> & { id: string }) => {
      const response = await api.put(`/sgami/${id}`, sgamiData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sgami-all'] })
      queryClient.invalidateQueries({ queryKey: ['sgami-stats'] })
      setIsModalOpen(false)
      setSelectedSGAMI(null)
      toast.success('SGAMI modifié avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification du SGAMI')
    }
  })

  const deleteSGAMIMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/sgami/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sgami-all'] })
      queryClient.invalidateQueries({ queryKey: ['sgami-stats'] })
      toast.success('SGAMI supprimé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du SGAMI')
    }
  })

  const handleCreateSGAMI = () => {
    setSelectedSGAMI(null)
    setIsModalOpen(true)
  }

  const handleEditSGAMI = (sgami: SGAMI) => {
    setSelectedSGAMI(sgami)
    setIsModalOpen(true)
  }

  const handleDeleteSGAMI = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce SGAMI ? Cette action est irréversible.')) {
      deleteSGAMIMutation.mutate(id)
    }
  }

  const handleSubmit = (sgamiData: Partial<SGAMI>) => {
    if (selectedSGAMI) {
      updateSGAMIMutation.mutate({ ...sgamiData, id: selectedSGAMI.id })
    } else {
      createSGAMIMutation.mutate(sgamiData)
    }
  }

  const sgamiList = sgamiData || []

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BuildingOfficeIcon className="w-7 h-7 mr-3 text-blue-600" />
            Gestion des SGAMI
          </h1>
          <p className="text-gray-600 mt-1">Gérez les Services de Greffe et d'Appui aux Magistrats et à l'Institution</p>
        </div>
        <button
          onClick={handleCreateSGAMI}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Nouveau SGAMI</span>
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total SGAMI</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalSGAMI}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <SGAMITable
        data={sgamiList}
        loading={isLoading}
        onEdit={handleEditSGAMI}
        onDelete={handleDeleteSGAMI}
      />

      {isModalOpen && (
        <SGAMIModal
          sgami={selectedSGAMI}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedSGAMI(null)
          }}
          onSubmit={handleSubmit}
          isSubmitting={createSGAMIMutation.isPending || updateSGAMIMutation.isPending}
        />
      )}
    </div>
  )
}

export default SGAMIPage