import { useState, useEffect, useRef, useCallback } from 'react'
import { UseMutationResult } from '@tanstack/react-query'

interface UseNotesAutoSaveProps {
  initialNotes: string
  saveNotesMutation: UseMutationResult<any, any, string, unknown>
}

export const useNotesAutoSave = ({ initialNotes, saveNotesMutation }: UseNotesAutoSaveProps) => {
  const [notes, setNotes] = useState(initialNotes)
  const [isSavingNotes, setIsSavingNotes] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const notesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Update notes when initial notes change
  useEffect(() => {
    setNotes(initialNotes)
  }, [initialNotes])

  // Auto-save notes with debounce
  const debouncedSaveNotes = useCallback((newNotes: string) => {
    if (notesTimeoutRef.current) {
      clearTimeout(notesTimeoutRef.current)
    }

    notesTimeoutRef.current = setTimeout(() => {
      if (newNotes !== initialNotes) {
        setIsSavingNotes(true)
        saveNotesMutation.mutate(newNotes, {
          onSuccess: () => {
            setLastSavedAt(new Date())
            setIsSavingNotes(false)
          },
          onError: () => {
            setIsSavingNotes(false)
          }
        })
      }
    }, 2000)
  }, [initialNotes, saveNotesMutation])

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value
    setNotes(newNotes)
    debouncedSaveNotes(newNotes)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (notesTimeoutRef.current) {
        clearTimeout(notesTimeoutRef.current)
      }
    }
  }, [])

  return {
    notes,
    isSavingNotes,
    lastSavedAt,
    handleNotesChange,
  }
}
