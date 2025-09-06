import React from 'react'
import { StatistiqueBAP } from '../types'

interface StatistiquesBAPPanelProps {
  statsBAP: StatistiqueBAP[] | undefined
}

const StatistiquesBAPPanel: React.FC<StatistiquesBAPPanelProps> = ({ statsBAP }) => {
  const heightPercentage = statsBAP && statsBAP.length > 0 ? (100 / statsBAP.length).toFixed(2) : '100'
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full h-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gray-50 sticky top-0" style={{ height: 'auto' }}>
            <tr>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                BAP
              </th>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Demandes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white h-full">
            {statsBAP && statsBAP.length > 0 ? (
              statsBAP.map((bap, index) => (
                <tr 
                  key={bap.nomBAP} 
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100`}
                  style={{ height: `${heightPercentage}%` }}
                >
                  <td className="px-2 py-2 text-sm font-medium text-gray-900 align-middle">
                    {bap.nomBAP}
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
                    {bap.nombreDemandes}
                  </td>
                </tr>
              ))
            ) : (
              <tr style={{ height: '100%' }}>
                <td colSpan={2} className="px-3 py-4 text-center text-sm text-gray-500 align-middle">
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

export default StatistiquesBAPPanel