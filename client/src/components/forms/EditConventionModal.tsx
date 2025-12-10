import React, { useEffect, useState } from 'react'
import { Dialog, Transition, Listbox } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { XMarkIcon, DocumentTextIcon, ChevronUpDownIcon, CheckIcon, PencilIcon } from '@heroicons/react/24/outline'
import { Dossier } from '@/types'
import api from '@/utils/api'
import { showHighAmountConventionToast } from '@/utils/toasts'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'

dayjs.locale('fr')

const editConventionSchema = z.object({
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
  montantHT: z.number({
    required_error: "Le montant HT est requis",
    invalid_type_error: "Le montant HT est requis"
  }).positive("Le montant HT doit être positif"),
  montantHTGagePrecedemment: z.number({
    required_error: "Le montant HT gagé précédemment est requis",
    invalid_type_error: "Le montant HT gagé précédemment est requis"
  }).positive("Le montant HT gagé précédemment doit être positif").optional().nullable(),
  typeFacturation: z.enum(['FORFAITAIRE', 'DEMI_JOURNEE', 'ASSISES']).optional(),
  avocatId: z.string().min(1, "L'avocat est requis"),
  diligenceId: z.string().min(1, "La diligence est requise"),
  decisionIds: z.array(z.string()).min(1, "Au moins une décision doit être sélectionnée"),
  demandeIds: z.array(z.string()).min(1, "Au moins un demandeur doit être sélectionné")
})

type EditConventionFormData = z.infer<typeof editConventionSchema>

interface Convention {
  id: string
  type: 'CONVENTION' | 'AVENANT'
  victimeOuMisEnCause: 'VICTIME' | 'MIS_EN_CAUSE'
  instance: string
  montantHT: number
  montantHTGagePrecedemment?: number | null
  typeFacturation?: 'FORFAITAIRE' | 'DEMI_JOURNEE' | 'ASSISES' | null
  dateRetourSigne?: string | null
  createdAt: string
  updatedAt: string
  avocat: {
    id: string
    prenom: string
    nom: string
    region?: string
  }
  diligences?: Array<{
    diligence: {
      id: string
      nom: string
      details?: string
    }
  }>
  decisions: Array<{
    decision: {
      id: string
      type: string
      numero?: string
    }
  }>
  demandes: Array<{
    demande: {
      id: string
      prenom: string
      nom: string
      numeroDS?: string
      type: 'VICTIME' | 'MIS_EN_CAUSE'
      grade?: {
        gradeAbrege: string
      }
    }
  }>
}

interface EditConventionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  convention: Convention | null
  dossier: Dossier
}

