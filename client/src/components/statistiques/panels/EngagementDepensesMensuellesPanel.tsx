import React from 'react'

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

interface EngagementDepensesMensuellesPanelProps {
  statsEngagementsMensuels: EngagementDepensesMensuellesData | undefined
}

const EngagementDepensesMensuellesPanel: React.FC<EngagementDepensesMensuellesPanelProps> = ({ statsEngagementsMensuels }) => {
  
  if (!statsEngagementsMensuels) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">Chargement des données...</div>
      </div>
    )
  }

  const formatCurrency = (amount: number, suffix: string = '') => {
    const formatted = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
    return suffix ? formatted + ' ' + suffix : formatted
  }

  const formatValueWithPercentage = (amount: number, percentage: number, suffix: string = '') => {
    return (
      <span>
        {formatCurrency(amount, suffix)}
        <br />
        <span className="text-xs text-gray-500">({percentage.toFixed(1)}% du budget)</span>
      </span>
    )
  }
  
  // Combiner les données mensuelles avec le total
  const allData = [...statsEngagementsMensuels.engagementsMensuels, statsEngagementsMensuels.total]
  
  return (
    <div className="h-full flex flex-col bg-green-50">
      <div className="flex-1 overflow-auto">
        <table className="w-full h-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-green-100 sticky top-0" style={{ height: 'auto' }}>
            <tr>
              <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200" style={{ width: '12%' }}>
                Mois
              </th>
              <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200" style={{ width: '16%' }}>
                Gagé HT
              </th>
              <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200" style={{ width: '16%' }}>
                Cumulé HT
              </th>
              <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200" style={{ width: '16%' }}>
                Prév. +10%
              </th>
              <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200" style={{ width: '16%' }}>
                Prév. +20%
              </th>
              <th className="px-1 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200" style={{ width: '16%' }}>
                Cumulé TTC
              </th>
            </tr>
          </thead>
          <tbody className="bg-white h-full">
            {allData.map((engagement, index) => {
              const isTotal = engagement.mois === 'TOTAL'
              const isLastMonth = !isTotal && index === statsEngagementsMensuels.engagementsMensuels.length - 1
              
              return (
                <tr 
                  key={`${engagement.mois}-${index}`} 
                  className={`${
                    isTotal 
                      ? 'bg-green-200 border-t-2 border-green-400 font-bold' 
                      : index % 2 === 0 ? 'bg-green-50' : 'bg-white'
                  } border-b border-green-200`}
                  style={{ height: isTotal ? 'auto' : `${(100 / (allData.length - 1)).toFixed(2)}%` }}
                >
                  <td className={`px-1 py-2 text-xs align-middle ${
                    isTotal ? 'font-bold text-green-900' : 'font-medium text-gray-900'
                  }`}>
                    {engagement.mois}
                  </td>
                  <td className={`px-1 py-2 text-center text-xs align-middle ${
                    isTotal ? 'font-bold text-green-900' : 'font-medium text-gray-900'
                  }`}>
                    {formatValueWithPercentage(engagement.montantGageHT, engagement.pourcentageMontantGage, 'HT')}
                  </td>
                  <td className={`px-1 py-2 text-center text-xs align-middle ${
                    isTotal ? 'font-bold text-green-900' : 'font-medium text-gray-900'
                  }`}>
                    {formatValueWithPercentage(engagement.cumuleHT, engagement.pourcentageCumuleHT, 'HT')}
                  </td>
                  <td className={`px-1 py-2 text-center text-xs align-middle ${
                    isTotal ? 'font-bold text-green-900' : 'font-medium text-gray-900'
                  }`}>
                    {formatValueWithPercentage(engagement.prevision10, engagement.pourcentagePrevision10, 'HT')}
                  </td>
                  <td className={`px-1 py-2 text-center text-xs align-middle ${
                    isTotal ? 'font-bold text-green-900' : 'font-medium text-gray-900'
                  }`}>
                    {formatValueWithPercentage(engagement.prevision20, engagement.pourcentagePrevision20, 'TTC')}
                  </td>
                  <td className={`px-1 py-2 text-center text-xs align-middle ${
                    isTotal ? 'font-bold text-green-900' : 'font-medium text-gray-900'
                  }`}>
                    {formatValueWithPercentage(engagement.cumuleTTC, engagement.pourcentageCumuleTTC, 'TTC')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default EngagementDepensesMensuellesPanel