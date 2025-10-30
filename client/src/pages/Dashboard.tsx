import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/utils/api'
import CalendrierAudiences from '@/components/CalendrierAudiences'
import {
  FolderIcon,
  DocumentTextIcon,
  EyeIcon,
  PresentationChartLineIcon
} from '@heroicons/react/24/outline'

interface DashboardStats {
  totalDossiers: number
  totalDemandes: number
}

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [currentDateTime, setCurrentDateTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats')
      return response.data
    }
  })

  const statCards = [
    {
      name: 'Mes dossiers',
      value: stats?.totalDossiers || 0,
      icon: FolderIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/dossiers'
    },
    {
      name: 'Mes demandes',
      value: stats?.totalDemandes || 0,
      icon: DocumentTextIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/demandes'
    },
    {
      name: 'Ma revue',
      value: 'Voir',
      icon: EyeIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: '/revue'
    },
    {
      name: 'Statistiques',
      value: 'Voir',
      icon: PresentationChartLineIcon,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      href: '/statistiques'
    }
  ]

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bienvenue, {user?.grade && `${user.grade} `}{user?.prenom} {user?.nom}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Vue d'ensemble de l'activité
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900">
              {currentDateTime.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div className="text-base font-medium text-gray-700">
              {currentDateTime.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit'
              }).replace(':', 'h')}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.name}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 cursor-pointer"
            onClick={() => {
              if (card.name === 'Mes demandes') {
                sessionStorage.setItem('demandes-apply-filter', 'mes-demandes')
              }
              window.location.href = card.href
            }}
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

      <div className="grid grid-cols-1 gap-6">
        <CalendrierAudiences />
      </div>
    </div>
  )
}

export default Dashboard