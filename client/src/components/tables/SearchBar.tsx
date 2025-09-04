import React from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface SearchBarProps {
  globalFilter: string
  onGlobalFilterChange: (value: string) => void
  filteredRowsCount: number
  placeholder?: string
}

const SearchBar: React.FC<SearchBarProps> = ({
  globalFilter,
  onGlobalFilterChange,
  filteredRowsCount,
  placeholder = "Recherche globale dans toutes les colonnes..."
}) => {
  return (
    <div className="p-4 border-b border-gray-200">
      <div className="flex items-center space-x-2">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        <input
          type="text"
          name="search"
          autoComplete="off"
          value={globalFilter ?? ''}
          onChange={(e) => onGlobalFilterChange(String(e.target.value))}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={placeholder}
        />
        <span className="text-sm text-gray-500">
          {filteredRowsCount} résultat(s)
        </span>
      </div>
    </div>
  )
}

export default SearchBar