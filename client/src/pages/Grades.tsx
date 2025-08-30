import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { PlusIcon, ChevronDoubleUpIcon } from '@heroicons/react/24/outline'
import { Grade } from '@/types'
import api from '@/utils/api'
import GradesTable from '@/components/tables/GradesTable'
import DraggableGradesTable from '@/components/tables/DraggableGradesTable'
import GradeModal from '@/components/forms/GradeModal'


const GradesPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null)
  const [useDraggableTable, setUseDraggableTable] = useState(false)

  const queryClient = useQueryClient()

  const { data: gradeData, isLoading } = useQuery({
    queryKey: ['grades-all'],
    queryFn: async () => {
      const response = await api.get('/grades')
      return response.data
    }
  })

  const { data: stats } = useQuery({
    queryKey: ['grades-stats'],
    queryFn: async () => {
      const response = await api.get('/grades/stats')
      return response.data
    }
  })

  const createGradeMutation = useMutation({
    mutationFn: async (gradeData: Partial<Grade>) => {
      const response = await api.post('/grades', gradeData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades-all'] })
      queryClient.invalidateQueries({ queryKey: ['grades-stats'] })
      setIsModalOpen(false)
      setSelectedGrade(null)
      toast.success('Grade créé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création du grade')
    }
  })

  const updateGradeMutation = useMutation({
    mutationFn: async ({ id, ...gradeData }: Partial<Grade> & { id: string }) => {
      const response = await api.put(`/grades/${id}`, gradeData)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades-all'] })
      queryClient.invalidateQueries({ queryKey: ['grades-stats'] })
      setIsModalOpen(false)
      setSelectedGrade(null)
      toast.success('Grade modifié avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification du grade')
    }
  })

  const deleteGradeMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/grades/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades-all'] })
      queryClient.invalidateQueries({ queryKey: ['grades-stats'] })
      toast.success('Grade supprimé avec succès')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression du grade')
    }
  })

  const reorderGradeMutation = useMutation({
    mutationFn: async (gradesList: Grade[]) => {
      const response = await api.put('/grades/reorder', { gradesList })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades-all'] })
      toast.success('Ordre des grades mis à jour')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Erreur lors de la réorganisation')
    }
  })

  const handleCreateGrade = () => {
    setSelectedGrade(null)
    setIsModalOpen(true)
  }

  const handleEditGrade = (grade: Grade) => {
    setSelectedGrade(grade)
    setIsModalOpen(true)
  }

  const handleDeleteGrade = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce grade ? Cette action est irréversible.')) {
      deleteGradeMutation.mutate(id)
    }
  }

  const handleSubmit = (gradeData: Partial<Grade>) => {
    if (selectedGrade) {
      updateGradeMutation.mutate({ ...gradeData, id: selectedGrade.id })
    } else {
      createGradeMutation.mutate(gradeData)
    }
  }

  const handleReorder = (newOrder: Grade[]) => {
    reorderGradeMutation.mutate(newOrder)
  }

  const gradeList = gradeData || []

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ChevronDoubleUpIcon className="w-7 h-7 mr-3 text-indigo-600" />
            Gestion des grades
          </h1>
          <p className="text-gray-600 mt-1">Gérez les grades militaires et leur ordre</p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={useDraggableTable}
              onChange={(e) => setUseDraggableTable(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">Mode réorganisation</span>
          </label>
          <button
            onClick={handleCreateGrade}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Nouveau grade</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100">
              <ChevronDoubleUpIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Grades</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.totalGrades || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {useDraggableTable ? (
        <DraggableGradesTable
          data={gradeList}
          loading={isLoading}
          onEdit={handleEditGrade}
          onDelete={handleDeleteGrade}
          onReorder={handleReorder}
        />
      ) : (
        <GradesTable
          data={gradeList}
          loading={isLoading}
          onEdit={handleEditGrade}
          onDelete={handleDeleteGrade}
        />
      )}

      {isModalOpen && (
        <GradeModal
          grade={selectedGrade}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedGrade(null)
          }}
          onSubmit={handleSubmit}
          isSubmitting={createGradeMutation.isPending || updateGradeMutation.isPending}
        />
      )}
    </div>
  )
}

export default GradesPage