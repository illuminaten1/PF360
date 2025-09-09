import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PlusIcon } from '@heroicons/react/24/outline'
import { Demande } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/utils/api'
import DemandesTable, { DemandesTableRef } from '@/components/tables/DemandesTable'
import DemandeModal from '@/components/forms/DemandeModal'
import DemandeViewModal from '@/components/forms/DemandeViewModal'
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal'
import LierDemandeDossierModal from '@/components/forms/LierDemandeDossierModal'

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
  const [isLierModalOpen, setIsLierModalOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)
  const { user } = useAuth()
  const tableRef = useRef<DemandesTableRef>(null)

  const queryClient = useQueryClient()

  // Fetch all demandes (client-side filtering with TanStack)
  const { data: demandes = [], isLoading } = useQuery({
    queryKey: ['demandes-all'],
    queryFn: async () => {
      const response = await api.get('/demandes?limit=50000') // Get all demandes for client-side processing
      return response.data.demandes
    }
  })

  // Fetch stats
  const { data: stats } = useQuery<DemandesStats>({
    queryKey: ['demandes-stats'],
    queryFn: async () => {
      const response = await api.get('/demandes/stats')
      return response.data
    }
  })

  // Create demande mutation
  const createDemandeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/demandes', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandes-all'] })
      queryClient.invalidateQueries({ queryKey: ['demandes-stats'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      toast.success('Demande créée avec succès')
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
      queryClient.invalidateQueries({ queryKey: ['demandes-all'] })
      queryClient.invalidateQueries({ queryKey: ['demandes-stats'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      toast.success('Demande modifiée avec succès')
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
      queryClient.invalidateQueries({ queryKey: ['demandes-all'] })
      queryClient.invalidateQueries({ queryKey: ['demandes-stats'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      toast.success('Demande supprimée avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression')
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
      toast.error('Vous n\'avez pas les permissions pour supprimer des demandes')
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
    setSelectedDemande(demande)
    setIsLierModalOpen(true)
  }

  const handleSubmitDemande = async (data: any) => {
    if (selectedDemande) {
      await updateDemandeMutation.mutateAsync({ id: selectedDemande.id, data })
    } else {
      await createDemandeMutation.mutateAsync(data)
    }
  }

  // Fonctions pour appliquer les filtres depuis les statistiques
  const applyYearFilter = () => {
    if (tableRef.current) {
      const currentYear = new Date().getFullYear()
      const startOfYear = `${currentYear}-01-01`
      
      tableRef.current.setColumnFilters([
        {
          id: 'dateReception',
          value: { from: startOfYear }
        }
      ])
    }
  }


  const applyUnassignedYearFilter = () => {
    if (tableRef.current) {
      const currentYear = new Date().getFullYear()
      const startOfYear = `${currentYear}-01-01`
      
      tableRef.current.setColumnFilters([
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
  }

  const applyTodayFilter = () => {
    if (tableRef.current) {
      const today = new Date().toISOString().split('T')[0]
      
      tableRef.current.setColumnFilters([
        {
          id: 'dateReception',
          value: { from: today, to: today }
        }
      ])
    }
  }

  const applyTodayUnassignedFilter = () => {
    if (tableRef.current) {
      const today = new Date().toISOString().split('T')[0]
      
      tableRef.current.setColumnFilters([
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
  }

  const applyMyDemandesFilter = () => {
    if (tableRef.current && user) {
      const userFullName = `${user.grade || ''} ${user.prenom} ${user.nom}`.trim()
      
      tableRef.current.setColumnFilters([
        {
          id: 'assigneA',
          value: [userFullName]
        }
      ])
    }
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Demandes</h1>
            <p className="mt-1 text-sm text-gray-600">
              Gestion des demandes d'aide juridique
            </p>
          </div>
          <button
            onClick={handleCreateDemande}
            className="btn-primary flex items-center"
          >
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
                <div className="text-sm font-medium text-gray-700 mb-3">Aujourd'hui</div>
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
            
            {/* Bouton pour effacer les filtres */}
            <div className="flex justify-end">
              <button
                onClick={() => tableRef.current?.clearAllFilters()}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 transition-colors duration-200"
                title="Effacer tous les filtres et afficher toutes les demandes"
              >
                Effacer tous les filtres
              </button>
            </div>
          </div>
        )}
      </div>

      <DemandesTable
        ref={tableRef}
        data={demandes}
        loading={isLoading}
        onView={handleViewDemande}
        onEdit={handleEditDemande}
        onDelete={handleDeleteDemande}
        onAddToDossier={handleAddToDossier}
        canDelete={user ? ['ADMIN', 'GREFFIER'].includes(user.role) : false}
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

      {selectedDemande && (
        <LierDemandeDossierModal
          isOpen={isLierModalOpen}
          onClose={() => {
            setIsLierModalOpen(false)
            setSelectedDemande(null)
          }}
          demandeId={selectedDemande.id}
          demandeNumeroDS={selectedDemande.numeroDS}
        />
      )}
    </div>
  )
}

export default Demandes