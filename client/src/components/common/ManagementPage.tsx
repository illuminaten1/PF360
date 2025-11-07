import React from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import { useEntityManagement, EntityConfig } from '@/hooks/useEntityManagement'

interface ManagementPageProps<T extends { id: string }> {
  config: EntityConfig
  TableComponent: React.ComponentType<any>
  ModalComponent: React.ComponentType<any>
  customButtons?: React.ReactNode
  customContent?: React.ReactNode
}

function ManagementPage<T extends { id: string }>({
  config,
  TableComponent,
  ModalComponent,
  customButtons,
  customContent
}: ManagementPageProps<T>) {
  const {
    isModalOpen,
    selectedEntity,
    entities,
    stats,
    isLoading,
    createMutation,
    updateMutation,
    handleCreate,
    handleEdit,
    handleDelete,
    handleSubmit,
    handleReorder,
    handleCloseModal
  } = useEntityManagement<T>(config)

  const Icon = config.icon

  const renderStats = () => {
    if (!config.hasStats || !stats) return null

    // Stats pour Badges
    if (config.entityName === 'badge') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Icon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total {config.entityPluralName}</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalBadges}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <Icon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{config.entityDisplayName}s utilisés</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.usedBadges}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gray-100">
                <Icon className="w-6 h-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{config.entityDisplayName}s non utilisés</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.unusedBadges}</p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Stats pour BAP
    if (config.entityName === 'bap') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Icon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total BAP</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalBAP}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Icon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">BAP utilisés</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.usedBAP}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-gray-100">
                <Icon className="w-6 h-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">BAP non utilisés</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.unusedBAP}</p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Stats pour Grades
    if (config.entityName === 'grade') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100">
                <Icon className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Grades</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalGrades || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Stats pour PCE
    if (config.entityName === 'pce') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Icon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total PCE</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalPCE || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Stats pour SGAMI
    if (config.entityName === 'sgami') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Icon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total organismes payeurs</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalSGAMI || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Stats pour Visa
    if (config.entityName === 'visa') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Icon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Visas</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalVisas || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Icon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Visas Actifs</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.visasActifs || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  const getEntityModalProps = () => {
    const baseProps = {
      isOpen: isModalOpen,
      onClose: handleCloseModal,
      onSubmit: handleSubmit,
      isSubmitting: createMutation.isPending || updateMutation.isPending
    }

    // Props spécifiques selon le type d'entité
    if (config.entityName === 'badge') {
      return { ...baseProps, badge: selectedEntity }
    }
    if (config.entityName === 'bap') {
      return { ...baseProps, bap: selectedEntity }
    }
    if (config.entityName === 'grade') {
      return { ...baseProps, grade: selectedEntity }
    }
    if (config.entityName === 'pce') {
      return { ...baseProps, pce: selectedEntity }
    }
    if (config.entityName === 'sgami') {
      return { ...baseProps, sgami: selectedEntity }
    }
    if (config.entityName === 'visa') {
      return { ...baseProps, visa: selectedEntity }
    }

    return baseProps
  }

  const getTableProps = () => {
    const baseProps = {
      data: entities,
      loading: isLoading,
      onEdit: handleEdit,
      onDelete: handleDelete
    }

    if (config.hasReorder) {
      return { ...baseProps, onReorder: handleReorder }
    }

    return baseProps
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Icon className="w-7 h-7 mr-3 text-blue-600" />
            Gestion des {config.entityPluralName}
          </h1>
          <p className="text-gray-600 mt-1">
            {config.entityName === 'badge' && 'Gérez les badges et leurs couleurs'}
            {config.entityName === 'bap' && 'Gérez les Bureaux de l\'Accompagnement des Personnels'}
            {config.entityName === 'grade' && 'Gérez les grades militaires et leur ordre'}
            {config.entityName === 'pce' && 'Gérez les Plans Comptables de l\'État'}
            {config.entityName === 'sgami' && 'Gérez les organismes payeurs'}
            {config.entityName === 'visa' && 'Modifiez le texte des visas CIVIL et MILITAIRE'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {customButtons}
          {config.hasCreate !== false && (
            <button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              <span>Nouveau {config.entityDisplayName.toLowerCase()}</span>
            </button>
          )}
        </div>
      </div>

      {renderStats()}

      {customContent}

      <TableComponent {...getTableProps()} />

      {isModalOpen && (
        <ModalComponent {...getEntityModalProps()} />
      )}
    </div>
  )
}

export default ManagementPage