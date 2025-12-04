import React from 'react'
import { StatistiquesGenerales } from '../types'

interface StatistiquesGeneralesPanelProps {
  stats: StatistiquesGenerales | undefined
}

const StatistiquesGeneralesPanel: React.FC<StatistiquesGeneralesPanelProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Aucune donnée disponible</p>
      </div>
    )
  }

  const kpis = [
    {
      label: 'Demandes reçues',
      value: stats.demandesTotal,
      valueColor: 'text-gray-900 dark:text-gray-50'
    },
    {
      label: 'Demandes traitées',
      value: stats.demandesTraitees,
      valueColor: 'text-gray-900 dark:text-gray-50'
    },
    {
      label: 'Demandes en instance',
      value: stats.demandesEnInstance,
      valueColor: 'text-gray-900 dark:text-gray-50'
    },
    {
      label: 'Demandes non affectées',
      value: stats.demandesNonAffectees,
      valueColor: 'text-gray-900 dark:text-gray-50'
    }
  ]

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950"
          >
            <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
              {kpi.label}
            </p>
            <p className={`mt-2 text-3xl font-semibold leading-10 ${kpi.valueColor}`}>
              {kpi.value.toLocaleString('fr-FR')}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StatistiquesGeneralesPanel