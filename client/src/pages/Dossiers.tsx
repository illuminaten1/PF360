import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PlusIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Dossier } from '@/types'
import api from '@/utils/api'
import DossiersTable from '@/components/tables/DossiersTable'
import DossierModal from '@/components/forms/DossierModal'

const Dossiers: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const queryClient = useQueryClient()

  // Fetch dossiers
  const { data: dossiers = [], isLoading } = useQuery<Dossier[]>({
    queryKey: ['dossiers'],
    queryFn: async () => {
      const response = await api.get('/dossiers')
      return response.data
    }
  })

  // Create dossier mutation
  const createDossierMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/dossiers', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      toast.success('Dossier créé avec succès')
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
      toast.success('Dossier modifié avec succès')
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
      toast.success('Dossier supprimé avec succès')
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
    // Navigate to dossier detail page
    window.location.href = `/dossiers/${dossier.id}`
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

  // Filter dossiers based on search term
  const filteredDossiers = dossiers.filter(dossier => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      dossier.numero.toLowerCase().includes(searchLower) ||
      dossier.sgami?.nom.toLowerCase().includes(searchLower) ||
      dossier.assigneA?.nom.toLowerCase().includes(searchLower) ||
      dossier.assigneA?.prenom.toLowerCase().includes(searchLower) ||
      dossier.demandes.some(d => 
        d.nom.toLowerCase().includes(searchLower) ||
        d.prenom.toLowerCase().includes(searchLower) ||
        d.numeroDS.toLowerCase().includes(searchLower)
      )
    )
  })

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dossiers</h1>
            <p className="mt-1 text-sm text-gray-600">
              Gestion des dossiers d'aide juridique
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

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par numéro, SGAMI, assigné ou demandeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input w-full pl-10"
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filtres
          </button>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label block text-gray-700 mb-2">SGAMI</label>
                <select className="input w-full">
                  <option value="">Tous les SGAMI</option>
                </select>
              </div>
              <div>
                <label className="label block text-gray-700 mb-2">Assigné à</label>
                <select className="input w-full">
                  <option value="">Tous les utilisateurs</option>
                </select>
              </div>
              <div>
                <label className="label block text-gray-700 mb-2">Statut</label>
                <select className="input w-full">
                  <option value="">Tous les statuts</option>
                  <option value="en_attente">En attente</option>
                  <option value="en_cours">En cours</option>
                  <option value="termine">Terminé</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">{dossiers.length}</div>
            <div className="text-sm text-gray-600">Total dossiers</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">
              {dossiers.filter(d => d.decisions.length > 0).length}
            </div>
            <div className="text-sm text-gray-600">Avec décision</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">
              {dossiers.filter(d => d.assigneA).length}
            </div>
            <div className="text-sm text-gray-600">Assignés</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">
              {dossiers.reduce((sum, d) => sum + (d.stats?.totalConventionsHT || 0), 0).toLocaleString('fr-FR')} €
            </div>
            <div className="text-sm text-gray-600">Montant total</div>
          </div>
        </div>
      </div>

      <DossiersTable
        dossiers={filteredDossiers}
        onView={handleViewDossier}
        onEdit={handleEditDossier}
        onDelete={handleDeleteDossier}
        loading={isLoading}
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