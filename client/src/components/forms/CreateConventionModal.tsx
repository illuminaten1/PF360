import React, { useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { Dossier } from '@/types'
import api from '@/utils/api'

const createConventionSchema = z.object({
  type: z.enum(['CONVENTION', 'AVENANT'], {
    required_error: "Le type de convention est requis",
    invalid_type_error: "Le type de convention est requis"
  }),
  victimeOuMisEnCause: z.enum(['VICTIME', 'MIS_EN_CAUSE'], {
    required_error: "Le type de partie est requis"
  }),
  instance: z.enum([
    'enquête',
    'information judiciaire', 
    'première instance',
    'appel',
    'assises',
    'assises appel',
    'cassation',
    'CIVI'
  ], {
    required_error: "L'instance est requise"
  }),
  montantHT: z.number().positive("Le montant HT doit être positif"),
  montantHTGagePrecedemment: z.number().positive().optional(),
  avocatId: z.string().min(1, "L'avocat est requis"),
  diligenceId: z.string().optional(),
  dateRetourSigne: z.string().optional(),
  decisionIds: z.array(z.string()).min(1, "Au moins une décision doit être sélectionnée"),
  demandeIds: z.array(z.string()).min(1, "Au moins un demandeur doit être sélectionné")
})

type CreateConventionFormData = z.infer<typeof createConventionSchema>

interface CreateConventionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  dossier: Dossier
}

