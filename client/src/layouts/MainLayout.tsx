import React, { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import {
  HomeIcon,
  DocumentTextIcon,
  FolderIcon,
  ScaleIcon,
  DocumentIcon,
  CreditCardIcon,
  UsersIcon,
  UserCircleIcon,
  EyeIcon,
  PresentationChartLineIcon,
  Bars3Icon,
  XMarkIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  ChevronDoubleUpIcon,
  UserIcon,
  TagIcon,
  BuildingOfficeIcon,
  CurrencyEuroIcon,
  ClipboardDocumentListIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Demandes', href: '/demandes', icon: DocumentTextIcon },
  { name: 'Dossiers', href: '/dossiers', icon: FolderIcon },
  { name: 'Décisions', href: '/decisions', icon: ScaleIcon },
  { name: 'Conventions', href: '/conventions', icon: DocumentIcon },
  { name: 'Paiements', href: '/paiements', icon: CreditCardIcon },
  { name: 'Avocats', href: '/avocats', icon: UsersIcon },
  { name: 'Revue', href: '/revue', icon: EyeIcon },
  { name: 'Statistiques', href: '/statistiques', icon: PresentationChartLineIcon },
]

const adminNavigation = [
  { name: 'Utilisateurs', href: '/utilisateurs', icon: UserCircleIcon },
  { name: 'SGAMI', href: '/sgami', icon: CurrencyEuroIcon },
  { name: 'Badges', href: '/badges', icon: TagIcon },
  { name: 'BAP', href: '/bap', icon: BuildingOfficeIcon },
  { name: 'PCE', href: '/pce', icon: DocumentTextIcon },
  { name: 'Grades', href: '/grades', icon: ChevronDoubleUpIcon },
  { name: 'Visas', href: '/visa', icon: EyeIcon },
  { name: 'Diligences', href: '/diligences', icon: ClipboardDocumentListIcon },
  { name: 'Templates', href: '/templates', icon: DocumentDuplicateIcon },
]

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  const isActive = (href: string) => location.pathname === href

  const getRoleBadge = (role: string) => {
    if (role === 'ADMIN') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <ShieldCheckIcon className="w-4 h-4 mr-1" />
          Administrateur
        </span>
      )
    }
    if (role === 'REDACTEUR') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <UserIcon className="w-4 h-4 mr-1" />
          Rédacteur
        </span>
      )
    }
    if (role === 'GREFFIER') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <UserIcon className="w-4 h-4 mr-1" />
          Greffier
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <UserIcon className="w-4 h-4 mr-1" />
        {role}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                <GlobeAltIcon className="h-5 w-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">PF360</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive(item.href)
                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-2 py-2 border-l-4 text-sm font-medium`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon
                  className={`${
                    isActive(item.href) ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                  } mr-3 h-6 w-6 flex-shrink-0`}
                />
                {item.name}
              </Link>
            ))}
            {user?.role === 'ADMIN' && (
              <>
                <div className="mt-8 pt-4 border-t border-gray-200">
                  <p className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Administration
                  </p>
                </div>
                {adminNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive(item.href)
                        ? 'bg-primary-50 border-primary-500 text-primary-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 border-l-4 text-sm font-medium`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className={`${
                        isActive(item.href) ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                      } mr-3 h-6 w-6 flex-shrink-0`}
                    />
                    {item.name}
                  </Link>
                ))}
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-300 ease-in-out ${
        sidebarExpanded ? 'lg:w-48' : 'lg:w-16'
      }`}>
        <div className="flex flex-col h-full bg-white border-r border-gray-200">
          <div className={`flex items-center h-16 border-b border-gray-200 transition-all duration-300 ${
            sidebarExpanded ? 'px-4' : 'justify-center'
          }`}>
            <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
              <GlobeAltIcon className="h-5 w-5 text-white" />
            </div>
            <span className={`ml-2 text-xl font-bold text-gray-900 transition-all duration-300 ${
              sidebarExpanded ? 'opacity-100 delay-150' : 'opacity-0 w-0 overflow-hidden'
            }`}>PF360</span>
          </div>
          <nav className={`flex-1 py-4 space-y-1 transition-all duration-300 overflow-y-auto min-h-0 ${
            sidebarExpanded ? 'px-4' : 'px-2'
          }`}>
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className={`w-full p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 flex items-center transition-all duration-300 ${
                sidebarExpanded ? 'justify-end' : 'justify-center'
              }`}
              title={sidebarExpanded ? 'Réduire le menu' : 'Étendre le menu'}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive(item.href)
                    ? sidebarExpanded
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'bg-primary-50 text-primary-700'
                    : sidebarExpanded
                      ? 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center p-2 text-sm font-medium rounded-md transition-all duration-300 ${
                  sidebarExpanded ? 'border-l-4' : 'justify-center'
                }`}
                title={!sidebarExpanded ? item.name : undefined}
              >
                <item.icon
                  className={`${
                    isActive(item.href) ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                  } h-6 w-6 flex-shrink-0 transition-all duration-300 ${
                    sidebarExpanded ? 'mr-3' : ''
                  }`}
                />
                <span className={`transition-all duration-300 ${
                  sidebarExpanded ? 'opacity-100 delay-150' : 'opacity-0 w-0 overflow-hidden'
                }`}>{item.name}</span>
              </Link>
            ))}
            {user?.role === 'ADMIN' && (
              <>
                <div className={`border-t border-gray-200 transition-all duration-300 ${
                  sidebarExpanded ? 'mt-8 pt-4' : 'mt-4 pt-4'
                }`}>
                  <p className={`px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider transition-all duration-300 ${
                    sidebarExpanded ? 'opacity-100 delay-150' : 'opacity-0 h-0 overflow-hidden'
                  }`}>
                    Administration
                  </p>
                </div>
                {adminNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive(item.href)
                        ? sidebarExpanded
                          ? 'bg-primary-50 border-primary-500 text-primary-700'
                          : 'bg-primary-50 text-primary-700'
                        : sidebarExpanded
                          ? 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center p-2 text-sm font-medium rounded-md transition-all duration-300 ${
                      sidebarExpanded ? 'border-l-4' : 'justify-center'
                    }`}
                    title={!sidebarExpanded ? item.name : undefined}
                  >
                    <item.icon
                      className={`${
                        isActive(item.href) ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                      } h-6 w-6 flex-shrink-0 transition-all duration-300 ${
                        sidebarExpanded ? 'mr-3' : ''
                      }`}
                    />
                    <span className={`transition-all duration-300 ${
                      sidebarExpanded ? 'opacity-100 delay-150' : 'opacity-0 w-0 overflow-hidden'
                    }`}>{item.name}</span>
                  </Link>
                ))}
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ease-in-out ${
        sidebarExpanded ? 'lg:pl-48' : 'lg:pl-16'
      }`}>
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            </div>

            <div className="flex items-center space-x-4 ml-auto">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-1 sm:space-y-0 text-right sm:text-left">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">
                    <span className="hidden sm:inline">{user?.grade && `${user.grade} `}</span>
                    {user?.prenom} {user?.nom}
                  </span>
                </div>
                {user?.role && getRoleBadge(user.role)}
              </div>
              <button
                onClick={logout}
                className="btn-secondary text-sm"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout