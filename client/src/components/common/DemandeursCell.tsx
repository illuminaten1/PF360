import React from 'react'

interface Demandeur {
  prenom: string
  nom: string
  numeroDS?: string
  grade?: string
}

interface DemandeursCellProps {
  demandes: Demandeur[]
  showAll: boolean
  onToggleShowAll: () => void
  emptyState?: React.ReactNode
  showGrade?: boolean
}

/**
 * Composant réutilisable pour afficher une liste de demandeurs avec expansion/réduction.
 * Utilisé dans DossiersTableV2, ConventionsTableV2 et DecisionsTableV2.
 *
 * @param demandes - Liste des demandeurs à afficher
 * @param showAll - État d'expansion (true = tous affichés, false = 2 premiers)
 * @param onToggleShowAll - Callback pour basculer l'état d'expansion
 * @param emptyState - Élément React à afficher quand il n'y a pas de demandeurs (optionnel)
 * @param showGrade - Afficher le grade abrégé si disponible (par défaut: false)
 */
const DemandeursCell: React.FC<DemandeursCellProps> = React.memo(function DemandeursCell({
  demandes,
  showAll,
  onToggleShowAll,
  emptyState,
  showGrade = false
}) {
  if (demandes.length === 0) {
    return emptyState ? <>{emptyState}</> : <span className="text-gray-400">Aucun demandeur</span>
  }

  return (
    <div className="text-sm max-w-[300px]">
      <div className="text-gray-900">
        {showAll ? (
          <div className="space-y-1">
            {demandes.map((d, index) => (
              <div key={index}>
                <span className="break-words">
                  {showGrade && d.grade ? `${d.grade} ` : ''}
                  {d.prenom} {d.nom}
                </span>
                {d.numeroDS && (
                  <span className="text-xs text-gray-500 ml-2">({d.numeroDS})</span>
                )}
              </div>
            ))}
            {demandes.length > 2 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleShowAll()
                }}
                className="text-blue-600 hover:text-blue-800 text-xs underline mt-1"
              >
                Réduire
              </button>
            )}
          </div>
        ) : (
          <div>
            {demandes.slice(0, 2).map((d, index) => (
              <div key={index} className={index > 0 ? 'mt-1' : ''}>
                <span className="break-words">
                  {showGrade && d.grade ? `${d.grade} ` : ''}
                  {d.prenom} {d.nom}
                </span>
                {d.numeroDS && (
                  <span className="text-xs text-gray-500 ml-2">({d.numeroDS})</span>
                )}
              </div>
            ))}
            {demandes.length > 2 && (
              <div className="mt-1">
                <span className="text-gray-500 text-xs">+{demandes.length - 2} autre(s) </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleShowAll()
                  }}
                  className="text-blue-600 hover:text-blue-800 text-xs underline"
                >
                  Voir tous
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

export default DemandeursCell
