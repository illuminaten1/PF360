import React, { useState, useEffect } from 'react'

interface DebouncedInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  debounce?: number
}

const DebouncedInput: React.FC<DebouncedInputProps> = ({
  value: initialValue,
  onChange,
  placeholder,
  className,
  debounce = 500
}) => {
  const [value, setValue] = useState(initialValue)

  // Sync avec la prop SEULEMENT si elle est différente et vient de l'extérieur (ex: clear)
  useEffect(() => {
    if (initialValue !== value) {
      setValue(initialValue)
    }
  }, [initialValue, value])

  // Debounce l'appel au callback parent
  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
  }, [value, onChange, debounce])

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  )
}

export default DebouncedInput