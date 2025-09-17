const path = require('path');
const fs = require('fs').promises;
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Fonction pour convertir un nombre en lettres (français)
const convertirNombreEnLettres = (nombre) => {
  if (nombre === 0) return 'zéro';

  const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const dizaines = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];

  const convertirCentaines = (n) => {
    if (n === 0) return '';

    let result = '';
    const centaine = Math.floor(n / 100);
    const reste = n % 100;

    if (centaine > 0) {
      if (centaine === 1) {
        result += 'cent';
      } else {
        result += unites[centaine] + ' cent';
      }
      if (centaine > 1 && reste === 0) result += 's';
    }

    if (reste > 0) {
      if (centaine > 0) result += ' ';

      if (reste < 10) {
        result += unites[reste];
      } else if (reste < 20) {
        result += teens[reste - 10];
      } else {
        const diz = Math.floor(reste / 10);
        const unit = reste % 10;

        if (diz === 7 || diz === 9) {
          if (diz === 7) {
            result += 'soixante';
            if (unit === 0) {
              result += '-dix';
            } else {
              result += '-' + teens[unit];
            }
          } else { // diz === 9
            result += 'quatre-vingt';
            if (unit === 0) {
              result += '-dix';
            } else {
              result += '-' + teens[unit];
            }
          }
        } else {
          result += dizaines[diz];
          if (diz === 8 && unit === 0) {
            result += 's';
          }
          if (unit > 0) {
            if (unit === 1 && (diz === 2 || diz === 3 || diz === 4 || diz === 5 || diz === 6)) {
              result += ' et un';
            } else {
              result += '-' + unites[unit];
            }
          }
        }
      }
    }

    return result;
  };

  if (nombre < 1000) {
    return convertirCentaines(nombre);
  } else if (nombre < 1000000) {
    const milliers = Math.floor(nombre / 1000);
    const reste = nombre % 1000;
    let result = '';

    if (milliers === 1) {
      result = 'mille';
    } else {
      result = convertirCentaines(milliers) + ' mille';
    }

    if (reste > 0) {
      result += ' ' + convertirCentaines(reste);
    }

    return result;
  } else if (nombre < 1000000000) {
    const millions = Math.floor(nombre / 1000000);
    const reste = nombre % 1000000;
    let result = '';

    if (millions === 1) {
      result = 'un million';
    } else {
      result = convertirCentaines(millions) + ' millions';
    }

    if (reste > 0) {
      if (reste < 1000) {
        result += ' ' + convertirCentaines(reste);
      } else {
        const milliers = Math.floor(reste / 1000);
        const centaines = reste % 1000;
        if (milliers === 1) {
          result += ' mille';
        } else {
          result += ' ' + convertirCentaines(milliers) + ' mille';
        }
        if (centaines > 0) {
          result += ' ' + convertirCentaines(centaines);
        }
      }
    }

    return result;
  }

  return nombre.toString(); // Fallback pour les très grands nombres
};

// Fonction pour obtenir le complément de facturation
const getComplementFacturation = (typeFacturation) => {
  if (!typeFacturation || typeFacturation === 'FORFAITAIRE') {
    return ''; // Pas de texte supplémentaire pour le forfaitaire
  }

  switch (typeFacturation) {
    case 'DEMI_JOURNEE':
      return ' par demi-journée d\'assistance';
    case 'ASSISES':
      return ', montant décomposé ainsi :\n - 1 000 € [mille euros] hors taxes par militaire pour la préparation du dossier devant la cour d\'assises\n - 500 € [cinq cents euros] hors taxes par demi-journée de présence devant la cour d\'assises, quel que soit le nombre de militaires concernés';
    default:
      return '';
  }
}

// Fonction pour formater victimeOuMisEnCause
const getVictimeMecLabel = (type) => {
  switch (type) {
    case 'VICTIME':
      return 'victime'
    case 'MIS_EN_CAUSE':
      return 'mis en cause'
    default:
      return type?.toLowerCase() || ''
  }
}

// Fonction pour obtenir le chemin du template
const getTemplatePath = async (templateType) => {
  const TEMPLATES_DIR = path.join(__dirname, '../../uploads/templates');
  const DEFAULT_TEMPLATES_DIR = path.join(__dirname, '../../templates/default');
  const TEMPLATE_TYPES = {
    reglement: 'reglement_template.odt',
    avenant: 'avenant_template.odt',
    convention: 'convention_template.odt',
    decision: 'decision_template.odt'
  };

  const activeVersion = await prisma.templateVersion.findFirst({
    where: {
      templateType,
      isActive: true
    }
  });

  if (activeVersion) {
    const uploadedTemplatePath = path.join(TEMPLATES_DIR, templateType, activeVersion.filename);
    try {
      // Vérifier que le fichier uploadé existe réellement
      await fs.access(uploadedTemplatePath);
      return uploadedTemplatePath;
    } catch (error) {
      console.warn(`Template uploadé non trouvé: ${uploadedTemplatePath}, fallback vers template par défaut`);
      // Désactiver cette version en base car le fichier n'existe plus
      await prisma.templateVersion.update({
        where: { id: activeVersion.id },
        data: { isActive: false }
      });
    }
  }

  return path.join(DEFAULT_TEMPLATES_DIR, TEMPLATE_TYPES[templateType]);
};

module.exports = {
  convertirNombreEnLettres,
  getComplementFacturation,
  getVictimeMecLabel,
  getTemplatePath
};