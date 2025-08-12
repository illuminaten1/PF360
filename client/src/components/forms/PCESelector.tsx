import React from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/utils/api'
import { PCE } from '@/types'

interface PCESelectorProps {
  value?: string
  onChange: (pceId: string | undefined) => void
  disabled?: boolean
  required?: boolean
  className?: string
  placeholder?: string
}

const PCESelector: React.FC<PCESelectorProps> = ({
  value,
  onChange,
  disabled = false,
  required = false,
  className = '',
  placeholder = 'Sélectionner un PCE'
}) => {
  const { data: pceOptions = [], isLoading } = useQuery({
    queryKey: ['pce-options'],
    queryFn: async () => {
      const response = await api.get('/pce/options')
      return response.data as PCE[]
    }
  })

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value
    onChange(selectedValue === '' ? undefined : selectedValue)
  }

  return (
    <select
      value={value || ''}
      onChange={handleChange}
      disabled={disabled || isLoading}
      required={required}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${className}`}
    >
      <option value="">{isLoading ? 'Chargement...' : placeholder}</option>
      {pceOptions.map((pce) => (
        <option key={pce.id} value={pce.id}>
          {pce.ordre.toString().padStart(2, '0')}. {pce.pceDetaille} - {pce.codeMarchandise}
        </option>
      ))}
    </select>
  )
}

export default PCESelector