import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/utils/api'
import {
  FolderIcon,
  DocumentTextIcon,
  ScaleIcon,
  CreditCardIcon,
  ClockIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

interface DashboardStats {
  totalDossiers: number
  totalDemandes: number
  totalDecisions: number
  totalPaiements: number
  demandesSans2Mois: number
  montantTotalConventions: number
}

const Dashboard: React.FC = () => {
  const { user } = useAuth()

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // For now, return mock data since we haven't implemented the endpoint
      return {
        totalDossiers: 0,
        totalDemandes: 0,
        totalDecisions: 0,
        totalPaiements: 0,
        demandesSans2Mois: 0,
        montantTotalConventions: 0
      }
    }
  })

  const statCards = [
    {
      name: 'Dossiers',
      value: stats?.totalDossiers || 0,
      icon: FolderIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/dossiers'
    },
    {
      name: 'Demandes',
      value: stats?.totalDemandes || 0,
      icon: DocumentTextIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/demandes'
    },
    {
      name: 'Décisions',
      value: stats?.totalDecisions || 0,
      icon: ScaleIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '/decisions'
    },
    {
      name: 'Paiements',
      value: stats?.totalPaiements || 0,
      icon: CreditCardIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      href: '/paiements'
    },
    {
      name: 'Suivi 2 mois',
      value: stats?.demandesSans2Mois || 0,
      icon: ClockIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: '/suivi-2-mois'
    },
    {
      name: 'Montant conventions',
      value: `${(stats?.montantTotalConventions || 0).toLocaleString('fr-FR')} €`,
      icon: ArrowTrendingUpIcon,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      href: '/conventions'
    }
  ]

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-12 bg-gray-200 rounded w-12 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenue, {user?.prenom} {user?.nom}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Vue d'ensemble de l'activité PF360
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {statCards.map((card) => (
          <div
            key={card.name}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 cursor-pointer"
            onClick={() => window.location.href = card.href}
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{card.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Activité récente</h3>
          <div className="text-sm text-gray-500">
            Les fonctionnalités de suivi d'activité seront disponibles prochainement.
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Actions rapides</h3>
          <div className="space-y-3">
            <button className="w-full btn-primary text-left justify-start">
              Créer un nouveau dossier
            </button>
            <button className="w-full btn-secondary text-left justify-start">
              Ajouter une demande
            </button>
            <button className="w-full btn-secondary text-left justify-start">
              Voir les demandes en attente
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard