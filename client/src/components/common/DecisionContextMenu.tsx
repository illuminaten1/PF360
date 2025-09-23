import React from 'react'
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import api from '@/utils/api'

interface Decision {
  id: string
  type: 'AJ' | 'AJE' | 'PJ' | 'REJET'
  numero?: string
  dateSignature?: string
  demandes?: Array<{
    demande: {
      id: string
      prenom: string
      nom: string
      grade?: {
        gradeAbrege: string
      }
    }
  }>
}

interface Dossier {
  id: string
  numero: string
  nomDossier?: string
}

interface DecisionContextMenuProps {
  show: boolean
  x: number
  y: number
  decision: Decision | null
  dossier: Dossier | null
  onClose: () => void
}

const DecisionContextMenu: React.FC<DecisionContextMenuProps> = ({
  show,
  x,
  y,
  decision,
  dossier,
  onClose
}) => {
  console.log('DecisionContextMenu render:', { show, x, y, decision: !!decision, dossier: !!dossier })
  if (!show || !decision || !dossier) return null

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'AJ':
        return 'Assistance judiciaire'
      case 'AJE':
        return 'Assistance judiciaire élargie'
      case 'PJ':
        return 'Protection juridique'
      case 'REJET':
        return 'Rejet'
      default:
        return type
    }
  }

  const generateDocument = async () => {
    try {
      const response = await api.post(`/generate-documents/decision/${decision.id}`, {}, {
        responseType: 'blob'
      })

      // Créer un lien pour télécharger le fichier
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url

      // Extraire le nom du fichier depuis l'en-tête Content-Disposition
      const contentDisposition = response.headers['content-disposition']
      let fileName = `decision-${decision.numero || 'nouveau'}.odt`

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/)
        if (fileNameMatch) {
          fileName = fileNameMatch[1]
        }
      }

      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(`Document de décision ${getTypeLabel(decision.type)} généré avec succès`)
    } catch (error: unknown) {
      console.error('Erreur lors de la génération du document:', error)

      // Erreur plus spécifique selon le code de statut
      if (error && typeof error === 'object' && 'response' in error &&
          error.response && typeof error.response === 'object' && 'status' in error.response &&
          error.response.status === 404) {
        toast.error('Template de décision non trouvé. Veuillez contacter l\'administrateur.')
      } else {
        toast.error('Erreur lors de la génération du document de décision')
      }
    }

    onClose()
  }

  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[200px]"
      style={{
        left: x,
        top: y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={generateDocument}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
      >
        <DocumentArrowDownIcon className="h-4 w-4" />
        <span>Générer le document de décision</span>
      </button>
    </div>
  )
}

export default DecisionContextMenu