import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { XMarkIcon, MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline'
import { Dossier, Demande } from '@/types'
import api from '@/utils/api'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

interface DemandeursList {
  demandes: Demande[]
}

const DemandeursList: React.FC<DemandeursList> = ({ demandes }) => {
  const [showAll, setShowAll] = useState(false)
  
  if (demandes.length === 0) {
    return <span className="text-gray-400 italic">Aucun demandeur</span>
  }
  
  return (
    <div>
      {showAll ? (
        // Afficher tous les demandeurs
        <div className="space-y-1">
          {demandes.map((demande, index) => (
            <div key={index} className="flex items-center justify-between">
              <span>
                {demande.grade?.gradeAbrege && `${demande.grade.gradeAbrege} `}
                {demande.prenom} {demande.nom}
              </span>
              {demande.numeroDS && (
                <span className="text-xs text-gray-500 ml-2">
                  ({demande.numeroDS})
                </span>
              )}
            </div>
          ))}
          {demandes.length > 3 && (
            <button
              onClick={() => setShowAll(false)}
              className="text-blue-600 hover:text-blue-800 text-xs underline mt-1"
            >
              Réduire
            </button>
          )}
        </div>
      ) : (
        // Afficher les 3 premiers + bouton
        <div>
          <div className="space-y-1">
            {demandes.slice(0, 3).map((demande, index) => (
              <div key={index} className="flex items-center justify-between">
                <span>
                  {demande.grade?.gradeAbrege && `${demande.grade.gradeAbrege} `}
                  {demande.prenom} {demande.nom}
                </span>
                {demande.numeroDS && (
                  <span className="text-xs text-gray-500 ml-2">
                    ({demande.numeroDS})
                  </span>
                )}
              </div>
            ))}
          </div>
          {demandes.length > 3 && (
            <div className="mt-1">
              <span className="text-gray-500 text-xs">+{demandes.length - 3} autre(s) </span>
              <button
                onClick={() => setShowAll(true)}
                className="text-blue-600 hover:text-blue-800 text-xs underline"
              >
                Voir tous
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface LierDemandesMultiplesDossierModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDemandes: Demande[]
}

const LierDemandesMultiplesDossierModal: React.FC<LierDemandesMultiplesDossierModalProps> = ({
  isOpen,
  onClose,
  selectedDemandes
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const queryClient = useQueryClient()

  // Debounce de 300ms pour éviter trop de requêtes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const { data: dossiers = [], isLoading } = useQuery({
    queryKey: ['dossiers-for-liaison', debouncedSearchTerm],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (debouncedSearchTerm.trim()) {
        params.append('search', debouncedSearchTerm.trim())
      }
      params.append('limit', '50') // Limite raisonnable avec recherche
      
      const response = await api.get(`/dossiers?${params}`)
      return response.data || []
    },
    enabled: isOpen,
    placeholderData: keepPreviousData, // Évite les clignotements lors de la recherche
    staleTime: 5 * 60 * 1000 // Cache pendant 5 minutes
  })

  const lierDemandesMutation = useMutation({
    mutationFn: async (dossierId: string) => {
      // Lier toutes les demandes sélectionnées au dossier
      const promises = selectedDemandes.map(demande => 
        api.put(`/demandes/${demande.id}`, { dossierId })
      )
      await Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandes-all'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      toast.success(`${selectedDemandes.length} demande${selectedDemandes.length > 1 ? 's' : ''} liée${selectedDemandes.length > 1 ? 's' : ''} au dossier avec succès`)
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la liaison')
    }
  })

  // Plus besoin de filtrage côté client, c'est fait côté serveur
  const filteredDossiers = dossiers as Dossier[]

  const handleLierDemandes = (dossierId: string) => {
    lierDemandesMutation.mutate(dossierId)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Lier les demandes à un dossier existant
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedDemandes.length} demande{selectedDemandes.length > 1 ? 's' : ''} sélectionnée{selectedDemandes.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Affichage des demandes sélectionnées */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Demandes à lier :</h3>
          <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
            {selectedDemandes.map((demande) => (
              <span
                key={demande.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {demande.numeroDS} - {demande.grade?.gradeAbrege && `${demande.grade.gradeAbrege} `}{demande.prenom} {demande.nom}
              </span>
            ))}
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Rechercher par numéro de dossier, nom du dossier ou identité d'un demandeur..."
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {filteredDossiers.length} dossier(s) trouvé(s)
          </p>
        </div>

        {/* Table des dossiers */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: '50vh' }}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredDossiers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchTerm.trim() ? 'Aucun dossier trouvé pour cette recherche' : 'Aucun dossier disponible'}
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numéro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom du dossier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Demandeurs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date faits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigné à
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDossiers.map((dossier: Dossier) => (
                  <tr key={dossier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-blue-600">
                        {dossier.numero}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {dossier.nomDossier ? (
                          <span className="font-medium">{dossier.nomDossier}</span>
                        ) : (
                          <span className="text-gray-400 italic">Sans nom</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {dossier.demandes.length === 0 ? (
                          <span className="text-gray-400 italic">Aucun demandeur</span>
                        ) : (
                          <DemandeursList demandes={dossier.demandes} />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {dossier.demandes.length > 0 && dossier.demandes[0].dateFaits ? (
                          dayjs(dossier.demandes[0].dateFaits).format('DD/MM/YYYY')
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {dossier.assigneA ? (
                          `${dossier.assigneA.grade || ''} ${dossier.assigneA.prenom} ${dossier.assigneA.nom}`.trim()
                        ) : (
                          <span className="text-gray-400">Non assigné</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleLierDemandes(dossier.id)}
                        disabled={lierDemandesMutation.isPending}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {lierDemandesMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Liaison...
                          </>
                        ) : (
                          <>
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Lier {selectedDemandes.length} demande{selectedDemandes.length > 1 ? 's' : ''}
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={lierDemandesMutation.isPending}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}

export default LierDemandesMultiplesDossierModal