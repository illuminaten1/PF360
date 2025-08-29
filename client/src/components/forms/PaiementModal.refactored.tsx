import React, { useState, useEffect } from 'react'
import { Dialog, Transition, Listbox } from '@headlessui/react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'
import { XMarkIcon, BanknotesIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline'
import { Paiement } from '@/types'
import api from '@/utils/api'

const paiementSchema = z.object({
  facture: z.string().optional(),
  montantHT: z.string().optional(),
  montantTTC: z.string().min(1, 'Le montant TTC est obligatoire')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Le montant TTC doit être un nombre positif'
    }),
  emissionTitrePerception: z.enum(['OUI', 'NON']),
  qualiteBeneficiaire: z.string().min(1, 'La qualité bénéficiaire est obligatoire'),
  identiteBeneficiaire: z.string().min(1, 'L\'identité du bénéficiaire est obligatoire'),
  dateServiceFait: z.string().optional(),
  conventionJointeFRI: z.enum(['OUI', 'NON']),
  adresseBeneficiaire: z.string().optional(),
  siretOuRidet: z.string().optional(),
  titulaireCompteBancaire: z.string().optional(),
  codeEtablissement: z.string().optional(),
  codeGuichet: z.string().optional(),
  numeroCompte: z.string().optional(),
  cleRIB: z.string().optional(),
  sgamiId: z.string().min(1, 'Le SGAMI est obligatoire'),
  avocatId: z.string().optional(),
  pceId: z.string().optional(),
  decisions: z.array(z.string()).min(1, 'Au moins une décision doit être sélectionnée')
})
  .refine((data) => {
    if (data.montantHT && (isNaN(Number(data.montantHT)) || Number(data.montantHT) <= 0)) {
      return false
    }
    return true
  }, {
    message: 'Le montant HT doit être un nombre positif',
    path: ['montantHT']
  })
  .refine((data) => {
    if (data.qualiteBeneficiaire === 'Avocat' && !data.avocatId) {
      return false
    }
    return true
  }, {
    message: 'Vous devez sélectionner un avocat',
    path: ['avocatId']
  })

type PaiementFormData = z.infer<typeof paiementSchema>

interface PaiementModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  paiement?: Paiement | null
  dossierId: string
  title?: string
}

