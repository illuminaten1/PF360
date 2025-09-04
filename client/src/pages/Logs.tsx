import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { DocumentTextIcon } from '@heroicons/react/24/outline'
import api from '@/utils/api'
import LogsTable from '@/components/tables/LogsTable'

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
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['logs'],
    queryFn: async (): Promise<LogsData> => {
      const response = await api.get('/logs')
      return response.data
    }
  })

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <DocumentTextIcon className="w-8 h-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">Journal des activités</h1>
        </div>
        <p className="text-gray-600">
          Consultation des logs d&apos;activité système et utilisateur
        </p>
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