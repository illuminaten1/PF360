import React, { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { User } from '@/types'

interface UserModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (userData: Partial<User>) => void
  isSubmitting: boolean
}

const UserModal: React.FC<UserModalProps> = ({ user, isOpen, onClose, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    identifiant: '',
    nom: '',
    prenom: '',
    mail: '',
    role: 'REDACTEUR' as 'ADMIN' | 'REDACTEUR' | 'GREFFIER',
    grade: '',
    telephone: '',
    password: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user) {
      setFormData({
        identifiant: user.identifiant || '',
        nom: user.nom || '',
        prenom: user.prenom || '',
        mail: user.mail || '',
        role: user.role || 'REDACTEUR',
        grade: user.grade || '',
        telephone: user.telephone || '',
        password: ''
      })
    } else {
      setFormData({
        identifiant: '',
        nom: '',
        prenom: '',
        mail: '',
        role: 'REDACTEUR',
        grade: '',
        telephone: '',
        password: ''
      })
    }
    setErrors({})
  }, [user, isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.identifiant.trim()) {
      newErrors.identifiant = 'L\'identifiant est requis'
    }
    
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis'
    }
    
    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis'
    }
    
    if (!formData.mail.trim()) {
      newErrors.mail = 'L\'email est requis'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.mail)) {
      newErrors.mail = 'Format d\'email invalide'
    }

    if (!user && !formData.password.trim()) {
      newErrors.password = 'Le mot de passe est requis pour un nouvel utilisateur'
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const submitData: Partial<User> & { password?: string } = {
      identifiant: formData.identifiant.trim(),
      nom: formData.nom.trim(),
      prenom: formData.prenom.trim(),
      mail: formData.mail.trim(),
      role: formData.role,
      grade: formData.grade.trim() || undefined,
      telephone: formData.telephone.trim() || undefined
    }

    if (formData.password.trim()) {
      submitData.password = formData.password
    }

    onSubmit(submitData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {user ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Identifiant *
              </label>
              <input
                type="text"
                name="identifiant"
                value={formData.identifiant}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.identifiant ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.identifiant && (
                <p className="text-red-500 text-sm mt-1">{errors.identifiant}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rôle *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="REDACTEUR">Rédacteur</option>
                <option value="GREFFIER">Greffier</option>
                <option value="ADMIN">Administrateur</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom *
              </label>
              <input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.nom ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.nom && (
                <p className="text-red-500 text-sm mt-1">{errors.nom}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom *
              </label>
              <input
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.prenom ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {errors.prenom && (
                <p className="text-red-500 text-sm mt-1">{errors.prenom}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="mail"
              value={formData.mail}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.mail ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.mail && (
              <p className="text-red-500 text-sm mt-1">{errors.mail}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade
              </label>
              <input
                type="text"
                name="grade"
                value={formData.grade}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
              </label>
              <input
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {user ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
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
              {isSubmitting ? 'Enregistrement...' : (user ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserModal