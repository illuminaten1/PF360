import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
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
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError || !stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Statistiques hebdomadaires</h3>
        <p className="text-sm text-red-600">Erreur lors du chargement des statistiques</p>
      </div>
    )
  }

  // Calculer les totaux de l'année
  const totaux = stats.weeks.reduce((acc, week) => ({
    entrantes: acc.entrantes + week.entrantes,
    sortantes: acc.sortantes + week.sortantes
  }), { entrantes: 0, sortantes: 0 })

  // Stock actuel (dernier stock de l'année)
  const stockActuel = stats.weeks[stats.weeks.length - 1]?.stock || 0

  // Moyennes par semaine
  const moyenneEntrantes = Math.round(totaux.entrantes / 52 * 10) / 10
  const moyenneSortantes = Math.round(totaux.sortantes / 52 * 10) / 10

  // Calculer la tendance (comparaison 4 dernières semaines vs 4 précédentes)
  const derniereSemaine = Math.max(...stats.weeks.map(w => w.semaine))
  const dernieresSemaines = stats.weeks.filter(w => w.semaine > derniereSemaine - 4)
  const semainesPrecedentes = stats.weeks.filter(w => w.semaine <= derniereSemaine - 4 && w.semaine > derniereSemaine - 8)
  
  const moyenneDernieres = dernieresSemaines.reduce((sum, w) => sum + (w.entrantes - w.sortantes), 0) / 4
  const moyennePrecedentes = semainesPrecedentes.reduce((sum, w) => sum + (w.entrantes - w.sortantes), 0) / 4
  const tendance = moyenneDernieres - moyennePrecedentes

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Statistiques {stats.year}</h3>
        <div className="flex items-center">
          {tendance > 0 ? (
            <ArrowTrendingUpIcon className="h-5 w-5 text-red-500 mr-1" />
          ) : (
            <ArrowTrendingDownIcon className="h-5 w-5 text-green-500 mr-1" />
          )}
          <span className={`text-sm font-medium ${tendance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {tendance > 0 ? '+' : ''}{Math.round(tendance * 10) / 10}/sem
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{totaux.entrantes}</div>
          <div className="text-sm text-blue-600">Entrantes</div>
          <div className="text-xs text-gray-500">{moyenneEntrantes}/sem</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{totaux.sortantes}</div>
          <div className="text-sm text-green-600">Sortantes</div>
          <div className="text-xs text-gray-500">{moyenneSortantes}/sem</div>
        </div>
      </div>

      <div className="text-center p-3 bg-gray-50 rounded-lg mb-4">
        <div className={`text-2xl font-bold ${stockActuel >= 0 ? 'text-orange-600' : 'text-purple-600'}`}>
          {stockActuel}
        </div>
        <div className="text-sm text-gray-600">Stock actuel</div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
          <span>Sem. 1</span>
          <span>Sem. 52</span>
        </div>
        <div className="h-16 bg-gray-100 rounded overflow-hidden flex items-end">
          {stats.weeks.map((week) => {
            const maxStock = Math.max(...stats.weeks.map(w => Math.abs(w.stock)))
            const hauteur = maxStock === 0 ? 0 : Math.abs(week.stock) / maxStock * 100
            
            return (
              <div
                key={week.semaine}
                className="flex-1 flex items-end"
                title={`Semaine ${week.semaine}: Stock ${week.stock}`}
              >
                <div
                  className={`w-full ${week.stock >= 0 ? 'bg-orange-400' : 'bg-purple-400'} opacity-70 hover:opacity-100 transition-opacity`}
                  style={{ height: `${hauteur}%`, minHeight: week.stock !== 0 ? '2px' : '0px' }}
                ></div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default EncartStatistiquesHebdomadaires