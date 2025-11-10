import React from 'react'
import dayjs from 'dayjs'
import { ScaleIcon, PlusIcon } from '@heroicons/react/24/outline'
import { getDecisionTypeLabel } from '@/utils/dossierUtils'

interface DecisionsSectionProps {
  decisions: any[]
  hasDecisions: boolean
  onGenerateDecision: () => void
  onEditDecision: (decision: any) => void
  onContextMenu: (e: React.MouseEvent, decision: any) => void
}

const DecisionsSection: React.FC<DecisionsSectionProps> = ({
  decisions,
  hasDecisions,
  onGenerateDecision,
  onEditDecision,
  onContextMenu,
}) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <ScaleIcon className="h-5 w-5 mr-2" />
              Décisions ({decisions.length})
            </h2>
            <p className="text-xs text-gray-500 mt-1">Clic droit pour effectuer des actions</p>
          </div>
          <button
            onClick={onGenerateDecision}
            disabled={!hasDecisions}
            className="btn-primary-outline flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            title={!hasDecisions ? "Aucune demande disponible" : "Générer une nouvelle décision"}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Générer décision
          </button>
        </div>
      </div>
      <div className="p-6">
        {decisions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Aucune décision prise pour ce dossier</p>
        ) : (
          <div className="space-y-4">
            {decisions.map((decision) => (
              <div
                key={decision.id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onContextMenu={(e) => onContextMenu(e, decision)}
              >
                <div className="flex flex-col gap-2">
                  {/* Ligne 1: Type et bouton */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-baseline gap-2 flex-1">
                      <span className="font-medium text-gray-900">
                        {getDecisionTypeLabel(decision.type)}
                      </span>
                    </div>
                    <button
                      onClick={() => onEditDecision(decision)}
                      className="text-blue-600 hover:text-blue-800 text-sm flex-shrink-0"
                    >
                      Modifier
                    </button>
                  </div>

                  {/* Ligne 2: Demandeurs */}
                  {decision.demandes && decision.demandes.length > 0 && (
                    <div className="text-sm text-gray-900">
                      <span className="font-medium">Demandeurs :</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {decision.demandes.slice(0, 2).map((d: any, index: number) => (
                          <span key={`demande-${decision.id}-${index}`} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {d.demande.prenom} {d.demande.nom}
                          </span>
                        ))}
                        {decision.demandes.length > 2 && (
                          <span key={`more-demandes-${decision.id}`} className="text-xs text-gray-500">
                            +{decision.demandes.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ligne 3: Informations administratives */}
                  <div className="text-sm text-gray-900 space-y-1">
                    {(decision as any).dateSignature && (
                      <div>
                        <span className="font-medium">Signée le :</span>
                        <span className="ml-1">{dayjs((decision as any).dateSignature).format('DD/MM/YYYY')}</span>
                      </div>
                    )}
                    {(decision as any).dateEnvoi && (
                      <div>
                        <span className="font-medium">Envoyée le :</span>
                        <span className="ml-1">{dayjs((decision as any).dateEnvoi).format('DD/MM/YYYY')}</span>
                      </div>
                    )}
                    {!(decision as any).dateSignature && !(decision as any).dateEnvoi && (decision as any).date && (
                      <div>
                        <span className="font-medium">Date :</span>
                        <span className="ml-1">{dayjs((decision as any).date).format('DD/MM/YYYY')}</span>
                      </div>
                    )}

                    {/* Métadonnées */}
                    {decision.creePar && (
                      <div className="text-xs text-gray-500">
                        Créée par: {decision.creePar.prenom} {decision.creePar.nom}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DecisionsSection
