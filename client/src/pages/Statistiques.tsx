import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Responsive, WidthProvider, Layout } from 'react-grid-layout'
import { Listbox } from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline'
import { api } from '@/utils/api'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ExtractionMensuelleComponent from '@/components/statistiques/ExtractionMensuelleComponent'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

// Composant table réutilisable
const SimpleTable: React.FC<{
  headers: string[]
  children: React.ReactNode
}> = ({ headers, children }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {headers.map((header, index) => (
            <th key={index} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {children}
      </tbody>
    </table>
  </div>
)

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

interface ExtractionMensuelleData {
  mois: string
  ddesDePfVictimeUniquementToutesInfractions: number
  dontReservistes: number
  cumulDdeVictime: number
  dontCumulVictimeReservistes: number
  ddesDePfPourViolences: number
  dontDdesDePfPourViolencesSurReservistes: number
  cumulViolences: number
  dontCumulViolencesReservistes: number
}

interface ExtractionMensuelleStats {
  donneesParMois: ExtractionMensuelleData[]
  moyenneParMois: {
    ddesDePfVictimeUniquementToutesInfractions: number
    dontReservistes: number
    ddesDePfPourViolences: number
    dontDdesDePfPourViolencesSurReservistes: number
  }
  annee: number
}

interface StatistiquesBadges {
  badge: string
  nombreDemandes: number
  pourcentage: number
}

interface StatistiqueReponseBRPF {
  libelle: string
  nombre: number
  pourcentage: number
  type: 'agrement' | 'decision' | 'rejet_global' | 'motif_rejet'
}

interface StatistiquesReponseBRPF {
  statistiques: StatistiqueReponseBRPF[]
  totaux: {
    totalDecisions: number
    agrement: number
    rejet: number
  }
}

type PanelKey = 'general' | 'users' | 'bap' | 'qualite' | 'infractions' | 'contexte' | 'formation' | 'branche' | 'statut' | 'autocontrole' | 'fluxmensuels' | 'fluxhebdo' | 'extraction' | 'badges' | 'reponseBrpf'

const INITIAL_GRID_LAYOUTS = {
  lg: [
    { i: 'general', x: 0, y: 0, w: 3, h: 5, minW: 3, minH: 3 },
    { i: 'users', x: 3, y: 0, w: 9, h: 25, minW: 4, minH: 6 },
    { i: 'extraction', x: 0, y: 56, w: 8, h: 14, minW: 4, minH: 4 },
    { i: 'badges', x: 0, y: 14, w: 3, h: 6, minW: 3, minH: 4 },
    { i: 'reponseBrpf', x: 3, y: 56, w: 3, h: 14, minW: 3, minH: 8 },
    { i: 'bap', x: 6, y: 40, w: 2, h: 16, minW: 2, minH: 4 },
    { i: 'qualite', x: 0, y: 20, w: 3, h: 5, minW: 2, minH: 4 },
    { i: 'infractions', x: 3, y: 25, w: 5, h: 15, minW: 2, minH: 4 },
    { i: 'contexte', x: 0, y: 37, w: 3, h: 19, minW: 2, minH: 4 },
    { i: 'formation', x: 3, y: 40, w: 3, h: 16, minW: 2, minH: 4 },
    { i: 'branche', x: 8, y: 56, w: 4, h: 14, minW: 2, minH: 4 },
    { i: 'statut', x: 0, y: 25, w: 3, h: 12, minW: 2, minH: 4 },
    { i: 'autocontrole', x: 0, y: 5, w: 3, h: 9, minW: 2, minH: 6 },
    { i: 'fluxmensuels', x: 8, y: 25, w: 4, h: 15, minW: 4, minH: 6 },
    { i: 'fluxhebdo', x: 8, y: 40, w: 4, h: 16, minW: 4, minH: 8 }
  ],
  md: [
    { i: 'general', x: 0, y: 0, w: 5, h: 4, minW: 3, minH: 3 },
    { i: 'users', x: 5, y: 0, w: 5, h: 8, minW: 4, minH: 6 },
    { i: 'extraction', x: 0, y: 4, w: 5, h: 6, minW: 4, minH: 4 },
    { i: 'badges', x: 5, y: 8, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'reponseBrpf', x: 0, y: 10, w: 5, h: 8, minW: 3, minH: 6 },
    { i: 'bap', x: 5, y: 14, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'qualite', x: 0, y: 18, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'infractions', x: 5, y: 20, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'contexte', x: 0, y: 24, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'formation', x: 5, y: 26, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'branche', x: 0, y: 30, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'statut', x: 5, y: 32, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'autocontrole', x: 0, y: 36, w: 5, h: 8, minW: 3, minH: 6 },
    { i: 'fluxmensuels', x: 5, y: 38, w: 5, h: 8, minW: 4, minH: 6 },
    { i: 'fluxhebdo', x: 0, y: 44, w: 10, h: 10, minW: 6, minH: 8 }
  ],
  sm: [
    { i: 'general', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'users', x: 0, y: 4, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'extraction', x: 0, y: 12, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'badges', x: 0, y: 18, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'reponseBrpf', x: 0, y: 24, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'bap', x: 0, y: 32, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'qualite', x: 0, y: 38, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'infractions', x: 0, y: 44, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'contexte', x: 0, y: 50, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'formation', x: 0, y: 56, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'branche', x: 0, y: 62, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'statut', x: 0, y: 68, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'autocontrole', x: 0, y: 74, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'fluxmensuels', x: 0, y: 82, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'fluxhebdo', x: 0, y: 90, w: 6, h: 10, minW: 4, minH: 8 }
  ]
}

const StatistiquesGeneralesComponent: React.FC<{ 
  stats: StatistiquesGenerales | undefined
}> = ({ stats }) => (
  <div className="p-4 h-full overflow-auto">
    {stats && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {stats.demandesTotal}
          </div>
          <div className="text-xs text-gray-600">
            Reçues
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {stats.demandesTraitees}
          </div>
          <div className="text-xs text-gray-600">
            Traitées
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600 mb-1">
            {stats.demandesEnInstance}
          </div>
          <div className="text-xs text-gray-600">
            En instance
          </div>
        </div>
        <div className="bg-white rounded-lg shadow border border-gray-200 p-3 text-center">
          <div className="text-2xl font-bold text-red-600 mb-1">
            {stats.demandesNonAffectees}
          </div>
          <div className="text-xs text-gray-600">
            Non affectées
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
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rédacteurs</th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total PF</th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Propres</th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">BAP</th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">PJ</th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">AJ</th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">AJE</th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">REJET</th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">En cours</th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">En propre</th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Suivis BAP</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users?.map((user, index) => (
            <tr key={user.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="px-2 py-2">
                <div className="text-sm font-medium text-gray-900">
                  {user.prenom} {user.nom}
                </div>
                <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full mt-1">
                  {user.role}
                </span>
              </td>
              <td className="px-2 py-2 text-center text-sm text-gray-900">
                {user.demandesAttribuees}
              </td>
              <td className="px-2 py-2 text-center text-sm text-gray-900">
                {user.demandesPropres}
              </td>
              <td className="px-2 py-2 text-center text-sm text-gray-900">
                {user.demandesBAP}
              </td>
              <td className="px-2 py-2 text-center text-sm font-medium text-blue-600">
                {user.decisionsRepartition.PJ}
              </td>
              <td className="px-2 py-2 text-center text-sm font-medium text-purple-600">
                {user.decisionsRepartition.AJ}
              </td>
              <td className="px-2 py-2 text-center text-sm font-medium text-green-600">
                {user.decisionsRepartition.AJE}
              </td>
              <td className="px-2 py-2 text-center text-sm font-medium text-red-600">
                {user.decisionsRepartition.REJET}
              </td>
              <td className="px-2 py-2 text-center text-sm text-gray-900">
                {user.enCours}
              </td>
              <td className="px-2 py-2 text-center text-sm text-gray-900">
                {user.enCoursPropre}
              </td>
              <td className="px-2 py-2 text-center text-sm text-gray-900">
                {user.enCoursBAP}
              </td>
            </tr>
          ))}
          {users && users.length > 0 && (
            <tr className="bg-blue-50 border-t-2 border-blue-200">
              <td className="px-2 py-2">
                <div className="text-sm font-bold text-gray-900">
                  TOTAL
                </div>
              </td>
              <td className="px-2 py-2 text-center text-sm font-bold text-gray-900">
                {users.reduce((sum, user) => sum + user.demandesAttribuees, 0)}
              </td>
              <td className="px-2 py-2 text-center text-sm font-bold text-gray-900">
                {users.reduce((sum, user) => sum + user.demandesPropres, 0)}
              </td>
              <td className="px-2 py-2 text-center text-sm font-bold text-gray-900">
                {users.reduce((sum, user) => sum + user.demandesBAP, 0)}
              </td>
              <td className="px-2 py-2 text-center text-sm font-bold text-blue-600">
                {users.reduce((sum, user) => sum + user.decisionsRepartition.PJ, 0)}
              </td>
              <td className="px-2 py-2 text-center text-sm font-bold text-purple-600">
                {users.reduce((sum, user) => sum + user.decisionsRepartition.AJ, 0)}
              </td>
              <td className="px-2 py-2 text-center text-sm font-bold text-green-600">
                {users.reduce((sum, user) => sum + user.decisionsRepartition.AJE, 0)}
              </td>
              <td className="px-2 py-2 text-center text-sm font-bold text-red-600">
                {users.reduce((sum, user) => sum + user.decisionsRepartition.REJET, 0)}
              </td>
              <td className="px-2 py-2 text-center text-sm font-bold text-gray-900">
                {users.reduce((sum, user) => sum + user.enCours, 0)}
              </td>
              <td className="px-2 py-2 text-center text-sm font-bold text-gray-900">
                {users.reduce((sum, user) => sum + user.enCoursPropre, 0)}
              </td>
              <td className="px-2 py-2 text-center text-sm font-bold text-gray-900">
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
    <SimpleTable headers={['BAP', 'Demandes']}>
      {statsBAP && statsBAP.length > 0 ? (
        statsBAP.map((bap, index) => (
          <tr key={bap.nomBAP} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td className="px-2 py-2 text-sm font-medium text-gray-900">
              {bap.nomBAP}
            </td>
            <td className="px-2 py-2 text-center text-sm text-gray-900">
              {bap.nombreDemandes}
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={2} className="px-3 py-4 text-center text-sm text-gray-500">
            Aucune donnée disponible
          </td>
        </tr>
      )}
    </SimpleTable>
  </div>
)

const QualiteDemandeurComponent: React.FC<{ 
  statsQualite: StatistiquesQualiteDemandeur[] | undefined 
}> = ({ statsQualite }) => (
  <div className="p-4 h-full overflow-auto">
    <SimpleTable headers={['Qualité', 'Nbr demandes', 'Pourcentage']}>
      {statsQualite && statsQualite.length > 0 ? (
        statsQualite.map((stat, index) => (
          <tr key={stat.qualite} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td className="px-2 py-2 text-sm font-medium text-gray-900">
              {stat.qualite === 'VICTIME' ? 'Victime' : 'Mis en cause'}
            </td>
            <td className="px-2 py-2 text-center text-sm font-medium text-gray-900">
              {stat.nombreDemandes}
            </td>
            <td className="px-2 py-2 text-center text-sm font-medium text-gray-900">
              {stat.pourcentage.toFixed(1)}%
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={3} className="px-3 py-4 text-center text-sm text-gray-500">
            Aucune donnée disponible
          </td>
        </tr>
      )}
    </SimpleTable>
  </div>
)

const TypeInfractionComponent: React.FC<{ 
  statsInfractions: StatistiquesTypeInfraction[] | undefined 
}> = ({ statsInfractions }) => (
  <div className="p-4 h-full overflow-auto">
    <SimpleTable headers={['Type d\'infraction', 'Nbr demandes', 'Pourcentage']}>
      {statsInfractions && statsInfractions.length > 0 ? (
        statsInfractions.map((stat, index) => (
          <tr key={`${stat.qualificationInfraction}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td className="px-2 py-2 text-sm font-medium text-gray-900">
              {stat.qualificationInfraction || 'Non renseigné'}
            </td>
            <td className="px-2 py-2 text-center text-sm font-medium text-gray-900">
              {stat.nombreDemandes}
            </td>
            <td className="px-2 py-2 text-center text-sm font-medium text-gray-900">
              {stat.pourcentage.toFixed(1)}%
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={3} className="px-3 py-4 text-center text-sm text-gray-500">
            Aucune donnée disponible
          </td>
        </tr>
      )}
    </SimpleTable>
  </div>
)

const ContexteMissionnelComponent: React.FC<{ 
  statsContexte: StatistiquesContexteMissionnel[] | undefined 
}> = ({ statsContexte }) => {
  const heightPercentage = statsContexte && statsContexte.length > 0 ? (100 / statsContexte.length).toFixed(2) : '100';
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <table className="w-full h-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-gray-50 sticky top-0" style={{ height: 'auto' }}>
            <tr>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Contexte missionnel
              </th>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Nbr demandes
              </th>
              <th className="px-2 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                Pourcentage
              </th>
            </tr>
          </thead>
          <tbody className="bg-white h-full">
            {statsContexte && statsContexte.length > 0 ? (
              statsContexte.map((stat, index) => (
                <tr 
                  key={`${stat.contexteMissionnel}-${index}`} 
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100`}
                  style={{ height: `${heightPercentage}%` }}
                >
                  <td className="px-2 py-2 text-sm font-medium text-gray-900 align-middle">
                    {stat.contexteMissionnel || 'Non renseigné'}
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
                    {stat.nombreDemandes}
                  </td>
                  <td className="px-2 py-2 text-center text-sm font-medium text-gray-900 align-middle">
                    {stat.pourcentage.toFixed(1)}%
                  </td>
                </tr>
              ))
            ) : (
              <tr style={{ height: '100%' }}>
                <td colSpan={3} className="px-3 py-4 text-center text-sm text-gray-500 align-middle">
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

const FormationAdministrativeComponent: React.FC<{ 
  statsFormation: StatistiquesFormationAdministrative[] | undefined 
}> = ({ statsFormation }) => (
  <div className="p-4 h-full overflow-auto">
    <SimpleTable headers={['Formation administrative', 'Nbr demandes', 'Pourcentage']}>
      {statsFormation && statsFormation.length > 0 ? (
        statsFormation.map((stat, index) => (
          <tr key={`${stat.formationAdministrative}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td className="px-2 py-2 text-sm font-medium text-gray-900">
              {stat.formationAdministrative || 'Non renseigné'}
            </td>
            <td className="px-2 py-2 text-center text-sm font-medium text-gray-900">
              {stat.nombreDemandes}
            </td>
            <td className="px-2 py-2 text-center text-sm font-medium text-gray-900">
              {stat.pourcentage.toFixed(1)}%
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={3} className="px-3 py-4 text-center text-sm text-gray-500">
            Aucune donnée disponible
          </td>
        </tr>
      )}
    </SimpleTable>
  </div>
)

const BrancheComponent: React.FC<{ 
  statsBranche: StatistiquesBranche[] | undefined 
}> = ({ statsBranche }) => (
  <div className="p-4 h-full overflow-auto">
    <SimpleTable headers={['Branche', 'Nbr demandes', 'Pourcentage']}>
      {statsBranche && statsBranche.length > 0 ? (
        statsBranche.map((stat, index) => (
          <tr key={`${stat.branche}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td className="px-2 py-2 text-sm font-medium text-gray-900">
              {stat.branche || 'Non renseigné'}
            </td>
            <td className="px-2 py-2 text-center text-sm font-medium text-gray-900">
              {stat.nombreDemandes}
            </td>
            <td className="px-2 py-2 text-center text-sm font-medium text-gray-900">
              {stat.pourcentage.toFixed(1)}%
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={3} className="px-3 py-4 text-center text-sm text-gray-500">
            Aucune donnée disponible
          </td>
        </tr>
      )}
    </SimpleTable>
  </div>
)

const StatutDemandeurComponent: React.FC<{ 
  statsStatut: StatistiquesStatutDemandeur[] | undefined 
}> = ({ statsStatut }) => (
  <div className="p-4 h-full overflow-auto">
    <SimpleTable headers={['Statut demandeur', 'Nbr demandes', 'Pourcentage']}>
      {statsStatut && statsStatut.length > 0 ? (
        statsStatut.map((stat, index) => (
          <tr key={`${stat.statutDemandeur}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td className="px-2 py-2 text-sm font-medium text-gray-900">
              {stat.statutDemandeur || 'Non renseigné'}
            </td>
            <td className="px-2 py-2 text-center text-sm font-medium text-gray-900">
              {stat.nombreDemandes}
            </td>
            <td className="px-2 py-2 text-center text-sm font-medium text-gray-900">
              {stat.pourcentage.toFixed(1)}%
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={3} className="px-3 py-4 text-center text-sm text-gray-500">
            Aucune donnée disponible
          </td>
        </tr>
      )}
    </SimpleTable>
  </div>
)

const BadgesComponent: React.FC<{ 
  statsBadges: StatistiquesBadges[] | undefined 
}> = ({ statsBadges }) => (
  <div className="p-4 h-full overflow-auto">
    <SimpleTable headers={['Badge', 'Nbr demandes', 'Pourcentage']}>
      {statsBadges && statsBadges.length > 0 ? (
        statsBadges.map((stat, index) => (
          <tr key={`${stat.badge}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td className="px-2 py-2 text-sm font-medium text-gray-900">
              {stat.badge || 'Non renseigné'}
            </td>
            <td className="px-2 py-2 text-center text-sm font-medium text-gray-900">
              {stat.nombreDemandes}
            </td>
            <td className="px-2 py-2 text-center text-sm font-medium text-gray-900">
              {stat.pourcentage.toFixed(1)}%
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={3} className="px-3 py-4 text-center text-sm text-gray-500">
            Aucune donnée disponible
          </td>
        </tr>
      )}
    </SimpleTable>
  </div>
)

const ReponseBRPFComponent: React.FC<{ 
  statsReponseBRPF: StatistiquesReponseBRPF | undefined 
}> = ({ statsReponseBRPF }) => (
  <div className="p-4 h-full overflow-auto">
    <SimpleTable headers={['', 'Nbr', 'Pourcentage']}>
      {statsReponseBRPF && statsReponseBRPF.statistiques.length > 0 ? (
        statsReponseBRPF.statistiques.map((stat, index) => (
          <tr key={`${stat.libelle}-${index}`} className={`${
            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
          } ${
            stat.type === 'agrement' || stat.type === 'rejet_global' 
              ? 'border-t-2 border-gray-200 font-semibold' 
              : ''
          }`}>
            <td className={`px-2 py-2 text-sm text-gray-900 ${
              stat.type === 'motif_rejet' ? 'pl-6 text-gray-600' : 
              stat.type === 'decision' ? 'pl-6 font-normal text-gray-600' :
              stat.type === 'agrement' || stat.type === 'rejet_global' ? 'font-medium' : 
              'font-normal'
            }`}>
              {stat.libelle}
            </td>
            <td className="px-2 py-2 text-center text-sm font-medium text-gray-900">
              {stat.nombre}
            </td>
            <td className="px-2 py-2 text-center text-sm font-medium text-gray-900">
              {stat.pourcentage.toFixed(2)}%
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={3} className="px-3 py-4 text-center text-sm text-gray-500">
            Aucune donnée disponible
          </td>
        </tr>
      )}
    </SimpleTable>
  </div>
)

const AutoControleComponent: React.FC<{ 
  autoControle: StatistiquesAutoControle | undefined 
}> = ({ autoControle }) => (
  <div className="h-full flex flex-col">
    <div className="flex-1 overflow-auto">
      <table className="w-full h-full border-collapse" style={{ tableLayout: 'fixed' }}>
        <tbody className="bg-white h-full">
          <tr className="bg-white border-b border-gray-100" style={{ height: '14.28%' }}>
            <td className="px-2 py-2 text-sm font-medium text-gray-900 align-middle">
              PJ en attente de convention
            </td>
            <td className="px-2 py-2 text-right text-sm font-semibold text-red-600 align-middle">
              {autoControle?.pjEnAttenteConvention || 0}
            </td>
          </tr>
          <tr className="bg-gray-50 border-b border-gray-100" style={{ height: '14.28%' }}>
            <td className="px-2 py-2 text-sm font-medium text-gray-900 align-middle">
              Ancienneté moyenne non traités
            </td>
            <td className="px-2 py-2 text-right text-sm font-semibold text-gray-900 align-middle">
              {autoControle?.ancienneteMoyenneNonTraites?.toFixed(2) || '0,00'}
            </td>
          </tr>
          <tr className="bg-white border-b border-gray-100" style={{ height: '14.28%' }}>
            <td className="px-2 py-2 pl-6 text-sm text-gray-600 align-middle">
              Dont BAP
            </td>
            <td className="px-2 py-2 text-right text-sm font-semibold text-gray-900 align-middle">
              {autoControle?.ancienneteMoyenneBAP?.toFixed(2) || '0,00'}
            </td>
          </tr>
          <tr className="bg-gray-50 border-b border-gray-100" style={{ height: '14.28%' }}>
            <td className="px-2 py-2 pl-6 text-sm text-gray-600 align-middle">
              Dont BRPF
            </td>
            <td className="px-2 py-2 text-right text-sm font-semibold text-gray-900 align-middle">
              {autoControle?.ancienneteMoyenneBRP?.toFixed(2) || '0,00'}
            </td>
          </tr>
          <tr className="bg-white border-b border-gray-100" style={{ height: '14.28%' }}>
            <td className="px-2 py-2 text-sm font-medium text-gray-900 align-middle">
              Délai traitement moyen
            </td>
            <td className="px-2 py-2 text-right text-sm font-semibold text-gray-900 align-middle">
              {autoControle?.delaiTraitementMoyen?.toFixed(2) || '0,00'}
            </td>
          </tr>
          <tr className="bg-gray-50 border-b border-gray-100" style={{ height: '14.28%' }}>
            <td className="px-2 py-2 pl-6 text-sm text-gray-600 align-middle">
              Dont BAP
            </td>
            <td className="px-2 py-2 text-right text-sm font-semibold text-gray-900 align-middle">
              {autoControle?.delaiTraitementBAP?.toFixed(2) || '0,00'}
            </td>
          </tr>
          <tr className="bg-white" style={{ height: '14.28%' }}>
            <td className="px-2 py-2 pl-6 text-sm text-gray-600 align-middle">
              Dont BRPF
            </td>
            <td className="px-2 py-2 text-right text-sm font-semibold text-gray-900 align-middle">
              {autoControle?.delaiTraitementBRP?.toFixed(2) || '0,00'}
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
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mois</th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
              Entrants {selectedYear}
            </th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-red-50">
              Sortants {selectedYear}
            </th>
            <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">
              Entrants {selectedYear - 1}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {fluxMensuels && fluxMensuels.fluxMensuels.length > 0 ? (
            fluxMensuels.fluxMensuels.map((flux, index) => (
              <tr key={flux.mois} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-2 py-1 font-medium text-gray-900">
                  {flux.mois}
                </td>
                <td className="px-2 py-1 text-center text-sm text-gray-900">
                  {flux.entrantsAnnee}
                </td>
                <td className="px-2 py-1 text-center text-sm text-gray-900">
                  {flux.sortantsAnnee}
                </td>
                <td className="px-2 py-1 text-center text-sm text-gray-600">
                  {flux.entrantsAnneePrecedente}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="px-3 py-4 text-center text-sm text-gray-500">
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
  const [isReorderMode, setIsReorderMode] = useState<boolean>(false)
  
  // Load saved layout from localStorage or use default
  const [layouts, setLayouts] = useState(() => {
    try {
      const savedLayouts = localStorage.getItem('pf360-statistiques-grid-layouts')
      return savedLayouts ? JSON.parse(savedLayouts) : INITIAL_GRID_LAYOUTS
    } catch {
      return INITIAL_GRID_LAYOUTS
    }
  })

  // Handle layout changes and save to localStorage
  const handleLayoutChange = (_layout: Layout[], layouts: { [key: string]: Layout[] }) => {
    setLayouts(layouts)
    try {
      localStorage.setItem('pf360-statistiques-grid-layouts', JSON.stringify(layouts))
    } catch (error) {
      console.warn('Failed to save layouts to localStorage:', error)
    }
  }

  // Reset layout to default
  const resetLayout = () => {
    setLayouts(INITIAL_GRID_LAYOUTS)
    try {
      localStorage.removeItem('pf360-statistiques-grid-layouts')
    } catch (error) {
      console.warn('Failed to remove layouts from localStorage:', error)
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

  const { data: extractionMensuelle, isLoading: isLoadingExtraction } = useQuery<ExtractionMensuelleStats>({
    queryKey: ['extraction-mensuelle', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/extraction-mensuelle?year=${selectedYear}`)
      return response.data
    },
    enabled: activeTab === 'administratif'
  })

  const { data: statsBadges, isLoading: isLoadingBadges } = useQuery<StatistiquesBadges[]>({
    queryKey: ['statistiques-badges', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/badges?year=${selectedYear}`)
      return response.data
    },
    enabled: activeTab === 'administratif'
  })

  const { data: statsReponseBRPF, isLoading: isLoadingReponseBRPF } = useQuery<StatistiquesReponseBRPF>({
    queryKey: ['statistiques-reponse-brpf', selectedYear],
    queryFn: async () => {
      const response = await api.get(`/statistiques/reponse-brpf?year=${selectedYear}`)
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

  const getPanelTitle = (id: PanelKey): string => {
    switch (id) {
      case 'general': return 'Demandes'
      case 'users': return 'Utilisateurs'
      case 'bap': return 'BAP'
      case 'qualite': return 'Qualité du demandeur'
      case 'infractions': return 'Type d\'infraction'
      case 'contexte': return 'Contexte missionnel'
      case 'formation': return 'Formation administrative'
      case 'branche': return 'Branche'
      case 'statut': return 'Statut demandeur'
      case 'badges': return 'Badges'
      case 'reponseBrpf': return 'Réponse BRPF'
      case 'autocontrole': return 'Auto-contrôle'
      case 'fluxmensuels': return 'Flux mensuels'
      case 'fluxhebdo': return 'Flux hebdomadaires'
      case 'extraction': return 'Extraction mensuelle pour BAA / SP'
      default: return 'Panneau'
    }
  }

  const renderPanel = (id: PanelKey) => {
    let content
    switch (id) {
      case 'general':
        content = <StatistiquesGeneralesComponent stats={statsAdministratives?.generales} />
        break
      case 'users':
        content = <StatistiquesUtilisateurComponent users={statsAdministratives?.utilisateurs} />
        break
      case 'bap':
        content = <StatistiquesBAPComponent statsBAP={statsBAP} />
        break
      case 'qualite':
        content = <QualiteDemandeurComponent statsQualite={statsQualite} />
        break
      case 'infractions':
        content = <TypeInfractionComponent statsInfractions={statsInfractions} />
        break
      case 'contexte':
        content = <ContexteMissionnelComponent statsContexte={statsContexte} />
        break
      case 'formation':
        content = <FormationAdministrativeComponent statsFormation={statsFormation} />
        break
      case 'branche':
        content = <BrancheComponent statsBranche={statsBranche} />
        break
      case 'statut':
        content = <StatutDemandeurComponent statsStatut={statsStatut} />
        break
      case 'badges':
        content = <BadgesComponent statsBadges={statsBadges} />
        break
      case 'reponseBrpf':
        content = <ReponseBRPFComponent statsReponseBRPF={statsReponseBRPF} />
        break
      case 'autocontrole':
        content = <AutoControleComponent autoControle={autoControle} />
        break
      case 'fluxmensuels':
        content = <FluxMensuelsComponent fluxMensuels={fluxMensuels} selectedYear={selectedYear} />
        break
      case 'fluxhebdo':
        content = <FluxHebdomadairesComponent fluxHebdomadaires={fluxHebdomadaires} />
        break
      case 'extraction':
        content = <ExtractionMensuelleComponent stats={extractionMensuelle} />
        break
      default:
        content = <div>Panneau non défini</div>
    }

    // L'encart extraction gère sa propre barre de titre avec le bouton de capture
    if (id === 'extraction') {
      return (
        <div key={id} className="bg-white rounded-lg shadow border border-gray-200 h-full">
          {content}
        </div>
      )
    }

    return (
      <div key={id} className="bg-white rounded-lg shadow border border-gray-200 h-full flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 font-semibold text-sm text-gray-900">
          {getPanelTitle(id)}
        </div>
        <div className="flex-1 overflow-hidden">
          {content}
        </div>
      </div>
    )
  }

  if (isLoadingAdmin || isLoadingBAP || isLoadingQualite || isLoadingInfractions || isLoadingContexte || isLoadingFormation || isLoadingBranche || isLoadingStatut || isLoadingFlux || isLoadingFluxHebdo || isLoadingAutoControle || isLoadingExtraction || isLoadingBadges || isLoadingReponseBRPF) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Statistiques</h1>
        <p className="mt-1 text-sm text-gray-600">
          Suivi administratif et budgétaire des demandes
        </p>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Année
          </label>
          <Listbox value={selectedYear} onChange={setSelectedYear}>
            <div className="relative">
              <Listbox.Button className="relative w-32 cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm">
                <span className="block truncate">{selectedYear}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>
              <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-sm">
                {yearOptions.map((year) => (
                  <Listbox.Option
                    key={year}
                    value={year}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-3 pr-9 ${
                        active ? 'bg-blue-600 text-white' : 'text-gray-900'
                      }`
                    }
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          {year}
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                              active ? 'text-white' : 'text-blue-600'
                            }`}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>
        
        {activeTab === 'administratif' && (
          <div className="flex gap-3">
            <button
              onClick={() => setIsReorderMode(!isReorderMode)}
              className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isReorderMode
                  ? 'border-blue-500 text-blue-700 bg-blue-50 hover:bg-blue-100'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
              title={isReorderMode ? "Désactiver le mode réorganisation" : "Activer le mode réorganisation"}
            >
              {isReorderMode ? 'Désactiver la réorganisation' : 'Réorganiser'}
            </button>
            <button
              onClick={resetLayout}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              title="Remettre la disposition par défaut"
            >
              Réinitialiser la disposition
            </button>
          </div>
        )}
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('administratif')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'administratif'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Suivi Administratif
            </button>
            <button
              onClick={() => setActiveTab('budgetaire')}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
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

      {activeTab === 'administratif' ? (
        <div style={{ height: 'calc(100vh - 280px)', minHeight: '600px' }}>
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            onLayoutChange={handleLayoutChange}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={30}
            isDraggable={isReorderMode}
            isResizable={isReorderMode}
            compactType="vertical"
            preventCollision={false}
          >
            {(['general', 'users', 'extraction', 'badges', 'reponseBrpf', 'bap', 'qualite', 'infractions', 'contexte', 'formation', 'branche', 'statut', 'autocontrole', 'fluxmensuels', 'fluxhebdo'] as PanelKey[]).map((panelId) => (
              <div key={panelId}>
                {renderPanel(panelId)}
              </div>
            ))}
          </ResponsiveGridLayout>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Suivi Budgétaire - {selectedYear}
            </h2>
            <p className="text-gray-600">
              Les statistiques budgétaires seront implémentées prochainement.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Statistiques