import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { XMarkIcon, BanknotesIcon, UserIcon } from '@heroicons/react/24/outline'
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
    }
    setErrors({})
  }, [isOpen, paiement])

  // Auto-fill when avocat is selected
  useEffect(() => {
    if (formData.avocatId && avocats.length > 0) {
      const selectedAvocat = avocats.find((a: any) => a.id === formData.avocatId)
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
    }
  }, [formData.avocatId, avocats])

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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <BanknotesIcon className="h-6 w-6 mr-2" />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations générales */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informations générales</h3>
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SGAMI *
              </label>
              <select
                name="sgamiId"
                value={formData.sgamiId}
                onChange={handleChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.sgamiId ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Sélectionner un SGAMI</option>
                {sgamis.map((sgami: any) => (
                  <option key={sgami.id} value={sgami.id}>
                    {sgami.nom}
                  </option>
                ))}
              </select>
              {errors.sgamiId && <p className="text-red-500 text-xs mt-1">{errors.sgamiId}</p>}
            </div>

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
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.montantHT ? 'border-red-300' : 'border-gray-300'
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
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.montantTTC ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {errors.montantTTC && <p className="text-red-500 text-xs mt-1">{errors.montantTTC}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Numéro de facture
              </label>
              <input
                type="text"
                name="facture"
                value={formData.facture}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code PCE
              </label>
              <select
                name="pceId"
                value={formData.pceId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Sélectionner un code PCE</option>
                {pces.map((pce: any) => (
                  <option key={pce.id} value={pce.id}>
                    {pce.pceDetaille} - {pce.pceNumerique}
                  </option>
                ))}
              </select>
            </div>

            {/* Décisions associées */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Décisions associées *</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-50 p-3 rounded-md">
                {decisions.length > 0 ? (
                  decisions.map((decision: any) => (
                    <label key={decision.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.decisions.includes(decision.id)}
                        onChange={(e) => handleDecisionChange(decision.id, e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">
                        {decision.type} {decision.numero && `- ${decision.numero}`}
                        {decision.dateSignature && ` (${new Date(decision.dateSignature).toLocaleDateString()})`}
                      </span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">Aucune décision disponible pour ce dossier</p>
                )}
              </div>
              {errors.decisions && <p className="text-red-500 text-xs mt-1">{errors.decisions}</p>}
            </div>

            {/* Bénéficiaire */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Bénéficiaire</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qualité bénéficiaire *
              </label>
              <select
                name="qualiteBeneficiaire"
                value={formData.qualiteBeneficiaire}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {qualitesBeneficiaire.map((qualite) => (
                  <option key={qualite} value={qualite}>
                    {qualite}
                  </option>
                ))}
              </select>
            </div>

            {formData.qualiteBeneficiaire === 'Avocat' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avocat *
                </label>
                <select
                  name="avocatId"
                  value={formData.avocatId}
                  onChange={handleChange}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.avocatId ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Sélectionner un avocat</option>
                  {avocats.map((avocat: any) => (
                    <option key={avocat.id} value={avocat.id}>
                      {avocat.prenom} {avocat.nom} {avocat.region && `(${avocat.region})`}
                    </option>
                  ))}
                </select>
                {errors.avocatId && <p className="text-red-500 text-xs mt-1">{errors.avocatId}</p>}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Identité bénéficiaire *
              </label>
              <input
                type="text"
                name="identiteBeneficiaire"
                value={formData.identiteBeneficiaire}
                onChange={handleChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.identiteBeneficiaire ? 'border-red-300' : 'border-gray-300'
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Coordonnées bancaires */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Coordonnées bancaires</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titulaire du compte bancaire
              </label>
              <input
                type="text"
                name="titulaireCompteBancaire"
                value={formData.titulaireCompteBancaire}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code établissement
              </label>
              <input
                type="text"
                name="codeEtablissement"
                value={formData.codeEtablissement}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Options */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4 mt-6">Options</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Émission titre de perception *
              </label>
              <select
                name="emissionTitrePerception"
                value={formData.emissionTitrePerception}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="OUI">Oui</option>
                <option value="NON">Non</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Convention jointe FRI *
              </label>
              <select
                name="conventionJointeFRI"
                value={formData.conventionJointeFRI}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="OUI">Oui</option>
                <option value="NON">Non</option>
              </select>
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
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
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
      </div>
    </div>
  )
}

export default PaiementModal