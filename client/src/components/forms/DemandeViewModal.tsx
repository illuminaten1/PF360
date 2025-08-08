import React from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, UserIcon, MapPinIcon, CalendarIcon, DocumentTextIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import { Demande } from '@/types'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'

dayjs.locale('fr')

interface DemandeViewModalProps {
  isOpen: boolean
  onClose: () => void
  demande: Demande | null
}

const DemandeViewModal: React.FC<DemandeViewModalProps> = ({
  isOpen,
  onClose,
  demande
}) => {
  if (!demande) return null

  const getTypeColor = (type: string) => {
    return type === 'VICTIME' ? 'bg-sky-100 text-sky-800 border-sky-200' : 'bg-orange-100 text-orange-800 border-orange-200'
  }

  const getTypeLabel = (type: string) => {
    return type === 'VICTIME' ? 'Victime' : 'Mis en cause'
  }

  const formatDate = (date: string | undefined) => {
    return date ? dayjs(date).format('DD/MM/YYYY') : '-'
  }

  const formatDateTime = (date: string | undefined) => {
    return date ? dayjs(date).format('DD/MM/YYYY à HH:mm') : '-'
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
                        <DocumentTextIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <Dialog.Title as="h3" className="text-xl font-semibold text-white">
                          Demande {demande.numeroDS}
                        </Dialog.Title>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getTypeColor(demande.type)}`}>
                            {getTypeLabel(demande.type)}
                          </span>
                          <span className="text-blue-100 text-sm">
                            Reçue le {formatDate(demande.dateReception)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-8">
                    {/* Informations personnelles */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                      <div className="flex items-center mb-4">
                        <div className="bg-blue-100 p-2 rounded-lg mr-3">
                          <UserIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">Informations personnelles</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="block text-sm font-medium text-gray-600 mb-1">Nom complet</span>
                          <p className="text-lg font-semibold text-gray-900">
                            {demande.prenom} {demande.nom}
                          </p>
                        </div>
                        
                        {demande.grade && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600 mb-1">Grade</span>
                            <p className="text-gray-900 font-medium">{demande.grade}</p>
                          </div>
                        )}
                        
                        {demande.nigend && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600 mb-1">NIGEND</span>
                            <p className="text-gray-900 font-mono">{demande.nigend}</p>
                          </div>
                        )}
                        
                        {demande.statutDemandeur && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600 mb-1">Statut</span>
                            <p className="text-gray-900">{demande.statutDemandeur}</p>
                          </div>
                        )}
                        
                        {demande.branche && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600 mb-1">Branche</span>
                            <p className="text-gray-900 font-medium">{demande.branche}</p>
                          </div>
                        )}
                        
                        {demande.formationAdministrative && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600 mb-1">Formation administrative</span>
                            <p className="text-gray-900">{demande.formationAdministrative}</p>
                          </div>
                        )}
                        
                        {demande.departement && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600 mb-1">Département d'affectation</span>
                            <p className="text-gray-900 font-mono font-medium">{demande.departement}</p>
                          </div>
                        )}
                        
                        {demande.unite && (
                          <div className="md:col-span-2">
                            <span className="block text-sm font-medium text-gray-600 mb-1">Unité</span>
                            <p className="text-gray-900">{demande.unite}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact */}
                    {(demande.adressePostaleLigne1 || demande.telephoneProfessionnel || demande.telephonePersonnel) && (
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact</h4>
                        
                        <div className="space-y-3">
                          {demande.adressePostaleLigne1 && (
                            <div>
                              <span className="block text-sm font-medium text-gray-600 mb-1">Adresse postale</span>
                              <p className="text-gray-900">{demande.adressePostaleLigne1}</p>
                              {demande.adressePostaleLigne2 && <p className="text-gray-900">{demande.adressePostaleLigne2}</p>}
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {demande.telephoneProfessionnel && (
                              <div>
                                <span className="block text-sm font-medium text-gray-600 mb-1">Téléphone professionnel</span>
                                <p className="text-gray-900 font-mono">{demande.telephoneProfessionnel}</p>
                              </div>
                            )}
                            
                            {demande.telephonePersonnel && (
                              <div>
                                <span className="block text-sm font-medium text-gray-600 mb-1">Téléphone personnel</span>
                                <p className="text-gray-900 font-mono">{demande.telephonePersonnel}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Informations sur les faits */}
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
                      <div className="flex items-center mb-4">
                        <div className="bg-yellow-100 p-2 rounded-lg mr-3">
                          <MapPinIcon className="h-5 w-5 text-yellow-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">Informations sur les faits</h4>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="block text-sm font-medium text-gray-600 mb-1">Date des faits</span>
                            <p className="text-gray-900">{formatDate(demande.dateFaits)}</p>
                          </div>
                          
                          {demande.position && (
                            <div>
                              <span className="block text-sm font-medium text-gray-600 mb-1">Position</span>
                              <p className="text-gray-900">
                                {demande.position === 'EN_SERVICE' ? 'En service' : 'Hors service'}
                              </p>
                            </div>
                          )}
                          
                          {demande.commune && (
                            <div>
                              <span className="block text-sm font-medium text-gray-600 mb-1">Commune</span>
                              <p className="text-gray-900">{demande.commune}</p>
                            </div>
                          )}
                          
                          {demande.codePostal && (
                            <div>
                              <span className="block text-sm font-medium text-gray-600 mb-1">Code postal</span>
                              <p className="text-gray-900 font-mono">{demande.codePostal}</p>
                            </div>
                          )}
                          
                          {demande.contexteMissionnel && (
                            <div className="md:col-span-2">
                              <span className="block text-sm font-medium text-gray-600 mb-1">Contexte missionnel</span>
                              <p className="text-gray-900">{demande.contexteMissionnel}</p>
                            </div>
                          )}
                          
                          {demande.qualificationInfraction && (
                            <div className="md:col-span-2">
                              <span className="block text-sm font-medium text-gray-600 mb-1">Qualification de l'infraction</span>
                              <p className="text-gray-900 font-medium">{demande.qualificationInfraction}</p>
                            </div>
                          )}
                        </div>
                        
                        {demande.resume && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600 mb-2">Résumé des faits</span>
                            <div className="bg-white p-4 rounded-lg border">
                              <p className="text-gray-900 whitespace-pre-wrap">{demande.resume}</p>
                            </div>
                          </div>
                        )}
                        
                        {demande.blessures && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600 mb-2">Blessures</span>
                            <div className="bg-white p-4 rounded-lg border">
                              <p className="text-gray-900 whitespace-pre-wrap">{demande.blessures}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Informations judiciaires */}
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
                      <div className="flex items-center mb-4">
                        <div className="bg-purple-100 p-2 rounded-lg mr-3">
                          <CalendarIcon className="h-5 w-5 text-purple-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">Informations judiciaires</h4>
                      </div>
                      
                      <div className="space-y-4">
                        {demande.qualificationsPenales && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600 mb-1">Qualifications pénales</span>
                            <p className="text-gray-900">{demande.qualificationsPenales}</p>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="block text-sm font-medium text-gray-600 mb-1">Date d'audience</span>
                            <p className="text-gray-900">{formatDate(demande.dateAudience)}</p>
                          </div>
                          
                          <div>
                            <span className="block text-sm font-medium text-gray-600 mb-1">Partie civile</span>
                            <p className="text-gray-900">
                              {demande.partieCivile ? (
                                <span className="text-green-600 font-medium">✓ Oui</span>
                              ) : (
                                <span className="text-gray-500">✗ Non</span>
                              )}
                            </p>
                          </div>
                        </div>
                        
                        {demande.partieCivile && demande.montantPartieCivile && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600 mb-1">Montant réclamé</span>
                            <p className="text-xl font-bold text-green-600">
                              {demande.montantPartieCivile.toLocaleString('fr-FR', {
                                style: 'currency',
                                currency: 'EUR'
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Soutiens demandés */}
                  {(demande.soutienPsychologique || demande.soutienSocial || demande.soutienMedical) && (
                    <div className="mt-8 bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-xl border border-green-200">
                      <div className="flex items-center mb-4">
                        <div className="bg-green-100 p-2 rounded-lg mr-3">
                          <ShieldCheckIcon className="h-5 w-5 text-green-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">Soutiens demandés</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`p-4 rounded-lg border-2 ${demande.soutienPsychologique ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full mr-3 ${demande.soutienPsychologique ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span className={`font-medium ${demande.soutienPsychologique ? 'text-green-800' : 'text-gray-600'}`}>
                              Soutien psychologique
                            </span>
                          </div>
                        </div>
                        
                        <div className={`p-4 rounded-lg border-2 ${demande.soutienSocial ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full mr-3 ${demande.soutienSocial ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span className={`font-medium ${demande.soutienSocial ? 'text-green-800' : 'text-gray-600'}`}>
                              Soutien social
                            </span>
                          </div>
                        </div>
                        
                        <div className={`p-4 rounded-lg border-2 ${demande.soutienMedical ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full mr-3 ${demande.soutienMedical ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                            <span className={`font-medium ${demande.soutienMedical ? 'text-green-800' : 'text-gray-600'}`}>
                              Soutien médical
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Informations administratives */}
                  <div className="mt-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Informations administratives</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <span className="block text-sm font-medium text-gray-600 mb-1">Dossier associé</span>
                        <p className="text-gray-900">
                          {demande.dossier ? (
                            <span className="font-medium text-blue-600">
                              {demande.dossier.numero}
                              {demande.dossier.sgami?.nom && (
                                <span className="text-gray-500 text-sm block">
                                  {demande.dossier.sgami.nom}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-500 italic">Non lié à un dossier</span>
                          )}
                        </p>
                      </div>
                      
                      <div>
                        <span className="block text-sm font-medium text-gray-600 mb-1">Assigné à</span>
                        <p className="text-gray-900">
                          {demande.assigneA ? (
                            <span>
                              {demande.assigneA.grade && `${demande.assigneA.grade} `}
                              {demande.assigneA.prenom} {demande.assigneA.nom}
                            </span>
                          ) : (
                            <span className="text-gray-500 italic">Non assigné</span>
                          )}
                        </p>
                      </div>
                      
                      <div>
                        <span className="block text-sm font-medium text-gray-600 mb-1">Créée le</span>
                        <p className="text-gray-900 text-sm">{formatDateTime(demande.createdAt)}</p>
                        <span className="block text-sm font-medium text-gray-600 mb-1 mt-2">Modifiée le</span>
                        <p className="text-gray-900 text-sm">{formatDateTime(demande.updatedAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex justify-end space-x-3 pt-6 mt-8 border-t border-gray-200">
                    <button
                      onClick={onClose}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Fermer
                    </button>
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

export default DemandeViewModal