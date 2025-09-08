import React from 'react'
import { DepensesOrdonneesParMoisData, DepenseOrdonneeMois } from '../types'

interface DepensesOrdonneesParMoisPanelProps {
  statsDepensesOrdonneesParMois: DepensesOrdonneesParMoisData | undefined
}

const DepensesOrdonneesParMoisPanel: React.FC<DepensesOrdonneesParMoisPanelProps> = ({ statsDepensesOrdonneesParMois }) => {
  const heightPercentage = statsDepensesOrdonneesParMois && statsDepensesOrdonneesParMois.statistiques.length > 0 
    ? (100 / statsDepensesOrdonneesParMois.statistiques.length).toFixed(2) 
    : '100'
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatMoisLabel = (stat: DepenseOrdonneeMois) => {
    if (stat.isTotal) return stat.mois
    const moisNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ]
    const moisIndex = parseInt(stat.mois) - 1
    const nomMois = moisNames[moisIndex] || stat.mois
    return `${nomMois} ${stat.annee}`
  }

  const formatValueWithPercentage = (amount: number, percentage?: number) => {
    const formattedCurrency = formatCurrency(amount)
    if (percentage !== undefined) {
      return (
        <span>
          {formattedCurrency}
          <br />
          <span className="text-xs text-gray-500">({percentage.toFixed(1)}% du budget)</span>
        </span>
      )
    }
    return formattedCurrency
  }
  
  return (
    <div className="h-full flex flex-col bg-orange-50">
      <div className="flex-1 overflow-auto">
        <table className="w-full h-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-orange-100 sticky top-0" style={{ height: 'auto' }}>
            <tr>
              <th className="px-2 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Mois
              </th>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Payé HT (indicatif)
              </th>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Payé TTC
              </th>
            </tr>
          </thead>
          <tbody className="bg-white h-full">
            {statsDepensesOrdonneesParMois && statsDepensesOrdonneesParMois.statistiques.length > 0 ? (
              statsDepensesOrdonneesParMois.statistiques.map((stat, index) => {
                const isTotalLine = stat.isTotal || stat.mois.toLowerCase().includes('total')
                
                return (
                <tr 
                  key={`${stat.mois}-${stat.annee}-${index}`} 
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
                    {formatMoisLabel(stat)}
                  </td>
                  <td className={`px-2 py-2 text-center text-sm align-middle ${
                    isTotalLine ? 'font-bold text-orange-900' : stat.bold ? 'font-bold text-gray-900' : 'font-medium text-gray-900'
                  }`}>
                    {formatValueWithPercentage(stat.montantHTPaiements, stat.pourcentageHT)}
                  </td>
                  <td className={`px-2 py-2 text-center text-sm align-middle ${
                    isTotalLine ? 'font-bold text-orange-900' : stat.bold ? 'font-bold text-gray-900' : 'font-medium text-gray-900'
                  }`}>
                    {formatValueWithPercentage(stat.montantTTCDossiers, stat.pourcentageTTC)}
                  </td>
                </tr>
                )
              })
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

export default DepensesOrdonneesParMoisPanel