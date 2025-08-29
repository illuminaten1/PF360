import React, { useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'

interface UseModalFormOptions<T> {
  schema: z.ZodType<T>
  isOpen: boolean
  initialData?: any
  onSubmit: (data: T) => void | Promise<void>
  defaultValues: T
}

/**
 * Hook personnalisé pour gérer les formulaires dans les modaux avec TanStack Form et Zod
 * Version simplifiée sans validation adapter pour éviter les problèmes de compatibilité
 */
export function useModalForm<T>({
  schema,
  isOpen,
  initialData,
  onSubmit,
  defaultValues
}: UseModalFormOptions<T>) {
  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      // Validation manuelle avec Zod
      const result = schema.safeParse(value)
      if (!result.success) {
        // On pourrait gérer les erreurs ici
        console.error('Validation errors:', result.error)
        return
      }
      await onSubmit(result.data)
    }
  })

  // Réinitialise le formulaire quand le modal s'ouvre/ferme
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset(initialData)
      } else {
        form.reset(defaultValues)
      }
    }
  }, [isOpen, initialData, defaultValues, form])

  return {
    form,
    handleSubmit: (e: React.FormEvent) => {
      e.preventDefault()
      e.stopPropagation()
      form.handleSubmit()
    },
    isSubmitting: form.state.isSubmitting,
    canSubmit: form.state.canSubmit,
    setValue: form.setFieldValue,
    getValue: form.getFieldValue,
    reset: form.reset,
    validate: (data: any) => {
      const result = schema.safeParse(data)
      return result.success ? null : result.error.issues
    }
  }
}

/**
 * Helper pour créer un input standard avec styles cohérents
 */
export function createStandardInput(field: any, props: any = {}) {
  return (
    <input
      name={field.name}
      value={field.state.value || ''}
      onBlur={field.handleBlur}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)}
      className="block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all border-gray-200"
      {...props}
    />
  )
}

/**
 * Helper pour créer un select/dropdown standard
 */
export function createStandardSelect(field: any, options: { value: string, label: string }[], props: any = {}) {
  return (
    <select
      name={field.name}
      value={field.state.value || ''}
      onBlur={field.handleBlur}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => field.handleChange(e.target.value)}
      className="block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all border-gray-200"
      {...props}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

/**
 * Hook pour gérer les boutons radio avec styles cohérents
 */
export function useRadioButtons<T extends string>(
  field: any,
  options: { value: T, label: string }[]
) {
  const renderButtons = () => (
    <div className="grid grid-cols-2 gap-3">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => field.handleChange(option.value)}
          className={`rounded-lg border-2 p-4 text-center transition-all h-16 flex items-center justify-center shadow-sm bg-gradient-to-br ${
            field.state.value === option.value
              ? 'border-blue-500 from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200'
              : 'border-gray-200 from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200'
          }`}
        >
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
            {option.label}
          </span>
        </button>
      ))}
    </div>
  )

  return { renderButtons }
}

export default useModalForm