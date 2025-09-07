import React from 'react'

interface StatistiqueBudgetaire {
  libelle: string
  nombre: number
  type?: 'section' | 'item'
}

interface StatistiquesBudgetairesData {
  statistiques: StatistiqueBudgetaire[]
}

interface StatistiquesBudgetairesPanelProps {
  statsBudgetaires: StatistiquesBudgetairesData | undefined
}

const StatistiquesBudgetairesPanel: React.FC<StatistiquesBudgetairesPanelProps> = ({ statsBudgetaires }) => {
  const heightPercentage = statsBudgetaires && statsBudgetaires.statistiques.length > 0 ? (100 / statsBudgetaires.statistiques.length).toFixed(2) : '100'
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full h-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gray-50 sticky top-0" style={{ height: 'auto' }}>
            <tr>
              <th className="px-2 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                
              </th>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Nombre
              </th>
            </tr>
          </thead>
          <tbody className="bg-white h-full">
            {statsBudgetaires && statsBudgetaires.statistiques.length > 0 ? (
              statsBudgetaires.statistiques.map((stat, index) => (
                <tr 
                  key={`${stat.libelle}-${index}`} 
                  className={`${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  } border-b border-gray-100`}
                  style={{ height: `${heightPercentage}%` }}
                >
                  <td className="px-2 py-2 text-sm font-medium text-gray-900 align-middle">
                    {stat.libelle}
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
                    {stat.nombre}
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

export default StatistiquesBudgetairesPanel