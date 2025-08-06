import React from 'react'
import { Demande } from '@/types'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  FolderIcon
} from '@heroicons/react/24/outline'

dayjs.locale('fr')

interface DemandesTableProps {
  demandes: Demande[]
  onView: (demande: Demande) => void
  onEdit: (demande: Demande) => void
  onDelete: (demande: Demande) => void
  onAddToDossier: (demande: Demande) => void
  loading?: boolean
}

const DemandesTable: React.FC<DemandesTableProps> = ({
  demandes,
  onView,
  onEdit,
  onDelete,
  onAddToDossier,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded-t-lg mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 mb-2 mx-4"></div>
          ))}
        </div>
      </div>
    )
  }

  if (demandes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m5-9H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande</h3>
        <p className="text-gray-600">Commencez par créer votre première demande.</p>
      </div>
    )
  }

  const getTypeColor = (type: string) => {
    return type === 'VICTIME' ? 'bg-sky-100 text-sky-800' : 'bg-orange-100 text-orange-800'
  }

  const getPositionColor = (position?: string) => {
    if (!position) return 'bg-gray-100 text-gray-800'
    return position === 'EN_SERVICE' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table">
          <thead className="bg-gray-50">
            <tr>
              <th>Numéro DS</th>
              <th>Date réception</th>
              <th>Type</th>
              <th>Militaire</th>
              <th>Unité</th>
              <th>Position</th>
              <th>Faits</th>
              <th>Dossier</th>
              <th>Date audience</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {demandes.map((demande) => (
              <tr key={demande.id}>
                <td>
                  <div 
                    className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                    onClick={() => onView(demande)}
                  >
                    {demande.numeroDS}
                  </div>
                  {demande.nigend && (
                    <div className="text-xs text-gray-500">
                      NIGEND: {demande.nigend}
                    </div>
                  )}
                </td>
                <td>
                  <div className="text-sm text-gray-900">
                    {dayjs(demande.dateReception).format('DD/MM/YYYY')}
                  </div>
                </td>
                <td>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(demande.type)}`}>
                    {demande.type}
                  </span>
                </td>
                <td>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {demande.grade ? `${demande.grade} ` : ''}{demande.prenom} {demande.nom}
                    </div>
                    {(demande.telephone1 || demande.telephone2) && (
                      <div className="text-gray-500 text-xs">
                        {demande.telephone1 || demande.telephone2}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <span className="text-sm text-gray-900">
                    {demande.unite || '-'}
                  </span>
                </td>
                <td>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(demande.position)}`}>
                    {demande.position || 'Non précisé'}
                  </span>
                </td>
                <td>
                  <div className="text-sm">
                    {demande.dateFaits && (
                      <div className="text-gray-900">
                        {dayjs(demande.dateFaits).format('DD/MM/YYYY')}
                      </div>
                    )}
                    {demande.commune && (
                      <div className="text-gray-500 text-xs">
                        {demande.commune}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  {demande.dossier ? (
                    <div className="text-sm">
                      <div className="font-medium text-blue-600">
                        {demande.dossier.numero}
                      </div>
                      {demande.dossier.sgami && (
                        <div className="text-gray-500 text-xs">
                          {demande.dossier.sgami.nom}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => onAddToDossier(demande)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <FolderIcon className="h-4 w-4 mr-1" />
                      Lier au dossier
                    </button>
                  )}
                </td>
                <td>
                  <div className="text-sm">
                    {demande.dateAudience ? (
                      <div className="text-gray-900">
                        {dayjs(demande.dateAudience).format('DD/MM/YYYY')}
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onView(demande)}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
                      title="Voir"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onEdit(demande)}
                      className="p-1 text-gray-400 hover:text-green-600 rounded-full hover:bg-green-50"
                      title="Modifier"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onDelete(demande)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
                      title="Supprimer"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default DemandesTable