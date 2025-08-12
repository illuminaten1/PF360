import React, { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  PencilIcon, 
  DocumentTextIcon,
  TrashIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'
import { PCE } from '@/types'

interface DraggablePCETableProps {
  data: PCE[]
  loading?: boolean
  onEdit: (pce: PCE) => void
  onDelete: (id: string) => void
  onReorder: (newOrder: PCE[]) => void
}

interface SortableRowProps {
  pce: PCE
  onEdit: (pce: PCE) => void
  onDelete: (id: string) => void
}

const SortableRow: React.FC<SortableRowProps> = ({ pce, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: pce.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-gray-50 ${isDragging ? 'opacity-50' : ''}`}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <button
            {...attributes}
            {...listeners}
            className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing mr-3"
            title="Glisser pour réorganiser"
          >
            <Bars3Icon className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-gray-900 bg-blue-100 px-2 py-1 rounded">
            {pce.ordre}
          </span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <DocumentTextIcon className="w-5 h-5 text-green-600" />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {pce.pceDetaille}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900 font-mono">
          {pce.pceNumerique}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
          {pce.codeMarchandise}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {pce.createdAt ? new Date(pce.createdAt).toLocaleDateString('fr-FR') : '-'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => onEdit(pce)}
            className="p-1 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
            title="Modifier"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(pce.id)}
            className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
            title="Supprimer"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}

const DraggablePCETable: React.FC<DraggablePCETableProps> = ({
  data,
  loading = false,
  onEdit,
  onDelete,
  onReorder
}) => {
  const [items, setItems] = useState(data)
  
  // Synchroniser les données avec les props
  React.useEffect(() => {
    setItems(data)
  }, [data])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)
      
      const newItems = arrayMove(items, oldIndex, newIndex)
      
      // Mettre à jour les ordres
      const reorderedItems = newItems.map((item, index) => ({
        ...item,
        ordre: index + 1
      }))
      
      setItems(reorderedItems)
      onReorder(reorderedItems)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded-t-lg mb-4"></div>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 mb-2 mx-4"></div>
          ))}
        </div>
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">Aucun PCE trouvé</p>
      </div>
    )
  }

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Liste des PCE
            </h3>
            <p className="text-sm text-gray-500">
              Glissez-déposez les lignes pour réorganiser l'ordre
            </p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ordre
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PCE détaillé
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PCE numérique
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code marchandise
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Créé le
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((pce) => (
                  <SortableRow
                    key={pce.id}
                    pce={pce}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </tbody>
            </SortableContext>
          </table>
        </div>
      </div>
    </DndContext>
  )
}

export default DraggablePCETable