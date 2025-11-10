import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '@/utils/api'

export const useDossierMutations = (dossierId?: string) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Update dossier mutation
  const updateDossierMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!dossierId) throw new Error('ID du dossier manquant')
      const response = await api.put(`/dossiers/${dossierId}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossier', dossierId] })
      queryClient.invalidateQueries({ queryKey: ['dossiers-all'] })
      toast.success('Dossier modifié avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification')
    }
  })

  // Delete dossier mutation
  const deleteDossierMutation = useMutation({
    mutationFn: async () => {
      if (!dossierId) throw new Error('ID du dossier manquant')
      await api.delete(`/dossiers/${dossierId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossiers-all'] })
      toast.success('Dossier supprimé avec succès')
      navigate('/dossiers')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression')
    }
  })

  // Save notes mutation
  const saveNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      if (!dossierId) throw new Error('ID du dossier manquant')
      const response = await api.put(`/dossiers/${dossierId}`, { notes })
      return response.data
    },
    onSuccess: (updatedDossier) => {
      queryClient.setQueryData(['dossier', dossierId], updatedDossier)
    },
    onError: () => {
      toast.error('Erreur lors de la sauvegarde des notes')
    }
  })

  // Unlink demande mutation
  const unlinkDemandeMutation = useMutation({
    mutationFn: async (demandeId: string) => {
      const response = await api.put(`/demandes/${demandeId}`, { dossierId: null })
      return response.data
    },
    onSuccess: (updatedDemande) => {
      queryClient.invalidateQueries({ queryKey: ['dossier', dossierId] })
      queryClient.invalidateQueries({ queryKey: ['dossiers-all'] })
      queryClient.invalidateQueries({ queryKey: ['demandes'] })
      toast.success(`Demande ${updatedDemande?.numeroDS || 'inconnue'} déliée du dossier`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la déliaison')
    }
  })

  // Create decision mutation
  const createDecisionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/decisions', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossier', dossierId] })
      queryClient.invalidateQueries({ queryKey: ['dossiers-all'] })
      queryClient.invalidateQueries({ queryKey: ['decisions-all'] })
      toast.success('Décision générée avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la génération de la décision')
    }
  })

  // Update decision mutation
  const updateDecisionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put(`/decisions/${data.id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossier', dossierId] })
      queryClient.invalidateQueries({ queryKey: ['dossiers-all'] })
      queryClient.invalidateQueries({ queryKey: ['decisions-all'] })
      toast.success('Décision modifiée avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification de la décision')
    }
  })

  // Create convention mutation
  const createConventionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/conventions', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossier', dossierId] })
      queryClient.invalidateQueries({ queryKey: ['dossiers-all'] })
      queryClient.invalidateQueries({ queryKey: ['conventions-all'] })
      toast.success('Convention créée avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la création de la convention')
    }
  })

  // Update convention mutation
  const updateConventionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put(`/conventions/${data.id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossier', dossierId] })
      queryClient.invalidateQueries({ queryKey: ['dossiers-all'] })
      queryClient.invalidateQueries({ queryKey: ['conventions-all'] })
      toast.success('Convention modifiée avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification de la convention')
    }
  })

  // Create paiement mutation
  const createPaiementMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/paiements', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossier', dossierId] })
      queryClient.invalidateQueries({ queryKey: ['dossiers-all'] })
      queryClient.invalidateQueries({ queryKey: ['paiements-all'] })
      toast.success('Paiement créé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la création du paiement')
    }
  })

  // Update paiement mutation
  const updatePaiementMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put(`/paiements/${data.id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossier', dossierId] })
      queryClient.invalidateQueries({ queryKey: ['dossiers-all'] })
      queryClient.invalidateQueries({ queryKey: ['paiements-all'] })
      toast.success('Paiement modifié avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification du paiement')
    }
  })

  // Delete paiement mutation
  const deletePaiementMutation = useMutation({
    mutationFn: async (paiementId: string) => {
      await api.delete(`/paiements/${paiementId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossier', dossierId] })
      queryClient.invalidateQueries({ queryKey: ['dossiers-all'] })
      queryClient.invalidateQueries({ queryKey: ['paiements-all'] })
      toast.success('Paiement supprimé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression du paiement')
    }
  })

  return {
    updateDossierMutation,
    deleteDossierMutation,
    saveNotesMutation,
    unlinkDemandeMutation,
    createDecisionMutation,
    updateDecisionMutation,
    createConventionMutation,
    updateConventionMutation,
    createPaiementMutation,
    updatePaiementMutation,
    deletePaiementMutation,
  }
}
