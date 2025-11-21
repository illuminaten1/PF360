import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PlusIcon } from '@heroicons/react/24/outline'
import { Dossier } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/utils/api'
import DossiersTableV2 from '@/components/tables/DossiersTableV2'
import { ServerDataTableRef } from '@/components/tables'
import DossierModal from '@/components/forms/DossierModal'

interface DossiersStats {
  totalDossiers: number
  dossiersToday: number
  dossiersNonAssignes: number
  mesDossiers: number
}

const Dossiers: React.FC = () => {
  const navigate = useNavigate()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null)
  const { user } = useAuth()
  const tableRef = useRef<ServerDataTableRef>(null)

  const queryClient = useQueryClient()

  // Fetch stats
  const { data: stats } = useQuery<DossiersStats>({
    queryKey: ['dossiers-stats'],
    queryFn: async () => {
      const response = await api.get('/dossiers/stats')
      return response.data
    }
  })

  // Fetch facets for filters
  const { data: facets } = useQuery({
    queryKey: ['dossiers-facets'],
    queryFn: async () => {
      const response = await api.get('/dossiers/facets')
      return response.data
    },
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  })

  // Create dossier mutation
  const createDossierMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/dossiers', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers-stats'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers-facets'] })
      toast.success('Dossier créé avec succès')
      tableRef.current?.refetch()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la création')
    }
  })

  // Update dossier mutation
  const updateDossierMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/dossiers/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers-stats'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers-facets'] })
      toast.success('Dossier modifié avec succès')
      tableRef.current?.refetch()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification')
    }
  })

  // Delete dossier mutation
  const deleteDossierMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/dossiers/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers-stats'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers-facets'] })
      toast.success('Dossier supprimé avec succès')
      tableRef.current?.refetch()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression')
    }
  })

  const handleCreateDossier = () => {
    setSelectedDossier(null)
    setIsModalOpen(true)
  }

  const handleEditDossier = (dossier: Dossier) => {
    setSelectedDossier(dossier)
    setIsModalOpen(true)
  }

  const handleViewDossier = (dossier: Dossier) => {
    navigate(`/dossiers/${dossier.id}`)
  }

  const handleDeleteDossier = (dossier: Dossier) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le dossier ${dossier.numero} ?`)) {
      deleteDossierMutation.mutate(dossier.id)
    }
  }

  const handleSubmitDossier = async (data: any) => {
    if (selectedDossier) {
      await updateDossierMutation.mutateAsync({ id: selectedDossier.id, data })
    } else {
      await createDossierMutation.mutateAsync(data)
    }
  }

  const applyMyDossiersFilter = useCallback(() => {
    if (tableRef.current && user) {
      const userFullName = `${user.grade || ''} ${user.prenom} ${user.nom}`.trim()

      tableRef.current.setColumnFilters([
        {
          id: 'assigneA',
          value: [userFullName]
        }
      ])
    }
  }, [user])

  // Appliquer automatiquement le filtre "mes-dossiers" si demandé via sessionStorage
  useEffect(() => {
    const filterToApply = sessionStorage.getItem('dossiers-apply-filter')
    if (filterToApply === 'mes-dossiers' && tableRef.current && user) {
      // Attendre que le composant soit entièrement monté
      const timer = setTimeout(() => {
        applyMyDossiersFilter()
        // Nettoyer le sessionStorage après application
        sessionStorage.removeItem('dossiers-apply-filter')
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [user, applyMyDossiersFilter])

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dossiers</h1>
            <p className="mt-1 text-sm text-gray-600">
              Gestion des dossiers
            </p>
          </div>
          <button
            onClick={handleCreateDossier}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nouveau dossier
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex flex-col gap-6 mb-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Mes dossiers - Section séparée */}
              <div className="md:w-64">
                <div className="text-sm font-medium text-gray-700 mb-3">Personnel</div>
                <div
                  className="bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-md hover:scale-105 border border-transparent hover:border-indigo-200"
                  onClick={applyMyDossiersFilter}
                  title="Cliquer pour filtrer tous mes dossiers assignés"
                >
                  <div className="text-2xl font-bold text-indigo-600">{stats.mesDossiers}</div>
                  <div className="text-sm text-gray-600">Mes dossiers</div>
                </div>
              </div>

              {/* Statistiques de l'année et aujourd'hui */}
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700 mb-3">Année {new Date().getFullYear()}</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-2xl font-bold text-gray-900">{stats.totalDossiers}</div>
                    <div className="text-sm text-gray-600">Total dossiers</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                    <div className="text-2xl font-bold text-green-600">{stats.dossiersToday}</div>
                    <div className="text-sm text-gray-600">Créés aujourd'hui</div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
                    <div className="text-2xl font-bold text-red-600">{stats.dossiersNonAssignes}</div>
                    <div className="text-sm text-gray-600">Non assignés</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <DossiersTableV2
        ref={tableRef}
        onView={handleViewDossier}
        onEdit={handleEditDossier}
        onDelete={handleDeleteDossier}
        facets={facets}
      />

      <DossierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitDossier}
        dossier={selectedDossier}
        title={selectedDossier ? 'Modifier le dossier' : 'Créer un nouveau dossier'}
      />
    </div>
  )
}

export default Dossiers
