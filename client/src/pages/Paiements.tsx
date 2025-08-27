import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PlusIcon } from '@heroicons/react/24/outline'
import { Paiement } from '@/types'
import api from '@/utils/api'
import PaiementsTable from '@/components/tables/PaiementsTable'

const Paiements: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedDossier, setSelectedDossier] = useState<string>('')
  const [selectedSgami, setSelectedSgami] = useState<string>('')

  // Fetch all paiements
  const { data: paiements = [], isLoading } = useQuery<Paiement[]>({
    queryKey: ['paiements-all', selectedDossier, selectedSgami],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedDossier) params.append('dossierId', selectedDossier)
      if (selectedSgami) params.append('sgamiId', selectedSgami)
      
      const response = await api.get(`/paiements${params.toString() ? `?${params.toString()}` : ''}`)
      return response.data
    }
  })

  // Fetch dossiers for filter
  const { data: dossiers = [] } = useQuery({
    queryKey: ['dossiers'],
    queryFn: async () => {
      const response = await api.get('/dossiers')
      return response.data
    }
  })

  // Fetch SGAMIS for filter
  const { data: sgamis = [] } = useQuery({
    queryKey: ['sgamis'],
    queryFn: async () => {
      const response = await api.get('/sgami')
      return response.data
    }
  })

  // Delete paiement mutation
  const deletePaiementMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/paiements/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paiements-all'] })
      toast.success('Paiement supprimé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression')
    }
  })

  const handleViewPaiement = (paiement: Paiement) => {
    navigate(`/dossiers/${paiement.dossier.id}`)
  }

  const handleEditPaiement = (paiement: Paiement) => {
    navigate(`/dossiers/${paiement.dossier.id}`)
  }

  const handleDeletePaiement = (paiement: Paiement) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ce paiement ?`)) {
      deletePaiementMutation.mutate(paiement.id)
    }
  }

  const getStatsData = () => {
    const totalPaiements = paiements.length
    const avocatCount = paiements.filter(p => p.nature === 'AVOCAT').length
    const autresIntervenantCount = paiements.filter(p => p.nature === 'AUTRES_INTERVENANTS').length
    const emissionTitreCount = paiements.filter(p => p.emissionTitrePerception === 'OUI').length
    const conventionJointeCount = paiements.filter(p => p.conventionJointeFRI === 'OUI').length
    const totalMontantHT = paiements.reduce((sum, p) => sum + p.montantHT, 0)
    const totalMontantTTC = paiements.reduce((sum, p) => sum + p.montantTTC, 0)

    return {
      totalPaiements,
      avocatCount,
      autresIntervenantCount,
      emissionTitreCount,
      conventionJointeCount,
      totalMontantHT,
      totalMontantTTC
    }
  }

  const stats = getStatsData()

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
            <p className="mt-1 text-sm text-gray-600">
              Gestion des paiements et fiches de règlement
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedSgami}
              onChange={(e) => setSelectedSgami(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Tous les SGAMIS</option>
              {sgamis.map((sgami: any) => (
                <option key={sgami.id} value={sgami.id}>
                  {sgami.nom}
                </option>
              ))}
            </select>
            <select
              value={selectedDossier}
              onChange={(e) => setSelectedDossier(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Tous les dossiers</option>
              {dossiers.map((dossier: any) => (
                <option key={dossier.id} value={dossier.id}>
                  Dossier {dossier.numero} {dossier.nomDossier && `- ${dossier.nomDossier}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.totalPaiements}</div>
            <div className="text-sm text-gray-600">Total paiements</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.avocatCount}</div>
            <div className="text-sm text-gray-600">Avocats</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.autresIntervenantCount}</div>
            <div className="text-sm text-gray-600">Autres intervenants</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-sky-600">{stats.emissionTitreCount}</div>
            <div className="text-sm text-gray-600">Émission titre</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-amber-600">{stats.conventionJointeCount}</div>
            <div className="text-sm text-gray-600">Convention jointe</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{stats.totalMontantHT.toLocaleString()} €</div>
            <div className="text-sm text-gray-600">Total HT</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.totalMontantTTC.toLocaleString()} €</div>
            <div className="text-sm text-gray-600">Total TTC</div>
          </div>
        </div>
      </div>

      <PaiementsTable
        data={paiements}
        onView={handleViewPaiement}
        onEdit={handleEditPaiement}
        onDelete={handleDeletePaiement}
        loading={isLoading}
      />
    </div>
  )
}

export default Paiements