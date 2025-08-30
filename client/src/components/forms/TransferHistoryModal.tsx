import React, { useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { 
  XMarkIcon, 
  ClockIcon, 
  ArrowPathIcon, 
  UserIcon,
  ExclamationTriangleIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { TransferHistory } from '@/types'
import api from '@/utils/api'

interface TransferHistoryModalProps {
  isOpen: boolean
  onClose: () => void
}

const TransferHistoryModal: React.FC<TransferHistoryModalProps> = ({ isOpen, onClose }) => {
  const [selectedTransfer, setSelectedTransfer] = useState<TransferHistory | null>(null)
  const queryClient = useQueryClient()

  const { data: transfersData, isLoading } = useQuery({
    queryKey: ['transfer-history'],
    queryFn: async () => {
      const response = await api.get('/users/transfer-history')
      return response.data
    },
    enabled: isOpen
  })

  const rollbackMutation = useMutation({
    mutationFn: async (transferId: string) => {
      const response = await api.post(`/users/transfer-history/${transferId}/rollback`)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transfer-history'] })
      queryClient.invalidateQueries({ queryKey: ['users-all'] })
      toast.success(`Transfert annulé : ${data.rollback.demandesRolledBack} demandes et ${data.rollback.dossiersRolledBack} dossiers retournés`)
      setSelectedTransfer(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'annulation du transfert')
    }
  })

  const handleRollback = (transfer: TransferHistory) => {
    if (window.confirm(
      `Êtes-vous sûr de vouloir annuler ce transfert ?\n\n` +
      `${transfer.demandesTransferred} demandes et ${transfer.dossiersTransferred} dossiers seront retournés ` +
      `de ${transfer.targetUser.prenom} ${transfer.targetUser.nom} vers ${transfer.sourceUser.prenom} ${transfer.sourceUser.nom}.`
    )) {
      rollbackMutation.mutate(transfer.id)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'text-purple-600 bg-purple-100'
      case 'REDACTEUR': return 'text-blue-600 bg-blue-100'
      case 'GREFFIER': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const transfers = transfersData?.transfers || []

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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-visible rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      <ClockIcon className="w-6 h-6 text-blue-600 mr-2" />
                      Historique des transferts
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-white/50 transition-all duration-200"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <ArrowPathIcon className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                      <span className="text-gray-600">Chargement de l&apos;historique...</span>
                    </div>
                  ) : transfers.length === 0 ? (
                    <div className="text-center py-12">
                      <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Aucun transfert dans l&apos;historique</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {transfers.map((transfer: TransferHistory) => (
                        <div
                          key={transfer.id}
                          className={`border rounded-lg p-4 transition-all duration-200 ${
                            transfer.status === 'ACTIVE' 
                              ? 'border-green-200 bg-green-50' 
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {/* Header avec statut */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  {transfer.status === 'ACTIVE' ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      <CheckIcon className="w-3 h-3 mr-1" />
                                      Actif
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      <XMarkIcon className="w-3 h-3 mr-1" />
                                      Annulé
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-500">
                                    {formatDate(transfer.transferredAt)}
                                  </span>
                                </div>
                                
                                {transfer.status === 'ACTIVE' && (
                                  <button
                                    onClick={() => handleRollback(transfer)}
                                    disabled={rollbackMutation.isPending}
                                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors disabled:opacity-50"
                                  >
                                    <ArrowPathIcon className="w-3 h-3 mr-1" />
                                    {rollbackMutation.isPending ? 'Annulation...' : 'Annuler'}
                                  </button>
                                )}
                              </div>

                              {/* Transfert details */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                <div className="bg-white rounded-lg p-3 border border-gray-100">
                                  <div className="flex items-center mb-2">
                                    <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                                    <span className="text-xs font-medium text-gray-600">DE</span>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="font-medium text-gray-900">
                                      {transfer.sourceUser.prenom} {transfer.sourceUser.nom}
                                    </p>
                                    <p className="text-xs text-gray-500">({transfer.sourceUser.identifiant})</p>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(transfer.sourceUser.role)}`}>
                                      {transfer.sourceUser.role}
                                    </span>
                                  </div>
                                </div>

                                <div className="bg-white rounded-lg p-3 border border-gray-100">
                                  <div className="flex items-center mb-2">
                                    <ArrowPathIcon className="w-4 h-4 text-blue-500 mr-2" />
                                    <span className="text-xs font-medium text-gray-600">VERS</span>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="font-medium text-gray-900">
                                      {transfer.targetUser.prenom} {transfer.targetUser.nom}
                                    </p>
                                    <p className="text-xs text-gray-500">({transfer.targetUser.identifiant})</p>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(transfer.targetUser.role)}`}>
                                      {transfer.targetUser.role}
                                    </span>
                                  </div>
                                </div>

                                <div className="bg-white rounded-lg p-3 border border-gray-100">
                                  <div className="flex items-center mb-2">
                                    <ExclamationTriangleIcon className="w-4 h-4 text-orange-400 mr-2" />
                                    <span className="text-xs font-medium text-gray-600">ÉLÉMENTS</span>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm">
                                      <span className="font-semibold text-blue-600">{transfer.demandesTransferred}</span>
                                      <span className="text-gray-600"> demandes</span>
                                    </p>
                                    <p className="text-sm">
                                      <span className="font-semibold text-green-600">{transfer.dossiersTransferred}</span>
                                      <span className="text-gray-600"> dossiers</span>
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Footer info */}
                              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                                <div>
                                  Effectué par <span className="font-medium">{transfer.transferredBy.prenom} {transfer.transferredBy.nom}</span>
                                </div>
                                {transfer.status === 'ROLLED_BACK' && transfer.rolledBackBy && (
                                  <div>
                                    Annulé par <span className="font-medium">{transfer.rolledBackBy.prenom} {transfer.rolledBackBy.nom}</span>
                                    {transfer.rolledBackAt && <span> le {formatDate(transfer.rolledBackAt)}</span>}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
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

export default TransferHistoryModal