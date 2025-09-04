import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Mosaic, MosaicWindow, MosaicNode } from 'react-mosaic-component'
import { Card, Elevation, H5, H1, HTMLTable, Tag, Button, HTMLSelect } from '@blueprintjs/core'
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

type MosaicKey = 'general' | 'users' | 'bap' | 'autocontrole' | 'fluxmensuels' | 'fluxhebdo'

const INITIAL_MOSAIC_LAYOUT: MosaicNode<MosaicKey> = {
  direction: 'column' as const,
  first: {
    direction: 'row' as const,
    first: 'general' as MosaicKey,
    second: {
      direction: 'row' as const,
      first: 'users' as MosaicKey,
      second: 'bap' as MosaicKey,
      splitPercentage: 75
    },
    splitPercentage: 30
  },
  second: {
    direction: 'row' as const,
    first: 'autocontrole' as MosaicKey,
    second: {
      direction: 'row' as const,
      first: 'fluxmensuels' as MosaicKey,
      second: 'fluxhebdo' as MosaicKey,
      splitPercentage: 55
    },
    splitPercentage: 25
  },
  splitPercentage: 60
}

const StatistiquesGeneralesComponent: React.FC<{ 
  stats: StatistiquesGenerales | undefined
}> = ({ stats }) => (
  <div className="p-4 h-full overflow-auto">
    {stats && (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <Card elevation={Elevation.ONE} style={{ textAlign: 'center', padding: '16px' }}>
          <H1 style={{ color: '#137CBD', margin: '0 0 8px 0' }}>
            {stats.demandesTotal}
          </H1>
          <H5 style={{ color: '#5C7080', margin: 0 }}>
            Demandes reçues
          </H5>
        </Card>
        <Card elevation={Elevation.ONE} style={{ textAlign: 'center', padding: '16px' }}>
          <H1 style={{ color: '#0F9960', margin: '0 0 8px 0' }}>
            {stats.demandesTraitees}
          </H1>
          <H5 style={{ color: '#5C7080', margin: 0 }}>
            Demandes traitées
          </H5>
        </Card>
        <Card elevation={Elevation.ONE} style={{ textAlign: 'center', padding: '16px' }}>
          <H1 style={{ color: '#D9822B', margin: '0 0 8px 0' }}>
            {stats.demandesEnInstance}
          </H1>
          <H5 style={{ color: '#5C7080', margin: 0 }}>
            Demandes en instance
          </H5>
        </Card>
        <Card elevation={Elevation.ONE} style={{ textAlign: 'center', padding: '16px' }}>
          <H1 style={{ color: '#DB3737', margin: '0 0 8px 0' }}>
            {stats.demandesNonAffectees}
          </H1>
          <H5 style={{ color: '#5C7080', margin: 0 }}>
            Demandes non affectées
          </H5>
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
          </tr>
        ))}
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
  selectedYear: number 
}> = ({ fluxHebdomadaires, selectedYear }) => (
  <div className="p-4 h-full overflow-auto">
    <HTMLTable 
      striped 
      interactive
      style={{ width: '100%', fontSize: '13px' }}
    >
      <thead>
        <tr>
          <th style={{ textAlign: 'center', padding: '8px' }}>Semaine</th>
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
        {fluxHebdomadaires && fluxHebdomadaires.fluxHebdomadaires.length > 0 ? (
          fluxHebdomadaires.fluxHebdomadaires.map((flux) => (
            <tr key={flux.numeroSemaine}>
              <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                <div style={{ fontWeight: 500 }}>
                  S{flux.numeroSemaine.toString().padStart(2, '0')}
                </div>
                <div style={{ fontSize: '10px', color: '#5C7080', marginTop: '2px' }}>
                  {flux.dateDebut} - {flux.dateFin}
                </div>
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

  const yearOptions = Array.from(
    { length: 5 }, 
    (_, index) => currentYear - index
  )

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
            selectedYear={selectedYear}
          />
        )
      default:
        return <div>Panneau non défini</div>
    }
  }

  if (isLoadingAdmin || isLoadingBAP || isLoadingFlux || isLoadingFluxHebdo || isLoadingAutoControle) {
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