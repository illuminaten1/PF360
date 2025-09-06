import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Mosaic, MosaicWindow, MosaicNode } from 'react-mosaic-component'
import { api } from '@/utils/api'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import 'react-mosaic-component/react-mosaic-component.css'
import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'

interface StatistiquesGenerales {
  demandesTotal: number
  demandesTraitees: number
  demandesEnInstance: number
  demandesNonAffectees: number
}

interface StatistiquesUtilisateur {
  id: string
  nom: string
  prenom: string
  role: string
  demandesAttribuees: number
  demandesPropres: number
  demandesBAP: number
  decisionsRepartition: {
    PJ: number
    AJE: number
    AJ: number
    REJET: number
  }
  passageAJEversPJ: number
  enCours: number
  enCoursPropre: number
  enCoursBAP: number
}

interface StatistiquesAdministratives {
  generales: StatistiquesGenerales
  utilisateurs: StatistiquesUtilisateur[]
}

interface StatistiqueBAP {
  nomBAP: string
  nombreDemandes: number
}

interface FluxMensuel {
  mois: string
  entrantsAnnee: number
  sortantsAnnee: number
  entrantsAnneePrecedente: number
}

interface StatistiquesFluxMensuels {
  fluxMensuels: FluxMensuel[]
  moyennes: FluxMensuel
  annee: number
  anneePrecedente: number
}

interface FluxHebdomadaire {
  numeroSemaine: number
  dateDebut: string
  dateFin: string
  entrantsAnnee: number
  sortantsAnnee: number
  entrantsAnneePrecedente: number
}

interface StatistiquesFluxHebdomadaires {
  fluxHebdomadaires: FluxHebdomadaire[]
  annee: number
  anneePrecedente: number
}

interface StatistiquesAutoControle {
  pjEnAttenteConvention: number
  ancienneteMoyenneNonTraites: number
  ancienneteMoyenneBAP: number
  ancienneteMoyenneBRP: number
  delaiTraitementMoyen: number
  delaiTraitementBAP: number
  delaiTraitementBRP: number
}

interface StatistiquesQualiteDemandeur {
  qualite: 'VICTIME' | 'MIS_EN_CAUSE'
  nombreDemandes: number
  pourcentage: number
}

interface StatistiquesTypeInfraction {
  qualificationInfraction: string
  nombreDemandes: number
  pourcentage: number
}

interface StatistiquesContexteMissionnel {
  contexteMissionnel: string
  nombreDemandes: number
  pourcentage: number
}

interface StatistiquesFormationAdministrative {
  formationAdministrative: string
  nombreDemandes: number
  pourcentage: number
}

interface StatistiquesBranche {
  branche: string
  nombreDemandes: number
  pourcentage: number
}

interface StatistiquesStatutDemandeur {
  statutDemandeur: string
  nombreDemandes: number
  pourcentage: number
}

type MosaicKey = 'general' | 'users' | 'bap' | 'qualite' | 'infractions' | 'contexte' | 'formation' | 'branche' | 'statut' | 'autocontrole' | 'fluxmensuels' | 'fluxhebdo'

const INITIAL_MOSAIC_LAYOUT: MosaicNode<MosaicKey> = {
  direction: 'column' as const,
  first: {
    direction: 'column' as const,
    first: {
      direction: 'row' as const,
      first: 'general' as MosaicKey,
      second: {
        direction: 'row' as const,
        first: 'users' as MosaicKey,
        second: 'bap' as MosaicKey,
        splitPercentage: 60
      },
      splitPercentage: 30
    },
    second: {
      direction: 'row' as const,
      first: 'qualite' as MosaicKey,
      second: {
        direction: 'row' as const,
        first: 'contexte' as MosaicKey,
        second: {
          direction: 'row' as const,
          first: 'formation' as MosaicKey,
          second: {
            direction: 'row' as const,
            first: 'branche' as MosaicKey,
            second: 'statut' as MosaicKey,
            splitPercentage: 50
          },
          splitPercentage: 50
        },
        splitPercentage: 25
      },
      splitPercentage: 20
    },
    splitPercentage: 50
  },
  second: {
    direction: 'row' as const,
    first: 'autocontrole' as MosaicKey,
    second: {
      direction: 'row' as const,
      first: {
        direction: 'row' as const,
        first: 'infractions' as MosaicKey,
        second: 'fluxmensuels' as MosaicKey,
        splitPercentage: 50
      },
      second: 'fluxhebdo' as MosaicKey,
      splitPercentage: 66
    },
    splitPercentage: 25
  },
  splitPercentage: 66
}

