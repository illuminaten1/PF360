import React, { useState, useEffect } from 'react'
import { api } from '@/utils/api'
import { PencilIcon } from '@heroicons/react/24/outline'

interface BudgetAnnuel {
  id: string
  annee: number
  budgetBase: number
  abondements: number
  creePar?: {
    id: string
    nom: string
    prenom: string
    identifiant: string
  }
  modifiePar?: {
    id: string
    nom: string
    prenom: string
    identifiant: string
  }
  createdAt: string
  updatedAt: string
}

interface StatistiqueBudgetaire {
  libelle: string
  nombre: number
  pourcentage?: number
  type?: 'currency' | 'currency_with_percentage'
  bold?: boolean
  showPrevisions?: boolean
  prevision10?: number
  prevision20?: number
  pourcentagePrevision10?: number
  pourcentagePrevision20?: number
}

interface StatistiquesBudgetairesData {
  statistiques: StatistiqueBudgetaire[]
  budgetTotal?: number
}

interface DepenseOrdonnee {
  libelle: string
  nombre: number
  pourcentage?: number
  type?: 'currency' | 'currency_with_percentage' | 'number'
  bold?: boolean
  isTotal?: boolean
}

interface DepensesOrdonneesData {
  statistiques: DepenseOrdonnee[]
  budgetTotal?: number
}

interface BudgetPanelProps {
  selectedYear: number
  isAdmin: boolean
  statsBudgetaires?: StatistiquesBudgetairesData
  statsDepensesOrdonnees?: DepensesOrdonneesData
}

const BudgetPanel: React.FC<BudgetPanelProps> = ({ selectedYear, isAdmin, statsBudgetaires, statsDepensesOrdonnees }) => {
  const [budget, setBudget] = useState<BudgetAnnuel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    budgetBase: 0,
    abondements: 0
  })

  useEffect(() => {
    fetchBudget()
  }, [selectedYear])

  const fetchBudget = async () => {
    try {
      setIsLoading(true)
      const response = await api.get(`/budget/${selectedYear}`)
      setBudget(response.data)
      if (response.data) {
        setFormData({
          budgetBase: response.data.budgetBase,
          abondements: response.data.abondements
        })
      } else {
        setFormData({
          budgetBase: 0,
          abondements: 0
        })
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du budget:', error)
      setBudget(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const response = await api.post('/budget', {
        annee: selectedYear,
        budgetBase: formData.budgetBase,
        abondements: formData.abondements
      })
      setBudget(response.data)
      setIsEditing(false)
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du budget:', error)
    }
  }

  const handleCancel = () => {
    if (budget) {
      setFormData({
        budgetBase: budget.budgetBase,
        abondements: budget.abondements
      })
    } else {
      setFormData({
        budgetBase: 0,
        abondements: 0
      })
    }
    setIsEditing(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Extraire le montant gagé total HT
  const getMontantGageTotal = () => {
    if (!statsBudgetaires) return 0
    const montantGage = statsBudgetaires.statistiques.find(stat => 
      stat.libelle === "Montant HT gagé total"
    )
    return montantGage ? montantGage.nombre : 0
  }

  // Extraire le montant ordonné total TTC 
  const getMontantOrdonneTotal = () => {
    if (!statsDepensesOrdonnees) return 0
    const montantOrdonne = statsDepensesOrdonnees.statistiques.find(stat => 
      stat.libelle === "Dépense totale TTC"
    )
    return montantOrdonne ? montantOrdonne.nombre : 0
  }


  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500 text-sm">Chargement...</div>
      </div>
    )
  }


  // Vue normale - style identique à l'encart Demandes avec édition directe
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-2">
        {budget || isEditing ? (
          <div className="h-full flex gap-2">
            {/* Partie gauche - Budget existant */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-1">
              {/* Budget de base */}
              <div className={`bg-white rounded-lg shadow border p-2 text-center flex flex-col justify-center ${
                isEditing ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
              }`}>
                {isEditing ? (
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={formData.budgetBase || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        budgetBase: parseFloat(e.target.value) || 0
                      }))}
                      className="w-full text-center text-4xl sm:text-5xl font-semibold text-blue-600 bg-white border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0"
                    />
                  </div>
                ) : (
                  <div className="text-4xl sm:text-5xl font-semibold text-blue-600 mb-1">
                    {budget ? formatCurrency(budget.budgetBase) : '0 €'}
                  </div>
                )}
                <div className="text-sm text-gray-600">
                  Budget de base
                </div>
              </div>

              {/* Abondements */}
              <div className={`bg-white rounded-lg shadow border p-2 text-center flex flex-col justify-center ${
                isEditing ? 'border-green-300 bg-green-50' : 'border-gray-200'
              }`}>
                {isEditing ? (
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={formData.abondements || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        abondements: parseFloat(e.target.value) || 0
                      }))}
                      className="w-full text-center text-4xl sm:text-5xl font-semibold text-green-600 bg-white border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 rounded px-2 py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0"
                    />
                  </div>
                ) : (
                  <div className="text-4xl sm:text-5xl font-semibold text-green-600 mb-1">
                    {budget ? formatCurrency(budget.abondements) : '0 €'}
                  </div>
                )}
                <div className="text-sm text-gray-600">
                  Abondements
                </div>
              </div>

              {/* Budget total avec boutons */}
              <div className={`bg-white rounded-lg shadow border p-2 text-center flex flex-col justify-center sm:col-span-2 relative ${
                isEditing ? 'border-gray-300 bg-gray-50' : 'border-gray-200'
              }`}>
                <div className="text-4xl sm:text-5xl font-semibold text-gray-900 mb-1">
                  {formatCurrency((formData.budgetBase || 0) + (formData.abondements || 0))}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Budget total
                </div>
                
                {isAdmin && (
                  <div className="absolute top-1 right-1 flex gap-1">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleSave}
                          className="p-1 text-green-600 hover:text-green-700 transition-colors bg-white rounded border border-green-300 hover:bg-green-50"
                          title="Enregistrer"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-1 text-red-600 hover:text-red-700 transition-colors bg-white rounded border border-red-300 hover:bg-red-50"
                          title="Annuler"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Modifier le budget"
                      >
                        <PencilIcon className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Séparateur */}
            <div className="w-px bg-gray-300 mx-1"></div>

            {/* Partie droite - Nouveaux carrés */}
            <div className="flex-1 flex flex-col gap-1">
              {/* Montant gagé total HT */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-3 text-center flex flex-col justify-center flex-1">
                <div className="text-4xl sm:text-5xl font-semibold text-green-600 mb-1">
                  {formatCurrency(getMontantGageTotal())}
                </div>
                <div className="text-xs text-gray-600 leading-tight">
                  Montant gagé HT
                </div>
              </div>

              {/* Montant ordonné total TTC */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-3 text-center flex flex-col justify-center flex-1">
                <div className="text-4xl sm:text-5xl font-semibold text-orange-600 mb-1">
                  {formatCurrency(getMontantOrdonneTotal())}
                </div>
                <div className="text-xs text-gray-600 leading-tight">
                  Montant ordonné TTC
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">Aucun budget défini pour {selectedYear}</div>
              {isAdmin && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Définir le budget
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BudgetPanel