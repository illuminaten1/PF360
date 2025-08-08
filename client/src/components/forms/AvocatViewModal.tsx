import React from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, UserIcon, MapPinIcon, PhoneIcon, BanknotesIcon, DocumentTextIcon, IdentificationIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import { Avocat } from '@/types'
import toast from 'react-hot-toast'

interface AvocatViewModalProps {
  isOpen: boolean
  onClose: () => void
  avocat: Avocat | null
  onEdit?: () => void
}

const AvocatViewModal: React.FC<AvocatViewModalProps> = ({
  isOpen,
  onClose,
  avocat,
  onEdit
}) => {
  if (!avocat) return null

  const copyCoordinates = async () => {
    try {
      let coordonnees = `Maître ${avocat.prenom} ${avocat.nom}`
      
      if (avocat.adressePostale) {
        coordonnees += `\n${avocat.adressePostale}`
      }
      
      if (avocat.telephonePublic1) {
        coordonnees += `\n${avocat.telephonePublic1}`
      }
      
      if (avocat.telephonePublic2) {
        coordonnees += `, ${avocat.telephonePublic2}`
      }
      
      if (avocat.email) {
        coordonnees += `\n${avocat.email}`
      }
      
      await navigator.clipboard.writeText(coordonnees)
      toast.success('Coordonnées copiées dans le presse-papier')
    } catch (err) {
      console.error('Erreur lors de la copie des coordonnées', err)
      toast.error('Impossible de copier les coordonnées')
    }
  }

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                        <UserIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <Dialog.Title as="h3" className="text-xl font-semibold text-white">
                          Maître {avocat.prenom} {avocat.nom}
                        </Dialog.Title>
                        <div className="flex items-center space-x-3 mt-1">
                          {avocat.specialisation && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-white bg-opacity-20 text-blue-100 border-blue-300">
                              {avocat.specialisation}
                            </span>
                          )}
                          {avocat.region && (
                            <span className="text-blue-100 text-sm">
                              {avocat.region}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={copyCoordinates}
                        className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                        title="Copier les coordonnées"
                      >
                        <ClipboardDocumentIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={onClose}
                        className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-8">
                    {/* Informations générales */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                      <div className="flex items-center mb-4">
                        <div className="bg-blue-100 p-2 rounded-lg mr-3">
                          <IdentificationIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">Informations générales</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="block text-sm font-medium text-gray-600 mb-1">Nom complet</span>
                          <p className="text-lg font-semibold text-gray-900">
                            Maître {avocat.prenom} {avocat.nom}
                          </p>
                        </div>
                        
                        {avocat.region && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600 mb-1">Région</span>
                            <p className="text-gray-900 font-medium">{avocat.region}</p>
                          </div>
                        )}
                        
                        {avocat.siretOuRidet && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600 mb-1">SIRET/RIDET</span>
                            <p className="text-gray-900 font-mono">{avocat.siretOuRidet}</p>
                          </div>
                        )}

                        {avocat.specialisation && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600 mb-1">Spécialisation</span>
                            <p className="text-gray-900">{avocat.specialisation}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Adresse */}
                    {avocat.adressePostale && (
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                        <div className="flex items-center mb-4">
                          <div className="bg-gray-100 p-2 rounded-lg mr-3">
                            <MapPinIcon className="h-5 w-5 text-gray-600" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">Adresse</h4>
                        </div>
                        <p className="text-gray-900 whitespace-pre-line">{avocat.adressePostale}</p>
                      </div>
                    )}

                    {/* Contacts */}
                    <div className="bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-xl border border-green-200">
                      <div className="flex items-center mb-4">
                        <div className="bg-green-100 p-2 rounded-lg mr-3">
                          <PhoneIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">Contacts</h4>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {avocat.telephonePublic1 && (
                            <div>
                              <span className="block text-sm font-medium text-gray-600 mb-1">Téléphone public 1</span>
                              <p className="text-gray-900 font-mono">{avocat.telephonePublic1}</p>
                            </div>
                          )}
                          
                          {avocat.telephonePublic2 && (
                            <div>
                              <span className="block text-sm font-medium text-gray-600 mb-1">Téléphone public 2</span>
                              <p className="text-gray-900 font-mono">{avocat.telephonePublic2}</p>
                            </div>
                          )}
                        </div>

                        {avocat.telephonePrive && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600 mb-1">
                              Téléphone privé <span className="text-red-500">(non communiqué aux bénéficiaires)</span>
                            </span>
                            <p className="text-gray-900 font-mono">{avocat.telephonePrive}</p>
                          </div>
                        )}
                        
                        {avocat.email && (
                          <div className="mt-4">
                            <span className="block text-sm font-medium text-gray-600 mb-1">Email</span>
                            <a 
                              href={`mailto:${avocat.email}`}
                              className="text-blue-600 hover:text-blue-800 font-mono break-all underline transition-colors"
                            >
                              {avocat.email}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Villes d'intervention */}
                    {avocat.villesIntervention && avocat.villesIntervention.length > 0 && (
                      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
                        <div className="flex items-center mb-4">
                          <div className="bg-yellow-100 p-2 rounded-lg mr-3">
                            <MapPinIcon className="h-5 w-5 text-yellow-600" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">Villes d'intervention</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {avocat.villesIntervention.map((ville, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-300"
                            >
                              {ville}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Informations bancaires */}
                    {(avocat.titulaireDuCompteBancaire || avocat.codeEtablissement || avocat.codeGuichet || avocat.numeroDeCompte || avocat.cle) && (
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
                        <div className="flex items-center mb-4">
                          <div className="bg-purple-100 p-2 rounded-lg mr-3">
                            <BanknotesIcon className="h-5 w-5 text-purple-600" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">Informations bancaires</h4>
                        </div>
                        
                        <div className="space-y-4">
                          {avocat.titulaireDuCompteBancaire && (
                            <div>
                              <span className="block text-sm font-medium text-gray-600 mb-1">Titulaire du compte bancaire</span>
                              <p className="text-gray-900 font-medium">{avocat.titulaireDuCompteBancaire}</p>
                            </div>
                          )}

                          {(avocat.codeEtablissement || avocat.codeGuichet || avocat.numeroDeCompte || avocat.cle) && (
                            <div>
                              <span className="block text-sm font-medium text-gray-600 mb-1">Coordonnées bancaires (RIB)</span>
                              <div className="bg-white p-4 rounded-lg border border-purple-200">
                                <p className="text-gray-900 font-mono text-lg">
                                  {avocat.codeEtablissement || '-----'} {avocat.codeGuichet || '-----'} {avocat.numeroDeCompte || '-----------'} {avocat.cle || '--'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {avocat.notes && (
                      <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200">
                        <div className="flex items-center mb-4">
                          <div className="bg-orange-100 p-2 rounded-lg mr-3">
                            <DocumentTextIcon className="h-5 w-5 text-orange-600" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">Notes</h4>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-orange-200">
                          <p className="text-gray-900 whitespace-pre-line">{avocat.notes}</p>
                        </div>
                      </div>
                    )}

                    {/* Informations administratives */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Informations administratives</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {avocat.createdAt && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600 mb-1">Créé le</span>
                            <p className="text-gray-900 text-sm">
                              {new Date(avocat.createdAt).toLocaleDateString('fr-FR')} à {new Date(avocat.createdAt).toLocaleTimeString('fr-FR')}
                              {avocat.creePar && (
                                <span className="block text-gray-600 text-xs mt-1">
                                  par {avocat.creePar.grade && `${avocat.creePar.grade} `}{avocat.creePar.prenom} {avocat.creePar.nom}
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                        
                        {avocat.updatedAt && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600 mb-1">Modifié le</span>
                            <p className="text-gray-900 text-sm">
                              {new Date(avocat.updatedAt).toLocaleDateString('fr-FR')} à {new Date(avocat.updatedAt).toLocaleTimeString('fr-FR')}
                              {avocat.modifiePar && (
                                <span className="block text-gray-600 text-xs mt-1">
                                  par {avocat.modifiePar.grade && `${avocat.modifiePar.grade} `}{avocat.modifiePar.prenom} {avocat.modifiePar.nom}
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex justify-end space-x-3 pt-6 mt-8 border-t border-gray-200">
                      {onEdit && (
                        <button
                          onClick={onEdit}
                          className="px-6 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                        >
                          Modifier
                        </button>
                      )}
                      <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default AvocatViewModal