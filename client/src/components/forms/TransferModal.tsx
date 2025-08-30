import React, { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { User } from '@/types'

interface TransferModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (sourceUserId: string, targetUserId: string) => void
  isSubmitting: boolean
  users: User[]
}

const TransferModal: React.FC<TransferModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isSubmitting, 
  users 
}) => {
  const [sourceUserId, setSourceUserId] = useState('')
  const [targetUserId, setTargetUserId] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Filtrer pour ne garder que les utilisateurs actifs
  const utilisateursActifs = users.filter(user => user.active)

  useEffect(() => {
    if (!isOpen) {
      setSourceUserId('')
      setTargetUserId('')
      setErrors({})
    }
  }, [isOpen])

  const handleInputChange = (field: string, value: string) => {
    if (field === 'sourceUserId') {
      setSourceUserId(value)
      // Si on sélectionne la même personne comme destination, la désélectionner
      if (value === targetUserId) {
        setTargetUserId('')
      }
    } else {
      setTargetUserId(value)
      // Si on sélectionne la même personne comme source, la désélectionner
      if (value === sourceUserId) {
        setSourceUserId('')
      }
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!sourceUserId) {
      newErrors.sourceUserId = 'Sélectionnez l\'utilisateur source'
    }

    if (!targetUserId) {
      newErrors.targetUserId = 'Sélectionnez l\'utilisateur destination'
    }

    if (sourceUserId && targetUserId && sourceUserId === targetUserId) {
      newErrors.targetUserId = 'L\'utilisateur source et destination doivent être différents'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    onSubmit(sourceUserId, targetUserId)
  }

  const getSourceUser = () => utilisateursActifs.find(user => user.id === sourceUserId)
  const getTargetUser = () => utilisateursActifs.find(user => user.id === targetUserId)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Transférer les assignations
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Cette action transférera toutes les demandes et dossiers assignés du rédacteur source vers le rédacteur destination.
          </p>
          <p className="text-xs text-orange-600 mt-2">
            ⚠️ Cette action est irréversible. Les informations de création et modification ne seront pas modifiées.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rédacteur source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Utilisateur source (transférer DE) *
            </label>
            <select
              value={sourceUserId}
              onChange={(e) => handleInputChange('sourceUserId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.sourceUserId ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            >
              <option value="">Sélectionnez un utilisateur</option>
              {utilisateursActifs.map(user => (
                <option key={user.id} value={user.id} disabled={user.id === targetUserId}>
                  {user.nom} {user.prenom} ({user.identifiant}) - {user.role}
                </option>
              ))}
            </select>
            {errors.sourceUserId && (
              <p className="text-red-500 text-sm mt-1">{errors.sourceUserId}</p>
            )}
          </div>

          {/* Utilisateur destination */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Utilisateur destination (transférer VERS) *
            </label>
            <select
              value={targetUserId}
              onChange={(e) => handleInputChange('targetUserId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.targetUserId ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            >
              <option value="">Sélectionnez un utilisateur</option>
              {utilisateursActifs.map(user => (
                <option key={user.id} value={user.id} disabled={user.id === sourceUserId}>
                  {user.nom} {user.prenom} ({user.identifiant}) - {user.role}
                </option>
              ))}
            </select>
            {errors.targetUserId && (
              <p className="text-red-500 text-sm mt-1">{errors.targetUserId}</p>
            )}
          </div>

          {/* Résumé du transfert */}
          {sourceUserId && targetUserId && (
            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Résumé du transfert :</h4>
              <p className="text-sm text-blue-700">
                <strong>De :</strong> {getSourceUser()?.nom} {getSourceUser()?.prenom} ({getSourceUser()?.identifiant})
              </p>
              <p className="text-sm text-blue-700">
                <strong>Vers :</strong> {getTargetUser()?.nom} {getTargetUser()?.prenom} ({getTargetUser()?.identifiant})
              </p>
              <p className="text-xs text-blue-600 mt-2">
                Toutes les demandes et dossiers assignés à {getSourceUser()?.prenom} seront transférés à {getTargetUser()?.prenom}.
              </p>
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
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
              disabled={isSubmitting || !sourceUserId || !targetUserId}
            >
              {isSubmitting ? 'Transfert en cours...' : 'Confirmer le transfert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TransferModal