import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/utils/api'

interface WeeklyStat {
  semaine: number
  entrantes: number
  sortantes: number
  stock: number
}

interface WeeklyStatsResponse {
  year: number
  weeks: WeeklyStat[]
}

const EncartStatistiquesHebdomadaires: React.FC = () => {
  const { data: stats, isLoading, isError } = useQuery<WeeklyStatsResponse>({
    queryKey: ['weekly-stats'],
    queryFn: async () => {
      const response = await api.get('/statistiques/weekly')
      return response.data
    }
  })

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (isError || !stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Flux Hebdomadaires</h3>
        <p className="text-sm text-red-600">Erreur lors du chargement des statistiques</p>
      </div>
    )
  }

  // Trier les semaines par numéro de semaine
  const semainesTriees = [...stats.weeks].sort((a, b) => a.semaine - b.semaine)

  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col h-full">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Flux Hebdomadaires - {stats.year}
      </h3>
      
      <div className="flex flex-col flex-1 space-y-4">
        <div className="flex-1 overflow-hidden border rounded-lg">
          <div className="h-full overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="border-b border-gray-200">
                  <th className="px-3 py-2 text-left font-medium text-gray-900">Sem.</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-900">Ent.</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-900">Sort.</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-900">Diff.</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-900">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {semainesTriees.map((week) => {
                  const difference = week.entrantes - week.sortantes
                  return (
                    <tr key={week.semaine} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-900">{week.semaine}</td>
                      <td className="px-3 py-2 text-center text-blue-600 font-medium">{week.entrantes}</td>
                      <td className="px-3 py-2 text-center text-green-600 font-medium">{week.sortantes}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          difference > 0 ? 'bg-red-100 text-red-700' : 
                          difference < 0 ? 'bg-green-100 text-green-700' : 
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {difference > 0 ? '+' : ''}{difference}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center font-medium text-gray-900">{week.stock}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Dossiers entrants</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Dossiers sortants</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EncartStatistiquesHebdomadaires