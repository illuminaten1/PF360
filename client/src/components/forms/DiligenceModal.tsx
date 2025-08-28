import React, { useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Diligence } from '@/types'

interface DiligenceModalProps {
  diligence: Diligence | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (diligenceData: Partial<Diligence>) => void
  isSubmitting: boolean
}

const DiligenceModal: React.FC<DiligenceModalProps> = ({
  diligence,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting
}) => {
  const [formData, setFormData] = useState({
    nom: '',
    details: '',
    active: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (diligence) {
      setFormData({
        nom: diligence.nom || '',
        details: diligence.details || '',
        active: diligence.active !== false
      })
    } else {
      setFormData({
        nom: '',
        details: '',
        active: true
      })
    }
    setErrors({})
  }, [diligence, isOpen])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis'
    }

    if (!formData.details.trim()) {
      newErrors.details = 'Les détails sont requis'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    onSubmit(formData)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {diligence ? 'Modifier la diligence' : 'Nouvelle diligence'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                      Nom de la diligence *
                    </label>
                    <input
                      type="text"
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => handleInputChange('nom', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.nom ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Ex: comparution sur reconnaissance préalable de culpabilité"
                    />
                    {errors.nom && (
                      <p className="mt-1 text-sm text-red-600">{errors.nom}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="details" className="block text-sm font-medium text-gray-700">
                      Détails des diligences *
                    </label>
                    <textarea
                      id="details"
                      rows={6}
                      value={formData.details}
                      onChange={(e) => handleInputChange('details', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.details ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Décrivez en détail les diligences couvertes par ces honoraires..."
                    />
                    {errors.details && (
                      <p className="mt-1 text-sm text-red-600">{errors.details}</p>
                    )}
                  </div>


                  <div className="flex items-center">
                    <input
                      id="active"
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => handleInputChange('active', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                      Diligence active
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                      disabled={isSubmitting}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Traitement...' : (diligence ? 'Modifier' : 'Créer')}
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

export default DiligenceModal