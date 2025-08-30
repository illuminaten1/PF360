import React, { useState, useEffect } from 'react'
import { Dialog, Transition, Listbox } from '@headlessui/react'
import { XMarkIcon, ChevronUpDownIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { User } from '@/types'

interface TransferModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (sourceUserId: string, targetUserId: string) => void
  isSubmitting: boolean
  users: User[]
}

const TransferModal: React.FC<TransferModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isSubmitting, 
  users 
}) => {
  const [sourceUser, setSourceUser] = useState<User | null>(null)
  const [targetUser, setTargetUser] = useState<User | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Filtrer pour ne garder que les utilisateurs actifs
  const utilisateursActifs = users.filter(user => user.active)

  useEffect(() => {
    if (!isOpen) {
      setSourceUser(null)
      setTargetUser(null)
      setErrors({})
    }
  }, [isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!sourceUser) {
      newErrors.sourceUser = 'Sélectionnez l&apos;utilisateur source'
    }

    if (!targetUser) {
      newErrors.targetUser = 'Sélectionnez l&apos;utilisateur destination'
    }

    if (sourceUser && targetUser && sourceUser.id === targetUser.id) {
      newErrors.targetUser = 'L&apos;utilisateur source et destination doivent être différents'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    onSubmit(sourceUser!.id, targetUser!.id)
  }

  const handleSourceUserChange = (user: User | null) => {
    setSourceUser(user)
    // Si on sélectionne la même personne comme destination, la désélectionner
    if (user && targetUser && user.id === targetUser.id) {
      setTargetUser(null)
    }
    if (errors.sourceUser) {
      setErrors(prev => ({ ...prev, sourceUser: '' }))
    }
  }

  const handleTargetUserChange = (user: User | null) => {
    setTargetUser(user)
    // Si on sélectionne la même personne comme source, la désélectionner
    if (user && sourceUser && user.id === sourceUser.id) {
      setSourceUser(null)
    }
    if (errors.targetUser) {
      setErrors(prev => ({ ...prev, targetUser: '' }))
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'text-purple-700'
      case 'REDACTEUR': return 'text-blue-700'
      case 'GREFFIER': return 'text-green-700'
      default: return 'text-gray-700'
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                <div className="bg-gradient-to-r from-orange-50 to-red-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 flex items-center">
                      <div className="w-2 h-2 bg-orange-600 rounded-full mr-3"></div>
                      <ArrowPathIcon className="w-6 h-6 text-orange-600 mr-2" />
                      Transférer les assignations
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-white/50 transition-all duration-200"
                      disabled={isSubmitting}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-6">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <p className="text-sm text-orange-800 mb-2">
                        Cette action transférera toutes les demandes et dossiers assignés de l&apos;utilisateur source vers l&apos;utilisateur destination.
                      </p>
                      <p className="text-xs text-orange-600 flex items-center">
                        <XMarkIcon className="w-4 h-4 mr-1" />
                        Cette action est irréversible. Les informations de création et modification ne seront pas modifiées.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Utilisateur source */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Utilisateur source (transférer DE) *
                      </label>
                      <Listbox 
                        value={sourceUser} 
                        onChange={handleSourceUserChange}
                        disabled={isSubmitting}
                      >
                        <div className="relative">
                          <Listbox.Button className={`relative w-full cursor-default rounded-lg bg-white py-3 pl-3 pr-10 text-left shadow-sm border ${
                            errors.sourceUser ? 'border-red-500' : 'border-gray-300'
                          } focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm`}>
                            <span className="block truncate">
                              {sourceUser ? (
                                <span className="flex items-center">
                                  <span>
                                    {sourceUser.nom} {sourceUser.prenom} ({sourceUser.identifiant})
                                  </span>
                                  <span className={`ml-2 text-xs font-medium ${getRoleColor(sourceUser.role)}`}>
                                    {sourceUser.role}
                                  </span>
                                </span>
                              ) : (
                                'Sélectionnez un utilisateur'
                              )}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </span>
                          </Listbox.Button>
                          <Transition
                            as={React.Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {utilisateursActifs.map(user => (
                                <Listbox.Option
                                  key={user.id}
                                  value={user}
                                  disabled={targetUser?.id === user.id}
                                  className={({ active, disabled }) =>
                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                      disabled ? 'text-gray-400 bg-gray-50' :
                                      active ? 'bg-orange-100 text-orange-900' : 'text-gray-900'
                                    }`
                                  }
                                >
                                  {({ selected }) => (
                                    <>
                                      <div className={`flex items-center justify-between truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                        <span>
                                          {user.nom} {user.prenom} ({user.identifiant})
                                        </span>
                                        <span className={`text-xs font-medium ${getRoleColor(user.role)}`}>
                                          {user.role}
                                        </span>
                                      </div>
                                      {selected ? (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-orange-600">
                                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                      ) : null}
                                    </>
                                  )}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </Listbox>
                      {errors.sourceUser && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          {errors.sourceUser}
                        </p>
                      )}
                    </div>

                    {/* Utilisateur destination */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Utilisateur destination (transférer VERS) *
                      </label>
                      <Listbox 
                        value={targetUser} 
                        onChange={handleTargetUserChange}
                        disabled={isSubmitting}
                      >
                        <div className="relative">
                          <Listbox.Button className={`relative w-full cursor-default rounded-lg bg-white py-3 pl-3 pr-10 text-left shadow-sm border ${
                            errors.targetUser ? 'border-red-500' : 'border-gray-300'
                          } focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm`}>
                            <span className="block truncate">
                              {targetUser ? (
                                <span className="flex items-center">
                                  <span>
                                    {targetUser.nom} {targetUser.prenom} ({targetUser.identifiant})
                                  </span>
                                  <span className={`ml-2 text-xs font-medium ${getRoleColor(targetUser.role)}`}>
                                    {targetUser.role}
                                  </span>
                                </span>
                              ) : (
                                'Sélectionnez un utilisateur'
                              )}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </span>
                          </Listbox.Button>
                          <Transition
                            as={React.Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {utilisateursActifs.map(user => (
                                <Listbox.Option
                                  key={user.id}
                                  value={user}
                                  disabled={sourceUser?.id === user.id}
                                  className={({ active, disabled }) =>
                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                      disabled ? 'text-gray-400 bg-gray-50' :
                                      active ? 'bg-orange-100 text-orange-900' : 'text-gray-900'
                                    }`
                                  }
                                >
                                  {({ selected }) => (
                                    <>
                                      <div className={`flex items-center justify-between truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                        <span>
                                          {user.nom} {user.prenom} ({user.identifiant})
                                        </span>
                                        <span className={`text-xs font-medium ${getRoleColor(user.role)}`}>
                                          {user.role}
                                        </span>
                                      </div>
                                      {selected ? (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-orange-600">
                                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                      ) : null}
                                    </>
                                  )}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </Listbox>
                      {errors.targetUser && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          {errors.targetUser}
                        </p>
                      )}
                    </div>

                    {/* Résumé du transfert */}
                    {sourceUser && targetUser && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
                          <CheckIcon className="w-4 h-4 mr-1" />
                          Résumé du transfert
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center">
                            <span className="text-blue-700 font-medium">De :</span>
                            <span className="ml-2 text-blue-800">
                              {sourceUser.nom} {sourceUser.prenom} ({sourceUser.identifiant})
                            </span>
                            <span className={`ml-2 text-xs font-medium ${getRoleColor(sourceUser.role)}`}>
                              {sourceUser.role}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-blue-700 font-medium">Vers :</span>
                            <span className="ml-2 text-blue-800">
                              {targetUser.nom} {targetUser.prenom} ({targetUser.identifiant})
                            </span>
                            <span className={`ml-2 text-xs font-medium ${getRoleColor(targetUser.role)}`}>
                              {targetUser.role}
                            </span>
                          </div>
                          <p className="text-xs text-blue-600 mt-3 bg-blue-100 rounded px-2 py-1">
                            Toutes les demandes et dossiers assignés à {sourceUser.prenom} seront transférés à {targetUser.prenom}.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                        disabled={isSubmitting}
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        disabled={isSubmitting || !sourceUser || !targetUser}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center">
                            <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                            Transfert en cours...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <ArrowPathIcon className="w-4 h-4 mr-2" />
                            Confirmer le transfert
                          </span>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default TransferModal