import React, { useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { XMarkIcon, PlusIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { Avocat } from '@/types'

const avocatSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis'),
  prenom: z.string().min(1, 'Le prénom est requis'),
  region: z.string().optional(),
  adressePostale: z.string().optional(),
  telephonePublic1: z.string().optional().refine(
    (val) => !val || /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/.test(val),
    { message: 'Format de téléphone invalide' }
  ),
  telephonePublic2: z.string().optional().refine(
    (val) => !val || /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/.test(val),
    { message: 'Format de téléphone invalide' }
  ),
  telephonePrive: z.string().optional().refine(
    (val) => !val || /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/.test(val),
    { message: 'Format de téléphone invalide' }
  ),
  email: z.string().email('Format d\'email invalide').optional().or(z.literal('')),
  siretOuRidet: z.string().optional().refine(
    (val) => !val || /^[0-9]{9,14}$/.test(val.replace(/\s/g, '')),
    { message: 'Format de SIRET/RIDET invalide (9 à 14 chiffres)' }
  ),
  villesIntervention: z.array(z.string()).default([]),
  notes: z.string().optional(),
  specialisation: z.string().optional(),
  titulaireDuCompteBancaire: z.string().optional(),
  codeEtablissement: z.string().optional(),
  codeGuichet: z.string().optional(),
  numeroDeCompte: z.string().optional(),
  cle: z.string().optional()
})

type AvocatFormData = z.infer<typeof avocatSchema>

interface AvocatModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AvocatFormData) => Promise<void>
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
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<AvocatFormData>({
    resolver: zodResolver(avocatSchema),
    defaultValues: {
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
    }
  })

  const watchedVilles = watch('villesIntervention')

  useEffect(() => {
    if (isOpen) {
      if (avocat) {
        reset({
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
        reset({
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
    }
  }, [isOpen, avocat, reset])

  const handleFormSubmit = async (data: AvocatFormData) => {
    try {
      await onSubmit(data)
      onClose()
    } catch (error) {
      // L'erreur sera gérée par la mutation dans le parent
    }
  }

  const addVille = () => {
    const input = document.getElementById('nouvelle-ville') as HTMLInputElement
    const nouvelleVille = input?.value.trim()
    
    if (nouvelleVille && !watchedVilles.includes(nouvelleVille)) {
      setValue('villesIntervention', [...watchedVilles, nouvelleVille])
      input.value = ''
    }
  }

  const removeVille = (index: number) => {
    setValue('villesIntervention', watchedVilles.filter((_, i) => i !== index))
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

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
                  {/* Informations générales */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Informations générales</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                          Nom <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...register('nom', {
                            setValueAs: (value) => value.toUpperCase()
                          })}
                          type="text"
                          id="nom"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        {errors.nom && (
                          <p className="mt-1 text-sm text-red-600">{errors.nom.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="prenom" className="block text-sm font-medium text-gray-700">
                          Prénom <span className="text-red-500">*</span>
                        </label>
                        <input
                          {...register('prenom')}
                          type="text"
                          id="prenom"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        {errors.prenom && (
                          <p className="mt-1 text-sm text-red-600">{errors.prenom.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          {...register('email')}
                          type="email"
                          id="email"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="region" className="block text-sm font-medium text-gray-700">Région</label>
                        <select
                          {...register('region')}
                          id="region"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="">Sélectionnez une région</option>
                          {regions.map((region) => (
                            <option key={region} value={region}>{region}</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label htmlFor="specialisation" className="block text-sm font-medium text-gray-700">Spécialisation</label>
                        <input
                          {...register('specialisation')}
                          type="text"
                          id="specialisation"
                          placeholder="Ex: Droit pénal, Droit civil..."
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Adresse */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Adresse</h4>
                    <div>
                      <label htmlFor="adressePostale" className="block text-sm font-medium text-gray-700">Adresse postale</label>
                      <textarea
                        {...register('adressePostale')}
                        id="adressePostale"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Villes d'intervention */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Villes d'intervention</h4>
                    
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        id="nouvelle-ville"
                        placeholder="Ajouter une ville d'intervention"
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVille())}
                      />
                      <button
                        type="button"
                        onClick={addVille}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Ajouter
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 min-h-[40px] p-3 border border-gray-200 rounded-md bg-white">
                      {watchedVilles.length === 0 ? (
                        <span className="text-gray-500 italic">Aucune ville d'intervention ajoutée</span>
                      ) : (
                        watchedVilles.map((ville, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                          >
                            {ville}
                            <button
                              type="button"
                              onClick={() => removeVille(index)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Contacts */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Contacts</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="telephonePublic1" className="block text-sm font-medium text-gray-700">Téléphone public 1</label>
                        <input
                          {...register('telephonePublic1')}
                          type="tel"
                          id="telephonePublic1"
                          placeholder="Ex: 06 12 34 56 78"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        {errors.telephonePublic1 && (
                          <p className="mt-1 text-sm text-red-600">{errors.telephonePublic1.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="telephonePublic2" className="block text-sm font-medium text-gray-700">Téléphone public 2</label>
                        <input
                          {...register('telephonePublic2')}
                          type="tel"
                          id="telephonePublic2"
                          placeholder="Ex: 01 23 45 67 89"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        {errors.telephonePublic2 && (
                          <p className="mt-1 text-sm text-red-600">{errors.telephonePublic2.message}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label htmlFor="telephonePrive" className="block text-sm font-medium text-gray-700">
                          Téléphone privé <span className="text-sm text-gray-500">(non communiqué aux bénéficiaires)</span>
                        </label>
                        <input
                          {...register('telephonePrive')}
                          type="tel"
                          id="telephonePrive"
                          placeholder="Ex: 07 98 76 54 32"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        {errors.telephonePrive && (
                          <p className="mt-1 text-sm text-red-600">{errors.telephonePrive.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Informations bancaires */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Informations bancaires</h4>
                    
                    <div className="mb-4">
                      <label htmlFor="titulaireDuCompteBancaire" className="block text-sm font-medium text-gray-700">Titulaire du compte bancaire</label>
                      <input
                        {...register('titulaireDuCompteBancaire')}
                        type="text"
                        id="titulaireDuCompteBancaire"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label htmlFor="codeEtablissement" className="block text-sm font-medium text-gray-700">Code établissement</label>
                        <input
                          {...register('codeEtablissement')}
                          type="text"
                          id="codeEtablissement"
                          maxLength={5}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="codeGuichet" className="block text-sm font-medium text-gray-700">Code guichet</label>
                        <input
                          {...register('codeGuichet')}
                          type="text"
                          id="codeGuichet"
                          maxLength={5}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="numeroDeCompte" className="block text-sm font-medium text-gray-700">Numéro de compte</label>
                        <input
                          {...register('numeroDeCompte')}
                          type="text"
                          id="numeroDeCompte"
                          maxLength={11}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="cle" className="block text-sm font-medium text-gray-700">Clé</label>
                        <input
                          {...register('cle')}
                          type="text"
                          id="cle"
                          maxLength={2}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Autres informations */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Autres informations</h4>
                    
                    <div className="mb-4">
                      <label htmlFor="siretOuRidet" className="block text-sm font-medium text-gray-700">SIRET/RIDET</label>
                      <input
                        {...register('siretOuRidet')}
                        type="text"
                        id="siretOuRidet"
                        placeholder="Ex: 123 456 789 00012"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      {errors.siretOuRidet && (
                        <p className="mt-1 text-sm text-red-600">{errors.siretOuRidet.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                      <textarea
                        {...register('notes')}
                        id="notes"
                        rows={4}
                        placeholder="Informations complémentaires sur l'avocat..."
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
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