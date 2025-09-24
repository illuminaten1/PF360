import React, { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DocumentTextIcon,
  TrashIcon,
  BeakerIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import api from '@/utils/api'
import LogsTable from '@/components/tables/LogsTable'
import LogsFiltersModal from '@/components/forms/LogsFiltersModal'
import { toast } from 'react-hot-toast'
// Simple debounce implementation
const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

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
  filters: LogsFilters
}

interface LogsFilters {
  search?: string
  userId?: number
  action?: string
  entite?: string
  dateFrom?: string
  dateTo?: string
}

const Logs: React.FC = () => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isConfirmingGenerate, setIsConfirmingGenerate] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(100)
  const [quickSearch, setQuickSearch] = useState('')
  const [filters, setFilters] = useState<LogsFilters>({})

  const queryClient = useQueryClient()

  // Construction des paramètres de requête
  const queryParams = useMemo(() => ({
    page: currentPage,
    limit: pageSize,
    search: quickSearch || filters.search || undefined,
    userId: filters.userId,
    action: filters.action,
    entite: filters.entite,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo
  }), [currentPage, pageSize, quickSearch, filters])

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['logs', queryParams],
    queryFn: async (): Promise<LogsData> => {
      const params = new URLSearchParams()
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value))
        }
      })

      const response = await api.get(`/logs?${params.toString()}`)
      return response.data
    }
  })

  // Recherche rapide avec debounce
  const debouncedSearch = useMemo(
    () => debounce((searchValue: string) => {
      setCurrentPage(1)
      // Si on a une recherche rapide, on vide les filtres avancés pour éviter les conflits
      if (searchValue && filters.search) {
        setFilters(prev => ({ ...prev, search: undefined }))
      }
    }, 300),
    [filters.search]
  )

  const handleQuickSearchChange = useCallback((value: string) => {
    setQuickSearch(value)
    debouncedSearch(value)
  }, [debouncedSearch])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }, [])

  const handleFiltersApply = useCallback((newFilters: LogsFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
    // Vider la recherche rapide si on applique des filtres avancés avec recherche
    if (newFilters.search && quickSearch) {
      setQuickSearch('')
    }
  }, [quickSearch])

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).filter(value => value !== undefined && value !== '').length +
           (quickSearch ? 1 : 0)
  }, [filters, quickSearch])

  // Mutations pour les actions admin
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

  const handleExport = async (format: 'csv' | 'excel' = 'excel') => {
    try {
      const params = new URLSearchParams()
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && key !== 'page' && key !== 'limit') {
          params.append(key, String(value))
        }
      })
      params.append('format', format)

      const response = await api.get(`/logs/export?${params.toString()}`, {
        responseType: 'blob'
      })

      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      const filename = `logs_${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(`Export ${format.toUpperCase()} téléchargé`)
    } catch (error) {
      toast.error('Erreur lors de l\'export')
    }
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
                Consultation des logs d'activité système et utilisateur
              </p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => handleExport('csv')}
              disabled={isLoading}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
              CSV
            </button>

            <button
              onClick={() => handleExport('excel')}
              disabled={isLoading}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
              Excel
            </button>

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

        {/* Barre de recherche et filtres */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={quickSearch}
              onChange={(e) => handleQuickSearchChange(e.target.value)}
              placeholder="Recherche rapide dans les logs..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => setIsFiltersOpen(true)}
            className={`flex items-center px-4 py-2 text-sm font-medium border rounded-md transition-colors ${
              activeFiltersCount > 0
                ? 'bg-primary-100 text-primary-700 border-primary-300'
                : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="w-4 h-4 mr-2" />
            Filtres
            {activeFiltersCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-primary-600 text-white rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </button>
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
        <LogsTable
          data={logsData?.logs || []}
          pagination={logsData?.pagination}
          loading={isLoading}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      <LogsFiltersModal
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        currentFilters={filters}
        onApplyFilters={handleFiltersApply}
      />
    </div>
  )
}

export default Logs