import React, { useEffect, useState } from 'react'
import { Dialog, Transition, Listbox } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { XMarkIcon, ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline'
import { Dossier, Badge, BAP, Sgami, User } from '@/types'
import api from '@/utils/api'
import { useAuth } from '@/contexts/AuthContext'

const dossierSchema = z.object({
  nomDossier: z.string().optional(),
  sgamiId: z.string().min(1, "Le SGAMI est requis"),
  assigneAId: z.string().min(1, "Le rédacteur est requis"),
  badges: z.array(z.string()).optional(),
  bapId: z.string().optional()
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
  const selectedBapId = watch('bapId') || ''
  const [selectedSgami, setSelectedSgami] = useState<Sgami | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  // Récupérer l'utilisateur connecté
  const { user: currentUser } = useAuth()

  // Fetch options for selects
  const { data: badges = [] } = useQuery<Badge[]>({
    queryKey: ['badges'],
    queryFn: async () => {
      const response = await api.get('/badges')
      return response.data.badges || response.data
    }
  })

  const { data: baps = [] } = useQuery<BAP[]>({
    queryKey: ['baps'],
    queryFn: async () => {
      const response = await api.get('/bap')
      return response.data.baps || response.data
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
          sgamiId: dossier.sgami?.id || '',
          assigneAId: dossier.assigneA?.id || '',
          badges: dossier.badges.map(b => b.badge.id) || [],
          bapId: dossier.bap?.id || ''
        })
        setSelectedSgami(dossier.sgami || null)
        // Trouver l'utilisateur complet dans la liste
        const fullUser = users.find(user => user.id === dossier.assigneA?.id) || null
        setSelectedUser(fullUser)
      } else {
        // Mode création : préremplir avec l'utilisateur connecté
        const defaultAssigneeId = currentUser?.id || ''
        reset({
          nomDossier: '',
          sgamiId: '',
          assigneAId: defaultAssigneeId,
          badges: [],
          bapId: ''
        })
        setSelectedSgami(null)
        setSelectedUser(currentUser || null)
      }
    }
  }, [isOpen, dossier, reset, sgamis, users, currentUser])

  const handleFormSubmit = async (data: DossierFormData) => {
    try {
      // Forcer l'inclusion de tous les champs, même s'ils sont vides
      const cleanedData = {
        nomDossier: data.nomDossier?.trim() || null,
        sgamiId: data.sgamiId?.trim() || undefined,
        assigneAId: data.assigneAId?.trim() || undefined,
        badges: data.badges || [],
        bapId: data.bapId?.trim() || null
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

  const handleBapSelect = (bapId: string) => {
    // Si le même BAP est sélectionné, le désélectionner
    const newBapId = selectedBapId === bapId ? '' : bapId
    setValue('bapId', newBapId)
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      {title}
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-white/50 transition-all duration-200"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6">

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
                  <div className="space-y-2">
                    <label htmlFor="nomDossier" className="block text-sm font-medium text-gray-700">
                      Nom du dossier
                      <span className="text-gray-500 font-normal ml-1">(optionnel)</span>
                    </label>
                    <div className="relative">
                      <input
                        {...register('nomDossier')}
                        type="text"
                        className="block w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 placeholder-gray-500"
                        placeholder="Nom descriptif si le dossier est important..."
                        disabled={isSubmitting}
                      />
                      {watch('nomDossier') && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <CheckIcon className="h-4 w-4 text-green-500" />
                        </div>
                      )}
                    </div>
                    {errors.nomDossier && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        {errors.nomDossier.message}
                      </p>
                    )}
                  </div>


                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="label block text-sm font-medium text-gray-700 mb-2">
                        SGAMI
                      </label>
                      <Listbox 
                        value={selectedSgami} 
                        onChange={(sgami) => {
                          setSelectedSgami(sgami)
                          setValue('sgamiId', sgami?.id || '')
                        }}
                        disabled={isSubmitting}
                      >
                        <div className="relative">
                          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-3 pl-3 pr-10 text-left shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            tabIndex={0}>
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
                              {sgamis.map((sgami) => (
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
                      {errors.sgamiId && (
                        <p className="mt-1 text-sm text-red-600">{errors.sgamiId.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="label block text-sm font-medium text-gray-700 mb-2">
                        Assigné à
                      </label>
                      <Listbox 
                        value={selectedUser} 
                        onChange={(user) => {
                          setSelectedUser(user)
                          setValue('assigneAId', user?.id || '')
                        }}
                        disabled={isSubmitting}
                      >
                        <div className="relative">
                          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-3 pl-3 pr-10 text-left shadow-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            tabIndex={0}>
                            <span className="block truncate">
                              {selectedUser ? (
                                `${selectedUser.grade ? `${selectedUser.grade} ` : ''}${selectedUser.prenom} ${selectedUser.nom}`
                              ) : (
                                'Sélectionner un utilisateur'
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
                                      Sélectionner un utilisateur
                                    </span>
                                    {selected ? (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </Listbox.Option>
                              {users.map((user) => (
                                <Listbox.Option
                                  key={user.id}
                                  value={user}
                                  className={({ active }) =>
                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                      active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                                    }`
                                  }
                                >
                                  {({ selected }) => (
                                    <>
                                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                        {user.grade && `${user.grade} `}{user.prenom} {user.nom}
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
                      {errors.assigneAId && (
                        <p className="mt-1 text-sm text-red-600">{errors.assigneAId.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Badges
                    </label>
                    <div className="bg-gray-50 rounded-lg p-4">
                      {badges.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-8">
                          Aucun badge disponible
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {badges.map((badge) => {
                            const isSelected = selectedBadges.includes(badge.id)
                            
                            return (
                              <div
                                key={badge.id}
                                onClick={() => toggleBadge(badge.id)}
                                className={`relative cursor-pointer rounded-lg p-2 border-2 transition-all duration-200 hover:shadow-md ${
                                  isSelected
                                    ? 'border-blue-500 shadow-sm'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <span 
                                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                                  style={badge.couleur ? { 
                                    backgroundColor: `${badge.couleur}20`, 
                                    color: badge.couleur 
                                  } : {}}
                                >
                                  {badge.nom}
                                  {isSelected && (
                                    <CheckIcon className="w-3 h-3 ml-1 flex-shrink-0" />
                                  )}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                    {selectedBadges.length > 0 && (
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-sm text-blue-600 font-medium">
                          {selectedBadges.length} badge(s) sélectionné(s)
                        </p>
                        <button
                          type="button"
                          onClick={() => setValue('badges', [])}
                          className="text-xs text-gray-500 hover:text-red-600 underline transition-colors"
                        >
                          Tout désélectionner
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      BAP (Bureau d'Aide aux Prévenus)
                      <span className="text-gray-500 font-normal ml-1">(sélection unique)</span>
                    </label>
                    <div className="bg-gray-50 rounded-lg p-4">
                      {baps.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-8">
                          Aucun BAP disponible
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <div
                            onClick={() => handleBapSelect('')}
                            className={`cursor-pointer rounded-lg p-3 border-2 transition-all duration-200 hover:shadow-md ${
                              selectedBapId === ''
                                ? 'border-blue-500 shadow-sm bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center">
                              <input 
                                type="radio" 
                                checked={selectedBapId === ''} 
                                onChange={() => {}} 
                                className="mr-3 text-blue-600" 
                              />
                              <span className="text-sm font-medium text-gray-700">
                                Aucun BAP assigné
                              </span>
                            </div>
                          </div>
                          
                          {baps.map((bap) => {
                            const isSelected = selectedBapId === bap.id
                            
                            return (
                              <div
                                key={bap.id}
                                onClick={() => handleBapSelect(bap.id)}
                                className={`cursor-pointer rounded-lg p-3 border-2 transition-all duration-200 hover:shadow-md ${
                                  isSelected
                                    ? 'border-blue-500 shadow-sm bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                              >
                                <div className="flex items-center">
                                  <input 
                                    type="radio" 
                                    checked={isSelected} 
                                    onChange={() => {}} 
                                    className="mr-3 text-blue-600" 
                                  />
                                  <div>
                                    <span className="text-sm font-medium text-gray-900">
                                      📧 {bap.nomBAP}
                                    </span>
                                    {(bap.mail1 || bap.mail2 || bap.mail3 || bap.mail4) && (
                                      <div className="text-xs text-gray-600 mt-1">
                                        {[bap.mail1, bap.mail2, bap.mail3, bap.mail4]
                                          .filter(Boolean)
                                          .slice(0, 2)
                                          .join(', ')}
                                        {[bap.mail1, bap.mail2, bap.mail3, bap.mail4].filter(Boolean).length > 2 && '...'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                    {selectedBapId && (
                      <div className="mt-3">
                        <p className="text-sm text-blue-600 font-medium">
                          BAP sélectionné : {baps.find(b => b.id === selectedBapId)?.nomBAP}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                      disabled={isSubmitting}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Enregistrement...' : dossier ? 'Modifier' : 'Créer'}
                    </button>
                  </div>
                </form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default DossierModal