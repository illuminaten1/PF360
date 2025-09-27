import React, { useState } from 'react'
import { DocumentTextIcon } from '@heroicons/react/24/outline'
import { PCE } from '@/types'
import ManagementPage from '@/components/common/ManagementPage'
import PCETable from '@/components/tables/PCETable'
import DraggablePCETable from '@/components/tables/DraggablePCETable'
import PCEModal from '@/components/forms/PCEModal'

const PCEPage: React.FC = () => {
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

  const TableComponent = useDraggableTable ? DraggablePCETable : PCETable

  return (
    <ManagementPage<PCE>
      config={{
        entityName: "pce",
        entityDisplayName: "PCE",
        entityPluralName: "pce",
        apiEndpoint: "/pce",
        icon: DocumentTextIcon,
        hasStats: true,
        hasReorder: true
      }}
      TableComponent={TableComponent}
      ModalComponent={PCEModal}
      customButtons={reorderToggleButton}
    />
  )
}

export default PCEPage