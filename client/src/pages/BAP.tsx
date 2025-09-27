import React from 'react'
import { BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { BAP } from '@/types'
import ManagementPage from '@/components/common/ManagementPage'
import BAPTable from '@/components/tables/BAPTable'
import BAPModal from '@/components/forms/BAPModal'

const BAPPage: React.FC = () => {
  return (
    <ManagementPage<BAP>
      config={{
        entityName: "bap",
        entityDisplayName: "BAP",
        entityPluralName: "baps",
        apiEndpoint: "/bap",
        icon: BuildingOfficeIcon,
        hasStats: true
      }}
      TableComponent={BAPTable}
      ModalComponent={BAPModal}
    />
  )
}

export default BAPPage