const EditConventionModal: React.FC<EditConventionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  convention,
  dossier
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    watch
  } = useForm<EditConventionFormData>({
    resolver: zodResolver(editConventionSchema)
  })

  const selectedType = watch('type')
  const selectedVictimeOuMisEnCause = watch('victimeOuMisEnCause')
  const selectedTypeFacturation = watch('typeFacturation')
  const selectedDecisionIds = watch('decisionIds') || []
  const selectedDemandeIds = watch('demandeIds') || []

  // States for Listbox selections
  const [selectedInstance, setSelectedInstance] = useState<string>('')
  const [selectedAvocat, setSelectedAvocat] = useState<any>(null)
  const [selectedDiligence, setSelectedDiligence] = useState<any>(null)
  const [avocatSearchQuery, setAvocatSearchQuery] = useState('')
  const [showAvocatDropdown, setShowAvocatDropdown] = useState(false)
  const [selectedAvocatIndex, setSelectedAvocatIndex] = useState(-1)

  // Fetch avocats
  const { data: avocats = [] } = useQuery({
    queryKey: ['avocats-active'],
    queryFn: async () => {
      const response = await api.get('/avocats')
      return response.data.filter((avocat: any) => avocat.active)
    },
    enabled: isOpen
  })

  // Fetch diligences
  const { data: diligences = [] } = useQuery({
    queryKey: ['diligences-active'],
    queryFn: async () => {
      const response = await api.get('/diligences')
      return response.data.filter((diligence: any) => diligence.active)
    },
    enabled: isOpen
  })

  // Filter avocats based on search query
  const filteredAvocats = avocats.filter((avocat: any) =>
    `${avocat.prenom} ${avocat.nom}`.toLowerCase().includes(avocatSearchQuery.toLowerCase()) ||
    avocat.nom.toLowerCase().includes(avocatSearchQuery.toLowerCase())
  )

  // Initialize form with convention data
  useEffect(() => {
    if (isOpen && convention) {
      // Set form values
      reset({
        type: convention.type,
        victimeOuMisEnCause: convention.victimeOuMisEnCause,
        instance: convention.instance as any,
        montantHT: convention.montantHT,
        montantHTGagePrecedemment: convention.montantHTGagePrecedemment,
        typeFacturation: convention.typeFacturation || undefined,
        avocatId: convention.avocat.id,
        diligenceId: convention.diligences?.[0]?.diligence?.id || '',
        decisionIds: convention.decisions.map(d => d.decision.id),
        demandeIds: convention.demandes.map(d => d.demande.id)
      })

      // Set Listbox states
      setSelectedInstance(convention.instance)
      setSelectedAvocat(convention.avocat)
      setSelectedDiligence(convention.diligences?.[0]?.diligence || null)
      setAvocatSearchQuery(`${convention.avocat.prenom} ${convention.avocat.nom}`)
      setShowAvocatDropdown(false)
      setSelectedAvocatIndex(-1)
    }
  }, [isOpen, convention, reset])

  // Auto-fill when avocat is selected
  useEffect(() => {
    if (selectedAvocat) {
      setAvocatSearchQuery(`${selectedAvocat.prenom} ${selectedAvocat.nom}`)
    }
  }, [selectedAvocat])

  // Clear montantHTGagePrecedemment when switching to CONVENTION
  React.useEffect(() => {
    if (selectedType === 'CONVENTION') {
      setValue('montantHTGagePrecedemment', undefined)
    }
  }, [selectedType, setValue])

  const handleFormSubmit = async (data: EditConventionFormData) => {
    try {
      const cleanedData = {
        id: convention?.id,
        type: data.type,
        victimeOuMisEnCause: data.victimeOuMisEnCause,
        instance: data.instance,
        montantHT: data.montantHT,
        montantHTGagePrecedemment: data.type === 'AVENANT' ? data.montantHTGagePrecedemment : undefined,
        typeFacturation: data.typeFacturation || undefined,
        dossierId: dossier.id,
        avocatId: data.avocatId,
        demandes: data.demandeIds,
        diligences: data.diligenceId ? [data.diligenceId] : [],
        decisions: data.decisionIds
      }

      await onSubmit(cleanedData)

      // Toast supplémentaire pour les conventions > 3000€ HT
      if (data.montantHT > 2999) {
        showHighAmountConventionToast()
      }

      onClose()
    } catch (error) {
      console.error('Erreur lors de la modification:', error)
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
  }, [selectedDecisionIds, setValue, availableDemandeurs, selectedDemandeIds])

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

  const getTypeFacturationLabel = (type: string) => {
    switch (type) {
      case 'FORFAITAIRE':
        return 'Forfaitaire'
      case 'DEMI_JOURNEE':
        return 'Par demi-journée'
      case 'ASSISES':
        return 'Assises'
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

  const getSelectedButtonStyle = (type: string) => {
    switch (type) {
      case 'CONVENTION':
        return 'border-blue-500 bg-blue-100 hover:bg-blue-200 text-blue-900'
      case 'AVENANT':
        return 'border-orange-500 bg-orange-100 hover:bg-orange-200 text-orange-900'
      case 'VICTIME':
        return 'border-sky-500 bg-sky-100 hover:bg-sky-200 text-sky-900'
      case 'MIS_EN_CAUSE':
        return 'border-amber-500 bg-amber-100 hover:bg-amber-200 text-amber-900'
      case 'FORFAITAIRE':
        return 'border-emerald-500 bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
      case 'DEMI_JOURNEE':
        return 'border-purple-500 bg-purple-100 hover:bg-purple-200 text-purple-900'
      case 'ASSISES':
        return 'border-red-500 bg-red-100 hover:bg-red-200 text-red-900'
      default:
        return 'border-blue-500 bg-blue-100 hover:bg-blue-200 text-blue-900'
    }
  }

  const getUnselectedButtonStyle = (type: string) => {
    switch (type) {
      case 'CONVENTION':
        return 'border-blue-200 bg-blue-100 hover:bg-blue-200 text-blue-800'
      case 'AVENANT':
        return 'border-orange-200 bg-orange-100 hover:bg-orange-200 text-orange-800'
      case 'VICTIME':
        return 'border-sky-200 bg-sky-100 hover:bg-sky-200 text-sky-800'
      case 'MIS_EN_CAUSE':
        return 'border-amber-200 bg-amber-100 hover:bg-amber-200 text-amber-800'
      case 'FORFAITAIRE':
        return 'border-emerald-200 bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
      case 'DEMI_JOURNEE':
        return 'border-purple-200 bg-purple-100 hover:bg-purple-200 text-purple-800'
      case 'ASSISES':
        return 'border-red-200 bg-red-100 hover:bg-red-200 text-red-800'
      default:
        return 'border-gray-200 bg-gray-100 hover:bg-gray-200 text-gray-700'
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'CONVENTION':
        return 'bg-blue-100 text-blue-800'
      case 'AVENANT':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
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

  if (!convention) return null

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
                    Modifier la convention d&apos;honoraires - Dossier {dossier.numero}
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Current convention info */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100 mb-6">
                  <div className="flex items-center mb-2">
                    <DocumentTextIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <h4 className="text-sm font-semibold text-gray-900">Convention actuelle</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getTypeBadgeColor(convention.type)}`}>
                      {convention.type}
                    </span>
                    <span className="text-sm text-gray-600">
                      {getVictimeMecLabel(convention.victimeOuMisEnCause)}
                    </span>
                    <span className="text-sm text-gray-600">
                      {convention.montantHT}€ HT
                    </span>
                    <span className="text-sm text-gray-600">
                      Créée le {dayjs(convention.createdAt).format('DD/MM/YYYY')}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                  {/* Informations générales */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Informations générales</h3>
                  </div>
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
                            className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all min-h-[4rem] flex items-center justify-center shadow-sm ${
                              selectedType === type
                                ? getSelectedButtonStyle(type)
                                : getUnselectedButtonStyle(type)
                            }`}
                          >
                            <span className="text-sm font-medium leading-tight">
                              {type}
                            </span>
                          </button>
                        ))}
                      </div>
                      {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
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
                            className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all min-h-[4rem] flex items-center justify-center shadow-sm ${
                              selectedVictimeOuMisEnCause === type
                                ? getSelectedButtonStyle(type)
                                : getUnselectedButtonStyle(type)
                            }`}
                          >
                            <span className="text-sm font-medium leading-tight">
                              {getVictimeMecLabel(type)}
                            </span>
                          </button>
                        ))}
                      </div>
                      {errors.victimeOuMisEnCause && <p className="text-red-500 text-xs mt-1">{errors.victimeOuMisEnCause.message}</p>}
                    </div>
                  </div>

                  {/* Deuxième ligne : Instance et Montants */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Instance */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Instance judiciaire *
                      </label>
                      <Listbox 
                        value={selectedInstance} 
                        onChange={(instance) => {
                          setSelectedInstance(instance)
                          setValue('instance', instance as any)
                        }}
                      >
                        <div className="relative">
                          <Listbox.Button className={`relative w-full cursor-default rounded-lg bg-white py-3 pl-3 pr-10 text-left shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all ${
                            errors.instance ? 'border-red-300' : 'border-gray-200'
                          }`}>
                            <span className="block truncate">
                              {selectedInstance || 'Sélectionner une instance'}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
                            </span>
                          </Listbox.Button>
                          <Transition
                            as={React.Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              <Listbox.Option
                                value=""
                                className={({ active }) =>
                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                                  }`
                                }
                              >
                                {({ selected }) => (
                                  <>
                                    <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                      Sélectionner une instance
                                    </span>
                                    {selected ? (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </Listbox.Option>
                              {instances.map((instance) => (
                                <Listbox.Option
                                  key={instance}
                                  value={instance}
                                  className={({ active }) =>
                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                      active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                                    }`
                                  }
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                        {instance}
                                      </span>
                                      {selected ? (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                      ) : null}
                                    </>
                                  )}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </Listbox>
                      {errors.instance && <p className="text-red-500 text-xs mt-1">{errors.instance.message}</p>}
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
                      {errors.montantHT && <p className="text-red-500 text-xs mt-1">{errors.montantHT.message}</p>}
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
                        {errors.montantHTGagePrecedemment && <p className="text-red-500 text-xs mt-1">{errors.montantHTGagePrecedemment.message}</p>}
                      </div>
                    )}
                  </div>

                  {/* Type de facturation */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Type de facturation</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de facturation
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {(['FORFAITAIRE', 'DEMI_JOURNEE', 'ASSISES'] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setValue('typeFacturation', type)}
                            className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all min-h-[4rem] flex items-center justify-center shadow-sm ${
                              selectedTypeFacturation === type
                                ? getSelectedButtonStyle(type)
                                : getUnselectedButtonStyle(type)
                            }`}
                          >
                            <span className="text-sm font-medium leading-tight">
                              {getTypeFacturationLabel(type)}
                            </span>
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Ce champ détermine le texte qui suivra le montant en lettres dans le document généré
                      </p>
                      {convention.typeFacturation && (
                        <p className="mt-1 text-xs text-blue-600">
                          Actuellement : {getTypeFacturationLabel(convention.typeFacturation)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bénéficiaire */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Bénéficiaire</h3>
                  </div>

                  {/* Troisième ligne : Avocat et Diligences */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Avocat */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Avocat *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={avocatSearchQuery}
                          onChange={(e) => {
                            setAvocatSearchQuery(e.target.value)
                            setShowAvocatDropdown(true)
                            setSelectedAvocatIndex(-1)
                            if (!e.target.value) {
                              setSelectedAvocat(null)
                              setValue('avocatId', '')
                            }
                          }}
                          onKeyDown={(e) => {
                            if (!showAvocatDropdown || filteredAvocats.length === 0) return

                            switch (e.key) {
                              case 'ArrowDown':
                                e.preventDefault()
                                setSelectedAvocatIndex(prev =>
                                  prev < filteredAvocats.length - 1 ? prev + 1 : 0
                                )
                                break
                              case 'ArrowUp':
                                e.preventDefault()
                                setSelectedAvocatIndex(prev =>
                                  prev > 0 ? prev - 1 : filteredAvocats.length - 1
                                )
                                break
                              case 'Enter':
                                e.preventDefault()
                                if (selectedAvocatIndex >= 0 && selectedAvocatIndex < filteredAvocats.length) {
                                  const avocat = filteredAvocats[selectedAvocatIndex]
                                  setSelectedAvocat(avocat)
                                  setValue('avocatId', avocat.id)
                                  setShowAvocatDropdown(false)
                                  setSelectedAvocatIndex(-1)
                                }
                                break
                              case 'Escape':
                                e.preventDefault()
                                setShowAvocatDropdown(false)
                                setSelectedAvocatIndex(-1)
                                break
                            }
                          }}
                          onFocus={() => {
                            setShowAvocatDropdown(true)
                            setSelectedAvocatIndex(-1)
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              setShowAvocatDropdown(false)
                              setSelectedAvocatIndex(-1)
                            }, 200)
                          }}
                          placeholder="Rechercher un avocat par nom..."
                          className={`block w-full h-12 px-4 pr-10 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all ${
                            errors.avocatId ? 'border-red-300' : 'border-gray-200'
                          }`}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        
                        {showAvocatDropdown && avocatSearchQuery && (
                          <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {filteredAvocats.length > 0 ? (
                              filteredAvocats.map((avocat: any, index: number) => (
                                <div
                                  key={avocat.id}
                                  onClick={() => {
                                    setSelectedAvocat(avocat)
                                    setValue('avocatId', avocat.id)
                                    setShowAvocatDropdown(false)
                                    setSelectedAvocatIndex(-1)
                                  }}
                                  className={`cursor-pointer select-none py-2 pl-3 pr-4 text-gray-900 ${
                                    index === selectedAvocatIndex
                                      ? 'bg-blue-100 text-blue-900'
                                      : 'hover:bg-blue-100 hover:text-blue-900'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="block truncate">
                                      {avocat.prenom} {avocat.nom}
                                    </span>
                                    {avocat.region && (
                                      <span className="text-sm text-gray-500">
                                        ({avocat.region})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="py-2 pl-3 pr-4 text-gray-500">
                                Aucun avocat trouvé
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {errors.avocatId && <p className="text-red-500 text-xs mt-1">{errors.avocatId.message}</p>}
                      {selectedAvocat && (
                        <p className="text-sm text-green-600 mt-1">
                          ✓ {selectedAvocat.prenom} {selectedAvocat.nom} {selectedAvocat.region && `(${selectedAvocat.region})`}
                        </p>
                      )}
                    </div>

                    {/* Diligences */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Diligence *
                      </label>
                      <Listbox
                        value={selectedDiligence}
                        onChange={(diligence) => {
                          setSelectedDiligence(diligence)
                          setValue('diligenceId', diligence?.id || '')
                        }}
                      >
                        <div className="relative">
                          <Listbox.Button className={`relative w-full cursor-default rounded-lg bg-white py-3 pl-3 pr-10 text-left shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all ${
                            errors.diligenceId ? 'border-red-300' : 'border-gray-200'
                          }`}>
                            <span className="block truncate">
                              {selectedDiligence ? selectedDiligence.nom : 'Sélectionner une diligence'}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
                            </span>
                          </Listbox.Button>
                          <Transition
                            as={React.Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {diligences.map((diligence: any) => (
                                <Listbox.Option
                                  key={diligence.id}
                                  value={diligence}
                                  className={({ active }) =>
                                    `relative cursor-default select-none py-3 pl-10 pr-4 ${
                                      active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                                    }`
                                  }
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={`block break-words ${selected ? 'font-medium' : 'font-normal'}`}>
                                        {diligence.nom}
                                      </span>
                                      {selected ? (
                                        <span className="absolute top-3 left-0 flex items-center pl-3 text-blue-600">
                                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                      ) : null}
                                    </>
                                  )}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </Listbox>
                      {errors.diligenceId && <p className="text-red-500 text-xs mt-1">{errors.diligenceId.message}</p>}
                    </div>
                  </div>

                  {/* Décisions */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Décisions associées</h3>
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
                      
                      {errors.decisionIds && <p className="text-red-500 text-xs mt-1">{errors.decisionIds.message}</p>}
                      <p className="mt-2 text-xs text-gray-500">
                        {selectedDecisionIds.length} décision(s) sélectionnée(s) sur {dossier.decisions.length} dans le dossier
                      </p>
                    </div>
                  </div>

                  {/* Demandeurs */}
                  {selectedDecisionIds.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Demandeurs concernés</h3>
                    </div>
                  )}

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
                              Sélectionnez d&apos;abord une ou plusieurs décisions
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
                                        {demandeRel.demande.grade?.gradeAbrege && `${demandeRel.demande.grade.gradeAbrege} `}
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
                      
                      {errors.demandeIds && <p className="text-red-500 text-xs mt-1">{errors.demandeIds.message}</p>}
                      <p className="mt-2 text-xs text-gray-500">
                        {selectedDemandeIds.length} demandeur(s) sélectionné(s) sur {availableDemandeurs.length} disponible(s)
                      </p>
                    </div>
                  )}



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
                      {isSubmitting ? 'Modification...' : 'Modifier la convention'}
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

export default EditConventionModal