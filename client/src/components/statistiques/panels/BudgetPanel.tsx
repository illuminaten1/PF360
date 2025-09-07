import React, { useState, useEffect } from 'react'
import { api } from '@/utils/api'

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

interface BudgetPanelProps {
  selectedYear: number
  isAdmin: boolean
}

const BudgetPanel: React.FC<BudgetPanelProps> = ({ selectedYear, isAdmin }) => {
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

  const budgetTotal = (budget?.budgetBase || 0) + (budget?.abondements || 0)

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Budget {selectedYear}
        </h3>
        {isAdmin && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {budget ? 'Modifier' : 'Définir le budget'}
          </button>
        )}
      </div>

      {isEditing && isAdmin ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget de base
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.budgetBase}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  budgetBase: parseFloat(e.target.value) || 0
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Montant du budget de base"
              />
              <span className="absolute right-3 top-2 text-gray-500 text-sm">€</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Abondements
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.abondements}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  abondements: parseFloat(e.target.value) || 0
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Montant des abondements"
              />
              <span className="absolute right-3 top-2 text-gray-500 text-sm">€</span>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <div className="text-sm text-gray-600 mb-1">Budget total</div>
            <div className="text-xl font-semibold text-blue-600">
              {formatCurrency(formData.budgetBase + formData.abondements)}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Enregistrer
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {budget ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Budget de base</div>
                  <div className="text-2xl font-semibold text-blue-600">
                    {formatCurrency(budget.budgetBase)}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Abondements</div>
                  <div className="text-2xl font-semibold text-green-600">
                    {formatCurrency(budget.abondements)}
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Budget total annuel</div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(budgetTotal)}
                </div>
              </div>

              {budget.modifiePar && (
                <div className="text-xs text-gray-500 border-t pt-3">
                  Dernière modification par {budget.modifiePar.prenom} {budget.modifiePar.nom} ({budget.modifiePar.identifiant})
                  <br />
                  {new Date(budget.updatedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-lg mb-2">Aucun budget défini pour {selectedYear}</div>
              {isAdmin && (
                <div className="text-sm">
                  Cliquez sur "Définir le budget" pour configurer le budget de cette année.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default BudgetPanel