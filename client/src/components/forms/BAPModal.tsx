import React, { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {bap ? 'Modifier le BAP' : 'Nouveau BAP'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aperçu du BAP
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mr-3">
                    <span className="text-blue-600 text-xs font-bold">
                      {formData.nomBAP.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900">{formData.nomBAP}</span>
                </div>
                
                {[formData.mail1, formData.mail2, formData.mail3, formData.mail4]
                  .filter(Boolean)
                  .map((email, index) => (
                    <div key={index} className="text-xs text-gray-600 ml-11">
                      {email}
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enregistrement...' : (bap ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BAPModal