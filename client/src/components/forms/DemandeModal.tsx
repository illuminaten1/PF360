import React, { useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Demande, Dossier } from '@/types'
import api from '@/utils/api'

const demandeSchema = z.object({
  numeroDS: z.string().min(1, 'Numéro DS requis'),
  type: z.enum(['VICTIME', 'MIS_EN_CAUSE'], { message: 'Type requis' }),
  
  // Infos militaires
  nigend: z.string().optional(),
  grade: z.string().optional(),
  nom: z.string().min(1, 'Nom requis'),
  prenom: z.string().min(1, 'Prénom requis'),
  adresse1: z.string().optional(),
  adresse2: z.string().optional(),
  telephone1: z.string().optional(),
  telephone2: z.string().optional(),
  unite: z.string().optional(),
  
  // Infos faits
  dateFaits: z.string().optional(),
  commune: z.string().optional(),
  codePostal: z.string().optional(),
  position: z.string().optional().refine(
    (val) => !val || ['EN_SERVICE', 'HORS_SERVICE'].includes(val),
    { message: 'Position invalide' }
  ),
  resume: z.string().optional(),
  blessures: z.string().optional(),
  partieCivile: z.boolean().default(false),
  montantPartieCivile: z.number().optional(),
  qualificationsPenales: z.string().optional(),
  dateAudience: z.string().optional(),
  
  // Soutiens
  soutienPsychologique: z.boolean().default(false),
  soutienSocial: z.boolean().default(false),
  soutienMedical: z.boolean().default(false),
  
  // Association dossier (uniquement pour modification)
  dossierId: z.string().optional()
})

type DemandeFormData = z.infer<typeof demandeSchema>

interface DemandeModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: DemandeFormData) => Promise<void>
  demande?: Demande | null
  title: string
}

