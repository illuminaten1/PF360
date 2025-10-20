const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Données de base pour la génération aléatoire
const types = ['VICTIME', 'MIS_EN_CAUSE']
// Les grades seront récupérés depuis la base de données
const statutsDemandeur = ['OG', 'OCTA', 'SOG', 'CSTAGN', 'GAV', 'Civil', 'Réserviste', 'Retraité', 'Ayant-droit']
const branches = ['GD', 'GM', 'GR', 'État-Major', 'GIE SPÉ', 'DG et ORG. CENTRAUX', 'GIGN']
const positions = ['EN_SERVICE', 'HORS_SERVICE']
const contextesM = [
  'Prévention de proximité', 'Police route', 'MO/RO', 'Police judiciaire',
  'Chargé d\'accueil', 'Sécurisation d\'événement', 'Intervention spécialisée',
  'Surveillance particulière', 'Escorte/Transfèrement', 'International',
  'Relations interpersonnelles', 'Hors service', 'Autre'
]
const qualificationsInfraction = [
  'OUTRAGE / MENACES', 'RÉBELLION avec ou sans outrage', 'VIOLENCES hors rébellion',
  'REFUS D\'OBTEMPÉRER / Mise en danger de la vie d\'autrui', 
  'HARCÈLEMENT MORAL AU TRAVAIL / DISCRIMINATION', 'VIOLENCES SEXUELLES ET SEXISTES',
  'DÉFENSEUR DES DROITS', 'ACCIDENT DE LA CIRC. ROUTIÈRE', 'DIFFAMATION / INJURES',
  'TENTATIVE D\'HOMICIDE', 'INFRACTION INVOLONTAIRE HORS ACCIDENT CIRC. ROUTIÈRE', 'AUTRE'
]

const prenoms = [
  'Jean', 'Pierre', 'Michel', 'André', 'Philippe', 'Marie', 'Nathalie', 'Isabelle',
  'Catherine', 'Françoise', 'Monique', 'Sylvie', 'Brigitte', 'Martine', 'Christiane',
  'Jacqueline', 'Christine', 'Sandrine', 'Valérie', 'Corinne', 'Véronique', 'Laurence',
  'Stéphane', 'Pascal', 'Thierry', 'Laurent', 'François', 'Alain', 'Gérard', 'Bernard',
  'Julien', 'Nicolas', 'David', 'Sébastien', 'Olivier', 'Frédéric', 'Vincent', 'Eric'
]

const noms = [
  'MARTIN', 'BERNARD', 'THOMAS', 'PETIT', 'ROBERT', 'RICHARD', 'DURAND', 'DUBOIS',
  'MOREAU', 'LAURENT', 'SIMON', 'MICHEL', 'LEFEBVRE', 'LEROY', 'ROUX', 'DAVID',
  'BERTRAND', 'MOREL', 'FOURNIER', 'GIRARD', 'BONNET', 'DUPONT', 'LAMBERT', 'FONTAINE',
  'ROUSSEAU', 'VINCENT', 'MULLER', 'LEFEVRE', 'FAURE', 'ANDRE', 'MERCIER', 'BLANC',
  'GUERIN', 'BOYER', 'GARNIER', 'CHEVALIER', 'FRANCOIS', 'LEGRAND', 'GAUTHIER', 'GARCIA'
]

const communes = [
  'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier',
  'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon', 'Angers',
  'Grenoble', 'Dijon', 'Nîmes', 'Aix-en-Provence', 'Brest', 'Le Mans', 'Amiens', 'Tours',
  'Limoges', 'Clermont-Ferrand', 'Villeurbanne', 'Besançon', 'Orléans', 'Metz', 'Rouen',
  'Mulhouse', 'Caen', 'Saint-Denis', 'Nancy', 'Argenteuil', 'Montreuil', 'Roubaix'
]

// Fonction utilitaire pour choisir un élément aléatoire
const randomChoice = (array) => array[Math.floor(Math.random() * array.length)]

// Fonction pour éviter les week-ends et définir des heures d'audience réalistes
const avoidWeekend = (date) => {
  const day = date.getDay()
  if (day === 0) { // Dimanche -> Lundi
    date.setDate(date.getDate() + 1)
  } else if (day === 6) { // Samedi -> Lundi
    date.setDate(date.getDate() + 2)
  }
  
  // Définir des heures d'audience réalistes : 8h, 9h, 10h, 13h30, 14h, 15h, 16h
  const heuresAudience = [8, 9, 10, 13.5, 14, 15, 16]
  const heureChoisie = randomChoice(heuresAudience)
  
  // Convertir en heures et minutes
  const heures = Math.floor(heureChoisie)
  const minutes = (heureChoisie % 1) * 60
  
  date.setHours(heures, minutes, 0, 0)
  return date
}

