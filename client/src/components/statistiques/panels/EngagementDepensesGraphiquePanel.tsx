import React, { useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface EngagementDepenseMensuelle {
  mois: string
  montantGageHT: number
  pourcentageMontantGage: number
  cumuleHT: number
  pourcentageCumuleHT: number
  prevision10: number
  pourcentagePrevision10: number
  prevision20: number
  pourcentagePrevision20: number
  cumuleTTC: number
  pourcentageCumuleTTC: number
}

interface EngagementDepensesMensuellesData {
  engagementsMensuels: EngagementDepenseMensuelle[]
  total: EngagementDepenseMensuelle
  budgetTotal?: number
  annee: number
}

interface EngagementDepensesGraphiquePanelProps {
  statsEngagementsMensuels: EngagementDepensesMensuellesData | undefined
}

const EngagementDepensesGraphiquePanel: React.FC<EngagementDepensesGraphiquePanelProps> = ({ 
  statsEngagementsMensuels 
}) => {
  const [viewMode, setViewMode] = useState<'mensuel' | 'cumule' | 'pourcentage'>('mensuel')

  if (!statsEngagementsMensuels) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">Chargement des données...</div>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatTooltip = (value: number, name: string) => {
    if (viewMode === 'pourcentage') {
      return [`${value.toFixed(2)}%`, name]
    }
    return [formatCurrency(value), name]
  }

  // Préparer les données pour le graphique
  const chartData = statsEngagementsMensuels.engagementsMensuels
    .filter(engagement => engagement.mois !== 'TOTAL')
    .map(engagement => {
      if (viewMode === 'pourcentage') {
        return {
          mois: engagement.mois,
          montantHT: engagement.pourcentageCumuleHT,
          previsionTTC: engagement.pourcentageCumuleTTC
        }
      } else if (viewMode === 'cumule') {
        return {
          mois: engagement.mois,
          montantHT: engagement.cumuleHT,
          previsionTTC: engagement.cumuleTTC
        }
      } else {
        return {
          mois: engagement.mois,
          montantHT: engagement.montantGageHT,
          previsionTTC: engagement.prevision20
        }
      }
    })

  return (
    <div className="h-full flex flex-col bg-green-50">
      <div className="flex-1 p-4">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'mensuel' ? (
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
              <XAxis 
                dataKey="mois" 
                angle={-45}
                textAnchor="end"
                height={50}
                interval={0}
                tick={{ fontSize: 12, fill: '#374151' }}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12, fill: '#374151' }}
              />
              <Tooltip 
                formatter={formatTooltip}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: '#f9fafb', 
                  border: '1px solid #d1d5db',
                  borderRadius: '8px'
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <Bar 
                dataKey="montantHT" 
                fill="#3b82f6" 
                name="Dépenses gagées HT (réel)"
              />
              <Bar 
                dataKey="previsionTTC" 
                fill="#ef4444" 
                name="Prévisionnel +32% (taxes et autre) TTC"
              />
            </BarChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
              <XAxis 
                dataKey="mois" 
                angle={-45}
                textAnchor="end"
                height={50}
                interval={0}
                tick={{ fontSize: 12, fill: '#374151' }}
              />
              <YAxis 
                tickFormatter={viewMode === 'pourcentage' ? (value) => `${value}%` : formatCurrency}
                tick={{ fontSize: 12, fill: '#374151' }}
              />
              <Tooltip 
                formatter={formatTooltip}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: '#f9fafb', 
                  border: '1px solid #d1d5db',
                  borderRadius: '8px'
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <Line 
                type="monotone" 
                dataKey="montantHT" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                name={
                  viewMode === 'pourcentage' 
                    ? 'HT (réel) en % du budget annuel' 
                    : 'Cumulé HT (réel)'
                }
              />
              <Line 
                type="monotone" 
                dataKey="previsionTTC" 
                stroke="#ef4444" 
                strokeWidth={3}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                name={
                  viewMode === 'pourcentage' 
                    ? 'TTC (prévisionnel) en % du budget annuel' 
                    : 'Cumulé TTC (prévisionnel)'
                }
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      
      <div className="p-4 border-t border-green-200">
        <div className="flex justify-center">
          <div className="flex bg-white rounded-lg p-1 border border-green-300">
            <button
              onClick={() => setViewMode('mensuel')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'mensuel'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'text-green-700 hover:bg-green-50'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setViewMode('cumule')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'cumule'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'text-green-700 hover:bg-green-50'
              }`}
            >
              Cumulé
            </button>
            <button
              onClick={() => setViewMode('pourcentage')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'pourcentage'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'text-green-700 hover:bg-green-50'
              }`}
            >
              Pourcentage
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EngagementDepensesGraphiquePanel