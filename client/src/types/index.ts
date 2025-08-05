export interface User {
  id: string
  identifiant: string
  nom: string
  prenom: string
  mail: string
  role: 'ADMIN' | 'UTILISATEUR'
  grade?: string
  telephone?: string
  createdAt?: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface LoginCredentials {
  identifiant: string
  password: string
}

export interface Demande {
  id: string
  numeroDS: string
  type: 'VICTIME' | 'MIS_EN_CAUSE'
  nigend?: string
  grade?: string
  nom: string
  prenom: string
  adresse1?: string
  adresse2?: string
  telephone1?: string
  telephone2?: string
  unite?: string
  dateFaits?: string
  commune?: string
  codePostal?: string
  position?: 'EN_SERVICE' | 'HORS_SERVICE'
  resume?: string
  blessures?: string
  partieCivile: boolean
  montantPartieCivile?: number
  qualificationsPenales?: string
  dateAudience?: string
  soutienPsychologique: boolean
  soutienSocial: boolean
  soutienMedical: boolean
  dateReception: string
  createdAt: string
  updatedAt: string
  dossier?: {
    id: string
    numero: string
    sgami?: {
      nom: string
    }
  }
  decisions?: Array<{
    decision: {
      id: string
      type: string
      date: string
    }
  }>
  conventions?: Array<{
    convention: {
      id: string
      montantHT: number
      date: string
      avocat: {
        nom: string
        prenom?: string
      }
    }
  }>
}

export interface Dossier {
  id: string
  numero: string
  dateReceptionGlobale: string
  notes?: string
  demandes: Demande[]
  sgami?: {
    id: string
    nom: string
  }
  badges: Array<{
    badge: {
      id: string
      nom: string
      couleur?: string
    }
  }>
  assigneA?: {
    id: string
    nom: string
    prenom: string
  }
  decisions: Array<{
    id: string
    type: string
    date: string
  }>
  conventions: Array<{
    id: string
    montantHT: number
    date: string
  }>
  paiements: Array<{
    id: string
    montantTTC: number
  }>
  stats?: {
    totalConventionsHT: number
    totalPaiementsTTC: number
    nombreDemandes: number
    nombreDecisions: number
  }
  createdAt: string
  updatedAt: string
}

export interface Badge {
  id: string
  nom: string
  couleur?: string
}

export interface Sgami {
  id: string
  nom: string
}

export interface Avocat {
  id: string
  nom: string
  prenom?: string
  cabinet?: string
  adresse?: string
  telephone?: string
  mail?: string
}