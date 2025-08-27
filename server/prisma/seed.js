const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seeding...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  
  const adminUser = await prisma.user.upsert({
    where: { identifiant: 'admin' },
    update: {},
    create: {
      identifiant: 'admin',
      password: hashedPassword,
      nom: 'LECHEF',
      prenom: 'Michel',
      mail: 'miche.lechef@interieur.gouv.fr',
      role: 'ADMIN',
      grade: 'LCL'
    }
  })

  console.log('✅ Admin user created:', adminUser.identifiant)

  // Create SGAMI entries
  const sgamiData = [
    { nom: 'SGAMI OUEST', formatCourtNommage: 'OUEST' },
    { nom: 'SGAMI NORD', formatCourtNommage: 'NORD' },
    { nom: 'SGAMI SUD-OUEST', formatCourtNommage: 'SO' },
    { nom: 'SGAMI SUD-EST', formatCourtNommage: 'SE' },
    { nom: 'SGAMI ILE-DE-FRANCE', formatCourtNommage: 'IDF' },
    { nom: 'SGAMI EST', formatCourtNommage: 'EST-CONSIGNATION' },
    { nom: 'SGAMI EST', formatCourtNommage: 'EST' },
    { nom: 'SGAMI SUD', formatCourtNommage: 'SUD' },
    { nom: 'SATPN NOUVELLE-CALEDONIE', formatCourtNommage: 'NC' },
    { nom: 'SATPN LA REUNION', formatCourtNommage: 'REUNION' },
    { nom: 'SATPN GUYANE', formatCourtNommage: 'GUYANE' },
    { nom: 'SATPN MARTINIQUE', formatCourtNommage: 'MARTINIQUE' },
    { nom: 'SATPN GUADELOUPE', formatCourtNommage: 'GUADELOUPE' },
    { nom: 'SATPN MAYOTTE', formatCourtNommage: 'MAYOTTE' },
    { nom: 'SGAP POLYNESIE FRANCAISE', formatCourtNommage: 'POLYNESIE' },
    { nom: 'CPFI', formatCourtNommage: 'CPFI' }
  ]

  for (const sgami of sgamiData) {
    await prisma.sgami.upsert({
      where: { nom: sgami.nom },
      update: { formatCourtNommage: sgami.formatCourtNommage },
      create: { nom: sgami.nom, formatCourtNommage: sgami.formatCourtNommage }
    })
  }

  console.log('✅ SGAMI entries created')

  // Create badges
  const badgesData = [
    { nom: 'Signalé', couleur: '#ef4444' },
    { nom: 'UDA', couleur: '#f97316' },
    { nom: 'VSS', couleur: '#10b981' }
  ]

  for (const badge of badgesData) {
    await prisma.badge.upsert({
      where: { nom: badge.nom },
      update: {},
      create: badge
    })
  }

  console.log('✅ Badges created')

  // Create sample lawyers
  const avocatsData = [
    {
      nom: 'DUPONT',
      prenom: 'Jean',
      region: 'Île-de-France',
      adressePostale: '15 rue de la Justice, 75001 Paris',
      telephonePublic1: '01.23.45.67.89',
      email: 'j.dupont@avocats.fr',
      villesIntervention: JSON.stringify(['Paris', 'Versailles', 'Créteil', 'Bobigny', 'Pontoise']),
      notes: 'Très expérimenté en droit pénal. Disponible pour interventions urgentes. Excellentes relations avec les tribunaux parisiens.',
      specialisation: 'Droit pénal',
      siretOuRidet: '12345678901234',
      titulaireDuCompteBancaire: 'DUPONT Jean',
      codeEtablissement: '30004',
      codeGuichet: '00170',
      numeroDeCompte: '00001234567',
      cle: '89'
    },
    {
      nom: 'MARTIN',
      prenom: 'Marie',
      region: 'Auvergne-Rhône-Alpes',
      adressePostale: '32 avenue des Droits, 69001 Lyon',
      telephonePublic1: '04.56.78.90.12',
      email: 'm.martin@avocats.fr',
      villesIntervention: JSON.stringify(['Lyon', 'Villeurbanne', 'Saint-Étienne', 'Grenoble', 'Chambéry']),
      notes: 'Spécialisée dans les affaires familiales et successions. Très pédagogue avec les clients. Maîtrise parfaitement les procédures d\'urgence.',
      specialisation: 'Droit civil',
      siretOuRidet: '98765432109876',
      titulaireDuCompteBancaire: 'MARTIN Marie',
      codeEtablissement: '10278',
      codeGuichet: '00050',
      numeroDeCompte: '00009876543',
      cle: '21'
    },
    {
      nom: 'LEROY',
      prenom: 'Pierre',
      region: 'Provence-Alpes-Côte d\'Azur',
      adressePostale: '8 place du Palais, 13001 Marseille',
      telephonePublic1: '04.91.23.45.67',
      email: 'p.leroy@avocats.fr',
      villesIntervention: JSON.stringify(['Marseille', 'Aix-en-Provence', 'Toulon', 'Nice', 'Avignon']),
      notes: 'Expert en contentieux administratif et marchés publics. Ancien magistrat administratif. Très rigoureux dans le suivi des dossiers.',
      specialisation: 'Droit administratif',
      siretOuRidet: '45678912345678',
      titulaireDuCompteBancaire: 'LEROY Pierre',
      codeEtablissement: '13807',
      codeGuichet: '00020',
      numeroDeCompte: '00005551234',
      cle: '67'
    }
  ]

  for (const avocat of avocatsData) {
    const existing = await prisma.avocat.findFirst({
      where: { email: avocat.email }
    })
    
    if (!existing) {
      await prisma.avocat.create({
        data: avocat
      })
    }
  }

  console.log('✅ Sample lawyers created')

  // Create a test user
  const testUserPassword = await bcrypt.hash('test123', 12)
  
  const testUser = await prisma.user.upsert({
    where: { identifiant: 'test' },
    update: {},
    create: {
      identifiant: 'test',
      password: testUserPassword,
      nom: 'PASCHEF',
      prenom: 'Laurent',
      mail: 'laurent.pachef@interieur.gouv.fr',
      role: 'REDACTEUR',
      grade: 'GAV'
    }
  })

  console.log('✅ Test user created:', testUser.identifiant)

  // Create default visas
  const visasData = [
    {
      typeVisa: 'MILITAIRE',
      texteVisa: 'Vu le code de la défense, notamment son article L. 4123-10 ;\nVu le code de la sécurité intérieure, notamment son article L. 113-1;\nVu la fiche Astrée 5.7.1.1 relative à la protection fonctionnelle;',
      active: true
    },
    {
      typeVisa: 'CIVIL',
      texteVisa: 'Vu le code général de la fonction publique, notamment ses articles L. 134-1 et suivants;\nVu le décret n° 2017-97 du 26 janvier 2017;',
      active: true
    }
  ]

  for (const visa of visasData) {
    await prisma.visa.upsert({
      where: { typeVisa: visa.typeVisa },
      update: {},
      create: visa
    })
  }

  console.log('✅ Default visas created')

  // Seed PCE data
  console.log('🌱 Starting PCE seeding...')
  
  const pceData = [
    {
      ordre: 1,
      pceDetaille: 'Règlement des frais et honoraires d\'avocat (PCE 6131.000.000)',
      pceNumerique: 'PCE 6131.000.000',
      codeMarchandise: '40.03.02'
    },
    {
      ordre: 2,
      pceDetaille: 'Remboursement des frais et honoraires d\'avocat (PCE 6131.000.000)',
      pceNumerique: 'PCE 6131.000.000',
      codeMarchandise: '40.03.02'
    },
    {
      ordre: 3,
      pceDetaille: 'Règlement des frais de consignation d\'expertise (PCE 6135.000.000)',
      pceNumerique: 'PCE 6135.000.000',
      codeMarchandise: '43.01.01'
    },
    {
      ordre: 4,
      pceDetaille: 'Remboursement des frais de consignation d\'expertise (PCE 6135.000.000)',
      pceNumerique: 'PCE 6135.000.000',
      codeMarchandise: '43.01.01'
    },
    {
      ordre: 5,
      pceDetaille: 'Règlement des frais et honoraires d\'huissier (PCE 6134.000.000)',
      pceNumerique: 'PCE 6134.000.000',
      codeMarchandise: '40.03.03'
    },
    {
      ordre: 6,
      pceDetaille: 'Remboursement des honoraires d\'huissier (PCE 6134.000.000)',
      pceNumerique: 'PCE 6134.000.000',
      codeMarchandise: '40.03.03'
    },
    {
      ordre: 7,
      pceDetaille: 'Règlement des frais et honoraires d\'un médecin conseil (PCE 6135.000.000)',
      pceNumerique: 'PCE 6135.000.000',
      codeMarchandise: '43.01.01'
    },
    {
      ordre: 8,
      pceDetaille: 'Remboursement des frais et honoraires d\'un médecin conseil (PCE 6135.000.000)',
      pceNumerique: 'PCE 6135.000.000',
      codeMarchandise: '43.01.01'
    },
    {
      ordre: 9,
      pceDetaille: 'Réparation directe du préjudice (PCE 6222.000.000)',
      pceNumerique: 'PCE 6222.000.000',
      codeMarchandise: '46.01.02'
    },
    {
      ordre: 10,
      pceDetaille: 'Règlement des frais de mission, déplacement et repas (PCE 6153.110.000)',
      pceNumerique: 'PCE 6135.110.000',
      codeMarchandise: '25.01.01'
    },
    {
      ordre: 11,
      pceDetaille: 'Remboursement des frais de mission, déplacement et repas (PCE 6153.110.000)',
      pceNumerique: 'PCE 6135.110.000',
      codeMarchandise: '25.01.01'
    },
    {
      ordre: 12,
      pceDetaille: 'Remboursement FGTI des sommes versées (PCE 6222.000.000) au profit',
      pceNumerique: 'PCE 6222.000.000',
      codeMarchandise: '46.01.02'
    },
    {
      ordre: 13,
      pceDetaille: 'Règlement des frais d\'actes et de procédure (PCE 6137.000.000)',
      pceNumerique: 'PCE 6137.000.000',
      codeMarchandise: '45.03.01'
    },
    {
      ordre: 14,
      pceDetaille: 'Remboursement des frais d\'actes et de procédure (PCE 6137.000.000)',
      pceNumerique: 'PCE 6137.000.000',
      codeMarchandise: '45.03.01'
    },
    {
      ordre: 15,
      pceDetaille: 'Règlement des autres pénalités et condamnations (PCE 6228.000.000)',
      pceNumerique: 'PCE 6228.000.000',
      codeMarchandise: '46.01.03'
    },
    {
      ordre: 16,
      pceDetaille: 'Remboursement des autres pénalités et condamnations (PCE 6228.000.000)',
      pceNumerique: 'PCE 6228.000.000',
      codeMarchandise: '46.01.03'
    }
  ]

  console.log(`📊 ${pceData.length} PCE à insérer...`)

  // Supprimer les PCE existants
  await prisma.pce.deleteMany({})
  console.log('🗑️  PCE existants supprimés')

  // Insérer les nouveaux PCE
  for (const pce of pceData) {
    try {
      await prisma.pce.create({
        data: pce
      })
    } catch (error) {
      console.error(`❌ Erreur lors de l'insertion du PCE: ${pce.pceDetaille}`, error.message)
    }
  }

  const pceCount = await prisma.pce.count()
  console.log(`✅ ${pceCount} PCE insérés avec succès!`)

  // Seed Diligences data
  console.log('🌱 Starting Diligences seeding...')

  const diligencesData = [
    {
      nom: 'comparution sur reconnaissance préalable de culpabilité',
      details: 'Ces honoraires couvrent les diligences pour la représentation des militaires dans le cadre d\'une procédure de comparution sur reconnaissance préalable de culpabilité :\n- L\'étude des pièces communiquées par les clients ainsi que par le parquet\n- L\'entretien de préparation de l\'audience avec le ou les militaires\n- L\'audience de plaidoirie\n- Rédactions des conclusions\n- Le conseil en vue de l\'acceptation de la décision ou de l\'orientation vers une procédure d\'appel\n- La saisine du service d\'aide au recouvrement des victimes d\'infractions (SARVI)',
    },
    {
      nom: 'audition libre ou garde à vue',
      details: 'Ces honoraires couvrent les diligences effectuées au titre de l\'assistance lors de l\'audition libre ou de la garde à vue.',
    },
    {
      nom: 'interrogatoire de première comparution',
      details: 'Ces honoraires couvrent les diligences effectuées au titre de l\'assistance lors de l\'interrogatoire de première comparution.',
    },
    {
      nom: 'information judiciaire',
      details: 'Ces honoraires couvrent les diligences énumérées ci-après :\n- Les rendez-vous, consultations et recherches réalisées en vue de l\'orientation de la procédure et de la défense des militaires\n- L\'étude de toute pièce utile à la procédure\n- Les auditions devant le juge d\'instruction\n- Les observations présentées au juge d\'instruction\n- Les demandes de réalisation d\'actes dans l\'intérêt du ou des militaires\n- La saisine et/ou la préparation des audiences devant la chambre de l\'instruction\n- La préparation du dossier de plaidoirie\n- La rédaction de conclusions',
    },
    {
      nom: 'information judiciaire sans mis en cause interpellé',
      details: 'Ces honoraires couvrent les diligences effectuées au titre de l\'assistance au cours de l\'information judiciaire jusqu\'à l\'interpellation du mis en cause.',
    },
    {
      nom: 'comparution immédiate',
      details: 'Ces honoraires couvrent les diligences énumérées ci-après :\n- Les rendez-vous, consultations et recherches réalisées en vue de l\'orientation de la procédure et de la préparation de la défense des militaires\n- L\'étude de toute pièce utile à la procédure\n- La rédaction de conclusions\n- La préparation du dossier de plaidoirie\n- La présence lors de l\'audience de plaidoirie\n- La présence lors du délibéré\n- Le conseil en vue de l\'acceptation de la décision ou de l\'orientation vers une procédure d\'appel\n- La saisine du service d\'aide au recouvrement des victimes d\'infraction (SARVI)',
    },
    {
      nom: 'première instance sans renvoi sur intérêts civils',
      details: 'Ces honoraires couvrent les diligences énumérées ci-après :\n- Les rendez-vous, consultations et recherches réalisées en vue de l\'orientation de la procédure et de la préparation de la défense des militaires\n- L\'étude de toute pièce utile à la procédure\n- La rédaction de conclusions\n- La préparation du dossier de plaidoirie\n- La présence lors de l\'audience de plaidoirie\n- La présence lors du délibéré\n- Le conseil en vue de l\'acceptation de la décision ou de l\'orientation vers une procédure d\'appel\n- La saisine du service d\'aide au recouvrement des victimes d\'infraction (SARVI)',
    },
    {
      nom: 'première instance avec renvoi sur intérêts civils',
      details: 'Ces honoraires couvrent les diligences énumérées ci-après :\n- Les rendez-vous, consultations et recherches réalisées en vue de l\'orientation de la procédure et de la préparation de la défense des militaires\n- L\'étude de toute pièce utile à la procédure\n- L\'assistance à l\'expertise médicale et aux réunions subséquentes\n- La rédaction de dire à expert\n- La rédaction de conclusions\n- La préparation du dossier de plaidoirie\n- La présence lors de l\'audience sur le fond\n- La présence lors du délibéré\n- Le conseil en vue de l\'acceptation de la décision sur le fond ou l\'orientation vers une procédure d\'appel\n- La saisine du service d\'aide au recouvrement des victimes d\'infractions (SARVI)',
    },
    {
      nom: 'appel',
      details: 'Ces honoraires couvrent les diligences énumérées ci-après :\n- Les rendez-vous en vue de la préparation de la défense\n- L\'étude de toute pièce utile à la procédure\n- La rédaction de conclusions\n- La préparation du dossier de plaidoirie\n- L\'audience de plaidoirie\n- La présence lors du délibéré\n- Le conseil en vue de l\'acceptation de la décision ou l\'orientation vers un pourvoi en cassation\n- La saisine du service d\'aide au recouvrement des victimes d\'infractions (SARVI)',
    },
    {
      nom: 'commission d\'indemnisation des victimes d\'infractions',
      details: 'Ces honoraires couvrent les diligences énumérées ci-après :\n- Les rendez-vous en vue du rassemblement des pièces nécessaires à la procédure\n- La requête introductive et demande de provision\n- La préparation et l\'assistance à l\'expertise\n- La rédaction de conclusions et de dires\n- La préparation du dossier de plaidoirie\n- La requête pour la liquidation des préjudices\n- Le conseil en vue de l\'acceptation de l\'offre d\'indemnisation rendue ou l\'orientation vers une procédure d\'appel de la décision',
    },
    {
      nom: 'ajout de militaire(s) au dossier',
      details: 'Ces honoraires couvrent les diligences supplémentaires liées à l\'ajout d\'un ou plusieurs militaires dans le dossier en cours de procédure.',
    },
    {
      nom: 'renvois d\'audiences',
      details: 'Ces honoraires couvrent les diligences supplémentaires occasionnées par le renvoi d\'audiences et les nouvelles préparations nécessaires.',
    },
    {
      nom: 'assistance à expertise médicale',
      details: 'Ces honoraires couvrent les diligences effectuées au titre de l\'assistance lors d\'expertises médicales.',
    },
    {
      nom: 'multiplicité des actes à accomplir dans la procédure',
      details: 'Ces honoraires couvrent les diligences supplémentaires dues à la complexité et à la multiplicité des actes nécessaires dans la procédure.',
    },
    {
      nom: 'interpellation du mis en cause',
      details: 'Ces honoraires couvrent les diligences énumérées ci-après :\n- Les rendez-vous, consultations et recherches réalisées en vue de l\'orientation de la procédure et de la défense des militaires\n- L\'étude de toute pièce utile à la procédure\n- Les auditions devant le juge d\'instruction\n- Les observations présentées au juge d\'instruction\n- Les demandes de réalisation d\'actes dans l\'intérêt du ou des militaires\n- La saisine et/ou la préparation des audiences devant la chambre de l\'instruction\n- La préparation du dossier de plaidoirie\n- La rédaction de conclusions',
    },
    {
      nom: 'audience devant une autre juridiction (majeur/mineur)',
      details: 'Ces honoraires couvrent les diligences effectuées lors d\'audiences devant des juridictions autres que celles initialement saisies, notamment pour les affaires impliquant des majeurs et des mineurs.',
    },
    {
      nom: 'cassation',
      details: 'Ces honoraires couvrent les diligences utiles et nécessaires à la défense des militaires devant la cour de cassation.',
    },
    {
      nom: 'assises',
      details: 'Ces honoraires couvrent les diligences énumérées ci-après :\n- Les rendez-vous, consultations et recherches réalisées en vue de l\'orientation de la procédure et de la préparation de la défense des militaires\n- L\'étude de toute pièce utile à la procédure communiquées par les clients ainsi que par le parquet\n- L\'assistance à l\'expertise médicale et aux réunions subséquentes\n- La rédaction de dire à expert\n- La rédaction de conclusions\n- La préparation du dossier de plaidoirie\n- La présence lors de l\'audience sur le fond et les éventuelles audiences de renvoi\n- La présence lors du délibéré\n- Le conseil en vue de l\'acceptation de la décision sur le fond ou l\'orientation vers une procédure d\'appel\n- La saisine du service d\'aide au recouvrement des victimes d\'infractions (SARVI)',
    },
    {
      nom: 'assises appel',
      details: 'Ces honoraires couvrent les diligences énumérées ci-après :\n- Les rendez-vous, consultations et recherches réalisées en vue de l\'orientation de la procédure et de la préparation de la défense des militaires\n- L\'étude de toute pièce utile à la procédure communiquées par les clients ainsi que par le parquet\n- L\'assistance à l\'expertise médicale et aux réunions subséquentes\n- La rédaction de dire à expert\n- La rédaction de conclusions\n- La préparation du dossier de plaidoirie\n- La présence lors de l\'audience sur le fond et les éventuelles audiences de renvoi\n- La présence lors du délibéré\n- Le conseil en vue de l\'acceptation de la décision sur le fond ou l\'orientation vers une procédure de cassation\n- La saisine du service d\'aide au recouvrement des victimes d\'infractions (SARVI)',
    },
    {
      nom: 'assistance à reconstitution',
      details: 'Ces honoraires couvrent les diligences effectuées au titre de l\'assistance lors de la reconstitution.',
    },
    {
      nom: 'enquête',
      details: 'Ces honoraires couvrent les diligences effectuées au titre de l\'assistance lors de la phase d\'enquête.',
    }
  ]

  console.log(`📋 ${diligencesData.length} diligences à insérer...`)

  // Supprimer les diligences existantes
  await prisma.diligence.deleteMany({})
  console.log('🗑️  Diligences existantes supprimées')

  // Insérer les nouvelles diligences
  for (const diligence of diligencesData) {
    try {
      await prisma.diligence.create({
        data: {
          ...diligence,
          active: true
        }
      })
    } catch (error) {
      console.error(`❌ Erreur lors de l'insertion de la diligence: ${diligence.nom}`, error.message)
    }
  }

  const diligenceCount = await prisma.diligence.count()
  console.log(`✅ ${diligenceCount} diligences insérées avec succès!`)

  // Seed Grades data
  console.log('🌱 Starting Grades seeding...')

  const gradesData = [
    { ordre: 1, gradeComplet: 'Général', gradeAbrege: 'GEN' },
    { ordre: 2, gradeComplet: 'Colonel', gradeAbrege: 'COL' },
    { ordre: 3, gradeComplet: 'Lieutenant-colonel', gradeAbrege: 'LCL' },
    { ordre: 4, gradeComplet: "Chef d'escadron", gradeAbrege: 'CEN' },
    { ordre: 5, gradeComplet: 'Commandant', gradeAbrege: 'CDT' },
    { ordre: 6, gradeComplet: 'Capitaine', gradeAbrege: 'CNE' },
    { ordre: 7, gradeComplet: 'Lieutenant', gradeAbrege: 'LTN' },
    { ordre: 8, gradeComplet: 'Sous-lieutenant', gradeAbrege: 'SLT' },
    { ordre: 9, gradeComplet: 'Aspirant', gradeAbrege: 'ASP' },
    { ordre: 10, gradeComplet: 'Major', gradeAbrege: 'MAJ' },
    { ordre: 11, gradeComplet: 'Adjudant-chef', gradeAbrege: 'ADC' },
    { ordre: 12, gradeComplet: 'Adjudant', gradeAbrege: 'ADJ' },
    { ordre: 13, gradeComplet: 'Maréchal des logis-chef', gradeAbrege: 'MDC' },
    { ordre: 14, gradeComplet: 'Gendarme', gradeAbrege: 'GND' },
    { ordre: 15, gradeComplet: 'Élève gendarme', gradeAbrege: 'ELG' },
    { ordre: 16, gradeComplet: 'Maréchal des logis', gradeAbrege: 'MDL' },
    { ordre: 17, gradeComplet: 'Brigadier-chef', gradeAbrege: 'BRC' },
    { ordre: 18, gradeComplet: 'Brigadier', gradeAbrege: 'BRI' },
    { ordre: 19, gradeComplet: 'Gendarme adjoint volontaire', gradeAbrege: 'GAV' },
    { ordre: 20, gradeComplet: 'Gendarme adjoint de 2ème classe', gradeAbrege: 'GA2' },
    { ordre: 21, gradeComplet: 'Madame', gradeAbrege: 'Mme' },
    { ordre: 22, gradeComplet: 'Monsieur', gradeAbrege: 'M' }
  ]

  console.log(`🎖️  ${gradesData.length} grades à insérer...`)

  // Supprimer les grades existants
  await prisma.grade.deleteMany({})
  console.log('🗑️  Grades existants supprimés')

  // Insérer les nouveaux grades
  for (const grade of gradesData) {
    try {
      await prisma.grade.create({
        data: grade
      })
    } catch (error) {
      console.error(`❌ Erreur lors de l'insertion du grade: ${grade.gradeComplet}`, error.message)
    }
  }

  const gradeCount = await prisma.grade.count()
  console.log(`✅ ${gradeCount} grades insérés avec succès!`)

  console.log('🎉 Database seeding completed!')
  console.log('')
  console.log('Login credentials:')
  console.log('Admin - identifiant: admin, password: admin123')
  console.log('Test user - identifiant: test, password: test123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })