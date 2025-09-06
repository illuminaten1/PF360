import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Responsive, WidthProvider, Layout } from 'react-grid-layout'
import { Card, Elevation, H5, H1, HTMLTable, Tag, Button, HTMLSelect } from '@blueprintjs/core'
import { api } from '@/utils/api'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ExtractionMensuelleComponent from '@/components/statistiques/ExtractionMensuelleComponent'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

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

type PanelKey = 'general' | 'users' | 'bap' | 'qualite' | 'infractions' | 'contexte' | 'formation' | 'branche' | 'statut' | 'autocontrole' | 'fluxmensuels' | 'fluxhebdo' | 'extraction'

const INITIAL_GRID_LAYOUTS = {
  lg: [
    { i: 'general', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'users', x: 6, y: 0, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'extraction', x: 0, y: 4, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'bap', x: 0, y: 10, w: 3, h: 6, minW: 2, minH: 4 },
    { i: 'qualite', x: 3, y: 10, w: 3, h: 6, minW: 2, minH: 4 },
    { i: 'infractions', x: 6, y: 8, w: 3, h: 6, minW: 2, minH: 4 },
    { i: 'contexte', x: 9, y: 8, w: 3, h: 6, minW: 2, minH: 4 },
    { i: 'formation', x: 0, y: 16, w: 3, h: 6, minW: 2, minH: 4 },
    { i: 'branche', x: 3, y: 16, w: 3, h: 6, minW: 2, minH: 4 },
    { i: 'statut', x: 6, y: 14, w: 3, h: 6, minW: 2, minH: 4 },
    { i: 'autocontrole', x: 9, y: 14, w: 3, h: 8, minW: 2, minH: 6 },
    { i: 'fluxmensuels', x: 0, y: 22, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'fluxhebdo', x: 6, y: 20, w: 6, h: 10, minW: 4, minH: 8 }
  ],
  md: [
    { i: 'general', x: 0, y: 0, w: 5, h: 4, minW: 3, minH: 3 },
    { i: 'users', x: 5, y: 0, w: 5, h: 8, minW: 4, minH: 6 },
    { i: 'extraction', x: 0, y: 4, w: 5, h: 6, minW: 4, minH: 4 },
    { i: 'bap', x: 0, y: 10, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'qualite', x: 5, y: 8, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'infractions', x: 0, y: 16, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'contexte', x: 5, y: 14, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'formation', x: 0, y: 22, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'branche', x: 5, y: 20, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'statut', x: 0, y: 28, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'autocontrole', x: 5, y: 26, w: 5, h: 8, minW: 3, minH: 6 },
    { i: 'fluxmensuels', x: 0, y: 34, w: 10, h: 8, minW: 6, minH: 6 },
    { i: 'fluxhebdo', x: 0, y: 42, w: 10, h: 10, minW: 6, minH: 8 }
  ],
  sm: [
    { i: 'general', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    { i: 'users', x: 0, y: 4, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'extraction', x: 0, y: 12, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'bap', x: 0, y: 18, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'qualite', x: 0, y: 24, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'infractions', x: 0, y: 30, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'contexte', x: 0, y: 36, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'formation', x: 0, y: 42, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'branche', x: 0, y: 48, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'statut', x: 0, y: 54, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'autocontrole', x: 0, y: 60, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'fluxmensuels', x: 0, y: 68, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'fluxhebdo', x: 0, y: 76, w: 6, h: 10, minW: 4, minH: 8 }
  ]
}

const StatistiquesGeneralesComponent: React.FC<{ 
  stats: StatistiquesGenerales | undefined
}> = ({ stats }) => (
  <div className="p-4 h-full overflow-auto">
    {stats && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        <Card elevation={Elevation.ONE} style={{ textAlign: 'center', padding: '12px' }}>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#137CBD', margin: '0 0 4px 0' }}>
            {stats.demandesTotal}
          </div>
          <div style={{ fontSize: '12px', color: '#5C7080', margin: 0 }}>
            Demandes reçues
          </div>
        </Card>
        <Card elevation={Elevation.ONE} style={{ textAlign: 'center', padding: '12px' }}>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#0F9960', margin: '0 0 4px 0' }}>
            {stats.demandesTraitees}
          </div>
          <div style={{ fontSize: '12px', color: '#5C7080', margin: 0 }}>
            Demandes traitées
          </div>
        </Card>
        <Card elevation={Elevation.ONE} style={{ textAlign: 'center', padding: '12px' }}>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#D9822B', margin: '0 0 4px 0' }}>
            {stats.demandesEnInstance}
          </div>
          <div style={{ fontSize: '12px', color: '#5C7080', margin: 0 }}>
            Demandes en instance
          </div>
        </Card>
        <Card elevation={Elevation.ONE} style={{ textAlign: 'center', padding: '12px' }}>
          <div style={{ fontSize: '24px', fontWeight: 600, color: '#DB3737', margin: '0 0 4px 0' }}>
            {stats.demandesNonAffectees}
          </div>
          <div style={{ fontSize: '12px', color: '#5C7080', margin: 0 }}>
            Demandes non affectées
          </div>
        </Card>
      </div>
    )}
  </div>
)

