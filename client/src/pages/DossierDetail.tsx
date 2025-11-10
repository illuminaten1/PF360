import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import relativeTime from 'dayjs/plugin/relativeTime'
import TextareaAutosize from 'react-textarea-autosize'
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
  CheckIcon,
} from '@heroicons/react/24/outline'
import { Dossier } from '@/types'
import api from '@/utils/api'
import DossierModal from '@/components/forms/DossierModal'
import LierDemandesModal from '@/components/forms/LierDemandesModal'
import DemandeViewModal from '@/components/forms/DemandeViewModal'
import DecisionEditModal from '@/components/forms/DecisionEditModal'
import GenerateDecisionModal from '@/components/forms/GenerateDecisionModal'
import CreateConventionModal from '@/components/forms/CreateConventionModal'
import EditConventionModal from '@/components/forms/EditConventionModal'
import PaiementModal from '@/components/forms/PaiementModal'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ConventionContextMenu from '@/components/common/ConventionContextMenu'
import DecisionContextMenu from '@/components/common/DecisionContextMenu'
import PaiementContextMenu from '@/components/common/PaiementContextMenu'
import DemandesSection from '@/components/dossiers/DemandesSection'
import DecisionsSection from '@/components/dossiers/DecisionsSection'
import ConventionsSection from '@/components/dossiers/ConventionsSection'
import PaiementsSection from '@/components/dossiers/PaiementsSection'
import { useDossierMutations } from '@/hooks/useDossierMutations'
import { useContextMenus } from '@/hooks/useContextMenus'
import { useNotesAutoSave } from '@/hooks/useNotesAutoSave'

dayjs.extend(relativeTime)
dayjs.locale('fr')

const DossierDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isLierDemandesModalOpen, setIsLierDemandesModalOpen] = useState(false)
  const [isDemandeViewModalOpen, setIsDemandeViewModalOpen] = useState(false)
  const [isDecisionEditModalOpen, setIsDecisionEditModalOpen] = useState(false)
  const [isGenerateDecisionModalOpen, setIsGenerateDecisionModalOpen] = useState(false)
  const [isCreateConventionModalOpen, setIsCreateConventionModalOpen] = useState(false)
  const [isEditConventionModalOpen, setIsEditConventionModalOpen] = useState(false)
  const [isPaiementModalOpen, setIsPaiementModalOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<any>(null)
  const [selectedDecision, setSelectedDecision] = useState<any>(null)
  const [selectedConvention, setSelectedConvention] = useState<any>(null)
  const [selectedPaiement, setSelectedPaiement] = useState<any>(null)

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

  // Custom hooks
  const mutations = useDossierMutations(id)
  const contextMenus = useContextMenus<any, any, any>()
  const notes = useNotesAutoSave({
    initialNotes: dossier?.notes || '',
    saveNotesMutation: mutations.saveNotesMutation
  })

  // Dossier handlers
  const handleEditDossier = () => {
    setIsEditModalOpen(true)
  }

  const handleDeleteDossier = () => {
    if (dossier && window.confirm(`Êtes-vous sûr de vouloir supprimer le dossier ${dossier.numero} ?`)) {
      mutations.deleteDossierMutation.mutate()
    }
  }

  const handleSubmitDossier = async (data: any) => {
    await mutations.updateDossierMutation.mutateAsync(data)
    setIsEditModalOpen(false)
  }

  // Demandes handlers
  const handleUnlinkDemande = (demande: any) => {
    if (window.confirm(`Êtes-vous sûr de vouloir délier la demande ${demande.numeroDS} (${demande.prenom} ${demande.nom}) de ce dossier ?`)) {
      mutations.unlinkDemandeMutation.mutate(demande.id)
    }
  }

  const handleViewDemande = (demande: any) => {
    setSelectedDemande(demande)
    setIsDemandeViewModalOpen(true)
  }

  const handleCloseDemandeModal = () => {
    setIsDemandeViewModalOpen(false)
    setSelectedDemande(null)
  }

  // Decisions handlers
  const handleEditDecision = (decision: any) => {
    setSelectedDecision(decision)
    setIsDecisionEditModalOpen(true)
  }

  const handleCloseDecisionEditModal = () => {
    setIsDecisionEditModalOpen(false)
    setSelectedDecision(null)
  }

  const handleGenerateDecision = () => {
    if (!dossier || dossier.demandes.length === 0) {
      toast.error('Aucune demande disponible pour générer une décision')
      return
    }
    setIsGenerateDecisionModalOpen(true)
  }

  const handleSubmitDecision = async (data: any) => {
    await mutations.createDecisionMutation.mutateAsync(data)
    setIsGenerateDecisionModalOpen(false)
  }

  const handleSubmitDecisionEdit = async (data: any) => {
    await mutations.updateDecisionMutation.mutateAsync(data)
    setIsDecisionEditModalOpen(false)
  }

  // Conventions handlers
  const handleCreateConvention = () => {
    if (!dossier || dossier.decisions.length === 0) {
      toast.error('Aucune décision disponible pour créer une convention')
      return
    }
    setIsCreateConventionModalOpen(true)
  }

  const handleSubmitConvention = async (data: any) => {
    await mutations.createConventionMutation.mutateAsync(data)
    setIsCreateConventionModalOpen(false)
  }

  const handleEditConvention = async (convention: any) => {
    try {
      const response = await api.get(`/conventions/${convention.id}`)
      setSelectedConvention(response.data)
      setIsEditConventionModalOpen(true)
    } catch (error) {
      console.error('Erreur lors de la récupération de la convention:', error)
      toast.error('Erreur lors de la récupération de la convention')
    }
  }

  const handleSubmitConventionEdit = async (data: any) => {
    await mutations.updateConventionMutation.mutateAsync(data)
    setIsEditConventionModalOpen(false)
    setSelectedConvention(null)
  }

  const handleCloseConventionEditModal = () => {
    setIsEditConventionModalOpen(false)
    setSelectedConvention(null)
  }

  // Paiements handlers
  const handleCreatePaiement = () => {
    setSelectedPaiement(null)
    setIsPaiementModalOpen(true)
  }

  const handleEditPaiement = async (paiement: any) => {
    try {
      const response = await api.get(`/paiements/${paiement.id}`)
      setSelectedPaiement(response.data)
      setIsPaiementModalOpen(true)
    } catch (error) {
      console.error('Erreur lors de la récupération du paiement:', error)
      toast.error('Erreur lors de la récupération du paiement')
    }
  }

  const handleDeletePaiement = (paiement: any) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ce paiement de ${paiement.montantTTC.toLocaleString('fr-FR')} € ?`)) {
      mutations.deletePaiementMutation.mutate(paiement.id)
    }
  }

  const handleSubmitPaiement = async (data: any) => {
    if (selectedPaiement) {
      await mutations.updatePaiementMutation.mutateAsync(data)
    } else {
      await mutations.createPaiementMutation.mutateAsync(data)
    }
    setIsPaiementModalOpen(false)
    setSelectedPaiement(null)
  }

  const handleClosePaiementModal = () => {
    setIsPaiementModalOpen(false)
    setSelectedPaiement(null)
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
            onClick={() => navigate(-1)}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Retour à la page précédente
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
      {/* Menu contextuel pour conventions */}
      <ConventionContextMenu
        show={contextMenus.conventionMenu.show}
        x={contextMenus.conventionMenu.x}
        y={contextMenus.conventionMenu.y}
        convention={contextMenus.conventionMenu.item}
        dossier={dossier}
        onClose={contextMenus.closeConventionMenu}
      />

      {/* Menu contextuel pour décisions */}
      <DecisionContextMenu
        show={contextMenus.decisionMenu.show}
        x={contextMenus.decisionMenu.x}
        y={contextMenus.decisionMenu.y}
        decision={contextMenus.decisionMenu.item}
        dossier={dossier}
        onClose={contextMenus.closeDecisionMenu}
      />

      {/* Menu contextuel pour paiements */}
      <PaiementContextMenu
        show={contextMenus.paiementMenu.show}
        x={contextMenus.paiementMenu.x}
        y={contextMenus.paiementMenu.y}
        paiement={contextMenus.paiementMenu.item}
        dossier={dossier}
        onClose={contextMenus.closePaiementMenu}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => navigate(-1)}
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
                <div className="space-y-2">
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
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleEditDossier}
              className="btn-secondary flex items-center justify-center"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Modifier
            </button>
            <button
              onClick={handleDeleteDossier}
              className="btn-danger flex items-center justify-center"
              disabled={mutations.deleteDossierMutation.isPending}
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

      {/* Informations générales */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h3>
        <div className={`grid grid-cols-1 gap-6 ${dossier.updatedAt !== dossier.createdAt ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
          <div>
            <label className="block text-sm font-bold text-gray-700">Organisme payeur</label>
            <p className="mt-1 text-sm text-gray-900">
              {dossier.sgami?.nom || 'Non assigné'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">BAP</label>
            <p className="mt-1 text-sm text-gray-900">
              {dossier.bap?.nomBAP || 'Non assigné'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700">Assigné à</label>
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
            <label className="block text-sm font-bold text-gray-700">Date de création</label>
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
              <label className="block text-sm font-bold text-gray-700">Dernière modification</label>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Demandes Section */}
          <DemandesSection
            demandes={dossier.demandes}
            isUnlinking={mutations.unlinkDemandeMutation.isPending}
            onLierDemandes={() => setIsLierDemandesModalOpen(true)}
            onViewDemande={handleViewDemande}
            onUnlinkDemande={handleUnlinkDemande}
          />

          {/* Decisions Section */}
          <DecisionsSection
            decisions={dossier.decisions}
            hasDecisions={dossier.demandes.length > 0}
            onGenerateDecision={handleGenerateDecision}
            onEditDecision={handleEditDecision}
            onContextMenu={contextMenus.handleDecisionContextMenu}
          />

          {/* Conventions Section */}
          <ConventionsSection
            conventions={dossier.conventions}
            hasDecisions={dossier.decisions.length > 0}
            onCreateConvention={handleCreateConvention}
            onEditConvention={handleEditConvention}
            onContextMenu={contextMenus.handleConventionContextMenu}
          />

          {/* Paiements Section */}
          <PaiementsSection
            paiements={dossier.paiements}
            isDeletingPaiement={mutations.deletePaiementMutation.isPending}
            onCreatePaiement={handleCreatePaiement}
            onEditPaiement={handleEditPaiement}
            onDeletePaiement={handleDeletePaiement}
            onContextMenu={contextMenus.handlePaiementContextMenu}
          />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Notes */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Notes
              </h3>
              <div className="flex items-center text-xs text-gray-500">
                {notes.isSavingNotes ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sauvegarde...
                  </span>
                ) : notes.lastSavedAt ? (
                  <span className="flex items-center">
                    <CheckIcon className="h-3 w-3 mr-1 text-green-500" />
                    Sauvegardé {dayjs(notes.lastSavedAt).fromNow()}
                  </span>
                ) : null}
              </div>
            </div>
            <TextareaAutosize
              minRows={4}
              value={notes.notes}
              onChange={notes.handleNotesChange}
              placeholder="Ajoutez des notes sur ce dossier...

• Échanges avec les parties
• Consignes particulières
• Points d'attention
• Historique des actions"
              className="w-full resize-none border border-gray-300 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors [&::-webkit-scrollbar]:hidden"
              disabled={notes.isSavingNotes}
            />
            <div className="mt-2 text-xs text-gray-400">
              Les notes sont sauvegardées automatiquement après 2 secondes d&apos;inactivité.
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

      {/* Lier Demandes Modal */}
      {id && (
        <LierDemandesModal
          isOpen={isLierDemandesModalOpen}
          onClose={() => setIsLierDemandesModalOpen(false)}
          dossierId={id}
          dossierNumero={dossier?.numero || ''}
        />
      )}

      {/* Demande View Modal */}
      <DemandeViewModal
        isOpen={isDemandeViewModalOpen}
        onClose={handleCloseDemandeModal}
        demande={selectedDemande}
      />

      {/* Decision Edit Modal */}
      <DecisionEditModal
        isOpen={isDecisionEditModalOpen}
        onClose={handleCloseDecisionEditModal}
        onSubmit={handleSubmitDecisionEdit}
        decision={selectedDecision}
      />

      {/* Generate Decision Modal */}
      {dossier && (
        <GenerateDecisionModal
          isOpen={isGenerateDecisionModalOpen}
          onClose={() => setIsGenerateDecisionModalOpen(false)}
          onSubmit={handleSubmitDecision}
          dossier={dossier}
        />
      )}

      {/* Create Convention Modal */}
      {dossier && (
        <CreateConventionModal
          isOpen={isCreateConventionModalOpen}
          onClose={() => setIsCreateConventionModalOpen(false)}
          onSubmit={handleSubmitConvention}
          dossier={dossier}
        />
      )}

      {/* Edit Convention Modal */}
      {dossier && selectedConvention && (
        <EditConventionModal
          isOpen={isEditConventionModalOpen}
          onClose={handleCloseConventionEditModal}
          onSubmit={handleSubmitConventionEdit}
          convention={selectedConvention}
          dossier={dossier}
        />
      )}

      {/* Paiement Modal */}
      {dossier && id && (
        <PaiementModal
          isOpen={isPaiementModalOpen}
          onClose={handleClosePaiementModal}
          onSubmit={handleSubmitPaiement}
          paiement={selectedPaiement}
          dossierId={id}
          title={selectedPaiement ? 'Modifier le paiement' : 'Nouveau paiement'}
        />
      )}
    </div>
  )
}

export default DossierDetail
