import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PlusIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import { Diligence } from '@/types'
import api from '@/utils/api'
import DiligenceTable from '@/components/tables/DiligenceTable'
import DiligenceModal from '@/components/forms/DiligenceModal'

interface DiligenceStats {
  totalDiligences: number
  activeDiligences: number
  inactiveDiligences: number
  forfaitaires: number
  demiJournee: number
}

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
      toast.error(error.response?.data?.error || 'Erreur lors de la création')
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
      toast.error(error.response?.data?.error || 'Erreur lors de la modification')
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
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression')
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

  const handleDeleteDiligence = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette diligence ?')) {
      deleteDiligenceMutation.mutate(id)
    }
  }

  const handleSubmit = (data: Partial<Diligence>) => {
    if (selectedDiligence) {
      updateDiligenceMutation.mutate({ ...data, id: selectedDiligence.id })
    } else {
      createDiligenceMutation.mutate(data)
    }
  }

  return (
    <div className="px-6 py-8">
      {/* En-tête */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardDocumentListIcon className="h-6 w-6" />
            Gestion des diligences
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Gérez les différents types de diligences et leur mode de tarification
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={handleCreateDiligence}
            className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <PlusIcon className="h-4 w-4 inline mr-2" />
            Nouvelle diligence
          </button>
        </div>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total diligences
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalDiligences}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 bg-green-500 rounded-full"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Actives
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.activeDiligences}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 bg-red-500 rounded-full"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Inactives
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.inactiveDiligences}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 bg-blue-500 rounded-full"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Forfaitaires
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.forfaitaires}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 bg-purple-500 rounded-full"></div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Demi-journée
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.demiJournee}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tableau */}
      <div className="mt-8">
        <DiligenceTable
          data={diligenceData || []}
          isLoading={isLoading}
          onEdit={handleEditDiligence}
          onDelete={handleDeleteDiligence}
        />
      </div>

      {/* Modal */}
      <DiligenceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedDiligence(null)
        }}
        onSubmit={handleSubmit}
        diligence={selectedDiligence}
        isLoading={createDiligenceMutation.isPending || updateDiligenceMutation.isPending}
      />
    </div>
  )
}

export default DiligencesPage