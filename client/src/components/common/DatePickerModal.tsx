import React, { useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'

dayjs.locale('fr')

interface DatePickerModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (date: string | null) => void
  currentDate: string | null
  title: string
  field: string
}

const DatePickerModal: React.FC<DatePickerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentDate,
  title,
  field
}) => {
  const [selectedDate, setSelectedDate] = useState('')

  useEffect(() => {
    if (isOpen) {
      setSelectedDate(currentDate ? dayjs(currentDate).format('YYYY-MM-DD') : '')
    }
  }, [isOpen, currentDate])

  const handleConfirm = () => {
    onConfirm(selectedDate || null)
    onClose()
  }

  const handleCancel = () => {
    onClose()
  }

  const handleClear = () => {
    setSelectedDate('')
  }

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex items-center">
                    <CalendarDaysIcon className="h-5 w-5 mr-2 text-blue-600" />
                    {title}
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field}
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  />
                  {currentDate && (
                    <p className="mt-2 text-xs text-gray-500">
                      Actuellement : {dayjs(currentDate).format('DD/MM/YYYY')}
                    </p>
                  )}
                </div>

                <div className="flex justify-between space-x-3">
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    Effacer
                  </button>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                    >
                      Valider
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default DatePickerModal