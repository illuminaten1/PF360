import React, { useRef } from 'react'
import CardHeader from '@/components/common/CardHeader'

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
  const tableRef = useRef<HTMLTableElement>(null)
  
  if (!stats || !stats.donneesParMois?.length) {
    return (
      <div className="h-full flex flex-col">
        <CardHeader
          title="Extraction mensuelle pour BAA / SP"
          enableScreenshot={true}
          targetRef={tableRef}
          exportFileName="extraction-mensuelle-baa-sp"
          hasData={false}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-sm text-gray-500">
            Aucune donnée disponible
          </div>
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
    <div className="h-full flex flex-col">
      <CardHeader
        title="Extraction mensuelle pour BAA / SP"
        enableScreenshot={true}
        targetRef={tableRef}
        exportFileName="extraction-mensuelle-baa-sp"
        hasData={true}
      />
      <div className="flex-1 overflow-auto">
        <table ref={tableRef} className="w-full h-full border-collapse text-xs" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gray-50 sticky top-0" style={{ height: 'auto' }}>
            <tr>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                MOIS
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                DEMANDES VICTIME
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                DONT RÉSERVISTES
              </th>
              <th className="px-2 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                CUMUL DEMANDES VICTIME
              </th>
              <th className="px-2 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                CUMUL RÉSERVISTES VICTIME
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                DEMANDES VICTIME VIOLENCES
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                DONT RÉSERVISTES
              </th>
              <th className="px-2 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                CUMUL VICTIME VIOLENCES
              </th>
              <th className="px-2 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                CUMUL RÉSERVISTES VIOLENCES
              </th>
            </tr>
          </thead>
          <tbody className="bg-white h-full">
            {stats.donneesParMois.map((data, index) => {
              const totalRows = stats.donneesParMois.length + 1; // +1 pour la ligne moyenne
              const heightPercentage = (100 / totalRows).toFixed(2);
              return (
                <tr 
                  key={data.mois} 
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100`}
                  style={{ height: `${heightPercentage}%` }}
                >
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
                    {data.mois}
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
                    {formatNumber(data.ddesDePfVictimeUniquementToutesInfractions)}
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
                    {formatNumber(data.dontReservistes)}
                  </td>
                  <td className="px-2 py-2 text-center text-[10px] font-medium text-gray-900 align-middle">
                    {formatNumber(data.cumulDdeVictime)}
                  </td>
                  <td className="px-2 py-2 text-center text-[10px] font-medium text-gray-900 align-middle">
                    {formatNumber(data.dontCumulVictimeReservistes)}
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
                    {formatNumber(data.ddesDePfPourViolences)}
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
                    {formatNumber(data.dontDdesDePfPourViolencesSurReservistes)}
                  </td>
                  <td className="px-2 py-2 text-center text-[10px] font-medium text-gray-900 align-middle">
                    {formatNumber(data.cumulViolences)}
                  </td>
                  <td className="px-2 py-2 text-center text-[10px] font-medium text-gray-900 align-middle">
                    {formatNumber(data.dontCumulViolencesReservistes)}
                  </td>
                </tr>
              )
            })}
            
            <tr 
              className="bg-blue-50 border-t-2 border-blue-200"
              style={{ height: `${(100 / (stats.donneesParMois.length + 1)).toFixed(2)}%` }}
            >
              <td className="px-2 py-2 text-center text-sm font-bold text-gray-900 align-middle">
                MOYENNE / MOIS
              </td>
              <td className="px-2 py-2 text-center text-sm font-bold text-gray-900 align-middle">
                {formatDecimal(stats.moyenneParMois.ddesDePfVictimeUniquementToutesInfractions)}
              </td>
              <td className="px-2 py-2 text-center text-sm font-bold text-gray-900 align-middle">
                {formatDecimal(stats.moyenneParMois.dontReservistes)}
              </td>
              <td className="px-2 py-2 text-center text-[10px] font-bold text-gray-900 align-middle">
                -
              </td>
              <td className="px-2 py-2 text-center text-[10px] font-bold text-gray-900 align-middle">
                -
              </td>
              <td className="px-2 py-2 text-center text-sm font-bold text-gray-900 align-middle">
                {formatDecimal(stats.moyenneParMois.ddesDePfPourViolences)}
              </td>
              <td className="px-2 py-2 text-center text-sm font-bold text-gray-900 align-middle">
                {formatDecimal(stats.moyenneParMois.dontDdesDePfPourViolencesSurReservistes)}
              </td>
              <td className="px-2 py-2 text-center text-[10px] font-bold text-gray-900 align-middle">
                -
              </td>
              <td className="px-2 py-2 text-center text-[10px] font-bold text-gray-900 align-middle">
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