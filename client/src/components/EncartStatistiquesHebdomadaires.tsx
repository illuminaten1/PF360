import React, { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
import { api } from '@/utils/api'

interface WeeklyStat {
  year: number
  semaine: number
  entrantes: number
  sortantes: number
  stock: number
  startDate: string
  endDate: string
}

interface RecentWeeklyStatsResponse {
  weeks: WeeklyStat[]
  totalWeeks: number
}

const EncartStatistiquesHebdomadaires: React.FC = () => {
  const [limit, setLimit] = useState(15)
  const tableRef = useRef<HTMLDivElement>(null)

  const { data: stats, isLoading, isError } = useQuery<RecentWeeklyStatsResponse>({
    queryKey: ['recent-weekly-stats', limit],
    queryFn: async () => {
      const response = await api.get(`/statistiques/recent?limit=${limit}`)
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

  // Les semaines sont déjà triées avec les plus récentes en premier
  const semainesTriees = stats.weeks

  // Fonction pour charger plus de données
  const loadMore = () => {
    if (stats.totalWeeks > limit) {
      setLimit(prev => Math.min(prev + 15, stats.totalWeeks))
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Flux Hebdomadaires
        </h3>
        <div className="text-sm text-gray-500">
          {semainesTriees.length} / {stats.totalWeeks} semaines
        </div>
      </div>
      
      <div className="flex flex-col flex-1 space-y-4">
        <div className="flex-1 overflow-hidden border rounded-lg">
          <div ref={tableRef} className="h-full overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="border-b border-gray-200">
                  <th className="px-3 py-2 text-left font-medium text-gray-900">Semaine</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-900">Ent.</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-900">Sort.</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-900">Diff.</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-900">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {semainesTriees.map((week, index) => {
                  const difference = week.entrantes - week.sortantes
                  const startDate = new Date(week.startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
                  const endDate = new Date(week.endDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
                  
                  // Calculer la tendance du stock par rapport à la semaine précédente (chronologiquement)
                  // Comme les données sont inversées, on compare avec l'index suivant pour la semaine précédente
                  let stockTrend = null
                  if (index < semainesTriees.length - 1) {
                    const previousWeekStock = semainesTriees[index + 1].stock
                    if (week.stock > previousWeekStock) {
                      stockTrend = 'up'
                    } else if (week.stock < previousWeekStock) {
                      stockTrend = 'down'
                    }
                  }
                  
                  return (
                    <tr key={`${week.year}-${week.semaine}`} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-900">
                        <div className="font-semibold">{week.year} - S{week.semaine}</div>
                        <div className="text-xs text-gray-500">({startDate} - {endDate})</div>
                      </td>
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
                      <td className="px-3 py-2 text-center font-medium text-gray-900">
                        <div className="flex items-center justify-center gap-1">
                          <span>{week.stock}</span>
                          {stockTrend === 'up' && (
                            <ArrowTrendingUpIcon className="w-4 h-4 text-red-500" />
                          )}
                          {stockTrend === 'down' && (
                            <ArrowTrendingDownIcon className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            
            {/* Bouton pour charger plus si il y a plus de données */}
            {stats.totalWeeks > limit && (
              <div className="p-4 text-center border-t border-gray-200">
                <button
                  onClick={loadMore}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Charger 15 semaines supplémentaires ({stats.totalWeeks - limit} restantes)
                </button>
              </div>
            )}
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