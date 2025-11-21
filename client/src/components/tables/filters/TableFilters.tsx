import React, { useState, useEffect } from 'react'
import type { Column } from '@tanstack/react-table'
import dayjs from 'dayjs'

interface DebouncedTextFilterProps<TData, TValue> {
  column: Column<TData, TValue>
  placeholder?: string
  debounceMs?: number
}

export function DebouncedTextFilter<TData, TValue>({
  column,
  placeholder = 'Filtrer...',
  debounceMs = 500
}: DebouncedTextFilterProps<TData, TValue>) {
  const columnFilterValue = (column.getFilterValue() as string) ?? ''
  const [value, setValue] = useState(columnFilterValue)

  useEffect(() => {
    setValue(columnFilterValue)
  }, [columnFilterValue])

  useEffect(() => {
    const timer = setTimeout(() => {
      column.setFilterValue(value || undefined)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [value, column, debounceMs])

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="w-32 border shadow rounded px-2 py-1 text-xs"
    />
  )
}

interface MultiSelectFilterProps<TData, TValue> {
  column: Column<TData, TValue>
  options: string[]
  placeholder?: string
}

export function MultiSelectFilter<TData, TValue>({
  column,
  options,
  placeholder = 'Tous'
}: MultiSelectFilterProps<TData, TValue>) {
  const columnFilterValue = (column.getFilterValue() ?? []) as string[]
  const [isOpen, setIsOpen] = useState(false)

  const handleToggleOption = (option: string) => {
    const currentFilters = [...columnFilterValue]
    const index = currentFilters.indexOf(option)

    if (index > -1) {
      currentFilters.splice(index, 1)
    } else {
      currentFilters.push(option)
    }

    column.setFilterValue(currentFilters.length > 0 ? currentFilters : undefined)
  }

  const clearAll = () => {
    column.setFilterValue(undefined)
  }

  const selectAll = () => {
    column.setFilterValue([...options])
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-32 border shadow rounded px-2 py-1 text-xs text-left bg-white hover:bg-gray-50 flex items-center justify-between"
      >
        <span className="truncate">
          {columnFilterValue.length === 0
            ? placeholder
            : columnFilterValue.length === options.length
            ? placeholder
            : `${columnFilterValue.length} sélectionné${columnFilterValue.length > 1 ? 's' : ''}`}
        </span>
        <span className="text-gray-400">▼</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          <div className="p-2 border-b border-gray-200">
            <div className="flex gap-1">
              <button
                onClick={selectAll}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Tout
              </button>
              <button
                onClick={clearAll}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Aucun
              </button>
            </div>
          </div>

          <div className="p-1">
            {options.map((option) => (
              <label key={option} className="flex items-center px-2 py-1 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={columnFilterValue.includes(option)}
                  onChange={() => handleToggleOption(option)}
                  className="mr-2 text-blue-600"
                />
                <span className="text-xs truncate">{option}</span>
              </label>
            ))}
            {options.length === 0 && (
              <div className="px-2 py-1 text-xs text-gray-500">Aucune option disponible</div>
            )}
          </div>
        </div>
      )}

      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  )
}

interface DateRangeFilterProps<TData, TValue> {
  column: Column<TData, TValue>
}

export function DateRangeFilter<TData, TValue>({ column }: DateRangeFilterProps<TData, TValue>) {
  const columnFilterValue = column.getFilterValue() as { from?: string; to?: string } | undefined
  const [isOpen, setIsOpen] = useState(false)
  const [fromDate, setFromDate] = useState(columnFilterValue?.from || '')
  const [toDate, setToDate] = useState(columnFilterValue?.to || '')

  const applyFilter = () => {
    const filter = {
      ...(fromDate && { from: fromDate }),
      ...(toDate && { to: toDate })
    }

    if (Object.keys(filter).length === 0) {
      column.setFilterValue(undefined)
    } else {
      column.setFilterValue(filter)
    }
    setIsOpen(false)
  }

  const clearFilter = () => {
    setFromDate('')
    setToDate('')
    column.setFilterValue(undefined)
    setIsOpen(false)
  }

  const getDisplayText = () => {
    if (!columnFilterValue) return 'Toutes dates'

    const { from, to } = columnFilterValue
    if (from && to) {
      return `${dayjs(from).format('DD/MM')} - ${dayjs(to).format('DD/MM')}`
    } else if (from) {
      return `Depuis ${dayjs(from).format('DD/MM')}`
    } else if (to) {
      return `Jusqu'à ${dayjs(to).format('DD/MM')}`
    }
    return 'Toutes dates'
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-32 border shadow rounded px-2 py-1 text-xs text-left bg-white hover:bg-gray-50 flex items-center justify-between"
      >
        <span className="truncate">{getDisplayText()}</span>
        <span className="text-gray-400">▼</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-60 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="p-3">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date de début</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date de fin</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-200">
                <button
                  onClick={applyFilter}
                  className="flex-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Appliquer
                </button>
                <button
                  onClick={clearFilter}
                  className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Effacer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  )
}
