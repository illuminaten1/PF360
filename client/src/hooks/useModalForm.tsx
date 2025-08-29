import React, { useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { z } from 'zod'

interface UseModalFormOptions<T extends z.ZodType> {
  schema: T
  isOpen: boolean
  initialData?: any
  onSubmit: (data: z.infer<T>) => void | Promise<void>
  defaultValues?: z.infer<T>
}

/**
 * Hook personnalisé pour gérer les formulaires dans les modaux avec TanStack Form et Zod
 * Simplifie la gestion d'état, la validation et la réinitialisation des formulaires modaux
 */
export function useModalForm<T extends z.ZodType>({
  schema,
  isOpen,
  initialData,
  onSubmit,
  defaultValues
}: UseModalFormOptions<T>) {
  const form = useForm({
    defaultValues: defaultValues || {},
    validatorAdapter: zodValidator,
    validators: {
      onChange: schema
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    }
  })

  // Réinitialise le formulaire quand le modal s'ouvre/ferme
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Mode édition : charge les données existantes
        form.reset(initialData)
      } else {
        // Mode création : utilise les valeurs par défaut
        form.reset(defaultValues || {})
      }
    }
  }, [isOpen, initialData, defaultValues, form])

  return {
    form,
    // Fonctions utilitaires pour simplifier l'usage
    handleSubmit: (e: React.FormEvent) => {
      e.preventDefault()
      e.stopPropagation()
      form.handleSubmit()
    },
    isValid: form.state.isValid,
    isDirty: form.state.isDirty,
    isSubmitting: form.state.isSubmitting,
    canSubmit: form.state.canSubmit,
    errors: form.state.errors,
    setValue: form.setFieldValue,
    getValue: form.getFieldValue,
    reset: form.reset
  }
}

/**
 * Helper pour créer des champs de formulaire avec gestion d'erreur automatique
 */
export function createFieldRenderer<T>(
  form: any,
  fieldName: keyof T,
  renderField: (field: any) => React.ReactNode
): React.ReactNode {
  // Cette fonction retourne un élément JSX directement plutôt que dans une fonction
  // Elle doit être utilisée dans un contexte JSX
  throw new Error('createFieldRenderer should be used differently - see examples')
}

/**
 * Helper pour créer un input standard avec styles cohérents
 */
export function createStandardInput(field: any, props: any = {}) {
  const hasError = field.state.meta.errors.length > 0
  
  return (
    <input
      name={field.name}
      value={field.state.value || ''}
      onBlur={field.handleBlur}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.handleChange(e.target.value)}
      className={`block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all ${
        hasError ? 'border-red-300' : 'border-gray-200'
      }`}
      {...props}
    />
  )
}

/**
 * Helper pour créer un select/dropdown standard
 */
export function createStandardSelect(field: any, options: { value: string, label: string }[], props: any = {}) {
  const hasError = field.state.meta.errors.length > 0
  
  return (
    <select
      name={field.name}
      value={field.state.value || ''}
      onBlur={field.handleBlur}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => field.handleChange(e.target.value)}
      className={`block w-full h-12 px-4 rounded-lg border-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:ring-opacity-50 text-gray-900 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all ${
        hasError ? 'border-red-300' : 'border-gray-200'
      }`}
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
  options: { value: T, label: string, style?: string }[]
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
          } ${option.style || ''}`}
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