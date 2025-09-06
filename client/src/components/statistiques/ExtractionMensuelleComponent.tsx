import React, { useRef } from 'react'
import { CameraIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

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
        <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 bg-gray-50">
          <span className="font-semibold text-sm text-gray-900">
            Extraction mensuelle pour BAA / SP
          </span>
          <div className="flex space-x-1">
            <button
              disabled
              className="p-1 text-gray-300 cursor-not-allowed rounded"
              title="Aucune donnée à capturer"
            >
              <CameraIcon className="h-4 w-4" />
            </button>
            <button
              disabled
              className="p-1 text-gray-300 cursor-not-allowed rounded"
              title="Aucune donnée à copier"
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
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
        toast.success('Capture d\'écran téléchargée avec succès')
      }, 'image/jpeg', 0.95)
    } catch (error) {
      console.error('Erreur lors de la capture:', error)
      alert('Erreur lors de la capture du tableau')
    }
  }

  const copyToClipboard = async () => {
    if (!tableRef.current) return

    try {
      const html2canvas = await import('html2canvas')
      const canvas = await html2canvas.default(tableRef.current, {
        useCORS: true,
        allowTaint: false,
        logging: false,
      })

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png')
      )

      if (!blob) {
        toast.error('Erreur lors de la conversion de l\'image.')
        return
      }

      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ])
        toast.success('Image copiée dans le presse-papiers')
      } catch (err) {
        console.error('Erreur Clipboard API:', err)
        fallbackCopyImage(canvas)
      }
    } catch (error) {
      console.error('Erreur lors de la capture:', error)
      toast.error('Erreur lors de la capture du tableau')
    }
  }

  const fallbackCopyImage = (canvas: HTMLCanvasElement) => {
    try {
      const dataUrl = canvas.toDataURL('image/png')
      
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'fixed'
      tempDiv.style.top = '-9999px'
      tempDiv.innerHTML = `<img src="${dataUrl}" style="max-width: 100%; height: auto;">`
      
      document.body.appendChild(tempDiv)
      
      const range = document.createRange()
      range.selectNodeContents(tempDiv)
      const selection = window.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(range)
      
      const successful = document.execCommand('copy')
      
      document.body.removeChild(tempDiv)
      selection?.removeAllRanges()
      
      if (successful) {
        toast.success('Image copiée dans le presse-papiers')
      } else {
        toast.error('Impossible de copier l\'image. Veuillez utiliser le bouton de téléchargement.')
      }
    } catch (error) {
      console.error('Erreur fallback:', error)
      toast.error('Copie non supportée par votre navigateur. Utilisez le bouton de téléchargement.')
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 bg-gray-50">
        <span className="font-semibold text-sm text-gray-900">
          Extraction mensuelle pour BAA / SP
        </span>
        <div className="flex space-x-1">
          <button
            onClick={captureTable}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200"
            title="Capturer le tableau en image JPEG"
          >
            <CameraIcon className="h-4 w-4" />
          </button>
          <button
            onClick={copyToClipboard}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200"
            title="Copier le tableau dans le presse-papiers"
          >
            <DocumentDuplicateIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <table ref={tableRef} className="w-full h-full border-collapse text-xs" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gray-50 sticky top-0" style={{ height: 'auto' }}>
            <tr>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                MOIS
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                DDES DE PF VICTIME UNIQUEMENT TOUTES INFRACTIONS
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                DONT RÉSERVISTES
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                CUMUL DDE VICTIME
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                DONT CUMUL VICTIME RÉSERVISTES
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                DDES DE PF POUR VIOLENCES
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                DONT DDES DE PF POUR VIOLENCES SUR RÉSERVISTES
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                CUMUL VIOLENCES
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                DONT CUMUL VIOLENCES RÉSERVISTES
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
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
                    {formatNumber(data.cumulDdeVictime)}
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
                    {formatNumber(data.dontCumulVictimeReservistes)}
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
                    {formatNumber(data.ddesDePfPourViolences)}
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
                    {formatNumber(data.dontDdesDePfPourViolencesSurReservistes)}
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
                    {formatNumber(data.cumulViolences)}
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
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
              <td className="px-2 py-2 text-center text-sm font-bold text-gray-900 align-middle">
                -
              </td>
              <td className="px-2 py-2 text-center text-sm font-bold text-gray-900 align-middle">
                -
              </td>
              <td className="px-2 py-2 text-center text-sm font-bold text-gray-900 align-middle">
                {formatDecimal(stats.moyenneParMois.ddesDePfPourViolences)}
              </td>
              <td className="px-2 py-2 text-center text-sm font-bold text-gray-900 align-middle">
                {formatDecimal(stats.moyenneParMois.dontDdesDePfPourViolencesSurReservistes)}
              </td>
              <td className="px-2 py-2 text-center text-sm font-bold text-gray-900 align-middle">
                -
              </td>
              <td className="px-2 py-2 text-center text-sm font-bold text-gray-900 align-middle">
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