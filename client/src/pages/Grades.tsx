import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import GradesTable from '../components/tables/GradesTable'
import DraggableGradesTable from '../components/tables/DraggableGradesTable'
import GradeModal from '../components/forms/GradeModal'
import { Grade } from '@/types'
import { 
  PlusIcon, 
  UserIcon,
  ArrowsUpDownIcon,
  TableCellsIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface GradeStats {
  totalGrades: number
}

const GradesPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null)
  const [useDraggableTable, setUseDraggableTable] = useState(false)

  const queryClient = useQueryClient()

  // Queries
  const { data: grades = [], isLoading } = useQuery({
    queryKey: ['grades'],
    queryFn: async () => {
      const response = await fetch('/api/grades')
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des grades')
      }
      return response.json()
    }
  })

  const { data: stats } = useQuery<GradeStats>({
    queryKey: ['grades-stats'],
    queryFn: async () => {
      const response = await fetch('/api/grades/stats')
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des statistiques')
      }
      return response.json()
    }
  })

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (gradeData: Partial<Grade>) => {
      const response = await fetch('/api/grades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gradeData)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la création')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] })
      queryClient.invalidateQueries({ queryKey: ['grades-stats'] })
      setIsModalOpen(false)
      setSelectedGrade(null)
      toast.success('Grade créé avec succès')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...gradeData }: Partial<Grade> & { id: string }) => {
      const response = await fetch(`/api/grades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gradeData)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la modification')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] })
      setIsModalOpen(false)
      setSelectedGrade(null)
      toast.success('Grade modifié avec succès')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/grades/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la suppression')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] })
      queryClient.invalidateQueries({ queryKey: ['grades-stats'] })
      toast.success('Grade supprimé avec succès')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const reorderMutation = useMutation({
    mutationFn: async (gradesList: Grade[]) => {
      const response = await fetch('/api/grades/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gradesList })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la réorganisation')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] })
      toast.success('Ordre des grades mis à jour')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })

  const handleSubmit = (gradeData: Partial<Grade>) => {
    if (selectedGrade) {
      updateMutation.mutate({ ...gradeData, id: selectedGrade.id })
    } else {
      createMutation.mutate(gradeData)
    }
  }

  const handleEdit = (grade: Grade) => {
    setSelectedGrade(grade)
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce grade ?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleReorder = (newOrder: Grade[]) => {
    reorderMutation.mutate(newOrder)
  }

  const openCreateModal = () => {
    setSelectedGrade(null)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des grades</h1>
          <p className="mt-2 text-sm text-gray-700">
            Gérez les grades et leur ordre d'apparition dans l'application
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Nouveau grade
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total des grades
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.totalGrades || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Controls */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Mode d'affichage
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>Choisissez le mode d'affichage des grades.</p>
              </div>
            </div>
            <div className="mt-5 sm:mt-0 sm:ml-6 sm:flex-shrink-0 sm:flex sm:items-center">
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setUseDraggableTable(false)}
                  className={`relative inline-flex items-center px-4 py-2 rounded-l-md border text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    !useDraggableTable
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <TableCellsIcon className="h-4 w-4 mr-2" />
                  Tableau
                </button>
                <button
                  onClick={() => setUseDraggableTable(true)}
                  className={`relative -ml-px inline-flex items-center px-4 py-2 rounded-r-md border text-sm font-medium focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    useDraggableTable
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ArrowsUpDownIcon className="h-4 w-4 mr-2" />
                  Réorganiser
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      {useDraggableTable ? (
        <DraggableGradesTable
          data={grades}
          loading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReorder={handleReorder}
        />
      ) : (
        <GradesTable
          data={grades}
          loading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Modal */}
      <GradeModal
        grade={selectedGrade}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedGrade(null)
        }}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  )
}

export default GradesPage