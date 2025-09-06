import React from 'react'

interface StatsTableRow {
  label: string
  nombreDemandes: number
  pourcentage: number
}

interface GenericStatsTableProps {
  data: StatsTableRow[] | undefined
  labelHeader: string
  labelKey?: string
}

const GenericStatsTable: React.FC<GenericStatsTableProps> = ({ 
  data, 
  labelHeader,
  labelKey = 'label'
}) => {
  const heightPercentage = data && data.length > 0 ? (100 / data.length).toFixed(2) : '100'
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full h-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gray-50 sticky top-0" style={{ height: 'auto' }}>
            <tr>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                {labelHeader}
              </th>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Demandes
              </th>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                %
              </th>
            </tr>
          </thead>
          <tbody className="bg-white h-full">
            {data && data.length > 0 ? (
              data.map((stat, index) => (
                <tr 
                  key={`${stat.label}-${index}`} 
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100`}
                  style={{ height: `${heightPercentage}%` }}
                >
                  <td className="px-2 py-2 text-sm font-medium text-gray-900 align-middle">
                    {stat.label || 'Non renseigné'}
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
                    {stat.nombreDemandes}
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
                    {stat.pourcentage.toFixed(1)}%
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

export default GenericStatsTable