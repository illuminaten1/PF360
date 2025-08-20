import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
  PlusIcon,
  CheckIcon,
  LinkIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { Dossier } from '@/types'
import api from '@/utils/api'
import DossierModal from '@/components/forms/DossierModal'
import LierDemandesModal from '@/components/forms/LierDemandesModal'
import DemandeViewModal from '@/components/forms/DemandeViewModal'
import DecisionViewModal from '@/components/forms/DecisionViewModal'
import DecisionEditModal from '@/components/forms/DecisionEditModal'
import GenerateDecisionModal from '@/components/forms/GenerateDecisionModal'
import CreateConventionModal from '@/components/forms/CreateConventionModal'
import LoadingSpinner from '@/components/common/LoadingSpinner'

dayjs.extend(relativeTime)
dayjs.locale('fr')

const DossierDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isLierDemandesModalOpen, setIsLierDemandesModalOpen] = useState(false)
  const [isDemandeViewModalOpen, setIsDemandeViewModalOpen] = useState(false)
  const [isDecisionViewModalOpen, setIsDecisionViewModalOpen] = useState(false)
  const [isDecisionEditModalOpen, setIsDecisionEditModalOpen] = useState(false)
  const [isGenerateDecisionModalOpen, setIsGenerateDecisionModalOpen] = useState(false)
  const [isCreateConventionModalOpen, setIsCreateConventionModalOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<any>(null)
  const [selectedDecision, setSelectedDecision] = useState<any>(null)
  const [notes, setNotes] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const notesTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  // Save notes mutation
  const saveNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      if (!id) throw new Error('ID du dossier manquant')
      const response = await api.put(`/dossiers/${id}`, { notes })
      return response.data
    },
    onSuccess: (updatedDossier) => {
      // Update only the cache without invalidating (no refetch)
      queryClient.setQueryData(['dossier', id], updatedDossier)
      setLastSavedAt(new Date())
      setIsSavingNotes(false)
    },
    onError: () => {
      toast.error('Erreur lors de la sauvegarde des notes')
      setIsSavingNotes(false)
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

  // Unlink demande mutation
  const unlinkDemandeMutation = useMutation({
    mutationFn: async (demandeId: string) => {
      const response = await api.put(`/demandes/${demandeId}`, { dossierId: null })
      return response.data
    },
    onSuccess: (updatedDemande) => {
      queryClient.invalidateQueries({ queryKey: ['dossier', id] })
      queryClient.invalidateQueries({ queryKey: ['dossiers-all'] })
      queryClient.invalidateQueries({ queryKey: ['demandes'] })
      toast.success(`Demande ${updatedDemande?.numeroDS || 'inconnue'} déliée du dossier`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la déliaison')
    }
  })

  // Create decision mutation
  const createDecisionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/decisions', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossier', id] })
      queryClient.invalidateQueries({ queryKey: ['dossiers-all'] })
      queryClient.invalidateQueries({ queryKey: ['decisions-all'] })
      toast.success('Décision générée avec succès')
      setIsGenerateDecisionModalOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la génération de la décision')
    }
  })

  // Update decision mutation
  const updateDecisionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put(`/decisions/${data.id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossier', id] })
      queryClient.invalidateQueries({ queryKey: ['dossiers-all'] })
      queryClient.invalidateQueries({ queryKey: ['decisions-all'] })
      toast.success('Décision modifiée avec succès')
      setIsDecisionEditModalOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification de la décision')
    }
  })

  // Create convention mutation
  const createConventionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/conventions', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossier', id] })
      queryClient.invalidateQueries({ queryKey: ['dossiers-all'] })
      queryClient.invalidateQueries({ queryKey: ['conventions-all'] })
      toast.success('Convention créée avec succès')
      setIsCreateConventionModalOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la création de la convention')
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

  const handleUnlinkDemande = (demande: any) => {
    if (window.confirm(`Êtes-vous sûr de vouloir délier la demande ${demande.numeroDS} (${demande.prenom} ${demande.nom}) de ce dossier ?`)) {
      unlinkDemandeMutation.mutate(demande.id)
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

  const handleViewDecision = (decision: any) => {
    setSelectedDecision(decision)
    setIsDecisionViewModalOpen(true)
  }

  const handleCloseDecisionModal = () => {
    setIsDecisionViewModalOpen(false)
    setSelectedDecision(null)
  }

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
    await createDecisionMutation.mutateAsync(data)
  }

  const handleSubmitDecisionEdit = async (data: any) => {
    await updateDecisionMutation.mutateAsync(data)
  }

  const handleCreateConvention = () => {
    if (!dossier || dossier.decisions.length === 0) {
      toast.error('Aucune décision disponible pour créer une convention')
      return
    }
    setIsCreateConventionModalOpen(true)
  }

  const handleSubmitConvention = async (data: any) => {
    await createConventionMutation.mutateAsync(data)
  }

  // Initialize notes when dossier loads
  useEffect(() => {
    if (dossier && dossier.notes !== undefined) {
      setNotes(dossier.notes || '')
    }
  }, [dossier])

  // Auto-save notes with debounce
  const debouncedSaveNotes = useCallback((newNotes: string) => {
    if (notesTimeoutRef.current) {
      clearTimeout(notesTimeoutRef.current)
    }
    
    notesTimeoutRef.current = setTimeout(() => {
      if (newNotes !== (dossier?.notes || '')) {
        setIsSavingNotes(true)
        saveNotesMutation.mutate(newNotes)
      }
    }, 2000)
  }, [dossier?.notes, saveNotesMutation])

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value
    setNotes(newNotes)
    debouncedSaveNotes(newNotes)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (notesTimeoutRef.current) {
        clearTimeout(notesTimeoutRef.current)
      }
    }
  }, [])

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

  const getTypeColor = (type: string) => {
    return type === 'VICTIME' ? 'bg-sky-100 text-sky-800' : 'bg-orange-100 text-orange-800'
  }

  const getTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ')
  }

  const getAudienceUrgency = (dateAudience?: string) => {
    if (!dateAudience) return { type: 'none', style: 'bg-gray-100 text-gray-800', icon: null }
    
    const today = dayjs()
    const audienceDate = dayjs(dateAudience)
    const daysDiff = audienceDate.diff(today, 'day')
    
    if (daysDiff < 0) {
      return { 
        type: 'passed', 
        style: 'bg-gray-100 text-gray-800', 
        icon: XCircleIcon 
      }
    } else if (daysDiff < 7) {
      return { 
        type: 'urgent', 
        style: 'bg-red-100 text-red-800', 
        icon: ExclamationTriangleIcon 
      }
    } else if (daysDiff < 14) {
      return { 
        type: 'soon', 
        style: 'bg-orange-100 text-orange-800', 
        icon: ClockIcon 
      }
    } else {
      return { 
        type: 'normal', 
        style: 'bg-green-100 text-green-800', 
        icon: CheckCircleIcon 
      }
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
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

      {/* Informations générales */}
      <div className="mb-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations générales</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Organisme payeur</label>
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
                <button 
                  onClick={() => setIsLierDemandesModalOpen(true)}
                  className="btn-primary-outline flex items-center text-sm"
                >
                  <LinkIcon className="h-4 w-4 mr-1" />
                  Lier des demandes
                </button>
              </div>
            </div>
            <div className="p-6">
              {dossier.demandes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucune demande dans ce dossier</p>
              ) : (
                <div className="space-y-3">
                  {dossier.demandes.map((demande) => {
                    const dateAudience = (demande as any).dateAudience
                    const urgency = getAudienceUrgency(dateAudience)
                    const IconComponent = urgency.icon
                    const today = dayjs().startOf('day')
                    const audienceDate = dateAudience ? dayjs(dateAudience).startOf('day') : null
                    const daysDiff = audienceDate ? audienceDate.diff(today, 'day') : null
                    
                    return (
                      <div key={demande.id} className="border rounded-lg p-3 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex-shrink-0">
                                <h3 className="font-medium text-gray-900 text-sm">
                                  {demande.grade && `${demande.grade} `}
                                  {demande.prenom} {demande.nom}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(demande.type)}`}>
                                    {getTypeLabel(demande.type)}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    Reçu le {dayjs(demande.dateReception).format('DD/MM/YYYY')}
                                  </span>
                                  {demande.dateFaits && (
                                    <span className="text-xs text-gray-500">
                                      • Faits du {dayjs(demande.dateFaits).format('DD/MM/YYYY')}
                                    </span>
                                  )}
                                  
                                  {(demande as any).badges && (demande as any).badges.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {(demande as any).badges.slice(0, 2).map((badgeRel: any) => (
                                        <span
                                          key={badgeRel.badge.id}
                                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                                          style={badgeRel.badge.couleur ? {
                                            backgroundColor: `${badgeRel.badge.couleur}20`,
                                            color: badgeRel.badge.couleur
                                          } : {}}
                                        >
                                          {badgeRel.badge.nom}
                                        </span>
                                      ))}
                                      {(demande as any).badges.length > 2 && (
                                        <span key={`more-badges-${demande.id}`} className="text-xs text-gray-500">
                                          +{(demande as any).badges.length - 2}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {dateAudience && (
                                <div className="flex-shrink-0 ml-4">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${urgency.style}`}>
                                    {IconComponent && (
                                      <IconComponent className="h-3 w-3 mr-1" />
                                    )}
                                    Audience {dayjs(dateAudience).format('DD/MM/YYYY')}
                                    {daysDiff !== null && daysDiff >= 0 && (
                                      <span className="ml-1">
                                        - {daysDiff} j.
                                      </span>
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                            <button 
                              onClick={() => handleViewDemande(demande)}
                              className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-50"
                            >
                              Voir
                            </button>
                            <button
                              onClick={() => handleUnlinkDemande(demande)}
                              disabled={unlinkDemandeMutation.isPending}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              title="Délier du dossier"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
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
                <button 
                  onClick={handleGenerateDecision}
                  disabled={dossier.demandes.length === 0}
                  className="btn-primary-outline flex items-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title={dossier.demandes.length === 0 ? "Aucune demande disponible" : "Générer une nouvelle décision"}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Générer décision
                </button>
              </div>
            </div>
            <div className="p-6">
              {dossier.decisions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucune décision prise pour ce dossier</p>
              ) : (
                <div className="space-y-4">
                  {dossier.decisions.map((decision) => {
                    const getTypeLabel = (type: string) => {
                      switch (type) {
                        case 'AJ': return 'Aide Juridique'
                        case 'AJE': return 'Aide Juridique Évolutive'
                        case 'PJ': return 'Protection Juridictionnelle'
                        case 'REJET': return 'Rejet'
                        // Support des anciens types pour compatibilité
                        case 'OCTROI': return 'Aide Juridique'
                        case 'OCTROI_PARTIEL': return 'Aide Juridique Partielle'
                        default: return type
                      }
                    }


                    return (
                      <div key={decision.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h3 className="font-semibold text-gray-900">
                                {getTypeLabel(decision.type)}
                              </h3>
                              {decision.demandes && decision.demandes.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {decision.demandes.slice(0, 2).map((d, index) => (
                                    <span key={`demande-${decision.id}-${index}`} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {d.demande.prenom} {d.demande.nom}
                                    </span>
                                  ))}
                                  {decision.demandes.length > 2 && (
                                    <span key={`more-demandes-${decision.id}`} className="text-xs text-gray-500">
                                      +{decision.demandes.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              {(decision as any).dateSignature && (
                                <div>Signée le: {dayjs((decision as any).dateSignature).format('DD/MM/YYYY')}</div>
                              )}
                              {(decision as any).dateEnvoi && (
                                <div>Envoyée le: {dayjs((decision as any).dateEnvoi).format('DD/MM/YYYY')}</div>
                              )}
                              {!(decision as any).dateSignature && !(decision as any).dateEnvoi && (decision as any).date && (
                                <div>Date: {dayjs((decision as any).date).format('DD/MM/YYYY')}</div>
                              )}
                              {decision.creePar && (
                                <div>Créée par: {decision.creePar.prenom} {decision.creePar.nom}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleEditDecision(decision)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Modifier
                            </button>
                            <button 
                              onClick={() => handleViewDecision(decision)}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              Voir détails
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
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
                  Conventions d'honoraires ({dossier.conventions.length})
                </h2>
                <button 
                  onClick={handleCreateConvention}
                  disabled={dossier.decisions.length === 0}
                  className="btn-primary-outline flex items-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  title={dossier.decisions.length === 0 ? "Aucune décision disponible" : "Créer une nouvelle convention"}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Nouvelle convention
                </button>
              </div>
            </div>
            <div className="p-6">
              {dossier.conventions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Aucune convention d'honoraires</p>
              ) : (
                <div className="space-y-4">
                  {dossier.conventions.map((convention) => {
                    const getTypeBadge = (type: string) => {
                      switch (type) {
                        case 'CONVENTION':
                          return 'bg-blue-100 text-blue-800'
                        case 'AVENANT':
                          return 'bg-orange-100 text-orange-800'
                        default:
                          return 'bg-gray-100 text-gray-800'
                      }
                    }

                    const getVictimeMecBadge = (type: string) => {
                      switch (type) {
                        case 'VICTIME':
                          return 'bg-sky-100 text-sky-800'
                        case 'MIS_EN_CAUSE':
                          return 'bg-amber-100 text-amber-800'
                        default:
                          return 'bg-gray-100 text-gray-800'
                      }
                    }

                    const getVictimeMecLabel = (type: string) => {
                      switch (type) {
                        case 'VICTIME':
                          return 'Victime'
                        case 'MIS_EN_CAUSE':
                          return 'Mis en cause'
                        default:
                          return type
                      }
                    }

                    return (
                      <div key={convention.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h3 className="font-semibold text-gray-900">
                                Convention n°{convention.numero}
                              </h3>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(convention.type)}`}>
                                  {convention.type}
                                </span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVictimeMecBadge(convention.victimeOuMisEnCause)}`}>
                                  {getVictimeMecLabel(convention.victimeOuMisEnCause)}
                                </span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-900 mb-2">
                              <strong>{convention.avocat.prenom} {convention.avocat.nom}</strong>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div className="flex items-center gap-4">
                                <span>Montant HT: <strong>{convention.montantHT.toLocaleString('fr-FR')} €</strong></span>
                                {convention.montantHTGagePrecedemment && (
                                  <span>Montant gagé préc.: {convention.montantHTGagePrecedemment.toLocaleString('fr-FR')} €</span>
                                )}
                              </div>
                              {convention.instance && (
                                <div>Instance: {convention.instance}</div>
                              )}
                              <div className="flex items-center gap-4">
                                <span>Créée le: {dayjs(convention.dateCreation).format('DD/MM/YYYY')}</span>
                                {convention.dateRetourSigne ? (
                                  <span className="flex items-center text-green-600">
                                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                                    Signée le {dayjs(convention.dateRetourSigne).format('DD/MM/YYYY')}
                                  </span>
                                ) : (
                                  <span className="flex items-center text-orange-600">
                                    <ClockIcon className="h-4 w-4 mr-1" />
                                    En attente de signature
                                  </span>
                                )}
                              </div>
                              {convention.demandes && convention.demandes.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-xs text-gray-500">Demandeurs: </span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {convention.demandes.slice(0, 3).map((d, index) => (
                                      <span key={`demande-${convention.id}-${index}`} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {d.demande.prenom} {d.demande.nom}
                                      </span>
                                    ))}
                                    {convention.demandes.length > 3 && (
                                      <span key={`more-demandes-${convention.id}`} className="text-xs text-gray-500">
                                        +{convention.demandes.length - 3} autre(s)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                              {convention.diligences && convention.diligences.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-xs text-gray-500">Diligences: </span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {convention.diligences.slice(0, 2).map((d, index) => (
                                      <span key={`diligence-${convention.id}-${index}`} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        {d.diligence.nom}
                                      </span>
                                    ))}
                                    {convention.diligences.length > 2 && (
                                      <span key={`more-diligences-${convention.id}`} className="text-xs text-gray-500">
                                        +{convention.diligences.length - 2} autre(s)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                              {convention.creePar && (
                                <div className="text-xs">
                                  Créée par: {(convention.creePar as any).grade && `${(convention.creePar as any).grade} `}
                                  {convention.creePar.prenom} {convention.creePar.nom}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              className="text-blue-600 hover:text-blue-800 text-sm"
                              disabled={true}
                              title="Modification - À venir"
                            >
                              Modifier
                            </button>
                            <button 
                              className="text-green-600 hover:text-green-800 text-sm"
                              disabled={true}
                              title="Détails - À venir"
                            >
                              Voir détails
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
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

          {/* Notes */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Notes
              </h3>
              <div className="flex items-center text-xs text-gray-500">
                {isSavingNotes ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sauvegarde...
                  </span>
                ) : lastSavedAt ? (
                  <span className="flex items-center">
                    <CheckIcon className="h-3 w-3 mr-1 text-green-500" />
                    Sauvegardé {dayjs(lastSavedAt).fromNow()}
                  </span>
                ) : null}
              </div>
            </div>
            <TextareaAutosize
              minRows={4}
              value={notes}
              onChange={handleNotesChange}
              placeholder="Ajoutez des notes sur ce dossier...
              
• Échanges avec les parties
• Consignes particulières
• Points d'attention
• Historique des actions"
              className="w-full resize-none border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors [&::-webkit-scrollbar]:hidden"
              disabled={isSavingNotes}
            />
            <div className="mt-2 text-xs text-gray-400">
              Les notes sont sauvegardées automatiquement après 2 secondes d'inactivité.
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

      {/* Decision View Modal */}
      <DecisionViewModal
        isOpen={isDecisionViewModalOpen}
        onClose={handleCloseDecisionModal}
        decision={selectedDecision}
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
    </div>
  )
}

export default DossierDetail