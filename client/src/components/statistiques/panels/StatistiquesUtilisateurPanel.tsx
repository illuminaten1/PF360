import React, { useState } from 'react'
import { StatistiquesUtilisateur, SortColumn, SortOrder } from '../types'

interface StatistiquesUtilisateurPanelProps {
  users: StatistiquesUtilisateur[] | undefined
}

const StatistiquesUtilisateurPanel: React.FC<StatistiquesUtilisateurPanelProps> = ({ users }) => {
  const [sortColumn, setSortColumn] = useState<SortColumn>('nom')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortOrder('asc')
    }
  }

  const getSortValue = (user: StatistiquesUtilisateur, column: SortColumn): number | string => {
    switch (column) {
      case 'nom': return `${user.nom} ${user.prenom}`
      case 'totalPF': return user.demandesAttribuees
      case 'propres': return user.demandesPropres
      case 'bap': return user.demandesBAP
      case 'pj': return user.decisionsRepartition.PJ
      case 'aj': return user.decisionsRepartition.AJ
      case 'aje': return user.decisionsRepartition.AJE
      case 'rejet': return user.decisionsRepartition.REJET
      case 'enCours': return user.enCours
      case 'enCoursPropre': return user.enCoursPropre
      case 'enCoursBAP': return user.enCoursBAP
      default: return 0
    }
  }

  const sortedUsers = users ? [...users].sort((a, b) => {
    const aValue = getSortValue(a, sortColumn)
    const bValue = getSortValue(b, sortColumn)
    
    let comparison = 0
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      comparison = aValue.localeCompare(bValue, 'fr', { sensitivity: 'base' })
    } else {
      comparison = (aValue as number) - (bValue as number)
    }
    
    return sortOrder === 'asc' ? comparison : -comparison
  }) : undefined

  const SortIcon: React.FC<{ column: SortColumn }> = ({ column }) => {
    if (sortColumn !== column) {
      return <span className="ml-1 text-gray-400">⇅</span>
    }
    return sortOrder === 'asc' 
      ? <span className="ml-1 text-blue-600">↑</span>
      : <span className="ml-1 text-blue-600">↓</span>
  }

  const totalRows = sortedUsers ? sortedUsers.length + 1 : 1
  const heightPercentage = (100 / totalRows).toFixed(2)

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full h-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gray-50 sticky top-0" style={{ height: 'auto' }}>
            <tr>
              <th 
                className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('nom')}
              >
                <div className="flex items-center">
                  Rédacteurs
                  <SortIcon column="nom" />
                </div>
              </th>
              <th 
                className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('totalPF')}
              >
                <div className="flex items-center justify-center">
                  Total PF
                  <SortIcon column="totalPF" />
                </div>
              </th>
              <th 
                className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('propres')}
              >
                <div className="flex items-center justify-center">
                  Propres
                  <SortIcon column="propres" />
                </div>
              </th>
              <th 
                className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('bap')}
              >
                <div className="flex items-center justify-center">
                  BAP
                  <SortIcon column="bap" />
                </div>
              </th>
              <th 
                className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('pj')}
              >
                <div className="flex items-center justify-center">
                  PJ
                  <SortIcon column="pj" />
                </div>
              </th>
              <th 
                className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('aj')}
              >
                <div className="flex items-center justify-center">
                  AJ
                  <SortIcon column="aj" />
                </div>
              </th>
              <th 
                className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('aje')}
              >
                <div className="flex items-center justify-center">
                  AJE
                  <SortIcon column="aje" />
                </div>
              </th>
              <th 
                className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('rejet')}
              >
                <div className="flex items-center justify-center">
                  REJET
                  <SortIcon column="rejet" />
                </div>
              </th>
              <th 
                className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('enCours')}
              >
                <div className="flex items-center justify-center">
                  En cours
                  <SortIcon column="enCours" />
                </div>
              </th>
              <th 
                className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('enCoursPropre')}
              >
                <div className="flex items-center justify-center">
                  En propre
                  <SortIcon column="enCoursPropre" />
                </div>
              </th>
              <th 
                className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100 select-none"
                onClick={() => handleSort('enCoursBAP')}
              >
                <div className="flex items-center justify-center">
                  Suivis BAP
                  <SortIcon column="enCoursBAP" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white h-full">
            {sortedUsers && sortedUsers.length > 0 ? (
              <>
                {sortedUsers.map((user, index) => (
                  <tr 
                    key={user.id} 
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100`}
                    style={{ height: `${heightPercentage}%` }}
                  >
                    <td className="px-2 py-1 align-middle">
                      <div className="text-xs font-medium text-gray-900">
                        {user.grade ? `${user.grade} ` : ''}{user.prenom} {user.nom}
                      </div>
                    </td>
                    <td className="px-2 py-1 text-center text-xs text-gray-900 align-middle">
                      {user.demandesAttribuees}
                    </td>
                    <td className="px-2 py-1 text-center text-xs text-gray-900 align-middle">
                      {user.demandesPropres}
                    </td>
                    <td className="px-2 py-1 text-center text-xs text-gray-900 align-middle">
                      {user.demandesBAP}
                    </td>
                    <td className="px-2 py-1 text-center text-xs font-medium text-blue-600 align-middle">
                      {user.decisionsRepartition.PJ}
                    </td>
                    <td className="px-2 py-1 text-center text-xs font-medium text-purple-600 align-middle">
                      {user.decisionsRepartition.AJ}
                    </td>
                    <td className="px-2 py-1 text-center text-xs font-medium text-green-600 align-middle">
                      {user.decisionsRepartition.AJE}
                    </td>
                    <td className="px-2 py-1 text-center text-xs font-medium text-red-600 align-middle">
                      {user.decisionsRepartition.REJET}
                    </td>
                    <td className="px-2 py-1 text-center text-xs text-gray-900 align-middle">
                      {user.enCours}
                    </td>
                    <td className="px-2 py-1 text-center text-xs text-gray-900 align-middle">
                      {user.enCoursPropre}
                    </td>
                    <td className="px-2 py-1 text-center text-xs text-gray-900 align-middle">
                      {user.enCoursBAP}
                    </td>
                  </tr>
                ))}
                <tr 
                  className="bg-blue-50 border-t-2 border-blue-200"
                  style={{ height: `${heightPercentage}%` }}
                >
                  <td className="px-2 py-1 align-middle">
                    <div className="text-xs font-bold text-gray-900">
                      TOTAL
                    </div>
                  </td>
                  <td className="px-2 py-1 text-center text-xs font-bold text-gray-900 align-middle">
                    {sortedUsers.reduce((sum, user) => sum + user.demandesAttribuees, 0)}
                  </td>
                  <td className="px-2 py-1 text-center text-xs font-bold text-gray-900 align-middle">
                    {sortedUsers.reduce((sum, user) => sum + user.demandesPropres, 0)}
                  </td>
                  <td className="px-2 py-1 text-center text-xs font-bold text-gray-900 align-middle">
                    {sortedUsers.reduce((sum, user) => sum + user.demandesBAP, 0)}
                  </td>
                  <td className="px-2 py-1 text-center text-xs font-bold text-blue-600 align-middle">
                    {sortedUsers.reduce((sum, user) => sum + user.decisionsRepartition.PJ, 0)}
                  </td>
                  <td className="px-2 py-1 text-center text-xs font-bold text-purple-600 align-middle">
                    {sortedUsers.reduce((sum, user) => sum + user.decisionsRepartition.AJ, 0)}
                  </td>
                  <td className="px-2 py-1 text-center text-xs font-bold text-green-600 align-middle">
                    {sortedUsers.reduce((sum, user) => sum + user.decisionsRepartition.AJE, 0)}
                  </td>
                  <td className="px-2 py-1 text-center text-xs font-bold text-red-600 align-middle">
                    {sortedUsers.reduce((sum, user) => sum + user.decisionsRepartition.REJET, 0)}
                  </td>
                  <td className="px-2 py-1 text-center text-xs font-bold text-gray-900 align-middle">
                    {sortedUsers.reduce((sum, user) => sum + user.enCours, 0)}
                  </td>
                  <td className="px-2 py-1 text-center text-xs font-bold text-gray-900 align-middle">
                    {sortedUsers.reduce((sum, user) => sum + user.enCoursPropre, 0)}
                  </td>
                  <td className="px-2 py-1 text-center text-xs font-bold text-gray-900 align-middle">
                    {sortedUsers.reduce((sum, user) => sum + user.enCoursBAP, 0)}
                  </td>
                </tr>
              </>
            ) : (
              <tr style={{ height: '100%' }}>
                <td colSpan={11} className="px-3 py-4 text-center text-xs text-gray-500 align-middle">
                  Aucune donnée disponible
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default StatistiquesUtilisateurPanel