const StatistiquesUtilisateurComponent: React.FC<{ 
  users: StatistiquesUtilisateur[] | undefined 
}> = ({ users }) => (
  <div className="p-4 h-full overflow-auto">
    <HTMLTable 
      striped 
      interactive
      style={{ width: '100%', fontSize: '13px' }}
    >
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '8px' }}>Rédacteurs</th>
          <th style={{ textAlign: 'center', padding: '8px' }}>Total PF</th>
          <th style={{ textAlign: 'center', padding: '8px' }}>Propres</th>
          <th style={{ textAlign: 'center', padding: '8px' }}>BAP</th>
          <th style={{ textAlign: 'center', padding: '8px' }}>PJ</th>
          <th style={{ textAlign: 'center', padding: '8px' }}>AJ</th>
          <th style={{ textAlign: 'center', padding: '8px' }}>AJE</th>
          <th style={{ textAlign: 'center', padding: '8px' }}>REJET</th>
          <th style={{ textAlign: 'center', padding: '8px' }}>En cours</th>
          <th style={{ textAlign: 'center', padding: '8px' }}>En propre</th>
          <th style={{ textAlign: 'center', padding: '8px' }}>Suivis BAP</th>
        </tr>
      </thead>
      <tbody>
        {users?.map((user) => (
          <tr key={user.id}>
            <td style={{ padding: '8px' }}>
              <div style={{ fontWeight: 500 }}>
                {user.prenom} {user.nom}
              </div>
              <Tag minimal style={{ fontSize: '11px', marginTop: '4px' }}>
                {user.role}
              </Tag>
            </td>
            <td style={{ padding: '8px', textAlign: 'center' }}>
              {user.demandesAttribuees}
            </td>
            <td style={{ padding: '8px', textAlign: 'center' }}>
              {user.demandesPropres}
            </td>
            <td style={{ padding: '8px', textAlign: 'center' }}>
              {user.demandesBAP}
            </td>
            <td style={{ padding: '8px', textAlign: 'center', color: '#137CBD', fontWeight: 500 }}>
              {user.decisionsRepartition.PJ}
            </td>
            <td style={{ padding: '8px', textAlign: 'center', color: '#9D5FC2', fontWeight: 500 }}>
              {user.decisionsRepartition.AJ}
            </td>
            <td style={{ padding: '8px', textAlign: 'center', color: '#0F9960', fontWeight: 500 }}>
              {user.decisionsRepartition.AJE}
            </td>
            <td style={{ padding: '8px', textAlign: 'center', color: '#DB3737', fontWeight: 500 }}>
              {user.decisionsRepartition.REJET}
            </td>
            <td style={{ padding: '8px', textAlign: 'center' }}>
              {user.enCours}
            </td>
            <td style={{ padding: '8px', textAlign: 'center' }}>
              {user.enCoursPropre}
            </td>
            <td style={{ padding: '8px', textAlign: 'center' }}>
              {user.enCoursBAP}
            </td>
          </tr>
        ))}
        {users && users.length > 0 && (
          <tr style={{ backgroundColor: '#F5F8FA', borderTop: '2px solid #CED9E0' }}>
            <td style={{ padding: '8px' }}>
              <div style={{ fontWeight: 'bold' }}>
                TOTAL
              </div>
            </td>
            <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
              {users.reduce((sum, user) => sum + user.demandesAttribuees, 0)}
            </td>
            <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
              {users.reduce((sum, user) => sum + user.demandesPropres, 0)}
            </td>
            <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
              {users.reduce((sum, user) => sum + user.demandesBAP, 0)}
            </td>
            <td style={{ padding: '8px', textAlign: 'center', color: '#137CBD', fontWeight: 'bold' }}>
              {users.reduce((sum, user) => sum + user.decisionsRepartition.PJ, 0)}
            </td>
            <td style={{ padding: '8px', textAlign: 'center', color: '#9D5FC2', fontWeight: 'bold' }}>
              {users.reduce((sum, user) => sum + user.decisionsRepartition.AJ, 0)}
            </td>
            <td style={{ padding: '8px', textAlign: 'center', color: '#0F9960', fontWeight: 'bold' }}>
              {users.reduce((sum, user) => sum + user.decisionsRepartition.AJE, 0)}
            </td>
            <td style={{ padding: '8px', textAlign: 'center', color: '#DB3737', fontWeight: 'bold' }}>
              {users.reduce((sum, user) => sum + user.decisionsRepartition.REJET, 0)}
            </td>
            <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
              {users.reduce((sum, user) => sum + user.enCours, 0)}
            </td>
            <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
              {users.reduce((sum, user) => sum + user.enCoursPropre, 0)}
            </td>
            <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>
              {users.reduce((sum, user) => sum + user.enCoursBAP, 0)}
            </td>
          </tr>
        )}
      </tbody>
    </HTMLTable>
  </div>
)

