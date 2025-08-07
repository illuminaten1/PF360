import React from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import DebouncedInput from '@/components/common/DebouncedInput'

interface SearchBarProps {
  globalFilter: string
  onGlobalFilterChange: (value: string) => void
  totalRows: number
  pageCount: number
  pagination: {
    pageIndex: number
    pageSize: number
  }
}

const SearchBar: React.FC<SearchBarProps> = ({
  globalFilter,
  onGlobalFilterChange,
  totalRows,
  pageCount,
  pagination
}) => {
  return (
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <DebouncedInput
                value={globalFilter}
                onChange={onGlobalFilterChange}
                placeholder="Rechercher par numéro DS, nom, NIGEND, unité, commune..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          {globalFilter && (
            <button
              onClick={() => onGlobalFilterChange('')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Effacer
            </button>
          )}
        </div>
        
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Server-side
          </span>
          <span>
            {globalFilter ? (
              `Résultats pour "${globalFilter}" • `
            ) : ''}
            Page {pagination.pageIndex + 1} sur {pageCount} • {totalRows.toLocaleString()} total
          </span>
        </div>
      </div>
    </div>
  )
}

export default SearchBar