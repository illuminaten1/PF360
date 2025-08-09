import React, { useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Dossier, Badge, Sgami, User } from '@/types'
import api from '@/utils/api'

const dossierSchema = z.object({
  nomDossier: z.string().optional(),
  notes: z.string().optional(),
  sgamiId: z.string().min(1, "Le SGAMI est requis"),
  assigneAId: z.string().min(1, "Le rédacteur est requis"),
  badges: z.array(z.string()).optional()
})

type DossierFormData = z.infer<typeof dossierSchema>

interface DossierModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  dossier?: Dossier | null
  title: string
}

const DossierModal: React.FC<DossierModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  dossier,
  title
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    watch
  } = useForm<DossierFormData>({
    resolver: zodResolver(dossierSchema)
  })

  const selectedBadges = watch('badges') || []

  // Fetch options for selects
  const { data: badges = [] } = useQuery<Badge[]>({
    queryKey: ['badges'],
    queryFn: async () => {
      const response = await api.get('/badges')
      return response.data
    }
  })

  const { data: sgamis = [] } = useQuery<Sgami[]>({
    queryKey: ['sgami'],
    queryFn: async () => {
      const response = await api.get('/sgami')
      return response.data
    }
  })

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['dossier-modal-users'],
    queryFn: async () => {
      const response = await api.get('/demandes/users')
      return response.data
    }
  })

  useEffect(() => {
    if (isOpen) {
      if (dossier) {
        // Mode édition : remplir avec les données existantes
        reset({
          nomDossier: dossier.nomDossier || '',
          notes: dossier.notes || '',
          sgamiId: dossier.sgami?.id || '',
          assigneAId: dossier.assigneA?.id || '',
          badges: dossier.badges.map(b => b.badge.id) || []
        })
      } else {
        // Mode création : réinitialiser complètement le formulaire
        reset({
          nomDossier: '',
          notes: '',
          sgamiId: '',
          assigneAId: '',
          badges: []
        })
      }
    }
  }, [isOpen, dossier, reset])

  const handleFormSubmit = async (data: DossierFormData) => {
    try {
      // Nettoyer les données : remplacer les chaînes vides par undefined
      const cleanedData = {
        ...data,
        nomDossier: data.nomDossier || undefined,
        sgamiId: data.sgamiId || undefined,
        assigneAId: data.assigneAId || undefined,
        notes: data.notes || undefined
      }
      await onSubmit(cleanedData)
      onClose()
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const toggleBadge = (badgeId: string) => {
    const current = selectedBadges || []
    const newBadges = current.includes(badgeId)
      ? current.filter(id => id !== badgeId)
      : [...current, badgeId]
    setValue('badges', newBadges)
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
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

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                  <div>
                    <label htmlFor="nomDossier" className="label block text-gray-700 mb-2">
                      Nom du dossier (optionnel)
                    </label>
                    <input
                      {...register('nomDossier')}
                      type="text"
                      className="input w-full"
                      placeholder="Nom descriptif pour ce dossier important..."
                      disabled={isSubmitting}
                    />
                    {errors.nomDossier && (
                      <p className="mt-1 text-sm text-red-600">{errors.nomDossier.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="notes" className="label block text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      {...register('notes')}
                      className="input w-full h-24 resize-none"
                      placeholder="Notes sur le dossier..."
                      disabled={isSubmitting}
                    />
                    {errors.notes && (
                      <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="sgamiId" className="label block text-gray-700 mb-2">
                        SGAMI
                      </label>
                      <select
                        {...register('sgamiId')}
                        className="input w-full"
                        disabled={isSubmitting}
                      >
                        <option value="">Sélectionner un SGAMI</option>
                        {sgamis.map((sgami) => (
                          <option key={sgami.id} value={sgami.id}>
                            {sgami.nom}
                          </option>
                        ))}
                      </select>
                      {errors.sgamiId && (
                        <p className="mt-1 text-sm text-red-600">{errors.sgamiId.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="assigneAId" className="label block text-gray-700 mb-2">
                        Assigné à
                      </label>
                      <select
                        {...register('assigneAId')}
                        className="input w-full"
                        disabled={isSubmitting}
                      >
                        <option value="">Sélectionner un utilisateur</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.grade && `${user.grade} `}{user.prenom} {user.nom}
                          </option>
                        ))}
                      </select>
                      {errors.assigneAId && (
                        <p className="mt-1 text-sm text-red-600">{errors.assigneAId.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="label block text-gray-700 mb-2">
                      Badges
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {badges.map((badge) => (
                        <label key={badge.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedBadges.includes(badge.id)}
                            onChange={() => toggleBadge(badge.id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{badge.nom}</span>
                        </label>
                      ))}
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
                      {isSubmitting ? 'Enregistrement...' : dossier ? 'Modifier' : 'Créer'}
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

export default DossierModal