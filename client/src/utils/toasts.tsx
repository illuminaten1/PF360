import React from 'react'
import toast from 'react-hot-toast'

/**
 * Affiche un toast d'avertissement pour les conventions d'honoraires > 3000€ HT
 * Le toast nécessite un clic pour être fermé
 */
export const showHighAmountConventionToast = () => {
  const message = '⚠️ Convention ou avenant supérieur à 3000 euros, une validation hiérarchique est requise avant proposition à l\'avocat'

  toast((t) => (
    <div
      onClick={() => toast.dismiss(t.id)}
      style={{ cursor: 'pointer', userSelect: 'none' }}
    >
      {message}
      <br />
      <small style={{ opacity: 0.8, fontSize: '12px' }}>(Cliquer pour acquitter)</small>
    </div>
  ), {
    duration: Infinity
    // Pas de style personnalisé - utilise le thème par défaut de l'app
  })
}