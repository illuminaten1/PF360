import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PlusIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import { Diligence } from '@/types'
import api from '@/utils/api'
import DiligenceTable from '@/components/tables/DiligenceTable'
import DiligenceModal from '@/components/forms/DiligenceModal'

const DiligencesPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDiligence, setSelectedDiligence] = useState<Diligence | null>(null)

  const queryClient = useQueryClient()

  const { data: diligenceData, isLoading } = useQuery({
    queryKey: ['diligences-all'],
    queryFn: async () => {
      const response = await api.get('/diligences')
      return response.data
    }
  })

  const { data: stats } = useQuery({
    queryKey: ['diligences-stats'],
    queryFn: async () => {
      const response = await api.get('/diligences/stats')
      return response.data
    }
  })

  const createDiligenceMutation = useMutation({
    mutationFn: async (diligenceData: Partial<Diligence>) => {
      const response = await api.post('/diligences', diligenceData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diligences-all'] })
      queryClient.invalidateQueries({ queryKey: ['diligences-stats'] })
      setIsModalOpen(false)
      setSelectedDiligence(null)
      toast.success('Diligence créée avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création de la diligence')
    }
  })

  const updateDiligenceMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Diligence> & { id: string }) => {
      const response = await api.put(`/diligences/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diligences-all'] })
      queryClient.invalidateQueries({ queryKey: ['diligences-stats'] })
      setIsModalOpen(false)
      setSelectedDiligence(null)
      toast.success('Diligence modifiée avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification de la diligence')
    }
  })

  const deleteDiligenceMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/diligences/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diligences-all'] })
      queryClient.invalidateQueries({ queryKey: ['diligences-stats'] })
      toast.success('Diligence supprimée avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression de la diligence')
    }
  })

  const handleCreateDiligence = () => {
    setSelectedDiligence(null)
    setIsModalOpen(true)
  }

  const handleEditDiligence = (diligence: Diligence) => {
    setSelectedDiligence(diligence)
    setIsModalOpen(true)
  }

  const handleDeleteDiligence = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette diligence ? Cette action est irréversible.')) {
      deleteDiligenceMutation.mutate(id)
    }
  }

  const handleSubmit = (diligenceData: Partial<Diligence>) => {
    if (selectedDiligence) {
      updateDiligenceMutation.mutate({ ...diligenceData, id: selectedDiligence.id })
    } else {
      createDiligenceMutation.mutate(diligenceData)
    }
  }

  const diligenceList = diligenceData || []

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ClipboardDocumentListIcon className="w-7 h-7 mr-3 text-purple-600" />
            Gestion des diligences
          </h1>
          <p className="text-gray-600 mt-1">Gérez les différents types de diligences et leur mode de tarification</p>
        </div>
        <button
          onClick={handleCreateDiligence}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors w-full sm:w-auto"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Nouvelle diligence</span>
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <ClipboardDocumentListIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total diligences</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalDiligences}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <DiligenceTable
        data={diligenceList}
        loading={isLoading}
        onEdit={handleEditDiligence}
        onDelete={handleDeleteDiligence}
      />

      {isModalOpen && (
        <DiligenceModal
          diligence={selectedDiligence}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedDiligence(null)
          }}
          onSubmit={handleSubmit}
          isSubmitting={createDiligenceMutation.isPending || updateDiligenceMutation.isPending}
        />
      )}
    </div>
  )
}

export default DiligencesPage