const StatistiquesGeneralesComponent: React.FC<{ 
  stats: StatistiquesGenerales | undefined
}> = ({ stats }) => (
  <div className="p-4 h-full overflow-auto">
    {stats && (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {stats.demandesTotal}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Demandes reçues
          </div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {stats.demandesTraitees}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Demandes traitées
          </div>
        </div>
        <div className="text-center p-4 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {stats.demandesEnInstance}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Demandes en instance
          </div>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {stats.demandesNonAffectees}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Demandes non affectées
          </div>
        </div>
      </div>
    )}
  </div>
)

const StatistiquesUtilisateurComponent: React.FC<{ 
  users: StatistiquesUtilisateur[] | undefined 
}> = ({ users }) => (
  <div className="p-4 h-full overflow-auto">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Rédacteurs
            </th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
              Total PF
            </th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
              Propres
            </th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase border-r border-gray-300">
              BAP
            </th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
              PJ
            </th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
              AJ
            </th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
              AJE
            </th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase border-r border-gray-300">
              REJET
            </th>
            <th className="px-2 py-2 text-center text-xs font-bold text-gray-600 uppercase">
              En cours
            </th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
              En propre
            </th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
              Suivis BAP
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users?.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="text-xs font-medium text-gray-900">
                  {user.prenom} {user.nom}
                </div>
                <div className="text-xs text-gray-500">
                  {user.role}
                </div>
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900">
                {user.demandesAttribuees}
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900">
                {user.demandesPropres}
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900 border-r border-gray-200">
                {user.demandesBAP}
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-blue-600 font-medium">
                {user.decisionsRepartition.PJ}
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-purple-600 font-medium">
                {user.decisionsRepartition.AJ}
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-green-600 font-medium">
                {user.decisionsRepartition.AJE}
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-red-600 font-medium border-r border-gray-200">
                {user.decisionsRepartition.REJET}
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-bold">
                {user.enCours}
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900">
                {user.enCoursPropre}
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900">
                {user.enCoursBAP}
              </td>
            </tr>
          ))}
          {users && users.length > 0 && (
            <tr className="bg-gray-50 border-t-2 border-gray-300">
              <td className="px-3 py-2 whitespace-nowrap">
                <div className="text-xs font-bold text-gray-900">
                  TOTAL
                </div>
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-bold">
                {users.reduce((sum, user) => sum + user.demandesAttribuees, 0)}
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-bold">
                {users.reduce((sum, user) => sum + user.demandesPropres, 0)}
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-bold border-r border-gray-200">
                {users.reduce((sum, user) => sum + user.demandesBAP, 0)}
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-blue-600 font-bold">
                {users.reduce((sum, user) => sum + user.decisionsRepartition.PJ, 0)}
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-purple-600 font-bold">
                {users.reduce((sum, user) => sum + user.decisionsRepartition.AJ, 0)}
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-green-600 font-bold">
                {users.reduce((sum, user) => sum + user.decisionsRepartition.AJE, 0)}
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-red-600 font-bold border-r border-gray-200">
                {users.reduce((sum, user) => sum + user.decisionsRepartition.REJET, 0)}
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-bold">
                {users.reduce((sum, user) => sum + user.enCours, 0)}
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-bold">
                {users.reduce((sum, user) => sum + user.enCoursPropre, 0)}
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-bold">
                {users.reduce((sum, user) => sum + user.enCoursBAP, 0)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)

const StatistiquesBAPComponent: React.FC<{ 
  statsBAP: StatistiqueBAP[] | undefined 
}> = ({ statsBAP }) => (
  <div className="p-4 h-full overflow-auto">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              BAP
            </th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
              Demandes
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {statsBAP && statsBAP.length > 0 ? (
            statsBAP.map((bap) => (
              <tr key={bap.nomBAP} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="text-xs font-medium text-gray-900">
                    {bap.nomBAP}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center text-xs text-gray-900">
                  {bap.nombreDemandes}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={2} className="px-4 py-3 text-center text-xs text-gray-500">
                Aucune donnée disponible
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)

const QualiteDemandeurComponent: React.FC<{ 
  statsQualite: StatistiquesQualiteDemandeur[] | undefined 
}> = ({ statsQualite }) => (
  <div className="p-4 h-full overflow-auto">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Qualité
            </th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
              Nbr demandes
            </th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
              Pourcentage
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {statsQualite && statsQualite.length > 0 ? (
            statsQualite.map((stat) => (
              <tr key={stat.qualite} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="text-xs font-medium text-gray-900">
                    {stat.qualite === 'VICTIME' ? 'Victime' : 'Mis en cause'}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-medium">
                  {stat.nombreDemandes}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-medium">
                  {stat.pourcentage.toFixed(1)}%
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="px-4 py-3 text-center text-xs text-gray-500">
                Aucune donnée disponible
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)

const TypeInfractionComponent: React.FC<{ 
  statsInfractions: StatistiquesTypeInfraction[] | undefined 
}> = ({ statsInfractions }) => (
  <div className="p-4 h-full overflow-auto">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Type d&apos;infraction
            </th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
              Nbr demandes
            </th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
              Pourcentage
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {statsInfractions && statsInfractions.length > 0 ? (
            statsInfractions.map((stat, index) => (
              <tr key={`${stat.qualificationInfraction}-${index}`} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="text-xs font-medium text-gray-900">
                    {stat.qualificationInfraction || 'Non renseigné'}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-medium">
                  {stat.nombreDemandes}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-medium">
                  {stat.pourcentage.toFixed(1)}%
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="px-4 py-3 text-center text-xs text-gray-500">
                Aucune donnée disponible
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)

const ContexteMissionnelComponent: React.FC<{ 
  statsContexte: StatistiquesContexteMissionnel[] | undefined 
}> = ({ statsContexte }) => (
  <div className="p-4 h-full overflow-auto">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Contexte missionnel
            </th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
              Nbr demandes
            </th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
              Pourcentage
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {statsContexte && statsContexte.length > 0 ? (
            statsContexte.map((stat, index) => (
              <tr key={`${stat.contexteMissionnel}-${index}`} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="text-xs font-medium text-gray-900">
                    {stat.contexteMissionnel || 'Non renseigné'}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-medium">
                  {stat.nombreDemandes}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-medium">
                  {stat.pourcentage.toFixed(1)}%
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="px-4 py-3 text-center text-xs text-gray-500">
                Aucune donnée disponible
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)

const FormationAdministrativeComponent: React.FC<{ 
  statsFormation: StatistiquesFormationAdministrative[] | undefined 
}> = ({ statsFormation }) => (
  <div className="p-4 h-full overflow-auto">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Formation administrative
            </th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
              Nbr demandes
            </th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
              Pourcentage
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {statsFormation && statsFormation.length > 0 ? (
            statsFormation.map((stat, index) => (
              <tr key={`${stat.formationAdministrative}-${index}`} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="text-xs font-medium text-gray-900">
                    {stat.formationAdministrative || 'Non renseigné'}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-medium">
                  {stat.nombreDemandes}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-medium">
                  {stat.pourcentage.toFixed(1)}%
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="px-4 py-3 text-center text-xs text-gray-500">
                Aucune donnée disponible
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)

const BrancheComponent: React.FC<{ 
  statsBranche: StatistiquesBranche[] | undefined 
}> = ({ statsBranche }) => (
  <div className="p-4 h-full overflow-auto">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Branche
            </th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
              Nbr demandes
            </th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
              Pourcentage
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {statsBranche && statsBranche.length > 0 ? (
            statsBranche.map((stat, index) => (
              <tr key={`${stat.branche}-${index}`} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="text-xs font-medium text-gray-900">
                    {stat.branche || 'Non renseigné'}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-medium">
                  {stat.nombreDemandes}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-medium">
                  {stat.pourcentage.toFixed(1)}%
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="px-4 py-3 text-center text-xs text-gray-500">
                Aucune donnée disponible
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)

const StatutDemandeurComponent: React.FC<{ 
  statsStatut: StatistiquesStatutDemandeur[] | undefined 
}> = ({ statsStatut }) => (
  <div className="p-4 h-full overflow-auto">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Statut demandeur
            </th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
              Nbr demandes
            </th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
              Pourcentage
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {statsStatut && statsStatut.length > 0 ? (
            statsStatut.map((stat, index) => (
              <tr key={`${stat.statutDemandeur}-${index}`} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap">
                  <div className="text-xs font-medium text-gray-900">
                    {stat.statutDemandeur || 'Non renseigné'}
                  </div>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-medium">
                  {stat.nombreDemandes}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-center text-xs text-gray-900 font-medium">
                  {stat.pourcentage.toFixed(1)}%
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="px-4 py-3 text-center text-xs text-gray-500">
                Aucune donnée disponible
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)

const AutoControleComponent: React.FC<{ 
  autoControle: StatistiquesAutoControle | undefined 
}> = ({ autoControle }) => (
  <div className="p-4 h-full overflow-auto">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <tbody className="bg-white divide-y divide-gray-200">
          <tr className="hover:bg-gray-50">
            <td className="px-4 py-2 whitespace-nowrap">
              <div className="text-xs font-medium text-gray-900">PJ en attente de convention</div>
            </td>
            <td className="px-4 py-2 whitespace-nowrap text-right">
              <div className="text-xs font-bold text-red-600">
                {autoControle?.pjEnAttenteConvention || 0}
              </div>
            </td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-4 py-2 whitespace-nowrap">
              <div className="text-xs font-medium text-gray-900">Ancienneté moyenne non traités</div>
            </td>
            <td className="px-4 py-2 whitespace-nowrap text-right">
              <div className="text-xs font-bold text-gray-900">
                {autoControle?.ancienneteMoyenneNonTraites?.toFixed(2) || '0,00'}
              </div>
            </td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-2 whitespace-nowrap">
              <div className="text-xs text-gray-900">Dont BAP</div>
            </td>
            <td className="px-4 py-2 whitespace-nowrap text-right">
              <div className="text-xs font-bold text-gray-900">
                {autoControle?.ancienneteMoyenneBAP?.toFixed(2) || '0,00'}
              </div>
            </td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-2 whitespace-nowrap">
              <div className="text-xs text-gray-900">Dont BRPF</div>
            </td>
            <td className="px-4 py-2 whitespace-nowrap text-right">
              <div className="text-xs font-bold text-gray-900">
                {autoControle?.ancienneteMoyenneBRP?.toFixed(2) || '0,00'}
              </div>
            </td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-4 py-2 whitespace-nowrap">
              <div className="text-xs font-medium text-gray-900">Délai traitement moyen</div>
            </td>
            <td className="px-4 py-2 whitespace-nowrap text-right">
              <div className="text-xs font-bold text-gray-900">
                {autoControle?.delaiTraitementMoyen?.toFixed(2) || '0,00'}
              </div>
            </td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-2 whitespace-nowrap">
              <div className="text-xs text-gray-900">Dont BAP</div>
            </td>
            <td className="px-4 py-2 whitespace-nowrap text-right">
              <div className="text-xs font-bold text-gray-900">
                {autoControle?.delaiTraitementBAP?.toFixed(2) || '0,00'}
              </div>
            </td>
          </tr>
          <tr className="hover:bg-gray-50">
            <td className="px-6 py-2 whitespace-nowrap">
              <div className="text-xs text-gray-900">Dont BRPF</div>
            </td>
            <td className="px-4 py-2 whitespace-nowrap text-right">
              <div className="text-xs font-bold text-gray-900">
                {autoControle?.delaiTraitementBRP?.toFixed(2) || '0,00'}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
)

const FluxMensuelsComponent: React.FC<{ 
  fluxMensuels: StatistiquesFluxMensuels | undefined
  selectedYear: number 
}> = ({ fluxMensuels, selectedYear }) => (
  <div className="p-4 h-full overflow-auto">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">
              Mois
            </th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-green-50">
              Entrants {selectedYear}
            </th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-red-50">
              Sortants {selectedYear}
            </th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-gray-100">
              Entrants {selectedYear - 1}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {fluxMensuels && fluxMensuels.fluxMensuels.length > 0 ? (
            fluxMensuels.fluxMensuels.map((flux) => (
              <tr key={flux.mois} className="hover:bg-gray-50">
                <td className="px-2 py-1 whitespace-nowrap">
                  <div className="text-xs font-medium text-gray-900">
                    {flux.mois}
                  </div>
                </td>
                <td className="px-2 py-1 whitespace-nowrap text-center text-xs text-gray-900">
                  {flux.entrantsAnnee}
                </td>
                <td className="px-2 py-1 whitespace-nowrap text-center text-xs text-gray-900">
                  {flux.sortantsAnnee}
                </td>
                <td className="px-2 py-1 whitespace-nowrap text-center text-xs text-gray-500">
                  {flux.entrantsAnneePrecedente}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="px-2 py-3 text-center text-xs text-gray-500">
                Aucune donnée disponible
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)

const FluxHebdomadairesComponent: React.FC<{ 
  fluxHebdomadaires: StatistiquesFluxHebdomadaires | undefined
}> = ({ fluxHebdomadaires }) => {
  // Calculer le stock cumulé pour chaque semaine
  const fluxAvecStock = fluxHebdomadaires?.fluxHebdomadaires ? 
    fluxHebdomadaires.fluxHebdomadaires.reduce((acc, flux, index) => {
      const difference = flux.entrantsAnnee - flux.sortantsAnnee;
      const stock = index === 0 ? difference : acc[index - 1].stock + difference;
      acc.push({
        ...flux,
        difference,
        stock
      });
      return acc;
    }, [] as Array<typeof fluxHebdomadaires.fluxHebdomadaires[0] & {difference: number, stock: number}>) : [];

  return (
  <div className="p-4 h-full overflow-auto">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">
              Semaine
            </th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-green-50">
              Entrants
            </th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-red-50">
              Sortants
            </th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50">
              Différence
            </th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase bg-yellow-50">
              Stock
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {fluxAvecStock && fluxAvecStock.length > 0 ? (
            fluxAvecStock.map((flux) => (
              <tr key={flux.numeroSemaine} className="hover:bg-gray-50">
                <td className="px-2 py-1 whitespace-nowrap text-center">
                  <div className="text-xs font-medium text-gray-900">
                    S{flux.numeroSemaine.toString().padStart(2, '0')}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {flux.dateDebut} - {flux.dateFin}
                  </div>
                </td>
                <td className="px-2 py-1 whitespace-nowrap text-center text-xs text-gray-900">
                  {flux.entrantsAnnee}
                </td>
                <td className="px-2 py-1 whitespace-nowrap text-center text-xs text-gray-900">
                  {flux.sortantsAnnee}
                </td>
                <td className={`px-2 py-1 whitespace-nowrap text-center text-xs font-medium ${
                  flux.difference > 0 ? 'text-green-600' : 
                  flux.difference < 0 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {flux.difference > 0 ? '+' : ''}{flux.difference}
                </td>
                <td className="px-2 py-1 whitespace-nowrap text-center text-xs text-gray-900 font-medium">
                  {flux.stock}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-2 py-3 text-center text-xs text-gray-500">
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

const Statistiques: React.FC = () => {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [activeTab, setActiveTab] = useState<'administratif' | 'budgetaire'>('administratif')
  
  // Load saved layout from localStorage or use default
  const [mosaicValue, setMosaicValue] = useState<MosaicNode<MosaicKey> | null>(() => {
    try {
      const savedLayout = localStorage.getItem('pf360-statistiques-layout')
      return savedLayout ? JSON.parse(savedLayout) : INITIAL_MOSAIC_LAYOUT
    } catch {
      return INITIAL_MOSAIC_LAYOUT
    }
  })

  // Handle layout changes and save to localStorage
  const handleMosaicChange = (newValue: MosaicNode<MosaicKey> | null) => {
    setMosaicValue(newValue)
    try {
      if (newValue) {
        localStorage.setItem('pf360-statistiques-layout', JSON.stringify(newValue))
      } else {
        localStorage.removeItem('pf360-statistiques-layout')
      }
    } catch (error) {
      console.warn('Failed to save layout to localStorage:', error)
    }
  }

  // Reset layout to default
  const resetLayout = () => {
    setMosaicValue(INITIAL_MOSAIC_LAYOUT)
    try {
      localStorage.removeItem('pf360-statistiques-layout')
    } catch (error) {
      console.warn('Failed to remove layout from localStorage:', error)
    }
  }

  const { data: statsAdministratives, isLoading: isLoadingAdmin } = useQuery<StatistiquesAdministratives>({
    queryKey: ['statistiques-administratives', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/administratives?year=${selectedYear}`)
      return response.data
    },
    enabled: activeTab === 'administratif'
  })

  const { data: statsBAP, isLoading: isLoadingBAP } = useQuery<StatistiqueBAP[]>({
    queryKey: ['statistiques-bap', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/bap?year=${selectedYear}`)
      return response.data
    },
    enabled: activeTab === 'administratif'
  })

  const { data: statsQualite, isLoading: isLoadingQualite } = useQuery<StatistiquesQualiteDemandeur[]>({
    queryKey: ['statistiques-qualite', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/qualite-demandeur?year=${selectedYear}`)
      return response.data
    },
    enabled: activeTab === 'administratif'
  })

  const { data: statsInfractions, isLoading: isLoadingInfractions } = useQuery<StatistiquesTypeInfraction[]>({
    queryKey: ['statistiques-infractions', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/type-infraction?year=${selectedYear}`)
      return response.data
    },
    enabled: activeTab === 'administratif'
  })

  const { data: statsContexte, isLoading: isLoadingContexte } = useQuery<StatistiquesContexteMissionnel[]>({
    queryKey: ['statistiques-contexte', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/contexte-missionnel?year=${selectedYear}`)
      return response.data
    },
    enabled: activeTab === 'administratif'
  })

  const { data: statsFormation, isLoading: isLoadingFormation } = useQuery<StatistiquesFormationAdministrative[]>({
    queryKey: ['statistiques-formation', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/formation-administrative?year=${selectedYear}`)
      return response.data
    },
    enabled: activeTab === 'administratif'
  })

  const { data: statsBranche, isLoading: isLoadingBranche } = useQuery<StatistiquesBranche[]>({
    queryKey: ['statistiques-branche', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/branche?year=${selectedYear}`)
      return response.data
    },
    enabled: activeTab === 'administratif'
  })

  const { data: statsStatut, isLoading: isLoadingStatut } = useQuery<StatistiquesStatutDemandeur[]>({
    queryKey: ['statistiques-statut', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/statut-demandeur?year=${selectedYear}`)
      return response.data
    },
    enabled: activeTab === 'administratif'
  })

  const { data: fluxMensuels, isLoading: isLoadingFlux } = useQuery<StatistiquesFluxMensuels>({
    queryKey: ['flux-mensuels', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/flux-mensuels?year=${selectedYear}`)
      return response.data
    },
    enabled: activeTab === 'administratif'
  })

  const { data: fluxHebdomadaires, isLoading: isLoadingFluxHebdo } = useQuery<StatistiquesFluxHebdomadaires>({
    queryKey: ['flux-hebdomadaires', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/flux-hebdomadaires?year=${selectedYear}`)
      return response.data
    },
    enabled: activeTab === 'administratif'
  })

  const { data: autoControle, isLoading: isLoadingAutoControle } = useQuery<StatistiquesAutoControle>({
    queryKey: ['auto-controle', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/auto-controle?year=${selectedYear}`)
      return response.data
    },
    enabled: activeTab === 'administratif'
  })

  const { data: anneesDisponibles } = useQuery<number[]>({
    queryKey: ['annees-disponibles'],
    queryFn: async () => {
      const response = await api.get('/statistiques/annees-disponibles')
      return response.data
    }
  })

  const yearOptions = anneesDisponibles || [currentYear]

  const renderTile = (id: MosaicKey) => {
    switch (id) {
      case 'general':
        return (
          <StatistiquesGeneralesComponent 
            stats={statsAdministratives?.generales} 
          />
        )
      case 'users':
        return (
          <StatistiquesUtilisateurComponent 
            users={statsAdministratives?.utilisateurs} 
          />
        )
      case 'bap':
        return <StatistiquesBAPComponent statsBAP={statsBAP} />
      case 'qualite':
        return <QualiteDemandeurComponent statsQualite={statsQualite} />
      case 'infractions':
        return <TypeInfractionComponent statsInfractions={statsInfractions} />
      case 'contexte':
        return <ContexteMissionnelComponent statsContexte={statsContexte} />
      case 'formation':
        return <FormationAdministrativeComponent statsFormation={statsFormation} />
      case 'branche':
        return <BrancheComponent statsBranche={statsBranche} />
      case 'statut':
        return <StatutDemandeurComponent statsStatut={statsStatut} />
      case 'autocontrole':
        return <AutoControleComponent autoControle={autoControle} />
      case 'fluxmensuels':
        return (
          <FluxMensuelsComponent 
            fluxMensuels={fluxMensuels} 
            selectedYear={selectedYear}
          />
        )
      case 'fluxhebdo':
        return (
          <FluxHebdomadairesComponent 
            fluxHebdomadaires={fluxHebdomadaires}
          />
        )
      default:
        return <div>Panneau non défini</div>
    }
  }

  if (isLoadingAdmin || isLoadingBAP || isLoadingQualite || isLoadingInfractions || isLoadingContexte || isLoadingFormation || isLoadingBranche || isLoadingStatut || isLoadingFlux || isLoadingFluxHebdo || isLoadingAutoControle) {
    return <LoadingSpinner />
  }

  return (
    <div className="h-full flex flex-col" style={{ height: '100vh' }}>
      <div className="flex-shrink-0 p-6 bg-white border-b">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Statistiques</h1>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <label htmlFor="year-select" className="text-sm font-medium text-gray-700">
              Année :
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="block w-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          {activeTab === 'administratif' && (
            <button
              onClick={resetLayout}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              title="Remettre la disposition par défaut"
            >
              Réinitialiser la disposition
            </button>
          )}
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('administratif')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'administratif'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Suivi Administratif
            </button>
            <button
              onClick={() => setActiveTab('budgetaire')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'budgetaire'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Suivi Budgétaire
            </button>
          </nav>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === 'administratif' ? (
          <div style={{ height: '100%', minHeight: '600px' }}>
            <Mosaic<MosaicKey>
              renderTile={(id, path) => (
                <MosaicWindow<MosaicKey> 
                  path={path}
                  createNode={() => 'general'}
                  title={
                    id === 'general' ? 'Statistiques générales' :
                    id === 'users' ? 'Utilisateurs' :
                    id === 'bap' ? 'BAP' :
                    id === 'qualite' ? 'Qualité du demandeur' :
                    id === 'infractions' ? 'Type d\'infraction' :
                    id === 'contexte' ? 'Contexte missionnel' :
                    id === 'formation' ? 'Formation administrative' :
                    id === 'branche' ? 'Branche' :
                    id === 'statut' ? 'Statut demandeur' :
                    id === 'autocontrole' ? 'Auto-contrôle' :
                    id === 'fluxmensuels' ? 'Flux mensuels' :
                    id === 'fluxhebdo' ? 'Flux hebdomadaires' :
                    'Panneau'
                  }
                  toolbarControls={[]}
                >
                  {renderTile(id)}
                </MosaicWindow>
              )}
              value={mosaicValue}
              onChange={handleMosaicChange}
              className="bg-gray-100"
            />
          </div>
        ) : (
          <div className="p-6 space-y-8 h-full overflow-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Suivi Budgétaire - {selectedYear}
              </h2>
              <p className="text-gray-600">
                Les statistiques budgétaires seront implémentées prochainement.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Statistiques