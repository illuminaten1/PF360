import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  ClockIcon,
  UserIcon,
  DocumentIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { templatesAPI } from '@/utils/api'
import { TemplateVersion } from '@/types/template'

interface TemplateVersionHistoryProps {
  templateType: string
  templateName: string
  isOpen: boolean
  onClose: () => void
}

const TemplateVersionHistory: React.FC<TemplateVersionHistoryProps> = ({
  templateType,
  templateName,
  isOpen,
  onClose
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [versionToDelete, setVersionToDelete] = useState<TemplateVersion | null>(null)
  const queryClient = useQueryClient()

  const { data: versions, isLoading } = useQuery({
    queryKey: ['template-versions', templateType],
    queryFn: async () => {
      const response = await templatesAPI.getVersions(templateType)
      return response.data as TemplateVersion[]
    },
    enabled: isOpen
  })

  const activateVersionMutation = useMutation({
    mutationFn: async (versionId: string) => {
      await templatesAPI.activateVersion(templateType, versionId)
      return versionId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-versions', templateType] })
      queryClient.invalidateQueries({ queryKey: ['templates-status'] })
      toast.success('Version activée avec succès')
    },
    onError: (error: any) => {
      toast.error(`Impossible d'activer la version: ${error.response?.data?.error || error.message}`)
    }
  })

  const deleteVersionMutation = useMutation({
    mutationFn: async (versionId: string) => {
      await templatesAPI.deleteVersion(templateType, versionId)
      return versionId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-versions', templateType] })
      setShowDeleteModal(false)
      setVersionToDelete(null)
      toast.success('Version supprimée avec succès')
    },
    onError: (error: any) => {
      toast.error(`Impossible de supprimer la version: ${error.response?.data?.error || error.message}`)
    }
  })

  const downloadVersionMutation = useMutation({
    mutationFn: async (version: TemplateVersion) => {
      const response = await templatesAPI.downloadVersion(templateType, version.id)
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', version.originalName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      return version
    },
    onSuccess: (version) => {
      toast.success(`Version ${version.versionNumber} téléchargée avec succès`)
    },
    onError: (error: any) => {
      toast.error(`Impossible de télécharger la version`)
    }
  })

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Taille inconnue'
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDeleteVersion = (version: TemplateVersion) => {
    setVersionToDelete(version)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (versionToDelete) {
      deleteVersionMutation.mutate(versionToDelete.id)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-middle bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                  <ClockIcon className="w-6 h-6 mr-2 text-blue-600" />
                  Historique des versions - {templateName}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Gérez les différentes versions de votre template
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="w-6 h-6" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Chargement des versions...</span>
              </div>
            ) : versions && versions.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`border rounded-lg p-4 ${
                      version.isActive 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {version.isActive ? (
                            <CheckCircleIcon className="w-8 h-8 text-green-600" />
                          ) : (
                            <DocumentIcon className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-lg font-medium text-gray-900">
                              Version {version.versionNumber}
                            </h4>
                            {version.isActive && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-1 text-sm text-gray-600 space-y-1">
                            <div className="flex items-center">
                              <UserIcon className="w-4 h-4 mr-1" />
                              Uploadé par {version.uploadedBy.prenom} {version.uploadedBy.nom}
                            </div>
                            <div className="flex items-center">
                              <ClockIcon className="w-4 h-4 mr-1" />
                              {formatDate(version.createdAt)}
                            </div>
                            <div>
                              Fichier: {version.originalName} ({formatFileSize(version.fileSize)})
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => downloadVersionMutation.mutate(version)}
                          disabled={downloadVersionMutation.isPending}
                          className="btn-secondary flex items-center text-sm"
                          title="Télécharger cette version"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                          Télécharger
                        </button>
                        
                        {!version.isActive && (
                          <>
                            <button
                              onClick={() => activateVersionMutation.mutate(version.id)}
                              disabled={activateVersionMutation.isPending}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center text-sm transition-colors"
                              title="Activer cette version"
                            >
                              Activer
                            </button>
                            
                            <button
                              onClick={() => handleDeleteVersion(version)}
                              disabled={deleteVersionMutation.isPending}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg flex items-center text-sm transition-colors"
                              title="Supprimer cette version"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune version personnalisée</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Uploadez un template personnalisé pour commencer le versioning
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && versionToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            
            <div className="inline-block align-middle bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Supprimer la version
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Êtes-vous sûr de vouloir supprimer la version {versionToDelete.versionNumber} ?
                      </p>
                      <p className="mt-2 text-sm text-red-600">
                        Cette action est irréversible.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                <button
                  type="button"
                  className="btn-primary bg-red-600 hover:bg-red-700"
                  onClick={confirmDelete}
                  disabled={deleteVersionMutation.isPending}
                >
                  {deleteVersionMutation.isPending ? 'Suppression...' : 'Supprimer'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false)
                    setVersionToDelete(null)
                  }}
                  disabled={deleteVersionMutation.isPending}
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

export default TemplateVersionHistory