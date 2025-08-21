import React, { useState, useEffect } from 'react'
import { Grade } from '@/types'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface GradeModalProps {
  grade: Grade | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (gradeData: Partial<Grade>) => void
  isSubmitting: boolean
}

const GradeModal: React.FC<GradeModalProps> = ({ grade, isOpen, onClose, onSubmit, isSubmitting }) => {
  const [formData, setFormData] = useState({
    gradeComplet: '',
    gradeAbrege: ''
  })

  const [errors, setErrors] = useState<{[key: string]: string}>({})

  useEffect(() => {
    if (grade) {
      setFormData({
        gradeComplet: grade.gradeComplet,
        gradeAbrege: grade.gradeAbrege
      })
    } else {
      setFormData({
        gradeComplet: '',
        gradeAbrege: ''
      })
    }
    setErrors({})
  }, [grade, isOpen])

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.gradeComplet.trim()) {
      newErrors.gradeComplet = 'Le grade complet est requis'
    }

    if (!formData.gradeAbrege.trim()) {
      newErrors.gradeAbrege = 'L\'abrégé est requis'
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={onClose}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {grade ? 'Modifier le grade' : 'Nouveau grade'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="gradeComplet" className="block text-sm font-medium text-gray-700">
                    Grade complet <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="gradeComplet"
                    value={formData.gradeComplet}
                    onChange={(e) => handleInputChange('gradeComplet', e.target.value)}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      errors.gradeComplet ? 'border-red-300' : ''
                    }`}
                    placeholder="Ex: Maréchal des logis-chef"
                  />
                  {errors.gradeComplet && (
                    <p className="mt-1 text-sm text-red-600">{errors.gradeComplet}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="gradeAbrege" className="block text-sm font-medium text-gray-700">
                    Abrégé <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="gradeAbrege"
                    value={formData.gradeAbrege}
                    onChange={(e) => handleInputChange('gradeAbrege', e.target.value)}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      errors.gradeAbrege ? 'border-red-300' : ''
                    }`}
                    placeholder="Ex: MDC"
                  />
                  {errors.gradeAbrege && (
                    <p className="mt-1 text-sm text-red-600">{errors.gradeAbrege}</p>
                  )}
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                      isSubmitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                    }`}
                  >
                    {isSubmitting ? 'En cours...' : (grade ? 'Modifier' : 'Créer')}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GradeModal