import React from 'react'
import { EnvelopeIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { showHighAmountConventionToast } from '@/utils/toasts'
import api from '@/utils/api'

interface Convention {
  id: string
  type: 'CONVENTION' | 'AVENANT'
  numero?: string
  avocat: {
    id: string
    prenom?: string
    nom: string
    email?: string
  }
  demandes?: Array<{
    demande: {
      id: string
      prenom: string
      nom: string
      grade?: {
        gradeAbrege: string
      }
      adresse?: string
      codePostal?: string
      ville?: string
    }
  }>
  montantHT: number
  instance: string
}

interface Dossier {
  id: string
  numero: string
  nomDossier?: string
}

interface ConventionContextMenuProps {
  show: boolean
  x: number
  y: number
  convention: Convention | null
  dossier: Dossier | null
  onClose: () => void
}

const ConventionContextMenu: React.FC<ConventionContextMenuProps> = ({
  show,
  x,
  y,
  convention,
  dossier,
  onClose
}) => {
  if (!show || !convention || !dossier) return null

  const generateEmailRelance = async () => {
    const avocat = convention.avocat

    if (!avocat.email) {
      toast.error('Aucun email renseigné pour cet avocat')
      onClose()
      return
    }

    // Générer le contenu de l'email
    const objet = `Relance convention n°${convention.numero} - Dossier ${dossier.numero}`

    const corps = `Bonjour Maître ${avocat.nom},

Nous nous permettons de vous relancer concernant la convention d'honoraires suivante :

• Convention n°${convention.numero}
• Type : ${convention.type}
• Dossier : ${dossier.numero}${dossier.nomDossier ? ` - ${dossier.nomDossier}` : ''}
• Montant HT : ${convention.montantHT.toLocaleString('fr-FR')} €
• Instance : ${convention.instance}

${convention.demandes && convention.demandes.length > 0
  ? `Demandeurs concernés :\n${convention.demandes.map((d) => `• ${d.demande.grade?.gradeAbrege ? `${d.demande.grade.gradeAbrege} ` : ''}${d.demande.prenom} ${d.demande.nom}`).join('\n')}`
  : ''
}

Sauf erreur, cette convention est en attente de signature de votre part.

Nous vous remercions de votre attention et restons à votre disposition pour tout complément d'information.

Respectueusement,`

    // Construire l'URL mailto
    const mailtoUrl = `mailto:${avocat.email}?subject=${encodeURIComponent(objet)}&body=${encodeURIComponent(corps)}`

    // Ouvrir le client mail
    try {
      window.open(mailtoUrl, '_blank')
      toast.success(`Email de relance préparé pour ${avocat.prenom ? `${avocat.prenom} ` : ''}${avocat.nom}`)
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du client mail:', error)
      toast.error('Impossible d\'ouvrir le client mail')
    }

    onClose()
  }

  const generateEmailProposition = async () => {
    const avocat = convention.avocat

    if (!avocat.email) {
      toast.error('Aucun email renseigné pour cet avocat')
      onClose()
      return
    }

    // Préparer les coordonnées des demandeurs (comme dans la convention générée)
    const demandeursInfo = convention.demandes && convention.demandes.length > 0
      ? convention.demandes.map((d) => {
          const demande = d.demande
          return `• ${demande.grade?.gradeAbrege ? `${demande.grade.gradeAbrege} ` : ''}${demande.prenom} ${demande.nom}${demande.adresse ? `\n  ${demande.adresse}` : ''}${demande.codePostal && demande.ville ? `\n  ${demande.codePostal} ${demande.ville}` : ''}`
        }).join('\n\n')
      : ''

    // Générer le contenu de l'email avec champs à compléter
    const objet = `Proposition de dossier - Convention n°${convention.numero}`

    const corps = `Bonjour Maître ${avocat.nom},

Nous vous proposons le dossier suivant :

• Convention n°${convention.numero}
• Type : ${convention.type}
• Dossier : ${dossier.numero}${dossier.nomDossier ? ` - ${dossier.nomDossier}` : ''}
• Montant HT : ${convention.montantHT.toLocaleString('fr-FR')} €
• Instance : ${convention.instance}

Coordonnées des demandeurs :
${demandeursInfo}

Nom du MEC : [À COMPLÉTER]

Date d'audience : [À COMPLÉTER]

Nous restons à votre disposition pour tout complément d'information.

Respectueusement,`

    // Construire l'URL mailto
    const mailtoUrl = `mailto:${avocat.email}?subject=${encodeURIComponent(objet)}&body=${encodeURIComponent(corps)}`

    // Ouvrir le client mail
    try {
      window.open(mailtoUrl, '_blank')
      toast.success(`Email de proposition préparé pour ${avocat.prenom ? `${avocat.prenom} ` : ''}${avocat.nom}`)
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du client mail:', error)
      toast.error('Impossible d\'ouvrir le client mail')
    }

    onClose()
  }

  const sendEmailConvention = async () => {
    const avocat = convention.avocat

    if (!avocat.email) {
      toast.error('Aucun email renseigné pour cet avocat')
      onClose()
      return
    }

    // Générer le contenu de l'email d'envoi de convention
    const objet = `Convention d'honoraires n°${convention.numero} - ${dossier.numero}`

    const corps = `Bonjour Maître ${avocat.nom},

Veuillez trouver ci-joint la convention d'honoraires relative au dossier suivant :

• Convention n°${convention.numero}
• Type : ${convention.type}
• Dossier : ${dossier.numero}${dossier.nomDossier ? ` - ${dossier.nomDossier}` : ''}
• Montant HT : ${convention.montantHT.toLocaleString('fr-FR')} €
• Instance : ${convention.instance}

Nous vous remercions de bien vouloir nous retourner cette convention signée dans les meilleurs délais.

Respectueusement,`

    // Construire l'URL mailto
    const mailtoUrl = `mailto:${avocat.email}?subject=${encodeURIComponent(objet)}&body=${encodeURIComponent(corps)}`

    // Ouvrir le client mail
    try {
      window.open(mailtoUrl, '_blank')
      toast.success(`Email d'envoi de convention préparé pour ${avocat.prenom ? `${avocat.prenom} ` : ''}${avocat.nom}`)
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du client mail:', error)
      toast.error('Impossible d\'ouvrir le client mail')
    }

    onClose()
  }

  const generateDocument = async () => {
    try {
      const documentType = convention.type === 'AVENANT' ? 'avenant' : 'convention'
      const response = await api.post(`/generate-documents/${documentType}/${convention.id}`, {}, {
        responseType: 'blob'
      })

      // Créer un lien pour télécharger le fichier
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url

      // Extraire le nom du fichier depuis l'en-tête Content-Disposition
      const contentDisposition = response.headers['content-disposition']
      let fileName = `${documentType}-${convention.numero || 'nouveau'}.odt`

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

      toast.success(`Document ${convention.type === 'AVENANT' ? 'd\'avenant' : 'de convention'} généré avec succès`)

      // Toast supplémentaire pour les conventions > 3000€ HT
      if (convention.montantHT > 2999) {
        showHighAmountConventionToast()
      }
    } catch (error: unknown) {
      console.error('Erreur lors de la génération du document:', error)

      // Erreur plus spécifique selon le code de statut
      if (error && typeof error === 'object' && 'response' in error &&
          error.response && typeof error.response === 'object' && 'status' in error.response &&
          error.response.status === 404) {
        toast.error(`Template ${convention.type === 'AVENANT' ? 'd\'avenant' : 'de convention'} non trouvé. Veuillez contacter l'administrateur.`)
      } else {
        toast.error(`Erreur lors de la génération du document ${convention.type === 'AVENANT' ? 'd\'avenant' : 'de convention'}`)
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
        <span>Générer le document en ODT</span>
      </button>

      <button
        onClick={generateEmailProposition}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
        disabled={!convention.avocat?.email}
      >
        <EnvelopeIcon className="h-4 w-4" />
        <span>Générer le mail de proposition du dossier</span>
      </button>

      <button
        onClick={sendEmailConvention}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
        disabled={!convention.avocat?.email}
      >
        <EnvelopeIcon className="h-4 w-4" />
        <span>Envoyer la convention ou l&apos;avenant par email</span>
      </button>

      <button
        onClick={generateEmailRelance}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
        disabled={!convention.avocat?.email}
      >
        <EnvelopeIcon className="h-4 w-4" />
        <span>Envoyer une relance de signature par email</span>
      </button>

      {!convention.avocat?.email && (
        <div className="px-4 py-2">
          <div className="text-xs text-red-500">
            Aucun email renseigné pour cet avocat
          </div>
        </div>
      )}
    </div>
  )
}

export default ConventionContextMenu