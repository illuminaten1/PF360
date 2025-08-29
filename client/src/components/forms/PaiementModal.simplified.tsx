import React, { useState, useEffect } from 'react'
import { Dialog, Transition, Listbox } from '@headlessui/react'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { XMarkIcon, BanknotesIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline'
import { Paiement } from '@/types'
import api from '@/utils/api'
import useModalForm, { createFieldRenderer, createStandardInput, useRadioButtons } from '@/hooks/useModalForm'

// Schéma de validation Zod
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
}).refine((data) => {
  if (data.montantHT && (isNaN(Number(data.montantHT)) || Number(data.montantHT) <= 0)) {
    return false
  }
  return true
}, {
  message: 'Le montant HT doit être un nombre positif',
  path: ['montantHT']
}).refine((data) => {
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
  // États locaux pour les composants complexes
  const [selectedSgami, setSelectedSgami] = useState<any>(null)
  const [selectedAvocat, setSelectedAvocat] = useState<any>(null)
  const [selectedPce, setSelectedPce] = useState<any>(null)
  const [avocatSearchQuery, setAvocatSearchQuery] = useState('')
  const [showAvocatDropdown, setShowAvocatDropdown] = useState(false)

  // Utilisation de notre hook personnalisé
  const {
    form,
    handleSubmit,
    canSubmit,
    isSubmitting,
    setValue,
    getValue
  } = useModalForm({
    schema: paiementSchema,
    isOpen,
    initialData: paiement ? {
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
    } : undefined,
    onSubmit: (data) => {
      const submitData: any = {
        ...data,
        montantHT: data.montantHT ? Number(data.montantHT) : null,
        montantTTC: Number(data.montantTTC),
        dossierId,
        dateServiceFait: data.dateServiceFait || null,
        avocatId: data.avocatId || null,
        pceId: data.pceId || null
      }

      if (paiement) {
        submitData.id = paiement.id
      }

      onSubmit(submitData)
    },
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
      decisions: []
    }
  })

  // React Query pour récupérer les données
  const { data: sgamis = [] } = useQuery({
    queryKey: ['sgamis'],
    queryFn: async () => {
      const response = await api.get('/sgami')
      return response.data
    },
    enabled: isOpen
  })

  const { data: avocats = [] } = useQuery({
    queryKey: ['avocats'],
    queryFn: async () => {
      const response = await api.get('/avocats')
      return response.data
    },
    enabled: isOpen
  })

  const { data: pces = [] } = useQuery({
    queryKey: ['pces'],
    queryFn: async () => {
      const response = await api.get('/pce')
      return response.data
    },
    enabled: isOpen
  })

  const { data: decisions = [] } = useQuery({
    queryKey: ['dossier-decisions', dossierId],
    queryFn: async () => {
      const response = await api.get(`/dossiers/${dossierId}`)
      return response.data.decisions || []
    },
    enabled: isOpen && !!dossierId
  })

  // Configuration des boutons radio pour émission titre et convention
  const emissionOptions = [
    { value: 'NON' as const, label: 'Non' },
    { value: 'OUI' as const, label: 'Oui' }
  ]

  const conventionOptions = [
    { value: 'NON' as const, label: 'Non' },
    { value: 'OUI' as const, label: 'Oui' }
  ]

  const qualitesBeneficiaire = [
    'Avocat',
    'Commissaire de justice',
    'Militaire de la gendarmerie nationale',
    'Régisseur du tribunal judiciaire',
    'Médecin',
    'Victime'
  ]

  // Auto-remplissage lors de la sélection d'avocat
  useEffect(() => {
    if (selectedAvocat) {
      setValue('identiteBeneficiaire', `${selectedAvocat.prenom || ''} ${selectedAvocat.nom}`.trim())
      setValue('adresseBeneficiaire', selectedAvocat.adressePostale || '')
      setValue('siretOuRidet', selectedAvocat.siretOuRidet || '')
      setValue('titulaireCompteBancaire', selectedAvocat.titulaireDuCompteBancaire || '')
      setValue('codeEtablissement', selectedAvocat.codeEtablissement || '')
      setValue('codeGuichet', selectedAvocat.codeGuichet || '')
      setValue('numeroCompte', selectedAvocat.numeroDeCompte || '')
      setValue('cleRIB', selectedAvocat.cle || '')
      setAvocatSearchQuery(`${selectedAvocat.prenom} ${selectedAvocat.nom}`)
    }
  }, [selectedAvocat, setValue])

  // Helpers pour les champs personnalisés
  const renderFieldWithError = createFieldRenderer<PaiementFormData>

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
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Informations générales */}
                      <div className="md:col-span-2">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Informations générales</h3>
                      </div>

                      {/* SGAMI - reste complexe car nécessite Listbox */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">SGAMI *</label>
                        {renderFieldWithError(form, 'sgamiId', (field) => (
                          <Listbox 
                            value={selectedSgami} 
                            onChange={(sgami) => {
                              setSelectedSgami(sgami)
                              field.handleChange(sgami?.id || '')
                            }}
                          >
                            {/* Listbox implementation... */}
                          </Listbox>
                        ))}
                      </div>

                      {/* Montant HT - simplifié avec notre helper */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Montant HT (€)</label>
                        {renderFieldWithError(form, 'montantHT', (field) => 
                          createStandardInput(field, { type: 'number', step: '0.01', placeholder: '0.00' })
                        )}
                      </div>

                      {/* Montant TTC - simplifié */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Montant TTC (€) *</label>
                        {renderFieldWithError(form, 'montantTTC', (field) => 
                          createStandardInput(field, { 
                            type: 'number', 
                            step: '0.01', 
                            placeholder: '0.00', 
                            required: true,
                            className: `block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-lg font-semibold text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all ${
                              field.state.meta.errors.length > 0 ? 'border-red-300' : 'border-gray-200'
                            }`
                          })
                        )}
                      </div>

                      {/* Numéro de facture - simplifié */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de facture</label>
                        {renderFieldWithError(form, 'facture', (field) => 
                          createStandardInput(field, { type: 'text' })
                        )}
                      </div>

                      {/* Date service fait - simplifié */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date service fait</label>
                        {renderFieldWithError(form, 'dateServiceFait', (field) => 
                          createStandardInput(field, { type: 'date' })
                        )}
                      </div>

                      {/* Options avec boutons radio simplifiés */}
                      <div className="md:col-span-2">
                        <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Options</h3>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Émission titre de perception *
                        </label>
                        <form.Field name="emissionTitrePerception">
                          {(field) => {
                            const { renderButtons } = useRadioButtons(field, emissionOptions)
                            return renderButtons()
                          }}
                        </form.Field>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Convention jointe FRI *
                        </label>
                        <form.Field name="conventionJointeFRI">
                          {(field) => {
                            const { renderButtons } = useRadioButtons(field, conventionOptions)
                            return renderButtons()
                          }}
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