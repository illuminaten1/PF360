import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, AuthResponse, LoginCredentials } from '@/types'
import api from '@/utils/api'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  loading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token')
      const storedUser = localStorage.getItem('user')
      
      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser))
          const response = await api.get('/auth/me')
          setUser(response.data.user)
        } catch (error) {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
          setUser(null)
        }
      }
      
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials)
      const { token, user: userData } = response.data

      localStorage.setItem('auth_token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      
      toast.success(`Bienvenue ${userData.prenom} ${userData.nom}`)
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    setUser(null)
    toast.success('Déconnexion réussie')
  }

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}