const DemandeModal: React.FC<DemandeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  demande,
  title
}) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<DemandeFormData>({
    resolver: zodResolver(demandeSchema)
  })

  const partieCivile = watch('partieCivile')

  // Fetch dossiers for assignment (only when editing existing demande)
  const { data: dossiers = [] } = useQuery<Dossier[]>({
    queryKey: ['dossiers'],
    queryFn: async () => {
      const response = await api.get('/dossiers')
      return response.data
    },
    enabled: !!demande // Only fetch when editing an existing demande
  })

  useEffect(() => {
    if (demande) {
      reset({
        numeroDS: demande.numeroDS,
        type: demande.type as 'VICTIME' | 'MIS_EN_CAUSE',
        nigend: demande.nigend || '',
        grade: demande.grade || '',
        nom: demande.nom,
        prenom: demande.prenom,
        adresse1: demande.adresse1 || '',
        adresse2: demande.adresse2 || '',
        telephone1: demande.telephone1 || '',
        telephone2: demande.telephone2 || '',
        unite: demande.unite || '',
        dateFaits: demande.dateFaits ? new Date(demande.dateFaits).toISOString().split('T')[0] : '',
        commune: demande.commune || '',
        codePostal: demande.codePostal || '',
        position: demande.position || '',
        resume: demande.resume || '',
        blessures: demande.blessures || '',
        partieCivile: demande.partieCivile,
        montantPartieCivile: demande.montantPartieCivile || undefined,
        qualificationsPenales: demande.qualificationsPenales || '',
        dateAudience: demande.dateAudience ? new Date(demande.dateAudience).toISOString().split('T')[0] : '',
        soutienPsychologique: demande.soutienPsychologique,
        soutienSocial: demande.soutienSocial,
        soutienMedical: demande.soutienMedical,
        dossierId: demande.dossier?.id || ''
      })
    } else {
      reset({
        numeroDS: '',
        type: 'VICTIME',
        nom: '',
        prenom: '',
        partieCivile: false,
        soutienPsychologique: false,
        soutienSocial: false,
        soutienMedical: false
        // Pas de dossierId pour les nouvelles demandes
      })
    }
  }, [demande, reset])

  const handleFormSubmit = async (data: DemandeFormData) => {
    try {
      // Convert string numbers to numbers
      if (data.montantPartieCivile) {
        data.montantPartieCivile = Number(data.montantPartieCivile)
      }
      
      await onSubmit(data)
      onClose()
    } catch (error) {
      console.error('Form submission error:', error)
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
                    <div className={`grid grid-cols-1 gap-4 ${demande ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Numéro DS *
                        </label>
                        <input
                          {...register('numeroDS')}
                          className="input w-full"
                          placeholder="Ex: 2024-001234"
                          disabled={isSubmitting}
                        />
                        {errors.numeroDS && (
                          <p className="mt-1 text-sm text-red-600">{errors.numeroDS.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Type *
                        </label>
                        <select
                          {...register('type')}
                          className="input w-full"
                          disabled={isSubmitting}
                        >
                          <option value="VICTIME">Victime</option>
                          <option value="MIS_EN_CAUSE">Mis en cause</option>
                        </select>
                        {errors.type && (
                          <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                        )}
                      </div>

                      {/* Afficher le champ dossier uniquement en mode modification */}
                      {demande && (
                        <div>
                          <label className="label block text-gray-700 mb-2">
                            Dossier associé
                          </label>
                          <select
                            {...register('dossierId')}
                            className="input w-full"
                            disabled={isSubmitting}
                          >
                            <option value="">Aucun dossier</option>
                            {dossiers.map((dossier) => (
                              <option key={dossier.id} value={dossier.id}>
                                {dossier.numero} {dossier.sgami?.nom && `(${dossier.sgami.nom})`}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    
                    {/* Message informatif pour les nouvelles demandes */}
                    {!demande && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm text-blue-700">
                          💡 La demande sera créée sans dossier. Vous pourrez l'associer à un dossier ultérieurement depuis la liste des demandes.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Informations militaires */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Informations militaires</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label block text-gray-700 mb-2">
                          NIGEND
                        </label>
                        <input
                          {...register('nigend')}
                          className="input w-full"
                          placeholder="Ex: 123456789"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Grade
                        </label>
                        <input
                          {...register('grade')}
                          className="input w-full"
                          placeholder="Ex: Adjudant"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Nom *
                        </label>
                        <input
                          {...register('nom')}
                          className="input w-full"
                          placeholder="Nom de famille"
                          disabled={isSubmitting}
                        />
                        {errors.nom && (
                          <p className="mt-1 text-sm text-red-600">{errors.nom.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Prénom *
                        </label>
                        <input
                          {...register('prenom')}
                          className="input w-full"
                          placeholder="Prénom"
                          disabled={isSubmitting}
                        />
                        {errors.prenom && (
                          <p className="mt-1 text-sm text-red-600">{errors.prenom.message}</p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="label block text-gray-700 mb-2">
                          Unité
                        </label>
                        <input
                          {...register('unite')}
                          className="input w-full"
                          placeholder="Ex: 1er RCP"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Adresse ligne 1
                        </label>
                        <input
                          {...register('adresse1')}
                          className="input w-full"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Adresse ligne 2
                        </label>
                        <input
                          {...register('adresse2')}
                          className="input w-full"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Téléphone 1
                        </label>
                        <input
                          {...register('telephone1')}
                          className="input w-full"
                          placeholder="Ex: 06.12.34.56.78"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Téléphone 2
                        </label>
                        <input
                          {...register('telephone2')}
                          className="input w-full"
                          placeholder="Ex: 01.23.45.67.89"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Informations sur les faits */}
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Informations sur les faits</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Date des faits
                        </label>
                        <input
                          {...register('dateFaits')}
                          type="date"
                          className="input w-full"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Position
                        </label>
                        <select
                          {...register('position')}
                          className="input w-full"
                          disabled={isSubmitting}
                        >
                          <option value="">Non précisé</option>
                          <option value="EN_SERVICE">En service</option>
                          <option value="HORS_SERVICE">Hors service</option>
                        </select>
                        {errors.position && (
                          <p className="mt-1 text-sm text-red-600">{errors.position.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Commune
                        </label>
                        <input
                          {...register('commune')}
                          className="input w-full"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Code postal
                        </label>
                        <input
                          {...register('codePostal')}
                          className="input w-full"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="label block text-gray-700 mb-2">
                          Résumé des faits
                        </label>
                        <textarea
                          {...register('resume')}
                          className="input w-full h-24 resize-none"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="label block text-gray-700 mb-2">
                          Blessures
                        </label>
                        <textarea
                          {...register('blessures')}
                          className="input w-full h-20 resize-none"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="label block text-gray-700 mb-2">
                          Qualifications pénales
                        </label>
                        <input
                          {...register('qualificationsPenales')}
                          className="input w-full"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="label block text-gray-700 mb-2">
                          Date d'audience
                        </label>
                        <input
                          {...register('dateAudience')}
                          type="date"
                          className="input w-full"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Partie civile */}
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Partie civile</h4>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          {...register('partieCivile')}
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          Constitution de partie civile
                        </label>
                      </div>

                      {partieCivile && (
                        <div>
                          <label className="label block text-gray-700 mb-2">
                            Montant réclamé (€)
                          </label>
                          <input
                            {...register('montantPartieCivile', { valueAsNumber: true })}
                            type="number"
                            min="0"
                            step="0.01"
                            className="input w-full md:w-1/2"
                            disabled={isSubmitting}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Soutiens */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Soutiens demandés</h4>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          {...register('soutienPsychologique')}
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          Soutien psychologique
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          {...register('soutienSocial')}
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          Soutien social
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          {...register('soutienMedical')}
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm text-gray-700">
                          Soutien médical
                        </label>
                      </div>
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
                      {isSubmitting ? 'Enregistrement...' : demande ? 'Modifier' : 'Créer'}
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

export default DemandeModal