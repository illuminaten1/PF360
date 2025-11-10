import dayjs from 'dayjs'
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'

export const getTypeColor = (type: string) => {
  return type === 'VICTIME' ? 'bg-sky-100 text-sky-800' : 'bg-orange-100 text-orange-800'
}

export const getTypeLabel = (type: string) => {
  return type.replace(/_/g, ' ')
}

export const getDecisionTypeLabel = (type: string) => {
  switch (type) {
    case 'AJ': return 'Aide Juridique'
    case 'AJE': return 'Aide Juridique Évolutive'
    case 'PJ': return 'Protection Juridictionnelle'
    case 'REJET': return 'Rejet'
    // Support des anciens types pour compatibilité
    case 'OCTROI': return 'Aide Juridique'
    case 'OCTROI_PARTIEL': return 'Aide Juridique Partielle'
    default: return type
  }
}

export const getVictimeMecBadge = (type: string) => {
  switch (type) {
    case 'VICTIME':
      return 'bg-sky-100 text-sky-800'
    case 'MIS_EN_CAUSE':
      return 'bg-amber-100 text-amber-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export const getVictimeMecLabel = (type: string) => {
  switch (type) {
    case 'VICTIME':
      return 'Victime'
    case 'MIS_EN_CAUSE':
      return 'Mis en cause'
    default:
      return type
  }
}

export const getAudienceUrgency = (dateAudience?: string) => {
  if (!dateAudience) return { type: 'none', style: 'bg-gray-100 text-gray-800', icon: null }

  const today = dayjs()
  const audienceDate = dayjs(dateAudience)
  const daysDiff = audienceDate.diff(today, 'day')

  if (daysDiff < 0) {
    return {
      type: 'passed',
      style: 'bg-gray-100 text-gray-800',
      icon: XCircleIcon
    }
  } else if (daysDiff < 7) {
    return {
      type: 'urgent',
      style: 'bg-red-100 text-red-800',
      icon: ExclamationTriangleIcon
    }
  } else if (daysDiff < 14) {
    return {
      type: 'soon',
      style: 'bg-orange-100 text-orange-800',
      icon: ClockIcon
    }
  } else {
    return {
      type: 'normal',
      style: 'bg-green-100 text-green-800',
      icon: CheckCircleIcon
    }
  }
}
