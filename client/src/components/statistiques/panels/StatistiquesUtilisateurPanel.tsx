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
    <div className="p-6">
      <Table className="mt-2">
        <TableHead>
          <TableRow>
            <TableHeaderCell className="text-left text-tremor-content-strong font-semibold">
              Rédacteurs
            </TableHeaderCell>
            <TableHeaderCell className="text-center text-tremor-content-strong font-semibold bg-green-50">
              Demandes
            </TableHeaderCell>
            <TableHeaderCell className="text-center text-tremor-content-strong font-semibold bg-green-50">
              en propre
            </TableHeaderCell>
            <TableHeaderCell className="text-center text-tremor-content-strong font-semibold bg-green-50">
              en BAP
            </TableHeaderCell>
            <TableHeaderCell className="text-center text-tremor-content-strong font-semibold">
              PJ
            </TableHeaderCell>
            <TableHeaderCell className="text-center text-tremor-content-strong font-semibold">
              AJ
            </TableHeaderCell>
            <TableHeaderCell className="text-center text-tremor-content-strong font-semibold">
              AJE
            </TableHeaderCell>
            <TableHeaderCell className="text-center text-tremor-content-strong font-semibold">
              REJET
            </TableHeaderCell>
            <TableHeaderCell className="text-center text-tremor-content-strong font-semibold bg-orange-50">
              Demandes en cours
            </TableHeaderCell>
            <TableHeaderCell className="text-center text-tremor-content-strong font-semibold bg-orange-50">
              en propre
            </TableHeaderCell>
            <TableHeaderCell className="text-center text-tremor-content-strong font-semibold bg-orange-50">
              en BAP
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="group transition">
              <TableCell className="font-medium text-tremor-content-strong group-hover:bg-blue-50/30 dark:group-hover:bg-blue-800/5">
                {user.grade ? `${user.grade} ` : ''}{user.prenom} {user.nom}
              </TableCell>
              <TableCell className="text-center text-tremor-content bg-green-50 group-hover:bg-green-100/80 dark:group-hover:bg-green-900/20">{user.demandesAttribuees}</TableCell>
              <TableCell className="text-center text-tremor-content bg-green-50 group-hover:bg-green-100/80 dark:group-hover:bg-green-900/20">{user.demandesPropres}</TableCell>
              <TableCell className="text-center text-tremor-content bg-green-50 group-hover:bg-green-100/80 dark:group-hover:bg-green-900/20">{user.demandesBAP}</TableCell>
              <TableCell className="text-center text-tremor-content group-hover:bg-blue-50/30 dark:group-hover:bg-blue-800/5">{user.decisionsRepartition.PJ}</TableCell>
              <TableCell className="text-center text-tremor-content group-hover:bg-blue-50/30 dark:group-hover:bg-blue-800/5">{user.decisionsRepartition.AJ}</TableCell>
              <TableCell className="text-center text-tremor-content group-hover:bg-blue-50/30 dark:group-hover:bg-blue-800/5">{user.decisionsRepartition.AJE}</TableCell>
              <TableCell className="text-center text-tremor-content group-hover:bg-blue-50/30 dark:group-hover:bg-blue-800/5">{user.decisionsRepartition.REJET}</TableCell>
              <TableCell className="text-center text-tremor-content bg-orange-50 group-hover:bg-orange-100/80 dark:group-hover:bg-orange-900/20">{user.enCours}</TableCell>
              <TableCell className="text-center text-tremor-content bg-orange-50 group-hover:bg-orange-100/80 dark:group-hover:bg-orange-900/20">{user.enCoursPropre}</TableCell>
              <TableCell className="text-center text-tremor-content bg-orange-50 group-hover:bg-orange-100/80 dark:group-hover:bg-orange-900/20">{user.enCoursBAP}</TableCell>
            </TableRow>
          ))}
          {/* Ligne de totaux */}
          <TableRow className="border-t-2 border-tremor-border">
            <TableCell className="font-semibold text-tremor-content-strong bg-gray-50">TOTAL</TableCell>
            <TableCell className="text-center font-semibold text-tremor-content-strong bg-green-100">{totals.demandesAttribuees}</TableCell>
            <TableCell className="text-center font-semibold text-tremor-content-strong bg-green-100">{totals.demandesPropres}</TableCell>
            <TableCell className="text-center font-semibold text-tremor-content-strong bg-green-100">{totals.demandesBAP}</TableCell>
            <TableCell className="text-center font-semibold text-tremor-content-strong bg-gray-50">{totals.PJ}</TableCell>
            <TableCell className="text-center font-semibold text-tremor-content-strong bg-gray-50">{totals.AJ}</TableCell>
            <TableCell className="text-center font-semibold text-tremor-content-strong bg-gray-50">{totals.AJE}</TableCell>
            <TableCell className="text-center font-semibold text-tremor-content-strong bg-gray-50">{totals.REJET}</TableCell>
            <TableCell className="text-center font-semibold text-tremor-content-strong bg-orange-100">{totals.enCours}</TableCell>
            <TableCell className="text-center font-semibold text-tremor-content-strong bg-orange-100">{totals.enCoursPropre}</TableCell>
            <TableCell className="text-center font-semibold text-tremor-content-strong bg-orange-100">{totals.enCoursBAP}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}

export default StatistiquesUtilisateurPanel