import React from 'react'
import dayjs from 'dayjs'
import { DocumentTextIcon, PlusIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline'
import { getVictimeMecBadge, getVictimeMecLabel } from '@/utils/dossierUtils'

interface ConventionsSectionProps {
  conventions: any[]
  hasDecisions: boolean
  onCreateConvention: () => void
  onEditConvention: (convention: any) => void
  onContextMenu: (e: React.MouseEvent, convention: any) => void
}

const ConventionsSection: React.FC<ConventionsSectionProps> = ({
  conventions,
  hasDecisions,
  onCreateConvention,
  onEditConvention,
  onContextMenu,
}) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Conventions d&apos;honoraires ({conventions.length})
            </h2>
            <p className="text-xs text-gray-500 mt-1">Clic droit pour effectuer des actions</p>
          </div>
          <button
            onClick={onCreateConvention}
            disabled={!hasDecisions}
            className="btn-primary-outline flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            title={!hasDecisions ? "Aucune décision disponible" : "Créer une nouvelle convention"}
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Nouvelle convention
          </button>
        </div>
      </div>
      <div className="p-6">
        {conventions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Aucune convention d&apos;honoraires</p>
        ) : (
          <div className="space-y-4">
            {conventions.map((convention) => (
              <div
                key={convention.id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onContextMenu={(e) => onContextMenu(e, convention)}
              >
                <div className="flex flex-col gap-2">
                  {/* Ligne 1: Numéro, type et bouton */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-baseline gap-2 flex-1">
                      <span className="font-medium text-gray-900">
                        {convention.type === 'AVENANT' ? 'Avenant' : 'Convention'} n°{convention.numero}
                      </span>
                      <span className="text-sm text-gray-600">•</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVictimeMecBadge(convention.victimeOuMisEnCause)}`}>
                        {getVictimeMecLabel(convention.victimeOuMisEnCause)}
                      </span>
                    </div>
                    <button
                      onClick={() => onEditConvention(convention)}
                      className="text-blue-600 hover:text-blue-800 text-sm flex-shrink-0"
                    >
                      Modifier
                    </button>
                  </div>

                  {/* Ligne 2: Avocat */}
                  <div className="text-sm text-gray-900">
                    <span className="font-medium">Avocat :</span>
                    <span className="ml-1">
                      {convention.avocat.prenom} {convention.avocat.nom}
                    </span>
                  </div>

                  {/* Ligne 3: Montant */}
                  <div className="text-sm text-gray-900">
                    <span className="font-medium">Montant HT :</span>
                    <span className="ml-1">
                      {convention.montantHT.toLocaleString('fr-FR')} €
                    </span>
                    {convention.montantHTGagePrecedemment && (
                      <span className="ml-2 text-gray-600">
                        (Gagé préc.: {convention.montantHTGagePrecedemment.toLocaleString('fr-FR')} €)
                      </span>
                    )}
                  </div>

                  {/* Ligne 4: Instance */}
                  {convention.instance && (
                    <div className="text-sm text-gray-900">
                      <span className="font-medium">Instance :</span>
                      <span className="ml-1">{convention.instance}</span>
                    </div>
                  )}

                  {/* Ligne 5: Informations administratives */}
                  <div className="text-sm text-gray-900 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>Créée le: {dayjs(convention.dateCreation).format('DD/MM/YYYY')}</span>
                      {convention.dateRetourSigne ? (
                        <span className="flex items-center text-green-600">
                          • <CheckCircleIcon className="h-4 w-4 mx-1" />
                          Signée le {dayjs(convention.dateRetourSigne).format('DD/MM/YYYY')}
                        </span>
                      ) : (
                        <span className="flex items-center text-orange-600">
                          • <ClockIcon className="h-4 w-4 mx-1" />
                          En attente de signature
                        </span>
                      )}
                    </div>

                    {/* Demandeurs */}
                    {convention.demandes && convention.demandes.length > 0 && (
                      <div className="mt-1">
                        <span className="text-xs text-gray-500">Demandeurs: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {convention.demandes.slice(0, 3).map((d: any, index: number) => (
                            <span key={`demande-${convention.id}-${index}`} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {d.demande.prenom} {d.demande.nom}
                            </span>
                          ))}
                          {convention.demandes.length > 3 && (
                            <span key={`more-demandes-${convention.id}`} className="text-xs text-gray-500">
                              +{convention.demandes.length - 3} autre(s)
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Diligences */}
                    {convention.diligences && convention.diligences.length > 0 && (
                      <div className="mt-1">
                        <span className="text-xs text-gray-500">Diligences: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {convention.diligences.slice(0, 2).map((d: any, index: number) => (
                            <span key={`diligence-${convention.id}-${index}`} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {d.diligence.nom}
                            </span>
                          ))}
                          {convention.diligences.length > 2 && (
                            <span key={`more-diligences-${convention.id}`} className="text-xs text-gray-500">
                              +{convention.diligences.length - 2} autre(s)
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Métadonnées */}
                    {convention.creePar && (
                      <div className="text-xs text-gray-500">
                        Créée par: {(convention.creePar as any).grade && `${(convention.creePar as any).grade} `}
                        {convention.creePar.prenom} {convention.creePar.nom}
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

export default ConventionsSection
