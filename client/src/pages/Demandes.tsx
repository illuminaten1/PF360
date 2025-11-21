import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PlusIcon } from '@heroicons/react/24/outline'
import { Demande } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/utils/api'
import DemandesTableV2 from '@/components/tables/DemandesTableV2'
import { ServerDataTableRef } from '@/components/tables'
import DemandeModal from '@/components/forms/DemandeModal'
import DemandeViewModal from '@/components/forms/DemandeViewModal'
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal'
import LierDemandesMultiplesDossierModal from '@/components/forms/LierDemandesMultiplesDossierModal'
import DossierModal from '@/components/forms/DossierModal'

interface DemandesStats {
  totalDemandes: number
  demandesToday: number
  demandesNonAffecteesAnnee: number
  demandesSansDecision: number
  demandesNonAffecteesToday: number
  mesDemandes: number
}

const Demandes: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isLierMultiplesModalOpen, setIsLierMultiplesModalOpen] = useState(false)
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)
  const [selectedDemandesForDossier, setSelectedDemandesForDossier] = useState<Demande[]>([])
  const { user } = useAuth()
  const tableRef = useRef<ServerDataTableRef>(null)

  const queryClient = useQueryClient()

  // Fetch stats
  const { data: stats } = useQuery<DemandesStats>({
    queryKey: ['demandes-stats'],
    queryFn: async () => {
      const response = await api.get('/demandes/stats')
      return response.data
    }
  })

  // Fetch facets for filters
  const { data: facets } = useQuery({
    queryKey: ['demandes-facets'],
    queryFn: async () => {
      const response = await api.get('/demandes/facets')
      return response.data
    },
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  })

  // Create demande mutation
  const createDemandeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/demandes', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandes'] })
      queryClient.invalidateQueries({ queryKey: ['demandes-stats'] })
      queryClient.invalidateQueries({ queryKey: ['demandes-facets'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      toast.success('Demande créée avec succès')
      tableRef.current?.refetch()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la création')
    }
  })

  // Update demande mutation
  const updateDemandeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/demandes/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandes'] })
      queryClient.invalidateQueries({ queryKey: ['demandes-stats'] })
      queryClient.invalidateQueries({ queryKey: ['demandes-facets'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      toast.success('Demande modifiée avec succès')
      tableRef.current?.refetch()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification')
    }
  })

  // Delete demande mutation
  const deleteDemandeMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/demandes/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandes'] })
      queryClient.invalidateQueries({ queryKey: ['demandes-stats'] })
      queryClient.invalidateQueries({ queryKey: ['demandes-facets'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      toast.success('Demande supprimée avec succès')
      tableRef.current?.refetch()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression')
    }
  })

  // Create dossier mutation
  const createDossierMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/dossiers', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandes'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      toast.success('Dossier créé et demandes liées avec succès')
      // Fermer le modal et réinitialiser la sélection
      setIsDossierModalOpen(false)
      setSelectedDemandesForDossier([])
      tableRef.current?.refetch()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la création du dossier')
    }
  })

  const handleCreateDemande = () => {
    setSelectedDemande(null)
    setIsModalOpen(true)
  }

  const handleEditDemande = (demande: Demande) => {
    setSelectedDemande(demande)
    setIsModalOpen(true)
  }

  const handleViewDemande = (demande: Demande) => {
    setSelectedDemande(demande)
    setIsViewModalOpen(true)
  }

  const handleDeleteDemande = (demande: Demande) => {
    // Vérifier les permissions avant de permettre la suppression
    if (!user || !['ADMIN', 'GREFFIER'].includes(user.role)) {
      toast.error("Vous n'avez pas les permissions pour supprimer des demandes")
      return
    }

    setSelectedDemande(demande)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = () => {
    if (selectedDemande) {
      deleteDemandeMutation.mutate(selectedDemande.id)
      setIsDeleteModalOpen(false)
      setSelectedDemande(null)
    }
  }

  const handleCloseDeleteModal = () => {
    if (!deleteDemandeMutation.isPending) {
      setIsDeleteModalOpen(false)
      setSelectedDemande(null)
    }
  }

  const handleAddToDossier = (demande: Demande) => {
    setSelectedDemandesForDossier([demande])
    setIsLierMultiplesModalOpen(true)
  }

  const handleCreateDossierWithSelection = (selectedDemandes: Demande[]) => {
    setSelectedDemandesForDossier(selectedDemandes)
    setIsDossierModalOpen(true)
  }

  const handleLinkToExistingDossier = (selectedDemandes: Demande[]) => {
    setSelectedDemandesForDossier(selectedDemandes)
    setIsLierMultiplesModalOpen(true)
  }

  const handleBulkAssignToUser = (selectedDemandes: Demande[]) => {
    // This function is called when bulk assignment is triggered
    // The actual modal and logic is handled within DemandesTable component
    console.log('Bulk assignment requested for', selectedDemandes.length, 'demandes')
  }

  const handleSubmitDemande = async (data: any) => {
    if (selectedDemande) {
      await updateDemandeMutation.mutateAsync({ id: selectedDemande.id, data })
    } else {
      await createDemandeMutation.mutateAsync(data)
    }
    setIsModalOpen(false)
    setSelectedDemande(null)
  }

  const handleSubmitDossier = async (data: any) => {
    await createDossierMutation.mutateAsync(data)
  }

  // Fonctions pour appliquer les filtres depuis les statistiques
  const applyYearFilter = () => {
    const currentYear = new Date().getFullYear()
    const startOfYear = `${currentYear}-01-01`

    tableRef.current?.setColumnFilters([
      {
        id: 'dateReception',
        value: { from: startOfYear }
      }
    ])
  }

  const applyUnassignedYearFilter = () => {
    const currentYear = new Date().getFullYear()
    const startOfYear = `${currentYear}-01-01`

    tableRef.current?.setColumnFilters([
      {
        id: 'dateReception',
        value: { from: startOfYear }
      },
      {
        id: 'assigneA',
        value: ['Non assigné']
      }
    ])
  }

  const applyTodayFilter = () => {
    const today = new Date().toISOString().split('T')[0]

    tableRef.current?.setColumnFilters([
      {
        id: 'dateReception',
        value: { from: today, to: today }
      }
    ])
  }

  const applyTodayUnassignedFilter = () => {
    const today = new Date().toISOString().split('T')[0]

    tableRef.current?.setColumnFilters([
      {
        id: 'dateReception',
        value: { from: today, to: today }
      },
      {
        id: 'assigneA',
        value: ['Non assigné']
      }
    ])
  }

  const applyMyDemandesFilter = useCallback(() => {
    if (user) {
      const userFullName = `${user.grade || ''} ${user.prenom} ${user.nom}`.trim()

      tableRef.current?.setColumnFilters([
        {
          id: 'assigneA',
          value: [userFullName]
        }
      ])
    }
  }, [user])

  // Appliquer automatiquement le filtre "mes-demandes" si demandé via sessionStorage
  useEffect(() => {
    const filterToApply = sessionStorage.getItem('demandes-apply-filter')
    if (filterToApply === 'mes-demandes' && user) {
      const timer = setTimeout(() => {
        applyMyDemandesFilter()
        sessionStorage.removeItem('demandes-apply-filter')
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [user, applyMyDemandesFilter])

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Demandes</h1>
            <p className="mt-1 text-sm text-gray-600">Gestion des demandes</p>
          </div>
          <button onClick={handleCreateDemande} className="btn-primary flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            Nouvelle demande
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="flex flex-col gap-6 mb-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Mes demandes - Section séparée */}
              <div className="md:w-64">
                <div className="text-sm font-medium text-gray-700 mb-3">Personnel</div>
                <div
                  className="bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-md hover:scale-105 border border-transparent hover:border-indigo-200"
                  onClick={applyMyDemandesFilter}
                  title="Cliquer pour filtrer toutes mes demandes assignées"
                >
                  <div className="text-2xl font-bold text-indigo-600">{stats.mesDemandes}</div>
                  <div className="text-sm text-gray-600">Mes demandes</div>
                </div>
              </div>

              {/* Statistiques de l'année */}
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700 mb-3">Année {new Date().getFullYear()}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className="bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-md hover:scale-105 border border-transparent hover:border-blue-200"
                    onClick={applyYearFilter}
                    title="Cliquer pour filtrer les demandes de l'année"
                  >
                    <div className="text-2xl font-bold text-gray-900">{stats.totalDemandes}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div
                    className="bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-md hover:scale-105 border border-transparent hover:border-red-200"
                    onClick={applyUnassignedYearFilter}
                    title="Cliquer pour filtrer les demandes non affectées de l'année"
                  >
                    <div className="text-2xl font-bold text-red-600">{stats.demandesNonAffecteesAnnee}</div>
                    <div className="text-sm text-gray-600">Non affectées</div>
                  </div>
                </div>
              </div>

              {/* Statistiques actuelles */}
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700 mb-3">Aujourd&apos;hui</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500 cursor-pointer transition-all hover:shadow-md hover:scale-105 border border-transparent hover:border-green-200"
                    onClick={applyTodayFilter}
                    title="Cliquer pour filtrer les demandes reçues aujourd'hui"
                  >
                    <div className="text-2xl font-bold text-green-600">{stats.demandesToday}</div>
                    <div className="text-sm text-gray-600">Reçues</div>
                  </div>
                  <div
                    className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500 cursor-pointer transition-all hover:shadow-md hover:scale-105 border border-transparent hover:border-red-200"
                    onClick={applyTodayUnassignedFilter}
                    title="Cliquer pour filtrer les demandes non affectées d'aujourd'hui"
                  >
                    <div className="text-2xl font-bold text-red-600">{stats.demandesNonAffecteesToday}</div>
                    <div className="text-sm text-gray-600">Non affectées</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <DemandesTableV2
        ref={tableRef}
        onView={handleViewDemande}
        onEdit={handleEditDemande}
        onDelete={handleDeleteDemande}
        onAddToDossier={handleAddToDossier}
        onCreateDossierWithSelection={handleCreateDossierWithSelection}
        onLinkToExistingDossier={handleLinkToExistingDossier}
        onBulkAssignToUser={handleBulkAssignToUser}
        canDelete={user ? ['ADMIN', 'GREFFIER'].includes(user.role) : false}
        facets={facets}
      />

      <DemandeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedDemande(null)
        }}
        onSubmit={handleSubmitDemande}
        demande={selectedDemande}
        title={selectedDemande ? 'Modifier la demande' : 'Créer une nouvelle demande'}
      />

      <DemandeViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedDemande(null)
        }}
        demande={selectedDemande}
      />

      {selectedDemande && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          itemName={`${selectedDemande.grade?.gradeAbrege ? `${selectedDemande.grade.gradeAbrege} ` : ''}${selectedDemande.prenom} ${selectedDemande.nom}`}
          itemIdentifier={selectedDemande.numeroDS || 'N/A'}
          itemType="la demande"
          title="Supprimer la demande"
          message={`Cette action supprimera définitivement la demande n°${selectedDemande.numeroDS} effectuée par ${selectedDemande.grade?.gradeAbrege ? `${selectedDemande.grade.gradeAbrege} ` : ''}${selectedDemande.prenom} ${selectedDemande.nom}. Cette action ne peut pas être annulée.`}
          confirmButtonText="Supprimer la demande"
          isLoading={deleteDemandeMutation.isPending}
        />
      )}

      <LierDemandesMultiplesDossierModal
        isOpen={isLierMultiplesModalOpen}
        onClose={() => {
          setIsLierMultiplesModalOpen(false)
          setSelectedDemandesForDossier([])
        }}
        onSuccess={() => {
          tableRef.current?.refetch()
        }}
        selectedDemandes={selectedDemandesForDossier}
      />

      <DossierModal
        isOpen={isDossierModalOpen}
        onClose={() => {
          setIsDossierModalOpen(false)
          setSelectedDemandesForDossier([])
        }}
        onSubmit={handleSubmitDossier}
        selectedDemandes={selectedDemandesForDossier}
        title="Créer un dossier avec les demandes sélectionnées"
      />
    </div>
  )
}

export default Demandes