const CreateConventionModal: React.FC<CreateConventionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  dossier
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    watch
  } = useForm<CreateConventionFormData>({
    resolver: zodResolver(createConventionSchema)
  })

  const selectedType = watch('type')
  const selectedVictimeOuMisEnCause = watch('victimeOuMisEnCause')
  const selectedDecisionIds = watch('decisionIds') || []
  const selectedDemandeIds = watch('demandeIds') || []

  // Fetch avocats
  const { data: avocats = [] } = useQuery({
    queryKey: ['avocats-active'],
    queryFn: async () => {
      const response = await api.get('/avocats')
      return response.data.filter((avocat: any) => avocat.active)
    }
  })

  // Fetch diligences
  const { data: diligences = [] } = useQuery({
    queryKey: ['diligences-active'],
    queryFn: async () => {
      const response = await api.get('/diligences')
      return response.data.filter((diligence: any) => diligence.active)
    }
  })

  useEffect(() => {
    if (isOpen && dossier) {
      // Initialize form with default values
      setTimeout(() => {
        reset({
          type: undefined,
          victimeOuMisEnCause: undefined,
          instance: undefined,
          montantHT: 0,
          montantHTGagePrecedemment: undefined,
          avocatId: '',
          diligenceId: '',
          dateRetourSigne: '',
          decisionIds: [],
          demandeIds: []
        })
      }, 0)
    }
  }, [isOpen, dossier, reset])

  const handleFormSubmit = async (data: CreateConventionFormData) => {
    try {
      console.log('=== DEBUG: Form submit triggered ===');
      console.log('Form data:', data);
      
      // Use the selected demande IDs from the form
      const demandeIds = data.demandeIds
      
      const cleanedData = {
        type: data.type,
        victimeOuMisEnCause: data.victimeOuMisEnCause,
        instance: data.instance,
        montantHT: data.montantHT,
        montantHTGagePrecedemment: data.type === 'AVENANT' ? data.montantHTGagePrecedemment : undefined,
        dateRetourSigne: data.dateRetourSigne || undefined,
        dossierId: dossier.id,
        avocatId: data.avocatId,
        demandes: demandeIds,
        diligences: data.diligenceId ? [data.diligenceId] : []
      }

      console.log('=== DEBUG: Cleaned data to send ===');
      console.log(cleanedData);
      
      await onSubmit(cleanedData)
      onClose()
    } catch (error) {
      console.error('Erreur lors de la création:', error)
    }
  }

  const handleDecisionToggle = (decisionId: string) => {
    const currentIds = selectedDecisionIds || []
    const newIds = currentIds.includes(decisionId)
      ? currentIds.filter(id => id !== decisionId)
      : [...currentIds, decisionId]
    setValue('decisionIds', newIds)
  }

  const handleSelectAllDecisions = () => {
    const allDecisionIds = dossier.decisions.map(d => d.id)
    setValue('decisionIds', allDecisionIds)
  }

  const handleDeselectAllDecisions = () => {
    setValue('decisionIds', [])
    setValue('demandeIds', [])
  }

  // Get available demandeurs based on selected decisions
  const availableDemandeurs = dossier.decisions
    .filter(decision => selectedDecisionIds.includes(decision.id))
    .flatMap(decision => decision.demandes || [])
    .reduce((acc, demandeRel) => {
      const key = demandeRel.demandeId
      if (!acc.find(d => d.demandeId === key)) {
        acc.push(demandeRel)
      }
      return acc
    }, [] as any[])

  const handleDemandeToggle = (demandeId: string) => {
    const currentIds = selectedDemandeIds || []
    const newIds = currentIds.includes(demandeId)
      ? currentIds.filter(id => id !== demandeId)
      : [...currentIds, demandeId]
    setValue('demandeIds', newIds)
  }

  const handleSelectAllDemandeurs = () => {
    const allDemandeIds = availableDemandeurs.map(d => d.demandeId)
    setValue('demandeIds', allDemandeIds)
  }

  const handleDeselectAllDemandeurs = () => {
    setValue('demandeIds', [])
  }

  // Clear selected demandeurs when decisions change
  React.useEffect(() => {
    const currentAvailableIds = availableDemandeurs.map(d => d.demandeId)
    const filteredDemandeIds = selectedDemandeIds.filter(id => currentAvailableIds.includes(id))
    if (filteredDemandeIds.length !== selectedDemandeIds.length) {
      setValue('demandeIds', filteredDemandeIds)
    }
  }, [selectedDecisionIds, setValue, availableDemandeurs])

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

  const getDecisionTypeLabel = (type: string) => {
    switch (type) {
      case 'AJ':
        return 'Aide Juridique'
      case 'AJE':
        return 'Aide Juridique Évolutive'
      case 'PJ':
        return 'Protection Juridictionnelle'
      case 'REJET':
        return 'Rejet'
      default:
        return type
    }
  }

  const instances = [
    'enquête',
    'information judiciaire', 
    'première instance',
    'appel',
    'assises',
    'assises appel',
    'cassation',
    'CIVI'
  ]

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
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                    <DocumentTextIcon className="h-6 w-6 mr-2 text-blue-600" />
                    Créer une convention d'honoraires - Dossier {dossier.numero}
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                  {/* Première ligne : Type de convention et Type de partie */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Type de convention */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de convention *
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {(['CONVENTION', 'AVENANT'] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setValue('type', type)}
                            className={`rounded-lg border-2 p-4 text-center transition-all h-16 flex items-center justify-center shadow-sm bg-gradient-to-br ${
                              selectedType === type
                                ? 'border-blue-500 from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200'
                                : 'border-gray-200 from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200'
                            }`}
                          >
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(type)}`}>
                              {type}
                            </span>
                          </button>
                        ))}
                      </div>
                      {errors.type && (
                        <p className="mt-2 text-sm text-red-600">{errors.type.message}</p>
                      )}
                    </div>

                    {/* Type de partie */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de partie *
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {(['VICTIME', 'MIS_EN_CAUSE'] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setValue('victimeOuMisEnCause', type)}
                            className={`rounded-lg border-2 p-4 text-center transition-all h-16 flex items-center justify-center shadow-sm bg-gradient-to-br ${
                              selectedVictimeOuMisEnCause === type
                                ? 'border-blue-500 from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200'
                                : 'border-gray-200 from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200'
                            }`}
                          >
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVictimeMecBadge(type)}`}>
                              {getVictimeMecLabel(type)}
                            </span>
                          </button>
                        ))}
                      </div>
                      {errors.victimeOuMisEnCause && (
                        <p className="mt-2 text-sm text-red-600">{errors.victimeOuMisEnCause.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Deuxième ligne : Instance et Montants */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Instance */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Instance judiciaire *
                      </label>
                      <select
                        {...register('instance')}
                        className="block w-full h-12 px-4 rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all"
                      >
                        <option value="">Sélectionner une instance</option>
                        {instances.map((instance) => (
                          <option key={instance} value={instance}>
                            {instance}
                          </option>
                        ))}
                      </select>
                      {errors.instance && (
                        <p className="mt-1 text-sm text-red-600">{errors.instance.message}</p>
                      )}
                    </div>

                    {/* Montant HT */}
                    <div>
                      <label htmlFor="montantHT" className="block text-sm font-medium text-gray-700 mb-2">
                        Montant HT *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          {...register('montantHT', { valueAsNumber: true })}
                          className="block w-full h-12 px-4 pr-8 rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all"
                          placeholder="0.00"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-gray-400 text-sm font-medium">€</span>
                        </div>
                      </div>
                      {errors.montantHT && (
                        <p className="mt-1 text-sm text-red-600">{errors.montantHT.message}</p>
                      )}
                    </div>

                    {/* Montant HT gagé précédemment (si avenant) */}
                    {selectedType === 'AVENANT' && (
                      <div>
                        <label htmlFor="montantHTGagePrecedemment" className="block text-sm font-medium text-gray-700 mb-2">
                          Montant HT gagé préc. *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            {...register('montantHTGagePrecedemment', { valueAsNumber: true })}
                            className="block w-full h-12 px-4 pr-8 rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all"
                            placeholder="0.00"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <span className="text-gray-400 text-sm font-medium">€</span>
                          </div>
                        </div>
                        {errors.montantHTGagePrecedemment && (
                          <p className="mt-1 text-sm text-red-600">{errors.montantHTGagePrecedemment.message}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Troisième ligne : Avocat et Diligences */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Avocat */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Avocat *
                      </label>
                      <select
                        {...register('avocatId')}
                        className="block w-full h-12 px-4 rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all"
                      >
                        <option value="">Sélectionner un avocat</option>
                        {avocats.map((avocat: any) => (
                          <option key={avocat.id} value={avocat.id}>
                            {avocat.prenom} {avocat.nom} - {avocat.region}
                          </option>
                        ))}
                      </select>
                      {errors.avocatId && (
                        <p className="mt-1 text-sm text-red-600">{errors.avocatId.message}</p>
                      )}
                    </div>

                    {/* Diligences */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Diligence
                      </label>
                      <select
                        {...register('diligenceId')}
                        className="block w-full h-12 px-4 rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all"
                      >
                        <option value="">Aucune diligence spécifique</option>
                        {diligences.map((diligence: any) => (
                          <option key={diligence.id} value={diligence.id}>
                            {diligence.nom}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Quatrième ligne : Décisions */}
                  <div>
                    {/* Décisions à inclure */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Décisions concernées *
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleSelectAllDecisions}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            Tout sélectionner
                          </button>
                          <button
                            type="button"
                            onClick={handleDeselectAllDecisions}
                            className="text-xs text-gray-600 hover:text-gray-800 underline"
                          >
                            Tout désélectionner
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-2 border-gray-200 rounded-lg p-4 shadow-sm transition-all h-[200px]">
                        <div className="h-full overflow-y-auto">
                          {dossier.decisions.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">
                              Aucune décision disponible dans ce dossier
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {dossier.decisions.map((decision) => (
                                <label key={decision.id} className="flex items-center space-x-3 p-3 rounded-lg bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedDecisionIds.includes(decision.id)}
                                    onChange={() => handleDecisionToggle(decision.id)}
                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-900 text-sm">
                                        {getDecisionTypeLabel(decision.type)}
                                      </span>
                                      {(decision as any).numero && (
                                        <span className="text-xs text-gray-500">
                                          N° {(decision as any).numero}
                                        </span>
                                      )}
                                    </div>
                                    {decision.demandes && decision.demandes.length > 0 && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        {decision.demandes.length} demandeur(s)
                                      </div>
                                    )}
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {errors.decisionIds && (
                        <p className="mt-1 text-sm text-red-600">{errors.decisionIds.message}</p>
                      )}
                      <p className="mt-2 text-xs text-gray-500">
                        {selectedDecisionIds.length} décision(s) sélectionnée(s) sur {dossier.decisions.length} dans le dossier
                      </p>
                    </div>
                  </div>

                  {/* Cinquième ligne : Demandeurs concernés */}
                  {selectedDecisionIds.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Demandeurs concernés *
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleSelectAllDemandeurs}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                            disabled={availableDemandeurs.length === 0}
                          >
                            Tout sélectionner
                          </button>
                          <button
                            type="button"
                            onClick={handleDeselectAllDemandeurs}
                            className="text-xs text-gray-600 hover:text-gray-800 underline"
                          >
                            Tout désélectionner
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-emerald-100 hover:from-green-100 hover:to-emerald-200 border-2 border-green-200 rounded-lg p-4 shadow-sm transition-all h-[200px]">
                        <div className="h-full overflow-y-auto">
                          {availableDemandeurs.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">
                              Sélectionnez d'abord une ou plusieurs décisions
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {availableDemandeurs.map((demandeRel) => (
                                <label key={demandeRel.demandeId} className="flex items-center space-x-3 p-3 rounded-lg bg-white border border-green-200 shadow-sm hover:shadow-md transition-all cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedDemandeIds.includes(demandeRel.demandeId)}
                                    onChange={() => handleDemandeToggle(demandeRel.demandeId)}
                                    className="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-900 text-sm">
                                        {demandeRel.demande.grade && `${demandeRel.demande.grade} `}
                                        {demandeRel.demande.prenom} {demandeRel.demande.nom}
                                      </span>
                                      {demandeRel.demande.numeroDS && (
                                        <span className="text-xs text-gray-500">
                                          N° {demandeRel.demande.numeroDS}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {demandeRel.demande.type === 'VICTIME' ? 'Victime' : 'Mis en cause'}
                                    </div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {errors.demandeIds && (
                        <p className="mt-1 text-sm text-red-600">{errors.demandeIds.message}</p>
                      )}
                      <p className="mt-2 text-xs text-gray-500">
                        {selectedDemandeIds.length} demandeur(s) sélectionné(s) sur {availableDemandeurs.length} disponible(s)
                      </p>
                    </div>
                  )}

                  {/* Sixième ligne : Date de retour signée */}
                  <div>
                    <label htmlFor="dateRetourSigne" className="block text-sm font-medium text-gray-700 mb-2">
                      Date de retour signée
                    </label>
                    <input
                      type="date"
                      {...register('dateRetourSigne')}
                      className="block w-full h-12 px-4 rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Laissez vide si pas encore signée
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-6 border-t mt-8">
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn-secondary"
                      disabled={isSubmitting}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Création...' : 'Créer la convention'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default CreateConventionModal