const PaiementModal: React.FC<PaiementModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  paiement,
  dossierId,
  title = 'Nouveau paiement'
}) => {
  const [selectedSgami, setSelectedSgami] = useState<any>(null)
  const [selectedAvocat, setSelectedAvocat] = useState<any>(null)
  const [selectedPce, setSelectedPce] = useState<any>(null)
  const [avocatSearchQuery, setAvocatSearchQuery] = useState('')
  const [showAvocatDropdown, setShowAvocatDropdown] = useState(false)

  const form = useForm({
    defaultValues: {
      facture: '',
      montantHT: '',
      montantTTC: '',
      emissionTitrePerception: 'NON' as const,
      qualiteBeneficiaire: 'Avocat',
      identiteBeneficiaire: '',
      dateServiceFait: '',
      conventionJointeFRI: 'NON' as const,
      adresseBeneficiaire: '',
      siretOuRidet: '',
      titulaireCompteBancaire: '',
      codeEtablissement: '',
      codeGuichet: '',
      numeroCompte: '',
      cleRIB: '',
      sgamiId: '',
      avocatId: '',
      pceId: '',
      decisions: [] as string[]
    },
    validatorAdapter: zodValidator,
    validators: {
      onChange: paiementSchema
    },
    onSubmit: async ({ value }) => {
      const submitData: any = {
        ...value,
        montantHT: value.montantHT ? Number(value.montantHT) : null,
        montantTTC: Number(value.montantTTC),
        dossierId,
        dateServiceFait: value.dateServiceFait || null,
        avocatId: value.avocatId || null,
        pceId: value.pceId || null
      }

      if (paiement) {
        submitData.id = paiement.id
      }

      onSubmit(submitData)
    }
  })

  // Fetch SGAMIS
  const { data: sgamis = [] } = useQuery({
    queryKey: ['sgamis'],
    queryFn: async () => {
      const response = await api.get('/sgami')
      return response.data
    },
    enabled: isOpen
  })

  // Fetch avocats
  const { data: avocats = [] } = useQuery({
    queryKey: ['avocats'],
    queryFn: async () => {
      const response = await api.get('/avocats')
      return response.data
    },
    enabled: isOpen
  })

  // Fetch PCEs
  const { data: pces = [] } = useQuery({
    queryKey: ['pces'],
    queryFn: async () => {
      const response = await api.get('/pce')
      return response.data
    },
    enabled: isOpen
  })

  // Fetch decisions for the current dossier
  const { data: decisions = [] } = useQuery({
    queryKey: ['dossier-decisions', dossierId],
    queryFn: async () => {
      const response = await api.get(`/dossiers/${dossierId}`)
      return response.data.decisions || []
    },
    enabled: isOpen && !!dossierId
  })

  const qualitesBeneficiaire = [
    'Avocat',
    'Commissaire de justice',
    'Militaire de la gendarmerie nationale',
    'Régisseur du tribunal judiciaire',
    'Médecin',
    'Victime'
  ]

  const getSelectedButtonStyle = (qualite: string) => {
    switch (qualite) {
      case 'Avocat':
        return 'border-blue-500 bg-blue-100 hover:bg-blue-200 text-blue-900'
      case 'Commissaire de justice':
        return 'border-purple-500 bg-purple-100 hover:bg-purple-200 text-purple-900'
      case 'Militaire de la gendarmerie nationale':
        return 'border-green-500 bg-green-100 hover:bg-green-200 text-green-900'
      case 'Régisseur du tribunal judiciaire':
        return 'border-amber-500 bg-amber-100 hover:bg-amber-200 text-amber-900'
      case 'Médecin':
        return 'border-red-500 bg-red-100 hover:bg-red-200 text-red-900'
      case 'Victime':
        return 'border-sky-500 bg-sky-100 hover:bg-sky-200 text-sky-900'
      default:
        return 'border-blue-500 bg-blue-100 hover:bg-blue-200 text-blue-900'
    }
  }

  const getUnselectedButtonStyle = (qualite: string) => {
    switch (qualite) {
      case 'Avocat':
        return 'border-blue-200 bg-blue-100 hover:bg-blue-200 text-blue-800'
      case 'Commissaire de justice':
        return 'border-purple-200 bg-purple-100 hover:bg-purple-200 text-purple-800'
      case 'Militaire de la gendarmerie nationale':
        return 'border-green-200 bg-green-100 hover:bg-green-200 text-green-800'
      case 'Régisseur du tribunal judiciaire':
        return 'border-amber-200 bg-amber-100 hover:bg-amber-200 text-amber-800'
      case 'Médecin':
        return 'border-red-200 bg-red-100 hover:bg-red-200 text-red-800'
      case 'Victime':
        return 'border-sky-200 bg-sky-100 hover:bg-sky-200 text-sky-800'
      default:
        return 'border-gray-200 bg-gray-100 hover:bg-gray-200 text-gray-700'
    }
  }

  useEffect(() => {
    if (isOpen && paiement) {
      const formValues = {
        facture: paiement.facture || '',
        montantHT: paiement.montantHT?.toString() || '',
        montantTTC: paiement.montantTTC.toString(),
        emissionTitrePerception: paiement.emissionTitrePerception,
        qualiteBeneficiaire: paiement.qualiteBeneficiaire,
        identiteBeneficiaire: paiement.identiteBeneficiaire,
        dateServiceFait: paiement.dateServiceFait || '',
        conventionJointeFRI: paiement.conventionJointeFRI,
        adresseBeneficiaire: paiement.adresseBeneficiaire || '',
        siretOuRidet: paiement.siretOuRidet || '',
        titulaireCompteBancaire: paiement.titulaireCompteBancaire || '',
        codeEtablissement: paiement.codeEtablissement || '',
        codeGuichet: paiement.codeGuichet || '',
        numeroCompte: paiement.numeroCompte || '',
        cleRIB: paiement.cleRIB || '',
        sgamiId: paiement.sgami.id,
        avocatId: paiement.avocat?.id || '',
        pceId: paiement.pce?.id || '',
        decisions: paiement.decisions?.map(d => d.decision.id) || []
      }
      
      // Reset form with paiement data
      form.reset(formValues)
      
      // Set selected objects from loaded data
      const foundSgami = sgamis.find((s: any) => s.id === paiement.sgami?.id) || paiement.sgami || null
      const foundAvocat = avocats.find((a: any) => a.id === paiement.avocat?.id) || paiement.avocat || null
      const foundPce = pces.find((p: any) => p.id === paiement.pce?.id) || paiement.pce || null
      
      setSelectedSgami(foundSgami)
      setSelectedAvocat(foundAvocat)
      setSelectedPce(foundPce)
    } else if (isOpen) {
      // Reset form for new paiement
      form.reset({
        facture: '',
        montantHT: '',
        montantTTC: '',
        emissionTitrePerception: 'NON' as const,
        qualiteBeneficiaire: 'Avocat',
        identiteBeneficiaire: '',
        dateServiceFait: '',
        conventionJointeFRI: 'NON' as const,
        adresseBeneficiaire: '',
        siretOuRidet: '',
        titulaireCompteBancaire: '',
        codeEtablissement: '',
        codeGuichet: '',
        numeroCompte: '',
        cleRIB: '',
        sgamiId: '',
        avocatId: '',
        pceId: '',
        decisions: []
      })
      // Reset selected objects
      setSelectedSgami(null)
      setSelectedAvocat(null)
      setSelectedPce(null)
    }
  }, [isOpen, paiement, sgamis, avocats, pces, form])

  // Filter avocats based on search query
  const filteredAvocats = avocats.filter((avocat: any) =>
    `${avocat.prenom} ${avocat.nom}`.toLowerCase().includes(avocatSearchQuery.toLowerCase()) ||
    avocat.nom.toLowerCase().includes(avocatSearchQuery.toLowerCase())
  )

  // Auto-fill when avocat is selected
  useEffect(() => {
    if (selectedAvocat) {
      form.setFieldValue('identiteBeneficiaire', `${selectedAvocat.prenom || ''} ${selectedAvocat.nom}`.trim())
      form.setFieldValue('adresseBeneficiaire', selectedAvocat.adressePostale || '')
      form.setFieldValue('siretOuRidet', selectedAvocat.siretOuRidet || '')
      form.setFieldValue('titulaireCompteBancaire', selectedAvocat.titulaireDuCompteBancaire || '')
      form.setFieldValue('codeEtablissement', selectedAvocat.codeEtablissement || '')
      form.setFieldValue('codeGuichet', selectedAvocat.codeGuichet || '')
      form.setFieldValue('numeroCompte', selectedAvocat.numeroDeCompte || '')
      form.setFieldValue('cleRIB', selectedAvocat.cle || '')
      setAvocatSearchQuery(`${selectedAvocat.prenom} ${selectedAvocat.nom}`)
    }
  }, [selectedAvocat, form])

  // Update search query when form is reset
  useEffect(() => {
    if (isOpen && !selectedAvocat) {
      setAvocatSearchQuery('')
      setShowAvocatDropdown(false)
    }
  }, [isOpen, selectedAvocat])

  const handleDecisionChange = (decisionId: string, checked: boolean) => {
    const currentDecisions = form.getFieldValue('decisions') || []
    const newDecisions = checked 
      ? [...currentDecisions, decisionId]
      : currentDecisions.filter(id => id !== decisionId)
    
    form.setFieldValue('decisions', newDecisions)
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
                    <BanknotesIcon className="h-6 w-6 mr-2 text-blue-600" />
                    {title}
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form.Provider>
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    form.handleSubmit()
                  }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Informations générales */}
                      <div className="md:col-span-2">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Informations générales</h3>
                      </div>

                      {/* SGAMI */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SGAMI *
                        </label>
                        <form.Field name="sgamiId">
                          {(field) => (
                            <>
                              <Listbox 
                                value={selectedSgami} 
                                onChange={(sgami) => {
                                  setSelectedSgami(sgami)
                                  field.handleChange(sgami?.id || '')
                                }}
                              >
                                <div className="relative">
                                  <Listbox.Button className={`relative w-full cursor-default rounded-lg bg-white py-3 pl-3 pr-10 text-left shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all ${
                                    field.state.meta.errors.length > 0 ? 'border-red-300' : 'border-gray-200'
                                  }`}>
                                    <span className="block truncate">
                                      {selectedSgami ? selectedSgami.nom : 'Sélectionner un SGAMI'}
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
                                        value={null}
                                        className={({ active }) =>
                                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                            active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                                          }`
                                        }
                                      >
                                        {({ selected }) => (
                                          <>
                                            <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                              Sélectionner un SGAMI
                                            </span>
                                            {selected ? (
                                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                                <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                              </span>
                                            ) : null}
                                          </>
                                        )}
                                      </Listbox.Option>
                                      {sgamis.map((sgami: any) => (
                                        <Listbox.Option
                                          key={sgami.id}
                                          value={sgami}
                                          className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                              active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                                            }`
                                          }
                                        >
                                          {({ selected }) => (
                                            <>
                                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                {sgami.nom}
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
                              {field.state.meta.errors.length > 0 && (
                                <p className="text-red-500 text-xs mt-1">{field.state.meta.errors[0]}</p>
                              )}
                            </>
                          )}
                        </form.Field>
                      </div>

                      {/* PCE */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Code PCE
                        </label>
                        <Listbox 
                          value={selectedPce} 
                          onChange={(pce) => {
                            setSelectedPce(pce)
                            form.setFieldValue('pceId', pce?.id || '')
                          }}
                        >
                          <div className="relative">
                            <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-3 pl-3 pr-10 text-left shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all border-gray-200">
                              <span className="block truncate">
                                {selectedPce ? (
                                  `${selectedPce.pceDetaille} - ${selectedPce.pceNumerique}`
                                ) : (
                                  'Sélectionner un code PCE'
                                )}
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
                                  value={null}
                                  className={({ active }) =>
                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                      active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                                    }`
                                  }
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                        Sélectionner un code PCE
                                      </span>
                                      {selected ? (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                        </span>
                                      ) : null}
                                    </>
                                  )}
                                </Listbox.Option>
                                {pces.map((pce: any) => (
                                  <Listbox.Option
                                    key={pce.id}
                                    value={pce}
                                    className={({ active }) =>
                                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                        active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                                      }`
                                    }
                                  >
                                    {({ selected }) => (
                                      <>
                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                          {pce.pceDetaille} - {pce.pceNumerique}
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
                      </div>

                      {/* Montant HT */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Montant HT (€)
                        </label>
                        <form.Field name="montantHT">
                          {(field) => (
                            <>
                              <input
                                type="number"
                                step="0.01"
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="0.00"
                                className={`block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all ${
                                  field.state.meta.errors.length > 0 ? 'border-red-300' : 'border-gray-200'
                                }`}
                              />
                              {field.state.meta.errors.length > 0 && (
                                <p className="text-red-500 text-xs mt-1">{field.state.meta.errors[0]}</p>
                              )}
                            </>
                          )}
                        </form.Field>
                      </div>

                      {/* Montant TTC */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Montant TTC (€) *
                        </label>
                        <form.Field name="montantTTC">
                          {(field) => (
                            <>
                              <input
                                type="number"
                                step="0.01"
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="0.00"
                                className={`block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-lg font-semibold text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all ${
                                  field.state.meta.errors.length > 0 ? 'border-red-300' : 'border-gray-200'
                                }`}
                                required
                              />
                              {field.state.meta.errors.length > 0 && (
                                <p className="text-red-500 text-xs mt-1">{field.state.meta.errors[0]}</p>
                              )}
                            </>
                          )}
                        </form.Field>
                      </div>

                      {/* Facture */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Numéro de facture
                        </label>
                        <form.Field name="facture">
                          {(field) => (
                            <input
                              type="text"
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              className="block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all border-gray-200"
                            />
                          )}
                        </form.Field>
                      </div>

                      {/* Date service fait */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Date service fait
                        </label>
                        <form.Field name="dateServiceFait">
                          {(field) => (
                            <input
                              type="date"
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              className="block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all border-gray-200 flex items-center"
                            />
                          )}
                        </form.Field>
                      </div>

                      {/* Décisions associées */}
                      <div className="md:col-span-2">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Décisions associées *</h3>
                        <form.Field name="decisions">
                          {(field) => (
                            <>
                              <div className="bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-2 border-gray-200 rounded-lg p-4 shadow-sm transition-all h-[200px]">
                                <div className="h-full overflow-y-auto">
                                  {decisions.length > 0 ? (
                                    <div className="space-y-2">
                                      {decisions.map((decision: any) => (
                                        <label key={decision.id} className="flex items-center space-x-3 p-3 rounded-lg bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={field.state.value.includes(decision.id)}
                                            onChange={(e) => handleDecisionChange(decision.id, e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                          />
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium text-gray-900 text-sm">
                                                {decision.type} {decision.numero && `- N° ${decision.numero}`}
                                              </span>
                                              {decision.dateSignature && (
                                                <span className="text-xs text-gray-500">
                                                  ({new Date(decision.dateSignature).toLocaleDateString()})
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </label>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 text-sm text-center py-4">Aucune décision disponible pour ce dossier</p>
                                  )}
                                </div>
                              </div>
                              {field.state.meta.errors.length > 0 && (
                                <p className="text-red-500 text-xs mt-1">{field.state.meta.errors[0]}</p>
                              )}
                              <p className="mt-2 text-xs text-gray-500">
                                {field.state.value.length} décision(s) sélectionnée(s) sur {decisions.length} disponible(s)
                              </p>
                            </>
                          )}
                        </form.Field>
                      </div>

                      {/* Bénéficiaire */}
                      <div className="md:col-span-2">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Bénéficiaire</h3>
                      </div>

                      {/* Qualité bénéficiaire */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Qualité bénéficiaire *
                        </label>
                        <form.Field name="qualiteBeneficiaire">
                          {(field) => (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {qualitesBeneficiaire.map((qualite) => (
                                <button
                                  key={qualite}
                                  type="button"
                                  onClick={() => field.handleChange(qualite)}
                                  className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all min-h-[4rem] flex items-center justify-center shadow-sm ${
                                    field.state.value === qualite
                                      ? getSelectedButtonStyle(qualite)
                                      : getUnselectedButtonStyle(qualite)
                                  }`}>
                                  <span className="text-sm font-medium leading-tight">
                                    {qualite}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </form.Field>
                      </div>

                      {/* Avocat si qualité = Avocat */}
                      <form.Field name="qualiteBeneficiaire">
                        {(qualiteField) => (
                          qualiteField.state.value === 'Avocat' && (
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Avocat *
                              </label>
                              <form.Field name="avocatId">
                                {(field) => (
                                  <>
                                    <div className="relative">
                                      <input
                                        type="text"
                                        value={avocatSearchQuery}
                                        onChange={(e) => {
                                          setAvocatSearchQuery(e.target.value)
                                          setShowAvocatDropdown(true)
                                          if (!e.target.value) {
                                            setSelectedAvocat(null)
                                            field.handleChange('')
                                          }
                                        }}
                                        onFocus={() => setShowAvocatDropdown(true)}
                                        onBlur={() => {
                                          setTimeout(() => setShowAvocatDropdown(false), 200)
                                        }}
                                        placeholder="Rechercher un avocat par nom..."
                                        className={`block w-full h-12 px-4 pr-10 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all ${
                                          field.state.meta.errors.length > 0 ? 'border-red-300' : 'border-gray-200'
                                        }`}
                                      />
                                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                                      </div>
                                      
                                      {showAvocatDropdown && avocatSearchQuery && (
                                        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                          {filteredAvocats.length > 0 ? (
                                            filteredAvocats.map((avocat: any) => (
                                              <div
                                                key={avocat.id}
                                                onClick={() => {
                                                  setSelectedAvocat(avocat)
                                                  field.handleChange(avocat.id)
                                                  setShowAvocatDropdown(false)
                                                }}
                                                className="cursor-pointer select-none py-2 pl-3 pr-4 hover:bg-blue-100 hover:text-blue-900 text-gray-900"
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
                                    {field.state.meta.errors.length > 0 && (
                                      <p className="text-red-500 text-xs mt-1">{field.state.meta.errors[0]}</p>
                                    )}
                                    {selectedAvocat && (
                                      <p className="text-sm text-green-600 mt-1">
                                        ✓ {selectedAvocat.prenom} {selectedAvocat.nom} {selectedAvocat.region && `(${selectedAvocat.region})`}
                                      </p>
                                    )}
                                  </>
                                )}
                              </form.Field>
                            </div>
                          )
                        )}
                      </form.Field>

                      {/* Identité bénéficiaire */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Identité bénéficiaire *
                        </label>
                        <form.Field name="identiteBeneficiaire">
                          {(field) => (
                            <>
                              <input
                                type="text"
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                className={`block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all ${
                                  field.state.meta.errors.length > 0 ? 'border-red-300' : 'border-gray-200'
                                }`}
                                required
                              />
                              {field.state.meta.errors.length > 0 && (
                                <p className="text-red-500 text-xs mt-1">{field.state.meta.errors[0]}</p>
                              )}
                            </>
                          )}
                        </form.Field>
                      </div>

                      {/* Adresse bénéficiaire */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Adresse bénéficiaire
                        </label>
                        <form.Field name="adresseBeneficiaire">
                          {(field) => (
                            <input
                              type="text"
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              className="block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all border-gray-200"
                            />
                          )}
                        </form.Field>
                      </div>

                      {/* SIRET ou RIDET */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SIRET ou RIDET
                        </label>
                        <form.Field name="siretOuRidet">
                          {(field) => (
                            <input
                              type="text"
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              className="block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all border-gray-200"
                            />
                          )}
                        </form.Field>
                      </div>

                      {/* Coordonnées bancaires */}
                      <div className="md:col-span-2">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Coordonnées bancaires</h3>
                      </div>

                      {/* Titulaire du compte bancaire */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Titulaire du compte bancaire
                        </label>
                        <form.Field name="titulaireCompteBancaire">
                          {(field) => (
                            <input
                              type="text"
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              className="block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all border-gray-200"
                            />
                          )}
                        </form.Field>
                      </div>
                    </div>

                    {/* Les 4 champs RIB sur la même ligne */}
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Code établissement
                        </label>
                        <form.Field name="codeEtablissement">
                          {(field) => (
                            <input
                              type="text"
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              className="block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all border-gray-200"
                            />
                          )}
                        </form.Field>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Code guichet
                        </label>
                        <form.Field name="codeGuichet">
                          {(field) => (
                            <input
                              type="text"
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              className="block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all border-gray-200"
                            />
                          )}
                        </form.Field>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Numéro de compte
                        </label>
                        <form.Field name="numeroCompte">
                          {(field) => (
                            <input
                              type="text"
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              className="block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all border-gray-200"
                            />
                          )}
                        </form.Field>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Clé RIB
                        </label>
                        <form.Field name="cleRIB">
                          {(field) => (
                            <input
                              type="text"
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              className="block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all border-gray-200"
                            />
                          )}
                        </form.Field>
                      </div>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Options</h3>
                      </div>

                      {/* Émission titre de perception */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Émission titre de perception *
                        </label>
                        <form.Field name="emissionTitrePerception">
                          {(field) => (
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => field.handleChange('NON')}
                                className={`rounded-lg border-2 p-4 text-center transition-all h-16 flex items-center justify-center shadow-sm bg-gradient-to-br ${
                                  field.state.value === 'NON'
                                    ? 'border-blue-500 from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200'
                                    : 'border-gray-200 from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200'
                                }`}
                              >
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Non
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => field.handleChange('OUI')}
                                className={`rounded-lg border-2 p-4 text-center transition-all h-16 flex items-center justify-center shadow-sm bg-gradient-to-br ${
                                  field.state.value === 'OUI'
                                    ? 'border-blue-500 from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200'
                                    : 'border-gray-200 from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200'
                                }`}
                              >
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Oui
                                </span>
                              </button>
                            </div>
                          )}
                        </form.Field>
                      </div>

                      {/* Convention jointe FRI */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Convention jointe FRI *
                        </label>
                        <form.Field name="conventionJointeFRI">
                          {(field) => (
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => field.handleChange('NON')}
                                className={`rounded-lg border-2 p-4 text-center transition-all h-16 flex items-center justify-center shadow-sm bg-gradient-to-br ${
                                  field.state.value === 'NON'
                                    ? 'border-blue-500 from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200'
                                    : 'border-gray-200 from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200'
                                }`}
                              >
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Non
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => field.handleChange('OUI')}
                                className={`rounded-lg border-2 p-4 text-center transition-all h-16 flex items-center justify-center shadow-sm bg-gradient-to-br ${
                                  field.state.value === 'OUI'
                                    ? 'border-blue-500 from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200'
                                    : 'border-gray-200 from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200'
                                }`}
                              >
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Oui
                                </span>
                              </button>
                            </div>
                          )}
                        </form.Field>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-6 border-t mt-8">
                      <button
                        type="button"
                        onClick={onClose}
                        className="btn-secondary"
                      >
                        Annuler
                      </button>
                      <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting]}
                      >
                        {([canSubmit, isSubmitting]) => (
                          <button
                            type="submit"
                            disabled={!canSubmit}
                            className="btn-primary"
                          >
                            {isSubmitting
                              ? 'En cours...'
                              : paiement ? 'Modifier le paiement' : 'Créer le paiement'
                            }
                          </button>
                        )}
                      </form.Subscribe>
                    </div>
                  </form>
                </form.Provider>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default PaiementModal