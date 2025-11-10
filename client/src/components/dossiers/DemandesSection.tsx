import React from 'react'
import dayjs from 'dayjs'
import { FolderIcon, LinkIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { getTypeColor, getTypeLabel, getAudienceUrgency } from '@/utils/dossierUtils'

interface DemandesSectionProps {
  demandes: any[]
  isUnlinking: boolean
  onLierDemandes: () => void
  onViewDemande: (demande: any) => void
  onUnlinkDemande: (demande: any) => void
}

const DemandesSection: React.FC<DemandesSectionProps> = ({
  demandes,
  isUnlinking,
  onLierDemandes,
  onViewDemande,
  onUnlinkDemande,
}) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FolderIcon className="h-5 w-5 mr-2" />
              Demandes ({demandes.length})
            </h2>
            <p className="text-xs text-gray-500 mt-1">Clic droit pour effectuer des actions</p>
          </div>
          <button
            onClick={onLierDemandes}
            className="btn-primary-outline flex items-center justify-center text-sm w-full sm:w-auto"
          >
            <LinkIcon className="h-4 w-4 mr-1" />
            Lier des demandes
          </button>
        </div>
      </div>
      <div className="p-6">
        {demandes.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Aucune demande dans ce dossier</p>
        ) : (
          <div className="space-y-3">
            {demandes.map((demande) => {
              const dateAudience = (demande as any).dateAudience
              const urgency = getAudienceUrgency(dateAudience)
              const IconComponent = urgency.icon
              const today = dayjs().startOf('day')
              const audienceDate = dateAudience ? dayjs(dateAudience).startOf('day') : null
              const daysDiff = audienceDate ? audienceDate.diff(today, 'day') : null

              return (
                <div key={demande.id} className="border rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex flex-col gap-2">
                    {/* Ligne 1: Nom et badges */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm">
                          {demande.grade?.gradeAbrege && `${demande.grade.gradeAbrege} `}
                          {demande.prenom} {demande.nom}
                        </h3>

                        {/* Badges et BAP */}
                        {(((demande as any).badges && (demande as any).badges.length > 0) || ((demande as any).baps && (demande as any).baps.length > 0)) && (
                          <>
                            {/* Badges */}
                            {(demande as any).badges && (demande as any).badges.slice(0, 2).map((badgeRel: any) => (
                              <span
                                key={badgeRel.badge.id}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                                style={badgeRel.badge.couleur ? {
                                  backgroundColor: `${badgeRel.badge.couleur}20`,
                                  color: badgeRel.badge.couleur
                                } : {}}
                              >
                                {badgeRel.badge.nom}
                              </span>
                            ))}

                            {/* BAP */}
                            {(demande as any).baps && (demande as any).baps.length > 0 && (
                              <span
                                key={`bap-${demande.id}`}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                title={`BAP: ${(demande as any).baps[0].bap.nomBAP}`}
                              >
                                {(demande as any).baps[0].bap.nomBAP}
                              </span>
                            )}

                            {(demande as any).badges && (demande as any).badges.length > 2 && (
                              <span key={`more-badges-${demande.id}`} className="text-xs text-gray-500">
                                +{(demande as any).badges.length - 2}
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Boutons d'action */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => onViewDemande(demande)}
                          className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-50"
                        >
                          Voir
                        </button>
                        <button
                          onClick={() => onUnlinkDemande(demande)}
                          disabled={isUnlinking}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          title="Délier du dossier"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Ligne 2: Type, dates */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(demande.type)}`}>
                        {getTypeLabel(demande.type)}
                      </span>
                      <span className="text-xs text-gray-500">
                        Reçu le {dayjs(demande.dateReception).format('DD/MM/YYYY')}
                      </span>
                      {demande.dateFaits && (
                        <span className="text-xs text-gray-500">
                          • Faits du {dayjs(demande.dateFaits).format('DD/MM/YYYY')}
                        </span>
                      )}
                    </div>

                    {/* Ligne 3: Badge audience si présent */}
                    {dateAudience && (
                      <div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${urgency.style}`}>
                          {IconComponent && (
                            <IconComponent className="h-3 w-3 mr-1" />
                          )}
                          Audience {dayjs(dateAudience).format('DD/MM/YYYY')}
                          {daysDiff !== null && daysDiff >= 0 && (
                            <span className="ml-1">
                              - {daysDiff} j.
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default DemandesSection
