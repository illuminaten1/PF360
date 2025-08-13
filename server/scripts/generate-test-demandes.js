const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Données de base pour la génération aléatoire
const types = ['VICTIME', 'MIS_EN_CAUSE']
const grades = [
  'Général', 'Colonel', 'Lieutenant-colonel', 'Chef d\'escadron', 'Commandant', 
  'Capitaine', 'Lieutenant', 'Sous-lieutenant', 'Aspirant', 'Major', 
  'Adjudant-chef', 'Adjudant', 'Maréchal des logis-chef', 'Gendarme', 
  'Élève gendarme', 'Maréchal des logis', 'Brigadier-chef', 'Brigadier',
  'Gendarme adjoint volontaire', 'Gendarme adjoint de 2ème classe'
]
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
const generateNumeroDS = () => {
  return `DS${dsCounter++}`
}

// Fonction utilitaire pour générer un numéro de dossier unique
let dossierCounter = 1
const generateNumeroDossier = () => {
  return `DOS${(dossierCounter++).toString().padStart(6, '0')}`
}

// Fonction utilitaire pour générer un NIGEND
const generateNigend = () => {
  return Math.floor(Math.random() * 9000000) + 1000000
}

// Fonction pour générer une demande aléatoire avec paramètres de dossier
const generateRandomDemande = (year = null, dossierParams = null) => {
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
  const startOfYear = new Date('2025-01-01T00:00:00.000Z')
  const oneDayBefore = new Date(now.getTime() - 24 * 60 * 60 * 1000) // Hier au minimum
  
  // 1. Date des faits - utiliser celle du dossier ou générer une nouvelle
  const dateFaits = dateFaitsBase || (hasDetails ? new Date(startOfYear.getTime() + Math.random() * (oneDayBefore.getTime() - startOfYear.getTime())) : null)
  
  // 2. Date de réception - si dossier, proche de la date de réception du dossier (±1 semaine)
  let dateReception
  if (dossierParams?.dateReceptionBase) {
    const baseDate = dossierParams.dateReceptionBase
    const uneSeamaine = 7 * 24 * 60 * 60 * 1000 // 1 semaine en millisecondes
    const minDate = new Date(Math.max(baseDate.getTime() - uneSeamaine, dateFaits?.getTime() || startOfYear.getTime()))
    const maxDate = new Date(Math.min(baseDate.getTime() + uneSeamaine, now.getTime()))
    dateReception = new Date(minDate.getTime() + Math.random() * (maxDate.getTime() - minDate.getTime()))
  } else {
    dateReception = dateFaits ? new Date(dateFaits.getTime() + Math.random() * (now.getTime() - dateFaits.getTime())) : (year ? randomDateInYear(year) : randomDate())
  }
  
  // 3. Date d'audience (si elle existe, après la date des faits et potentiellement dans le futur)
  let dateAudience = null
  if (Math.random() > 0.6 && dateFaits) {
    // L'audience peut être jusqu'à 6 mois après la date des faits
    const maxAudienceDate = new Date(dateFaits.getTime() + 6 * 30 * 24 * 60 * 60 * 1000) // +6 mois
    dateAudience = new Date(dateFaits.getTime() + Math.random() * (maxAudienceDate.getTime() - dateFaits.getTime()))
  }
  
  return {
    numeroDS: generateNumeroDS(),
    type,
    // Infos militaires (optionnelles)
    nigend: hasDetails ? generateNigend().toString() : null,
    grade: hasDetails ? randomChoice(grades) : null,
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

// Fonction pour générer un dossier avec ses demandes
const generateDossier = (year = 2025, users = [], sgamis = []) => {
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
  
  // Date des faits commune
  const now = new Date()
  const startOfYear = new Date('2025-01-01T00:00:00.000Z')
  const oneDayBefore = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const dateFaits = new Date(startOfYear.getTime() + Math.random() * (oneDayBefore.getTime() - startOfYear.getTime()))
  
  // Date de réception de base pour le dossier
  const dateReceptionBase = new Date(dateFaits.getTime() + Math.random() * (now.getTime() - dateFaits.getTime()))
  
  const dossierParams = {
    unite,
    commune,
    dateFaits,
    dateReceptionBase
  }
  
  // Assigner aléatoirement un utilisateur et un SGAMI au dossier
  const assignedUser = randomChoice(users)
  const assignedSgami = randomChoice(sgamis)
  
  const demandes = []
  for (let i = 0; i < nbDemandes; i++) {
    const demande = generateRandomDemande(year, dossierParams)
    // Assigner la même personne à toutes les demandes du dossier
    demande.assigneAId = assignedUser.id
    demandes.push(demande)
  }
  
  return {
    numero: generateNumeroDossier(),
    assigneAId: assignedUser.id,
    sgamiId: assignedSgami.id,
    demandes
  }
}

async function main() {
  // Génération pour 2025 - calculer le nombre de dossiers nécessaires
  const totalDemandes = 2825
  const moyenneDemandes = 3 // Moyenne de demandes par dossier
  const nbDossiers = Math.ceil(totalDemandes / moyenneDemandes)
  
  console.log(`🚀 Génération de ~${totalDemandes} demandes réparties dans ${nbDossiers} dossiers (du 1er janvier 2025 à aujourd'hui)...`)
  
  // Récupérer les données nécessaires
  const badges = await prisma.badge.findMany()
  const users = await prisma.user.findMany({ where: { active: true } })
  const sgamis = await prisma.sgami.findMany()
  
  console.log(`🏷️  Badges disponibles : ${badges.map(b => b.nom).join(', ')}`)
  console.log(`👥 Utilisateurs disponibles : ${users.map(u => u.identifiant).join(', ')}`)
  console.log(`🏢 SGAMI disponibles : ${sgamis.map(s => s.formatCourtNommage).join(', ')}`)
  
  if (users.length === 0) {
    console.error('❌ Aucun utilisateur trouvé ! Exécutez d\'abord le seed.')
    return
  }
  
  if (sgamis.length === 0) {
    console.error('❌ Aucun SGAMI trouvé ! Exécutez d\'abord le seed.')
    return
  }
  
  const dossiers = []
  let totalDemandesGenerees = 0
  
  // Génération des dossiers et leurs demandes pour 2025
  console.log(`📅 Génération des dossiers et demandes pour 2025...`)
  for (let i = 0; i < nbDossiers && totalDemandesGenerees < totalDemandes; i++) {
    const dossier = generateDossier(2025, users, sgamis)
    // Limiter le nombre de demandes si on dépasse le total souhaité
    if (totalDemandesGenerees + dossier.demandes.length > totalDemandes) {
      dossier.demandes = dossier.demandes.slice(0, totalDemandes - totalDemandesGenerees)
    }
    dossiers.push(dossier)
    totalDemandesGenerees += dossier.demandes.length
    
    if ((i + 1) % 100 === 0) {
      console.log(`✅ ${i + 1}/${nbDossiers} dossiers générés (${totalDemandesGenerees} demandes)...`)
    }
  }
  
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
        sgamiId: testDossier.sgamiId
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
  let badgeStats = { signale: 0, uda: 0, vss: 0 }
  
  for (const dossier of dossiers) {
    try {
      // 1. Créer le dossier avec assignation et SGAMI
      const createdDossier = await prisma.dossier.create({
        data: {
          numero: dossier.numero,
          assigneAId: dossier.assigneAId,
          sgamiId: dossier.sgamiId
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
      
      // 3. Créer les demandes du dossier
      for (const demande of dossier.demandes) {
        await prisma.demande.create({
          data: {
            ...demande,
            dossierId: createdDossier.id
          }
        })
        
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
  
  console.log(`🎉 Génération terminée ! ${dossiersInserted} dossiers et ${demandesInserted} demandes ont été créées en base de données.`)
  console.log(`🏷️  Badges attribués aux dossiers :`)
  console.log(`   - Signalé : ${badgeStats.signale} dossiers`)
  console.log(`   - UDA : ${badgeStats.uda} dossiers`)
  console.log(`   - VSS : ${badgeStats.vss} dossiers`)
  
  // Vérifications
  const totalDossiersEnBase = await prisma.dossier.count()
  const totalDemandesEnBase = await prisma.demande.count()
  const demandesAvecDossier = await prisma.demande.count({ where: { dossierId: { not: null } } })
  const demandesAvecAssignation = await prisma.demande.count({ where: { assigneAId: { not: null } } })
  const dossiersAvecAssignation = await prisma.dossier.count({ where: { assigneAId: { not: null } } })
  const dossiersAvecSgami = await prisma.dossier.count({ where: { sgamiId: { not: null } } })
  
  console.log(`📊 Statistiques finales :`)
  console.log(`   - Dossiers en base : ${totalDossiersEnBase}`)
  console.log(`   - Demandes en base : ${totalDemandesEnBase}`)
  console.log(`   - Demandes liées à un dossier : ${demandesAvecDossier}`)
  console.log(`   - Demandes assignées : ${demandesAvecAssignation}`)
  console.log(`   - Dossiers assignés : ${dossiersAvecAssignation}`)
  console.log(`   - Dossiers avec SGAMI : ${dossiersAvecSgami}`)
  console.log(`   - Moyenne de demandes par dossier : ${(totalDemandesEnBase / totalDossiersEnBase).toFixed(2)}`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })