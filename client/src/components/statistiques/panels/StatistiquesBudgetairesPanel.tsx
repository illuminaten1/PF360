import React from 'react'

interface StatistiqueBudgetaire {
  libelle: string
  nombre: number
  pourcentage?: number
  type?: 'currency' | 'currency_with_percentage'
  bold?: boolean
  showPrevisions?: boolean
  prevision10?: number
  prevision20?: number
  pourcentagePrevision10?: number
  pourcentagePrevision20?: number
}

interface StatistiquesBudgetairesData {
  statistiques: StatistiqueBudgetaire[]
  budgetTotal?: number
}

interface StatistiquesBudgetairesPanelProps {
  statsBudgetaires: StatistiquesBudgetairesData | undefined
}

const StatistiquesBudgetairesPanel: React.FC<StatistiquesBudgetairesPanelProps> = ({ statsBudgetaires }) => {
  const heightPercentage = statsBudgetaires && statsBudgetaires.statistiques.length > 0 ? (100 / statsBudgetaires.statistiques.length).toFixed(2) : '100'
  
  const formatCurrency = (amount: number, addSuffix: string = '') => {
    const formatted = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
    return addSuffix ? formatted + ' ' + addSuffix : formatted
  }

  const formatValue = (stat: StatistiqueBudgetaire) => {
    if (stat.type === 'currency' || stat.type === 'currency_with_percentage') {
      const formattedCurrency = formatCurrency(stat.nombre, stat.showPrevisions ? 'HT' : '')
      if (stat.type === 'currency_with_percentage' && stat.pourcentage !== undefined) {
        return (
          <span>
            {formattedCurrency}
            <br />
            <span className="text-xs text-gray-500">({stat.pourcentage.toFixed(1)}% du budget)</span>
          </span>
        )
      }
      return formattedCurrency
    }
    return stat.nombre.toLocaleString('fr-FR')
  }
  
  // Vérifier s'il y a des lignes avec prévisions
  const hasPrevisionsRows = statsBudgetaires?.statistiques.some(stat => stat.showPrevisions) || false
  
  return (
    <div className="h-full flex flex-col bg-green-50">
      <div className="flex-1 overflow-auto">
        <table className="w-full h-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-green-100 sticky top-0" style={{ height: 'auto' }}>
            <tr>
              <th className="px-2 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                
              </th>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Valeur
              </th>
              {hasPrevisionsRows && (
                <>
                  <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Prév. +10%
                  </th>
                  <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Prév. +20%
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white h-full">
            {statsBudgetaires && statsBudgetaires.statistiques.length > 0 ? (
              statsBudgetaires.statistiques.map((stat, index) => {
                const isTotalLine = stat.libelle === "Montant HT gagé total"
                
                return (
                <tr 
                  key={`${stat.libelle}-${index}`} 
                  className={`${
                    isTotalLine 
                      ? 'bg-green-200 border-t-2 border-green-400 font-bold' 
                      : index % 2 === 0 ? 'bg-green-50' : 'bg-white'
                  } border-b border-green-200`}
                  style={{ height: `${heightPercentage}%` }}
                >
                  <td className={`px-2 py-2 text-sm align-middle ${
                    isTotalLine ? 'font-bold text-green-900' : stat.bold ? 'font-bold text-gray-900' : 'font-medium text-gray-900'
                  }`}>
                    {stat.libelle}
                  </td>
                  <td className={`px-2 py-2 text-center text-sm align-middle ${
                    isTotalLine ? 'font-bold text-green-900' : stat.bold ? 'font-bold text-gray-900' : 'font-medium text-gray-900'
                  }`}>
                    {formatValue(stat)}
                  </td>
                  {hasPrevisionsRows && (
                    <>
                      <td className={`px-2 py-2 text-center text-sm align-middle ${
                        isTotalLine ? 'font-bold text-green-900' : stat.bold ? 'font-bold text-gray-900' : 'font-medium text-gray-900'
                      }`}>
                        {stat.showPrevisions && stat.prevision10 !== undefined ? (
                          <span>
                            {formatCurrency(stat.prevision10, 'HT')}
                            <br />
                            <span className="text-xs text-gray-500">
                              ({stat.pourcentagePrevision10?.toFixed(1)}% du budget)
                            </span>
                          </span>
                        ) : ''}
                      </td>
                      <td className={`px-2 py-2 text-center text-sm align-middle ${
                        isTotalLine ? 'font-bold text-green-900' : stat.bold ? 'font-bold text-gray-900' : 'font-medium text-gray-900'
                      }`}>
                        {stat.showPrevisions && stat.prevision20 !== undefined ? (
                          <span>
                            {formatCurrency(stat.prevision20, 'TTC')}
                            <br />
                            <span className="text-xs text-gray-500">
                              ({stat.pourcentagePrevision20?.toFixed(1)}% du budget)
                            </span>
                          </span>
                        ) : ''}
                      </td>
                    </>
                  )}
                </tr>
                )
              })
            ) : (
              <tr style={{ height: '100%' }}>
                <td colSpan={hasPrevisionsRows ? 4 : 2} className="px-3 py-4 text-center text-sm text-gray-500 align-middle">
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