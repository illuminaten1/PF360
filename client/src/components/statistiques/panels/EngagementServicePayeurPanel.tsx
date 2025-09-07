import React from 'react'

interface EngagementServicePayeur {
  sgami: string
  montantTotal: number
  pourcentage: number
  prevision10: number
  prevision20: number
  pourcentagePrevision10: number
  pourcentagePrevision20: number
}

interface EngagementServicePayeurData {
  engagements: EngagementServicePayeur[]
  budgetTotal?: number
}

interface EngagementServicePayeurPanelProps {
  statsEngagements: EngagementServicePayeurData | undefined
}

const EngagementServicePayeurPanel: React.FC<EngagementServicePayeurPanelProps> = ({ statsEngagements }) => {
  const heightPercentage = statsEngagements && statsEngagements.engagements.length > 0 ? (100 / statsEngagements.engagements.length).toFixed(2) : '100'
  
  // Affichage temporaire des données pour debug
  if (!statsEngagements) {
    console.log('Pas de données statsEngagements')
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">Chargement des données...</div>
      </div>
    )
  }
  
  // Si pas d'engagements, afficher un message
  if (!statsEngagements.engagements || statsEngagements.engagements.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">Aucun engagement trouvé pour cette année</div>
      </div>
    )
  }
  
  const formatCurrency = (amount: number, suffix: string = 'HT') => {
    const formatted = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
    return formatted + ' ' + suffix
  }

  const formatValueWithPercentage = (amount: number, percentage: number, suffix: string = 'HT') => {
    return (
      <span>
        {formatCurrency(amount, suffix)}
        <br />
        <span className="text-xs text-gray-500">({percentage.toFixed(1)}% du budget)</span>
      </span>
    )
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full h-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gray-50 sticky top-0" style={{ height: 'auto' }}>
            <tr>
              <th className="px-2 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                SGAMI
              </th>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Valeur
              </th>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Prév. +10%
              </th>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Prév. +20%
              </th>
            </tr>
          </thead>
          <tbody className="bg-white h-full">
            {statsEngagements && statsEngagements.engagements.length > 0 ? (
              statsEngagements.engagements.map((engagement, index) => (
                <tr 
                  key={`${engagement.sgami}-${index}`} 
                  className={`${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  } border-b border-gray-100`}
                  style={{ height: `${heightPercentage}%` }}
                >
                  <td className="px-2 py-2 text-sm font-medium text-gray-900 align-middle">
                    {engagement.sgami}
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
                    {formatValueWithPercentage(engagement.montantTotal, engagement.pourcentage)}
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
                    {formatValueWithPercentage(engagement.prevision10, engagement.pourcentagePrevision10, 'HT')}
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
                    {formatValueWithPercentage(engagement.prevision20, engagement.pourcentagePrevision20, 'TTC')}
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

export default EngagementServicePayeurPanel