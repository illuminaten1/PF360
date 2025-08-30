import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { PCE } from '@/types'
import api from '@/utils/api'
import PCETable from '@/components/tables/PCETable'
import DraggablePCETable from '@/components/tables/DraggablePCETable'
import PCEModal from '@/components/forms/PCEModal'


const PCEPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPCE, setSelectedPCE] = useState<PCE | null>(null)
  const [useDraggableTable, setUseDraggableTable] = useState(false)

  const queryClient = useQueryClient()

  const { data: pceData, isLoading } = useQuery({
    queryKey: ['pce-all'],
    queryFn: async () => {
      const response = await api.get('/pce')
      return response.data
    }
  })

  const { data: stats } = useQuery({
    queryKey: ['pce-stats'],
    queryFn: async () => {
      const response = await api.get('/pce/stats')
      return response.data
    }
  })

  const createPCEMutation = useMutation({
    mutationFn: async (pceData: Partial<PCE>) => {
      const response = await api.post('/pce', pceData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pce-all'] })
      queryClient.invalidateQueries({ queryKey: ['pce-stats'] })
      setIsModalOpen(false)
      setSelectedPCE(null)
      toast.success('PCE créé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création du PCE')
    }
  })

  const updatePCEMutation = useMutation({
    mutationFn: async ({ id, ...pceData }: Partial<PCE> & { id: string }) => {
      const response = await api.put(`/pce/${id}`, pceData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pce-all'] })
      queryClient.invalidateQueries({ queryKey: ['pce-stats'] })
      setIsModalOpen(false)
      setSelectedPCE(null)
      toast.success('PCE modifié avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification du PCE')
    }
  })

  const deletePCEMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/pce/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pce-all'] })
      queryClient.invalidateQueries({ queryKey: ['pce-stats'] })
      toast.success('PCE supprimé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du PCE')
    }
  })

  const reorderPCEMutation = useMutation({
    mutationFn: async (pceList: PCE[]) => {
      const response = await api.put('/pce/reorder', { pceList })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pce-all'] })
      toast.success('Ordre des PCE mis à jour')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la réorganisation')
    }
  })

  const handleCreatePCE = () => {
    setSelectedPCE(null)
    setIsModalOpen(true)
  }

  const handleEditPCE = (pce: PCE) => {
    setSelectedPCE(pce)
    setIsModalOpen(true)
  }

  const handleDeletePCE = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce PCE ? Cette action est irréversible.')) {
      deletePCEMutation.mutate(id)
    }
  }

  const handleSubmit = (pceData: Partial<PCE>) => {
    if (selectedPCE) {
      updatePCEMutation.mutate({ ...pceData, id: selectedPCE.id })
    } else {
      createPCEMutation.mutate(pceData)
    }
  }

  const handleReorder = (newOrder: PCE[]) => {
    reorderPCEMutation.mutate(newOrder)
  }

  const pceList = pceData || []

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <DocumentTextIcon className="w-7 h-7 mr-3 text-green-600" />
            Gestion des PCE
          </h1>
          <p className="text-gray-600 mt-1">Gérez les Plans Comptables de l'État</p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={useDraggableTable}
              onChange={(e) => setUseDraggableTable(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">Mode réorganisation</span>
          </label>
          <button
            onClick={handleCreatePCE}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Nouveau PCE</span>
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <DocumentTextIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total PCE</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalPCE}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {useDraggableTable ? (
        <DraggablePCETable
          data={pceList}
          loading={isLoading}
          onEdit={handleEditPCE}
          onDelete={handleDeletePCE}
          onReorder={handleReorder}
        />
      ) : (
        <PCETable
          data={pceList}
          loading={isLoading}
          onEdit={handleEditPCE}
          onDelete={handleDeletePCE}
        />
      )}

      {isModalOpen && (
        <PCEModal
          pce={selectedPCE}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedPCE(null)
          }}
          onSubmit={handleSubmit}
          isSubmitting={createPCEMutation.isPending || updatePCEMutation.isPending}
        />
      )}
    </div>
  )
}

export default PCEPage