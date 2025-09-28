import React from 'react'
import { StatistiquesGenerales } from '../types'

interface StatistiquesGeneralesPanelProps {
  stats: StatistiquesGenerales | undefined
}

const StatistiquesGeneralesPanel: React.FC<StatistiquesGeneralesPanelProps> = ({ stats }) => (
  <div className="h-full flex flex-col">
    <div className="flex-1 overflow-auto p-2">
      {stats && (
        <div className="h-full grid grid-cols-1 sm:grid-cols-2 gap-1">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-3 text-center flex flex-col justify-center">
            <div className="text-4xl sm:text-5xl font-semibold text-blue-600 mb-1">
              {stats.demandesTotal}
            </div>
            <div className="text-sm text-gray-600">
              Reçues
            </div>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-3 text-center flex flex-col justify-center">
            <div className="text-4xl sm:text-5xl font-semibold text-green-600 mb-1">
              {stats.demandesTraitees}
            </div>
            <div className="text-sm text-gray-600">
              Traitées
            </div>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-3 text-center flex flex-col justify-center">
            <div className="text-4xl sm:text-5xl font-semibold text-yellow-600 mb-1">
              {stats.demandesEnInstance}
            </div>
            <div className="text-sm text-gray-600">
              En instance
            </div>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-3 text-center flex flex-col justify-center">
            <div className="text-4xl sm:text-5xl font-semibold text-red-600 mb-1">
              {stats.demandesNonAffectees}
            </div>
            <div className="text-sm text-gray-600">
              Non affectées
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
)

export default StatistiquesGeneralesPanel