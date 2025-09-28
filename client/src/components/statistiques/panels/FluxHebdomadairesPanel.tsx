import React from 'react'
import { StatistiquesFluxHebdomadaires } from '../types'

interface FluxHebdomairesPanelProps {
  fluxHebdomadaires: StatistiquesFluxHebdomadaires | undefined
}

const FluxHebdomadairesPanel: React.FC<FluxHebdomairesPanelProps> = ({ fluxHebdomadaires }) => {
  // Calculer le stock cumulé pour chaque semaine
  const fluxAvecStock = fluxHebdomadaires?.fluxHebdomadaires ? 
    fluxHebdomadaires.fluxHebdomadaires.reduce((acc, flux, index) => {
      const difference = flux.entrantsAnnee - flux.sortantsAnnee;
      const stock = index === 0 ? difference : acc[index - 1].stock + difference;
      acc.push({
        ...flux,
        difference,
        stock
      });
      return acc;
    }, [] as Array<typeof fluxHebdomadaires.fluxHebdomadaires[0] & {difference: number, stock: number}>) : [];

  const heightPercentage = fluxAvecStock && fluxAvecStock.length > 0 ? (100 / fluxAvecStock.length).toFixed(2) : '100';

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full h-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gray-50 sticky top-0" style={{ height: 'auto' }}>
            <tr>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Semaine
              </th>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-green-50">
                Entrants
              </th>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-red-50">
                Sortants
              </th>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-blue-50">
                Différence
              </th>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-yellow-50">
                Stock
              </th>
            </tr>
          </thead>
          <tbody className="bg-white h-full">
            {fluxAvecStock && fluxAvecStock.length > 0 ? (
              fluxAvecStock.map((flux, index) => (
                <tr 
                  key={flux.numeroSemaine} 
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100 hover:bg-gray-100`}
                  style={{ height: `${heightPercentage}%` }}
                >
                  <td className="px-2 py-2 text-center align-middle">
                    <div className="text-sm font-medium text-gray-900">
                      S{flux.numeroSemaine.toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {flux.dateDebut} - {flux.dateFin}
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
                    {flux.entrantsAnnee}
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
                    {flux.sortantsAnnee}
                  </td>
                  <td className={`px-2 py-2 text-center text-sm font-medium align-middle ${
                    flux.difference > 0 ? 'text-red-600' :
                    flux.difference < 0 ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    {flux.difference > 0 ? '+' : ''}{flux.difference}
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
                    {flux.stock}
                  </td>
                </tr>
              ))
            ) : (
              <tr style={{ height: '100%' }}>
                <td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-500 align-middle">
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

export default FluxHebdomadairesPanel