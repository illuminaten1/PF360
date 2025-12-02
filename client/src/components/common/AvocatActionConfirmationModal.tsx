import React from 'react'
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

interface AvocatActionConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  avocatName: string
  avocatPrenom: string
  action: 'deactivate' | 'reactivate'
  isLoading?: boolean
}

const AvocatActionConfirmationModal: React.FC<AvocatActionConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  avocatName,
  avocatPrenom,
  action,
  isLoading = false
}) => {
  const fullName = `${avocatPrenom} ${avocatName}`
  const isDeactivating = action === 'deactivate'

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
            <button
              type="button"
              className={`rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                isDeactivating ? 'focus:ring-orange-500' : 'focus:ring-green-500'
              }`}
              onClick={handleClose}
              disabled={isLoading}
            >
              <span className="sr-only">Fermer</span>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
              isDeactivating ? 'bg-orange-100' : 'bg-green-100'
            }`}>
              {isDeactivating ? (
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
              ) : (
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              )}
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                {isDeactivating ? 'Désactiver un avocat' : 'Réactiver un avocat'}
              </h3>
              <div className="mt-2">
                {isDeactivating ? (
                  <>
                    <p className="text-sm text-gray-700 font-medium mb-3">
                      Vous êtes sur le point de désactiver l'avocat <span className="font-bold text-orange-600">{fullName}</span>.
                    </p>
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <ExclamationTriangleIcon className="h-5 w-5 text-amber-400" />
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-amber-800 mb-1">Implications importantes :</h4>
                          <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                            <li>L'avocat n'apparaîtra plus dans les listes actives par défaut</li>
                            <li>Il ne sera plus proposé pour les nouvelles conventions</li>
                            <li>Les conventions existantes restent intactes et consultables</li>
                            <li>Son historique complet est conservé dans le système</li>
                            <li>La désactivation peut être annulée à tout moment</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Cette action est <span className="font-semibold">réversible</span>. Pour réactiver cet avocat ultérieurement, cochez <span className="font-medium">"Voir les avocats inactifs"</span> en haut à droite de la page, puis cliquez sur le bouton de réactivation.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-700 font-medium mb-3">
                      Vous êtes sur le point de réactiver l'avocat <span className="font-bold text-green-600">{fullName}</span>.
                    </p>
                    <div className="bg-green-50 border-l-4 border-green-400 p-3 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <CheckCircleIcon className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-green-800 mb-1">Après réactivation :</h4>
                          <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                            <li>L'avocat réapparaîtra dans les listes actives</li>
                            <li>Il sera à nouveau proposé pour les nouvelles conventions</li>
                            <li>Son profil complet sera accessible normalement</li>
                            <li>Toutes ses données et son historique sont préservés</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      La réactivation prend effet immédiatement.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto min-w-[140px] focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : isDeactivating
                  ? 'bg-orange-600 hover:bg-orange-500 focus:ring-orange-500'
                  : 'bg-green-600 hover:bg-green-500 focus:ring-green-500'
              }`}
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isDeactivating ? 'Désactivation...' : 'Réactivation...'}
                </div>
              ) : (
                isDeactivating ? 'Désactiver l\'avocat' : 'Réactiver l\'avocat'
              )}
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleClose}
              disabled={isLoading}
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AvocatActionConfirmationModal
