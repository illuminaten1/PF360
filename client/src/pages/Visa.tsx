import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { EyeIcon } from '@heroicons/react/24/outline'
import { Visa } from '@/types'
import api from '@/utils/api'
import VisaTable from '@/components/tables/VisaTable'
import VisaModal from '@/components/forms/VisaModal'


const VisaPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedVisa, setSelectedVisa] = useState<Visa | null>(null)

  const queryClient = useQueryClient()

  const { data: visaData, isLoading } = useQuery({
    queryKey: ['visa-all'],
    queryFn: async () => {
      const response = await api.get('/visa')
      return response.data
    }
  })

  const { data: stats } = useQuery({
    queryKey: ['visa-stats'],
    queryFn: async () => {
      const response = await api.get('/visa/stats')
      return response.data
    }
  })


  const updateVisaMutation = useMutation({
    mutationFn: async ({ id, ...visaData }: Partial<Visa> & { id: string }) => {
      const response = await api.put(`/visa/${id}`, visaData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visa-all'] })
      queryClient.invalidateQueries({ queryKey: ['visa-stats'] })
      setIsModalOpen(false)
      setSelectedVisa(null)
      toast.success('Visa modifié avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la modification du visa')
    }
  })



  const handleEditVisa = (visa: Visa) => {
    setSelectedVisa(visa)
    setIsModalOpen(true)
  }


  const handleSubmit = (visaData: Partial<Visa>) => {
    if (selectedVisa) {
      updateVisaMutation.mutate({ ...visaData, id: selectedVisa.id })
    }
  }

  const visaList = visaData || []

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <EyeIcon className="w-7 h-7 mr-3 text-blue-600" />
            Gestion des Visas
          </h1>
          <p className="text-gray-600 mt-1">Modifiez le texte des visas CIVIL et MILITAIRE</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <EyeIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Visas</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalVisas}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <EyeIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Visas Actifs</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.visasActifs}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <VisaTable
        data={visaList}
        loading={isLoading}
        onEdit={handleEditVisa}
      />

      {isModalOpen && (
        <VisaModal
          visa={selectedVisa}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedVisa(null)
          }}
          onSubmit={handleSubmit}
          isSubmitting={updateVisaMutation.isPending}
        />
      )}
    </div>
  )
}

export default VisaPage