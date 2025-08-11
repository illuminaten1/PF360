import React, { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Badge } from '@/types'

interface BadgeModalProps {
  badge: Badge | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (badgeData: Partial<Badge>) => void
  isSubmitting: boolean
}

const predefinedColors = [
  '#ef4444', // rouge
  '#f97316', // orange
  '#eab308', // jaune
  '#22c55e', // vert
  '#06b6d4', // cyan
  '#3b82f6', // bleu
  '#8b5cf6', // violet
  '#ec4899', // rose
  '#6b7280', // gris
  '#1f2937', // gris foncé
]

const BadgeModal: React.FC<BadgeModalProps> = ({ badge, isOpen, onClose, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    nom: '',
    couleur: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (badge) {
      setFormData({
        nom: badge.nom || '',
        couleur: badge.couleur || ''
      })
    } else {
      setFormData({
        nom: '',
        couleur: predefinedColors[0]
      })
    }
    setErrors({})
  }, [badge, isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleColorSelect = (color: string) => {
    setFormData(prev => ({ ...prev, couleur: color }))
    if (errors.couleur) {
      setErrors(prev => ({ ...prev, couleur: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom du badge est requis'
    }

    if (!formData.couleur.trim()) {
      newErrors.couleur = 'Une couleur doit être sélectionnée'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const submitData: Partial<Badge> = {
      nom: formData.nom.trim(),
      couleur: formData.couleur.trim()
    }

    onSubmit(submitData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {badge ? 'Modifier le badge' : 'Nouveau badge'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom du badge */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du badge *
            </label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleInputChange}
              placeholder="Ex: Urgent, Priorité haute, En attente..."
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.nom ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.nom && (
              <p className="text-red-500 text-sm mt-1">{errors.nom}</p>
            )}
          </div>

          {/* Couleur - Sélection rapide */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Couleur *
            </label>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  className={`w-12 h-12 rounded-full border-2 transition-all hover:scale-110 ${
                    formData.couleur === color 
                      ? 'border-gray-800 ring-2 ring-blue-500 ring-offset-2' 
                      : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Couleur personnalisée */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Couleur personnalisée
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                name="couleur"
                value={formData.couleur}
                onChange={handleInputChange}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                disabled={isSubmitting}
              />
              <input
                type="text"
                name="couleur"
                value={formData.couleur}
                onChange={handleInputChange}
                placeholder="#ffffff"
                className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                  errors.couleur ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
            </div>
            {errors.couleur && (
              <p className="text-red-500 text-sm mt-1">{errors.couleur}</p>
            )}
          </div>

          {/* Aperçu */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aperçu du badge
            </label>
            <div className="flex items-center">
              <span 
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white shadow-sm"
                style={{ backgroundColor: formData.couleur || '#e5e7eb' }}
              >
                {formData.nom || 'Nom du badge'}
              </span>
            </div>
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
              {isSubmitting ? 'Enregistrement...' : (badge ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BadgeModal