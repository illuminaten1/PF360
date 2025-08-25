import React, { useState, useRef, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { 
  ArrowDownTrayIcon, 
  ArrowUpTrayIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  CogIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { templatesAPI } from '@/utils/api'
import { TemplatesConfig, TemplateStats } from '@/types/template'
import TemplateVersionHistory from '@/components/TemplateVersionHistory'


const TemplatesPage: React.FC = () => {
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [templateToRestore, setTemplateToRestore] = useState<keyof TemplatesConfig | ''>('')
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<keyof TemplatesConfig | ''>('')
  
  const queryClient = useQueryClient()
  
  const TEMPLATE_CONFIG: TemplatesConfig = {
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
  }

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

  // Fetch templates status
  const { data: templatesStatus } = useQuery({
    queryKey: ['templates-status'],
    queryFn: async () => {
      const response = await templatesAPI.getStatus()
      return response.data
    }
  })

  // Calculate stats
  const stats: TemplateStats = useMemo(() => {
    if (!templatesStatus) {
      return { totalTemplates: 4, customTemplates: 0, defaultTemplates: 4 }
    }
    
    const customCount = Object.values(templatesStatus).filter(status => status === 'custom').length
    return {
      totalTemplates: 4,
      customTemplates: customCount,
      defaultTemplates: 4 - customCount
    }
  }, [templatesStatus])

  // Get current templates with status
  const templates: TemplatesConfig = useMemo(() => {
    const result = { ...TEMPLATE_CONFIG }
    if (templatesStatus) {
      Object.keys(result).forEach(key => {
        const templateKey = key as keyof TemplatesConfig
        result[templateKey].status = templatesStatus[templateKey] || 'default'
      })
    }
    return result
  }, [templatesStatus])

  // Download template mutation
  const downloadTemplateMutation = useMutation({
    mutationFn: async (templateType: keyof TemplatesConfig) => {
      const response = await templatesAPI.downloadTemplate(templateType)
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', templates[templateType].filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      return templateType
    },
    onSuccess: (templateType) => {
      toast.success(`${templates[templateType].name} téléchargé avec succès`)
    },
    onError: (_, templateType) => {
      toast.error(`Impossible de télécharger le ${templates[templateType].name}`)
    }
  })

  // Upload template mutation
  const uploadTemplateMutation = useMutation({
    mutationFn: async ({ templateType, file }: { templateType: keyof TemplatesConfig; file: File }) => {
      const formData = new FormData()
      formData.append('template', file)
      await templatesAPI.uploadTemplate(templateType, formData)
      return templateType
    },
    onSuccess: (templateType) => {
      queryClient.invalidateQueries({ queryKey: ['templates-status'] })
      toast.success(`${templates[templateType].name} mis à jour avec succès`)
      // Clear file input
      if (inputRefs[templateType]?.current) {
        inputRefs[templateType].current!.value = ''
      }
    },
    onError: (error: any, { templateType }) => {
      toast.error(`Impossible d'uploader le ${templates[templateType].name}: ${error.response?.data?.error || error.message}`)
    }
  })

  // Restore template mutation
  const restoreTemplateMutation = useMutation({
    mutationFn: async (templateType: keyof TemplatesConfig) => {
      await templatesAPI.restoreTemplate(templateType)
      return templateType
    },
    onSuccess: (templateType) => {
      queryClient.invalidateQueries({ queryKey: ['templates-status'] })
      setShowRestoreModal(false)
      setTemplateToRestore('')
      toast.success(`${templates[templateType].name} restauré avec succès`)
    },
    onError: (_, templateType) => {
      toast.error(`Impossible de restaurer le ${templates[templateType].name}`)
    }
  })

  // Handlers
  const handleDownloadTemplate = (templateType: keyof TemplatesConfig) => {
    downloadTemplateMutation.mutate(templateType)
  }

  const handleUploadTemplate = (event: React.ChangeEvent<HTMLInputElement>, templateType: keyof TemplatesConfig) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    if (fileExt !== 'docx') {
      toast.error('Le fichier doit être au format DOCX (.docx)')
      return
    }
    
    uploadTemplateMutation.mutate({ templateType, file })
  }

  const handleRestoreTemplate = () => {
    if (!templateToRestore) return
    restoreTemplateMutation.mutate(templateToRestore)
  }

  const triggerFileInput = (templateType: keyof TemplatesConfig) => {
    if (inputRefs[templateType]?.current) {
      inputRefs[templateType].current!.click()
    }
  }

  const openRestoreConfirmation = (templateType: keyof TemplatesConfig) => {
    setTemplateToRestore(templateType)
    setShowRestoreModal(true)
  }

  const openVersionHistory = (templateType: keyof TemplatesConfig) => {
    setSelectedTemplate(templateType)
    setShowVersionHistory(true)
  }

  const isLoadingActions = downloadTemplateMutation.isPending || uploadTemplateMutation.isPending || restoreTemplateMutation.isPending

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <DocumentDuplicateIcon className="w-7 h-7 mr-3 text-blue-600" />
            Gestion des templates
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez les templates utilisés pour la génération des documents
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <DocumentDuplicateIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total templates</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalTemplates}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Templates personnalisés</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.customTemplates}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-gray-100">
              <CogIcon className="w-6 h-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Templates par défaut</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.defaultTemplates}</p>
            </div>
          </div>
        </div>
      </div>


      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(templates).map(([key, template]) => {
          const templateType = key as keyof TemplatesConfig
          return (
            <div key={key} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{template.filename}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  template.status === 'custom' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {template.status === 'custom' ? 'Personnalisé' : 'Par défaut'}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleDownloadTemplate(templateType)}
                  disabled={isLoadingActions}
                  className="btn-secondary flex items-center text-sm"
                  title="Télécharger le template actuel"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                  Télécharger
                </button>
                
                <button
                  onClick={() => triggerFileInput(templateType)}
                  disabled={isLoadingActions}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center text-sm transition-colors disabled:opacity-50"
                  title="Uploader un template personnalisé"
                >
                  <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
                  Uploader
                </button>
                
                <input
                  type="file"
                  ref={inputRefs[templateType]}
                  className="hidden"
                  accept=".docx"
                  onChange={(e) => handleUploadTemplate(e, templateType)}
                />
                
                <button
                  onClick={() => openVersionHistory(templateType)}
                  disabled={isLoadingActions}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg flex items-center text-sm transition-colors disabled:opacity-50"
                  title="Voir l'historique des versions"
                >
                  <ClockIcon className="h-4 w-4 mr-1" />
                  Historique
                </button>
                
                {template.status === 'custom' && (
                  <button
                    onClick={() => openRestoreConfirmation(templateType)}
                    disabled={isLoadingActions}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg flex items-center text-sm transition-colors disabled:opacity-50"
                    title="Restaurer le template par défaut"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-1" />
                    Restaurer
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal de confirmation de restauration */}
      {showRestoreModal && templateToRestore && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowRestoreModal(false)}></div>
            
            <div className="inline-block align-middle bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Restaurer le template
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Êtes-vous sûr de vouloir restaurer le template par défaut pour 
                        <strong> {templates[templateToRestore].name}</strong> ?
                      </p>
                      <p className="mt-2 text-sm text-yellow-600">
                        Cette action remplacera définitivement votre template personnalisé par le template par défaut.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleRestoreTemplate}
                  disabled={restoreTemplateMutation.isPending}
                >
                  {restoreTemplateMutation.isPending ? 'Restauration...' : 'Restaurer'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowRestoreModal(false)}
                  disabled={restoreTemplateMutation.isPending}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historique des versions */}
      <TemplateVersionHistory
        templateType={selectedTemplate}
        templateName={selectedTemplate ? templates[selectedTemplate].name : ''}
        isOpen={showVersionHistory}
        onClose={() => {
          setShowVersionHistory(false)
          setSelectedTemplate('')
        }}
      />
    </div>
  )
}

export default TemplatesPage