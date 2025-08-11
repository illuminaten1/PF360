import React, { useState, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  UserIcon,
  CheckIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline'
import { User } from '@/types'
import api from '@/utils/api'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface AssignerDemandeModalProps {
  isOpen: boolean
  onClose: () => void
  demandeId: string
  demandeNumeroDS: string
  currentAssignee?: User | null
}

const AssignerDemandeModal: React.FC<AssignerDemandeModalProps> = ({
  isOpen,
  onClose,
  demandeId,
  demandeNumeroDS,
  currentAssignee
}) => {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [isAssigning, setIsAssigning] = useState(false)

  // Fetch utilisateurs
  const { data: utilisateurs = [], isLoading, error } = useQuery({
    queryKey: ['users', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      
      const response = await api.get(`/demandes/users`)
      return response.data
    },
    enabled: isOpen,
    staleTime: 30000
  })

  // Filtrer les utilisateurs basé sur la recherche
  const filteredUtilisateurs = utilisateurs.filter((user: User) => {
    if (!searchTerm) return true
    const fullName = `${user.grade || ''} ${user.prenom} ${user.nom}`.toLowerCase()
    return fullName.includes(searchTerm.toLowerCase())
  })

  const handleSelectUser = useCallback((userId: string) => {
    setSelectedUserId(userId)
  }, [])

  const resetModal = useCallback(() => {
    setSearchTerm('')
    setSelectedUserId('')
  }, [])

  // Mutation pour assigner la demande
  const assignerDemandeMutation = useMutation({
    mutationFn: async (assigneAId: string | null) => {
      // Pour désassigner, l'API attend une chaîne vide, pas null
      const assigneAIdValue = assigneAId === null ? '' : assigneAId
      return api.put(`/demandes/${demandeId}`, { assigneAId: assigneAIdValue })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandes-all'] })
      queryClient.invalidateQueries({ queryKey: ['demande', demandeId] })
      queryClient.invalidateQueries({ queryKey: ['demandes-stats'] })
      
      if (selectedUserId) {
        const assignedUser = utilisateurs.find((u: User) => u.id === selectedUserId)
        const userName = assignedUser ? `${assignedUser.grade ? `${assignedUser.grade} ` : ''}${assignedUser.prenom} ${assignedUser.nom}` : 'utilisateur'
        toast.success(`Demande ${demandeNumeroDS} assignée à ${userName}`)
      } else {
        toast.success(`Assignation de la demande ${demandeNumeroDS} supprimée`)
      }
      
      resetModal()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de l\'assignation')
    }
  })

  const handleAssignerDemande = async () => {
    setIsAssigning(true)
    try {
      await assignerDemandeMutation.mutateAsync(selectedUserId === '' ? null : selectedUserId)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRemoveAssignment = async () => {
    setIsAssigning(true)
    try {
      await assignerDemandeMutation.mutateAsync(null)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                      <UserPlusIcon className="h-6 w-6 mr-2 text-blue-600" />
                      Assigner la demande {demandeNumeroDS}
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-gray-600">
                      {currentAssignee 
                        ? `Actuellement assignée à ${currentAssignee.grade ? `${currentAssignee.grade} ` : ''}${currentAssignee.prenom} ${currentAssignee.nom}`
                        : 'Sélectionnez un utilisateur pour assigner cette demande'
                      }
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Barre de recherche */}
                <div className="mb-6">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Rechercher un utilisateur: nom, prénom, grade..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Contenu */}
                <div className="mb-6">
                  {isLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <LoadingSpinner />
                    </div>
                  ) : error ? (
                    <div className="text-center py-12">
                      <p className="text-red-600">Erreur lors du chargement des utilisateurs</p>
                    </div>
                  ) : filteredUtilisateurs.length === 0 ? (
                    <div className="text-center py-12">
                      <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {searchTerm 
                          ? 'Aucun utilisateur ne correspond à la recherche'
                          : 'Aucun utilisateur disponible'
                        }
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Option pour ne pas assigner */}
                      <div className="mb-4">
                        <div
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedUserId === ''
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          onClick={() => handleSelectUser('')}
                        >
                          <div className="flex items-center">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-600 italic">
                                Non assigné
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">
                                Supprimer l'assignation actuelle
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Liste des utilisateurs */}
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredUtilisateurs.map((utilisateur: User) => (
                          <div
                            key={utilisateur.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedUserId === utilisateur.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                            onClick={() => handleSelectUser(utilisateur.id)}
                          >
                            <div className="flex items-start">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-medium text-gray-900">
                                    {utilisateur.grade && `${utilisateur.grade} `}
                                    {utilisateur.prenom} {utilisateur.nom}
                                  </h4>
                                  {currentAssignee?.id === utilisateur.id && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                      Assigné actuellement
                                    </span>
                                  )}
                                </div>
                                <div className="mt-1 flex items-center space-x-4 text-xs text-gray-600">
                                  <div className="flex items-center">
                                    <UserIcon className="h-3 w-3 mr-1" />
                                    {utilisateur.mail}
                                  </div>
                                  <div className="text-gray-500">
                                    {utilisateur.role}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-6 border-t border-gray-200">
                  <div>
                    {currentAssignee && (
                      <button
                        type="button"
                        onClick={handleRemoveAssignment}
                        className="btn-secondary text-red-600 hover:bg-red-50"
                        disabled={isAssigning}
                      >
                        Supprimer l'assignation
                      </button>
                    )}
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="btn-secondary"
                      disabled={isAssigning}
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleAssignerDemande}
                      className="btn-primary flex items-center"
                      disabled={isAssigning}
                    >
                      {isAssigning ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Assignation...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-4 w-4 mr-2" />
                          {selectedUserId === '' ? 'Supprimer' : 'Assigner'}
                        </>
                      )}
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

export default AssignerDemandeModal