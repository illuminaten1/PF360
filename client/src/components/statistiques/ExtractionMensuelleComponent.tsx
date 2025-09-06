import React, { useRef } from 'react'
import { CameraIcon } from '@heroicons/react/24/outline'

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

  const captureTable = async () => {
    if (!tableRef.current) return

    try {
      const html2canvas = await import('html2canvas')
      const canvas = await html2canvas.default(tableRef.current, {
        useCORS: true,
        allowTaint: false,
        logging: false
      })

      canvas.toBlob((blob) => {
        if (!blob) return
        
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `extraction-mensuelle-baa-sp-${new Date().toISOString().split('T')[0]}.jpeg`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 'image/jpeg', 0.95)
    } catch (error) {
      console.error('Erreur lors de la capture:', error)
      alert('Erreur lors de la capture du tableau')
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 bg-gray-50">
        <span className="font-semibold text-sm text-gray-900">
          Extraction mensuelle pour BAA / SP
        </span>
        <button
          onClick={captureTable}
          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200"
          title="Capturer le tableau en image JPEG"
        >
          <CameraIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 p-4 overflow-auto">
        <div className="overflow-x-auto">
          <table ref={tableRef} className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MOIS
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DDES DE PF VICTIME UNIQUEMENT TOUTES INFRACTIONS
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DONT RÉSERVISTES
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CUMUL DDE VICTIME
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DONT CUMUL VICTIME RÉSERVISTES
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DDES DE PF POUR VIOLENCES
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DONT DDES DE PF POUR VIOLENCES SUR RÉSERVISTES
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CUMUL VIOLENCES
                </th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DONT CUMUL VIOLENCES RÉSERVISTES
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.donneesParMois.map((data, index) => (
                <tr key={data.mois} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-2 py-1 text-center text-sm font-medium text-gray-900">
                    {data.mois}
                  </td>
                  <td className="px-2 py-1 text-center text-gray-900">
                    {formatNumber(data.ddesDePfVictimeUniquementToutesInfractions)}
                  </td>
                  <td className="px-2 py-1 text-center text-gray-900">
                    {formatNumber(data.dontReservistes)}
                  </td>
                  <td className="px-2 py-1 text-center text-gray-900">
                    {formatNumber(data.cumulDdeVictime)}
                  </td>
                  <td className="px-2 py-1 text-center text-gray-900">
                    {formatNumber(data.dontCumulVictimeReservistes)}
                  </td>
                  <td className="px-2 py-1 text-center text-gray-900">
                    {formatNumber(data.ddesDePfPourViolences)}
                  </td>
                  <td className="px-2 py-1 text-center text-gray-900">
                    {formatNumber(data.dontDdesDePfPourViolencesSurReservistes)}
                  </td>
                  <td className="px-2 py-1 text-center text-gray-900">
                    {formatNumber(data.cumulViolences)}
                  </td>
                  <td className="px-2 py-1 text-center text-gray-900">
                    {formatNumber(data.dontCumulViolencesReservistes)}
                  </td>
                </tr>
              ))}
              
              <tr className="bg-blue-50 border-t-2 border-blue-200">
                <td className="px-2 py-1 text-center text-sm font-bold text-gray-900">
                  MOYENNE / MOIS
                </td>
                <td className="px-2 py-1 text-center font-bold text-gray-900">
                  {formatDecimal(stats.moyenneParMois.ddesDePfVictimeUniquementToutesInfractions)}
                </td>
                <td className="px-2 py-1 text-center font-bold text-gray-900">
                  {formatDecimal(stats.moyenneParMois.dontReservistes)}
                </td>
                <td className="px-2 py-1 text-center font-bold text-gray-900">
                  -
                </td>
                <td className="px-2 py-1 text-center font-bold text-gray-900">
                  -
                </td>
                <td className="px-2 py-1 text-center font-bold text-gray-900">
                  {formatDecimal(stats.moyenneParMois.ddesDePfPourViolences)}
                </td>
                <td className="px-2 py-1 text-center font-bold text-gray-900">
                  {formatDecimal(stats.moyenneParMois.dontDdesDePfPourViolencesSurReservistes)}
                </td>
                <td className="px-2 py-1 text-center font-bold text-gray-900">
                  -
                </td>
                <td className="px-2 py-1 text-center font-bold text-gray-900">
                  -
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ExtractionMensuelleComponent