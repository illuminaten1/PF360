import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DocumentTextIcon, TrashIcon, BeakerIcon } from '@heroicons/react/24/outline'
import api from '@/utils/api'
import LogsTable from '@/components/tables/LogsTable'
import { toast } from 'react-hot-toast'

interface Log {
  id: number
  userId: number
  action: string
  detail: string | null
  entite: string | null
  entiteId: number | null
  timestamp: string
  user: {
    nom: string
    prenom: string
    identifiant: string
  }
}

interface LogsData {
  logs: Log[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

const Logs: React.FC = () => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isConfirmingGenerate, setIsConfirmingGenerate] = useState(false)
  const queryClient = useQueryClient()

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: async (): Promise<LogsData> => {
      const response = await api.get('/logs')
      return response.data
    }
  })

  const deleteAllDemandesMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/logs/delete-all-demandes')
      return response.data
    },
    onSuccess: (data) => {
      toast.success(data.message)
      setIsConfirmingDelete(false)
      queryClient.invalidateQueries({ queryKey: ['logs'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression')
      setIsConfirmingDelete(false)
    }
  })

  const generateTestDemandesMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/logs/generate-test-demandes')
      return response.data
    },
    onSuccess: (data) => {
      toast.success(data.message)
      setIsConfirmingGenerate(false)
      queryClient.invalidateQueries({ queryKey: ['logs'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la génération')
      setIsConfirmingGenerate(false)
    }
  })

  const handleDeleteAll = () => {
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true)
      return
    }
    deleteAllDemandesMutation.mutate()
  }

  const handleGenerateTest = () => {
    if (!isConfirmingGenerate) {
      setIsConfirmingGenerate(true)
      return
    }
    generateTestDemandesMutation.mutate()
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Journal des activités</h1>
              <p className="text-gray-600">
                Consultation des logs d&apos;activité système et utilisateur
              </p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleDeleteAll}
              disabled={deleteAllDemandesMutation.isPending}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isConfirmingDelete
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              } ${deleteAllDemandesMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              {deleteAllDemandesMutation.isPending
                ? 'Suppression...'
                : isConfirmingDelete
                ? 'Confirmer suppression'
                : 'Supprimer toutes les demandes'
              }
            </button>
            
            <button
              onClick={handleGenerateTest}
              disabled={generateTestDemandesMutation.isPending}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isConfirmingGenerate
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              } ${generateTestDemandesMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <BeakerIcon className="w-4 h-4 mr-2" />
              {generateTestDemandesMutation.isPending
                ? 'Génération...'
                : isConfirmingGenerate
                ? 'Confirmer génération'
                : 'Générer demandes de test'
              }
            </button>
          </div>
        </div>
        
        {(isConfirmingDelete || isConfirmingGenerate) && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              {isConfirmingDelete && "⚠️ Cette action va supprimer toutes les demandes et dossiers de la base de données. Cliquez à nouveau pour confirmer."}
              {isConfirmingGenerate && "⚠️ Cette action va générer des données de test dans la base de données. Cliquez à nouveau pour confirmer."}
            </p>
            <button
              onClick={() => {
                setIsConfirmingDelete(false)
                setIsConfirmingGenerate(false)
              }}
              className="mt-2 text-sm text-yellow-600 hover:text-yellow-800 underline"
            >
              Annuler
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <LogsTable data={logsData?.logs || []} />
        )}
      </div>
    </div>
  )
}

export default Logs