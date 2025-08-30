import React, { useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { XMarkIcon, PencilIcon, ScaleIcon } from '@heroicons/react/24/outline'
import { Visa } from '@/types'
import api from '@/utils/api'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'

dayjs.locale('fr')

const decisionEditSchema = z.object({
  type: z.enum(['AJ', 'AJE', 'PJ', 'REJET'], {
    required_error: "Le type de décision est requis"
  }),
  numero: z.string().regex(/^\d+$/, "Le numéro de décision doit être un nombre entier").min(1, "Le numéro de décision est requis"),
  visaId: z.string().min(1, "Le visa est requis"),
  avis_hierarchiques: z.boolean().default(false),
  typeVictMec: z.enum(['VICTIME', 'MIS_EN_CAUSE']).optional(),
  considerant: z.string().optional(),
  dateSignature: z.string().optional(),
  dateEnvoi: z.string().optional()
})

type DecisionEditFormData = z.infer<typeof decisionEditSchema>

interface Decision {
  id: string
  type: string
  numero?: string
  date?: string
  dateSignature?: string
  dateEnvoi?: string
  avis_hierarchiques?: boolean
  typeVictMec?: 'VICTIME' | 'MIS_EN_CAUSE'
  considerant?: string
  createdAt: string
  updatedAt: string
  visa?: {
    id: string
    typeVisa: string
  }
  creePar?: {
    id: string
    prenom: string
    nom: string
    grade?: string
  }
  modifiePar?: {
    id: string
    prenom: string
    nom: string
    grade?: string
  }
  demandes?: Array<{
    demande: {
      id: string
      prenom: string
      nom: string
      numeroDS: string
      grade?: string
    }
  }>
}

interface DecisionEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  decision: Decision | null
}

