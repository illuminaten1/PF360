import React from 'react'

interface ExpandableBadgesCellProps {
  items: string[]
  showAll: boolean
  onToggleShowAll: () => void
  emptyState?: React.ReactNode
  badgeClassName?: string
  maxVisibleItems?: number
}

/**
 * Composant réutilisable pour afficher une liste de badges avec expansion/réduction.
 * Utilisé pour afficher des listes comme les villes d'intervention.
 *
 * @param items - Liste des éléments à afficher sous forme de badges
 * @param showAll - État d'expansion (true = tous affichés, false = limité)
 * @param onToggleShowAll - Callback pour basculer l'état d'expansion
 * @param emptyState - Élément React à afficher quand il n'y a pas d'items (optionnel)
 * @param badgeClassName - Classes CSS pour styliser les badges (optionnel)
 * @param maxVisibleItems - Nombre d'items visibles avant expansion (par défaut: 2)
 */
const ExpandableBadgesCell: React.FC<ExpandableBadgesCellProps> = React.memo(function ExpandableBadgesCell({
  items,
  showAll,
  onToggleShowAll,
  emptyState,
  badgeClassName = 'bg-green-100 text-green-800',
  maxVisibleItems = 2
}) {
  if (items.length === 0) {
    return emptyState ? <>{emptyState}</> : <span className="text-gray-400">-</span>
  }

  const visibleItems = showAll ? items : items.slice(0, maxVisibleItems)
  const hasMore = items.length > maxVisibleItems

  return (
    <div className="text-sm">
      <div className="flex flex-wrap gap-1">
        {visibleItems.map((item, index) => (
          <span
            key={index}
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badgeClassName}`}
          >
            {item}
          </span>
        ))}
        {!showAll && hasMore && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleShowAll()
            }}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
            title={`Voir ${items.length - maxVisibleItems} autre(s)`}
          >
            +{items.length - maxVisibleItems}
          </button>
        )}
      </div>
      {showAll && hasMore && (
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
  )
})

export default ExpandableBadgesCell
