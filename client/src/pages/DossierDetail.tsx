import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  DocumentTextIcon,
  CurrencyEuroIcon,
  ScaleIcon,
  FolderIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { Dossier } from '@/types'
import api from '@/utils/api'
import DossierModal from '@/components/forms/DossierModal'
import LoadingSpinner from '@/components/common/LoadingSpinner'

dayjs.locale('fr')

const DossierDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Fetch dossier details
  const { data: dossier, isLoading, error } = useQuery<Dossier>({
    queryKey: ['dossier', id],
    queryFn: async () => {
      if (!id) throw new Error('ID du dossier manquant')
      const response = await api.get(`/dossiers/${id}`)
      return response.data
    },
    enabled: !!id
  })

  // Update dossier mutation
  const updateDossierMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!id) throw new Error('ID du dossier manquant')
      const response = await api.put(`/dossiers/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossier', id] })
      queryClient.invalidateQueries({ queryKey: ['dossiers-all'] })
      toast.success('Dossier modifié avec succès')
      setIsEditModalOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification')
    }
  })

  // Delete dossier mutation
  const deleteDossierMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('ID du dossier manquant')
      await api.delete(`/dossiers/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers-all'] })
      toast.success('Dossier supprimé avec succès')
      navigate('/dossiers')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression')
    }
  })

  const handleEditDossier = () => {
    setIsEditModalOpen(true)
  }

  const handleDeleteDossier = () => {
    if (dossier && window.confirm(`Êtes-vous sûr de vouloir supprimer le dossier ${dossier.numero} ?`)) {
      deleteDossierMutation.mutate()
    }
  }

  const handleSubmitDossier = async (data: any) => {
    await updateDossierMutation.mutateAsync(data)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !dossier) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">
            Erreur lors du chargement du dossier. {error?.message || 'Dossier non trouvé.'}
          </p>
          <button
            onClick={() => navigate('/dossiers')}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Retour à la liste des dossiers
          </button>
        </div>
      </div>
    )
  }

  const stats = dossier.stats || {
    totalConventionsHT: dossier.conventions.reduce((sum, conv) => sum + conv.montantHT, 0),
    totalPaiementsTTC: dossier.paiements.reduce((sum, paie) => sum + paie.montantTTC, 0),
    nombreDemandes: dossier.demandes.length,
    nombreDecisions: dossier.decisions.length
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/dossiers')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Dossier {dossier.numero}
              {dossier.nomDossier && (
                <span className="text-2xl font-bold text-gray-600">
                  {' - '}{dossier.nomDossier}
                </span>
              )}
            </h1>
            
            {/* Badges */}
            {dossier.badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {dossier.badges.map((badgeRel) => (
                  <span
                    key={badgeRel.badge.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-base font-medium bg-purple-100 text-purple-800"
                    style={badgeRel.badge.couleur ? {
                      backgroundColor: `${badgeRel.badge.couleur}20`,
                      color: badgeRel.badge.couleur
                    } : {}}
                  >
                    {badgeRel.badge.nom}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEditDossier}
              className="btn-secondary flex items-center"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Modifier
            </button>
            <button
              onClick={handleDeleteDossier}
              className="btn-danger flex items-center"
              disabled={deleteDossierMutation.isPending}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Supprimer
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <FolderIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.nombreDemandes}</div>
                <div className="text-sm text-gray-600">Demandes</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <ScaleIcon className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{stats.nombreDecisions}</div>
                <div className="text-sm text-gray-600">Décisions</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <CurrencyEuroIcon className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalConventionsHT.toLocaleString('fr-FR')} €
                </div>
                <div className="text-sm text-gray-600">Conventions HT</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <CurrencyEuroIcon className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">
                  {stats.totalPaiementsTTC.toLocaleString('fr-FR')} €
                </div>
                <div className="text-sm text-gray-600">Paiements TTC</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Demandes Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FolderIcon className="h-5 w-5 mr-2" />
                  Demandes ({dossier.demandes.length})
                </h2>
                <button className="btn-primary-outline flex items-center text-sm">
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Nouvelle demande
                </button>
              </div>
            </div>
            <div className="p-6">
              {dossier.demandes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucune demande dans ce dossier</p>
              ) : (
                <div className="space-y-4">
                  {dossier.demandes.map((demande) => (
                    <div key={demande.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {demande.grade && `${demande.grade} `}
                              {demande.prenom} {demande.nom}
                            </h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {demande.type}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>N° DS: {demande.numeroDS}</div>
                            <div>Reçu le: {dayjs(demande.dateReception).format('DD/MM/YYYY')}</div>
                            {demande.dateFaits && (
                              <div>Faits du: {dayjs(demande.dateFaits).format('DD/MM/YYYY')}</div>
                            )}
                          </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          Voir détails
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Decisions Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <ScaleIcon className="h-5 w-5 mr-2" />
                  Décisions ({dossier.decisions.length})
                </h2>
                <button className="btn-primary-outline flex items-center text-sm">
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Nouvelle décision
                </button>
              </div>
            </div>
            <div className="p-6">
              {dossier.decisions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucune décision prise</p>
              ) : (
                <div className="space-y-4">
                  {dossier.decisions.map((decision) => (
                    <div key={decision.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          decision.type === 'OCTROI' ? 'bg-green-100 text-green-800' :
                          decision.type === 'OCTROI_PARTIEL' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {decision.type}
                        </span>
                        <span className="text-sm text-gray-500">
                          {dayjs(decision.date).format('DD/MM/YYYY')}
                        </span>
                      </div>
                      {decision.creePar && (
                        <p className="text-sm text-gray-600">
                          Créée par: {decision.creePar.prenom} {decision.creePar.nom}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Conventions Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Conventions ({dossier.conventions.length})
                </h2>
                <button className="btn-primary-outline flex items-center text-sm">
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Nouvelle convention
                </button>
              </div>
            </div>
            <div className="p-6">
              {dossier.conventions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucune convention signée</p>
              ) : (
                <div className="space-y-4">
                  {dossier.conventions.map((convention) => (
                    <div key={convention.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {convention.avocat.nom} {convention.avocat.prenom}
                          </h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Montant: {convention.montantHT.toLocaleString('fr-FR')} € HT</div>
                            <div>Date: {dayjs(convention.date).format('DD/MM/YYYY')}</div>
                            {convention.creePar && (
                              <div>Créée par: {convention.creePar.prenom} {convention.creePar.nom}</div>
                            )}
                          </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          Voir détails
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Paiements Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CurrencyEuroIcon className="h-5 w-5 mr-2" />
                  Paiements ({dossier.paiements.length})
                </h2>
                <button className="btn-primary-outline flex items-center text-sm">
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Nouveau paiement
                </button>
              </div>
            </div>
            <div className="p-6">
              {dossier.paiements.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucun paiement enregistré</p>
              ) : (
                <div className="space-y-4">
                  {dossier.paiements.map((paiement) => (
                    <div key={paiement.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <span className="font-semibold text-gray-900">
                              {paiement.montantTTC.toLocaleString('fr-FR')} € TTC
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              paiement.nature === 'AVOCAT' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {paiement.nature}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>HT: {paiement.montantHT.toLocaleString('fr-FR')} €</div>
                            {paiement.facture && <div>Facture: {paiement.facture}</div>}
                            {paiement.creePar && (
                              <div>Créé par: {paiement.creePar.prenom} {paiement.creePar.nom}</div>
                            )}
                          </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          Voir détails
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Informations générales */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">SGAMI</label>
                <p className="mt-1 text-sm text-gray-900">
                  {dossier.sgami?.nom || 'Non assigné'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Assigné à</label>
                <p className="mt-1 text-sm text-gray-900 flex items-center">
                  <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                  {dossier.assigneA ? (
                    `${dossier.assigneA.grade || ''} ${dossier.assigneA.prenom} ${dossier.assigneA.nom}`.trim()
                  ) : (
                    'Non assigné'
                  )}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date de création</label>
                <div className="mt-1 text-sm text-gray-900">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                    {dayjs(dossier.createdAt).format('DD/MM/YYYY à HH:mm')}
                  </div>
                  {dossier.creePar && (
                    <span className="block text-gray-600 text-xs mt-1 ml-6">
                      par {dossier.creePar.grade && `${dossier.creePar.grade} `}
                      {dossier.creePar.prenom} {dossier.creePar.nom}
                    </span>
                  )}
                </div>
              </div>
              {dossier.updatedAt !== dossier.createdAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dernière modification</label>
                  <div className="mt-1 text-sm text-gray-900">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {dayjs(dossier.updatedAt).format('DD/MM/YYYY à HH:mm')}
                    </div>
                    {dossier.modifiePar && (
                      <span className="block text-gray-600 text-xs mt-1 ml-6">
                        par {dossier.modifiePar.grade && `${dossier.modifiePar.grade} `}
                        {dossier.modifiePar.prenom} {dossier.modifiePar.nom}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>


          {/* Attendus */}
          {dossier.attendus && dossier.attendus.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ClipboardDocumentListIcon className="h-5 w-5 mr-2" />
                Attendus
              </h3>
              <div className="space-y-3">
                {dossier.attendus.map((attendu) => (
                  <div key={attendu.id} className="border-l-4 border-yellow-400 pl-4">
                    <h4 className="font-medium text-gray-900">{attendu.nomOuNigend}</h4>
                    {attendu.commentaire && (
                      <p className="text-sm text-gray-600 mt-1">{attendu.commentaire}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {dossier.notes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Notes
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{dossier.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <DossierModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleSubmitDossier}
        dossier={dossier}
        title="Modifier le dossier"
      />
    </div>
  )
}

export default DossierDetail