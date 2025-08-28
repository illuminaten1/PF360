import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { MagnifyingGlassIcon, DocumentArrowDownIcon, ShieldCheckIcon, UserIcon, ScaleIcon } from '@heroicons/react/24/outline'
import api from '@/utils/api'
import DebouncedInput from '@/components/common/DebouncedInput'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface SearchResult {
  id: string
  type: 'demandeur' | 'avocat'
  nom: string
  prenom: string
  email?: string
  nigend?: string
  numeroDS?: string
}

interface DataExportRequest {
  personId: string
  personType: 'demandeur' | 'avocat'
  format: 'pdf' | 'json'
  includeRelatedData: boolean
}

const RGPD: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPerson, setSelectedPerson] = useState<SearchResult | null>(null)
  const [exportFormat, setExportFormat] = useState<'pdf' | 'json'>('pdf')
  const [includeRelatedData, setIncludeRelatedData] = useState(true)

  // Recherche avec debounce
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['rgpd-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return []
      const response = await api.get(`/rgpd/search?q=${encodeURIComponent(searchTerm)}`)
      return response.data as SearchResult[]
    },
    enabled: searchTerm.length >= 2
  })

  // Mutation pour l'export des données
  const exportDataMutation = useMutation({
    mutationFn: async (request: DataExportRequest) => {
      const response = await api.post('/rgpd/export', request, {
        responseType: 'blob'
      })
      return {
        data: response.data,
        filename: response.headers['content-disposition']?.split('filename=')[1] || 'export.pdf'
      }
    },
    onSuccess: (response) => {
      // Créer un URL blob et déclencher le téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', response.filename.replace(/"/g, ''))
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('Export réalisé avec succès')
    },
    onError: (error: any) => {
      console.error('Erreur lors de l\'export:', error)
      toast.error('Erreur lors de l\'export des données')
    }
  })

  const handleExport = () => {
    if (!selectedPerson) {
      toast.error('Veuillez sélectionner une personne')
      return
    }

    const request: DataExportRequest = {
      personId: selectedPerson.id,
      personType: selectedPerson.type,
      format: exportFormat,
      includeRelatedData
    }

    exportDataMutation.mutate(request)
  }

  const renderPersonCard = (person: SearchResult) => (
    <div
      key={person.id}
      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
        selectedPerson?.id === person.id
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={() => setSelectedPerson(person)}
    >
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          {person.type === 'avocat' ? (
            <ScaleIcon className="h-8 w-8 text-blue-600" />
          ) : (
            <UserIcon className="h-8 w-8 text-green-600" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-gray-900">
              {person.prenom} {person.nom}
            </h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              person.type === 'avocat' 
                ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {person.type === 'avocat' ? 'Avocat' : 'Demandeur'}
            </span>
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            {person.email && (
              <div>Email: {person.email}</div>
            )}
            {person.nigend && (
              <div>NIGEND: {person.nigend}</div>
            )}
            {person.numeroDS && (
              <div>N° DS: {person.numeroDS}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <ShieldCheckIcon className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            RGPD - Accès aux données personnelles
          </h1>
        </div>
        <p className="text-gray-600">
          Interface pour répondre aux demandes d'accès aux données personnelles (Article 15 RGPD).
          Recherchez une personne et exportez toutes ses données dans un format lisible.
        </p>
      </div>

      {/* Zone de recherche */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rechercher une personne
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <DebouncedInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Tapez le nom, prénom, email, NIGEND ou numéro DS..."
              className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Minimum 2 caractères pour déclencher la recherche
          </p>
        </div>

        {/* Résultats de recherche */}
        {isSearching && (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
            <span className="ml-2 text-gray-600">Recherche en cours...</span>
          </div>
        )}

        {searchResults && searchResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">
              Résultats de recherche ({searchResults.length})
            </h3>
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {searchResults.map(renderPersonCard)}
            </div>
          </div>
        )}

        {searchTerm.length >= 2 && !isSearching && searchResults?.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p>Aucune personne trouvée pour "{searchTerm}"</p>
          </div>
        )}
      </div>

      {/* Options d'export */}
      {selectedPerson && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Export des données pour {selectedPerson.prenom} {selectedPerson.nom}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Format d'export */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Format d'export
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="format"
                    value="pdf"
                    checked={exportFormat === 'pdf'}
                    onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'json')}
                    className="mr-2"
                  />
                  <span className="text-sm">PDF (lisible par l'utilisateur)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="format"
                    value="json"
                    checked={exportFormat === 'json'}
                    onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'json')}
                    className="mr-2"
                  />
                  <span className="text-sm">JSON (données structurées)</span>
                </label>
              </div>
            </div>

            {/* Options d'inclusion */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Données à inclure
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={includeRelatedData}
                    onChange={(e) => setIncludeRelatedData(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">
                    Inclure les données associées (dossiers, décisions, conventions, etc.)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Informations de sécurité */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <ShieldCheckIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Respect du RGPD</p>
                <ul className="space-y-1">
                  <li>• Les données d'autres personnes seront anonymisées</li>
                  <li>• L'export sera horodaté et tracé dans les logs</li>
                  <li>• Seules les données personnelles de la personne sélectionnée apparaîtront en clair</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bouton d'export */}
          <div className="flex justify-end">
            <button
              onClick={handleExport}
              disabled={exportDataMutation.isPending}
              className="flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportDataMutation.isPending ? (
                <>
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                  Export en cours...
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                  Exporter les données
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default RGPD