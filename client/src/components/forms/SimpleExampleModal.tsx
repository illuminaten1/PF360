import React from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { z } from 'zod'
import { XMarkIcon, UserIcon } from '@heroicons/react/24/outline'
import { useModalForm, createStandardInput, useRadioButtons } from '@/hooks/useModalForm.simple'

// Schéma de validation Zod
const userSchema = z.object({
  nom: z.string().min(1, 'Le nom est obligatoire'),
  email: z.string().email('Email invalide'),
  age: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'L\'âge doit être un nombre positif'
  }),
  statut: z.enum(['actif', 'inactif'])
})

type UserFormData = z.infer<typeof userSchema>

interface SimpleExampleModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: UserFormData) => void | Promise<void>
  user?: UserFormData | null
  title?: string
}

const SimpleExampleModal: React.FC<SimpleExampleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  user,
  title = 'Nouvel utilisateur'
}) => {
  
  const {
    form,
    handleSubmit,
    canSubmit,
    isSubmitting
  } = useModalForm({
    schema: userSchema,
    isOpen,
    initialData: user,
    onSubmit,
    defaultValues: {
      nom: '',
      email: '',
      age: '',
      statut: 'actif' as const
    }
  })

  const statutOptions = [
    { value: 'actif' as const, label: 'Actif' },
    { value: 'inactif' as const, label: 'Inactif' }
  ]

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
                
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                    <UserIcon className="h-6 w-6 mr-2 text-blue-600" />
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

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Nom */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom *
                      </label>
                      <form.Field name="nom">
                        {(field) => (
                          <div>
                            {createStandardInput(field, { placeholder: 'Nom complet' })}
                            {field.state.meta.errors.length > 0 && (
                              <p className="text-red-500 text-xs mt-1">
                                {field.state.meta.errors[0]}
                              </p>
                            )}
                          </div>
                        )}
                      </form.Field>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <form.Field name="email">
                        {(field) => (
                          <div>
                            {createStandardInput(field, { 
                              type: 'email', 
                              placeholder: 'email@exemple.com' 
                            })}
                            {field.state.meta.errors.length > 0 && (
                              <p className="text-red-500 text-xs mt-1">
                                {field.state.meta.errors[0]}
                              </p>
                            )}
                          </div>
                        )}
                      </form.Field>
                    </div>

                    {/* Âge */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Âge *
                      </label>
                      <form.Field name="age">
                        {(field) => (
                          <div>
                            {createStandardInput(field, { 
                              type: 'number', 
                              min: '1',
                              max: '120',
                              placeholder: '25' 
                            })}
                            {field.state.meta.errors.length > 0 && (
                              <p className="text-red-500 text-xs mt-1">
                                {field.state.meta.errors[0]}
                              </p>
                            )}
                          </div>
                        )}
                      </form.Field>
                    </div>

                    {/* Statut */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Statut *
                      </label>
                      <form.Field name="statut">
                        {(field) => {
                          const { renderButtons } = useRadioButtons(field, statutOptions)
                          return (
                            <div>
                              {renderButtons()}
                              {field.state.meta.errors.length > 0 && (
                                <p className="text-red-500 text-xs mt-1">
                                  {field.state.meta.errors[0]}
                                </p>
                              )}
                            </div>
                          )
                        }}
                      </form.Field>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-6 border-t mt-8">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting
                        ? 'En cours...'
                        : user ? 'Modifier' : 'Créer'
                      }
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

export default SimpleExampleModal