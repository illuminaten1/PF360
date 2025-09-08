import { useQuery } from '@tanstack/react-query'
import { api } from '@/utils/api'
import { 
  StatistiquesAdministratives, 
  StatistiqueBAP, 
  StatistiquesQualiteDemandeur,
  StatistiquesTypeInfraction,
  StatistiquesContexteMissionnel,
  StatistiquesFormationAdministrative,
  StatistiquesBranche,
  StatistiquesStatutDemandeur,
  StatistiquesFluxMensuels,
  StatistiquesFluxHebdomadaires,
  StatistiquesAutoControle,
  ExtractionMensuelleStats,
  StatistiquesBadges,
  StatistiquesReponseBRPF,
  StatistiquesBudgetaires,
  EngagementServicePayeurData,
  EngagementDepensesMensuellesData,
  DepensesOrdonneesData,
  DepensesOrdonneesParSgamiData,
  DepensesOrdonneesParPceData
} from '../types'

export const useStatistiquesQueries = (selectedYear: number, activeTab: 'administratif' | 'budgetaire') => {
  const isAdministratif = activeTab === 'administratif'
  const isBudgetaire = activeTab === 'budgetaire'

  const statsAdministratives = useQuery<StatistiquesAdministratives>({
    queryKey: ['statistiques-administratives', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/administratives?year=${selectedYear}`)
      return response.data
    },
    enabled: isAdministratif
  })

  const statsBAP = useQuery<StatistiqueBAP[]>({
    queryKey: ['statistiques-bap', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/bap?year=${selectedYear}`)
      return response.data
    },
    enabled: isAdministratif
  })

  const statsQualite = useQuery<StatistiquesQualiteDemandeur[]>({
    queryKey: ['statistiques-qualite', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/qualite-demandeur?year=${selectedYear}`)
      return response.data
    },
    enabled: isAdministratif
  })

  const statsInfractions = useQuery<StatistiquesTypeInfraction[]>({
    queryKey: ['statistiques-infractions', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/type-infraction?year=${selectedYear}`)
      return response.data
    },
    enabled: isAdministratif
  })

  const statsContexte = useQuery<StatistiquesContexteMissionnel[]>({
    queryKey: ['statistiques-contexte', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/contexte-missionnel?year=${selectedYear}`)
      return response.data
    },
    enabled: isAdministratif
  })

  const statsFormation = useQuery<StatistiquesFormationAdministrative[]>({
    queryKey: ['statistiques-formation', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/formation-administrative?year=${selectedYear}`)
      return response.data
    },
    enabled: isAdministratif
  })

  const statsBranche = useQuery<StatistiquesBranche[]>({
    queryKey: ['statistiques-branche', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/branche?year=${selectedYear}`)
      return response.data
    },
    enabled: isAdministratif
  })

  const statsStatut = useQuery<StatistiquesStatutDemandeur[]>({
    queryKey: ['statistiques-statut', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/statut-demandeur?year=${selectedYear}`)
      return response.data
    },
    enabled: isAdministratif
  })

  const fluxMensuels = useQuery<StatistiquesFluxMensuels>({
    queryKey: ['flux-mensuels', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/flux-mensuels?year=${selectedYear}`)
      return response.data
    },
    enabled: isAdministratif
  })

  const fluxHebdomadaires = useQuery<StatistiquesFluxHebdomadaires>({
    queryKey: ['flux-hebdomadaires', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/flux-hebdomadaires?year=${selectedYear}`)
      return response.data
    },
    enabled: isAdministratif
  })

  const autoControle = useQuery<StatistiquesAutoControle>({
    queryKey: ['auto-controle', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/auto-controle?year=${selectedYear}`)
      return response.data
    },
    enabled: isAdministratif
  })

  const extractionMensuelle = useQuery<ExtractionMensuelleStats>({
    queryKey: ['extraction-mensuelle', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/extraction-mensuelle?year=${selectedYear}`)
      return response.data
    },
    enabled: isAdministratif
  })

  const statsBadges = useQuery<StatistiquesBadges[]>({
    queryKey: ['statistiques-badges', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/badges?year=${selectedYear}`)
      return response.data
    },
    enabled: isAdministratif
  })

  const statsReponseBRPF = useQuery<StatistiquesReponseBRPF>({
    queryKey: ['statistiques-reponse-brpf', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/reponse-brpf?year=${selectedYear}`)
      return response.data
    },
    enabled: isAdministratif
  })

  const statsBudgetaires = useQuery<StatistiquesBudgetaires>({
    queryKey: ['statistiques-budgetaires', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/budgetaires?year=${selectedYear}`)
      return response.data
    },
    enabled: isBudgetaire
  })

  const statsEngagements = useQuery<EngagementServicePayeurData>({
    queryKey: ['engagement-service-payeur', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/engagement-service-payeur?year=${selectedYear}`)
      return response.data
    },
    enabled: isBudgetaire
  })

  const statsEngagementsMensuels = useQuery<EngagementDepensesMensuellesData>({
    queryKey: ['engagement-depenses-mensuelles', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/engagement-depenses-mensuelles?year=${selectedYear}`)
      return response.data
    },
    enabled: isBudgetaire
  })

  const statsDepensesOrdonnees = useQuery<DepensesOrdonneesData>({
    queryKey: ['depenses-ordonnees', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/depenses-ordonnees?year=${selectedYear}`)
      return response.data
    },
    enabled: isBudgetaire
  })

  const statsDepensesOrdonneesParSgami = useQuery<DepensesOrdonneesParSgamiData>({
    queryKey: ['depenses-ordonnees-sgami', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/depenses-ordonnees-sgami?year=${selectedYear}`)
      return response.data
    },
    enabled: isBudgetaire
  })

  const statsDepensesOrdonneesParPce = useQuery<DepensesOrdonneesParPceData>({
    queryKey: ['depenses-ordonnees-pce', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/depenses-ordonnees-pce?year=${selectedYear}`)
      return response.data
    },
    enabled: isBudgetaire
  })

  const anneesDisponibles = useQuery<number[]>({
    queryKey: ['annees-disponibles'],
    queryFn: async () => {
      const response = await api.get('/statistiques/annees-disponibles')
      return response.data
    }
  })

  const isLoading = statsAdministratives.isLoading || statsBAP.isLoading || 
                   statsQualite.isLoading || statsInfractions.isLoading || 
                   statsContexte.isLoading || statsFormation.isLoading || 
                   statsBranche.isLoading || statsStatut.isLoading || 
                   fluxMensuels.isLoading || fluxHebdomadaires.isLoading || 
                   autoControle.isLoading || extractionMensuelle.isLoading || 
                   statsBadges.isLoading || statsReponseBRPF.isLoading ||
                   statsBudgetaires.isLoading || statsEngagements.isLoading ||
                   statsEngagementsMensuels.isLoading || statsDepensesOrdonnees.isLoading ||
                   statsDepensesOrdonneesParSgami.isLoading || statsDepensesOrdonneesParPce.isLoading

  return {
    statsAdministratives: statsAdministratives.data,
    statsBAP: statsBAP.data,
    statsQualite: statsQualite.data,
    statsInfractions: statsInfractions.data,
    statsContexte: statsContexte.data,
    statsFormation: statsFormation.data,
    statsBranche: statsBranche.data,
    statsStatut: statsStatut.data,
    fluxMensuels: fluxMensuels.data,
    fluxHebdomadaires: fluxHebdomadaires.data,
    autoControle: autoControle.data,
    extractionMensuelle: extractionMensuelle.data,
    statsBadges: statsBadges.data,
    statsReponseBRPF: statsReponseBRPF.data,
    statsBudgetaires: statsBudgetaires.data,
    statsEngagements: statsEngagements.data,
    statsEngagementsMensuels: statsEngagementsMensuels.data,
    statsDepensesOrdonnees: statsDepensesOrdonnees.data,
    statsDepensesOrdonneesParSgami: statsDepensesOrdonneesParSgami.data,
    statsDepensesOrdonneesParPce: statsDepensesOrdonneesParPce.data,
    anneesDisponibles: anneesDisponibles.data,
    isLoading
  }
}