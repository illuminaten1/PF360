import React, { useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { XMarkIcon, PencilIcon, ScaleIcon } from '@heroicons/react/24/outline'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'

dayjs.locale('fr')

const decisionEditSchema = z.object({
  type: z.enum(['AJ', 'AJE', 'PJ', 'REJET'], {
    required_error: "Le type de décision est requis"
  }),
  numero: z.string().regex(/^\d+$/, "Le numéro de décision doit être un nombre entier").min(1, "Le numéro de décision est requis"),
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
  createdAt: string
  updatedAt: string
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
  onSubmit: (data: any) => Promise<void>
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
    watch
  } = useForm<DecisionEditFormData>({
    resolver: zodResolver(decisionEditSchema)
  })

  const selectedType = watch('type')

  useEffect(() => {
    if (isOpen && decision) {
      // Initialize form with decision values
      reset({
        type: decision.type as 'AJ' | 'AJE' | 'PJ' | 'REJET',
        numero: decision.numero || '',
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
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
                  {/* Numéro de décision et Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    {/* Type de décision */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de décision *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['AJ', 'AJE', 'PJ', 'REJET'] as const).map((type) => (
                          <label key={type} className="relative">
                            <input
                              type="radio"
                              value={type}
                              {...register('type')}
                              className="sr-only"
                            />
                            <div className={`cursor-pointer rounded-lg border-2 p-2 text-center transition-all h-12 flex items-center justify-center ${
                              selectedType === type
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(type)}`}>
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
                  </div>


                  {/* Demandes concernées (read-only) */}
                  {decision.demandes && decision.demandes.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Demandes concernées
                      </label>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                        <div className="space-y-2">
                          {decision.demandes.map((demandeRel, index) => (
                            <div key={index} className="bg-white p-2 rounded-lg border border-gray-200 flex items-center">
                              <span className="font-medium text-gray-900">
                                {demandeRel.demande.grade && `${demandeRel.demande.grade} `}
                                {demandeRel.demande.prenom} {demandeRel.demande.nom}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Les demandes concernées ne peuvent pas être modifiées après la création de la décision.
                      </p>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        Date d'envoi
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

                  {/* Note d'information */}
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-amber-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-amber-900 mb-1">
                          À propos de la modification
                        </h4>
                        <div className="text-sm text-amber-800 space-y-1">
                          <p>• Seul le type et les dates peuvent être modifiés</p>
                          <p>• Les demandes concernées restent inchangées</p>
                          <p>• Cette action sera tracée dans l'historique</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-6 border-t">
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