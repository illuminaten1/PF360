import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  XMarkIcon,
  FunnelIcon,
  CalendarDaysIcon,
  UserIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import api from '@/utils/api'
import dayjs from 'dayjs'

interface LogsFilters {
  search?: string
  userId?: number
  action?: string
  dateFrom?: string
  dateTo?: string
}

interface LogsFiltersModalProps {
  isOpen: boolean
  onClose: () => void
  currentFilters: LogsFilters
  onApplyFilters: (filters: LogsFilters) => void
}

const LogsFiltersModal: React.FC<LogsFiltersModalProps> = ({
  isOpen,
  onClose,
  currentFilters,
  onApplyFilters
}) => {
  const [filters, setFilters] = useState<LogsFilters>(currentFilters)

  useEffect(() => {
    setFilters(currentFilters)
  }, [currentFilters, isOpen])

  // Récupération des utilisateurs pour le filtre
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/demandes/users')
      return response.data
    },
    enabled: isOpen
  })

  // Récupération des actions et entités distinctes
  const { data: distinctValues, isLoading: distinctValuesLoading } = useQuery({
    queryKey: ['logs-distinct-values'],
    queryFn: async () => {
      const response = await api.get('/logs/distinct-values')
      return response.data
    },
    enabled: isOpen
  })

  const handleApply = () => {
    onApplyFilters(filters)
    onClose()
  }

  // Debug: log des données récupérées
  React.useEffect(() => {
    if (users) {
      console.log('Users loaded:', users)
    }
  }, [users])

  React.useEffect(() => {
    if (distinctValues) {
      console.log('Distinct values loaded:', distinctValues)
    }
  }, [distinctValues])

  const handleReset = () => {
    const emptyFilters: LogsFilters = {}
    setFilters(emptyFilters)
    onApplyFilters(emptyFilters)
    onClose()
  }

  const updateFilter = (key: keyof LogsFilters, value: string | number | undefined) => {
    console.log(`Updating filter ${key}:`, value)
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [key]: value || undefined
      }
      console.log('New filters:', newFilters)
      return newFilters
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-6 h-6 text-primary-600" />
              <h3 className="text-lg font-medium text-gray-900">
                Filtres avancés
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Recherche globale */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recherche globale
              </label>
              <input
                type="text"
                value={filters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value)}
                placeholder="Rechercher dans actions, détails, entités..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Filtre utilisateur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <UserIcon className="w-4 h-4 inline mr-1" />
                Utilisateur {usersLoading && <span className="text-xs text-gray-500">(chargement...)</span>}
              </label>
              <select
                value={filters.userId?.toString() || ''}
                onChange={(e) => {
                  console.log('User select changed, target value:', e.target.value, 'type:', typeof e.target.value)
                  updateFilter('userId', e.target.value ? Number(e.target.value) : undefined)
                }}
                disabled={usersLoading}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Tous les utilisateurs</option>
                {users?.map((user: any) => (
                  <option key={user.id} value={user.id}>
                    {user.prenom} {user.nom}{user.identifiant ? ` (${user.identifiant})` : ''}
                  </option>
                ))}
              </select>
              {users && (
                <div className="text-xs text-gray-500 mt-1">
                  {users.length} utilisateurs trouvés | Valeur actuelle: {filters.userId || 'aucune'}
                </div>
              )}
            </div>

            {/* Filtre action */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <TagIcon className="w-4 h-4 inline mr-1" />
                Action {distinctValuesLoading && <span className="text-xs text-gray-500">(chargement...)</span>}
              </label>
              <select
                value={filters.action || ''}
                onChange={(e) => {
                  console.log('Action select changed, target value:', e.target.value, 'type:', typeof e.target.value)
                  updateFilter('action', e.target.value || undefined)
                }}
                disabled={distinctValuesLoading}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Toutes les actions</option>
                {distinctValues?.actions?.map((action: string) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
              {distinctValues?.actions && (
                <div className="text-xs text-gray-500 mt-1">
                  {distinctValues.actions.length} actions trouvées | Valeur actuelle: {filters.action || 'aucune'}
                </div>
              )}
            </div>


            {/* Filtres de dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <CalendarDaysIcon className="w-4 h-4 inline mr-1" />
                  Date début
                </label>
                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                  max={dayjs().format('YYYY-MM-DD')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date fin
                </label>
                <input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                  max={dayjs().format('YYYY-MM-DD')}
                  min={filters.dateFrom || undefined}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Réinitialiser
            </button>
            <div className="flex space-x-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Annuler
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Appliquer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LogsFiltersModal