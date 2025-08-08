import React from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, PencilIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import { PhoneIcon, EnvelopeIcon, MapPinIcon, IdentificationIcon } from '@heroicons/react/24/solid'
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
  if (!isOpen || !avocat) return null

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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                  <div className="flex items-center space-x-3">
                    <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900">
                      Maître {avocat.prenom} {avocat.nom}
                    </Dialog.Title>
                    {avocat.specialisation && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {avocat.specialisation}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={copyCoordinates}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                      title="Copier les coordonnées"
                    >
                      <ClipboardDocumentIcon className="h-5 w-5" />
                    </button>
                    {onEdit && (
                      <button
                        onClick={onEdit}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full"
                        title="Modifier"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-6">
                  {/* Informations générales */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Informations générales</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Région */}
                      {avocat.region && (
                        <div className="flex items-start space-x-3">
                          <MapPinIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-gray-500">Région</div>
                            <div className="text-base text-gray-900">{avocat.region}</div>
                          </div>
                        </div>
                      )}

                      {/* SIRET/RIDET */}
                      {avocat.siretOuRidet && (
                        <div className="flex items-start space-x-3">
                          <IdentificationIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-gray-500">SIRET/RIDET</div>
                            <div className="text-base text-gray-900">{avocat.siretOuRidet}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Adresse */}
                  {avocat.adressePostale && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Adresse</h4>
                      <div className="flex items-start space-x-3">
                        <MapPinIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <div className="text-base text-gray-900 whitespace-pre-line">{avocat.adressePostale}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contacts */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Contacts</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {avocat.telephonePublic1 && (
                        <div className="flex items-center space-x-3">
                          <PhoneIcon className="h-5 w-5 text-green-600" />
                          <div>
                            <div className="text-sm font-medium text-gray-500">Téléphone public 1</div>
                            <a href={`tel:${avocat.telephonePublic1}`} className="text-base text-blue-600 hover:text-blue-800 hover:underline">
                              {avocat.telephonePublic1}
                            </a>
                          </div>
                        </div>
                      )}

                      {avocat.telephonePublic2 && (
                        <div className="flex items-center space-x-3">
                          <PhoneIcon className="h-5 w-5 text-green-600" />
                          <div>
                            <div className="text-sm font-medium text-gray-500">Téléphone public 2</div>
                            <a href={`tel:${avocat.telephonePublic2}`} className="text-base text-blue-600 hover:text-blue-800 hover:underline">
                              {avocat.telephonePublic2}
                            </a>
                          </div>
                        </div>
                      )}

                      {avocat.telephonePrive && (
                        <div className="flex items-center space-x-3 md:col-span-2">
                          <PhoneIcon className="h-5 w-5 text-red-600" />
                          <div>
                            <div className="text-sm font-medium text-gray-500">
                              Téléphone privé <span className="text-red-500">(non communiqué aux bénéficiaires)</span>
                            </div>
                            <a href={`tel:${avocat.telephonePrive}`} className="text-base text-blue-600 hover:text-blue-800 hover:underline">
                              {avocat.telephonePrive}
                            </a>
                          </div>
                        </div>
                      )}

                      {avocat.email && (
                        <div className="flex items-center space-x-3 md:col-span-2">
                          <EnvelopeIcon className="h-5 w-5 text-purple-600" />
                          <div>
                            <div className="text-sm font-medium text-gray-500">Email</div>
                            <a href={`mailto:${avocat.email}`} className="text-base text-blue-600 hover:text-blue-800 hover:underline">
                              {avocat.email}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Villes d'intervention */}
                  {avocat.villesIntervention && avocat.villesIntervention.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Villes d'intervention</h4>
                      <div className="flex flex-wrap gap-2">
                        {avocat.villesIntervention.map((ville, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                          >
                            {ville}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Informations bancaires */}
                  {(avocat.titulaireDuCompteBancaire || avocat.codeEtablissement || avocat.codeGuichet || avocat.numeroDeCompte || avocat.cle) && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Informations bancaires</h4>
                      
                      {avocat.titulaireDuCompteBancaire && (
                        <div className="mb-4">
                          <div className="text-sm font-medium text-gray-500">Titulaire du compte bancaire</div>
                          <div className="text-base text-gray-900">{avocat.titulaireDuCompteBancaire}</div>
                        </div>
                      )}

                      {(avocat.codeEtablissement || avocat.codeGuichet || avocat.numeroDeCompte || avocat.cle) && (
                        <div>
                          <div className="text-sm font-medium text-gray-500 mb-1">Coordonnées bancaires (RIB)</div>
                          <div className="text-base text-gray-900 font-mono bg-white px-3 py-2 rounded border">
                            {avocat.codeEtablissement || '-----'} {avocat.codeGuichet || '-----'} {avocat.numeroDeCompte || '-----------'} {avocat.cle || '--'}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {avocat.notes && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Notes</h4>
                      <div className="bg-white border border-gray-200 rounded-md p-4">
                        <div className="text-base text-gray-900 whitespace-pre-line">{avocat.notes}</div>
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  {(avocat.createdAt || avocat.updatedAt) && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-md font-medium text-gray-900 mb-4">Informations système</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        {avocat.createdAt && (
                          <div>
                            <span className="font-medium">Créé le :</span> {new Date(avocat.createdAt).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                        {avocat.updatedAt && (
                          <div>
                            <span className="font-medium">Modifié le :</span> {new Date(avocat.updatedAt).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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