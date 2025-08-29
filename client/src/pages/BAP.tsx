import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PlusIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { BAP } from '@/types'
import api from '@/utils/api'
import BAPTable from '@/components/tables/BAPTable'
import BAPModal from '@/components/forms/BAPModal'

interface BAPStats {
  totalBAP: number
  usedBAP: number
  unusedBAP: number
}

const BAPPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedBAP, setSelectedBAP] = useState<BAP | null>(null)

  const queryClient = useQueryClient()

  const { data: bapData, isLoading } = useQuery({
    queryKey: ['bap-all'],
    queryFn: async () => {
      const response = await api.get('/bap')
      return response.data
    }
  })

  const { data: stats } = useQuery({
    queryKey: ['bap-stats'],
    queryFn: async () => {
      const response = await api.get('/bap/stats')
      return response.data
    }
  })

  const createBAPMutation = useMutation({
    mutationFn: async (bapData: Partial<BAP>) => {
      const response = await api.post('/bap', bapData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bap-all'] })
      queryClient.invalidateQueries({ queryKey: ['bap-stats'] })
      queryClient.invalidateQueries({ queryKey: ['bap'] })
      setIsModalOpen(false)
      setSelectedBAP(null)
      toast.success('BAP créé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création du BAP')
    }
  })

  const updateBAPMutation = useMutation({
    mutationFn: async ({ id, ...bapData }: Partial<BAP> & { id: string }) => {
      const response = await api.put(`/bap/${id}`, bapData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bap-all'] })
      queryClient.invalidateQueries({ queryKey: ['bap-stats'] })
      queryClient.invalidateQueries({ queryKey: ['bap'] })
      setIsModalOpen(false)
      setSelectedBAP(null)
      toast.success('BAP modifié avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification du BAP')
    }
  })

  const deleteBAPMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/bap/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bap-all'] })
      queryClient.invalidateQueries({ queryKey: ['bap-stats'] })
      queryClient.invalidateQueries({ queryKey: ['bap'] })
      toast.success('BAP supprimé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du BAP')
    }
  })

  const handleCreateBAP = () => {
    setSelectedBAP(null)
    setIsModalOpen(true)
  }

  const handleEditBAP = (bap: BAP) => {
    setSelectedBAP(bap)
    setIsModalOpen(true)
  }

  const handleDeleteBAP = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce BAP ? Cette action est irréversible.')) {
      deleteBAPMutation.mutate(id)
    }
  }

  const handleSubmit = (bapData: Partial<BAP>) => {
    if (selectedBAP) {
      updateBAPMutation.mutate({ ...bapData, id: selectedBAP.id })
    } else {
      createBAPMutation.mutate(bapData)
    }
  }

  const baps = bapData?.baps || []

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BuildingOfficeIcon className="w-7 h-7 mr-3 text-blue-600" />
            Gestion des BAP
          </h1>
          <p className="text-gray-600 mt-1">Gérez les Bureaux de l'Accompagnement des Personnels</p>
        </div>
        <button
          onClick={handleCreateBAP}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Nouveau BAP</span>
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total BAP</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalBAP}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <BuildingOfficeIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">BAP utilisés</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.usedBAP}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gray-100">
                <BuildingOfficeIcon className="w-6 h-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">BAP non utilisés</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.unusedBAP}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <BAPTable
        data={baps}
        loading={isLoading}
        onEdit={handleEditBAP}
        onDelete={handleDeleteBAP}
      />

      {isModalOpen && (
        <BAPModal
          bap={selectedBAP}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedBAP(null)
          }}
          onSubmit={handleSubmit}
          isSubmitting={createBAPMutation.isPending || updateBAPMutation.isPending}
        />
      )}
    </div>
  )
}

export default BAPPage