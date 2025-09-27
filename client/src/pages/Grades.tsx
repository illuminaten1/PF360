import React, { useState } from 'react'
import { ChevronDoubleUpIcon } from '@heroicons/react/24/outline'
import { Grade } from '@/types'
import ManagementPage from '@/components/common/ManagementPage'
import GradesTable from '@/components/tables/GradesTable'
import DraggableGradesTable from '@/components/tables/DraggableGradesTable'
import GradeModal from '@/components/forms/GradeModal'

const GradesPage: React.FC = () => {
  const [useDraggableTable, setUseDraggableTable] = useState(false)

  const reorderToggleButton = (
    <label className="flex items-center">
      <input
        type="checkbox"
        checked={useDraggableTable}
        onChange={(e) => setUseDraggableTable(e.target.checked)}
        className="mr-2"
      />
      <span className="text-sm text-gray-600">Mode réorganisation</span>
    </label>
  )

  const TableComponent = useDraggableTable ? DraggableGradesTable : GradesTable

  return (
    <ManagementPage<Grade>
      config={{
        entityName: "grade",
        entityDisplayName: "Grade",
        entityPluralName: "grades",
        apiEndpoint: "/grades",
        icon: ChevronDoubleUpIcon,
        hasStats: true,
        hasReorder: true
      }}
      TableComponent={TableComponent}
      ModalComponent={GradeModal}
      customButtons={reorderToggleButton}
    />
  )
}

export default GradesPage