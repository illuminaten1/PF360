import React, { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { PCE } from '@/types'

interface PCEModalProps {
  pce: PCE | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (pceData: Partial<PCE>) => void
  isSubmitting: boolean
}

const PCEModal: React.FC<PCEModalProps> = ({ pce, isOpen, onClose, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    pceDetaille: '',
    pceNumerique: '',
    codeMarchandise: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (pce) {
      setFormData({
        pceDetaille: pce.pceDetaille || '',
        pceNumerique: pce.pceNumerique || '',
        codeMarchandise: pce.codeMarchandise || ''
      })
    } else {
      setFormData({
        pceDetaille: '',
        pceNumerique: '',
        codeMarchandise: ''
      })
    }
    setErrors({})
  }, [pce, isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.pceDetaille.trim()) {
      newErrors.pceDetaille = 'Le PCE détaillé est requis'
    }

    if (!formData.pceNumerique.trim()) {
      newErrors.pceNumerique = 'Le PCE numérique est requis'
    }

    if (!formData.codeMarchandise.trim()) {
      newErrors.codeMarchandise = 'Le code marchandise est requis'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const submitData: Partial<PCE> = {
      pceDetaille: formData.pceDetaille.trim(),
      pceNumerique: formData.pceNumerique.trim(),
      codeMarchandise: formData.codeMarchandise.trim()
    }

    onSubmit(submitData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {pce ? 'Modifier le PCE' : 'Nouveau PCE'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!pce && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Info :</span> L'ordre sera automatiquement défini lors de la création. 
                Vous pourrez réorganiser les PCE via glisser-déposer sur la liste principale.
              </p>
            </div>
          )}

          {/* PCE détaillé */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PCE détaillé *
            </label>
            <input
              type="text"
              name="pceDetaille"
              value={formData.pceDetaille}
              onChange={handleInputChange}
              placeholder="Ex: Règlement des frais et honoraires d'avocat (PCE 6131.000.000)"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.pceDetaille ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.pceDetaille && (
              <p className="text-red-500 text-sm mt-1">{errors.pceDetaille}</p>
            )}
          </div>

          {/* PCE numérique */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PCE numérique *
            </label>
            <input
              type="text"
              name="pceNumerique"
              value={formData.pceNumerique}
              onChange={handleInputChange}
              placeholder="Ex: PCE 6131.000.000"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${
                errors.pceNumerique ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.pceNumerique && (
              <p className="text-red-500 text-sm mt-1">{errors.pceNumerique}</p>
            )}
          </div>

          {/* Code marchandise */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Code marchandise *
            </label>
            <input
              type="text"
              name="codeMarchandise"
              value={formData.codeMarchandise}
              onChange={handleInputChange}
              placeholder="Ex: 40.03.02"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${
                errors.codeMarchandise ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.codeMarchandise && (
              <p className="text-red-500 text-sm mt-1">{errors.codeMarchandise}</p>
            )}
          </div>

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
              {isSubmitting ? 'Enregistrement...' : (pce ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PCEModal