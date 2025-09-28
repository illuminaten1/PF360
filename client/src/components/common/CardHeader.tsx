import React from 'react'
import { ArrowDownTrayIcon, DocumentDuplicateIcon, TableCellsIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface CardHeaderProps {
  title: string
  enableScreenshot?: boolean
  enableExcelExport?: boolean
  targetRef?: React.RefObject<HTMLElement>
  onExcelExport?: () => void
  exportFileName?: string
  hasData?: boolean
}

const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  enableScreenshot = false,
  enableExcelExport = false,
  targetRef,
  onExcelExport,
  exportFileName = 'export',
  hasData = true
}) => {
  const captureElement = async () => {
    if (!targetRef?.current || !hasData) return

    try {
      const html2canvas = await import('html2canvas')
      const canvas = await html2canvas.default(targetRef.current, {
        useCORS: true,
        allowTaint: false,
        logging: false
      })

      canvas.toBlob((blob) => {
        if (!blob) return

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${exportFileName}-${new Date().toISOString().split('T')[0]}.jpeg`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success('Capture d\'écran téléchargée avec succès')
      }, 'image/jpeg', 0.95)
    } catch (error) {
      console.error('Erreur lors de la capture:', error)
      toast.error('Erreur lors de la capture du tableau')
    }
  }

  const copyToClipboard = async () => {
    if (!targetRef?.current || !hasData) return

    try {
      const html2canvas = await import('html2canvas')
      const canvas = await html2canvas.default(targetRef.current, {
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

  const handleExcelExport = () => {
    if (onExcelExport && hasData) {
      onExcelExport()
    }
  }

  return (
    <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200 bg-gray-50">
      <span className="font-semibold text-sm text-gray-900">
        {title}
      </span>
      <div className="flex space-x-1">
        {enableExcelExport && (
          <button
            onClick={handleExcelExport}
            disabled={!hasData}
            className={`p-1 rounded transition-colors duration-200 ${
              hasData
                ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title={hasData ? 'Exporter vers Excel' : 'Aucune donnée à exporter'}
          >
            <TableCellsIcon className="h-4 w-4" />
          </button>
        )}
        {enableScreenshot && (
          <>
            <button
              onClick={captureElement}
              disabled={!hasData}
              className={`p-1 rounded transition-colors duration-200 ${
                hasData
                  ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title={hasData ? 'Télécharger en image JPEG' : 'Aucune donnée à capturer'}
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
            </button>
            <button
              onClick={copyToClipboard}
              disabled={!hasData}
              className={`p-1 rounded transition-colors duration-200 ${
                hasData
                  ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title={hasData ? 'Copier l\'image dans le presse-papiers' : 'Aucune donnée à copier'}
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default CardHeader