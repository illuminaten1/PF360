import React, { useState } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import '@/styles/calendar.css'
import { useQuery } from '@tanstack/react-query'
import api from '@/utils/api'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { EyeIcon, FolderIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import DemandeViewModal from '@/components/forms/DemandeViewModal'
import { Demande } from '@/types'

dayjs.locale('fr')

interface Audience {
  id: string
  numeroDS: string
  dateAudience: string
  nom: string
  prenom: string
  type: 'VICTIME' | 'MIS_EN_CAUSE'
  commune?: string
  qualificationInfraction?: string
  dossierId?: string
  dossier?: {
    numero: string
  }
}

interface CalendrierAudiencesProps {
  className?: string
}

const CalendrierAudiences: React.FC<CalendrierAudiencesProps> = ({ className = '' }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)
  const navigate = useNavigate()

  const { data: audiences = [], isLoading } = useQuery<Audience[]>({
    queryKey: ['my-audiences', currentDate.getMonth() + 1, currentDate.getFullYear()],
    queryFn: async () => {
      const response = await api.get(`/demandes/my-audiences?month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}`)
      return response.data
    }
  })

  const getAudiencesForDate = (date: Date) => {
    return audiences.filter(audience => 
      dayjs(audience.dateAudience).isSame(dayjs(date), 'day')
    )
  }

  const tileContent = ({ date }: { date: Date }) => {
    const dayAudiences = getAudiencesForDate(date)
    if (dayAudiences.length === 0) return null

    return (
      <div className="mt-1">
        <div className="flex justify-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        </div>
        <div className="text-xs text-center text-blue-600 font-medium">
          {dayAudiences.length}
        </div>
      </div>
    )
  }

  const tileClassName = ({ date }: { date: Date }) => {
    const dayAudiences = getAudiencesForDate(date)
    if (dayAudiences.length > 0) {
      return 'has-audiences'
    }
    return ''
  }

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Mes audiences</h3>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const selectedDateAudiences = getAudiencesForDate(currentDate)

  const handleViewDemande = async (audience: Audience) => {
    try {
      // Récupérer la demande complète pour affichage dans le modal
      const response = await api.get(`/demandes/${audience.id}`)
      setSelectedDemande(response.data)
      setIsViewModalOpen(true)
    } catch (error) {
      console.error('Erreur lors du chargement de la demande:', error)
    }
  }

  const handleDossierClick = (dossierId: string) => {
    navigate(`/dossiers/${dossierId}`)
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Mes audiences - {dayjs(currentDate).format('MMMM YYYY')}
      </h3>
      
      <div className="space-y-4">
        <div className="calendar-container">
          <Calendar
            value={currentDate}
            onChange={(value) => setCurrentDate(value as Date)}
            tileContent={tileContent}
            tileClassName={tileClassName}
            locale="fr-FR"
          />
        </div>

        {selectedDateAudiences.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-2">
              Audiences du {dayjs(currentDate).format('DD MMMM YYYY')}
            </h4>
            <div className="space-y-2">
              {selectedDateAudiences.map((audience) => (
                <div 
                  key={audience.id} 
                  className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-blue-900">
                          {audience.numeroDS}
                        </div>
                        {audience.dossier && (
                          <button
                            onClick={() => handleDossierClick(audience.dossierId!)}
                            className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200 transition-colors flex items-center gap-1"
                            title="Voir le dossier"
                          >
                            <FolderIcon className="h-3 w-3" />
                            Dossier {audience.dossier.numero}
                          </button>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {audience.prenom} {audience.nom}
                        {audience.commune && ` - ${audience.commune}`}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {audience.type === 'VICTIME' ? 'Victime' : 'Mis en cause'}
                        {audience.qualificationInfraction && ` • ${audience.qualificationInfraction}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-blue-600 font-medium">
                        {dayjs(audience.dateAudience).format('HH:mm')}
                      </div>
                      <button
                        onClick={() => handleViewDemande(audience)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Visualiser la demande"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Jour avec audience(s)</span>
          </div>
        </div>
      </div>

      <DemandeViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setSelectedDemande(null)
        }}
        demande={selectedDemande}
      />
    </div>
  )
}

export default CalendrierAudiences