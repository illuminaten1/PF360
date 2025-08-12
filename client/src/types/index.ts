export interface User {
  id: string
  identifiant: string
  nom: string
  prenom: string
  initiales?: string
  mail: string
  role: 'ADMIN' | 'REDACTEUR' | 'GREFFIER'
  grade?: string
  telephone?: string
  active?: boolean
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
  grade?: 'Général' | 'Colonel' | 'Lieutenant-colonel' | 'Chef d\'escadron' | 'Commandant' | 'Capitaine' | 'Lieutenant' | 'Sous-lieutenant' | 'Aspirant' | 'Major' | 'Adjudant-chef' | 'Adjudant' | 'Maréchal des logis-chef' | 'Gendarme' | 'Élève gendarme' | 'Maréchal des logis' | 'Brigadier-chef' | 'Brigadier' | 'Gendarme adjoint volontaire' | 'Gendarme adjoint de 2ème classe' | 'Madame' | 'Monsieur'
  statutDemandeur?: 'OG' | 'OCTA' | 'SOG' | 'CSTAGN' | 'GAV' | 'Civil' | 'Réserviste' | 'Retraité' | 'Ayant-droit'
  branche?: 'GD' | 'GM' | 'GR' | 'État-Major' | 'GIE SPÉ' | 'DG et ORG. CENTRAUX' | 'GIGN'
  formationAdministrative?: 'Auvergne-Rhône-Alpes' | 'Bourgogne-Franche-Comté' | 'Bretagne' | 'Centre-Val-de-Loire' | 'Corse' | 'Grand Est' | 'Hauts-de-France' | 'Ile-de-France' | 'Nouvelle-Aquitaine' | 'Normandie' | 'Occitanie' | 'Pays-de-la-Loire' | 'Provence-Alpes-Côte-d\'Azur' | 'Guadeloupe' | 'Guyane' | 'Martinique' | 'Mayotte' | 'Nouvelle-Calédonie' | 'Wallis-et-Futuna' | 'Polynésie française' | 'La Réunion' | 'Saint Barthélémy / Saint-Martin' | 'Saint-Pierre-et-Miquelon' | 'Garde républicaine' | 'IGAG' | 'IGGN' | 'DGGN' | 'GIGN' | 'COMSOPGN' | 'PJGN' | 'CEGN' | 'CGOM' | 'CRJ' | 'ANFSI' | 'COSSEN' | 'COMCYBER-MI' | 'CESAN' | 'SAILMI' | 'GSAN' | 'GTA' | 'GARM' | 'CFAGN' | 'GMAR' | 'GAIR' | 'AUTRE'
  departement?: '1' | '2A' | '2B' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '13' | '14' | '15' | '16' | '17' | '18' | '19' | '20' | '21' | '22' | '23' | '24' | '25' | '26' | '27' | '28' | '29' | '30' | '31' | '32' | '33' | '34' | '35' | '36' | '37' | '38' | '39' | '40' | '41' | '42' | '43' | '44' | '45' | '46' | '47' | '48' | '49' | '50' | '51' | '52' | '53' | '54' | '55' | '56' | '57' | '58' | '59' | '60' | '61' | '62' | '63' | '64' | '65' | '66' | '67' | '68' | '69' | '70' | '71' | '72' | '73' | '74' | '75' | '76' | '77' | '78' | '79' | '80' | '81' | '82' | '83' | '84' | '85' | '86' | '87' | '88' | '89' | '90' | '91' | '92' | '93' | '94' | '95' | '971' | '972' | '973' | '974' | '976' | '986' | '987' | '988' | '975' | '978' | 'GGM I/3' | 'GGM I/5' | 'GGM I/6' | 'GGM I/7' | 'GGM I/9' | 'GGM II/1' | 'GGM II/2' | 'GGM II/3' | 'GGM II/5' | 'GGM II/6' | 'GGM II/7' | 'GGM III/3' | 'GGM III/6' | 'GGM III/7' | 'GGM IV/2' | 'GGM IV/3' | 'GGM IV/7' | 'GTGM' | 'GBGM'
  nom: string
  prenom: string
  adressePostaleLigne1?: string
  adressePostaleLigne2?: string
  telephoneProfessionnel?: string
  telephonePersonnel?: string
  emailProfessionnel?: string
  emailPersonnel?: string
  unite?: string
  dateFaits?: string
  commune?: string
  codePostal?: string
  position?: 'EN_SERVICE' | 'HORS_SERVICE'
  contexteMissionnel?: 'Prévention de proximité' | 'Police route' | 'MO/RO' | 'Police judiciaire' | 'Chargé d\'accueil' | 'Sécurisation d\'événement' | 'Intervention spécialisée' | 'Surveillance particulière' | 'Escorte/Transfèrement' | 'International' | 'Relations interpersonnelles' | 'Hors service' | 'Autre'
  qualificationInfraction?: 'OUTRAGE / MENACES' | 'RÉBELLION avec ou sans outrage' | 'VIOLENCES hors rébellion' | 'REFUS D\'OBTEMPÉRER / Mise en danger de la vie d\'autrui' | 'HARCÈLEMENT MORAL AU TRAVAIL / DISCRIMINATION' | 'VIOLENCES SEXUELLES ET SEXISTES' | 'DÉFENSEUR DES DROITS' | 'ACCIDENT DE LA CIRC. ROUTIÈRE' | 'DIFFAMATION / INJURES' | 'TENTATIVE D\'HOMICIDE' | 'INFRACTION INVOLONTAIRE HORS ACCIDENT CIRC. ROUTIÈRE' | 'AUTRE'
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
  badges?: Array<{
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
    grade?: string
  }
  creePar?: {
    id: string
    nom: string
    prenom: string
    grade?: string
  }
  modifiePar?: {
    id: string
    nom: string
    prenom: string
    grade?: string
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
  nomDossier?: string
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
    grade?: string
  }
  creePar?: {
    id: string
    nom: string
    prenom: string
    grade?: string
  }
  modifiePar?: {
    id: string
    nom: string
    prenom: string
    grade?: string
  }
  decisions: Array<{
    id: string
    type: string
    date: string
    creePar?: {
      nom: string
      prenom: string
    }
    demandes?: Array<{
      demande: {
        nom: string
        prenom: string
        numeroDS: string
      }
    }>
  }>
  conventions: Array<{
    id: string
    montantHT: number
    date: string
    avocat: {
      id: string
      nom: string
      prenom?: string
    }
    creePar?: {
      nom: string
      prenom: string
    }
    demandes?: Array<{
      demande: {
        nom: string
        prenom: string
        numeroDS: string
      }
    }>
  }>
  paiements: Array<{
    id: string
    montantHT: number
    montantTTC: number
    nature: 'AVOCAT' | 'AUTRES_INTERVENANTS'
    facture?: string
    convention?: {
      id: string
      montantHT: number
      date: string
    }
    creePar?: {
      nom: string
      prenom: string
    }
  }>
  attendus?: Array<{
    id: string
    nomOuNigend: string
    commentaire?: string
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
  totalUsage?: number
  dossiersCount?: number
  demandesCount?: number
}

export interface Sgami {
  id: string
  nom: string
  formatCourtNommage?: string
}

export interface SGAMI {
  id: string
  nom: string
  formatCourtNommage?: string
  texteConvention?: string
  description?: string
  region?: string
  active?: boolean
  dossiersCount?: number
  createdAt?: string
  updatedAt?: string
  creePar?: {
    id: string
    nom: string
    prenom: string
    grade?: string
  }
  modifiePar?: {
    id: string
    nom: string
    prenom: string
    grade?: string
  }
}

export interface Avocat {
  id: string
  nom: string
  prenom?: string
  region?: string
  adressePostale?: string
  telephonePublic1?: string
  telephonePublic2?: string
  telephonePrive?: string
  email?: string
  siretOuRidet?: string
  villesIntervention?: string[]
  notes?: string
  specialisation?: string
  titulaireDuCompteBancaire?: string
  codeEtablissement?: string
  codeGuichet?: string
  numeroDeCompte?: string
  cle?: string
  active?: boolean
  createdAt?: string
  updatedAt?: string
  creePar?: {
    id: string
    nom: string
    prenom: string
    grade?: string
  }
  modifiePar?: {
    id: string
    nom: string
    prenom: string
    grade?: string
  }
}

export interface Paiement {
  id: string
  facture?: string
  montantHT: number
  montantTTC: number
  nature: 'AVOCAT' | 'AUTRES_INTERVENANTS'
  ficheReglement?: string
  dossier?: {
    id: string
    numero: string
  }
  convention?: {
    id: string
    montantHT: number
    date: string
  }
  avocat?: {
    id: string
    nom: string
    prenom?: string
  }
  pce?: {
    id: string
    ordre: number
    pceDetaille: string
    pceNumerique: string
    codeMarchandise: string
  }
  creePar?: {
    id: string
    nom: string
    prenom: string
    grade?: string
  }
  createdAt: string
  updatedAt: string
}

export interface PCE {
  id: string
  ordre: number
  pceDetaille: string
  pceNumerique: string
  codeMarchandise: string
  createdAt?: string
  updatedAt?: string
}

export interface Visa {
  id: string
  typeVisa: string
  texteVisa: string
  active?: boolean
  createdAt?: string
  updatedAt?: string
}