// Templates de notes pour les dossiers
const notesTemplates = [
  {
    type: 'echange_avocat',
    templates: [
      `📞 ${new Date().toLocaleDateString('fr-FR')} - Échange téléphonique avec Me {avocat}
- Transmission du dossier complet et des pièces justificatives
- Calendrier prévisionnel : audience estimée dans 2-3 mois
- L'avocat confirme la prise en charge et demande un délai pour étudier le dossier
- Prochain contact prévu dans 15 jours pour faire le point`,

      `✉️ ${new Date().toLocaleDateString('fr-FR')} - Courrier de Me {avocat}
- Accusé réception des pièces du dossier
- Demande de complément d'information sur les circonstances de l'intervention
- Nécessité d'obtenir le témoignage du binôme présent sur les lieux
- Délai de réponse : 10 jours`,

      `📞 ${new Date().toLocaleDateString('fr-FR')} - Entretien avec Me {avocat}
- Point sur l'avancement de la procédure
- L'avocat estime les chances de succès favorables
- Stratégie défensive basée sur le respect du cadre légal d'intervention
- Audience fixée au ${new Date(Date.now() + 60*24*60*60*1000).toLocaleDateString('fr-FR')}`
    ]
  },
  {
    type: 'compte_rendu_audience',
    templates: [
      `⚖️ COMPTE-RENDU D'AUDIENCE - ${new Date().toLocaleDateString('fr-FR')}
Tribunal : Tribunal de Grande Instance de {ville}
Président : M./Mme {nom_juge}
Avocat : Me {avocat}

DÉROULEMENT :
- Plaidoirie de Me {avocat} axée sur le cadre légal de l'intervention
- Questions du tribunal sur les circonstances précises des faits
- Partie adverse représentée par Me {avocat_adverse}

DÉCISION : Mise en délibéré au ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('fr-FR')}`,

      `⚖️ AUDIENCE DE CONCILIATION - ${new Date().toLocaleDateString('fr-FR')}
- Présence de toutes les parties
- Proposition de règlement amiable à hauteur de {montant}€
- Position de l'administration : acceptation sous réserve
- Délai de réflexion accordé : 15 jours
- Prochaine audience si échec : ${new Date(Date.now() + 45*24*60*60*1000).toLocaleDateString('fr-FR')}`,

      `⚖️ RÉSULTAT D'AUDIENCE - ${new Date().toLocaleDateString('fr-FR')}
DÉCISION : Relaxe / Condamnation symbolique
- Reconnaissance du cadre légal de l'intervention
- Déboutement des demandes de dommages-intérêts
- Chaque partie supporte ses propres dépens
- Pas d'appel envisagé par la partie adverse`
    ]
  },
  {
    type: 'echange_demandeur',
    templates: [
      `📞 ${new Date().toLocaleDateString('fr-FR')} - Contact avec {prenom} {nom}
- Accusé réception de la demande de protection fonctionnelle
- Explications sur la procédure et les délais
- Transmission des coordonnées de l'avocat désigné
- Le demandeur confirme son souhait de poursuivre la procédure`,

      `📧 ${new Date().toLocaleDateString('fr-FR')} - Mail de {prenom} {nom}
- Transmission de pièces complémentaires (certificats médicaux)
- Inquiétudes concernant les délais de procédure
- Demande de point régulier sur l'avancement
- Réponse apportée avec planning prévisionnel`,

      `📞 ${new Date().toLocaleDateString('fr-FR')} - Entretien avec {prenom} {nom}
- Point sur l'évolution de la situation personnelle
- Confirmation du maintien de la demande
- Coordination avec les services de soutien psychologique
- Prochaine échéance : audience du ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('fr-FR')}`
    ]
  },
  {
    type: 'information_generale',
    templates: [
      `📋 SYNTHÈSE DOSSIER - ${new Date().toLocaleDateString('fr-FR')}
Type d'affaire : {type_affaire}
Complexité : {niveau_complexite}
Enjeux : Protection de l'agent et préservation de l'image de l'institution

POINTS D'ATTENTION :
- Médiatisation possible
- Multiplicité des intervenants
- Délais de procédure à respecter`,

      `🔍 ANALYSE PRÉLIMINAIRE - ${new Date().toLocaleDateString('fr-FR')}
Éléments favorables :
- Intervention dans le cadre légal
- Témoignages concordants des collègues
- Respect des procédures

Points de vigilance :
- Contexte tendu de l'intervention
- Éventuelles contradictions dans les témoignages
- Nécessité d'expertise médicale`,

      `📝 SUIVI ADMINISTRATIF - ${new Date().toLocaleDateString('fr-FR')}
- Dossier complet et conforme
- Toutes les pièces justificatives rassemblées
- Avis hiérarchique favorable
- Transmission à l'autorité compétente effectuée
- Délai de traitement estimé : 2-3 mois`
    ]
  },
  {
    type: 'expertise_medicale',
    templates: [
      `🏥 RAPPORT D'EXPERTISE - ${new Date().toLocaleDateString('fr-FR')}
Expert : Dr {nom_expert}
Lieu : {lieu_expertise}

CONCLUSIONS :
- ITT constatée : {duree_itt} jours
- Séquelles physiques : {nature_sequelles}
- Retentissement psychologique évalué
- Préjudice estimé : {montant_prejudice}€

Contre-expertise demandée par la partie adverse`,

      `🏥 ASSISTANCE À EXPERTISE - ${new Date().toLocaleDateString('fr-FR')}
- Présence de Me {avocat} lors de l'expertise
- Examination complète effectuée par Dr {nom_expert}
- Observations formulées sur les circonstances
- Remise des pièces médicales complémentaires
- Rapport attendu sous 1 mois`,

      `🏥 SUIVI MÉDICAL - ${new Date().toLocaleDateString('fr-FR')}
- Évolution favorable de l'état de santé
- Reprise progressive de l'activité professionnelle
- Suivi psychologique maintenu
- Certificat de consolidation en attente
- Impact sur l'évaluation du préjudice`
    ]
  }
]

