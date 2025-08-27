import React, { useState, useEffect } from 'react'
import { api } from '@/utils/api'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import RevueDecisionsTable from '@/components/tables/RevueDecisionsTable'

interface User {
  id: string
  nom: string
  prenom: string
  grade?: string
  active: boolean
}

const Revue: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'decisions' | 'conventions'>('decisions')
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/api/demandes/users')
      setUsers(response.data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    {
      id: 'decisions',
      name: 'Revue des décisions',
      description: 'Demandes sans décision par utilisateur'
    },
    {
      id: 'conventions',
      name: 'Revue des conventions',
      description: 'Demandes avec décision PJ mais sans convention'
    }
  ]

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Revue</h1>
        <p className="mt-1 text-sm text-gray-600">
          Suivi des demandes par utilisateur
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'decisions' | 'conventions')}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-2">
          <p className="text-sm text-gray-600">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>
      </div>

      {/* Sélecteur d'utilisateur */}
      <div className="mb-6">
        <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-2">
          Sélectionner un utilisateur
        </label>
        <select
          id="user-select"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="block w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- Choisir un utilisateur --</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.grade && `${user.grade} `}{user.prenom} {user.nom}
            </option>
          ))}
        </select>
      </div>

      {/* Contenu des onglets */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'decisions' && (
          <RevueDecisionsTable 
            selectedUserId={selectedUserId}
            selectedUser={users.find(u => u.id === selectedUserId)}
          />
        )}
        
        {activeTab === 'conventions' && (
          <div className="p-8 text-center">
            <div className="flex flex-col items-center">
              <svg className="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Revue des conventions</h3>
              <p className="text-sm text-gray-500 max-w-md">
                Cette fonctionnalité sera disponible prochainement. Elle permettra de suivre les demandes avec décision de protection juridictionnelle qui n'ont pas encore de convention d'honoraires.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Revue