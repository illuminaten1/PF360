/**
 * Utilitaires pour les calculs et agrégations dans les statistiques
 */

/**
 * Calculer la somme d'une propriété dans un tableau d'objets
 * @param {Array} array - Le tableau d'objets
 * @param {string} property - Le nom de la propriété à sommer
 * @returns {number} La somme des valeurs
 */
const sumByProperty = (array, property) => {
  return array.reduce((sum, item) => sum + (item[property] || 0), 0);
};

/**
 * Calculer la moyenne d'une propriété dans un tableau d'objets
 * @param {Array} array - Le tableau d'objets
 * @param {string} property - Le nom de la propriété
 * @returns {number} La moyenne des valeurs
 */
const averageByProperty = (array, property) => {
  if (array.length === 0) return 0;
  return sumByProperty(array, property) / array.length;
};

/**
 * Calculer la somme de plusieurs propriétés d'un objet
 * @param {Array} array - Le tableau d'objets
 * @param {Array<string>} properties - Les propriétés à sommer
 * @returns {Object} Objet avec les totaux de chaque propriété
 */
const sumMultipleProperties = (array, properties) => {
  const result = {};
  properties.forEach(prop => {
    result[prop] = sumByProperty(array, prop);
  });
  return result;
};

/**
 * Calculer la somme totale des montants (gère différents formats)
 * @param {Array} array - Le tableau d'objets
 * @returns {number} Le montant total
 */
const calculateTotalAmount = (array) => {
  return array.reduce((sum, item) => {
    const montant = item.montant || item.montantHT || item.montantTTC || item.nombre || 0;
    return sum + montant;
  }, 0);
};

/**
 * Calculer les totaux par groupes
 * @param {Array} array - Le tableau d'objets
 * @param {string} groupProperty - La propriété de regroupement
 * @param {string} valueProperty - La propriété à sommer
 * @returns {Object} Objet avec les totaux par groupe
 */
const groupAndSum = (array, groupProperty, valueProperty) => {
  return array.reduce((groups, item) => {
    const group = item[groupProperty];
    if (!groups[group]) {
      groups[group] = 0;
    }
    groups[group] += item[valueProperty] || 0;
    return groups;
  }, {});
};

/**
 * Calculer le nombre total d'éléments avec extraInfo
 * @param {Array} statistics - Le tableau de statistiques
 * @returns {Object} Objet avec le nombre total et le montant total
 */
const calculateTotalsWithExtraInfo = (statistics) => {
  const nombreTotal = statistics.reduce((sum, stat) => {
    return sum + (stat.extraInfo?.nombrePaiements || stat.extraInfo?.nombre || 0);
  }, 0);

  const montantTotal = statistics.reduce((sum, stat) => {
    return sum + (stat.nombre || stat.montant || 0);
  }, 0);

  return { nombreTotal, montantTotal };
};

module.exports = {
  sumByProperty,
  averageByProperty,
  sumMultipleProperties,
  calculateTotalAmount,
  groupAndSum,
  calculateTotalsWithExtraInfo
};