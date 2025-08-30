import React, { useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, PlusIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { Avocat } from '@/types'
import { useQuery } from '@tanstack/react-query'
import api from '@/utils/api'

interface AvocatModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  avocat?: Avocat | null
  title: string
}

const regions = [
  'Auvergne-Rhône-Alpes',
  'Bourgogne-Franche-Comté',
  'Bretagne',
  'Centre-Val de Loire',
  'Corse',
  'Grand Est',
  'Hauts-de-France',
  'Île-de-France',
  'Normandie',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Pays de la Loire',
  'Provence-Alpes-Côte d\'Azur',
  'Guadeloupe',
  'Guyane',
  'Martinique',
  'Mayotte',
  'La Réunion',
  'Nouvelle-Calédonie',
  'Polynésie française',
  'Saint-Barthélemy',
  'Saint-Martin',
  'Saint-Pierre-et-Miquelon',
  'Wallis-et-Futuna'
]

const AvocatModal: React.FC<AvocatModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  avocat,
  title
}) => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    region: '',
    adressePostale: '',
    telephonePublic1: '',
    telephonePublic2: '',
    telephonePrive: '',
    email: '',
    siretOuRidet: '',
    villesIntervention: [] as string[],
    notes: '',
    specialisation: '',
    titulaireDuCompteBancaire: '',
    codeEtablissement: '',
    codeGuichet: '',
    numeroDeCompte: '',
    cle: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [nouvelleVille, setNouvelleVille] = useState('')
  const [showVillesSuggestions, setShowVillesSuggestions] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)

  // Récupérer les suggestions de villes
  const { data: villesSuggestions = [] } = useQuery({
    queryKey: ['villes-suggestions'],
    queryFn: async () => {
      const response = await api.get('/avocats/suggestions/villes')
      return response.data
    }
  })

  useEffect(() => {
    if (isOpen) {
      if (avocat) {
        setFormData({
          nom: avocat.nom || '',
          prenom: avocat.prenom || '',
          region: avocat.region || '',
          adressePostale: avocat.adressePostale || '',
          telephonePublic1: avocat.telephonePublic1 || '',
          telephonePublic2: avocat.telephonePublic2 || '',
          telephonePrive: avocat.telephonePrive || '',
          email: avocat.email || '',
          siretOuRidet: avocat.siretOuRidet || '',
          villesIntervention: avocat.villesIntervention || [],
          notes: avocat.notes || '',
          specialisation: avocat.specialisation || '',
          titulaireDuCompteBancaire: avocat.titulaireDuCompteBancaire || '',
          codeEtablissement: avocat.codeEtablissement || '',
          codeGuichet: avocat.codeGuichet || '',
          numeroDeCompte: avocat.numeroDeCompte || '',
          cle: avocat.cle || ''
        })
      } else {
        setFormData({
          nom: '',
          prenom: '',
          region: '',
          adressePostale: '',
          telephonePublic1: '',
          telephonePublic2: '',
          telephonePrive: '',
          email: '',
          siretOuRidet: '',
          villesIntervention: [],
          notes: '',
          specialisation: '',
          titulaireDuCompteBancaire: '',
          codeEtablissement: '',
          codeGuichet: '',
          numeroDeCompte: '',
          cle: ''
        })
      }
      setErrors({})
      setNouvelleVille('')
      setShowVillesSuggestions(false)
      setSelectedSuggestionIndex(-1)
    }
  }, [isOpen, avocat])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nom.trim()) newErrors.nom = 'Le nom est requis'
    if (!formData.prenom.trim()) newErrors.prenom = 'Le prénom est requis'

    // Validation téléphone flexible pour international et outre-mer
    const phoneRegex = /^[+]?[0-9\s.-]{6,}$/
    if (formData.telephonePublic1 && !phoneRegex.test(formData.telephonePublic1)) {
      newErrors.telephonePublic1 = 'Format de téléphone invalide (minimum 6 caractères)'
    }
    if (formData.telephonePublic2 && !phoneRegex.test(formData.telephonePublic2)) {
      newErrors.telephonePublic2 = 'Format de téléphone invalide (minimum 6 caractères)'
    }
    if (formData.telephonePrive && !phoneRegex.test(formData.telephonePrive)) {
      newErrors.telephonePrive = 'Format de téléphone invalide (minimum 6 caractères)'
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide'
    }

    // Validation SIRET/RIDET - format libre pour outre-mer
    if (formData.siretOuRidet && formData.siretOuRidet.replace(/\s/g, '').length < 3) {
      newErrors.siretOuRidet = 'Le SIRET/RIDET doit contenir au moins 3 caractères'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onClose()
    } catch {
      // L'erreur sera gérée par la mutation dans le parent
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const addVille = (villeToAdd?: string) => {
    const ville = villeToAdd || nouvelleVille.trim()
    
    if (ville && !formData.villesIntervention.includes(ville)) {
      setFormData(prev => ({
        ...prev,
        villesIntervention: [...prev.villesIntervention, ville]
      }))
      setNouvelleVille('')
      setShowVillesSuggestions(false)
      setSelectedSuggestionIndex(-1)
    }
  }

  const handleVilleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNouvelleVille(e.target.value)
    setShowVillesSuggestions(true)
    setSelectedSuggestionIndex(-1)
  }

  const handleVilleSuggestionClick = (suggestion: string) => {
    setNouvelleVille(suggestion)
    setShowVillesSuggestions(false)
    setSelectedSuggestionIndex(-1)
  }

  const handleVilleKeyDown = (e: React.KeyboardEvent) => {
    const suggestions = getFilteredVillesSuggestions()
    
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSuggestionIndex(prev => 
        prev > 0 ? prev - 1 : suggestions.length - 1
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        addVille(suggestions[selectedSuggestionIndex])
      } else {
        addVille()
      }
    } else if (e.key === 'Escape') {
      setShowVillesSuggestions(false)
      setSelectedSuggestionIndex(-1)
    }
  }

  const getFilteredVillesSuggestions = () => {
    if (!nouvelleVille) return []
    return villesSuggestions.filter((ville: string) => 
      ville.toLowerCase().includes(nouvelleVille.toLowerCase()) &&
      !formData.villesIntervention.includes(ville)
    ).slice(0, 10) // Limiter à 10 suggestions
  }

  const removeVille = (index: number) => {
    setFormData(prev => ({
      ...prev,
      villesIntervention: prev.villesIntervention.filter((_, i) => i !== index)
    }))
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {title}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Informations générales */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Informations générales</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Nom <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={formData.nom}
                          onChange={(e) => handleInputChange('nom', e.target.value.toUpperCase())}
                          className="input w-full"
                          placeholder="Nom de famille"
                          disabled={isSubmitting}
                        />
                        {errors.nom && (
                          <p className="mt-1 text-sm text-red-600">{errors.nom}</p>
                        )}
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Prénom <span className="text-red-500">*</span>
                        </label>
                        <input
                          value={formData.prenom}
                          onChange={(e) => handleInputChange('prenom', e.target.value)}
                          className="input w-full"
                          placeholder="Prénom"
                          disabled={isSubmitting}
                        />
                        {errors.prenom && (
                          <p className="mt-1 text-sm text-red-600">{errors.prenom}</p>
                        )}
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">Email</label>
                        <input
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          type="email"
                          className="input w-full"
                          placeholder="exemple@avocat.fr"
                          disabled={isSubmitting}
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">Région</label>
                        <select
                          value={formData.region}
                          onChange={(e) => handleInputChange('region', e.target.value)}
                          className="input w-full"
                          disabled={isSubmitting}
                        >
                          <option value="">Sélectionnez une région</option>
                          {regions.map((region) => (
                            <option key={region} value={region}>{region}</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="label block text-gray-700 mb-2">Spécialisation</label>
                        <input
                          value={formData.specialisation}
                          onChange={(e) => handleInputChange('specialisation', e.target.value)}
                          className="input w-full"
                          placeholder="Ex: Droit pénal, Droit civil..."
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="label block text-gray-700 mb-2">SIRET/RIDET</label>
                        <input
                          value={formData.siretOuRidet}
                          onChange={(e) => handleInputChange('siretOuRidet', e.target.value)}
                          className="input w-full"
                          placeholder="Ex: 123 456 789 00012"
                          disabled={isSubmitting}
                        />
                        {errors.siretOuRidet && (
                          <p className="mt-1 text-sm text-red-600">{errors.siretOuRidet}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Adresse */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Adresse</h4>
                    <div>
                      <label className="label block text-gray-700 mb-2">Adresse postale</label>
                      <textarea
                        value={formData.adressePostale}
                        onChange={(e) => handleInputChange('adressePostale', e.target.value)}
                        rows={3}
                        className="input w-full h-20 resize-none"
                        placeholder="Adresse complète du cabinet..."
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Villes d'intervention */}
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Villes d&apos;intervention</h4>
                    
                    <div className="flex gap-2 mb-4">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          id="nouvelle-ville"
                          placeholder="Ajouter une ville d'intervention"
                          className="input w-full"
                          value={nouvelleVille}
                          onChange={handleVilleChange}
                          onKeyDown={handleVilleKeyDown}
                          onFocus={() => setShowVillesSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowVillesSuggestions(false), 200)}
                          disabled={isSubmitting}
                        />
                        {showVillesSuggestions && getFilteredVillesSuggestions().length > 0 && (
                          <ul className="absolute z-10 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 border-t-0 rounded-b-md shadow-lg">
                            {getFilteredVillesSuggestions().map((suggestion: string, index: number) => (
                              <li 
                                key={index}
                                className={`px-4 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                                  index === selectedSuggestionIndex 
                                    ? 'bg-blue-50 text-blue-700' 
                                    : 'hover:bg-gray-50'
                                }`}
                                onClick={() => handleVilleSuggestionClick(suggestion)}
                              >
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => addVille()}
                        className="btn-primary inline-flex items-center px-4 py-2"
                        disabled={isSubmitting}
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Ajouter
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border border-gray-200 rounded-md bg-white">
                      {formData.villesIntervention.length === 0 ? (
                        <span className="text-gray-500 italic">Aucune ville d&apos;intervention ajoutée</span>
                      ) : (
                        formData.villesIntervention.map((ville, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800"
                          >
                            {ville}
                            <button
                              type="button"
                              onClick={() => removeVille(index)}
                              className="ml-2 text-yellow-600 hover:text-yellow-800"
                              disabled={isSubmitting}
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Contacts */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Contacts</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label block text-gray-700 mb-2">Téléphone public 1</label>
                        <input
                          value={formData.telephonePublic1}
                          onChange={(e) => handleInputChange('telephonePublic1', e.target.value)}
                          type="tel"
                          className="input w-full"
                          placeholder="Ex: 06 12 34 56 78, +687 123 456"
                          disabled={isSubmitting}
                        />
                        {errors.telephonePublic1 && (
                          <p className="mt-1 text-sm text-red-600">{errors.telephonePublic1}</p>
                        )}
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">Téléphone public 2</label>
                        <input
                          value={formData.telephonePublic2}
                          onChange={(e) => handleInputChange('telephonePublic2', e.target.value)}
                          type="tel"
                          className="input w-full"
                          placeholder="Ex: 01 23 45 67 89, +590 123 456"
                          disabled={isSubmitting}
                        />
                        {errors.telephonePublic2 && (
                          <p className="mt-1 text-sm text-red-600">{errors.telephonePublic2}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="label block text-gray-700 mb-2">
                          Téléphone privé <span className="text-sm text-gray-500">(non communiqué aux bénéficiaires)</span>
                        </label>
                        <input
                          value={formData.telephonePrive}
                          onChange={(e) => handleInputChange('telephonePrive', e.target.value)}
                          type="tel"
                          className="input w-full"
                          placeholder="Ex: 07 98 76 54 32, +262 123 456"
                          disabled={isSubmitting}
                        />
                        {errors.telephonePrive && (
                          <p className="mt-1 text-sm text-red-600">{errors.telephonePrive}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Informations bancaires */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Informations bancaires</h4>
                    
                    <div className="mb-4">
                      <label className="label block text-gray-700 mb-2">Titulaire du compte bancaire</label>
                      <input
                        value={formData.titulaireDuCompteBancaire}
                        onChange={(e) => handleInputChange('titulaireDuCompteBancaire', e.target.value)}
                        className="input w-full"
                        placeholder="Nom du titulaire du compte"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="label block text-gray-700 mb-2">Code établissement</label>
                        <input
                          value={formData.codeEtablissement}
                          onChange={(e) => handleInputChange('codeEtablissement', e.target.value.replace(/\D/g, '').substring(0, 5))}
                          className="input w-full"
                          placeholder="12345"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">Code guichet</label>
                        <input
                          value={formData.codeGuichet}
                          onChange={(e) => handleInputChange('codeGuichet', e.target.value.replace(/\D/g, '').substring(0, 5))}
                          className="input w-full"
                          placeholder="67890"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">Numéro de compte</label>
                        <input
                          value={formData.numeroDeCompte}
                          onChange={(e) => handleInputChange('numeroDeCompte', e.target.value.substring(0, 11))}
                          className="input w-full"
                          placeholder="12345678901"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">Clé</label>
                        <input
                          value={formData.cle}
                          onChange={(e) => handleInputChange('cle', e.target.value.replace(/\D/g, '').substring(0, 2))}
                          className="input w-full"
                          placeholder="12"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Notes</h4>
                    <div>
                      <label className="label block text-gray-700 mb-2">Notes</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        rows={4}
                        className="input w-full h-24 resize-none"
                        placeholder="Informations complémentaires sur l'avocat..."
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
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
                      {isSubmitting ? 'En cours...' : (avocat ? 'Modifier' : 'Créer')}
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

export default AvocatModal