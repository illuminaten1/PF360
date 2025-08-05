import React from 'react'
import { Dossier } from '@/types'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserIcon
} from '@heroicons/react/24/outline'

dayjs.locale('fr')

interface DossiersTableProps {
  dossiers: Dossier[]
  onView: (dossier: Dossier) => void
  onEdit: (dossier: Dossier) => void
  onDelete: (dossier: Dossier) => void
  loading?: boolean
}

const DossiersTable: React.FC<DossiersTableProps> = ({
  dossiers,
  onView,
  onEdit,
  onDelete,
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

  if (dossiers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun dossier</h3>
        <p className="text-gray-600">Commencez par créer votre premier dossier.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table">
          <thead className="bg-gray-50">
            <tr>
              <th>Numéro</th>
              <th>Demandes</th>
              <th>SGAMI</th>
              <th>Assigné à</th>
              <th>Badges</th>
              <th>Décisions</th>
              <th>Montants</th>
              <th>Date réception</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dossiers.map((dossier) => (
              <tr key={dossier.id}>
                <td>
                  <div className="font-medium text-gray-900">
                    {dossier.numero}
                  </div>
                </td>
                <td>
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">
                      {dossier.stats?.nombreDemandes || dossier.demandes.length} demande(s)
                    </div>
                    {dossier.demandes.length > 0 && (
                      <div className="text-gray-500 text-xs">
                        {dossier.demandes.slice(0, 2).map(d => `${d.prenom} ${d.nom}`).join(', ')}
                        {dossier.demandes.length > 2 && ` +${dossier.demandes.length - 2} autre(s)`}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    dossier.sgami ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {dossier.sgami?.nom || 'Non assigné'}
                  </span>
                </td>
                <td>
                  {dossier.assigneA ? (
                    <div className="flex items-center">
                      <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {dossier.assigneA.prenom} {dossier.assigneA.nom}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Non assigné</span>
                  )}
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {dossier.badges.slice(0, 3).map((badgeRel) => (
                      <span
                        key={badgeRel.badge.id}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                        style={badgeRel.badge.couleur ? { 
                          backgroundColor: `${badgeRel.badge.couleur}20`, 
                          color: badgeRel.badge.couleur 
                        } : {}}
                      >
                        {badgeRel.badge.nom}
                      </span>
                    ))}
                    {dossier.badges.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{dossier.badges.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="text-sm">
                    <div className="text-gray-900">{dossier.stats?.nombreDecisions || dossier.decisions.length}</div>
                    {dossier.decisions.length > 0 && (
                      <div className="text-gray-500 text-xs">
                        Dernière: {dayjs(dossier.decisions[0]?.date).format('DD/MM/YYYY')}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="text-sm">
                    <div className="text-gray-900">
                      Conv: {(dossier.stats?.totalConventionsHT || 0).toLocaleString('fr-FR')} €
                    </div>
                    <div className="text-gray-500 text-xs">
                      Paie: {(dossier.stats?.totalPaiementsTTC || 0).toLocaleString('fr-FR')} €
                    </div>
                  </div>
                </td>
                <td>
                  <div className="text-sm text-gray-900">
                    {dayjs(dossier.dateReceptionGlobale).format('DD/MM/YYYY')}
                  </div>
                </td>
                <td>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onView(dossier)}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
                      title="Voir"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onEdit(dossier)}
                      className="p-1 text-gray-400 hover:text-green-600 rounded-full hover:bg-green-50"
                      title="Modifier"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onDelete(dossier)}
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

export default DossiersTable