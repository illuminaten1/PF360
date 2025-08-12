import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Decision } from '@/types'
import api from '@/utils/api'
import DecisionsTable from '@/components/tables/DecisionsTable'

const Decisions: React.FC = () => {
  const navigate = useNavigate()

  const queryClient = useQueryClient()

  // Fetch all decisions
  const { data: decisions = [], isLoading } = useQuery<Decision[]>({
    queryKey: ['decisions-all'],
    queryFn: async () => {
      const response = await api.get('/decisions')
      return response.data
    }
  })

  // Delete decision mutation
  const deleteDecisionMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/decisions/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions-all'] })
      toast.success('Décision supprimée avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression')
    }
  })

  const handleViewDecision = (decision: Decision) => {
    // Naviguer vers le dossier contenant cette décision
    navigate(`/dossiers/${decision.dossier.id}`)
  }

  const handleEditDecision = (decision: Decision) => {
    // Naviguer vers le dossier pour éditer la décision
    navigate(`/dossiers/${decision.dossier.id}`)
  }

  const handleDeleteDecision = (decision: Decision) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer cette décision ${decision.type} ?`)) {
      deleteDecisionMutation.mutate(decision.id)
    }
  }

  const getStatsData = () => {
    const totalDecisions = decisions.length
    const ajCount = decisions.filter(d => d.type === 'AJ').length
    const ajeCount = decisions.filter(d => d.type === 'AJE').length
    const pjCount = decisions.filter(d => d.type === 'PJ').length
    const rejetCount = decisions.filter(d => d.type === 'REJET').length

    return {
      totalDecisions,
      ajCount,
      ajeCount,
      pjCount,
      rejetCount
    }
  }

  const stats = getStatsData()

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Décisions</h1>
            <p className="mt-1 text-sm text-gray-600">
              Consultation des décisions d'aide juridique
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.totalDecisions}</div>
            <div className="text-sm text-gray-600">Total décisions</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{stats.ajCount}</div>
            <div className="text-sm text-gray-600">Aide Juridique</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.ajeCount}</div>
            <div className="text-sm text-gray-600">AJ Évolutive</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.pjCount}</div>
            <div className="text-sm text-gray-600">Protection Juridictionnelle</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-red-600">{stats.rejetCount}</div>
            <div className="text-sm text-gray-600">Rejets</div>
          </div>
        </div>
      </div>

      <DecisionsTable
        data={decisions}
        onView={handleViewDecision}
        onEdit={handleEditDecision}
        onDelete={handleDeleteDecision}
        loading={isLoading}
      />
    </div>
  )
}

export default Decisions