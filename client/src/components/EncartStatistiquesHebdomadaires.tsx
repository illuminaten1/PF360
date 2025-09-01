import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDownIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'
import { Listbox, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { api } from '@/utils/api'

interface WeeklyStat {
  semaine: number
  entrantes: number
  sortantes: number
  stock: number
  startDate: string
  endDate: string
}

interface WeeklyStatsResponse {
  year: number
  weeks: WeeklyStat[]
}

const EncartStatistiquesHebdomadaires: React.FC = () => {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)

  // Récupérer les années disponibles depuis l'API
  const { data: availableYears = [] } = useQuery<number[]>({
    queryKey: ['available-years'],
    queryFn: async () => {
      const response = await api.get('/statistiques/years')
      return response.data
    }
  })

  const { data: stats, isLoading, isError } = useQuery<WeeklyStatsResponse>({
    queryKey: ['weekly-stats', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/weekly?year=${selectedYear}`)
      return response.data
    },
    enabled: availableYears.length > 0
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

  // Fonction pour obtenir le numéro de semaine ISO (identique au serveur)
  const getISOWeek = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }

  // Obtenir la semaine courante pour l'année des statistiques
  const now = new Date()
  let semaineCourante = 53 // Par défaut, afficher toutes les semaines pour les années passées
  
  // Si on affiche les statistiques de l'année courante, calculer la semaine actuelle ISO
  if (selectedYear === currentYear) {
    semaineCourante = getISOWeek(now)
  }

  // Trier les semaines par numéro de semaine et filtrer jusqu'à la semaine courante
  const semainesTriees = [...stats.weeks]
    .filter(week => week.semaine <= semaineCourante)
    .sort((a, b) => a.semaine - b.semaine)

  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Flux Hebdomadaires
        </h3>
        <Listbox value={selectedYear} onChange={setSelectedYear}>
          <div className="relative">
            <Listbox.Button className="relative w-24 bg-white border border-gray-300 rounded-md pl-3 pr-8 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer text-left">
              <span className="block truncate">{selectedYear}</span>
              <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDownIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </span>
            </Listbox.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Listbox.Options className="absolute z-10 mt-1 w-24 bg-white shadow-lg max-h-40 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                {availableYears.map((year) => (
                  <Listbox.Option
                    key={year}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 px-3 ${
                        active ? 'text-blue-900 bg-blue-100' : 'text-gray-900'
                      }`
                    }
                    value={year}
                  >
                    {({ selected }) => (
                      <span
                        className={`block truncate ${
                          selected ? 'font-semibold' : 'font-normal'
                        }`}
                      >
                        {year}
                      </span>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>
      </div>
      
      <div className="flex flex-col flex-1 space-y-4">
        <div className="flex-1 overflow-hidden border rounded-lg">
          <div className="h-full overflow-y-auto">
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
                  
                  // Calculer la tendance du stock par rapport à la semaine précédente
                  let stockTrend = null
                  if (index > 0) {
                    const previousStock = semainesTriees[index - 1].stock
                    if (week.stock > previousStock) {
                      stockTrend = 'up'
                    } else if (week.stock < previousStock) {
                      stockTrend = 'down'
                    }
                  }
                  
                  return (
                    <tr key={week.semaine} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-900">
                        <div className="font-semibold">{week.semaine}</div>
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