// Fonction pour générer des notes réalistes pour un dossier
const generateDossierNotes = (dossier) => {
  const notes = []
  const nbNotes = Math.floor(Math.random() * 4) + 1 // 1 à 4 notes par dossier
  
  // Sélectionner des types de notes aléatoires
  const availableTypes = notesTemplates.map(t => t.type)
  const selectedTypes = []
  
  for (let i = 0; i < nbNotes; i++) {
    const remainingTypes = availableTypes.filter(t => !selectedTypes.includes(t))
    if (remainingTypes.length > 0) {
      selectedTypes.push(randomChoice(remainingTypes))
    } else {
      selectedTypes.push(randomChoice(availableTypes))
    }
  }
  
  // Générer les notes
  selectedTypes.forEach(type => {
    const typeTemplates = notesTemplates.find(t => t.type === type)
    const template = randomChoice(typeTemplates.templates)
    
    // Remplacer les placeholders
    let note = template
    note = note.replace(/{avocat}/g, `${randomChoice(prenoms)} ${randomChoice(noms)}`)
    note = note.replace(/{avocat_adverse}/g, `${randomChoice(prenoms)} ${randomChoice(noms)}`)
    note = note.replace(/{nom_juge}/g, randomChoice(noms))
    note = note.replace(/{ville}/g, randomChoice(communes))
    note = note.replace(/{montant}/g, Math.floor(Math.random() * 5000) + 1000)
    note = note.replace(/{prenom}/g, randomChoice(prenoms))
    note = note.replace(/{nom}/g, randomChoice(noms))
    note = note.replace(/{type_affaire}/g, randomChoice(['Outrage', 'Rébellion', 'Violences', 'Diffamation']))
    note = note.replace(/{niveau_complexite}/g, randomChoice(['Simple', 'Moyenne', 'Élevée']))
    note = note.replace(/{nom_expert}/g, randomChoice(noms))
    note = note.replace(/{lieu_expertise}/g, randomChoice(communes))
    note = note.replace(/{duree_itt}/g, Math.floor(Math.random() * 15) + 1)
    note = note.replace(/{nature_sequelles}/g, randomChoice(['Aucune', 'Légères', 'Modérées']))
    note = note.replace(/{montant_prejudice}/g, Math.floor(Math.random() * 8000) + 2000)
    
    notes.push(note)
  })
  
  return notes.join('\n\n---\n\n')
}

// Fonction pour supprimer les accents et caractères spéciaux
const removeAccents = (str) => {
  return str.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les signes diacritiques
    .replace(/[çÇ]/g, 'c')           // Remplace les cédilles
    .replace(/[æÆ]/g, 'ae')          // Remplace les ligatures
    .replace(/[œŒ]/g, 'oe')          // Remplace les ligatures
}

