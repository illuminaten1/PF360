import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { User } from '@/types'
import api from '@/utils/api'
import UsersTable from '@/components/tables/UsersTable'
import UserModal from '@/components/forms/UserModal'

interface UsersStats {
  totalUsers: number
  adminUsers: number
  redactorUsers: number
  clerkUsers: number
  activeUsers: number
}

const Users: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  const queryClient = useQueryClient()

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', debouncedSearchTerm],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm)
      const response = await api.get(`/users?${params.toString()}`)
      return response.data
    }
  })

  const { data: stats } = useQuery({
    queryKey: ['users-stats'],
    queryFn: async () => {
      const response = await api.get('/users/stats')
      return response.data
    }
  })

  const createUserMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const response = await api.post('/users', userData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users-stats'] })
      setIsModalOpen(false)
      setSelectedUser(null)
      toast.success('Utilisateur créé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création de l\'utilisateur')
    }
  })

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, ...userData }: Partial<User> & { id: string }) => {
      const response = await api.put(`/users/${id}`, userData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users-stats'] })
      setIsModalOpen(false)
      setSelectedUser(null)
      toast.success('Utilisateur modifié avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification de l\'utilisateur')
    }
  })

  const deactivateUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/users/${id}/deactivate`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users-stats'] })
      toast.success('Utilisateur désactivé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la désactivation de l\'utilisateur')
    }
  })

  const reactivateUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/users/${id}/reactivate`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['users-stats'] })
      toast.success('Utilisateur réactivé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la réactivation de l\'utilisateur')
    }
  })

  const handleCreateUser = () => {
    setSelectedUser(null)
    setIsModalOpen(true)
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleDeactivateUser = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir désactiver cet utilisateur ? Il ne pourra plus se connecter.')) {
      deactivateUserMutation.mutate(id)
    }
  }

  const handleReactivateUser = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir réactiver cet utilisateur ?')) {
      reactivateUserMutation.mutate(id)
    }
  }

  const handleSubmit = (userData: Partial<User>) => {
    if (selectedUser) {
      updateUserMutation.mutate({ ...userData, id: selectedUser.id })
    } else {
      createUserMutation.mutate(userData)
    }
  }

  const users = usersData?.users || []

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <UserGroupIcon className="w-7 h-7 mr-3 text-blue-600" />
            Gestion des utilisateurs
          </h1>
          <p className="text-gray-600 mt-1">Gérez les comptes utilisateurs et leurs permissions</p>
        </div>
        <button
          onClick={handleCreateUser}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Nouvel utilisateur</span>
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <UserGroupIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total utilisateurs</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <UserGroupIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Administrateurs</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.adminUsers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-orange-100">
                <UserGroupIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rédacteurs</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.redactorUsers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <UserGroupIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Greffiers</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.clerkUsers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <UserGroupIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Actifs</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeUsers}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <UsersTable
          users={users}
          isLoading={isLoading}
          onEdit={handleEditUser}
          onDeactivate={handleDeactivateUser}
          onReactivate={handleReactivateUser}
        />
      </div>

      {isModalOpen && (
        <UserModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedUser(null)
          }}
          onSubmit={handleSubmit}
          isSubmitting={createUserMutation.isPending || updateUserMutation.isPending}
        />
      )}
    </div>
  )
}

export default Users