const DecisionEditModal: React.FC<DecisionEditModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  decision
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
    setValue
  } = useForm<DecisionEditFormData>({
    resolver: zodResolver(decisionEditSchema)
  })

  const selectedType = watch('type')
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
    if (isOpen && decision) {
      // Initialize form with decision values
      reset({
        type: decision.type as 'AJ' | 'AJE' | 'PJ' | 'REJET',
        numero: decision.numero || '',
        visaId: decision.visa?.id || '',
        avis_hierarchiques: decision.avis_hierarchiques || false,
        typeVictMec: decision.typeVictMec,
        considerant: decision.considerant || '',
        dateSignature: decision.dateSignature ? dayjs(decision.dateSignature).format('YYYY-MM-DD') : '',
        dateEnvoi: decision.dateEnvoi ? dayjs(decision.dateEnvoi).format('YYYY-MM-DD') : ''
      })
    }
  }, [isOpen, decision, reset])

  const handleFormSubmit = async (data: DecisionEditFormData) => {
    try {
      const cleanedData = {
        id: decision?.id,
        type: data.type,
        numero: data.numero,
        visaId: data.visaId,
        avis_hierarchiques: data.avis_hierarchiques,
        typeVictMec: data.typeVictMec,
        considerant: data.considerant,
        dateSignature: data.dateSignature ? new Date(data.dateSignature).toISOString() : null,
        dateEnvoi: data.dateEnvoi ? new Date(data.dateEnvoi).toISOString() : null
      }

      await onSubmit(cleanedData)
      onClose()
    } catch (error) {
      console.error('Erreur lors de la modification:', error)
    }
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

  if (!decision) return null

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
                    <PencilIcon className="h-6 w-6 mr-2 text-blue-600" />
                    Modifier la décision
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Current decision info */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-100 mb-6">
                  <div className="flex items-center mb-2">
                    <ScaleIcon className="h-5 w-5 text-purple-600 mr-2" />
                    <h4 className="text-sm font-semibold text-gray-900">Décision actuelle</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getTypeBadgeColor(decision.type)}`}>
                      {getTypeLabel(decision.type)}
                    </span>
                    <span className="text-sm text-gray-600">
                      Créée le {dayjs(decision.createdAt).format('DD/MM/YYYY')}
                    </span>
                    {decision.demandes && decision.demandes.length > 0 && (
                      <span className="text-sm text-gray-600">
                        {decision.demandes.length} demande(s) concernée(s)
                      </span>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                  {/* Première ligne complète : Type de décision */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          <div className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all h-16 flex items-center justify-center shadow-sm bg-gradient-to-br ${
                            selectedType === type
                              ? 'border-blue-500 from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200'
                              : 'border-gray-200 from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200'
                          }`}>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(type)}`}>
                              {getTypeLabel(type)}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                    {errors.type && (
                      <p className="mt-2 text-sm text-red-600">{errors.type.message}</p>
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de personne
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setValue('typeVictMec', 'VICTIME')}
                          className={`rounded-lg border-2 p-4 text-center transition-all h-16 flex items-center justify-center shadow-sm bg-gradient-to-br ${
                            selectedTypeVictMec === 'VICTIME'
                              ? 'border-blue-500 from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200'
                              : 'border-gray-200 from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200'
                          }`}
                        >
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
                            Victime
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setValue('typeVictMec', 'MIS_EN_CAUSE')}
                          className={`rounded-lg border-2 p-4 text-center transition-all h-16 flex items-center justify-center shadow-sm bg-gradient-to-br ${
                            selectedTypeVictMec === 'MIS_EN_CAUSE'
                              ? 'border-blue-500 from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200'
                              : 'border-gray-200 from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200'
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
                          <div className="col-span-2 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-lg p-4 text-center text-gray-500 h-16 flex items-center justify-center">
                            Aucun visa disponible
                          </div>
                        ) : (
                          ['CIVIL', 'MILITAIRE'].map((typeVisa) => {
                            const visaOfType = visas.find(v => v.typeVisa === typeVisa)
                            const isSelected = visaOfType && watch('visaId') === visaOfType.id
                            
                            return (
                              <button
                                key={typeVisa}
                                type="button"
                                onClick={() => visaOfType && setValue('visaId', visaOfType.id)}
                                disabled={!visaOfType}
                                className={`relative ${
                                  !visaOfType ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                } rounded-lg border-2 p-4 text-center transition-all h-16 flex items-center justify-center shadow-sm bg-gradient-to-br ${
                                  isSelected
                                    ? 'border-blue-500 from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200'
                                    : visaOfType 
                                      ? 'border-gray-200 from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200'
                                      : 'border-gray-100 from-gray-50 to-gray-100'
                                }`}>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  typeVisa === 'CIVIL' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-orange-100 text-orange-800'
                                }`}>
                                  {typeVisa}
                                </span>
                              </button>
                            )
                          })
                        )}
                      </div>
                      {/* Hidden input for form validation */}
                      <input type="hidden" {...register('visaId')} />
                      {errors.visaId && (
                        <p className="mt-2 text-sm text-red-600">{errors.visaId.message}</p>
                      )}
                    </div>

                    {/* Avis hiérarchiques */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Avis hiérarchiques
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setValue('avis_hierarchiques', false)}
                          className={`rounded-lg border-2 p-4 text-center transition-all h-16 flex items-center justify-center shadow-sm bg-gradient-to-br ${
                            selectedAvisHierarchiques === false
                              ? 'border-blue-500 from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200'
                              : 'border-gray-200 from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200'
                          }`}
                        >
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Non
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setValue('avis_hierarchiques', true)}
                          className={`rounded-lg border-2 p-4 text-center transition-all h-16 flex items-center justify-center shadow-sm bg-gradient-to-br ${
                            selectedAvisHierarchiques === true
                              ? 'border-blue-500 from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200'
                              : 'border-gray-200 from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200'
                          }`}
                        >
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Oui
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quatrième ligne : Demandes concernées et Considérant */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Demandes concernées */}
                    <div>
                      {decision.demandes && decision.demandes.length > 0 && (
                        <>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Demandes concernées
                          </label>
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-2 border-gray-200 rounded-lg p-4 shadow-sm transition-all h-[256px]">
                            <div className="h-full overflow-y-auto space-y-2">
                              {decision.demandes.map((demandeRel, index) => (
                                <div key={index} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                  <span className="font-medium text-gray-900 text-sm">
                                    {demandeRel.demande.grade && `${demandeRel.demande.grade} `}
                                    {demandeRel.demande.prenom} {demandeRel.demande.nom}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-gray-500">
                            Demandes incluses dans cette décision
                          </p>
                        </>
                      )}
                    </div>

                    {/* Considérant */}
                    <div>
                      <label htmlFor="considerant" className="block text-sm font-medium text-gray-700 mb-2">
                        Considérant
                      </label>
                      <div className="relative">
                        <textarea
                          {...register('considerant')}
                          className="block w-full h-[256px] px-4 py-3 rounded-lg border-2 border-gray-200 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all resize-none"
                          placeholder="Texte du considérant de la décision..."
                        />
                        <div className="absolute top-3 right-3 pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
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
                        {decision.dateSignature ? 
                          `Actuellement : ${dayjs(decision.dateSignature).format('DD/MM/YYYY')}` :
                          'Non définie actuellement'
                        }
                      </p>
                    </div>

                    <div>
                      <label htmlFor="dateEnvoi" className="block text-sm font-medium text-gray-700 mb-2">
                        Date d&apos;envoi
                      </label>
                      <input
                        type="date"
                        {...register('dateEnvoi')}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        {decision.dateEnvoi ? 
                          `Actuellement : ${dayjs(decision.dateEnvoi).format('DD/MM/YYYY')}` :
                          'Non définie actuellement'
                        }
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
                      {isSubmitting ? 'Modification...' : 'Modifier la décision'}
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

export default DecisionEditModal