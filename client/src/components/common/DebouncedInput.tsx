import React, { useState, useEffect, useRef } from 'react'

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
  const isFirstRender = useRef(true)

  // Sync seulement au premier render ou si c'est un clear explicite
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    
    // Sync seulement si le parent nous envoie explicitement une string vide (clear button)
    if (initialValue === '' && value !== '') {
      setValue('')
    }
  }, [initialValue, value])

  // Debounce l'appel au parent
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