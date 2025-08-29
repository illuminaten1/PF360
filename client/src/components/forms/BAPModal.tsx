import React, { useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline'
import { BAP } from '@/types'

interface BAPModalProps {
  bap: BAP | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (bapData: Partial<BAP>) => void
  isSubmitting: boolean
}

const BAPModal: React.FC<BAPModalProps> = ({ bap, isOpen, onClose, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    nomBAP: '',
    mail1: '',
    mail2: '',
    mail3: '',
    mail4: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (bap) {
      setFormData({
        nomBAP: bap.nomBAP || '',
        mail1: bap.mail1 || '',
        mail2: bap.mail2 || '',
        mail3: bap.mail3 || '',
        mail4: bap.mail4 || ''
      })
    } else {
      setFormData({
        nomBAP: '',
        mail1: '',
        mail2: '',
        mail3: '',
        mail4: ''
      })
    }
    setErrors({})
  }, [bap, isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nomBAP.trim()) {
      newErrors.nomBAP = 'Le nom du BAP est requis'
    }

    // Validation des emails (optionnels mais doivent être valides si renseignés)
    const emailFields = ['mail1', 'mail2', 'mail3', 'mail4'] as const
    emailFields.forEach(field => {
      const email = formData[field].trim()
      if (email && !validateEmail(email)) {
        newErrors[field] = 'Adresse email invalide'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const submitData: Partial<BAP> = {
      nomBAP: formData.nomBAP.trim(),
      mail1: formData.mail1.trim() || undefined,
      mail2: formData.mail2.trim() || undefined,
      mail3: formData.mail3.trim() || undefined,
      mail4: formData.mail4.trim() || undefined
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                    <BuildingOffice2Icon className="h-6 w-6 mr-2 text-blue-600" />
                    {bap ? 'Modifier le BAP' : 'Nouveau BAP'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom du BAP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du BAP *
            </label>
            <input
              type="text"
              name="nomBAP"
              value={formData.nomBAP}
              onChange={handleInputChange}
              placeholder="Ex: RGARA, RGBRET, RGOCC..."
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.nomBAP ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.nomBAP && (
              <p className="text-red-500 text-sm mt-1">{errors.nomBAP}</p>
            )}
          </div>

          {/* Adresses email */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Adresses email
            </label>
            
            {(['mail1', 'mail2', 'mail3', 'mail4'] as const).map((fieldName, index) => (
              <div key={fieldName}>
                <input
                  type="email"
                  name={fieldName}
                  value={formData[fieldName]}
                  onChange={handleInputChange}
                  placeholder={`Adresse email ${index + 1}`}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors[fieldName] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                {errors[fieldName] && (
                  <p className="text-red-500 text-sm mt-1">{errors[fieldName]}</p>
                )}
              </div>
            ))}
            
            <p className="text-xs text-gray-500">
              Les adresses email sont optionnelles mais doivent être valides si renseignées
            </p>
          </div>

          {/* Aperçu */}
          {formData.nomBAP && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Aperçu du BAP
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <BuildingOffice2Icon className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="font-medium text-blue-900">{formData.nomBAP}</span>
                </div>
                
                {[formData.mail1, formData.mail2, formData.mail3, formData.mail4]
                  .filter(Boolean)
                  .map((email, index) => (
                    <div key={index} className="text-xs text-blue-700 ml-8">
                      {email}
                    </div>
                  ))}
              </div>
            </div>
          )}

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
              {isSubmitting ? 'Enregistrement...' : (bap ? 'Modifier' : 'Créer')}
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

export default BAPModal