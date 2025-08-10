import React, { useState, useEffect } from 'react'
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  itemName: string
  itemIdentifier: string
  itemType?: string
  title?: string
  message?: string
  confirmButtonText?: string
  isLoading?: boolean
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemIdentifier,
  itemType = 'élément',
  title,
  message,
  confirmButtonText = 'Supprimer définitivement',
  isLoading = false
}) => {
  const [inputValue, setInputValue] = useState('')
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setInputValue('')
      setIsValid(false)
    }
  }, [isOpen])

  useEffect(() => {
    setIsValid(inputValue === itemIdentifier)
  }, [inputValue, itemIdentifier])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isValid && !isLoading) {
      onConfirm()
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
            <button
              type="button"
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleClose}
              disabled={isLoading}
            >
              <span className="sr-only">Fermer</span>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                {title || `Supprimer ${itemType}`}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {message || `Cette action supprimera définitivement ${itemType} "${itemName}". Cette action ne peut pas être annulée.`}
                </p>
                
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Pour confirmer la suppression, veuillez saisir le numéro :
                  </p>
                  <p className="text-base font-mono font-bold text-red-600 mb-3 p-2 bg-red-50 rounded border">
                    {itemIdentifier}
                  </p>
                  
                  <form onSubmit={handleSubmit}>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={handleInputChange}
                      onPaste={handlePaste}
                      onContextMenu={handleContextMenu}
                      placeholder="Saisissez le numéro ici"
                      className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 font-mono ${
                        inputValue && !isValid
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : isValid
                          ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                          : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      disabled={isLoading}
                      autoComplete="off"
                      spellCheck={false}
                    />
                    {inputValue && !isValid && (
                      <p className="mt-1 text-xs text-red-600">
                        Le numéro saisi ne correspond pas
                      </p>
                    )}
                    {isValid && (
                      <p className="mt-1 text-xs text-green-600">
                        ✓ Numéro confirmé
                      </p>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto min-w-[120px] ${
                isValid && !isLoading
                  ? 'bg-red-600 hover:bg-red-500 focus:ring-red-500'
                  : 'bg-gray-400 cursor-not-allowed'
              } focus:outline-none focus:ring-2 focus:ring-offset-2`}
              onClick={onConfirm}
              disabled={!isValid || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Suppression...
                </div>
              ) : (
                confirmButtonText
              )}
            </button>
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleClose}
              disabled={isLoading}
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmationModal