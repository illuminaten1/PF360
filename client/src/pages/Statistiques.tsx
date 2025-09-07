import React, { useState } from 'react'
import { Responsive, WidthProvider, Layout } from 'react-grid-layout'
import { Listbox } from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import ExtractionMensuelleComponent from '@/components/statistiques/ExtractionMensuelleComponent'
import { useStatistiquesQueries } from '@/components/statistiques/hooks/useStatistiquesQueries'
import { INITIAL_GRID_LAYOUTS, INITIAL_GRID_LAYOUTS_BUDGETAIRE } from '@/components/statistiques/config/gridLayouts'
import { getPanelTitle, PANEL_ORDER_ADMINISTRATIF, PANEL_ORDER_BUDGETAIRE } from '@/components/statistiques/config/panelConfig'
import { PanelKey } from '@/components/statistiques/types'
import {
  StatistiquesGeneralesPanel,
  StatistiquesUtilisateurPanel,
  StatistiquesBAPPanel,
  QualiteDemandeurPanel,
  TypeInfractionPanel,
  ContexteMissionnelPanel,
  FormationAdministrativePanel,
  BranchePanel,
  StatutDemandeurPanel,
  BadgesPanel,
  ReponseBRPFPanel,
  AutoControlePanel,
  FluxMensuelsPanel,
  FluxHebdomadairesPanel,
  BudgetPanel,
  EngagementServicePayeurPanel
} from '@/components/statistiques/panels'
import StatistiquesBudgetairesPanel from '@/components/statistiques/panels/StatistiquesBudgetairesPanel'
import { useAuth } from '@/contexts/AuthContext'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

const Statistiques: React.FC = () => {
  const { user } = useAuth()
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState<number>(currentYear)
  const [activeTab, setActiveTab] = useState<'administratif' | 'budgetaire'>('administratif')
  const [isReorderMode, setIsReorderMode] = useState<boolean>(false)
  
  const isAdmin = user?.role === 'ADMIN'
  
  // Load saved layout from localStorage or use default
  const [layoutsAdministratif, setLayoutsAdministratif] = useState(() => {
    try {
      const savedLayouts = localStorage.getItem('pf360-statistiques-grid-layouts-administratif')
      return savedLayouts ? JSON.parse(savedLayouts) : INITIAL_GRID_LAYOUTS
    } catch {
      return INITIAL_GRID_LAYOUTS
    }
  })

  const [layoutsBudgetaire, setLayoutsBudgetaire] = useState(() => {
    try {
      const savedLayouts = localStorage.getItem('pf360-statistiques-grid-layouts-budgetaire')
      return savedLayouts ? JSON.parse(savedLayouts) : INITIAL_GRID_LAYOUTS_BUDGETAIRE
    } catch {
      return INITIAL_GRID_LAYOUTS_BUDGETAIRE
    }
  })

  const layouts = activeTab === 'administratif' ? layoutsAdministratif : layoutsBudgetaire
  const setLayouts = activeTab === 'administratif' ? setLayoutsAdministratif : setLayoutsBudgetaire
  const storageKey = activeTab === 'administratif' ? 'pf360-statistiques-grid-layouts-administratif' : 'pf360-statistiques-grid-layouts-budgetaire'
  const initialLayouts = activeTab === 'administratif' ? INITIAL_GRID_LAYOUTS : INITIAL_GRID_LAYOUTS_BUDGETAIRE

  // Use the custom hook for all queries
  const {
    statsAdministratives,
    statsBAP,
    statsQualite,
    statsInfractions,
    statsContexte,
    statsFormation,
    statsBranche,
    statsStatut,
    fluxMensuels,
    fluxHebdomadaires,
    autoControle,
    extractionMensuelle,
    statsBadges,
    statsReponseBRPF,
    statsBudgetaires,
    statsEngagements,
    anneesDisponibles,
    isLoading
  } = useStatistiquesQueries(selectedYear, activeTab)

  // Handle layout changes and save to localStorage
  const handleLayoutChange = (_layout: Layout[], newLayouts: { [key: string]: Layout[] }) => {
    setLayouts(newLayouts)
    try {
      localStorage.setItem(storageKey, JSON.stringify(newLayouts))
    } catch (error) {
      console.warn('Failed to save layouts to localStorage:', error)
    }
  }

  // Reset layout to default
  const resetLayout = () => {
    setLayouts(initialLayouts)
    try {
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.warn('Failed to remove layouts from localStorage:', error)
    }
  }

  const yearOptions = anneesDisponibles || [currentYear]

  const renderPanel = (id: PanelKey) => {
    let content
    switch (id) {
      case 'general':
        content = <StatistiquesGeneralesPanel stats={statsAdministratives?.generales} />
        break
      case 'users':
        content = <StatistiquesUtilisateurPanel users={statsAdministratives?.utilisateurs} />
        break
      case 'bap':
        content = <StatistiquesBAPPanel statsBAP={statsBAP} />
        break
      case 'qualite':
        content = <QualiteDemandeurPanel statsQualite={statsQualite} />
        break
      case 'infractions':
        content = <TypeInfractionPanel statsInfractions={statsInfractions} />
        break
      case 'contexte':
        content = <ContexteMissionnelPanel statsContexte={statsContexte} />
        break
      case 'formation':
        content = <FormationAdministrativePanel statsFormation={statsFormation} />
        break
      case 'branche':
        content = <BranchePanel statsBranche={statsBranche} />
        break
      case 'statut':
        content = <StatutDemandeurPanel statsStatut={statsStatut} />
        break
      case 'badges':
        content = <BadgesPanel statsBadges={statsBadges} />
        break
      case 'reponseBrpf':
        content = <ReponseBRPFPanel statsReponseBRPF={statsReponseBRPF} />
        break
      case 'autocontrole':
        content = <AutoControlePanel autoControle={autoControle} />
        break
      case 'fluxmensuels':
        content = <FluxMensuelsPanel fluxMensuels={fluxMensuels} selectedYear={selectedYear} />
        break
      case 'fluxhebdo':
        content = <FluxHebdomadairesPanel fluxHebdomadaires={fluxHebdomadaires} />
        break
      case 'extraction':
        content = <ExtractionMensuelleComponent stats={extractionMensuelle} />
        break
      case 'budget':
        content = <BudgetPanel selectedYear={selectedYear} isAdmin={isAdmin} />
        break
      case 'statistiquesBudgetaires':
        content = <StatistiquesBudgetairesPanel statsBudgetaires={statsBudgetaires} />
        break
      case 'engagementServicePayeur':
        content = <EngagementServicePayeurPanel statsEngagements={statsEngagements} />
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

  if (isLoading) {
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
          {(activeTab === 'administratif' ? PANEL_ORDER_ADMINISTRATIF : PANEL_ORDER_BUDGETAIRE).map((panelId) => (
            <div key={panelId}>
              {renderPanel(panelId)}
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    </div>
  )
}

export default Statistiques