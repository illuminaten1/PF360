import React from 'react'
import { StatistiquesFluxMensuels } from '../types'

interface FluxMensuelsPanelProps {
  fluxMensuels: StatistiquesFluxMensuels | undefined
  selectedYear: number
}

const FluxMensuelsPanel: React.FC<FluxMensuelsPanelProps> = ({ fluxMensuels, selectedYear }) => {
  const heightPercentage = fluxMensuels && fluxMensuels.fluxMensuels.length > 0 ? (100 / fluxMensuels.fluxMensuels.length).toFixed(2) : '100'
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full h-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gray-50 sticky top-0" style={{ height: 'auto' }}>
            <tr>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Mois
              </th>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-blue-50">
                Entrants {selectedYear}
              </th>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-red-50">
                Sortants {selectedYear}
              </th>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-100">
                Entrants {selectedYear - 1}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white h-full">
            {fluxMensuels && fluxMensuels.fluxMensuels.length > 0 ? (
              fluxMensuels.fluxMensuels.map((flux, index) => (
                <tr 
                  key={flux.mois} 
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100`}
                  style={{ height: `${heightPercentage}%` }}
                >
                  <td className="px-2 py-2 text-sm font-medium text-gray-900 align-middle">
                    {flux.mois}
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
                    {flux.entrantsAnnee}
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
                    {flux.sortantsAnnee}
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-600 align-middle">
                    {flux.entrantsAnneePrecedente}
                  </td>
                </tr>
              ))
            ) : (
              <tr style={{ height: '100%' }}>
                <td colSpan={4} className="px-3 py-4 text-center text-sm text-gray-500 align-middle">
                  Aucune donnée disponible
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default FluxMensuelsPanel