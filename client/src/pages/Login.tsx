import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoginCredentials } from '@/types'

const loginSchema = z.object({
  identifiant: z.string().min(1, 'Identifiant requis'),
  password: z.string().min(1, 'Mot de passe requis')
})

const Login: React.FC = () => {
  const { login, isAuthenticated, loading } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const location = useLocation()
  
  const from = location.state?.from?.pathname || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema)
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const onSubmit = async (data: LoginCredentials) => {
    setIsSubmitting(true)
    try {
      await login(data)
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">PF360</h2>
            <p className="text-gray-600 mb-8">Gestion des demandes d'aide juridique</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="identifiant" className="label block text-gray-700 mb-2">
                Identifiant
              </label>
              <input
                {...register('identifiant')}
                type="text"
                className="input w-full"
                placeholder="Votre identifiant"
                disabled={isSubmitting}
              />
              {errors.identifiant && (
                <p className="mt-1 text-sm text-red-600">{errors.identifiant.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="label block text-gray-700 mb-2">
                Mot de passe
              </label>
              <input
                {...register('password')}
                type="password"
                className="input w-full"
                placeholder="Votre mot de passe"
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Connexion...
                </div>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              Application sécurisée pour les professionnels autorisés
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login