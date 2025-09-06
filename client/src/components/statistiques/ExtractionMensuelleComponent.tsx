import React from 'react'

interface ExtractionMensuelleData {
  mois: string
  ddesDePfVictimeUniquementToutesInfractions: number
  dontReservistes: number
  cumulDdeVictime: number
  dontCumulVictimeReservistes: number
  ddesDePfPourViolences: number
  dontDdesDePfPourViolencesSurReservistes: number
  cumulViolences: number
  dontCumulViolencesReservistes: number
}

interface ExtractionMensuelleStats {
  donneesParMois: ExtractionMensuelleData[]
  moyenneParMois: {
    ddesDePfVictimeUniquementToutesInfractions: number
    dontReservistes: number
    ddesDePfPourViolences: number
    dontDdesDePfPourViolencesSurReservistes: number
  }
}

interface ExtractionMensuelleComponentProps {
  stats: ExtractionMensuelleStats | undefined
}

const ExtractionMensuelleComponent: React.FC<ExtractionMensuelleComponentProps> = ({ stats }) => {
  if (!stats || !stats.donneesParMois?.length) {
    return (
      <div className="p-4 h-full overflow-auto">
        <div className="text-center text-gray-500">
          Aucune donnée disponible
        </div>
      </div>
    )
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num)
  }

  const formatDecimal = (num: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(num)
  }

  return (
    <div className="p-4 h-full overflow-auto">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                MOIS
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                DDES DE PF VICTIME UNIQUEMENT TOUTES INFRACTIONS
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                DONT RÉSERVISTES
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                CUMUL DDE VICTIME
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                DONT CUMUL VICTIME RÉSERVISTES
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                DDES DE PF POUR VIOLENCES
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                DONT DDES DE PF POUR VIOLENCES SUR RÉSERVISTES
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                CUMUL VIOLENCES
              </th>
              <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                DONT CUMUL VIOLENCES RÉSERVISTES
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stats.donneesParMois.map((data) => (
              <tr key={data.mois} className="hover:bg-gray-50">
                <td className="px-2 py-2 whitespace-nowrap text-center text-xs font-medium text-gray-900">
                  {data.mois}
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900">
                  {formatNumber(data.ddesDePfVictimeUniquementToutesInfractions)}
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900">
                  {formatNumber(data.dontReservistes)}
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900">
                  {formatNumber(data.cumulDdeVictime)}
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900">
                  {formatNumber(data.dontCumulVictimeReservistes)}
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900">
                  {formatNumber(data.ddesDePfPourViolences)}
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900">
                  {formatNumber(data.dontDdesDePfPourViolencesSurReservistes)}
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900">
                  {formatNumber(data.cumulViolences)}
                </td>
                <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900">
                  {formatNumber(data.dontCumulViolencesReservistes)}
                </td>
              </tr>
            ))}
            
            {/* Ligne de moyennes */}
            <tr className="hover:bg-gray-50">
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs font-medium text-gray-900">
                MOYENNE / MOIS
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-medium">
                {formatDecimal(stats.moyenneParMois.ddesDePfVictimeUniquementToutesInfractions)}
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-medium">
                {formatDecimal(stats.moyenneParMois.dontReservistes)}
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-medium">
                -
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-medium">
                -
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-medium">
                {formatDecimal(stats.moyenneParMois.ddesDePfPourViolences)}
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-medium">
                {formatDecimal(stats.moyenneParMois.dontDdesDePfPourViolencesSurReservistes)}
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-medium">
                -
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-medium">
                -
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ExtractionMensuelleComponent