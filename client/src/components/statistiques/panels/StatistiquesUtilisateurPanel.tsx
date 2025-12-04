import React from 'react'
import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell
} from '@tremor/react'
import { StatistiquesUtilisateur } from '../types'

interface StatistiquesUtilisateurPanelProps {
  users: StatistiquesUtilisateur[] | undefined
}

const StatistiquesUtilisateurPanel: React.FC<StatistiquesUtilisateurPanelProps> = ({ users }) => {
  if (!users || users.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-gray-500">Aucune donnée disponible</p>
      </div>
    )
  }

  // Calcul des totaux
  const totals = {
    demandesAttribuees: users.reduce((sum, user) => sum + user.demandesAttribuees, 0),
    demandesPropres: users.reduce((sum, user) => sum + user.demandesPropres, 0),
    demandesBAP: users.reduce((sum, user) => sum + user.demandesBAP, 0),
    PJ: users.reduce((sum, user) => sum + user.decisionsRepartition.PJ, 0),
    AJ: users.reduce((sum, user) => sum + user.decisionsRepartition.AJ, 0),
    AJE: users.reduce((sum, user) => sum + user.decisionsRepartition.AJE, 0),
    REJET: users.reduce((sum, user) => sum + user.decisionsRepartition.REJET, 0),
    enCours: users.reduce((sum, user) => sum + user.enCours, 0),
    enCoursPropre: users.reduce((sum, user) => sum + user.enCoursPropre, 0),
    enCoursBAP: users.reduce((sum, user) => sum + user.enCoursBAP, 0),
  }

  return (
    <div className="p-4">
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell className="text-left">
              Rédacteurs
            </TableHeaderCell>
            <TableHeaderCell className="text-center bg-green-100">
              Demandes
            </TableHeaderCell>
            <TableHeaderCell className="text-center bg-green-100">
              en propre
            </TableHeaderCell>
            <TableHeaderCell className="text-center bg-green-100">
              en BAP
            </TableHeaderCell>
            <TableHeaderCell className="text-center">
              PJ
            </TableHeaderCell>
            <TableHeaderCell className="text-center">
              AJ
            </TableHeaderCell>
            <TableHeaderCell className="text-center">
              AJE
            </TableHeaderCell>
            <TableHeaderCell className="text-center">
              REJET
            </TableHeaderCell>
            <TableHeaderCell className="text-center bg-orange-100">
              Demandes en cours
            </TableHeaderCell>
            <TableHeaderCell className="text-center bg-orange-100">
              en propre
            </TableHeaderCell>
            <TableHeaderCell className="text-center bg-orange-100">
              en BAP
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.grade ? `${user.grade} ` : ''}{user.prenom} {user.nom}
              </TableCell>
              <TableCell className="text-center bg-green-50">{user.demandesAttribuees}</TableCell>
              <TableCell className="text-center bg-green-50">{user.demandesPropres}</TableCell>
              <TableCell className="text-center bg-green-50">{user.demandesBAP}</TableCell>
              <TableCell className="text-center">{user.decisionsRepartition.PJ}</TableCell>
              <TableCell className="text-center">{user.decisionsRepartition.AJ}</TableCell>
              <TableCell className="text-center">{user.decisionsRepartition.AJE}</TableCell>
              <TableCell className="text-center">{user.decisionsRepartition.REJET}</TableCell>
              <TableCell className="text-center bg-orange-50">{user.enCours}</TableCell>
              <TableCell className="text-center bg-orange-50">{user.enCoursPropre}</TableCell>
              <TableCell className="text-center bg-orange-50">{user.enCoursBAP}</TableCell>
            </TableRow>
          ))}
          {/* Ligne de totaux */}
          <TableRow className="font-bold border-t-2 border-gray-300">
            <TableCell className="font-bold bg-gray-100">TOTAL</TableCell>
            <TableCell className="text-center font-bold bg-green-100">{totals.demandesAttribuees}</TableCell>
            <TableCell className="text-center font-bold bg-green-100">{totals.demandesPropres}</TableCell>
            <TableCell className="text-center font-bold bg-green-100">{totals.demandesBAP}</TableCell>
            <TableCell className="text-center font-bold bg-gray-100">{totals.PJ}</TableCell>
            <TableCell className="text-center font-bold bg-gray-100">{totals.AJ}</TableCell>
            <TableCell className="text-center font-bold bg-gray-100">{totals.AJE}</TableCell>
            <TableCell className="text-center font-bold bg-gray-100">{totals.REJET}</TableCell>
            <TableCell className="text-center font-bold bg-orange-100">{totals.enCours}</TableCell>
            <TableCell className="text-center font-bold bg-orange-100">{totals.enCoursPropre}</TableCell>
            <TableCell className="text-center font-bold bg-orange-100">{totals.enCoursBAP}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

export default StatistiquesUtilisateurPanel