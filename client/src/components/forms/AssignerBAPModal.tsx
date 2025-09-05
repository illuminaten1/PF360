import React, { useState, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  CheckIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline'
import api from '@/utils/api'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface BAP {
  id: string
  nomBAP: string
  mail1?: string
  mail2?: string
  mail3?: string
  mail4?: string
}

interface AssignerBAPModalProps {
  isOpen: boolean
  onClose: () => void
  demandeId: string
  demandeNumeroDS: string
  currentBAP?: BAP
}

const AssignerBAPModal: React.FC<AssignerBAPModalProps> = ({
  isOpen,
  onClose,
  demandeId,
  demandeNumeroDS,
  currentBAP
}) => {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBAPId, setSelectedBAPId] = useState<string>('')
  const [isAssigning, setIsAssigning] = useState(false)

  // Fetch BAPs
  const { data: bapsData, isLoading, error } = useQuery({
    queryKey: ['baps'],
    queryFn: async () => {
      const response = await api.get('/bap')
      return response.data
    },
    enabled: isOpen,
    staleTime: 30000
  })
  
  // Extract baps array from response - handle both success and error cases
  const baps: BAP[] = Array.isArray(bapsData?.baps) ? bapsData.baps : []

  // Filtrer les BAPs basé sur la recherche
  const filteredBAPs = baps.filter((bap: BAP) => {
    if (!searchTerm) return true
    return bap.nomBAP.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const handleSelectBAP = useCallback((bapId: string) => {
    setSelectedBAPId(prev => prev === bapId ? '' : bapId)
  }, [])

  const resetModal = useCallback(() => {
    setSearchTerm('')
    setSelectedBAPId('')
  }, [])

  // Mutation pour assigner le BAP
  const assignerBAPMutation = useMutation({
    mutationFn: async (bapId: string | null) => {
      return api.put(`/demandes/${demandeId}/baps`, { bapId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandes-all'] })
      queryClient.invalidateQueries({ queryKey: ['demande', demandeId] })
      
      if (selectedBAPId) {
        const selectedBAP = baps.find((b) => b.id === selectedBAPId)
        if (selectedBAP) {
          toast.success(`BAP ${selectedBAP.nomBAP} assigné à la demande ${demandeNumeroDS}`)
        }
      } else {
        toast.success(`Le BAP a été supprimé de la demande ${demandeNumeroDS}`)
      }
      
      resetModal()
      onClose()
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erreur lors de l\'assignation'
      toast.error(errorMessage)
    }
  })

  const handleAssignerBAP = async () => {
    setIsAssigning(true)
    try {
      await assignerBAPMutation.mutateAsync(selectedBAPId || null)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRemoveBAP = async () => {
    setIsAssigning(true)
    try {
      await assignerBAPMutation.mutateAsync(null)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  // Initialiser la sélection avec le BAP actuel quand le modal s'ouvre
  React.useEffect(() => {
    if (isOpen && currentBAP) {
      setSelectedBAPId(currentBAP.id)
    } else if (isOpen) {
      setSelectedBAPId('')
    }
  }, [isOpen, currentBAP])

  const isCurrentlyAssigned = (bapId: string) => {
    return currentBAP?.id === bapId
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
                      <BuildingOffice2Icon className="h-6 w-6 mr-2 text-blue-600" />
                      Assigner un BAP à la demande {demandeNumeroDS}
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-gray-600">
                      {currentBAP 
                        ? `Actuellement assigné à : ${currentBAP.nomBAP}`
                        : 'Sélectionnez un BAP pour cette demande'
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
                      placeholder="Rechercher un BAP..."
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
                      <p className="text-red-600">Erreur lors du chargement des BAP</p>
                    </div>
                  ) : filteredBAPs.length === 0 ? (
                    <div className="text-center py-12">
                      <BuildingOfficeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {searchTerm 
                          ? 'Aucun BAP ne correspond à la recherche'
                          : 'Aucun BAP disponible'
                        }
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Liste des BAPs */}
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredBAPs.map((bap: BAP) => (
                          <div
                            key={bap.id}
                            className={`px-4 py-3 border rounded-lg cursor-pointer transition-colors ${
                              isCurrentlyAssigned(bap.id)
                                ? 'border-green-500 bg-green-50'
                                : selectedBAPId === bap.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                            onClick={() => handleSelectBAP(bap.id)}
                          >
                            <div className="flex items-center">
                              <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900">
                                      {bap.nomBAP}
                                    </h4>
                                    {(bap.mail1 || bap.mail2 || bap.mail3 || bap.mail4) && (
                                      <div className="text-xs text-gray-600 mt-0.5">
                                        {[bap.mail1, bap.mail2, bap.mail3, bap.mail4]
                                          .filter(Boolean)
                                          .slice(0, 2)
                                          .join(', ')}
                                        {[bap.mail1, bap.mail2, bap.mail3, bap.mail4].filter(Boolean).length > 2 && '...'}
                                      </div>
                                    )}
                                  </div>
                                  {isCurrentlyAssigned(bap.id) && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                      Assigné actuellement
                                    </span>
                                  )}
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
                    {currentBAP && (
                      <button
                        type="button"
                        onClick={handleRemoveBAP}
                        className="btn-secondary text-red-600 hover:bg-red-50"
                        disabled={isAssigning}
                      >
                        Supprimer le BAP
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
                      onClick={handleAssignerBAP}
                      className="btn-primary flex items-center"
                      disabled={isAssigning || !selectedBAPId}
                    >
                      {isAssigning ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Assignation...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-4 w-4 mr-2" />
                          Assigner
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

export default AssignerBAPModal