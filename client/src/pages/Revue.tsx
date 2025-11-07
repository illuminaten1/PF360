import React, { useState, useEffect } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline'
import { api } from '@/utils/api'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import RevueDecisionsTable from '@/components/tables/RevueDecisionsTable'
import RevueConventionsTable from '@/components/tables/RevueConventionsTable'
import RevueSignaturesTable from '@/components/tables/RevueSignaturesTable'

interface User {
  id: string
  nom: string
  prenom: string
  grade?: string
  active: boolean
}

const Revue: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'decisions' | 'conventions' | 'signatures'>(() => {
    return (sessionStorage.getItem('revue-active-tab') as 'decisions' | 'conventions' | 'signatures') || 'decisions'
  })
  const [users, setUsers] = useState<User[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>(() => {
    return sessionStorage.getItem('revue-selected-user-id') || ''
  })
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  // Synchroniser selectedUser avec selectedUserId quand les utilisateurs sont chargés
  useEffect(() => {
    if (users.length > 0 && selectedUserId) {
      const user = users.find(u => u.id === selectedUserId)
      setSelectedUser(user || null)
    } else {
      setSelectedUser(null)
    }
  }, [users, selectedUserId])

  // Sauvegarder l'onglet actif
  useEffect(() => {
    sessionStorage.setItem('revue-active-tab', activeTab)
  }, [activeTab])

  // Sauvegarder l'utilisateur sélectionné
  useEffect(() => {
    if (selectedUserId) {
      sessionStorage.setItem('revue-selected-user-id', selectedUserId)
    } else {
      sessionStorage.removeItem('revue-selected-user-id')
    }
  }, [selectedUserId])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/demandes/users')
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
    },
    {
      id: 'signatures',
      name: 'Suivi des signatures avocats',
      description: 'Conventions sans date de retour signé'
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

      {/* Sélecteur d'utilisateur */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sélectionner un utilisateur
        </label>
        <div className="max-w-md">
          <Listbox 
            value={selectedUser} 
            onChange={(user) => {
              setSelectedUser(user)
              setSelectedUserId(user?.id || '')
            }}
          >
            <div className="relative">
              <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm">
                <span className="block truncate">
                  {selectedUser ? (
                    `${selectedUser.grade ? `${selectedUser.grade} ` : ''}${selectedUser.prenom} ${selectedUser.nom}`
                  ) : (
                    '-- Choisir un utilisateur --'
                  )}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </span>
              </Listbox.Button>
              <Transition
                as={React.Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-sm">
                  <Listbox.Option
                    value={null}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-3 pr-9 ${
                        active ? 'bg-blue-600 text-white' : 'text-gray-900'
                      }`
                    }
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                          -- Choisir un utilisateur --
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
                  {users.map((user) => (
                    <Listbox.Option
                      key={user.id}
                      value={user}
                      className={({ active }) =>
                        `relative cursor-default select-none py-2 pl-3 pr-9 ${
                          active ? 'bg-blue-600 text-white' : 'text-gray-900'
                        }`
                      }
                    >
                      {({ selected, active }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {user.grade && `${user.grade} `}{user.prenom} {user.nom}
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
              </Transition>
            </div>
          </Listbox>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max px-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'decisions' | 'conventions' | 'signatures')}
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
          <RevueConventionsTable
            selectedUserId={selectedUserId}
            selectedUser={users.find(u => u.id === selectedUserId)}
          />
        )}

        {activeTab === 'signatures' && (
          <RevueSignaturesTable
            selectedUserId={selectedUserId}
            selectedUser={users.find(u => u.id === selectedUserId)}
          />
        )}
      </div>
    </div>
  )
}

export default Revue