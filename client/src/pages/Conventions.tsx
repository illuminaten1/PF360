import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PlusIcon } from '@heroicons/react/24/outline'
import { Convention } from '@/types'
import api from '@/utils/api'
import ConventionsTable from '@/components/tables/ConventionsTable'

const Conventions: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedDossier, setSelectedDossier] = useState<string>('')

  // Fetch all conventions
  const { data: conventions = [], isLoading } = useQuery<Convention[]>({
    queryKey: ['conventions-all', selectedDossier],
    queryFn: async () => {
      const response = await api.get(`/conventions${selectedDossier ? `?dossierId=${selectedDossier}` : ''}`)
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

  // Delete convention mutation
  const deleteConventionMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/conventions/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conventions-all'] })
      toast.success('Convention supprimée avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression')
    }
  })

  const handleViewConvention = (convention: Convention) => {
    navigate(`/dossiers/${convention.dossier.id || convention.dossier.numero}`)
  }

  const handleEditConvention = (convention: Convention) => {
    navigate(`/dossiers/${convention.dossier.id || convention.dossier.numero}`)
  }

  const handleDeleteConvention = (convention: Convention) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la convention n°${convention.numero} ?`)) {
      deleteConventionMutation.mutate(convention.id)
    }
  }

  const getStatsData = () => {
    const totalConventions = conventions.length
    const conventionCount = conventions.filter(c => c.type === 'CONVENTION').length
    const avenantCount = conventions.filter(c => c.type === 'AVENANT').length
    const victimeCount = conventions.filter(c => c.victimeOuMisEnCause === 'VICTIME').length
    const misEnCauseCount = conventions.filter(c => c.victimeOuMisEnCause === 'MIS_EN_CAUSE').length
    const totalMontantHT = conventions.reduce((sum, c) => sum + c.montantHT, 0)
    const signeesCount = conventions.filter(c => c.dateRetourSigne).length

    return {
      totalConventions,
      conventionCount,
      avenantCount,
      victimeCount,
      misEnCauseCount,
      totalMontantHT,
      signeesCount
    }
  }

  const stats = getStatsData()

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Conventions d'honoraires</h1>
            <p className="mt-1 text-sm text-gray-600">
              Gestion des conventions et avenants d'honoraires
            </p>
          </div>
          <div className="flex items-center space-x-4">
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
            <div className="text-2xl font-bold text-gray-900">{stats.totalConventions}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.conventionCount}</div>
            <div className="text-sm text-gray-600">Conventions</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.avenantCount}</div>
            <div className="text-sm text-gray-600">Avenants</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-sky-600">{stats.victimeCount}</div>
            <div className="text-sm text-gray-600">Victimes</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-amber-600">{stats.misEnCauseCount}</div>
            <div className="text-sm text-gray-600">Mis en cause</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{stats.signeesCount}</div>
            <div className="text-sm text-gray-600">Signées</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.totalMontantHT.toLocaleString()} €</div>
            <div className="text-sm text-gray-600">Total HT</div>
          </div>
        </div>
      </div>

      <ConventionsTable
        data={conventions}
        onView={handleViewConvention}
        onEdit={handleEditConvention}
        onDelete={handleDeleteConvention}
        loading={isLoading}
      />
    </div>
  )
}

export default Conventions