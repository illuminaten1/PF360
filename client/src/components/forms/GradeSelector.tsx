import React from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/utils/api'
import { Grade } from '@/types'

interface GradeSelectorProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
  required?: boolean
  className?: string
  placeholder?: string
}

const GradeSelector: React.FC<GradeSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  required = false,
  className = "input w-full",
  placeholder = "-- Sélectionner un grade --"
}) => {
  const { data: grades, isLoading } = useQuery({
    queryKey: ['grades-options'],
    queryFn: async () => {
      const response = await api.get('/grades/options')
      return response.data as Grade[]
    }
  })

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      disabled={disabled || isLoading}
      required={required}
    >
      <option value="">{isLoading ? 'Chargement...' : placeholder}</option>
      {grades?.map((grade) => (
        <option key={grade.id} value={grade.gradeComplet}>
          {grade.gradeComplet}
        </option>
      ))}
    </select>
  )
}

export default GradeSelector