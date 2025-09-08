import React from 'react'

interface DepenseOrdonnee {
  libelle: string
  nombre: number
  pourcentage?: number
  type?: 'currency' | 'currency_with_percentage' | 'number'
  bold?: boolean
  isTotal?: boolean
}

interface DepensesOrdonneesData {
  statistiques: DepenseOrdonnee[]
  budgetTotal?: number
}

interface DepensesOrdonneesPanelProps {
  statsDepensesOrdonnees: DepensesOrdonneesData | undefined
}

const DepensesOrdonneesPanel: React.FC<DepensesOrdonneesPanelProps> = ({ statsDepensesOrdonnees }) => {
  const heightPercentage = statsDepensesOrdonnees && statsDepensesOrdonnees.statistiques.length > 0 ? (100 / statsDepensesOrdonnees.statistiques.length).toFixed(2) : '100'
  
  const formatCurrency = (amount: number, addSuffix: string = '') => {
    const formatted = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
    return addSuffix ? formatted + ' ' + addSuffix : formatted
  }

  const formatValue = (stat: DepenseOrdonnee) => {
    if (stat.type === 'currency' || stat.type === 'currency_with_percentage') {
      const formattedCurrency = formatCurrency(stat.nombre)
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
  
  return (
    <div className="h-full flex flex-col bg-orange-50">
      <div className="flex-1 overflow-auto">
        <table className="w-full h-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-orange-100 sticky top-0" style={{ height: 'auto' }}>
            <tr>
              <th className="px-2 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                
              </th>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Valeur
              </th>
            </tr>
          </thead>
          <tbody className="bg-white h-full">
            {statsDepensesOrdonnees && statsDepensesOrdonnees.statistiques.length > 0 ? (
              statsDepensesOrdonnees.statistiques.map((stat, index) => {
                const isTotalLine = stat.isTotal
                
                return (
                <tr 
                  key={`${stat.libelle}-${index}`} 
                  className={`${
                    isTotalLine 
                      ? 'bg-orange-200 border-t-2 border-orange-400 font-bold' 
                      : index % 2 === 0 ? 'bg-orange-50' : 'bg-white'
                  } border-b border-orange-200`}
                  style={{ height: `${heightPercentage}%` }}
                >
                  <td className={`px-2 py-2 text-sm align-middle ${
                    isTotalLine ? 'font-bold text-orange-900' : stat.bold ? 'font-bold text-gray-900' : 'font-medium text-gray-900'
                  }`}>
                    {stat.libelle}
                  </td>
                  <td className={`px-2 py-2 text-center text-sm align-middle ${
                    isTotalLine ? 'font-bold text-orange-900' : stat.bold ? 'font-bold text-gray-900' : 'font-medium text-gray-900'
                  }`}>
                    {formatValue(stat)}
                  </td>
                </tr>
                )
              })
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

export default DepensesOrdonneesPanel