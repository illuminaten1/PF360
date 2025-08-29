import React, { useState, useEffect } from 'react'
import { Dialog, Transition, Listbox } from '@headlessui/react'
import { useQuery } from '@tanstack/react-query'
import { XMarkIcon, BanknotesIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline'
import { Paiement } from '@/types'
import api from '@/utils/api'

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
  const [formData, setFormData] = useState({
    facture: '',
    montantHT: '',
    montantTTC: '',
    emissionTitrePerception: 'NON',
    qualiteBeneficiaire: 'Avocat',
    identiteBeneficiaire: '',
    dateServiceFait: '',
    conventionJointeFRI: 'NON',
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
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [selectedSgami, setSelectedSgami] = useState<any>(null)
  const [selectedAvocat, setSelectedAvocat] = useState<any>(null)
  const [selectedPce, setSelectedPce] = useState<any>(null)

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

  useEffect(() => {
    if (isOpen && paiement) {
      setFormData({
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
      })
      // Set selected objects from loaded data
      const foundSgami = sgamis.find((s: any) => s.id === paiement.sgami?.id) || paiement.sgami || null
      const foundAvocat = avocats.find((a: any) => a.id === paiement.avocat?.id) || paiement.avocat || null
      const foundPce = pces.find((p: any) => p.id === paiement.pce?.id) || paiement.pce || null
      
      setSelectedSgami(foundSgami)
      setSelectedAvocat(foundAvocat)
      setSelectedPce(foundPce)
    } else if (isOpen) {
      // Reset form for new paiement
      setFormData({
        facture: '',
        montantHT: '',
        montantTTC: '',
        emissionTitrePerception: 'NON',
        qualiteBeneficiaire: 'Avocat',
        identiteBeneficiaire: '',
        dateServiceFait: '',
        conventionJointeFRI: 'NON',
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
    setErrors({})
  }, [isOpen, paiement, sgamis, avocats, pces])

  // Auto-fill when avocat is selected
  useEffect(() => {
    if (selectedAvocat) {
      setFormData(prev => ({
        ...prev,
        identiteBeneficiaire: `${selectedAvocat.prenom || ''} ${selectedAvocat.nom}`.trim(),
        adresseBeneficiaire: selectedAvocat.adressePostale || '',
        siretOuRidet: selectedAvocat.siretOuRidet || '',
        titulaireCompteBancaire: selectedAvocat.titulaireDuCompteBancaire || '',
        codeEtablissement: selectedAvocat.codeEtablissement || '',
        codeGuichet: selectedAvocat.codeGuichet || '',
        numeroCompte: selectedAvocat.numeroDeCompte || '',
        cleRIB: selectedAvocat.cle || ''
      }))
    }
  }, [selectedAvocat])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleDecisionChange = (decisionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      decisions: checked 
        ? [...prev.decisions, decisionId]
        : prev.decisions.filter(id => id !== decisionId)
    }))
    
    // Clear error when user makes a selection
    if (errors.decisions) {
      setErrors(prev => ({ ...prev, decisions: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (formData.montantHT && (isNaN(Number(formData.montantHT)) || Number(formData.montantHT) <= 0)) {
      newErrors.montantHT = 'Le montant HT doit être un nombre positif'
    }

    if (!formData.montantTTC) {
      newErrors.montantTTC = 'Le montant TTC est obligatoire'
    } else if (isNaN(Number(formData.montantTTC)) || Number(formData.montantTTC) <= 0) {
      newErrors.montantTTC = 'Le montant TTC doit être un nombre positif'
    }

    if (!formData.sgamiId) {
      newErrors.sgamiId = 'Le SGAMI est obligatoire'
    }

    if (!formData.identiteBeneficiaire) {
      newErrors.identiteBeneficiaire = 'L\'identité du bénéficiaire est obligatoire'
    }

    if (formData.qualiteBeneficiaire === 'Avocat' && !formData.avocatId) {
      newErrors.avocatId = 'Vous devez sélectionner un avocat'
    }

    if (!formData.decisions || formData.decisions.length === 0) {
      newErrors.decisions = 'Au moins une décision doit être sélectionnée'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const submitData: any = {
      ...formData,
      montantHT: formData.montantHT ? Number(formData.montantHT) : null,
      montantTTC: Number(formData.montantTTC),
      dossierId,
      dateServiceFait: formData.dateServiceFait || null,
      avocatId: formData.avocatId || null,
      pceId: formData.pceId || null
    }

    if (paiement) {
      submitData.id = paiement.id
    }

    onSubmit(submitData)
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

                <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations générales */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informations générales</h3>
            </div>

            {/* Première ligne: SGAMI - PCE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SGAMI *
              </label>
              <Listbox 
                value={selectedSgami} 
                onChange={(sgami) => {
                  setSelectedSgami(sgami)
                  setFormData(prev => ({ ...prev, sgamiId: sgami?.id || '' }))
                }}
              >
                <div className="relative">
                  <Listbox.Button className={`relative w-full cursor-default rounded-lg bg-white py-3 pl-3 pr-10 text-left shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all ${
                    errors.sgamiId ? 'border-red-300' : 'border-gray-200'
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
              {errors.sgamiId && <p className="text-red-500 text-xs mt-1">{errors.sgamiId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code PCE
              </label>
              <Listbox 
                value={selectedPce} 
                onChange={(pce) => {
                  setSelectedPce(pce)
                  setFormData(prev => ({ ...prev, pceId: pce?.id || '' }))
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

            {/* Deuxième ligne: Montant HT - Montant TTC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant HT (€)
              </label>
              <input
                type="number"
                step="0.01"
                name="montantHT"
                value={formData.montantHT}
                onChange={handleChange}
                placeholder="0.00"
                className={`block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all ${
                  errors.montantHT ? 'border-red-300' : 'border-gray-200'
                }`}
              />
              {errors.montantHT && <p className="text-red-500 text-xs mt-1">{errors.montantHT}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant TTC (€) *
              </label>
              <input
                type="number"
                step="0.01"
                name="montantTTC"
                value={formData.montantTTC}
                onChange={handleChange}
                placeholder="0.00"
                className={`block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-lg font-semibold text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all ${
                  errors.montantTTC ? 'border-red-300' : 'border-gray-200'
                }`}
                required
              />
              {errors.montantTTC && <p className="text-red-500 text-xs mt-1">{errors.montantTTC}</p>}
            </div>

            {/* Troisième ligne: Numéro de facture - Date du service fait */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de facture
              </label>
              <input
                type="text"
                name="facture"
                value={formData.facture}
                onChange={handleChange}
                className="block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all border-gray-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date service fait
              </label>
              <input
                type="date"
                name="dateServiceFait"
                value={formData.dateServiceFait}
                onChange={handleChange}
                className="block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all border-gray-200"
              />
            </div>

            {/* Décisions associées */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Décisions associées *</h3>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border-2 border-gray-200 rounded-lg p-4 shadow-sm transition-all h-[200px]">
                <div className="h-full overflow-y-auto">
                  {decisions.length > 0 ? (
                    <div className="space-y-2">
                      {decisions.map((decision: any) => (
                        <label key={decision.id} className="flex items-center space-x-3 p-3 rounded-lg bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.decisions.includes(decision.id)}
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
              {errors.decisions && <p className="text-red-500 text-xs mt-1">{errors.decisions}</p>}
              <p className="mt-2 text-xs text-gray-500">
                {formData.decisions.length} décision(s) sélectionnée(s) sur {decisions.length} disponible(s)
              </p>
            </div>

            {/* Bénéficiaire */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Bénéficiaire</h3>
            </div>

            {/* Qualité bénéficiaire - toute la largeur */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qualité bénéficiaire *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {qualitesBeneficiaire.map((qualite) => (
                  <button
                    key={qualite}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, qualiteBeneficiaire: qualite }))}
                    className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-all h-16 flex items-center justify-center shadow-sm bg-gradient-to-br ${
                      formData.qualiteBeneficiaire === qualite
                        ? 'border-blue-500 from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200'
                        : 'border-gray-200 from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200'
                    }`}>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      qualite === 'Avocat' ? 'bg-blue-100 text-blue-800' :
                      qualite === 'Commissaire de justice' ? 'bg-purple-100 text-purple-800' :
                      qualite === 'Militaire de la gendarmerie nationale' ? 'bg-green-100 text-green-800' :
                      qualite === 'Régisseur du tribunal judiciaire' ? 'bg-amber-100 text-amber-800' :
                      qualite === 'Médecin' ? 'bg-red-100 text-red-800' :
                      qualite === 'Victime' ? 'bg-sky-100 text-sky-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {qualite}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ligne avocat si qualité = Avocat - toute la largeur */}
            {formData.qualiteBeneficiaire === 'Avocat' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avocat *
                </label>
                <Listbox 
                  value={selectedAvocat} 
                  onChange={(avocat) => {
                    setSelectedAvocat(avocat)
                    setFormData(prev => ({ ...prev, avocatId: avocat?.id || '' }))
                  }}
                >
                  <div className="relative">
                    <Listbox.Button className={`relative w-full cursor-default rounded-lg bg-white py-3 pl-3 pr-10 text-left shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all ${
                      errors.avocatId ? 'border-red-300' : 'border-gray-200'
                    }`}>
                      <span className="block truncate">
                        {selectedAvocat ? (
                          `${selectedAvocat.prenom} ${selectedAvocat.nom} ${selectedAvocat.region ? `(${selectedAvocat.region})` : ''}`
                        ) : (
                          'Sélectionner un avocat'
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
                                Sélectionner un avocat
                              </span>
                              {selected ? (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                </span>
                              ) : null}
                            </>
                          )}
                        </Listbox.Option>
                        {avocats.map((avocat: any) => (
                          <Listbox.Option
                            key={avocat.id}
                            value={avocat}
                            className={({ active }) =>
                              `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                              }`
                            }
                          >
                            {({ selected }) => (
                              <>
                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                  {avocat.prenom} {avocat.nom} {avocat.region && `(${avocat.region})`}
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
                {errors.avocatId && <p className="text-red-500 text-xs mt-1">{errors.avocatId}</p>}
              </div>
            )}

            {/* Les autres champs en 2x2 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Identité bénéficiaire *
              </label>
              <input
                type="text"
                name="identiteBeneficiaire"
                value={formData.identiteBeneficiaire}
                onChange={handleChange}
                className={`block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all ${
                  errors.identiteBeneficiaire ? 'border-red-300' : 'border-gray-200'
                }`}
                required
              />
              {errors.identiteBeneficiaire && <p className="text-red-500 text-xs mt-1">{errors.identiteBeneficiaire}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adresse bénéficiaire
              </label>
              <input
                type="text"
                name="adresseBeneficiaire"
                value={formData.adresseBeneficiaire}
                onChange={handleChange}
                className="block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all border-gray-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SIRET ou RIDET
              </label>
              <input
                type="text"
                name="siretOuRidet"
                value={formData.siretOuRidet}
                onChange={handleChange}
                className="block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all border-gray-200"
              />
            </div>


            {/* Coordonnées bancaires */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Coordonnées bancaires</h3>
            </div>

            {/* Titulaire du compte bancaire - toute la largeur */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titulaire du compte bancaire
              </label>
              <input
                type="text"
                name="titulaireCompteBancaire"
                value={formData.titulaireCompteBancaire}
                onChange={handleChange}
                className="block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all border-gray-200"
              />
            </div>
          </div>

          {/* Les 4 champs RIB sur la même ligne */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code établissement
              </label>
              <input
                type="text"
                name="codeEtablissement"
                value={formData.codeEtablissement}
                onChange={handleChange}
                className="block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all border-gray-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code guichet
              </label>
              <input
                type="text"
                name="codeGuichet"
                value={formData.codeGuichet}
                onChange={handleChange}
                className="block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all border-gray-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de compte
              </label>
              <input
                type="text"
                name="numeroCompte"
                value={formData.numeroCompte}
                onChange={handleChange}
                className="block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all border-gray-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clé RIB
              </label>
              <input
                type="text"
                name="cleRIB"
                value={formData.cleRIB}
                onChange={handleChange}
                className="block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all border-gray-200"
              />
            </div>
          </div>

          {/* Convention jointe - Titre de perception */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Options - titre sur toute la largeur */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Options</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Émission titre de perception *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, emissionTitrePerception: 'NON' }))}
                  className={`rounded-lg border-2 p-4 text-center transition-all h-16 flex items-center justify-center shadow-sm bg-gradient-to-br ${
                    formData.emissionTitrePerception === 'NON'
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
                  onClick={() => setFormData(prev => ({ ...prev, emissionTitrePerception: 'OUI' }))}
                  className={`rounded-lg border-2 p-4 text-center transition-all h-16 flex items-center justify-center shadow-sm bg-gradient-to-br ${
                    formData.emissionTitrePerception === 'OUI'
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Convention jointe FRI *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, conventionJointeFRI: 'NON' }))}
                  className={`rounded-lg border-2 p-4 text-center transition-all h-16 flex items-center justify-center shadow-sm bg-gradient-to-br ${
                    formData.conventionJointeFRI === 'NON'
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
                  onClick={() => setFormData(prev => ({ ...prev, conventionJointeFRI: 'OUI' }))}
                  className={`rounded-lg border-2 p-4 text-center transition-all h-16 flex items-center justify-center shadow-sm bg-gradient-to-br ${
                    formData.conventionJointeFRI === 'OUI'
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
                      className="btn-primary"
                    >
                      {paiement ? 'Modifier le paiement' : 'Créer le paiement'}
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

export default PaiementModal