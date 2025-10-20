import React from 'react'
import { BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { SGAMI } from '@/types'
import ManagementPage from '@/components/common/ManagementPage'
import SGAMITable from '@/components/tables/SGAMITable'
import SGAMIModal from '@/components/forms/SGAMIModal'

const SGAMIPage: React.FC = () => {
  return (
    <ManagementPage<SGAMI>
      config={{
        entityName: "sgami",
        entityDisplayName: "SGAMI",
        entityPluralName: "organismes payeurs",
        apiEndpoint: "/sgami",
        icon: BuildingOfficeIcon,
        hasStats: true
      }}
      TableComponent={SGAMITable}
      ModalComponent={SGAMIModal}
    />
  )
}

export default SGAMIPage