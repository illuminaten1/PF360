import React, { useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { XMarkIcon, DocumentIcon, ScaleIcon } from '@heroicons/react/24/outline'
import { Dossier, Visa } from '@/types'
import api from '@/utils/api'

const generateDecisionSchema = z.object({
  type: z.enum(['AJ', 'AJE', 'PJ', 'REJET'], {
    required_error: "Le type de décision est requis"
  }),
  numero: z.string().regex(/^\d+$/, "Le numéro de décision doit être un nombre entier").min(1, "Le numéro de décision est requis"),
  visaId: z.string().min(1, "Le visa est requis"),
  avis_hierarchiques: z.boolean().default(false),
  typeVictMec: z.enum(['VICTIME', 'MIS_EN_CAUSE']).optional(),
  considerant: z.string().optional(),
  dateSignature: z.string().optional(),
  dateEnvoi: z.string().optional(),
  demandeIds: z.array(z.string()).min(1, "Au moins une demande doit être sélectionnée")
})

type GenerateDecisionFormData = z.infer<typeof generateDecisionSchema>

interface GenerateDecisionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  dossier: Dossier
}

const GenerateDecisionModal: React.FC<GenerateDecisionModalProps> = ({
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
  } = useForm<GenerateDecisionFormData>({
    resolver: zodResolver(generateDecisionSchema)
  })

  const selectedType = watch('type')
  const selectedDemandeIds = watch('demandeIds') || []
  const selectedAvisHierarchiques = watch('avis_hierarchiques')
  const selectedTypeVictMec = watch('typeVictMec')

  // Fetch visas
  const { data: visas = [] } = useQuery<Visa[]>({
    queryKey: ['visas-active'],
    queryFn: async () => {
      const response = await api.get('/visa')
      return response.data.filter((visa: Visa) => visa.active)
    }
  })

  useEffect(() => {
    if (isOpen && dossier) {
      // Initialize form with default values
      reset({
        type: 'AJ',
        numero: '',
        visaId: '',
        avis_hierarchiques: false,
        typeVictMec: undefined,
        considerant: '',
        dateSignature: '',
        dateEnvoi: '',
        demandeIds: []
      })
    }
  }, [isOpen, dossier, reset])

  const handleFormSubmit = async (data: GenerateDecisionFormData) => {
    try {
      const cleanedData = {
        type: data.type,
        numero: data.numero,
        visaId: data.visaId,
        avis_hierarchiques: data.avis_hierarchiques,
        typeVictMec: data.typeVictMec,
        considerant: data.considerant,
        dateSignature: data.dateSignature ? new Date(data.dateSignature).toISOString() : undefined,
        dateEnvoi: data.dateEnvoi ? new Date(data.dateEnvoi).toISOString() : undefined,
        dossierId: dossier.id,
        demandeIds: data.demandeIds
      }

      await onSubmit(cleanedData)
      onClose()
    } catch (error) {
      console.error('Erreur lors de la génération:', error)
    }
  }

  const handleDemandeToggle = (demandeId: string) => {
    const currentIds = selectedDemandeIds || []
    const newIds = currentIds.includes(demandeId)
      ? currentIds.filter(id => id !== demandeId)
      : [...currentIds, demandeId]
    setValue('demandeIds', newIds)
  }

  const handleSelectAllDemandes = () => {
    const allDemandeIds = dossier.demandes.map(d => d.id)
    setValue('demandeIds', allDemandeIds)
  }

  const handleDeselectAllDemandes = () => {
    setValue('demandeIds', [])
  }

  const getTypeLabel = (type: string) => {
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

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'AJ':
        return 'bg-green-100 text-green-800'
      case 'AJE':
        return 'bg-blue-100 text-blue-800'
      case 'PJ':
        return 'bg-purple-100 text-purple-800'
      case 'REJET':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                    <ScaleIcon className="h-6 w-6 mr-2 text-blue-600" />
                    Générer une décision - Dossier {dossier.numero}
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
                  {/* Première ligne complète : Type de décision */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Type de décision *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(['AJ', 'AJE', 'PJ', 'REJET'] as const).map((type) => (
                        <label key={type} className="relative">
                          <input
                            type="radio"
                            value={type}
                            {...register('type')}
                            className="sr-only"
                          />
                          <div className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all h-16 flex items-center justify-center ${
                            selectedType === type
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(type)}`}>
                              {getTypeLabel(type)}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                    {errors.type && (
                      <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                    )}
                  </div>

                  {/* Deuxième ligne : Numéro de décision et Type victime/mis en cause */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Numéro de décision */}
                    <div>
                      <label htmlFor="numero" className="block text-sm font-medium text-gray-700 mb-2">
                        Numéro de décision *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          {...register('numero')}
                          className="block w-full h-16 px-4 rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-lg font-semibold text-center text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="123"
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <span className="text-gray-400 text-sm font-medium">N°</span>
                        </div>
                      </div>
                      {errors.numero && (
                        <p className="mt-1 text-sm text-red-600">{errors.numero.message}</p>
                      )}
                    </div>

                    {/* Type Victime/Mis en cause */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Type de personne
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setValue('typeVictMec', 'VICTIME')}
                          className={`rounded-lg border-2 p-4 text-center transition-all h-16 flex items-center justify-center ${
                            selectedTypeVictMec === 'VICTIME'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
                            Victime
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setValue('typeVictMec', 'MIS_EN_CAUSE')}
                          className={`rounded-lg border-2 p-4 text-center transition-all h-16 flex items-center justify-center ${
                            selectedTypeVictMec === 'MIS_EN_CAUSE'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Mis en cause
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Troisième ligne : Visa et Avis hiérarchiques */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Visa */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Visa à utiliser *
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {visas.length === 0 ? (
                          <div className="col-span-2 bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500">
                            Aucun visa disponible
                          </div>
                        ) : (
                          ['CIVIL', 'MILITAIRE'].map((typeVisa) => {
                            const visaOfType = visas.find(v => v.typeVisa === typeVisa)
                            const isSelected = visaOfType && watch('visaId') === visaOfType.id
                            
                            return (
                              <label key={typeVisa} className={`relative ${
                                !visaOfType ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                              }`}>
                                <input
                                  type="radio"
                                  value={visaOfType?.id || ''}
                                  {...register('visaId')}
                                  disabled={!visaOfType}
                                  className="sr-only"
                                />
                                <div className={`rounded-lg border-2 p-4 text-center transition-all h-16 flex items-center justify-center ${
                                  isSelected
                                    ? 'border-blue-500 bg-blue-50'
                                    : visaOfType 
                                      ? 'border-gray-200 hover:border-gray-300'
                                      : 'border-gray-100 bg-gray-50'
                                }`}>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    typeVisa === 'CIVIL' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-orange-100 text-orange-800'
                                  }`}>
                                    {typeVisa}
                                  </span>
                                </div>
                              </label>
                            )
                          })
                        )}
                      </div>
                      {errors.visaId && (
                        <p className="mt-1 text-sm text-red-600">{errors.visaId.message}</p>
                      )}
                    </div>

                    {/* Avis hiérarchiques */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Avis hiérarchiques
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setValue('avis_hierarchiques', false)}
                          className={`rounded-lg border-2 p-4 text-center transition-all h-16 flex items-center justify-center ${
                            selectedAvisHierarchiques === false
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Non
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setValue('avis_hierarchiques', true)}
                          className={`rounded-lg border-2 p-4 text-center transition-all h-16 flex items-center justify-center ${
                            selectedAvisHierarchiques === true
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Oui
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quatrième ligne : Demandes à inclure et Considérant */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Demandes à inclure */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Demandes à inclure dans la décision *
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleSelectAllDemandes}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            Tout sélectionner
                          </button>
                          <button
                            type="button"
                            onClick={handleDeselectAllDemandes}
                            className="text-xs text-gray-600 hover:text-gray-800 underline"
                          >
                            Tout désélectionner
                          </button>
                        </div>
                      </div>
                      
                      <div className="border border-gray-300 rounded-md p-4 h-48 overflow-y-auto bg-gray-50">
                        {dossier.demandes.length === 0 ? (
                          <p className="text-gray-500 text-sm text-center py-4">
                            Aucune demande disponible dans ce dossier
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {dossier.demandes.map((demande) => (
                              <label key={demande.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition-colors cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedDemandeIds.includes(demande.id)}
                                  onChange={() => handleDemandeToggle(demande.id)}
                                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 text-sm">
                                      {demande.grade && `${demande.grade} `}{demande.prenom} {demande.nom}
                                    </span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      demande.type === 'VICTIME' ? 'bg-sky-100 text-sky-800' : 'bg-orange-100 text-orange-800'
                                    }`}>
                                      {demande.type.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      {errors.demandeIds && (
                        <p className="mt-1 text-sm text-red-600">{errors.demandeIds.message}</p>
                      )}
                      {selectedDemandeIds.length > 0 && (
                        <p className="mt-2 text-sm text-blue-600">
                          {selectedDemandeIds.length} demande(s) sélectionnée(s) sur {dossier.demandes.length} dans le dossier
                        </p>
                      )}
                    </div>

                    {/* Considérant */}
                    <div>
                      <label htmlFor="considerant" className="block text-sm font-medium text-gray-700 mb-2">
                        Considérant
                      </label>
                      <textarea
                        {...register('considerant')}
                        rows={8}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 resize-none"
                        placeholder="Texte du considérant de la décision..."
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Optionnel - Texte explicatif pour justifier la décision
                      </p>
                    </div>
                  </div>

                  {/* Dernière ligne complète : Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="dateSignature" className="block text-sm font-medium text-gray-700 mb-2">
                        Date de signature
                      </label>
                      <input
                        type="date"
                        {...register('dateSignature')}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Laissez vide pour remplir plus tard
                      </p>
                    </div>

                    <div>
                      <label htmlFor="dateEnvoi" className="block text-sm font-medium text-gray-700 mb-2">
                        Date d'envoi
                      </label>
                      <input
                        type="date"
                        {...register('dateEnvoi')}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Laissez vide pour remplir plus tard
                      </p>
                    </div>
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
                      {isSubmitting ? 'Génération...' : 'Générer la décision'}
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

export default GenerateDecisionModal