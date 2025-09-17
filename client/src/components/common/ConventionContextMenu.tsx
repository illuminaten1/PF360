import React, { useState } from 'react'
import { EnvelopeIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

interface ConventionContextMenuProps {
  show: boolean
  x: number
  y: number
  convention: any | null
  dossier: any | null
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
  ? `Demandeurs concernés :\n${convention.demandes.map((d: any) => `• ${d.demande.grade?.gradeAbrege ? `${d.demande.grade.gradeAbrege} ` : ''}${d.demande.prenom} ${d.demande.nom}`).join('\n')}`
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
      ? convention.demandes.map((d: any) => {
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
        onClick={generateEmailProposition}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
        disabled={!convention.avocat?.email}
      >
        <PaperAirplaneIcon className="h-4 w-4" />
        <span>Générer mail de proposition dossier</span>
      </button>

      <button
        onClick={generateEmailRelance}
        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
        disabled={!convention.avocat?.email}
      >
        <EnvelopeIcon className="h-4 w-4" />
        <span>Envoyer relance par email</span>
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