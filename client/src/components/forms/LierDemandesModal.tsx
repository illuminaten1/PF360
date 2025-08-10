import React, { useState, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  UserIcon,
  CalendarIcon,
  CheckIcon,
  LinkIcon
} from '@heroicons/react/24/outline'
import { Demande } from '@/types'
import api from '@/utils/api'
import LoadingSpinner from '@/components/common/LoadingSpinner'

dayjs.locale('fr')

interface LierDemandesModalProps {
  isOpen: boolean
  onClose: () => void
  dossierId: string
  dossierNumero: string
}

const LierDemandesModal: React.FC<LierDemandesModalProps> = ({
  isOpen,
  onClose,
  dossierId,
  dossierNumero
}) => {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [selectedDemandes, setSelectedDemandes] = useState<Set<string>>(new Set())
  const [isLinking, setIsLinking] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(50) // Limite raisonnable par page

  // Fetch demandes non liées à un dossier
  const { data: demandesData, isLoading, error } = useQuery({
    queryKey: ['demandes-non-liees', searchTerm, typeFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        dossierId: 'null', // Filtrage côté serveur pour les demandes non liées
        search: searchTerm,
        ...(typeFilter && { type: typeFilter }),
        sortBy: 'dateReception',
        sortOrder: 'desc'
      })
      
      const response = await api.get(`/demandes?${params}`)
      return response.data
    },
    enabled: isOpen,
    staleTime: 30000 // Cache pendant 30 secondes
  })

  // Plus besoin de filtrer côté client, c'est fait côté serveur
  const demandes = demandesData?.demandes || []
  const totalDemandes = demandesData?.total || 0
  const totalPages = Math.ceil(totalDemandes / limit)

  const getTypeColor = (type: string) => {
    return type === 'VICTIME' ? 'bg-sky-100 text-sky-800' : 'bg-orange-100 text-orange-800'
  }

  const getTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ')
  }

  const handleSelectDemande = useCallback((demandeId: string) => {
    setSelectedDemandes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(demandeId)) {
        newSet.delete(demandeId)
      } else {
        newSet.add(demandeId)
      }
      return newSet
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedDemandes.size === demandes.length) {
      setSelectedDemandes(new Set())
    } else {
      setSelectedDemandes(new Set(demandes.map((d: Demande) => d.id)))
    }
  }, [demandes, selectedDemandes.size])

  const resetFilters = useCallback(() => {
    setSearchTerm('')
    setTypeFilter('')
    setPage(1)
    setSelectedDemandes(new Set())
  }, [])

  // Mutation pour lier les demandes
  const lierDemandesMutation = useMutation({
    mutationFn: async (demandeIds: string[]) => {
      const promises = demandeIds.map(demandeId => 
        api.put(`/demandes/${demandeId}`, { dossierId })
      )
      return Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandes-non-liees'] })
      queryClient.invalidateQueries({ queryKey: ['dossier', dossierId] })
      queryClient.invalidateQueries({ queryKey: ['dossiers-all'] })
      toast.success(`${selectedDemandes.size} demande(s) liée(s) au dossier ${dossierNumero}`)
      setSelectedDemandes(new Set())
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la liaison des demandes')
    }
  })

  const handleLierDemandes = async () => {
    if (selectedDemandes.size === 0) {
      toast.error('Veuillez sélectionner au moins une demande')
      return
    }

    setIsLinking(true)
    try {
      await lierDemandesMutation.mutateAsync(Array.from(selectedDemandes))
    } finally {
      setIsLinking(false)
    }
  }

  const handleClose = () => {
    resetFilters()
    onClose()
  }

  // Réinitialiser les filtres quand on change de recherche ou de type
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setPage(1) // Retourner à la première page
  }

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value)
    setPage(1) // Retourner à la première page
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                      <LinkIcon className="h-6 w-6 mr-2 text-blue-600" />
                      Lier des demandes au dossier {dossierNumero}
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-gray-600">
                      Sélectionnez les demandes à associer à ce dossier
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Filtres et recherche */}
                <div className="mb-6 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          placeholder="Rechercher: nom, prénom, 'Michel DUPONT', N° DS, NIGEND, commune..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <select
                        value={typeFilter}
                        onChange={(e) => handleTypeFilterChange(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Tous les types</option>
                        <option value="VICTIME">Victime</option>
                        <option value="MIS_EN_CAUSE">Mis en cause</option>
                      </select>
                    </div>
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
                      <p className="text-red-600">Erreur lors du chargement des demandes</p>
                    </div>
                  ) : demandes.length === 0 ? (
                    <div className="text-center py-12">
                      <LinkIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {searchTerm || typeFilter 
                          ? 'Aucune demande non liée ne correspond aux critères de recherche'
                          : 'Toutes les demandes sont déjà associées à des dossiers'
                        }
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Header avec sélection globale */}
                      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedDemandes.size === demandes.length && demandes.length > 0}
                              onChange={handleSelectAll}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">
                              Tout sélectionner
                            </span>
                          </label>
                          {selectedDemandes.size > 0 && (
                            <span className="text-sm text-blue-600 font-medium">
                              {selectedDemandes.size} demande(s) sélectionnée(s)
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          <div>Page {page} sur {totalPages}</div>
                          <div>{totalDemandes} demande(s) au total</div>
                        </div>
                      </div>

                      {/* Liste des demandes */}
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {demandes.map((demande: Demande) => (
                          <div
                            key={demande.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedDemandes.has(demande.id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                            onClick={() => handleSelectDemande(demande.id)}
                          >
                            <div className="flex items-start">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <h4 className="text-sm font-medium text-gray-900">
                                      {demande.grade && `${demande.grade} `}
                                      {demande.prenom} {demande.nom}
                                    </h4>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(demande.type)}`}>
                                      {getTypeLabel(demande.type)}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    N° DS: {demande.numeroDS}
                                  </span>
                                </div>
                                <div className="mt-1 flex items-center space-x-4 text-xs text-gray-600">
                                  <div className="flex items-center">
                                    <CalendarIcon className="h-3 w-3 mr-1" />
                                    Reçu le {dayjs(demande.dateReception).format('DD/MM/YYYY')}
                                  </div>
                                  {demande.nigend && (
                                    <div className="font-medium">NIGEND: {demande.nigend}</div>
                                  )}
                                  {demande.unite && (
                                    <div>{demande.unite}</div>
                                  )}
                                  {demande.commune && (
                                    <div>{demande.commune}</div>
                                  )}
                                  {demande.assigneA && (
                                    <div className="flex items-center">
                                      <UserIcon className="h-3 w-3 mr-1" />
                                      {demande.assigneA.grade && `${demande.assigneA.grade} `}
                                      {demande.assigneA.prenom} {demande.assigneA.nom}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                          <div className="text-sm text-gray-500">
                            {demandes.length > 0 && (
                              <>Affichage de {(page - 1) * limit + 1} à {Math.min(page * limit, totalDemandes)} sur {totalDemandes}</>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setPage(Math.max(1, page - 1))}
                              disabled={page <= 1}
                              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Précédent
                            </button>
                            <span className="px-3 py-2 text-sm">
                              {page} / {totalPages}
                            </span>
                            <button
                              onClick={() => setPage(Math.min(totalPages, page + 1))}
                              disabled={page >= totalPages}
                              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Suivant
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="btn-secondary"
                    disabled={isLinking}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleLierDemandes}
                    className="btn-primary flex items-center"
                    disabled={selectedDemandes.size === 0 || isLinking}
                  >
                    {isLinking ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Liaison en cours...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Lier {selectedDemandes.size} demande(s)
                      </>
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default LierDemandesModal