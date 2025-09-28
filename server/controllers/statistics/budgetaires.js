const { PrismaClient } = require('@prisma/client');
const { getISOWeekWithDates, getWeekKey, getYearRange } = require('../../utils/statistics/dateUtils');
const { sumByProperty, calculateTotalsWithExtraInfo } = require('../../utils/statistics/calculUtils');

const prisma = new PrismaClient();

const getStatistiquesBudgetaires = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Dates de début et fin d'année
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    // 1. Nombre de dossiers pour l'année sélectionnée
    const nombreDossiersAnnee = await prisma.dossier.count({
      where: {
        createdAt: {
          gte: startOfYear,
          lt: endOfYear
        }
      }
    });

    // 2. Nombre de dossiers toutes années
    const nombreDossiersToutesAnnees = await prisma.dossier.count();

    // 3. Conventions d'honoraires créées pour l'année sélectionnée
    const conventionsCreees = await prisma.convention.count({
      where: {
        type: 'CONVENTION',
        dateCreation: {
          gte: startOfYear,
          lt: endOfYear
        }
      }
    });

    // 4. Conventions d'honoraires signées pour l'année sélectionnée (par date de signature)
    const conventionsSignees = await prisma.convention.count({
      where: {
        type: 'CONVENTION',
        dateRetourSigne: {
          gte: startOfYear,
          lt: endOfYear
        }
      }
    });

    // 5. Avenants créés pour l'année sélectionnée
    const avenantsCreees = await prisma.convention.count({
      where: {
        type: 'AVENANT',
        dateCreation: {
          gte: startOfYear,
          lt: endOfYear
        }
      }
    });

    // 6. Avenants signés pour l'année sélectionnée (par date de signature)
    const avenantsSignees = await prisma.convention.count({
      where: {
        type: 'AVENANT',
        dateRetourSigne: {
          gte: startOfYear,
          lt: endOfYear
        }
      }
    });

    // 7. Récupérer le budget annuel pour calculer les pourcentages
    const budgetAnnuel = await prisma.budgetAnnuel.findUnique({
      where: {
        annee: year
      }
    });

    const budgetTotal = budgetAnnuel ? budgetAnnuel.budgetBase + budgetAnnuel.abondements : 0;

    // 8. Montant moyen gagé par convention (conventions créées l'année sélectionnée)
    const conventionsAvecMontant = await prisma.convention.findMany({
      where: {
        type: 'CONVENTION',
        dateCreation: {
          gte: startOfYear,
          lt: endOfYear
        }
      },
      select: {
        montantHT: true
      }
    });

    // Filtrer les conventions avec montantHT non nul
    const conventionsAvecMontantValide = conventionsAvecMontant.filter(conv => conv.montantHT !== null && conv.montantHT !== undefined);
    const montantMoyenConvention = conventionsAvecMontantValide.length > 0
      ? conventionsAvecMontantValide.reduce((sum, conv) => sum + conv.montantHT, 0) / conventionsAvecMontantValide.length
      : 0;

    // 9. Montant moyen gagé par avenant (avenants créés l'année sélectionnée)
    const avenantsAvecMontant = await prisma.convention.findMany({
      where: {
        type: 'AVENANT',
        dateCreation: {
          gte: startOfYear,
          lt: endOfYear
        }
      },
      select: {
        montantHT: true
      }
    });

    // Filtrer les avenants avec montantHT non nul
    const avenantsAvecMontantValide = avenantsAvecMontant.filter(av => av.montantHT !== null && av.montantHT !== undefined);
    const montantMoyenAvenant = avenantsAvecMontantValide.length > 0
      ? avenantsAvecMontantValide.reduce((sum, av) => sum + av.montantHT, 0) / avenantsAvecMontantValide.length
      : 0;

    // 10. Montant HT gagé (signés) - conventions et avenants signés par l'avocat l'année sélectionnée
    const conventionsEtAvenantsSignes = await prisma.convention.findMany({
      where: {
        dateRetourSigne: {
          gte: startOfYear,
          lt: endOfYear
        }
      },
      select: {
        montantHT: true
      }
    });

    // Filtrer et calculer le montant HT signé
    const montantHTSigne = conventionsEtAvenantsSignes
      .filter(conv => conv.montantHT !== null && conv.montantHT !== undefined)
      .reduce((sum, conv) => sum + conv.montantHT, 0);
    const pourcentageBudgetSigne = budgetTotal > 0 ? (montantHTSigne / budgetTotal) * 100 : 0;

    // 11. Montant HT gagé total - conventions et avenants créés l'année sélectionnée
    const conventionsEtAvenantsCreees = await prisma.convention.findMany({
      where: {
        dateCreation: {
          gte: startOfYear,
          lt: endOfYear
        }
      },
      select: {
        montantHT: true
      }
    });

    // Filtrer et calculer le montant HT total
    const montantHTTotal = conventionsEtAvenantsCreees
      .filter(conv => conv.montantHT !== null && conv.montantHT !== undefined)
      .reduce((sum, conv) => sum + conv.montantHT, 0);
    const pourcentageBudgetTotal = budgetTotal > 0 ? (montantHTTotal / budgetTotal) * 100 : 0;

    const statistiques = [
      {
        libelle: "Dossiers toutes années",
        nombre: nombreDossiersToutesAnnees
      },
      {
        libelle: `Dossiers ${year}`,
        nombre: nombreDossiersAnnee
      },
      {
        libelle: "Conventions créées",
        nombre: conventionsCreees
      },
      {
        libelle: "Convention signées (avocat)",
        nombre: conventionsSignees
      },
      {
        libelle: "Avenants créés",
        nombre: avenantsCreees
      },
      {
        libelle: "Avenants signés (avocat)",
        nombre: avenantsSignees
      },
      {
        libelle: "Montant moyen gagé par convention",
        nombre: Math.round(montantMoyenConvention),
        type: "currency"
      },
      {
        libelle: "Montant moyen gagé par avenant",
        nombre: Math.round(montantMoyenAvenant),
        type: "currency"
      },
      {
        libelle: "Montant HT gagé (signés)",
        nombre: Math.round(montantHTSigne),
        pourcentage: Math.round(pourcentageBudgetSigne * 100) / 100,
        type: "currency_with_percentage",
        showPrevisions: true,
        prevision10: Math.round(montantHTSigne * 1.1),
        prevision20: Math.round(montantHTSigne * 1.1 * 1.2),
        pourcentagePrevision10: budgetTotal > 0 ? Math.round((montantHTSigne * 1.1 / budgetTotal) * 100 * 100) / 100 : 0,
        pourcentagePrevision20: budgetTotal > 0 ? Math.round((montantHTSigne * 1.1 * 1.2 / budgetTotal) * 100 * 100) / 100 : 0
      },
      {
        libelle: "Montant HT gagé total",
        nombre: Math.round(montantHTTotal),
        pourcentage: Math.round(pourcentageBudgetTotal * 100) / 100,
        type: "currency_with_percentage",
        bold: true,
        showPrevisions: true,
        prevision10: Math.round(montantHTTotal * 1.1),
        prevision20: Math.round(montantHTTotal * 1.1 * 1.2),
        pourcentagePrevision10: budgetTotal > 0 ? Math.round((montantHTTotal * 1.1 / budgetTotal) * 100 * 100) / 100 : 0,
        pourcentagePrevision20: budgetTotal > 0 ? Math.round((montantHTTotal * 1.1 * 1.2 / budgetTotal) * 100 * 100) / 100 : 0
      }
    ];

    res.json({ statistiques, budgetTotal });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques budgétaires:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des statistiques budgétaires',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getEngagementServicePayeur = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Dates de début et fin d'année
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    // Récupérer le budget annuel pour calculer les pourcentages
    const budgetAnnuel = await prisma.budgetAnnuel.findUnique({
      where: {
        annee: year
      }
    });

    const budgetTotal = budgetAnnuel ? budgetAnnuel.budgetBase + budgetAnnuel.abondements : 0;

    // Récupérer les engagements par SGAMI (conventions créées l'année sélectionnée)
    const engagementsSGAMI = await prisma.sgami.findMany({
      select: {
        id: true,
        nom: true,
        dossiers: {
          select: {
            conventions: {
              where: {
                dateCreation: {
                  gte: startOfYear,
                  lt: endOfYear
                }
              },
              select: {
                montantHT: true
              }
            }
          }
        }
      }
    });

    // Calculer les montants par SGAMI
    const engagements = engagementsSGAMI.map(sgami => {
      // Collecter tous les montants des conventions de tous les dossiers de ce SGAMI
      const montants = [];
      sgami.dossiers.forEach(dossier => {
        dossier.conventions.forEach(convention => {
          if (convention.montantHT !== null && convention.montantHT !== undefined) {
            montants.push(convention.montantHT);
          }
        });
      });

      const montantTotal = montants.reduce((sum, montant) => sum + montant, 0);
      const pourcentage = budgetTotal > 0 ? (montantTotal / budgetTotal) * 100 : 0;
      const prevision10 = montantTotal * 1.1;
      const prevision20 = montantTotal * 1.1 * 1.2;
      const pourcentagePrevision10 = budgetTotal > 0 ? (prevision10 / budgetTotal) * 100 : 0;
      const pourcentagePrevision20 = budgetTotal > 0 ? (prevision20 / budgetTotal) * 100 : 0;

      return {
        sgami: sgami.nom,
        montantTotal: Math.round(montantTotal),
        pourcentage: Math.round(pourcentage * 100) / 100,
        prevision10: Math.round(prevision10),
        prevision20: Math.round(prevision20),
        pourcentagePrevision10: Math.round(pourcentagePrevision10 * 100) / 100,
        pourcentagePrevision20: Math.round(pourcentagePrevision20 * 100) / 100
      };
    })
    .filter(engagement => engagement.montantTotal > 0) // Ne garder que les SGAMI avec des engagements
    .sort((a, b) => b.montantTotal - a.montantTotal); // Trier par montant décroissant


    res.json({ engagements, budgetTotal });

  } catch (error) {
    console.error('Erreur lors de la récupération des engagements par service payeur:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des engagements par service payeur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getEngagementDepensesMensuelles = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Dates de début et fin d'année
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    // Récupérer le budget annuel pour calculer les pourcentages
    const budgetAnnuel = await prisma.budgetAnnuel.findUnique({
      where: {
        annee: year
      }
    });

    const budgetTotal = budgetAnnuel ? budgetAnnuel.budgetBase + budgetAnnuel.abondements : 0;

    // Noms des mois
    const noms_mois = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    // Initialiser les données mensuelles
    const engagementsMensuels = [];
    let cumuleHT = 0;
    let cumuleTTC = 0;

    // Variables pour les totaux
    let totalMontantGageHT = 0;
    let totalCumuleHT = 0;
    let totalPrevision10 = 0;
    let totalPrevision20 = 0;
    let totalCumuleTTC = 0;

    for (let mois = 0; mois < 12; mois++) {
      const startOfMonth = new Date(year, mois, 1);
      const endOfMonth = new Date(year, mois + 1, 1);

      // Récupérer les conventions créées ce mois
      const conventionsMois = await prisma.convention.findMany({
        where: {
          dateCreation: {
            gte: startOfMonth,
            lt: endOfMonth
          }
        },
        select: {
          montantHT: true
        }
      });

      // Calculer le montant gagé HT pour ce mois
      const montantGageHT = conventionsMois
        .filter(conv => conv.montantHT !== null && conv.montantHT !== undefined)
        .reduce((sum, conv) => sum + conv.montantHT, 0);

      // Mettre à jour les cumuls
      cumuleHT += montantGageHT;

      // Calculer les prévisionnels basés sur le montant gagé HT du mois
      const prevision10 = montantGageHT * 1.1;
      const prevision20 = montantGageHT * 1.2;

      // Calculer le montant TTC du mois (on peut utiliser une approximation de 20% de TVA)
      const montantTTCMois = montantGageHT * 1.2;
      cumuleTTC += montantTTCMois;

      // Calculer les pourcentages
      const pourcentageMontantGage = budgetTotal > 0 ? (montantGageHT / budgetTotal) * 100 : 0;
      const pourcentageCumuleHT = budgetTotal > 0 ? (cumuleHT / budgetTotal) * 100 : 0;
      const pourcentagePrevision10 = budgetTotal > 0 ? (prevision10 / budgetTotal) * 100 : 0;
      const pourcentagePrevision20 = budgetTotal > 0 ? (prevision20 / budgetTotal) * 100 : 0;
      const pourcentageCumuleTTC = budgetTotal > 0 ? (cumuleTTC / budgetTotal) * 100 : 0;

      engagementsMensuels.push({
        mois: noms_mois[mois],
        montantGageHT: Math.round(montantGageHT),
        pourcentageMontantGage: Math.round(pourcentageMontantGage * 100) / 100,
        cumuleHT: Math.round(cumuleHT),
        pourcentageCumuleHT: Math.round(pourcentageCumuleHT * 100) / 100,
        prevision10: Math.round(prevision10),
        pourcentagePrevision10: Math.round(pourcentagePrevision10 * 100) / 100,
        prevision20: Math.round(prevision20),
        pourcentagePrevision20: Math.round(pourcentagePrevision20 * 100) / 100,
        cumuleTTC: Math.round(cumuleTTC),
        pourcentageCumuleTTC: Math.round(pourcentageCumuleTTC * 100) / 100
      });

      // Accumuler pour les totaux (on prend les valeurs du dernier mois pour les cumuls)
      totalMontantGageHT += montantGageHT;
      if (mois === 11) { // Dernier mois pour les cumuls
        totalCumuleHT = cumuleHT;
        totalPrevision10 = prevision10;
        totalPrevision20 = prevision20;
        totalCumuleTTC = cumuleTTC;
      }
    }

    // Calculer les pourcentages des totaux
    const pourcentageTotalMontantGage = budgetTotal > 0 ? (totalMontantGageHT / budgetTotal) * 100 : 0;
    const pourcentageTotalCumuleHT = budgetTotal > 0 ? (totalCumuleHT / budgetTotal) * 100 : 0;
    const pourcentageTotalPrevision10 = budgetTotal > 0 ? (totalPrevision10 / budgetTotal) * 100 : 0;
    const pourcentageTotalPrevision20 = budgetTotal > 0 ? (totalPrevision20 / budgetTotal) * 100 : 0;
    const pourcentageTotalCumuleTTC = budgetTotal > 0 ? (totalCumuleTTC / budgetTotal) * 100 : 0;

    // Ligne total
    const total = {
      mois: 'TOTAL',
      montantGageHT: Math.round(totalMontantGageHT),
      pourcentageMontantGage: Math.round(pourcentageTotalMontantGage * 100) / 100,
      cumuleHT: Math.round(totalCumuleHT),
      pourcentageCumuleHT: Math.round(pourcentageTotalCumuleHT * 100) / 100,
      prevision10: Math.round(totalPrevision10),
      pourcentagePrevision10: Math.round(pourcentageTotalPrevision10 * 100) / 100,
      prevision20: Math.round(totalPrevision20),
      pourcentagePrevision20: Math.round(pourcentageTotalPrevision20 * 100) / 100,
      cumuleTTC: Math.round(totalCumuleTTC),
      pourcentageCumuleTTC: Math.round(pourcentageTotalCumuleTTC * 100) / 100
    };

    res.json({
      engagementsMensuels,
      total,
      budgetTotal,
      annee: year
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des engagements de dépenses mensuelles:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des engagements de dépenses mensuelles',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getDepensesOrdonnees = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Dates de début et fin d'année
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    // Récupérer le budget annuel pour calculer les pourcentages
    const budgetAnnuel = await prisma.budgetAnnuel.findUnique({
      where: {
        annee: year
      }
    });

    const budgetTotal = budgetAnnuel ? budgetAnnuel.budgetBase + budgetAnnuel.abondements : 0;

    // 1. Nombre de paiements émis pour l'année sélectionnée
    const nombrePaiementsEmis = await prisma.paiement.count({
      where: {
        createdAt: {
          gte: startOfYear,
          lt: endOfYear
        }
      }
    });

    // 2. Récupérer tous les paiements de l'année pour calculer les montants
    const paiementsDeLAnnee = await prisma.paiement.findMany({
      where: {
        createdAt: {
          gte: startOfYear,
          lt: endOfYear
        }
      },
      select: {
        montantHT: true,
        montantTTC: true
      }
    });

    // 3. Calculer les montants totaux
    const depenseTotaleHT = paiementsDeLAnnee
      .filter(p => p.montantHT !== null && p.montantHT !== undefined)
      .reduce((sum, p) => sum + p.montantHT, 0);

    const depenseTotaleTTC = paiementsDeLAnnee
      .filter(p => p.montantTTC !== null && p.montantTTC !== undefined)
      .reduce((sum, p) => sum + p.montantTTC, 0);

    // 4. Nombre de dossiers ayant au moins un paiement cette année
    const dossiersAvecPaiements = await prisma.dossier.count({
      where: {
        paiements: {
          some: {
            createdAt: {
              gte: startOfYear,
              lt: endOfYear
            }
          }
        }
      }
    });

    // 5. Calculer le montant moyen TTC par dossier ayant un paiement
    const montantMoyenTTCParDossier = dossiersAvecPaiements > 0 ? depenseTotaleTTC / dossiersAvecPaiements : 0;

    // 6. Calculer le montant moyen TTC par paiement
    const montantMoyenTTCParPaiement = nombrePaiementsEmis > 0 ? depenseTotaleTTC / nombrePaiementsEmis : 0;

    // Calcul des pourcentages par rapport au budget total
    const pourcentageDepenseHT = budgetTotal > 0 ? (depenseTotaleHT / budgetTotal) * 100 : 0;
    const pourcentageDepenseTTC = budgetTotal > 0 ? (depenseTotaleTTC / budgetTotal) * 100 : 0;

    const statistiques = [
      {
        libelle: "Nombre de paiements émis",
        nombre: nombrePaiementsEmis,
        type: "number"
      },
      {
        libelle: "Montant moyen TTC par paiement",
        nombre: Math.round(montantMoyenTTCParPaiement * 100) / 100,
        type: "currency"
      },
      {
        libelle: "Montant moyen TTC par dossier",
        nombre: Math.round(montantMoyenTTCParDossier * 100) / 100,
        type: "currency"
      },
      {
        libelle: "Dépense totale HT (indicatif)",
        nombre: Math.round(depenseTotaleHT * 100) / 100,
        pourcentage: Math.round(pourcentageDepenseHT * 100) / 100,
        type: "currency_with_percentage"
      },
      {
        libelle: "Dépense totale TTC",
        nombre: Math.round(depenseTotaleTTC * 100) / 100,
        pourcentage: Math.round(pourcentageDepenseTTC * 100) / 100,
        type: "currency_with_percentage",
        isTotal: true
      }
    ];

    res.json({ statistiques, budgetTotal });

  } catch (error) {
    console.error('Erreur lors de la récupération des dépenses ordonnées:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des dépenses ordonnées',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getDepensesOrdonneesParSgami = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Dates de début et fin d'année
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    // Récupérer le budget annuel pour calculer les pourcentages
    const budgetAnnuel = await prisma.budgetAnnuel.findUnique({
      where: {
        annee: year
      }
    });

    const budgetTotal = budgetAnnuel ? budgetAnnuel.budgetBase + budgetAnnuel.abondements : 0;

    // Récupérer tous les paiements de l'année avec leur SGAMI
    const paiementsParSgami = await prisma.sgami.findMany({
      select: {
        id: true,
        nom: true,
        paiements: {
          where: {
            createdAt: {
              gte: startOfYear,
              lt: endOfYear
            }
          },
          select: {
            montantTTC: true
          }
        }
      }
    });

    // Calculer les statistiques par SGAMI
    const statistiques = paiementsParSgami
      .map(sgami => {
        const paiements = sgami.paiements || [];
        const nombrePaiements = paiements.length;
        const montantTotal = paiements
          .filter(p => p.montantTTC !== null && p.montantTTC !== undefined)
          .reduce((sum, p) => sum + p.montantTTC, 0);
        const pourcentage = budgetTotal > 0 ? (montantTotal / budgetTotal) * 100 : 0;
        const montantMoyen = nombrePaiements > 0 ? montantTotal / nombrePaiements : 0;

        return {
          libelle: sgami.nom,
          nombre: Math.round(montantTotal * 100) / 100,
          pourcentage: Math.round(pourcentage * 100) / 100,
          type: "currency_with_percentage",
          extraInfo: {
            nombrePaiements,
            montantMoyen: Math.round(montantMoyen * 100) / 100
          }
        };
      })
      .filter(stat => stat.nombre > 0) // Ne garder que les SGAMI avec des paiements
      .sort((a, b) => b.nombre - a.nombre); // Trier par montant décroissant

    // Ajouter les totaux
    const { nombreTotal: nombreTotalPaiements, montantTotal: montantTotalGeneral } = calculateTotalsWithExtraInfo(statistiques);

    statistiques.push({
      libelle: "TOTAL",
      nombre: Math.round(montantTotalGeneral * 100) / 100,
      pourcentage: budgetTotal > 0 ? Math.round((montantTotalGeneral / budgetTotal) * 100 * 100) / 100 : 0,
      type: "currency_with_percentage",
      isTotal: true,
      extraInfo: {
        nombrePaiements: nombreTotalPaiements,
        montantMoyen: nombreTotalPaiements > 0 ? Math.round((montantTotalGeneral / nombreTotalPaiements) * 100) / 100 : 0
      }
    });

    res.json({ statistiques, budgetTotal });

  } catch (error) {
    console.error('Erreur lors de la récupération des dépenses ordonnées par SGAMI:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des dépenses ordonnées par SGAMI',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getDepensesOrdonneesParPce = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Dates de début et fin d'année
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    // Récupérer le budget annuel pour calculer les pourcentages
    const budgetAnnuel = await prisma.budgetAnnuel.findUnique({
      where: {
        annee: year
      }
    });

    const budgetTotal = budgetAnnuel ? budgetAnnuel.budgetBase + budgetAnnuel.abondements : 0;

    // Récupérer tous les paiements de l'année avec leur PCE
    const paiementsParPce = await prisma.pce.findMany({
      select: {
        id: true,
        pceDetaille: true,
        pceNumerique: true,
        paiements: {
          where: {
            createdAt: {
              gte: startOfYear,
              lt: endOfYear
            }
          },
          select: {
            montantTTC: true
          }
        }
      },
      orderBy: {
        ordre: 'asc'
      }
    });

    // Aussi récupérer les paiements sans PCE
    const paiementsSansPce = await prisma.paiement.count({
      where: {
        createdAt: {
          gte: startOfYear,
          lt: endOfYear
        },
        pceId: null
      }
    });

    const montantSansPce = await prisma.paiement.aggregate({
      where: {
        createdAt: {
          gte: startOfYear,
          lt: endOfYear
        },
        pceId: null
      },
      _sum: {
        montantTTC: true
      }
    });

    // Calculer les statistiques par PCE
    const statistiques = paiementsParPce
      .map(pce => {
        const paiements = pce.paiements || [];
        const nombrePaiements = paiements.length;
        const montantTotal = paiements
          .filter(p => p.montantTTC !== null && p.montantTTC !== undefined)
          .reduce((sum, p) => sum + p.montantTTC, 0);
        const pourcentage = budgetTotal > 0 ? (montantTotal / budgetTotal) * 100 : 0;
        const montantMoyen = nombrePaiements > 0 ? montantTotal / nombrePaiements : 0;

        return {
          libelle: `${pce.pceNumerique} - ${pce.pceDetaille}`,
          nombre: Math.round(montantTotal * 100) / 100,
          pourcentage: Math.round(pourcentage * 100) / 100,
          type: "currency_with_percentage",
          extraInfo: {
            nombrePaiements,
            montantMoyen: Math.round(montantMoyen * 100) / 100
          }
        };
      })
      .filter(stat => stat.nombre > 0); // Ne garder que les PCE avec des paiements

    // Ajouter les paiements sans PCE s'il y en a
    if (paiementsSansPce > 0 && montantSansPce._sum.montantTTC > 0) {
      const montantSansPceTotal = montantSansPce._sum.montantTTC || 0;
      const pourcentageSansPce = budgetTotal > 0 ? (montantSansPceTotal / budgetTotal) * 100 : 0;
      const montantMoyenSansPce = paiementsSansPce > 0 ? montantSansPceTotal / paiementsSansPce : 0;

      statistiques.push({
        libelle: "Sans PCE assigné",
        nombre: Math.round(montantSansPceTotal * 100) / 100,
        pourcentage: Math.round(pourcentageSansPce * 100) / 100,
        type: "currency_with_percentage",
        extraInfo: {
          nombrePaiements: paiementsSansPce,
          montantMoyen: Math.round(montantMoyenSansPce * 100) / 100
        }
      });
    }

    // Trier par montant décroissant
    statistiques.sort((a, b) => b.nombre - a.nombre);

    // Ajouter les totaux
    const { nombreTotal: nombreTotalPaiements, montantTotal: montantTotalGeneral } = calculateTotalsWithExtraInfo(statistiques);

    statistiques.push({
      libelle: "TOTAL",
      nombre: Math.round(montantTotalGeneral * 100) / 100,
      pourcentage: budgetTotal > 0 ? Math.round((montantTotalGeneral / budgetTotal) * 100 * 100) / 100 : 0,
      type: "currency_with_percentage",
      isTotal: true,
      extraInfo: {
        nombrePaiements: nombreTotalPaiements,
        montantMoyen: nombreTotalPaiements > 0 ? Math.round((montantTotalGeneral / nombreTotalPaiements) * 100) / 100 : 0
      }
    });

    res.json({ statistiques, budgetTotal });

  } catch (error) {
    console.error('Erreur lors de la récupération des dépenses ordonnées par PCE:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des dépenses ordonnées par PCE',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getDepensesOrdonneesParMois = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // Dates de début et fin d'année
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    // Récupérer le budget annuel pour calculer les pourcentages
    const budgetAnnuel = await prisma.budgetAnnuel.findUnique({
      where: {
        annee: year
      }
    });

    const budgetTotal = budgetAnnuel ? budgetAnnuel.budgetBase + budgetAnnuel.abondements : 0;

    // Grouper les données par mois
    const statsParMois = {};

    // Initialiser tous les mois de l'année avec des valeurs nulles
    for (let mois = 1; mois <= 12; mois++) {
      statsParMois[mois] = {
        mois: mois.toString().padStart(2, '0'),
        annee: year,
        montantTTCPaiements: 0,
        montantTTCDossiers: 0
      };
    }

    // 1. Récupérer les paiements émis chaque mois (montant TTC)
    const paiementsParMois = await prisma.paiement.findMany({
      where: {
        createdAt: {
          gte: startOfYear,
          lt: endOfYear
        }
      },
      select: {
        createdAt: true,
        montantTTC: true
      }
    });

    // Grouper les paiements par mois d'émission
    paiementsParMois.forEach(paiement => {
      const mois = paiement.createdAt.getMonth() + 1; // getMonth() retourne 0-11
      if (statsParMois[mois]) {
        statsParMois[mois].montantTTCPaiements += paiement.montantTTC || 0;
      }
    });

    // 2. Récupérer les paiements créés chaque mois (montant TTC des dossiers créés ce mois-ci)
    const paiementsTTCParMois = await prisma.paiement.findMany({
      where: {
        dossier: {
          createdAt: {
            gte: startOfYear,
            lt: endOfYear
          }
        }
      },
      select: {
        montantTTC: true,
        dossier: {
          select: {
            createdAt: true
          }
        }
      }
    });

    // Grouper les paiements par mois de création du dossier
    paiementsTTCParMois.forEach(paiement => {
      const mois = paiement.dossier.createdAt.getMonth() + 1;
      if (statsParMois[mois]) {
        statsParMois[mois].montantTTCDossiers += paiement.montantTTC || 0;
      }
    });

    // Convertir en array et calculer les pourcentages et cumuls
    let statistiques = Object.values(statsParMois);

    // Calculer les cumuls
    let cumulTTC = 0;

    statistiques = statistiques.map(stat => {
      cumulTTC += stat.montantTTCPaiements;

      return {
        ...stat,
        cumulTTC: cumulTTC,
        pourcentageCumulTTC: budgetTotal > 0 ? (cumulTTC / budgetTotal) * 100 : 0,
        pourcentageTTC: budgetTotal > 0 ? (stat.montantTTCPaiements / budgetTotal) * 100 : 0
      };
    });

    // Calculer les totaux
    const totalMontantTTC = sumByProperty(statistiques, 'montantTTCPaiements');

    // Ajouter la ligne de total
    statistiques.push({
      mois: 'Total',
      annee: year,
      montantTTCPaiements: totalMontantTTC,
      montantTTCDossiers: totalMontantTTC,
      cumulTTC: totalMontantTTC,
      pourcentageCumulTTC: budgetTotal > 0 ? (totalMontantTTC / budgetTotal) * 100 : 0,
      pourcentageTTC: budgetTotal > 0 ? (totalMontantTTC / budgetTotal) * 100 : 0,
      isTotal: true,
      bold: true
    });

    res.json({
      statistiques,
      budgetTotal
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des dépenses ordonnées par mois:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des dépenses ordonnées par mois'
    });
  }
};

module.exports = {
  getStatistiquesBudgetaires,
  getEngagementServicePayeur,
  getEngagementDepensesMensuelles,
  getDepensesOrdonnees,
  getDepensesOrdonneesParSgami,
  getDepensesOrdonneesParPce,
  getDepensesOrdonneesParMois
};