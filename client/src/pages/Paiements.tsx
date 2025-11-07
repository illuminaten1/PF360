import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Paiement } from '@/types'
import api from '@/utils/api'
import PaiementsTable from '@/components/tables/PaiementsTable'

const Paiements: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch all paiements
  const { data: paiements = [], isLoading } = useQuery<Paiement[]>({
    queryKey: ['paiements-all'],
    queryFn: async () => {
      const response = await api.get('/paiements')
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
    const avocatCount = paiements.filter(p => p.qualiteBeneficiaire === 'Avocat').length
    const autresIntervenantCount = paiements.filter(p => p.qualiteBeneficiaire !== 'Avocat').length
    const emissionTitreCount = paiements.filter(p => p.emissionTitrePerception === 'OUI').length
    const conventionJointeCount = paiements.filter(p => p.conventionJointeFRI === 'OUI').length
    const totalMontantTTC = paiements.reduce((sum, p) => sum + p.montantTTC, 0)

    return {
      totalPaiements,
      avocatCount,
      autresIntervenantCount,
      emissionTitreCount,
      conventionJointeCount,
      totalMontantTTC
    }
  }

  const stats = getStatsData()

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gestion des paiements et fiches de règlement
          </p>
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