import React from 'react'
import { CurrencyEuroIcon, PlusIcon } from '@heroicons/react/24/outline'

interface PaiementsSectionProps {
  paiements: any[]
  isDeletingPaiement: boolean
  onCreatePaiement: () => void
  onEditPaiement: (paiement: any) => void
  onDeletePaiement: (paiement: any) => void
  onContextMenu: (e: React.MouseEvent, paiement: any) => void
}

const PaiementsSection: React.FC<PaiementsSectionProps> = ({
  paiements,
  isDeletingPaiement,
  onCreatePaiement,
  onEditPaiement,
  onDeletePaiement,
  onContextMenu,
}) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <CurrencyEuroIcon className="h-5 w-5 mr-2" />
              Paiements ({paiements.length})
            </h2>
            <p className="text-xs text-gray-500 mt-1">Clic droit pour effectuer des actions</p>
          </div>
          <button
            onClick={onCreatePaiement}
            className="btn-primary-outline flex items-center justify-center text-sm w-full sm:w-auto"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Nouveau paiement
          </button>
        </div>
      </div>
      <div className="p-6">
        {paiements.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Aucun paiement enregistré</p>
        ) : (
          <div className="space-y-4">
            {paiements.map((paiement) => (
              <div
                key={paiement.id}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onContextMenu={(e) => onContextMenu(e, paiement)}
              >
                <div className="flex flex-col gap-2">
                  {/* Ligne 1: Numéro, montant et boutons */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-baseline gap-2 flex-1">
                      <span className="font-medium text-gray-900">
                        FRI {(paiement as any).numero}
                      </span>
                      <span className="text-sm text-gray-600">•</span>
                      <span className="font-medium text-gray-900">
                        {paiement.montantTTC.toLocaleString('fr-FR')} € TTC
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => onEditPaiement(paiement)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => onDeletePaiement(paiement)}
                        disabled={isDeletingPaiement}
                        className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  {/* Ligne 2: Bénéficiaire */}
                  <div className="text-sm text-gray-900">
                    <span className="font-medium">Bénéficiaire :</span>
                    <span className="ml-1">
                      {(paiement as any).identiteBeneficiaire || 'Bénéficiaire non renseigné'}
                    </span>
                    {(paiement as any).qualiteBeneficiaire && (
                      <span className="ml-2 text-gray-600">
                        ({(paiement as any).qualiteBeneficiaire})
                      </span>
                    )}
                  </div>

                  {/* Ligne 3: PCE */}
                  {(paiement as any).pce && (
                    <div className="text-sm text-gray-900">
                      <span className="font-medium">PCE :</span>
                      <span className="ml-1">
                        {(paiement as any).pce.pceDetaille} - {(paiement as any).pce.pceNumerique}
                      </span>
                    </div>
                  )}

                  {/* Ligne 4: Informations administratives */}
                  <div className="text-sm text-gray-900 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {(paiement as any).sgami && (
                        <span><span className="font-medium">Org. payeur :</span> {(paiement as any).sgami.nom}</span>
                      )}
                      {paiement.facture && (
                        <span>• <span className="font-medium">Facture :</span> {paiement.facture}</span>
                      )}
                    </div>

                    {/* Métadonnées */}
                    {paiement.creePar && (
                      <div className="text-xs text-gray-500">
                        Créé par: {(paiement.creePar as any).grade && `${(paiement.creePar as any).grade} `}
                        {paiement.creePar.prenom} {paiement.creePar.nom}
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

export default PaiementsSection
