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
            <TableHeaderCell className="text-center">
              Total PF
            </TableHeaderCell>
            <TableHeaderCell className="text-center">
              Propres
            </TableHeaderCell>
            <TableHeaderCell className="text-center">
              BAP
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
            <TableHeaderCell className="text-center">
              En cours
            </TableHeaderCell>
            <TableHeaderCell className="text-center">
              En propre
            </TableHeaderCell>
            <TableHeaderCell className="text-center">
              Suivis BAP
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.grade ? `${user.grade} ` : ''}{user.prenom} {user.nom}
              </TableCell>
              <TableCell className="text-center">{user.demandesAttribuees}</TableCell>
              <TableCell className="text-center">{user.demandesPropres}</TableCell>
              <TableCell className="text-center">{user.demandesBAP}</TableCell>
              <TableCell className="text-center">{user.decisionsRepartition.PJ}</TableCell>
              <TableCell className="text-center">{user.decisionsRepartition.AJ}</TableCell>
              <TableCell className="text-center">{user.decisionsRepartition.AJE}</TableCell>
              <TableCell className="text-center">{user.decisionsRepartition.REJET}</TableCell>
              <TableCell className="text-center">{user.enCours}</TableCell>
              <TableCell className="text-center">{user.enCoursPropre}</TableCell>
              <TableCell className="text-center">{user.enCoursBAP}</TableCell>
            </TableRow>
          ))}
          {/* Ligne de totaux */}
          <TableRow className="bg-blue-50 font-bold border-t-2 border-blue-200">
            <TableCell className="font-bold">TOTAL</TableCell>
            <TableCell className="text-center font-bold">{totals.demandesAttribuees}</TableCell>
            <TableCell className="text-center font-bold">{totals.demandesPropres}</TableCell>
            <TableCell className="text-center font-bold">{totals.demandesBAP}</TableCell>
            <TableCell className="text-center font-bold">{totals.PJ}</TableCell>
            <TableCell className="text-center font-bold">{totals.AJ}</TableCell>
            <TableCell className="text-center font-bold">{totals.AJE}</TableCell>
            <TableCell className="text-center font-bold">{totals.REJET}</TableCell>
            <TableCell className="text-center font-bold">{totals.enCours}</TableCell>
            <TableCell className="text-center font-bold">{totals.enCoursPropre}</TableCell>
            <TableCell className="text-center font-bold">{totals.enCoursBAP}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

export default StatistiquesUtilisateurPanel