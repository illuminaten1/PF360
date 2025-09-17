/**
 * Utilitaires pour la gestion des dates dans les statistiques
 */

/**
 * Obtenir le numéro de semaine ISO et les dates de début/fin
 * @param {Date} date - La date pour laquelle calculer la semaine ISO
 * @returns {Object} Objet contenant weekNum, startDate, endDate, isoYear
 */
const getISOWeekWithDates = (date) => {
  const target = new Date(date);

  // Trouver le jeudi de cette semaine (ISO week date)
  const dayOfWeek = target.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const thursday = new Date(target);
  thursday.setDate(target.getDate() - dayOfWeek + (dayOfWeek === 0 ? -3 : 4));

  // L'année ISO est l'année du jeudi de cette semaine
  const isoYear = thursday.getFullYear();

  // Trouver le premier jeudi de l'année ISO
  const jan4 = new Date(isoYear, 0, 4); // 4 janvier est toujours dans la semaine 1
  const jan4DayOfWeek = jan4.getDay();
  const firstThursday = new Date(jan4);
  firstThursday.setDate(jan4.getDate() - jan4DayOfWeek + (jan4DayOfWeek === 0 ? -3 : 4));

  // Calculer le numéro de semaine
  const weekNum = Math.floor((thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

  // Calculer les dates de début (lundi) et fin (dimanche) de la semaine
  const mondayOfWeek = new Date(target);
  mondayOfWeek.setDate(target.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));

  const sundayOfWeek = new Date(mondayOfWeek);
  sundayOfWeek.setDate(mondayOfWeek.getDate() + 6);

  return {
    weekNum,
    startDate: mondayOfWeek,
    endDate: sundayOfWeek,
    isoYear
  };
};

/**
 * Générer une clé de semaine au format "YYYY-SS"
 * @param {Date} date - La date pour laquelle générer la clé
 * @returns {string} Clé de semaine au format "2024-01"
 */
const getWeekKey = (date) => {
  const weekInfo = getISOWeekWithDates(date);
  return `${weekInfo.isoYear}-${weekInfo.weekNum.toString().padStart(2, '0')}`;
};

/**
 * Obtenir les dates de début et fin d'année
 * @param {number} year - L'année
 * @returns {Object} Objet contenant startOfYear et endOfYear
 */
const getYearRange = (year) => {
  return {
    startOfYear: new Date(year, 0, 1),
    endOfYear: new Date(year + 1, 0, 1)
  };
};

/**
 * Obtenir les dates de début et fin de mois
 * @param {number} year - L'année
 * @param {number} month - Le mois (0-11)
 * @returns {Object} Objet contenant startOfMonth et endOfMonth
 */
const getMonthRange = (year, month) => {
  return {
    startOfMonth: new Date(year, month, 1),
    endOfMonth: new Date(year, month + 1, 1)
  };
};

module.exports = {
  getISOWeekWithDates,
  getWeekKey,
  getYearRange,
  getMonthRange
};