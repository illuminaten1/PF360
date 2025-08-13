import React from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, ScaleIcon, UserIcon, CalendarIcon, DocumentTextIcon, ClockIcon, CheckCircleIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'

dayjs.locale('fr')

interface Decision {
  id: string
  type: string
  date?: string
  dateSignature?: string
  dateEnvoi?: string
  createdAt: string
  updatedAt: string
  creePar?: {
    id: string
    prenom: string
    nom: string
    grade?: string
  }
  modifiePar?: {
    id: string
    prenom: string
    nom: string
    grade?: string
  }
  demandes?: Array<{
    demande: {
      id: string
      prenom: string
      nom: string
      numeroDS: string
      grade?: string
    }
  }>
}

interface DecisionViewModalProps {
  isOpen: boolean
  onClose: () => void
  decision: Decision | null
}

const DecisionViewModal: React.FC<DecisionViewModalProps> = ({
  isOpen,
  onClose,
  decision
}) => {
  if (!decision) return null

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'AJ': return 'Aide Juridique'
      case 'AJE': return 'Aide Juridique Évolutive'
      case 'PJ': return 'Protection Juridictionnelle'
      case 'REJET': return 'Rejet'
      case 'OCTROI': return 'Aide Juridique'
      case 'OCTROI_PARTIEL': return 'Aide Juridique Partielle'
      default: return type
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'AJ':
      case 'OCTROI':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'AJE':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'PJ':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'REJET':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'OCTROI_PARTIEL':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (date: string | undefined) => {
    return date ? dayjs(date).format('DD/MM/YYYY') : '-'
  }

  const formatDateTime = (date: string | undefined) => {
    return date ? dayjs(date).format('DD/MM/YYYY à HH:mm') : '-'
  }

  const getStatusInfo = () => {
    if (decision.dateEnvoi) {
      return {
        status: 'Envoyée',
        icon: PaperAirplaneIcon,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      }
    } else if (decision.dateSignature) {
      return {
        status: 'Signée',
        icon: CheckCircleIcon,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      }
    } else {
      return {
        status: 'En cours',
        icon: ClockIcon,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      }
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                        <ScaleIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <Dialog.Title as="h3" className="text-xl font-semibold text-white">
                          {getTypeLabel(decision.type)}
                        </Dialog.Title>
                        <div className="flex items-center space-x-3 mt-1 flex-wrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-white ${getTypeBadgeColor(decision.type)}`}>
                            {decision.type}
                          </span>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-white ${statusInfo.color} ${statusInfo.borderColor}`}>
                            <StatusIcon className="h-4 w-4 mr-2" />
                            {statusInfo.status}
                          </div>
                          <span className="text-purple-100 text-sm">
                            Créée le {formatDate(decision.createdAt)}
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
                  <div className="space-y-6">
                    {/* Informations générales */}
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-100">
                      <div className="flex items-center mb-4">
                        <div className="bg-purple-100 p-2 rounded-lg mr-3">
                          <ScaleIcon className="h-5 w-5 text-purple-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">Informations générales</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="block text-sm font-medium text-gray-600 mb-1">Type de décision</span>
                          <p className="text-lg font-semibold text-gray-900">
                            {getTypeLabel(decision.type)}
                          </p>
                        </div>
                        
                        <div>
                          <span className="block text-sm font-medium text-gray-600 mb-1">Code</span>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTypeBadgeColor(decision.type)}`}>
                            {decision.type}
                          </span>
                        </div>

                        <div>
                          <span className="block text-sm font-medium text-gray-600 mb-1">Date de création</span>
                          <p className="text-gray-900">{formatDate(decision.createdAt)}</p>
                        </div>

                        {decision.date && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600 mb-1">Date</span>
                            <p className="text-gray-900">{formatDate(decision.date)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Statut et dates */}
                    <div className={`p-6 rounded-xl border ${statusInfo.bgColor} ${statusInfo.borderColor}`}>
                      <div className="flex items-center mb-4">
                        <div className={`p-2 rounded-lg mr-3 ${statusInfo.bgColor}`}>
                          <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">Statut et traçabilité</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <span className="block text-sm font-medium text-gray-600 mb-1">Statut actuel</span>
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} ${statusInfo.bgColor} ${statusInfo.borderColor} border`}>
                            <StatusIcon className="h-4 w-4 mr-2" />
                            {statusInfo.status}
                          </div>
                        </div>

                        {decision.dateSignature && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600 mb-1">Date de signature</span>
                            <p className="text-gray-900 font-medium">{formatDate(decision.dateSignature)}</p>
                          </div>
                        )}

                        {decision.dateEnvoi && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600 mb-1">Date d'envoi</span>
                            <p className="text-gray-900 font-medium">{formatDate(decision.dateEnvoi)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Demandes concernées */}
                    {decision.demandes && decision.demandes.length > 0 && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                        <div className="flex items-center mb-4">
                          <div className="bg-blue-100 p-2 rounded-lg mr-3">
                            <UserIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            Demandes concernées ({decision.demandes.length})
                          </h4>
                        </div>
                        
                        <div className="space-y-3">
                          {decision.demandes.map((demandeRel, index) => (
                            <div key={index} className="bg-white p-4 rounded-lg border border-blue-200">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-semibold text-gray-900">
                                    {demandeRel.demande.grade && `${demandeRel.demande.grade} `}
                                    {demandeRel.demande.prenom} {demandeRel.demande.nom}
                                  </h5>
                                  <p className="text-sm text-gray-600">
                                    N° DS: {demandeRel.demande.numeroDS}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Informations administratives */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                      <div className="flex items-center mb-4">
                        <div className="bg-gray-100 p-2 rounded-lg mr-3">
                          <CalendarIcon className="h-5 w-5 text-gray-600" />
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">Informations administratives</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <span className="block text-sm font-medium text-gray-600 mb-1">Créée le</span>
                          <p className="text-gray-900 text-sm">
                            {formatDateTime(decision.createdAt)}
                            {decision.creePar && (
                              <span className="block text-gray-600 text-xs mt-1">
                                par {decision.creePar.grade && `${decision.creePar.grade} `}
                                {decision.creePar.prenom} {decision.creePar.nom}
                              </span>
                            )}
                          </p>
                        </div>

                        {decision.updatedAt !== decision.createdAt && (
                          <div>
                            <span className="block text-sm font-medium text-gray-600 mb-1">Modifiée le</span>
                            <p className="text-gray-900 text-sm">
                              {formatDateTime(decision.updatedAt)}
                              {decision.modifiePar && (
                                <span className="block text-gray-600 text-xs mt-1">
                                  par {decision.modifiePar.grade && `${decision.modifiePar.grade} `}
                                  {decision.modifiePar.prenom} {decision.modifiePar.nom}
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="flex justify-between space-x-3 pt-6 mt-8 border-t border-gray-200">
                    <div className="flex space-x-3">
                      <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        Modifier
                      </button>
                      <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                        Générer document
                      </button>
                    </div>
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

export default DecisionViewModal