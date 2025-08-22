import React, { useState, useEffect, useRef } from 'react'
import { 
  ArrowDownTrayIcon, 
  ArrowUpTrayIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'

interface Template {
  name: string
  filename: string
  status: 'default' | 'custom'
}

interface Templates {
  decision: Template
  convention: Template
  avenant: Template
  reglement: Template
}

const Templates: React.FC = () => {
  const [templates, setTemplates] = useState<Templates>({
    decision: { 
      name: 'Template de décision', 
      filename: 'decision_template.docx', 
      status: 'default' 
    },
    convention: { 
      name: 'Template de convention d\'honoraires', 
      filename: 'convention_template.docx', 
      status: 'default' 
    },
    avenant: { 
      name: 'Template d\'avenant', 
      filename: 'avenant_template.docx', 
      status: 'default' 
    },
    reglement: { 
      name: 'Template de fiche de règlement', 
      filename: 'reglement_template.docx', 
      status: 'default' 
    }
  })

  const [loading, setLoading] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [templateToRestore, setTemplateToRestore] = useState<keyof Templates | ''>('')
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const decisionInputRef = useRef<HTMLInputElement>(null)
  const conventionInputRef = useRef<HTMLInputElement>(null)
  const avenantInputRef = useRef<HTMLInputElement>(null)
  const reglementInputRef = useRef<HTMLInputElement>(null)

  const inputRefs = {
    decision: decisionInputRef,
    convention: conventionInputRef,
    avenant: avenantInputRef,
    reglement: reglementInputRef
  }

  useEffect(() => {
    fetchTemplatesStatus()
  }, [])

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [errorMessage])

  const fetchTemplatesStatus = async () => {
    try {
      // TODO: Implement API call to get templates status
      // const response = await templatesAPI.getStatus()
      // setTemplates(prevTemplates => ({
      //   ...prevTemplates,
      //   decision: { ...prevTemplates.decision, status: response.data.decision || 'default' },
      //   convention: { ...prevTemplates.convention, status: response.data.convention || 'default' },
      //   avenant: { ...prevTemplates.avenant, status: response.data.avenant || 'default' },
      //   reglement: { ...prevTemplates.reglement, status: response.data.reglement || 'default' }
      // }))
    } catch (err) {
      console.error('Erreur lors de la récupération du statut des templates', err)
    }
  }

  const handleDownloadTemplate = async (templateType: keyof Templates) => {
    setLoading(true)
    try {
      // TODO: Implement API call to download template
      // const response = await templatesAPI.downloadTemplate(templateType)
      // 
      // const url = window.URL.createObjectURL(new Blob([response.data]))
      // const link = document.createElement('a')
      // link.href = url
      // link.setAttribute('download', templates[templateType].filename)
      // document.body.appendChild(link)
      // link.click()
      // document.body.removeChild(link)
      
      setSuccessMessage(`Template ${templates[templateType].name} téléchargé avec succès`)
    } catch (err) {
      console.error(`Erreur lors du téléchargement du template ${templateType}:`, err)
      setErrorMessage(`Impossible de télécharger le template ${templates[templateType].name}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUploadTemplate = async (event: React.ChangeEvent<HTMLInputElement>, templateType: keyof Templates) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    if (fileExt !== 'docx') {
      setErrorMessage('Le fichier doit être au format DOCX (.docx)')
      return
    }
    
    setLoading(true)
    
    try {
      // TODO: Implement API call to upload template
      // const formData = new FormData()
      // formData.append('template', file)
      // 
      // await templatesAPI.uploadTemplate(templateType, formData)
      
      setTemplates(prevTemplates => ({
        ...prevTemplates,
        [templateType]: {
          ...prevTemplates[templateType],
          status: 'custom'
        }
      }))
      
      setSuccessMessage(`Template ${templates[templateType].name} mis à jour avec succès`)
    } catch (err) {
      console.error(`Erreur lors de l'upload du template ${templateType}:`, err)
      setErrorMessage(`Impossible d'uploader le template ${templates[templateType].name}`)
    } finally {
      setLoading(false)
      if (inputRefs[templateType]?.current) {
        inputRefs[templateType].current!.value = ''
      }
    }
  }

  const handleRestoreTemplate = async () => {
    if (!templateToRestore) return
    
    setLoading(true)
    try {
      // TODO: Implement API call to restore template
      // await templatesAPI.restoreTemplate(templateToRestore)
      
      setTemplates(prevTemplates => ({
        ...prevTemplates,
        [templateToRestore]: {
          ...prevTemplates[templateToRestore],
          status: 'default'
        }
      }))
      
      setShowRestoreModal(false)
      setSuccessMessage(`Template ${templates[templateToRestore].name} restauré avec succès`)
    } catch (err) {
      console.error(`Erreur lors de la restauration du template ${templateToRestore}`, err)
      setErrorMessage(`Impossible de restaurer le template ${templates[templateToRestore].name}`)
    } finally {
      setLoading(false)
    }
  }

  const triggerFileInput = (templateType: keyof Templates) => {
    if (inputRefs[templateType]?.current) {
      inputRefs[templateType].current!.click()
    }
  }

  const openRestoreConfirmation = (templateType: keyof Templates) => {
    setTemplateToRestore(templateType)
    setShowRestoreModal(true)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des templates</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gérez les templates utilisés pour la génération des documents (décisions, conventions, avenants et fiches de règlement).
        </p>
      </div>

      {/* Messages de notification */}
      {successMessage && (
        <div className="mb-6 rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Avertissement */}
      <div className="mb-6 rounded-md bg-yellow-50 p-4 border-l-4 border-yellow-400">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Important :</strong> Consultez la documentation avant de modifier les templates.
              Les templates personnalisés remplacent les templates par défaut pour la génération des documents.
            </p>
          </div>
        </div>
      </div>

      {/* Liste des templates */}
      <div className="space-y-6">
        {Object.entries(templates).map(([key, template]) => {
          const templateType = key as keyof Templates
          return (
            <div key={key} className="bg-white shadow rounded-lg border border-gray-200">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="mb-4 sm:mb-0">
                    <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        template.status === 'custom' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {template.status === 'custom' ? 'Personnalisé' : 'Par défaut'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleDownloadTemplate(templateType)}
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      title="Télécharger le template actuel"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                      Télécharger
                    </button>
                    
                    <button
                      onClick={() => triggerFileInput(templateType)}
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                      title="Uploader un template personnalisé"
                    >
                      <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                      Uploader
                    </button>
                    
                    <input
                      type="file"
                      ref={inputRefs[templateType]}
                      className="hidden"
                      accept=".docx"
                      onChange={(e) => handleUploadTemplate(e, templateType)}
                    />
                    
                    {template.status === 'custom' && (
                      <button
                        onClick={() => openRestoreConfirmation(templateType)}
                        disabled={loading}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        title="Restaurer le template par défaut"
                      >
                        <ArrowPathIcon className="h-4 w-4 mr-2" />
                        Restaurer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal de confirmation de restauration */}
      {showRestoreModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowRestoreModal(false)}></div>
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Restaurer le template {templateToRestore ? templates[templateToRestore].name : ''}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Êtes-vous sûr de vouloir restaurer le template par défaut pour 
                        <strong> {templateToRestore ? templates[templateToRestore].name : ''}</strong> ?
                      </p>
                      <p className="mt-2 text-sm text-yellow-600">
                        Cette action remplacera définitivement votre template personnalisé par le template par défaut.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-yellow-600 text-base font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleRestoreTemplate}
                >
                  Restaurer
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowRestoreModal(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Templates