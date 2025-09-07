export interface StatistiquesGenerales {
  demandesTotal: number
  demandesTraitees: number
  demandesEnInstance: number
  demandesNonAffectees: number
}

export interface StatistiquesUtilisateur {
  id: string
  nom: string
  prenom: string
  role: string
  grade: string | null
  demandesAttribuees: number
  demandesPropres: number
  demandesBAP: number
  decisionsRepartition: {
    PJ: number
    AJE: number
    AJ: number
    REJET: number
  }
  passageAJEversPJ: number
  enCours: number
  enCoursPropre: number
  enCoursBAP: number
}

export interface StatistiquesAdministratives {
  generales: StatistiquesGenerales
  utilisateurs: StatistiquesUtilisateur[]
}

export interface StatistiqueBAP {
  nomBAP: string
  nombreDemandes: number
}

export interface FluxMensuel {
  mois: string
  entrantsAnnee: number
  sortantsAnnee: number
  entrantsAnneePrecedente: number
}

export interface StatistiquesFluxMensuels {
  fluxMensuels: FluxMensuel[]
  moyennes: FluxMensuel
  annee: number
  anneePrecedente: number
}

export interface FluxHebdomadaire {
  numeroSemaine: number
  dateDebut: string
  dateFin: string
  entrantsAnnee: number
  sortantsAnnee: number
  entrantsAnneePrecedente: number
}

export interface StatistiquesFluxHebdomadaires {
  fluxHebdomadaires: FluxHebdomadaire[]
  annee: number
  anneePrecedente: number
}

export interface StatistiquesAutoControle {
  pjEnAttenteConvention: number
  ancienneteMoyenneNonTraites: number
  ancienneteMoyenneBAP: number
  ancienneteMoyenneBRP: number
  delaiTraitementMoyen: number
  delaiTraitementBAP: number
  delaiTraitementBRP: number
}

export interface StatistiquesQualiteDemandeur {
  qualite: 'VICTIME' | 'MIS_EN_CAUSE'
  nombreDemandes: number
  pourcentage: number
}

export interface StatistiquesTypeInfraction {
  qualificationInfraction: string
  nombreDemandes: number
  pourcentage: number
}

export interface StatistiquesContexteMissionnel {
  contexteMissionnel: string
  nombreDemandes: number
  pourcentage: number
}

export interface StatistiquesFormationAdministrative {
  formationAdministrative: string
  nombreDemandes: number
  pourcentage: number
}

export interface StatistiquesBranche {
  branche: string
  nombreDemandes: number
  pourcentage: number
}

export interface StatistiquesStatutDemandeur {
  statutDemandeur: string
  nombreDemandes: number
  pourcentage: number
}

export interface ExtractionMensuelleData {
  mois: string
  ddesDePfVictimeUniquementToutesInfractions: number
  dontReservistes: number
  cumulDdeVictime: number
  dontCumulVictimeReservistes: number
  ddesDePfPourViolences: number
  dontDdesDePfPourViolencesSurReservistes: number
  cumulViolences: number
  dontCumulViolencesReservistes: number
}

export interface ExtractionMensuelleStats {
  donneesParMois: ExtractionMensuelleData[]
  moyenneParMois: {
    ddesDePfVictimeUniquementToutesInfractions: number
    dontReservistes: number
    ddesDePfPourViolences: number
    dontDdesDePfPourViolencesSurReservistes: number
  }
  annee: number
}

export interface StatistiquesBadges {
  badge: string
  nombreDemandes: number
  pourcentage: number
}

export interface StatistiqueReponseBRPF {
  libelle: string
  nombre: number
  pourcentage: number
  type: 'agrement' | 'decision' | 'rejet_global' | 'motif_rejet'
}

export interface StatistiquesReponseBRPF {
  statistiques: StatistiqueReponseBRPF[]
  totaux: {
    totalDecisions: number
    agrement: number
    rejet: number
  }
}

export interface StatistiqueBudgetaire {
  libelle: string
  nombre: number
  pourcentage?: number
  type?: 'currency' | 'currency_with_percentage'
  bold?: boolean
  showPrevisions?: boolean
  prevision10?: number
  prevision20?: number
  pourcentagePrevision10?: number
  pourcentagePrevision20?: number
}

export interface StatistiquesBudgetaires {
  statistiques: StatistiqueBudgetaire[]
  budgetTotal?: number
}

export interface EngagementServicePayeur {
  sgami: string
  montantTotal: number
  pourcentage: number
  prevision10: number
  prevision20: number
  pourcentagePrevision10: number
  pourcentagePrevision20: number
}

export interface EngagementServicePayeurData {
  engagements: EngagementServicePayeur[]
  budgetTotal?: number
}

export interface EngagementDepenseMensuelle {
  mois: string
  montantGageHT: number
  pourcentageMontantGage: number
  cumuleHT: number
  pourcentageCumuleHT: number
  prevision10: number
  pourcentagePrevision10: number
  prevision20: number
  pourcentagePrevision20: number
  cumuleTTC: number
  pourcentageCumuleTTC: number
}

export interface EngagementDepensesMensuellesData {
  engagementsMensuels: EngagementDepenseMensuelle[]
  total: EngagementDepenseMensuelle
  budgetTotal?: number
  annee: number
}

export type PanelKey = 'general' | 'users' | 'bap' | 'qualite' | 'infractions' | 'contexte' | 'formation' | 'branche' | 'statut' | 'autocontrole' | 'fluxmensuels' | 'fluxhebdo' | 'extraction' | 'badges' | 'reponseBrpf' | 'budget' | 'statistiquesBudgetaires' | 'engagementServicePayeur' | 'engagementDepensesMensuelles'

export type SortColumn = 'nom' | 'totalPF' | 'propres' | 'bap' | 'pj' | 'aj' | 'aje' | 'rejet' | 'enCours' | 'enCoursPropre' | 'enCoursBAP'
export type SortOrder = 'asc' | 'desc'