// Fonction utilitaire pour générer une date aléatoire entre le 1er janvier 2025 et aujourd'hui
const randomDate = () => {
  const start = new Date('2025-01-01T00:00:00.000Z')
  const end = new Date()
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Fonction pour générer une date dans une année spécifique (limitée à aujourd'hui)
const randomDateInYear = (year) => {
  const start = new Date(`${year}-01-01T00:00:00.000Z`)
  const now = new Date()
  const end = new Date(`${year + 1}-01-01T00:00:00.000Z`)
  
  // Si l'année est l'année courante, limiter à aujourd'hui
  const maxDate = year === now.getFullYear() ? now : end
  
  return new Date(start.getTime() + Math.random() * (maxDate.getTime() - start.getTime()))
}

// Fonction utilitaire pour générer un numéro DS unique
let dsCounter = 100000

const initDSCounter = async () => {
  // Récupérer le dernier numéro DS existant pour éviter les conflits
  const lastDemande = await prisma.demande.findFirst({
    where: {
      numeroDS: {
        startsWith: 'DS'
      }
    },
    orderBy: {
      numeroDS: 'desc'
    },
    select: {
      numeroDS: true
    }
  })
  
  if (lastDemande && lastDemande.numeroDS) {
    const lastNumber = parseInt(lastDemande.numeroDS.replace('DS', ''))
    if (!isNaN(lastNumber)) {
      dsCounter = lastNumber + 1
    }
  }
  
  console.log(`📊 Numérotation DS initialisée à partir de DS${dsCounter}`)
}

const generateNumeroDS = () => {
  return `DS${dsCounter++}`
}

// Fonction utilitaire pour générer un numéro de dossier unique
let dossierCounter = 1
const generateNumeroDossier = () => {
  return (dossierCounter++).toString()
}

// Fonction utilitaire pour générer un NIGEND
const generateNigend = () => {
  return Math.floor(Math.random() * 9000000) + 1000000
}

// Fonction pour générer une demande aléatoire avec paramètres de dossier
const generateRandomDemande = (year = null, dossierParams = null, grades = []) => {
  const type = randomChoice(types)
  const nom = randomChoice(noms) // Noms déjà en majuscules
  const prenom = randomChoice(prenoms)
  const hasDetails = true // Toutes les demandes sont complètes
  
  // Si on a des paramètres de dossier, les utiliser pour la cohérence
  const unite = dossierParams?.unite || (hasDetails ? `Brigade de ${randomChoice(communes)}` : null)
  const commune = dossierParams?.commune || (hasDetails ? randomChoice(communes) : null)
  const dateFaitsBase = dossierParams?.dateFaits || null
  
  // Générer les dates dans le bon ordre chronologique
  const now = new Date()
  let startOfYear, maxDateForGeneration
  
  if (year === 2024) {
    startOfYear = new Date('2024-01-01T00:00:00.000Z')
    maxDateForGeneration = new Date('2024-12-31T23:59:59.999Z')
  } else {
    startOfYear = new Date('2025-01-01T00:00:00.000Z')
    maxDateForGeneration = new Date(now.getTime() - 24 * 60 * 60 * 1000) // Hier au minimum
  }
  
  // 1. Date des faits - utiliser celle du dossier ou générer une nouvelle
  const dateFaits = dateFaitsBase || (hasDetails ? new Date(startOfYear.getTime() + Math.random() * (maxDateForGeneration.getTime() - startOfYear.getTime())) : null)
  
  // 2. Date de réception - si dossier, proche de la date de réception du dossier (±1 semaine)
  let dateReception
  if (dossierParams?.dateReceptionBase) {
    const baseDate = dossierParams.dateReceptionBase
    const uneSeamaine = 7 * 24 * 60 * 60 * 1000 // 1 semaine en millisecondes
    const minDate = new Date(Math.max(baseDate.getTime() - uneSeamaine, dateFaits?.getTime() || startOfYear.getTime()))
    
    let maxDate
    if (year === 2024) {
      maxDate = new Date(Math.min(baseDate.getTime() + uneSeamaine, maxDateForGeneration.getTime()))
    } else {
      maxDate = new Date(Math.min(baseDate.getTime() + uneSeamaine, now.getTime()))
    }
    
    dateReception = new Date(minDate.getTime() + Math.random() * (maxDate.getTime() - minDate.getTime()))
  } else {
    if (year === 2024) {
      dateReception = dateFaits ? new Date(dateFaits.getTime() + Math.random() * (maxDateForGeneration.getTime() - dateFaits.getTime())) : randomDateInYear(year)
    } else {
      dateReception = dateFaits ? new Date(dateFaits.getTime() + Math.random() * (now.getTime() - dateFaits.getTime())) : (year ? randomDateInYear(year) : randomDate())
    }
  }
  
  // 3. Date d'audience (si elle existe, utiliser celle du dossier ou générer une nouvelle)
  let dateAudience = null
  if (dossierParams?.dateAudience) {
    // Utiliser la date d'audience commune du dossier
    dateAudience = dossierParams.dateAudience
  } else if (Math.random() > 0.6 && dateFaits) {
    // Générer une nouvelle date d'audience (jusqu'à 6 mois après la date des faits)
    const maxAudienceDate = new Date(dateFaits.getTime() + 6 * 30 * 24 * 60 * 60 * 1000) // +6 mois
    dateAudience = avoidWeekend(new Date(dateFaits.getTime() + Math.random() * (maxAudienceDate.getTime() - dateFaits.getTime())))
  }
  
  return {
    numeroDS: generateNumeroDS(),
    type,
    // Infos militaires (optionnelles)
    nigend: hasDetails ? generateNigend().toString() : null,
    gradeId: hasDetails && grades.length > 0 ? randomChoice(grades).id : null,
    statutDemandeur: hasDetails ? randomChoice(statutsDemandeur) : null,
    branche: hasDetails ? randomChoice(branches) : null,
    formationAdministrative: hasDetails ? randomChoice(['Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Bretagne', 'Centre-Val-de-Loire', 'Corse', 'Grand Est', 'Hauts-de-France', 'Ile-de-France', 'Nouvelle-Aquitaine', 'Normandie', 'Occitanie', 'Pays-de-la-Loire', 'Provence-Alpes-Côte-d\'Azur']) : null,
    departement: hasDetails ? Math.floor(Math.random() * 95 + 1).toString() : null,
    nom,
    prenom,
    // Coordonnées (optionnelles)
    adressePostaleLigne1: hasDetails ? `${Math.floor(Math.random() * 999) + 1} rue ${randomChoice(['de la Paix', 'Victor Hugo', 'Jean Jaurès', 'de la République', 'Charles de Gaulle'])}` : null,
    telephoneProfessionnel: hasDetails ? `0${Math.floor(Math.random() * 9) + 1}${Math.floor(Math.random() * 90000000) + 10000000}` : null,
    telephonePersonnel: hasDetails ? `0${Math.floor(Math.random() * 9) + 1}${Math.floor(Math.random() * 90000000) + 10000000}` : null,
    emailProfessionnel: hasDetails ? `${removeAccents(prenom).toLowerCase()}.${removeAccents(nom).toLowerCase()}@gendarmerie.interieur.gouv.fr` : null,
    emailPersonnel: hasDetails ? `${removeAccents(prenom).toLowerCase()}.${removeAccents(nom).toLowerCase()}@email.com` : null,
    unite,
    // Infos faits
    dateFaits,
    commune,
    codePostal: hasDetails ? Math.floor(Math.random() * 90000 + 10000).toString() : null,
    position: hasDetails ? randomChoice(positions) : null,
    contexteMissionnel: hasDetails ? randomChoice(contextesM) : null,
    qualificationInfraction: hasDetails ? randomChoice(qualificationsInfraction) : null,
    resume: hasDetails ? `Incident impliquant ${prenom} ${nom} en contexte de ${randomChoice(contextesM).toLowerCase()}.` : null,
    blessures: Math.random() > 0.7 ? randomChoice(['Contusions légères', 'Blessures superficielles', 'Traumatisme crânien léger', 'Entorse', 'Ecchymoses']) : null,
    partieCivile: Math.random() > 0.8,
    montantPartieCivile: Math.random() > 0.8 ? Math.floor(Math.random() * 10000) + 1000 : null,
    qualificationsPenales: hasDetails ? randomChoice(['Article 222-1 CP', 'Article 433-5 CP', 'Article 433-6 CP', 'Article 221-6 CP']) : null,
    dateAudience,
    // Soutiens
    soutienPsychologique: Math.random() > 0.7,
    soutienSocial: Math.random() > 0.8,
    soutienMedical: Math.random() > 0.9,
    dateReception
  }
}

// Définition de la répartition des BAP par utilisateur
const getBapsByUser = (users, baps) => {
  const userBapMapping = {
    // Hervé gère RGARA et RGPACA (comme spécifié)
    'herve': ['RGARA', 'RGPACA'],
    // Répartition réaliste avec un seul BAP par utilisateur ou aucun
    'marie': ['RGIF'],
    'jean': ['RGBRET'],
    'sophie': ['RGNORM'],
    'paul': ['RGCVL'],
    'claire': ['RGNA'],
    'thomas': ['RGPDL'],
    'julie': ['RGOCC'],
    'olivier': ['RGCOR'],
    'lucas': ['RGGE'],
    // Certains utilisateurs sans BAP
    'test': [],
    'admin': ['RGBFC'], // Admin avec un BAP
    'nathalie': [] // Pas de BAP
  }
  
  // Créer un mapping utilisateur -> objets BAP
  const result = {}
  users.forEach(user => {
    const bapNames = userBapMapping[user.identifiant] || []
    result[user.identifiant] = baps.filter(bap => bapNames.includes(bap.nomBAP))
  })
  
  return result
}

// Fonction pour attribuer un BAP à un utilisateur selon les probabilités
const shouldAssignBapToUser = (userIdentifiant, totalDossiersForUser) => {
  // Entre 35% et 45% des dossiers d'un utilisateur doivent être liés à ses BAP
  const minPercent = 0.35
  const maxPercent = 0.45
  const targetPercent = minPercent + Math.random() * (maxPercent - minPercent)
  
  return Math.random() < targetPercent
}

// Fonction pour générer un dossier avec ses demandes
const generateDossier = (year = 2025, users = [], sgamis = [], grades = [], baps = [], userBapMapping = {}) => {
  // Nombre de demandes par dossier (entre 1 et 14, moyenne ~3)
  const weights = [15, 25, 20, 15, 10, 5, 3, 2, 2, 1, 1, 1, 0.5, 0.5] // Poids pour 1 à 14 demandes
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  let random = Math.random() * totalWeight
  let nbDemandes = 1
  for (let i = 0; i < weights.length; i++) {
    random -= weights[i]
    if (random <= 0) {
      nbDemandes = i + 1
      break
    }
  }
  
  // Paramètres communs pour toutes les demandes du dossier
  const unite = `Brigade de ${randomChoice(communes)}`
  const commune = randomChoice(communes)
  
  // Date des faits commune selon l'année
  const now = new Date()
  let startOfYear, maxDateForFacts
  
  if (year === 2024) {
    startOfYear = new Date('2024-01-01T00:00:00.000Z')
    maxDateForFacts = new Date('2024-12-31T23:59:59.999Z')
  } else {
    startOfYear = new Date('2025-01-01T00:00:00.000Z')
    maxDateForFacts = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  }
  
  const dateFaits = new Date(startOfYear.getTime() + Math.random() * (maxDateForFacts.getTime() - startOfYear.getTime()))
  
  // Date de réception de base pour le dossier
  let dateReceptionBase
  if (year === 2024) {
    const maxReceptionDate = new Date('2024-12-31T23:59:59.999Z')
    dateReceptionBase = new Date(dateFaits.getTime() + Math.random() * (maxReceptionDate.getTime() - dateFaits.getTime()))
  } else {
    dateReceptionBase = new Date(dateFaits.getTime() + Math.random() * (now.getTime() - dateFaits.getTime()))
  }
  
  // Date d'audience commune pour toutes les demandes du dossier (si elle existe)
  let dateAudienceCommune = null
  if (Math.random() > 0.6) {
    // L'audience peut être jusqu'à 6 mois après la date des faits
    const maxAudienceDate = new Date(dateFaits.getTime() + 6 * 30 * 24 * 60 * 60 * 1000) // +6 mois
    // Pour 2024, s'assurer que l'audience reste en 2024 si possible
    if (year === 2024) {
      const endOf2024 = new Date('2024-12-31T23:59:59.999Z')
      const actualMaxDate = maxAudienceDate > endOf2024 ? endOf2024 : maxAudienceDate
      if (actualMaxDate > dateFaits) {
        dateAudienceCommune = avoidWeekend(new Date(dateFaits.getTime() + Math.random() * (actualMaxDate.getTime() - dateFaits.getTime())))
      }
    } else {
      dateAudienceCommune = avoidWeekend(new Date(dateFaits.getTime() + Math.random() * (maxAudienceDate.getTime() - dateFaits.getTime())))
    }
  }
  
  const dossierParams = {
    unite,
    commune,
    dateFaits,
    dateReceptionBase,
    dateAudience: dateAudienceCommune
  }
  
  // Assigner aléatoirement un utilisateur et un SGAMI au dossier
  const assignedUser = randomChoice(users)
  const assignedSgami = randomChoice(sgamis)
  
  // Déterminer si ce dossier doit être lié à un BAP géré par l'utilisateur
  let assignedBap = null
  if (shouldAssignBapToUser(assignedUser.identifiant)) {
    const userBaps = userBapMapping[assignedUser.identifiant] || []
    if (userBaps.length > 0) {
      assignedBap = randomChoice(userBaps)
    }
  }
  
  const demandes = []
  const demandesNonAffectees = [] // Demandes complètement non affectées
  const aujourdhui = new Date()
  aujourdhui.setHours(0, 0, 0, 0) // Début de la journée
  const demainDebut = new Date(aujourdhui.getTime() + 24 * 60 * 60 * 1000) // Début de demain
  
  for (let i = 0; i < nbDemandes; i++) {
    const demande = generateRandomDemande(year, dossierParams, grades)
    
    // Vérifier si la demande est reçue aujourd'hui (seulement pour 2025)
    const estDuJour = year === 2025 && demande.dateReception >= aujourdhui && demande.dateReception < demainDebut
    
    // Si c'est une demande du jour (2025), 30% de chance de ne pas être assignée DU TOUT
    // Ces demandes ne seront liées ni à un dossier, ni à un utilisateur, ni à un BAP
    if (estDuJour && Math.random() < 0.3) {
      demande.assigneAId = null
      // Cette demande ne sera pas dans le dossier - elle sera créée séparément
      demandesNonAffectees.push(demande)
    } else {
      // Demande normale assignée à l'utilisateur et incluse dans le dossier
      demande.assigneAId = assignedUser.id
      demandes.push(demande)
    }
  }
  
  const dossierData = {
    numero: generateNumeroDossier(),
    assigneAId: assignedUser.id,
    sgamiId: assignedSgami.id,
    assignedBap: assignedBap, // BAP assigné si applicable
    demandes,
    demandesNonAffectees // Demandes à créer séparément sans dossier
  }

  return {
    ...dossierData,
    notes: Math.random() > 0.3 ? generateDossierNotes(dossierData) : null // 70% des dossiers ont des notes
  }
}

async function main() {
  // Initialiser le compteur DS pour éviter les conflits
  await initDSCounter()
  
  // Initialiser le compteur de dossier en fonction des dossiers existants
  const existingDossiers = await prisma.dossier.findMany({
    select: { numero: true },
    orderBy: { numero: 'desc' }
  })
  
  if (existingDossiers.length > 0) {
    // Trouve le numéro le plus élevé et commence à partir du suivant
    const maxNumero = Math.max(...existingDossiers.map(d => parseInt(d.numero) || 0))
    dossierCounter = maxNumero + 1
    console.log(`📊 Dossiers existants trouvés, compteur initialisé à ${dossierCounter}`)
  }

  // Génération pour 2025 - calculer le nombre de dossiers nécessaires
  const totalDemandes2025 = 2825
  const totalDemandes2024 = 5000
  const moyenneDemandes = 3 // Moyenne de demandes par dossier
  const nbDossiers2025 = Math.ceil(totalDemandes2025 / moyenneDemandes)
  const nbDossiers2024 = Math.ceil(totalDemandes2024 / moyenneDemandes)
  
  console.log(`🚀 Génération de données de test :`)
  console.log(`   - 2024 : ~${totalDemandes2024} demandes réparties dans ${nbDossiers2024} dossiers`)
  console.log(`   - 2025 : ~${totalDemandes2025} demandes réparties dans ${nbDossiers2025} dossiers (du 1er janvier à aujourd'hui)`)
  console.log(`   - TOTAL : ~${totalDemandes2024 + totalDemandes2025} demandes dans ${nbDossiers2024 + nbDossiers2025} dossiers`)
  
  // Récupérer les données nécessaires
  const badges = await prisma.badge.findMany()
  const users = await prisma.user.findMany({ where: { active: true } })
  const sgamis = await prisma.sgami.findMany({
    where: {
      nom: { not: 'SGAMI EST CONSIGNATION' }
    }
  })
  const grades = await prisma.grade.findMany({ orderBy: { ordre: 'asc' } })
  const baps = await prisma.bAP.findMany()
  
  // Créer le mapping utilisateur-BAP
  const userBapMapping = getBapsByUser(users, baps)
  
  console.log(`🏷️  Badges disponibles : ${badges.map(b => b.nom).join(', ')}`)
  console.log(`👥 Utilisateurs disponibles : ${users.map(u => u.identifiant).join(', ')}`)
  console.log(`🏢 SGAMI disponibles : ${sgamis.map(s => s.formatCourtNommage).join(', ')}`)
  console.log(`🎖️  Grades disponibles : ${grades.map(g => g.gradeAbrege).join(', ')}`)
  console.log(`📋 BAP disponibles : ${baps.map(b => b.nomBAP).join(', ')}`)
  
  // Afficher la répartition des BAP par utilisateur
  console.log(`🔗 Répartition des BAP par utilisateur :`)
  Object.entries(userBapMapping).forEach(([userIdentifiant, userBaps]) => {
    if (userBaps.length > 0) {
      console.log(`   - ${userIdentifiant} : ${userBaps.map(b => b.nomBAP).join(', ')}`)
    } else {
      console.log(`   - ${userIdentifiant} : aucun BAP`)
    }
  })
  
  if (users.length === 0) {
    console.error('❌ Aucun utilisateur trouvé ! Exécutez d\'abord le seed.')
    return
  }
  
  if (sgamis.length === 0) {
    console.error('❌ Aucun SGAMI trouvé ! Exécutez d\'abord le seed.')
    return
  }
  
  if (grades.length === 0) {
    console.error('❌ Aucun grade trouvé ! Exécutez d\'abord le seed.')
    return
  }
  
  if (baps.length === 0) {
    console.error('❌ Aucun BAP trouvé ! Exécutez d\'abord le seed.')
    return
  }
  
  const dossiers = []
  let totalDemandesGenerees = 0
  
  // Génération des dossiers et leurs demandes pour 2024
  console.log(`📅 Génération des dossiers et demandes pour 2024...`)
  for (let i = 0; i < nbDossiers2024 && totalDemandesGenerees < totalDemandes2024; i++) {
    const dossier = generateDossier(2024, users, sgamis, grades, baps, userBapMapping)
    // Limiter le nombre de demandes si on dépasse le total souhaité
    if (totalDemandesGenerees + dossier.demandes.length > totalDemandes2024) {
      dossier.demandes = dossier.demandes.slice(0, totalDemandes2024 - totalDemandesGenerees)
    }
    dossiers.push(dossier)
    totalDemandesGenerees += dossier.demandes.length
    
    if ((i + 1) % 200 === 0) {
      console.log(`✅ ${i + 1}/${nbDossiers2024} dossiers 2024 générés (${totalDemandesGenerees} demandes)...`)
    }
  }
  
  console.log(`📊 2024 : ${dossiers.length} dossiers générés avec ${totalDemandesGenerees} demandes`)
  
  // Génération des dossiers et leurs demandes pour 2025
  let totalDemandesGenerees2025 = 0
  console.log(`📅 Génération des dossiers et demandes pour 2025...`)
  for (let i = 0; i < nbDossiers2025 && totalDemandesGenerees2025 < totalDemandes2025; i++) {
    const dossier = generateDossier(2025, users, sgamis, grades, baps, userBapMapping)
    // Limiter le nombre de demandes si on dépasse le total souhaité
    if (totalDemandesGenerees2025 + dossier.demandes.length > totalDemandes2025) {
      dossier.demandes = dossier.demandes.slice(0, totalDemandes2025 - totalDemandesGenerees2025)
    }
    dossiers.push(dossier)
    totalDemandesGenerees2025 += dossier.demandes.length
    
    if ((i + 1) % 100 === 0) {
      console.log(`✅ ${i + 1}/${nbDossiers2025} dossiers 2025 générés (${totalDemandesGenerees2025} demandes)...`)
    }
  }
  
  totalDemandesGenerees += totalDemandesGenerees2025
  
  console.log(`📊 ${dossiers.length} dossiers générés avec ${totalDemandesGenerees} demandes au total`)
  
  console.log('📤 Insertion des dossiers et demandes en base de données...')
  
  // Test d'insertion d'un dossier avec une demande d'abord
  try {
    const testDossier = dossiers[0]
    console.log('🔍 Test d\'insertion d\'un dossier...')
    console.log(`Dossier: ${testDossier.numero} avec ${testDossier.demandes.length} demandes`)
    
    const resultDossier = await prisma.dossier.create({
      data: {
        numero: testDossier.numero,
        assigneAId: testDossier.assigneAId,
        sgamiId: testDossier.sgamiId,
        notes: testDossier.notes
      }
    })
    
    const resultDemande = await prisma.demande.create({
      data: {
        ...testDossier.demandes[0],
        dossierId: resultDossier.id
      }
    })
    
    console.log('✅ Test réussi, insertion de tous les dossiers et demandes...')
    
    // Suppression du test
    await prisma.demande.delete({ where: { id: resultDemande.id } })
    await prisma.dossier.delete({ where: { id: resultDossier.id } })
  } catch (error) {
    console.error('❌ Erreur lors du test d\'insertion:', error.message)
    console.error('Stack:', error.stack)
    return
  }
  
  // Insertion dossier par dossier
  let dossiersInserted = 0
  let demandesInserted = 0
  let demandesNonAffecteesInserted = 0
  let badgeStats = { signale: 0, uda: 0, vss: 0 }
  let bapStats = {}
  
  // Initialiser les stats BAP
  baps.forEach(bap => {
    bapStats[bap.nomBAP] = 0
  })
  
  // Collecter toutes les demandes non affectées avant de traiter les dossiers
  const toutesDemandesNonAffectees = []
  dossiers.forEach(dossier => {
    if (dossier.demandesNonAffectees) {
      toutesDemandesNonAffectees.push(...dossier.demandesNonAffectees)
    }
  })
  
  for (const dossier of dossiers) {
    try {
      // 1. Créer le dossier avec assignation et SGAMI
      const createdDossier = await prisma.dossier.create({
        data: {
          numero: dossier.numero,
          assigneAId: dossier.assigneAId,
          sgamiId: dossier.sgamiId,
          notes: dossier.notes
        }
      })
      
      // 2. Attribuer des badges au dossier selon les probabilités
      const dossierBadgesToAdd = []
      
      // Badge "Signalé" : 1/250 = 0.4%
      if (Math.random() < 1/250) {
        const signaleBadge = badges.find(b => b.nom === 'Signalé')
        if (signaleBadge) {
          dossierBadgesToAdd.push(signaleBadge.id)
          badgeStats.signale++
        }
      }
      
      // Badge "UDA" : 1/300 = 0.33%
      if (Math.random() < 1/300) {
        const udaBadge = badges.find(b => b.nom === 'UDA')
        if (udaBadge) {
          dossierBadgesToAdd.push(udaBadge.id)
          badgeStats.uda++
        }
      }
      
      // Badge "VSS" : 1/600 = 0.17%
      if (Math.random() < 1/600) {
        const vssBadge = badges.find(b => b.nom === 'VSS')
        if (vssBadge) {
          dossierBadgesToAdd.push(vssBadge.id)
          badgeStats.vss++
        }
      }
      
      // Attribuer les badges sélectionnés au dossier
      if (dossierBadgesToAdd.length > 0) {
        for (const badgeId of dossierBadgesToAdd) {
          await prisma.dossierBadge.create({
            data: {
              dossierId: createdDossier.id,
              badgeId: badgeId
            }
          })
        }
      }
      
      // 3. Attribuer le BAP au dossier si applicable
      if (dossier.assignedBap) {
        await prisma.dossierBAP.create({
          data: {
            dossierId: createdDossier.id,
            bapId: dossier.assignedBap.id
          }
        })
        bapStats[dossier.assignedBap.nomBAP]++
      }
      
      // 4. Créer les demandes du dossier
      for (const demande of dossier.demandes) {
        const createdDemande = await prisma.demande.create({
          data: {
            ...demande,
            dossierId: createdDossier.id
          }
        })
        
        // Si le dossier est lié à un BAP, lier aussi toutes ses demandes
        if (dossier.assignedBap) {
          await prisma.demandeBAP.create({
            data: {
              demandeId: createdDemande.id,
              bapId: dossier.assignedBap.id
            }
          })
        }
        
        demandesInserted++
      }
      
      dossiersInserted++
      
      if (dossiersInserted % 50 === 0) {
        console.log(`✅ ${dossiersInserted}/${dossiers.length} dossiers insérés (${demandesInserted} demandes)`)
      }
    } catch (error) {
      console.error(`❌ Erreur lors de l'insertion du dossier ${dossier.numero}:`, error.message)
      // On continue avec le dossier suivant
    }
  }
  
  // Insérer les demandes non affectées (sans dossier, sans BAP, sans assignation)
  if (toutesDemandesNonAffectees.length > 0) {
    console.log(`📝 Insertion de ${toutesDemandesNonAffectees.length} demandes non affectées...`)
    
    for (const demande of toutesDemandesNonAffectees) {
      try {
        await prisma.demande.create({
          data: {
            ...demande,
            dossierId: null // Explicitement sans dossier
          }
        })
        demandesNonAffecteesInserted++
      } catch (error) {
        console.error(`❌ Erreur lors de l'insertion de la demande non affectée ${demande.numeroDS}:`, error.message)
      }
    }
    
    console.log(`✅ ${demandesNonAffecteesInserted} demandes non affectées insérées`)
  }
  
  console.log(`🎉 Génération terminée ! ${dossiersInserted} dossiers, ${demandesInserted} demandes dans des dossiers et ${demandesNonAffecteesInserted} demandes non affectées ont été créées en base de données.`)
  console.log(`🏷️  Badges attribués aux dossiers :`)
  console.log(`   - Signalé : ${badgeStats.signale} dossiers`)
  console.log(`   - UDA : ${badgeStats.uda} dossiers`)
  console.log(`   - VSS : ${badgeStats.vss} dossiers`)
  console.log(`📋 BAP attribués aux dossiers :`)
  Object.entries(bapStats).forEach(([bapName, count]) => {
    if (count > 0) {
      console.log(`   - ${bapName} : ${count} dossiers`)
    }
  })
  
  // Vérifications
  const totalDossiersEnBase = await prisma.dossier.count()
  const totalDemandesEnBase = await prisma.demande.count()
  const demandesAvecDossier = await prisma.demande.count({ where: { dossierId: { not: null } } })
  const demandesSansDossier = await prisma.demande.count({ where: { dossierId: null } })
  const demandesAvecAssignation = await prisma.demande.count({ where: { assigneAId: { not: null } } })
  const demandesSansAssignation = await prisma.demande.count({ where: { assigneAId: null } })
  const dossiersAvecAssignation = await prisma.dossier.count({ where: { assigneAId: { not: null } } })
  const dossiersAvecSgami = await prisma.dossier.count({ where: { sgamiId: { not: null } } })
  const dossiersAvecBap = await prisma.dossierBAP.count()
  const demandesAvecBap = await prisma.demandeBAP.count()
  
  console.log(`📊 Statistiques finales :`)
  console.log(`   - Dossiers en base : ${totalDossiersEnBase}`)
  console.log(`   - Demandes en base : ${totalDemandesEnBase}`)
  console.log(`   - Demandes liées à un dossier : ${demandesAvecDossier}`)
  console.log(`   - Demandes NON liées à un dossier : ${demandesSansDossier}`)
  console.log(`   - Demandes assignées : ${demandesAvecAssignation}`)
  console.log(`   - Demandes NON assignées : ${demandesSansAssignation}`)
  console.log(`   - Dossiers assignés : ${dossiersAvecAssignation}`)
  console.log(`   - Dossiers avec SGAMI : ${dossiersAvecSgami}`)
  console.log(`   - Dossiers avec BAP : ${dossiersAvecBap}`)
  console.log(`   - Demandes avec BAP : ${demandesAvecBap}`)
  console.log(`   - Moyenne de demandes par dossier : ${totalDossiersEnBase > 0 ? (demandesAvecDossier / totalDossiersEnBase).toFixed(2) : '0'}`)
  
  // Statistiques détaillées par utilisateur
  console.log(`\n📊 Répartition détaillée par utilisateur :`)
  for (const user of users) {
    const userDossiers = await prisma.dossier.count({ where: { assigneAId: user.id } })
    const userDossiersAvecBap = await prisma.dossier.count({
      where: {
        assigneAId: user.id,
        baps: { some: {} }
      }
    })
    const pourcentageBap = userDossiers > 0 ? ((userDossiersAvecBap / userDossiers) * 100).toFixed(1) : '0.0'
    console.log(`   - ${user.identifiant} : ${userDossiers} dossiers, ${userDossiersAvecBap} avec BAP (${pourcentageBap}%)`)
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })