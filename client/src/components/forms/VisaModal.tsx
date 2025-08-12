import React, { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Visa } from '@/types'

interface VisaModalProps {
  visa: Visa | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (visaData: Partial<Visa>) => void
  isSubmitting?: boolean
}

const VisaModal: React.FC<VisaModalProps> = ({
  visa,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState({
    typeVisa: '',
    texteVisa: '',
    active: true
  })

  useEffect(() => {
    if (visa) {
      setFormData({
        typeVisa: visa.typeVisa,
        texteVisa: visa.texteVisa,
        active: visa.active ?? true
      })
    } else {
      setFormData({
        typeVisa: '',
        texteVisa: '',
        active: true
      })
    }
  }, [visa])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {visa ? 'Modifier le visa' : 'Nouveau visa'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="typeVisa" className="block text-sm font-medium text-gray-700 mb-2">
              Type de Visa <span className="text-red-500">*</span>
            </label>
            <select
              id="typeVisa"
              name="typeVisa"
              value={formData.typeVisa}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Sélectionnez un type</option>
              <option value="MILITAIRE">Militaire</option>
              <option value="CIVIL">Civil</option>
            </select>
          </div>

          <div>
            <label htmlFor="texteVisa" className="block text-sm font-medium text-gray-700 mb-2">
              Texte du Visa <span className="text-red-500">*</span>
            </label>
            <textarea
              id="texteVisa"
              name="texteVisa"
              value={formData.texteVisa}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Entrez le texte du visa..."
            />
          </div>

          <div className="flex items-center">
            <input
              id="active"
              name="active"
              type="checkbox"
              checked={formData.active}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
              Visa actif
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Enregistrement...' : (visa ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VisaModal