const StatistiquesBAPComponent: React.FC<{ 
  statsBAP: StatistiqueBAP[] | undefined 
}> = ({ statsBAP }) => (
  <div className="p-4 h-full overflow-auto">
    <HTMLTable 
      striped 
      interactive
      style={{ width: '100%', fontSize: '13px' }}
    >
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '8px' }}>BAP</th>
          <th style={{ textAlign: 'center', padding: '8px' }}>Demandes</th>
        </tr>
      </thead>
      <tbody>
        {statsBAP && statsBAP.length > 0 ? (
          statsBAP.map((bap) => (
            <tr key={bap.nomBAP}>
              <td style={{ padding: '8px', fontWeight: 500 }}>
                {bap.nomBAP}
              </td>
              <td style={{ padding: '8px', textAlign: 'center' }}>
                {bap.nombreDemandes}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={2} style={{ padding: '12px 8px', textAlign: 'center', color: '#5C7080' }}>
              Aucune donnée disponible
            </td>
          </tr>
        )}
      </tbody>
    </HTMLTable>
  </div>
)

const QualiteDemandeurComponent: React.FC<{ 
  statsQualite: StatistiquesQualiteDemandeur[] | undefined 
}> = ({ statsQualite }) => (
  <div className="p-4 h-full overflow-auto">
    <HTMLTable 
      striped 
      interactive
      style={{ width: '100%', fontSize: '13px' }}
    >
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '8px' }}>Qualité</th>
          <th style={{ textAlign: 'center', padding: '8px' }}>Nbr demandes</th>
          <th style={{ textAlign: 'center', padding: '8px' }}>Pourcentage</th>
        </tr>
      </thead>
      <tbody>
        {statsQualite && statsQualite.length > 0 ? (
          statsQualite.map((stat) => (
            <tr key={stat.qualite}>
              <td style={{ padding: '8px', fontWeight: 500 }}>
                {stat.qualite === 'VICTIME' ? 'Victime' : 'Mis en cause'}
              </td>
              <td style={{ padding: '8px', textAlign: 'center', fontWeight: 500 }}>
                {stat.nombreDemandes}
              </td>
              <td style={{ padding: '8px', textAlign: 'center', fontWeight: 500 }}>
                {stat.pourcentage.toFixed(1)}%
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={3} style={{ padding: '12px 8px', textAlign: 'center', color: '#5C7080' }}>
              Aucune donnée disponible
            </td>
          </tr>
        )}
      </tbody>
    </HTMLTable>
  </div>
)

const TypeInfractionComponent: React.FC<{ 
  statsInfractions: StatistiquesTypeInfraction[] | undefined 
}> = ({ statsInfractions }) => (
  <div className="p-4 h-full overflow-auto">
    <HTMLTable 
      striped 
      interactive
      style={{ width: '100%', fontSize: '13px' }}
    >
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '8px' }}>Type d&apos;infraction</th>
          <th style={{ textAlign: 'center', padding: '8px' }}>Nbr demandes</th>
          <th style={{ textAlign: 'center', padding: '8px' }}>Pourcentage</th>
        </tr>
      </thead>
      <tbody>
        {statsInfractions && statsInfractions.length > 0 ? (
          statsInfractions.map((stat, index) => (
            <tr key={`${stat.qualificationInfraction}-${index}`}>
              <td style={{ padding: '8px', fontWeight: 500 }}>
                {stat.qualificationInfraction || 'Non renseigné'}
              </td>
              <td style={{ padding: '8px', textAlign: 'center', fontWeight: 500 }}>
                {stat.nombreDemandes}
              </td>
              <td style={{ padding: '8px', textAlign: 'center', fontWeight: 500 }}>
                {stat.pourcentage.toFixed(1)}%
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={3} style={{ padding: '12px 8px', textAlign: 'center', color: '#5C7080' }}>
              Aucune donnée disponible
            </td>
          </tr>
        )}
      </tbody>
    </HTMLTable>
  </div>
)

const ContexteMissionnelComponent: React.FC<{ 
  statsContexte: StatistiquesContexteMissionnel[] | undefined 
}> = ({ statsContexte }) => (
  <div className="p-4 h-full overflow-auto">
    <HTMLTable 
      striped 
      interactive
      style={{ width: '100%', fontSize: '13px' }}
    >
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '8px' }}>Contexte missionnel</th>
          <th style={{ textAlign: 'center', padding: '8px' }}>Nbr demandes</th>
          <th style={{ textAlign: 'center', padding: '8px' }}>Pourcentage</th>
        </tr>
      </thead>
      <tbody>
        {statsContexte && statsContexte.length > 0 ? (
          statsContexte.map((stat, index) => (
            <tr key={`${stat.contexteMissionnel}-${index}`}>
              <td style={{ padding: '8px', fontWeight: 500 }}>
                {stat.contexteMissionnel || 'Non renseigné'}
              </td>
              <td style={{ padding: '8px', textAlign: 'center', fontWeight: 500 }}>
                {stat.nombreDemandes}
              </td>
              <td style={{ padding: '8px', textAlign: 'center', fontWeight: 500 }}>
                {stat.pourcentage.toFixed(1)}%
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={3} style={{ padding: '12px 8px', textAlign: 'center', color: '#5C7080' }}>
              Aucune donnée disponible
            </td>
          </tr>
        )}
      </tbody>
    </HTMLTable>
  </div>
)

const FormationAdministrativeComponent: React.FC<{ 
  statsFormation: StatistiquesFormationAdministrative[] | undefined 
}> = ({ statsFormation }) => (
  <div className="p-4 h-full overflow-auto">
    <HTMLTable 
      striped 
      interactive
      style={{ width: '100%', fontSize: '13px' }}
    >
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '8px' }}>Formation administrative</th>
          <th style={{ textAlign: 'center', padding: '8px' }}>Nbr demandes</th>
          <th style={{ textAlign: 'center', padding: '8px' }}>Pourcentage</th>
        </tr>
      </thead>
      <tbody>
        {statsFormation && statsFormation.length > 0 ? (
          statsFormation.map((stat, index) => (
            <tr key={`${stat.formationAdministrative}-${index}`}>
              <td style={{ padding: '8px', fontWeight: 500 }}>
                {stat.formationAdministrative || 'Non renseigné'}
              </td>
              <td style={{ padding: '8px', textAlign: 'center', fontWeight: 500 }}>
                {stat.nombreDemandes}
              </td>
              <td style={{ padding: '8px', textAlign: 'center', fontWeight: 500 }}>
                {stat.pourcentage.toFixed(1)}%
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={3} style={{ padding: '12px 8px', textAlign: 'center', color: '#5C7080' }}>
              Aucune donnée disponible
            </td>
          </tr>
        )}
      </tbody>
    </HTMLTable>
  </div>
)

const BrancheComponent: React.FC<{ 
  statsBranche: StatistiquesBranche[] | undefined 
}> = ({ statsBranche }) => (
  <div className="p-4 h-full overflow-auto">
    <HTMLTable 
      striped 
      interactive
      style={{ width: '100%', fontSize: '13px' }}
    >
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '8px' }}>Branche</th>
          <th style={{ textAlign: 'center', padding: '8px' }}>Nbr demandes</th>
          <th style={{ textAlign: 'center', padding: '8px' }}>Pourcentage</th>
        </tr>
      </thead>
      <tbody>
        {statsBranche && statsBranche.length > 0 ? (
          statsBranche.map((stat, index) => (
            <tr key={`${stat.branche}-${index}`}>
              <td style={{ padding: '8px', fontWeight: 500 }}>
                {stat.branche || 'Non renseigné'}
              </td>
              <td style={{ padding: '8px', textAlign: 'center', fontWeight: 500 }}>
                {stat.nombreDemandes}
              </td>
              <td style={{ padding: '8px', textAlign: 'center', fontWeight: 500 }}>
                {stat.pourcentage.toFixed(1)}%
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={3} style={{ padding: '12px 8px', textAlign: 'center', color: '#5C7080' }}>
              Aucune donnée disponible
            </td>
          </tr>
        )}
      </tbody>
    </HTMLTable>
  </div>
)

const StatutDemandeurComponent: React.FC<{ 
  statsStatut: StatistiquesStatutDemandeur[] | undefined 
}> = ({ statsStatut }) => (
  <div className="p-4 h-full overflow-auto">
    <HTMLTable 
      striped 
      interactive
      style={{ width: '100%', fontSize: '13px' }}
    >
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '8px' }}>Statut demandeur</th>
          <th style={{ textAlign: 'center', padding: '8px' }}>Nbr demandes</th>
          <th style={{ textAlign: 'center', padding: '8px' }}>Pourcentage</th>
        </tr>
      </thead>
      <tbody>
        {statsStatut && statsStatut.length > 0 ? (
          statsStatut.map((stat, index) => (
            <tr key={`${stat.statutDemandeur}-${index}`}>
              <td style={{ padding: '8px', fontWeight: 500 }}>
                {stat.statutDemandeur || 'Non renseigné'}
              </td>
              <td style={{ padding: '8px', textAlign: 'center', fontWeight: 500 }}>
                {stat.nombreDemandes}
              </td>
              <td style={{ padding: '8px', textAlign: 'center', fontWeight: 500 }}>
                {stat.pourcentage.toFixed(1)}%
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={3} style={{ padding: '12px 8px', textAlign: 'center', color: '#5C7080' }}>
              Aucune donnée disponible
            </td>
          </tr>
        )}
      </tbody>
    </HTMLTable>
  </div>
)

const AutoControleComponent: React.FC<{ 
  autoControle: StatistiquesAutoControle | undefined 
}> = ({ autoControle }) => (
  <div className="p-4 h-full overflow-auto">
    <HTMLTable 
      striped 
      interactive
      style={{ width: '100%', fontSize: '13px' }}
    >
      <tbody>
        <tr>
          <td style={{ padding: '8px', fontWeight: 500 }}>
            PJ en attente de convention
          </td>
          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600, color: '#DB3737' }}>
            {autoControle?.pjEnAttenteConvention || 0}
          </td>
        </tr>
        <tr>
          <td style={{ padding: '8px', fontWeight: 500 }}>
            Ancienneté moyenne non traités
          </td>
          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>
            {autoControle?.ancienneteMoyenneNonTraites?.toFixed(2) || '0,00'}
          </td>
        </tr>
        <tr>
          <td style={{ padding: '8px 8px 8px 24px', color: '#5C7080' }}>
            Dont BAP
          </td>
          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>
            {autoControle?.ancienneteMoyenneBAP?.toFixed(2) || '0,00'}
          </td>
        </tr>
        <tr>
          <td style={{ padding: '8px 8px 8px 24px', color: '#5C7080' }}>
            Dont BRP
          </td>
          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>
            {autoControle?.ancienneteMoyenneBRP?.toFixed(2) || '0,00'}
          </td>
        </tr>
        <tr>
          <td style={{ padding: '8px', fontWeight: 500 }}>
            Délai traitement moyen
          </td>
          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>
            {autoControle?.delaiTraitementMoyen?.toFixed(2) || '0,00'}
          </td>
        </tr>
        <tr>
          <td style={{ padding: '8px 8px 8px 24px', color: '#5C7080' }}>
            Dont BAP
          </td>
          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>
            {autoControle?.delaiTraitementBAP?.toFixed(2) || '0,00'}
          </td>
        </tr>
        <tr>
          <td style={{ padding: '8px 8px 8px 24px', color: '#5C7080' }}>
            Dont BRPF
          </td>
          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>
            {autoControle?.delaiTraitementBRP?.toFixed(2) || '0,00'}
          </td>
        </tr>
      </tbody>
    </HTMLTable>
  </div>
)

const FluxMensuelsComponent: React.FC<{ 
  fluxMensuels: StatistiquesFluxMensuels | undefined
  selectedYear: number 
}> = ({ fluxMensuels, selectedYear }) => (
  <div className="p-4 h-full overflow-auto">
    <HTMLTable 
      striped 
      interactive
      style={{ width: '100%', fontSize: '13px' }}
    >
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '8px' }}>Mois</th>
          <th style={{ textAlign: 'center', padding: '8px', backgroundColor: '#E1F5FE' }}>
            Entrants {selectedYear}
          </th>
          <th style={{ textAlign: 'center', padding: '8px', backgroundColor: '#FFEBEE' }}>
            Sortants {selectedYear}
          </th>
          <th style={{ textAlign: 'center', padding: '8px', backgroundColor: '#F5F5F5' }}>
            Entrants {selectedYear - 1}
          </th>
        </tr>
      </thead>
      <tbody>
        {fluxMensuels && fluxMensuels.fluxMensuels.length > 0 ? (
          fluxMensuels.fluxMensuels.map((flux) => (
            <tr key={flux.mois}>
              <td style={{ padding: '6px 8px', fontWeight: 500 }}>
                {flux.mois}
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                {flux.entrantsAnnee}
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                {flux.sortantsAnnee}
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'center', color: '#5C7080' }}>
                {flux.entrantsAnneePrecedente}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={4} style={{ padding: '12px 8px', textAlign: 'center', color: '#5C7080' }}>
              Aucune donnée disponible
            </td>
          </tr>
        )}
      </tbody>
    </HTMLTable>
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
  const [layouts, setLayouts] = useState(() => {
    try {
      const savedLayouts = localStorage.getItem('pf360-statistiques-grid-layouts')
      return savedLayouts ? JSON.parse(savedLayouts) : INITIAL_GRID_LAYOUTS
    } catch {
      return INITIAL_GRID_LAYOUTS
    }
  })

  // Handle layout changes and save to localStorage
  const handleLayoutChange = (layout: Layout[], layouts: any) => {
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
      case 'general': return 'Statistiques générales'
      case 'users': return 'Utilisateurs'
      case 'bap': return 'BAP'
      case 'qualite': return 'Qualité du demandeur'
      case 'infractions': return 'Type d\'infraction'
      case 'contexte': return 'Contexte missionnel'
      case 'formation': return 'Formation administrative'
      case 'branche': return 'Branche'
      case 'statut': return 'Statut demandeur'
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

    return (
      <Card key={id} elevation={Elevation.ONE} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          padding: '12px 16px', 
          borderBottom: '1px solid #E1E8ED', 
          backgroundColor: '#F5F8FA',
          fontWeight: 600,
          fontSize: '14px'
        }}>
          {getPanelTitle(id)}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {content}
        </div>
      </Card>
    )
  }

  if (isLoadingAdmin || isLoadingBAP || isLoadingQualite || isLoadingInfractions || isLoadingContexte || isLoadingFormation || isLoadingBranche || isLoadingStatut || isLoadingFlux || isLoadingFluxHebdo || isLoadingAutoControle || isLoadingExtraction) {
    return <LoadingSpinner />
  }

  return (
    <div className="h-full flex flex-col" style={{ height: '100vh' }}>
      <Card elevation={Elevation.ONE} style={{ margin: '16px', padding: '24px' }}>
        <H1 style={{ marginBottom: '16px' }}>Statistiques</H1>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <H5 style={{ margin: 0 }}>Année :</H5>
            <HTMLSelect
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{ minWidth: '120px' }}
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </HTMLSelect>
          </div>
          
          {activeTab === 'administratif' && (
            <Button
              onClick={resetLayout}
              intent="none"
              text="Réinitialiser la disposition"
              title="Remettre la disposition par défaut"
            />
          )}
        </div>

        <div style={{ borderBottom: '1px solid #E1E8ED', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '32px', marginBottom: '-1px' }}>
            <button
              onClick={() => setActiveTab('administratif')}
              style={{
                padding: '8px 4px',
                borderBottom: `2px solid ${activeTab === 'administratif' ? '#137CBD' : 'transparent'}`,
                color: activeTab === 'administratif' ? '#137CBD' : '#5C7080',
                background: 'none',
                border: 'none',
                fontWeight: 500,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Suivi Administratif
            </button>
            <button
              onClick={() => setActiveTab('budgetaire')}
              style={{
                padding: '8px 4px',
                borderBottom: `2px solid ${activeTab === 'budgetaire' ? '#137CBD' : 'transparent'}`,
                color: activeTab === 'budgetaire' ? '#137CBD' : '#5C7080',
                background: 'none',
                border: 'none',
                fontWeight: 500,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Suivi Budgétaire
            </button>
          </div>
        </div>
      </Card>

      <div className="flex-1 overflow-auto">
        {activeTab === 'administratif' ? (
          <div style={{ height: '100%', minHeight: '600px', padding: '16px' }}>
            <ResponsiveGridLayout
              className="layout"
              layouts={layouts}
              onLayoutChange={handleLayoutChange}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={30}
              isDraggable={true}
              isResizable={true}
              compactType="vertical"
              preventCollision={false}
            >
              {(['general', 'users', 'bap', 'qualite', 'infractions', 'contexte', 'formation', 'branche', 'statut', 'autocontrole', 'fluxmensuels', 'fluxhebdo', 'extraction'] as PanelKey[]).map((panelId) => (
                <div key={panelId}>
                  {renderPanel(panelId)}
                </div>
              ))}
            </ResponsiveGridLayout>
          </div>
        ) : (
          <div style={{ padding: '24px', height: '100%', overflow: 'auto' }}>
            <Card elevation={Elevation.ONE} style={{ padding: '24px' }}>
              <H1 style={{ marginBottom: '16px' }}>
                Suivi Budgétaire - {selectedYear}
              </H1>
              <p style={{ color: '#5C7080' }}>
                Les statistiques budgétaires seront implémentées prochainement.
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default Statistiques