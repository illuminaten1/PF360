import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '@/utils/api'

export interface EntityConfig {
  entityName: string          // "badge", "bap", "grade"
  entityDisplayName: string   // "Badge", "BAP", "Grade"
  entityPluralName: string    // "badges", "baps", "grades"
  apiEndpoint: string         // "/badges", "/bap", "/grades"
  icon: React.ComponentType<{ className?: string }>
  hasStats?: boolean
  hasReorder?: boolean
  hasCreate?: boolean         // Par défaut true
  hasDelete?: boolean         // Par défaut true
}

export function useEntityManagement<T extends { id: string }>(config: EntityConfig) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<T | null>(null)

  const queryClient = useQueryClient()

  // Query pour récupérer toutes les entités
  const { data: entityData, isLoading } = useQuery({
    queryKey: [`${config.entityName}-all`],
    queryFn: async () => {
      const response = await api.get(config.apiEndpoint)
      return response.data
    }
  })

  // Query pour les statistiques (optionnel)
  const { data: stats } = useQuery({
    queryKey: [`${config.entityName}-stats`],
    queryFn: async () => {
      if (!config.hasStats) return null
      const response = await api.get(`${config.apiEndpoint}/stats`)
      return response.data
    },
    enabled: config.hasStats === true
  })

  // Mutation de création (optionnel)
  const createMutation = useMutation({
    mutationFn: async (entityData: Partial<T>) => {
      if (config.hasCreate === false) return null
      const response = await api.post(config.apiEndpoint, entityData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${config.entityName}-all`] })
      if (config.hasStats) {
        queryClient.invalidateQueries({ queryKey: [`${config.entityName}-stats`] })
      }
      queryClient.invalidateQueries({ queryKey: [config.entityPluralName] })
      setIsModalOpen(false)
      setSelectedEntity(null)
      toast.success(`${config.entityDisplayName} créé avec succès`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || `Erreur lors de la création du ${config.entityDisplayName.toLowerCase()}`)
    }
  })

  // Mutation de mise à jour
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...entityData }: Partial<T> & { id: string }) => {
      const response = await api.put(`${config.apiEndpoint}/${id}`, entityData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${config.entityName}-all`] })
      if (config.hasStats) {
        queryClient.invalidateQueries({ queryKey: [`${config.entityName}-stats`] })
      }
      queryClient.invalidateQueries({ queryKey: [config.entityPluralName] })
      setIsModalOpen(false)
      setSelectedEntity(null)
      toast.success(`${config.entityDisplayName} modifié avec succès`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || `Erreur lors de la modification du ${config.entityDisplayName.toLowerCase()}`)
    }
  })

  // Mutation de suppression (optionnel)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (config.hasDelete === false) return null
      await api.delete(`${config.apiEndpoint}/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${config.entityName}-all`] })
      if (config.hasStats) {
        queryClient.invalidateQueries({ queryKey: [`${config.entityName}-stats`] })
      }
      queryClient.invalidateQueries({ queryKey: [config.entityPluralName] })
      toast.success(`${config.entityDisplayName} supprimé avec succès`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || `Erreur lors de la suppression du ${config.entityDisplayName.toLowerCase()}`)
    }
  })

  // Mutation de réorganisation (optionnel)
  const reorderMutation = useMutation({
    mutationFn: async (entitiesList: T[]) => {
      if (!config.hasReorder) return null

      // Format spécifique pour PCE
      const payload = config.entityName === 'pce'
        ? { pceList: entitiesList }
        : { [`${config.entityName}sList`]: entitiesList }

      const response = await api.put(`${config.apiEndpoint}/reorder`, payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`${config.entityName}-all`] })
      toast.success(`Ordre des ${config.entityPluralName} mis à jour`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la réorganisation')
    }
  })

  // Handlers
  const handleCreate = () => {
    setSelectedEntity(null)
    setIsModalOpen(true)
  }

  const handleEdit = (entity: T) => {
    setSelectedEntity(entity)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer ce ${config.entityDisplayName.toLowerCase()} ? Cette action est irréversible.`
    if (window.confirm(confirmMessage)) {
      deleteMutation.mutate(id)
    }
  }

  const handleSubmit = (entityData: Partial<T>) => {
    if (selectedEntity) {
      updateMutation.mutate({ ...entityData, id: selectedEntity.id })
    } else if (config.hasCreate !== false) {
      createMutation.mutate(entityData)
    }
  }

  const handleReorder = (newOrder: T[]) => {
    if (config.hasReorder) {
      reorderMutation.mutate(newOrder)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedEntity(null)
  }

  // Données extraites selon le format de chaque endpoint
  const entities = entityData?.[config.entityPluralName] || entityData || []

  return {
    // État
    isModalOpen,
    selectedEntity,
    entities,
    stats,
    isLoading,

    // Mutations
    createMutation,
    updateMutation,
    deleteMutation,
    reorderMutation,

    // Handlers
    handleCreate,
    handleEdit,
    handleDelete,
    handleSubmit,
    handleReorder,
    handleCloseModal
  }
}