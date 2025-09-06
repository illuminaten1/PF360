import React from 'react'
import { StatistiquesReponseBRPF } from '../types'

interface ReponseBRPFPanelProps {
  statsReponseBRPF: StatistiquesReponseBRPF | undefined
}

const ReponseBRPFPanel: React.FC<ReponseBRPFPanelProps> = ({ statsReponseBRPF }) => {
  const heightPercentage = statsReponseBRPF && statsReponseBRPF.statistiques.length > 0 ? (100 / statsReponseBRPF.statistiques.length).toFixed(2) : '100'
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full h-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gray-50 sticky top-0" style={{ height: 'auto' }}>
            <tr>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                
              </th>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Décisions
              </th>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                %
              </th>
            </tr>
          </thead>
          <tbody className="bg-white h-full">
            {statsReponseBRPF && statsReponseBRPF.statistiques.length > 0 ? (
              statsReponseBRPF.statistiques.map((stat, index) => (
                <tr 
                  key={`${stat.libelle}-${index}`} 
                  className={`${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  } border-b border-gray-100 ${
                    stat.type === 'agrement' || stat.type === 'rejet_global' 
                      ? 'border-t-2 border-gray-200 font-semibold' 
                      : ''
                  }`}
                  style={{ height: `${heightPercentage}%` }}
                >
                  <td className={`px-2 py-2 text-sm text-gray-900 align-middle ${
                    stat.type === 'motif_rejet' ? 'pl-6 text-gray-600' : 
                    stat.type === 'decision' ? 'pl-6 font-normal text-gray-600' :
                    stat.type === 'agrement' || stat.type === 'rejet_global' ? 'font-medium' : 
                    'font-normal'
                  }`}>
                    {stat.libelle}
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
                    {stat.nombre}
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
                    {stat.pourcentage.toFixed(2)}%
                  </td>
                </tr>
              ))
            ) : (
              <tr style={{ height: '100%' }}>
                <td colSpan={3} className="px-3 py-4 text-center text-sm text-gray-500 align-middle">
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

export default ReponseBRPFPanel