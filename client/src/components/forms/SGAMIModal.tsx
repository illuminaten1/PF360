import React, { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { SGAMI } from '@/types'

interface SGAMIModalProps {
  sgami: SGAMI | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (sgamiData: Partial<SGAMI>) => void
  isSubmitting: boolean
}

const SGAMIModal: React.FC<SGAMIModalProps> = ({ sgami, isOpen, onClose, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    nom: '',
    formatCourtNommage: '',
    texteConvention: '',
    intituleFicheReglement: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (sgami) {
      setFormData({
        nom: sgami.nom || '',
        formatCourtNommage: sgami.formatCourtNommage || '',
        texteConvention: (sgami as any).texteConvention || '',
        intituleFicheReglement: (sgami as any).intituleFicheReglement || ''
      })
    } else {
      setFormData({
        nom: '',
        formatCourtNommage: '',
        texteConvention: '',
        intituleFicheReglement: ''
      })
    }
    setErrors({})
  }, [sgami, isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const submitData: Partial<SGAMI> = {
      nom: formData.nom.trim(),
      formatCourtNommage: formData.formatCourtNommage.trim() || undefined,
      texteConvention: formData.texteConvention.trim() || undefined,
      intituleFicheReglement: formData.intituleFicheReglement.trim() || undefined
    }

    onSubmit(submitData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {sgami ? 'Modifier le SGAMI' : 'Nouveau SGAMI'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du SGAMI *
            </label>
            <input
              type="text"
              name="nom"
              value={formData.nom}
              onChange={handleInputChange}
              placeholder="Ex: SGAMI SUD-EST"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.nom ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.nom && (
              <p className="text-red-500 text-sm mt-1">{errors.nom}</p>
            )}
          </div>

          {/* Format court nommage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Format court nommage
            </label>
            <input
              type="text"
              name="formatCourtNommage"
              value={formData.formatCourtNommage}
              onChange={handleInputChange}
              placeholder="Ex: SUD-EST"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
          </div>

          {/* Texte Convention */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Texte Convention
            </label>
            <textarea
              name="texteConvention"
              value={formData.texteConvention}
              onChange={handleInputChange}
              placeholder="Ex: La demande de règlement est constituée par la DGGN et envoyée pour mise en paiement au SGAMI SUD-EST."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
              disabled={isSubmitting}
            />
          </div>

          {/* Intitulé Fiche Règlement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Intitulé pour les fiches de règlement
            </label>
            <textarea
              name="intituleFicheReglement"
              value={formData.intituleFicheReglement}
              onChange={handleInputChange}
              placeholder="Ex: SGAMI SUD, par mail : sylvie.gaconier@interieur.gouv.fr ; josiane.apelian@interieur.gouv.fr ; virginie.peluso@interieur.gouv.fr ; pierrette.ruggiu@interieur.gouv.fr"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500 mt-1">
              Format utilisé dans les fiches de règlement pour identifier le SGAMI et ses contacts
            </p>
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
              {isSubmitting ? 'Enregistrement...' : (sgami ? 'Modifier' : 'Créer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SGAMIModal