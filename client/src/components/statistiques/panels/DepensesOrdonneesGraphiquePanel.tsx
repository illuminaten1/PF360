import React, { useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface DepenseOrdonneeMois {
  mois: string
  annee: number
  montantHTPaiements: number
  montantTTCDossiers: number
  cumulHT?: number
  cumulTTC?: number
  pourcentageHT?: number
  pourcentageTTC?: number
  pourcentageCumulHT?: number
  pourcentageCumulTTC?: number
  bold?: boolean
  isTotal?: boolean
}

interface DepensesOrdonneesParMoisData {
  statistiques: DepenseOrdonneeMois[]
  budgetTotal?: number
}

interface DepensesOrdonneesGraphiquePanelProps {
  statsDepensesOrdonneesParMois: DepensesOrdonneesParMoisData | undefined
}

const DepensesOrdonneesGraphiquePanel: React.FC<DepensesOrdonneesGraphiquePanelProps> = ({ 
  statsDepensesOrdonneesParMois 
}) => {
  const [viewMode, setViewMode] = useState<'mensuel' | 'cumule' | 'pourcentage'>('mensuel')

  if (!statsDepensesOrdonneesParMois) {
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

  const formatMoisLabel = (mois: string) => {
    const moisNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]
    const moisIndex = parseInt(mois) - 1
    return moisNames[moisIndex] || mois
  }


  // Préparer les données pour le graphique
  const chartData = (() => {
    const filteredData = statsDepensesOrdonneesParMois.statistiques.filter(dep => !dep.isTotal)
    
    if (viewMode === 'pourcentage') {
      return filteredData.map(dep => ({
        mois: formatMoisLabel(dep.mois),
        montantHT: dep.pourcentageCumulHT || 0,
        montantTTC: dep.pourcentageCumulTTC || 0
      }))
    } else if (viewMode === 'cumule') {
      return filteredData.map(dep => ({
        mois: formatMoisLabel(dep.mois),
        montantHT: dep.cumulHT || 0,
        montantTTC: dep.cumulTTC || 0
      }))
    } else {
      return filteredData.map(dep => ({
        mois: formatMoisLabel(dep.mois),
        montantHT: dep.montantHTPaiements,
        montantTTC: dep.montantTTCDossiers
      }))
    }
  })()

  return (
    <div className="h-full flex flex-col bg-orange-50">
      <div className="flex-1 p-4">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === 'mensuel' ? (
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" />
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
                fill="#2563eb" 
                name="Dépenses ordonnées HT"
              />
              <Bar 
                dataKey="montantTTC" 
                fill="#dc2626" 
                name="Dépenses ordonnées TTC"
              />
            </BarChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fed7aa" />
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
                stroke="#2563eb" 
                strokeWidth={3}
                dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                name={
                  viewMode === 'pourcentage' 
                    ? 'HT (% du budget annuel)' 
                    : 'Cumul HT'
                }
              />
              <Line 
                type="monotone" 
                dataKey="montantTTC" 
                stroke="#dc2626" 
                strokeWidth={3}
                dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
                name={
                  viewMode === 'pourcentage' 
                    ? 'TTC en % du budget annuel' 
                    : 'Cumul TTC'
                }
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      
      <div className="p-4 border-t border-orange-200">
        <div className="flex justify-center">
          <div className="flex bg-white rounded-lg p-1 border border-orange-300">
            <button
              onClick={() => setViewMode('mensuel')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'mensuel'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-orange-700 hover:bg-orange-50'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setViewMode('cumule')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'cumule'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-orange-700 hover:bg-orange-50'
              }`}
            >
              Cumulé
            </button>
            <button
              onClick={() => setViewMode('pourcentage')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'pourcentage'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-orange-700 hover:bg-orange-50'
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

export default DepensesOrdonneesGraphiquePanel